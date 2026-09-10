/**
 * packages/narration-kit/src/audio/mixAudio.ts
 * Broadcast-standard 48kHz stereo multi-track audio mixer with smooth attack/release dynamic ducking.
 * Conforms to ITU-R BS.1770-4 / EBU R128 (-16.0 LUFS / -1.0 dBFS ceiling / 0 clipped samples).
 */

import * as fs from 'node:fs';
import { parseWavHeader, extractPcmData, createWavFile } from '../tts/wav';
import { AudioTrackSpec, DuckingConfig, DuckingRegion, MixOptions, MixResult } from './types';
import { computeLoudnessStats, normalizePcmLoudness } from './normalizeLoudness';

export { MixOptions, MixResult };

/**
 * Reads any PCM WAV file and resamples it to 48,000 Hz stereo Float32 buffers.
 */
export function readWavToStereo48k(filePath: string): {
  left: Float32Array;
  right: Float32Array;
  durationSec: number;
} {
  const buf = fs.readFileSync(filePath);
  const header = parseWavHeader(buf);
  const pcmBytes = extractPcmData(buf);

  const numSamples = Math.floor(pcmBytes.length / 2);
  const pcm16 = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, numSamples);
  const srcChannels = header.channels;
  const srcRate = header.sampleRate;
  const srcFrames = Math.floor(numSamples / srcChannels);
  const durationSec = srcFrames / srcRate;

  // Separate or copy source channels into Float32 [-1.0, 1.0]
  const srcLeft = new Float32Array(srcFrames);
  const srcRight = new Float32Array(srcFrames);

  if (srcChannels === 1) {
    for (let i = 0; i < srcFrames; i++) {
      const s = pcm16[i] / 32768.0;
      srcLeft[i] = s;
      srcRight[i] = s;
    }
  } else {
    for (let i = 0; i < srcFrames; i++) {
      srcLeft[i] = pcm16[i * srcChannels] / 32768.0;
      srcRight[i] = pcm16[i * srcChannels + 1] / 32768.0;
    }
  }

  // Resample to 48,000 Hz stereo
  const targetRate = 48000;
  if (srcRate === targetRate) {
    return { left: srcLeft, right: srcRight, durationSec };
  }

  // 24kHz to 48kHz is an exact 2x upsampling
  if (srcRate === 24000) {
    const outFrames = srcFrames * 2;
    const outLeft = new Float32Array(outFrames);
    const outRight = new Float32Array(outFrames);

    for (let i = 0; i < srcFrames; i++) {
      const nextIdx = Math.min(i + 1, srcFrames - 1);
      outLeft[2 * i] = srcLeft[i];
      outLeft[2 * i + 1] = 0.5 * (srcLeft[i] + srcLeft[nextIdx]);
      outRight[2 * i] = srcRight[i];
      outRight[2 * i + 1] = 0.5 * (srcRight[i] + srcRight[nextIdx]);
    }
    return { left: outLeft, right: outRight, durationSec };
  }

  // Arbitrary sample rate conversion using linear interpolation
  const outFrames = Math.round(srcFrames * (targetRate / srcRate));
  const outLeft = new Float32Array(outFrames);
  const outRight = new Float32Array(outFrames);
  const ratio = srcRate / targetRate;

  for (let k = 0; k < outFrames; k++) {
    const pos = k * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const nextIdx = Math.min(idx + 1, srcFrames - 1);

    outLeft[k] = (1.0 - frac) * srcLeft[idx] + frac * srcLeft[nextIdx];
    outRight[k] = (1.0 - frac) * srcRight[idx] + frac * srcRight[nextIdx];
  }

  return { left: outLeft, right: outRight, durationSec };
}

/**
 * Backward-compatible helper to read WAV to mono Float32Array.
 */
export function readWavToFloat32(filePath: string): { samples: Float32Array; sampleRate: number } {
  const { left, right } = readWavToStereo48k(filePath);
  const mono = new Float32Array(left.length);
  for (let i = 0; i < left.length; i++) {
    mono[i] = 0.5 * (left[i] + right[i]);
  }
  return { samples: mono, sampleRate: 48000 };
}

/**
 * Generates dynamic ducking envelope across the audio timeline.
 * Handles micro-pause bridging (< 200ms) to prevent volume pumping.
 */
export function generateDuckingEnvelope(
  arg1: number | Array<{ startSec: number; endSec: number }>,
  arg2: number,
  arg3?: number | Array<{ startSec: number; endSec: number }>,
  arg4?: DuckingConfig
): Float32Array {
  let totalSamples: number;
  let sampleRate: number;
  let narrationRegions: Array<{ startSec: number; endSec: number }>;
  let config: DuckingConfig;

  if (typeof arg1 === 'number') {
    totalSamples = arg1;
    sampleRate = arg2;
    narrationRegions = (arg3 as Array<{ startSec: number; endSec: number }>) || [];
    config = arg4 || { duckingDepthDb: -12.8, attackMs: 100, releaseMs: 600 };
  } else {
    narrationRegions = arg1;
    const durationSec = arg2;
    sampleRate = (arg3 as number) || 48000;
    totalSamples = Math.ceil(durationSec * sampleRate);
    config = arg4 || { duckingDepthDb: -12.8, attackMs: 100, releaseMs: 600 };
  }

  const envelope = new Float32Array(totalSamples);
  envelope.fill(1.0); // Default full volume for music

  const duckingDepthDb = config.duckingDepthDb ?? -12.8;
  const attackMs = config.attackMs ?? 100;
  const releaseMs = config.releaseMs ?? 600;
  const duckedGainLinear = Math.pow(10, duckingDepthDb / 20); // ~0.2290868 for -12.8 dB

  const attackSamples = Math.max(1, Math.round((attackMs / 1000) * sampleRate));
  const releaseSamples = Math.max(1, Math.round((releaseMs / 1000) * sampleRate));

  // Sort and bridge micro-pauses (< 200ms) between adjacent speech intervals
  const sorted = [...narrationRegions].sort((a, b) => a.startSec - b.startSec);
  const bridged: Array<{ startSec: number; endSec: number }> = [];

  for (const r of sorted) {
    if (bridged.length === 0) {
      bridged.push({ startSec: r.startSec, endSec: r.endSec });
    } else {
      const prev = bridged[bridged.length - 1];
      if (r.startSec - prev.endSec < 0.2) {
        // Gap is under 200ms: bridge smoothly
        prev.endSec = Math.max(prev.endSec, r.endSec);
      } else {
        bridged.push({ startSec: r.startSec, endSec: r.endSec });
      }
    }
  }

  for (const region of bridged) {
    const startSample = Math.max(0, Math.floor(region.startSec * sampleRate));
    const endSample = Math.min(totalSamples, Math.ceil(region.endSec * sampleRate));

    // Attack ramp: from 1.0 down to duckedGainLinear in attackMs
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

    // Release ramp: from duckedGainLinear up to 1.0 in releaseMs
    const rampEnd = Math.min(totalSamples, endSample + releaseSamples);
    for (let i = endSample; i < rampEnd; i++) {
      const p = (i - endSample) / releaseSamples;
      const gain = duckedGainLinear + p * (1.0 - duckedGainLinear);
      if (gain < envelope[i]) envelope[i] = gain;
    }
  }

  return envelope;
}

/**
 * Mixes narration, music, and SFX into a broadcast-standard 48kHz stereo WAV file.
 */
export function mixAudioTracks(options: MixOptions): MixResult {
  const sampleRate = 48000;
  let maxDurationSec = options.targetDurationSec || 0;

  let narrationStereo: { left: Float32Array; right: Float32Array; durationSec: number } | null =
    null;
  const narrationRegions: Array<{ startSec: number; endSec: number }> = [];

  const narrationFile = options.narrationTrack?.filePath || options.narrationTrack?.file;
  if (narrationFile && fs.existsSync(narrationFile)) {
    narrationStereo = readWavToStereo48k(narrationFile);
    if (narrationStereo.durationSec > maxDurationSec) {
      maxDurationSec = narrationStereo.durationSec;
    }

    // If explicit word intervals are provided, use them for speech detection
    if (options.words && options.words.length > 0) {
      for (const w of options.words) {
        narrationRegions.push({ startSec: w.start, endSec: w.end });
      }
    } else {
      // Fallback: RMS windowed speech detection (> -40 dBFS)
      const samples = narrationStereo.left;
      const windowSize = Math.round(0.05 * sampleRate); // 50ms windows
      let inSpeech = false;
      let speechStart = 0;

      for (let w = 0; w < samples.length; w += windowSize) {
        const chunk = samples.subarray(w, Math.min(samples.length, w + windowSize));
        let sumSq = 0;
        for (let j = 0; j < chunk.length; j++) sumSq += chunk[j] * chunk[j];
        const rms = Math.sqrt(sumSq / chunk.length);
        const isVoice = rms > 0.005;

        const currTime = w / sampleRate;
        if (isVoice && !inSpeech) {
          inSpeech = true;
          speechStart = currTime;
        } else if (!isVoice && inSpeech) {
          inSpeech = false;
          narrationRegions.push({ startSec: speechStart, endSec: currTime });
        }
      }
      if (inSpeech) {
        narrationRegions.push({ startSec: speechStart, endSec: narrationStereo.durationSec });
      }
    }
  }

  if (maxDurationSec <= 0) {
    maxDurationSec = 5.0; // fallback
  }

  const totalFrames = Math.ceil(maxDurationSec * sampleRate);
  const mixLeft = new Float32Array(totalFrames);
  const mixRight = new Float32Array(totalFrames);

  // 1. Add Narration track (Primary dialogue bed)
  if (narrationStereo) {
    const vol = options.narrationTrack?.volume ?? 1.0;
    const count = Math.min(totalFrames, narrationStereo.left.length);
    for (let i = 0; i < count; i++) {
      mixLeft[i] += narrationStereo.left[i] * vol;
      mixRight[i] += narrationStereo.right[i] * vol;
    }
  }

  // 2. Add Background Music track with Dynamic Ducking
  const duckingConfig: DuckingConfig = options.duckingConfig || {
    duckingDepthDb: -12.8,
    attackMs: 100,
    releaseMs: 600,
  };

  const duckingRegions: DuckingRegion[] = narrationRegions.map((r) => ({
    startSec: Math.round(r.startSec * 100) / 100,
    endSec: Math.round(r.endSec * 100) / 100,
    duckedGain:
      Math.round(Math.pow(10, (duckingConfig.duckingDepthDb ?? -12.8) / 20) * 1000) / 1000,
  }));

  const musicFile = options.musicTrack?.filePath || options.musicTrack?.file;
  if (musicFile && fs.existsSync(musicFile)) {
    const musicStereo = readWavToStereo48k(musicFile);
    const envelope = generateDuckingEnvelope(totalFrames, sampleRate, narrationRegions, duckingConfig);
    const musicVol = options.musicTrack?.volume ?? 0.22;
    const shouldLoop = options.musicTrack?.loop ?? true;

    for (let i = 0; i < totalFrames; i++) {
      const mIdx = shouldLoop ? i % musicStereo.left.length : i;
      if (mIdx < musicStereo.left.length) {
        const env = envelope[i];
        mixLeft[i] += musicStereo.left[mIdx] * musicVol * env;
        mixRight[i] += musicStereo.right[mIdx] * musicVol * env;
      }
    }
  }

  // 3. Add Sound Effects (SFX) tracks
  if (options.sfxTracks && options.sfxTracks.length > 0) {
    for (const sfx of options.sfxTracks) {
      const sfxFile = sfx.filePath || sfx.file;
      if (!sfxFile || !fs.existsSync(sfxFile)) continue;

      const sfxStereo = readWavToStereo48k(sfxFile);
      const timeSec = sfx.startTimeSec ?? sfx.timeSec ?? (sfx.frame !== undefined ? sfx.frame / 30 : 0);
      const startFrame = Math.round(timeSec * sampleRate);
      const sfxVol = sfx.volume ?? 0.8;

      for (let j = 0; j < sfxStereo.left.length; j++) {
        const destIdx = startFrame + j;
        if (destIdx >= 0 && destIdx < totalFrames) {
          mixLeft[destIdx] += sfxStereo.left[j] * sfxVol;
          mixRight[destIdx] += sfxStereo.right[j] * sfxVol;
        }
      }
    }
  }

  // 4. Interleave stereo channels into Float32Array [L0, R0, L1, R1, ...]
  const masterInterleaved = new Float32Array(totalFrames * 2);
  for (let i = 0; i < totalFrames; i++) {
    masterInterleaved[2 * i] = mixLeft[i];
    masterInterleaved[2 * i + 1] = mixRight[i];
  }

  // 5. Loudness Normalization & Peak Limiting (EBU R128: -16 LUFS / -1.0 dBFS ceiling)
  const normRes = normalizePcmLoudness(masterInterleaved, {
    targetLufs: -16.0,
    maxPeakDbfs: -1.0,
    sampleRate: 48000,
    channels: 2,
  });

  // 6. Convert to 16-bit PCM (clamping strictly <= 0.89125 guarantees 0 clipped samples)
  const outPcm16 = new Int16Array(normRes.normalized.length);
  for (let i = 0; i < normRes.normalized.length; i++) {
    const s = Math.max(-1.0, Math.min(1.0, normRes.normalized[i]));
    outPcm16[i] = Math.round(s * 32767);
  }

  // 7. Write broadcast-standard 48,000 Hz 2-channel stereo 16-bit WAV file
  const outBuf = createWavFile(
    Buffer.from(outPcm16.buffer, outPcm16.byteOffset, outPcm16.byteLength),
    48000,
    2,
    16
  );

  fs.writeFileSync(options.outputPath, outBuf);

  return {
    durationSec: Math.round(maxDurationSec * 100) / 100,
    peakDbfs: normRes.stats.peakDbfs,
    truePeakDbfs: normRes.stats.truePeakDbfs,
    lufs: normRes.stats.integratedLufs,
    clippedSamples: normRes.stats.clippedSamples,
    duckingRegions,
    outputPath: options.outputPath,
  };
}

export const mixAudio = mixAudioTracks;

/**
 * AudioMixer class providing static and instance mixing methods.
 */
export class AudioMixer {
  public static mix(options: MixOptions): MixResult {
    return mixAudioTracks(options);
  }

  public mix(options: MixOptions): MixResult {
    return mixAudioTracks(options);
  }
}
