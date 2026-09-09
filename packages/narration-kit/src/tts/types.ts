import type { Buffer } from 'node:buffer';

export type KokoroVoice = 'am_adam' | 'am_fenrir' | 'am_michael' | 'am_onyx';
export type VoicePreset = KokoroVoice;

export interface VoiceMetadata {
  id: KokoroVoice;
  name: string;
  gender: 'male' | 'female';
  description: string;
  language: string;
}

export interface SynthesizeOptions {
  text: string;
  voice?: KokoroVoice | string;
  speed?: number; // default 1.0 (range 0.5 - 2.0)
  outputPath?: string; // If specified, writes WAV file to disk
  offline?: boolean; // If true, activates strict offline network guard
}

export interface SynthesizeResult {
  audioBuffer: Buffer; // 24kHz 16-bit mono uncompressed PCM WAV buffer
  sampleRate: 24000;
  channels: 1;
  durationSec: number;
  outputPath?: string;
}

export interface KokoroTtsEngineOptions {
  repoRoot?: string;
  modelDir?: string;
  modelPath?: string;
  voicesPath?: string;
  pythonPath?: string;
  offline?: boolean;
}

export interface TtsEngine {
  synthesize(options: SynthesizeOptions): Promise<SynthesizeResult>;
  getAvailableVoices(): string[];
  validateModelAssets(): Promise<boolean>;
}
