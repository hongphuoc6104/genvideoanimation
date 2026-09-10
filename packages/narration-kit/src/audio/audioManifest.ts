/**
 * packages/narration-kit/src/audio/audioManifest.ts
 * Builds and validates canonical audio-manifest.json conforming to both E2E fixtures and validators.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AudioManifest,
  AudioTrackSpec,
  DuckingConfig,
  DuckingRegion,
} from './types';

export interface CreateAudioManifestOptions {
  outputPath?: string;
  outputFile?: string;
  audioPolicy?: 'narration-sfx' | 'narration-music-sfx';
  voiceProfile?: string;
  totalDurationSec?: number;
  durationSec?: number;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  targetLufs?: number;
  peakDbfs?: number;
  truePeakDbfs?: number;
  integratedLufs?: number;
  lufs?: number;
  clippedSamples?: number;
  narrationTrack?: AudioTrackSpec;
  musicTrack?: AudioTrackSpec;
  sfxTracks?: AudioTrackSpec[];
  duckingConfig?: DuckingConfig;
  duckingRegions?: DuckingRegion[];
}

/**
 * Creates canonical audio-manifest.json conforming to V3 R10, R11, and test fixture schema.
 */
export function createAudioManifest(options: CreateAudioManifestOptions): AudioManifest {
  const version = '3.2';
  const audioPolicy = options.audioPolicy || 'narration-sfx';
  const voiceProfile = options.voiceProfile || 'GENVIDEO_ADAM_PROFILE';
  const sampleRate = options.sampleRate ?? 48000;
  const channels = options.channels ?? 2;
  const bitDepth = options.bitDepth ?? 16;
  const totalDurationSec =
    Math.round((options.totalDurationSec ?? options.durationSec ?? 0) * 100) / 100;
  const truePeakDbfs =
    Math.round((options.truePeakDbfs ?? options.peakDbfs ?? -1.8) * 10) / 10;
  const lufs =
    Math.round((options.lufs ?? options.integratedLufs ?? options.targetLufs ?? -15.0) * 10) / 10;
  const clippedSamples = options.clippedSamples ?? 0;

  // 1. Narration track metadata
  let narration: any;
  if (options.narrationTrack) {
    const rawFile =
      options.narrationTrack.file ||
      (options.narrationTrack.filePath
        ? path.basename(options.narrationTrack.filePath)
        : 'narration.wav');
    const dur =
      options.narrationTrack.duration ??
      options.narrationTrack.durationSec ??
      totalDurationSec;
    narration = {
      ...options.narrationTrack,
      file: rawFile,
      duration: Math.round(dur * 100) / 100,
      sampleRate: options.narrationTrack.sampleRate ?? 24000,
      channels: options.narrationTrack.channels ?? 1,
    };
  } else {
    narration = {
      file: 'narration.wav',
      duration: totalDurationSec,
      sampleRate: 24000,
      channels: 1,
    };
  }

  // 2. Music track metadata (omitted under narration-sfx policy)
  let music: any = undefined;
  if (audioPolicy !== 'narration-sfx' && options.musicTrack) {
    const rawFile =
      options.musicTrack.file ||
      (options.musicTrack.filePath
        ? path.basename(options.musicTrack.filePath)
        : 'music.wav');
    const vol = options.musicTrack.volume ?? 0.22;
    const attenuationDb = options.duckingConfig?.duckingDepthDb ?? -12.8;
    const duckedVol =
      options.musicTrack.duckedVolume ??
      Math.round(vol * Math.pow(10, attenuationDb / 20) * 100) / 100;
    const dur =
      options.musicTrack.duration ??
      options.musicTrack.durationSec ??
      totalDurationSec;

    music = {
      ...options.musicTrack,
      file: rawFile,
      duration: Math.round(dur * 100) / 100,
      volume: vol,
      duckedVolume: duckedVol,
    };
  }

  // 3. SFX track metadata
  const sfx = (options.sfxTracks || []).map((s, idx) => {
    const rawFile = s.file || (s.filePath ? path.basename(s.filePath) : `sfx_${idx}.wav`);
    const timeSec = s.timeSec ?? s.startTimeSec ?? (s.frame !== undefined ? s.frame / 30 : 0);
    const frame = s.frame ?? Math.round(timeSec * 30);
    return {
      ...s,
      id: s.id || `sfx_${idx}`,
      file: rawFile,
      frame,
      timeSec: Math.round(timeSec * 100) / 100,
      volume: s.volume ?? 0.8,
    };
  });

  // 4. Ducking configuration
  const attackMs = options.duckingConfig?.attackMs ?? 100;
  const releaseMs = options.duckingConfig?.releaseMs ?? 600;
  const attenuationDb = options.duckingConfig?.duckingDepthDb ?? -12.8;

  const ducking = {
    enabled: Boolean(options.musicTrack && narration),
    attackMs,
    releaseMs,
    attenuationDb,
    config: options.duckingConfig || {
      duckingDepthDb: attenuationDb,
      attackMs,
      releaseMs,
    },
    regions: options.duckingRegions || [],
  };

  // 5. Output specifications
  const output = {
    file: options.outputFile || 'mixed-soundtrack.wav',
    sampleRate,
    channels,
    bitDepth,
    durationSec: totalDurationSec,
    truePeakDbfs,
    lufs,
    clippedSamples,
  };

  const hasNarration = Boolean(narration && narration.duration > 0);
  const narrationDur = narration?.duration ?? 0;
  const durationSyncValid = Math.abs(narrationDur - totalDurationSec) <= 0.1;
  const clippingFree = truePeakDbfs <= -0.1 && clippedSamples === 0;

  const manifest: AudioManifest = {
    version,
    audioPolicy,
    voiceProfile,
    tracks: {
      narration,
      music,
      sfx,
    },
    ducking,
    output,
    targetLufs: options.targetLufs ?? -15.0,
    sampleRate,
    channels,
    totalDurationSec,
    durationSec: totalDurationSec,
    peakDbfs: truePeakDbfs,
    truePeakDbfs,
    integratedLufs: lufs,
    lufs,
    clippedSamples,
    validation: {
      clippingFree,
      hasNarration,
      durationSyncValid,
    },
  };

  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  return manifest;
}

export const generateAudioManifest = createAudioManifest;

/**
 * Validates an AudioManifest against broadcast and production standards.
 */
export function validateAudioManifest(manifest: AudioManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const narrationDur = manifest.tracks?.narration?.duration ?? 0;
  const outputDur = manifest.output?.durationSec ?? manifest.totalDurationSec ?? 0;

  if (!manifest.tracks?.narration || narrationDur <= 0) {
    errors.push('Missing or invalid required narration track.');
  }

  if (Math.abs(narrationDur - outputDur) > 0.1) {
    errors.push(`Duration sync mismatch: narration=${narrationDur}s, output=${outputDur}s (delta > 0.1s)`);
  }

  const attenuationDb = manifest.ducking?.attenuationDb ?? manifest.ducking?.config?.duckingDepthDb ?? 0;
  if (manifest.ducking?.enabled && attenuationDb > -10.0) {
    errors.push(`Ducking attenuation ${attenuationDb} dB is insufficient (must be <= -10.0 dB)`);
  }

  const peak = manifest.output?.truePeakDbfs ?? manifest.peakDbfs ?? 0;
  if (peak > -1.0) {
    errors.push(`Output true peak (${peak} dBFS) exceeds maximum safe ceiling (-1.0 dBFS).`);
  }

  const clipped = manifest.output?.clippedSamples ?? manifest.clippedSamples ?? 0;
  if (clipped > 0) {
    errors.push(`Output contains ${clipped} clipped samples.`);
  }

  const lufs = manifest.output?.lufs ?? manifest.integratedLufs ?? -16.0;
  if (lufs < -17.5 || lufs > -14.5) {
    errors.push(`Output loudness (${lufs} LUFS) is outside broadcast spec [-17.5, -14.5].`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
