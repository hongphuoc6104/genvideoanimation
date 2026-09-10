/**
 * packages/narration-kit/src/audio/types.ts
 * Types and interfaces for multi-track audio production and mastering.
 * Conforms to both V3 R10/R11 and E2E AudioManifest specifications.
 */

export type AudioTrackType = 'narration' | 'music' | 'sfx' | 'ambience';

export type AudioPolicy = 'narration-sfx' | 'narration-music-sfx';

export interface DuckingConfig {
  duckingDepthDb: number; // e.g. -12.8 dB
  attackMs: number;       // e.g. 100 ms
  releaseMs: number;      // e.g. 600 ms
}

export interface AudioTrackSpec {
  id: string;
  type: AudioTrackType;
  filePath?: string;
  file?: string;
  volume: number; // 0.0 to 1.0
  duckedVolume?: number;
  startTimeSec?: number;
  timeSec?: number;
  durationSec?: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  frame?: number;
  loop?: boolean;
}

export interface DuckingRegion {
  startSec: number;
  endSec: number;
  duckedGain: number; // linear multiplier (e.g. 0.229 for -12.8 dB)
}

export interface LoudnessStats {
  peakLinear: number;
  peakDbfs: number;
  truePeakLinear: number;
  truePeakDbfs: number;
  rmsLinear: number;
  rmsDbfs: number;
  estimatedLufs: number;
  integratedLufs: number;
  clippedSamples: number;
}

export interface NormalizeOptions {
  targetLufs?: number;        // Default: -16.0 (dialogue / web), or -23.0 (broadcast)
  maxPeakDbfs?: number;       // Default: -1.0 dBFS ceiling
  sampleRate?: number;        // Default: 24000 (narration) or 48000 (master)
  channels?: number;          // Default: 1 (mono) or 2 (stereo)
  preventClipping?: boolean;  // Default: true (guarantees clippedSamples === 0)
  gated?: boolean;            // Default: true (EBU R128 -70 LUFS / -10 LU gating)
}

export interface NormalizeResult {
  normalized: Float32Array;
  gainApplied: number;
  gainAppliedLinear: number;
  gainAppliedDb: number;
  limited: boolean;
  stats: LoudnessStats;
  initialStats: LoudnessStats;
  finalStats: LoudnessStats;
}

export interface MixOptions {
  narrationTrack?: AudioTrackSpec;
  musicTrack?: AudioTrackSpec;
  sfxTracks?: AudioTrackSpec[];
  outputPath: string;
  duckingConfig?: DuckingConfig;
  targetDurationSec?: number;
  words?: Array<{ word?: string; start: number; end: number }>;
  audioPolicy?: AudioPolicy;
  voiceProfile?: string;
}

export interface MixResult {
  durationSec: number;
  peakDbfs: number;
  truePeakDbfs: number;
  lufs: number;
  clippedSamples: number;
  duckingRegions: DuckingRegion[];
  outputPath: string;
}

export interface AudioManifestOutput {
  file: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationSec: number;
  truePeakDbfs: number;
  lufs: number;
  clippedSamples: number;
}

export interface AudioManifestTracks {
  narration?: {
    file: string;
    duration: number;
    sampleRate: number;
    channels: number;
    [key: string]: any;
  } | AudioTrackSpec;
  music?: {
    file: string;
    duration: number;
    volume: number;
    duckedVolume: number;
    [key: string]: any;
  } | AudioTrackSpec;
  sfx: Array<{
    id: string;
    file: string;
    frame: number;
    timeSec?: number;
    volume: number;
    [key: string]: any;
  } | AudioTrackSpec>;
}

export interface AudioManifestDucking {
  enabled?: boolean;
  attackMs: number;
  releaseMs: number;
  attenuationDb: number;
  config?: DuckingConfig;
  regions?: DuckingRegion[];
}

export interface AudioManifestValidation {
  clippingFree: boolean;
  hasNarration: boolean;
  durationSyncValid: boolean;
}

export interface AudioManifest {
  version: '1.0.0' | '3.0' | '3.2' | string;
  audioPolicy?: AudioPolicy;
  voiceProfile?: string;
  tracks: AudioManifestTracks;
  ducking: AudioManifestDucking;
  output: AudioManifestOutput;

  // Flattened & legacy compatibility fields
  targetLufs?: number;
  sampleRate?: number;
  channels?: number;
  totalDurationSec?: number;
  durationSec?: number;
  peakDbfs?: number;
  truePeakDbfs?: number;
  integratedLufs?: number;
  lufs?: number;
  clippedSamples?: number;
  validation?: AudioManifestValidation;
}
