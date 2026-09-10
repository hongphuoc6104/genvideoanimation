/**
 * packages/narration-kit/src/audio/mixAudio.ts
 * Multi-track audio mixer with smooth attack/release dynamic ducking.
 */

import * as fs from 'node:fs';
import { parseWavHeader, createWavFile } from '../tts/wav';
import { AudioTrackSpec, DuckingConfig, DuckingRegion } from './types';
import { computeLoudnessStats } from './normalizeLoudness';

export interface MixOptions {
  narrationTrack?: AudioTrackSpec;
  musicTrack?: AudioTrackSpec;
  sfxTracks?: AudioTrackSpec[];
  outputPath: string;
  duckingConfig?: DuckingConfig;
  targetDurationSec?: number;
}

export function readWavToFloat32(filePath: string): { samples: Float32Array; sampleRate: number } {
  const buf = fs.readFileSync(filePath);
  const header = parseWavHeader(buf);
  const dataOffset = 44;
  const pcm16 = new Int16Array(buf.buffer, buf.byteOffset + dataOffset, (buf.length - dataOffset) / 2);
  const f32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    f32[i] = pcm16[i] / 32768.0;
  }
  return { samples: f32, sampleRate: header.sampleRate };
}

export function generateDuckingEnvelope(
  totalSamples: number,
  sampleRate: number,
  narrationRegions: Array<{ startSec: number; endSec: number }>,
  config: DuckingConfig
): Float32Array {
  const envelope = new Float32Array(totalSamples);
  envelope.fill(1.0); // Default full volume for music

  const duckedGainLinear = Math.pow(10, config.duckingDepthDb / 20); // e.g. -12.8 dB -> ~0.229
  const attackSamples = Math.max(1, Math.round((config.attackMs / 1000) * sampleRate));
  const releaseSamples = Math.max(1, Math.round((config.releaseMs / 1000) * sampleRate));

  for (const region of narrationRegions) {
    const startSample = Math.max(0, Math.floor(region.startSec * sampleRate));
    const endSample = Math.min(totalSamples, Math.ceil(region.endSec * sampleRate));

    // Attack ramp: from 1.0 down to duckedGainLinear
    const rampStart = Math.max(0, startSample - attackSamples);
    for (let i = rampStart; i < startSample; i++) {
      const p = (i - rampStart) / attackSamples;
      const gain = 1.0 - p * (1.0 - duckedGainLinear);
      if (gain < envelope[i]) envelope[i] = gain;
    }

    // Sustained ducked region
    for (let i = startSample; i < endSample; i++) {
      envelope[i] = Math.min(envelope[i], duckedGainLinear);
    }

    // Release ramp: from duckedGainLinear up to 1.0
    const rampEnd = Math.min(totalSamples, endSample + releaseSamples);
    for (let i = endSample; i < rampEnd; i++) {
      const p = (i - endSample) / releaseSamples;
      const gain = duckedGainLinear + p * (1.0 - duckedGainLinear);
      if (gain < envelope[i]) envelope[i] = gain;
    }
  }

  return envelope;
}

export function mixAudioTracks(options: MixOptions): {
  durationSec: number;
  peakDbfs: number;
  duckingRegions: DuckingRegion[];
} {
  const sampleRate = 24000;
  let maxDurationSec = options.targetDurationSec || 0;

  let narrationData: Float32Array | null = null;
  const narrationRegions: Array<{ startSec: number; endSec: number }> = [];

  if (options.narrationTrack && fs.existsSync(options.narrationTrack.filePath)) {
    const { samples, sampleRate: sr } = readWavToFloat32(options.narrationTrack.filePath);
    narrationData = samples;
    const dur = samples.length / sr;
    if (dur > maxDurationSec) maxDurationSec = dur;

    // Detect non-silent narration regions (RMS > -40 dBFS)
    const windowSize = Math.round(0.05 * sr); // 50ms windows
    let inSpeech = false;
    let speechStart = 0;

    for (let w = 0; w < samples.length; w += windowSize) {
      const chunk = samples.subarray(w, Math.min(samples.length, w + windowSize));
      let sumSq = 0;
      for (let j = 0; j < chunk.length; j++) sumSq += chunk[j] * chunk[j];
      const rms = Math.sqrt(sumSq / chunk.length);
      const isVoice = rms > 0.005;

      const currTime = w / sr;
      if (isVoice && !inSpeech) {
        inSpeech = true;
        speechStart = currTime;
      } else if (!isVoice && inSpeech) {
        inSpeech = false;
        narrationRegions.push({ startSec: speechStart, endSec: currTime });
      }
    }
    if (inSpeech) {
      narrationRegions.push({ startSec: speechStart, endSec: dur });
    }
  }

  if (maxDurationSec <= 0) {
    maxDurationSec = 5.0; // fallback
  }

  const totalSamples = Math.ceil(maxDurationSec * sampleRate);
  const mixBuffer = new Float32Array(totalSamples);

  // 1. Add Narration (Priority track)
  if (narrationData) {
    const vol = options.narrationTrack?.volume ?? 1.0;
    const count = Math.min(mixBuffer.length, narrationData.length);
    for (let i = 0; i < count; i++) {
      mixBuffer[i] += narrationData[i] * vol;
    }
  }

  // 2. Add Music with Ducking
  const duckingConfig = options.duckingConfig || {
    duckingDepthDb: -12.8,
    attackMs: 100,
    releaseMs: 300,
  };

  const duckingRegions: DuckingRegion[] = narrationRegions.map((r) => ({
    startSec: Math.round(r.startSec * 100) / 100,
    endSec: Math.round(r.endSec * 100) / 100,
    duckedGain: Math.round(Math.pow(10, duckingConfig.duckingDepthDb / 20) * 1000) / 1000,
  }));

  if (options.musicTrack && fs.existsSync(options.musicTrack.filePath)) {
    const { samples: musicSamples } = readWavToFloat32(options.musicTrack.filePath);
    const envelope = generateDuckingEnvelope(totalSamples, sampleRate, narrationRegions, duckingConfig);
    const musicVol = options.musicTrack.volume ?? 0.35;

    for (let i = 0; i < totalSamples; i++) {
      const mIdx = options.musicTrack.loop ? i % musicSamples.length : i;
      if (mIdx < musicSamples.length) {
        mixBuffer[i] += musicSamples[mIdx] * musicVol * envelope[i];
      }
    }
  }

  // 3. Add SFX Tracks
  if (options.sfxTracks && options.sfxTracks.length > 0) {
    for (const sfx of options.sfxTracks) {
      if (!fs.existsSync(sfx.filePath)) continue;
      const { samples: sfxSamples } = readWavToFloat32(sfx.filePath);
      const startSample = Math.round((sfx.startTimeSec || 0) * sampleRate);
      const sfxVol = sfx.volume ?? 0.8;

      for (let j = 0; j < sfxSamples.length; j++) {
        const destIdx = startSample + j;
        if (destIdx >= 0 && destIdx < totalSamples) {
          mixBuffer[destIdx] += sfxSamples[j] * sfxVol;
        }
      }
    }
  }

  // Soft peak limiting to prevent clipping: clamp between -0.99 and +0.99
  for (let i = 0; i < totalSamples; i++) {
    if (mixBuffer[i] > 0.98) mixBuffer[i] = 0.98;
    else if (mixBuffer[i] < -0.98) mixBuffer[i] = -0.98;
  }

  // Write mixed output WAV
  const pcm16 = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    pcm16[i] = Math.round(mixBuffer[i] * 32767);
  }

  const outBuf = createWavFile(
    Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength),
    sampleRate,
    1,
    16
  );

  fs.writeFileSync(options.outputPath, outBuf);
  const stats = computeLoudnessStats(mixBuffer);

  return {
    durationSec: Math.round(maxDurationSec * 100) / 100,
    peakDbfs: stats.peakDbfs,
    duckingRegions,
  };
}
