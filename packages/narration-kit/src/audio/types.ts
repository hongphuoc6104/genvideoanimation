/**
 * packages/narration-kit/src/audio/types.ts
 * Types and interfaces for multi-track audio production and mastering.
 */

export type AudioTrackType = 'narration' | 'music' | 'sfx';

export interface DuckingConfig {
  duckingDepthDb: number; // e.g. -12.8 dB
  attackMs: number;       // e.g. 100 ms
  releaseMs: number;      // e.g. 300 ms
}

export interface AudioTrackSpec {
  id: string;
  type: AudioTrackType;
  filePath: string;
  volume: number; // 0.0 to 1.0
  startTimeSec?: number;
  durationSec?: number;
  loop?: boolean;
}

export interface DuckingRegion {
  startSec: number;
  endSec: number;
  duckedGain: number; // linear multiplier (e.g. 0.229 for -12.8 dB)
}

export interface AudioManifest {
  version: '3.0';
  targetLufs: number;
  sampleRate: number;
  channels: number;
  totalDurationSec: number;
  peakDbfs: number;
  integratedLufs: number;
  tracks: {
    narration?: AudioTrackSpec;
    music?: AudioTrackSpec;
    sfx: AudioTrackSpec[];
  };
  ducking: {
    enabled: boolean;
    config: DuckingConfig;
    regions: DuckingRegion[];
  };
  validation: {
    clippingFree: boolean;
    hasNarration: boolean;
    durationSyncValid: boolean;
  };
}
