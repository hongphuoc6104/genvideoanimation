/**
 * packages/narration-kit/src/audio/audioManifest.ts
 * Builds and validates audio-manifest.json conforming to V3 R11.
 */

import * as fs from 'node:fs';
import { AudioManifest, AudioTrackSpec, DuckingConfig } from './types';

export interface CreateAudioManifestOptions {
  outputPath?: string;
  totalDurationSec: number;
  sampleRate?: number;
  channels?: number;
  targetLufs?: number;
  peakDbfs: number;
  integratedLufs: number;
  narrationTrack?: AudioTrackSpec;
  musicTrack?: AudioTrackSpec;
  sfxTracks?: AudioTrackSpec[];
  duckingConfig?: DuckingConfig;
  duckingRegions?: Array<{ startSec: number; endSec: number; duckedGain: number }>;
}

export function createAudioManifest(options: CreateAudioManifestOptions): AudioManifest {
  const hasNarration = Boolean(options.narrationTrack);
  const clippingFree = options.peakDbfs <= -0.1;
  const durationSyncValid = options.totalDurationSec > 0;

  const manifest: AudioManifest = {
    version: '3.0',
    targetLufs: options.targetLufs ?? -16.0,
    sampleRate: options.sampleRate ?? 24000,
    channels: options.channels ?? 1,
    totalDurationSec: Math.round(options.totalDurationSec * 100) / 100,
    peakDbfs: Math.round(options.peakDbfs * 10) / 10,
    integratedLufs: Math.round(options.integratedLufs * 10) / 10,
    tracks: {
      narration: options.narrationTrack,
      music: options.musicTrack,
      sfx: options.sfxTracks || [],
    },
    ducking: {
      enabled: Boolean(options.musicTrack && hasNarration),
      config: options.duckingConfig || {
        duckingDepthDb: -12.8,
        attackMs: 100,
        releaseMs: 300,
      },
      regions: options.duckingRegions || [],
    },
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

export function validateAudioManifest(manifest: AudioManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.tracks.narration) {
    errors.push('Missing required narration track.');
  }
  if (manifest.peakDbfs > -0.05) {
    errors.push(`Audio peak (${manifest.peakDbfs} dBFS) exceeds maximum safe ceiling (-0.1 dBFS).`);
  }
  if (manifest.totalDurationSec <= 0) {
    errors.push(`Invalid audio total duration: ${manifest.totalDurationSec}s.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
