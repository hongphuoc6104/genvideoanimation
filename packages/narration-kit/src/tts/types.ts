import type { Buffer } from 'node:buffer';

// ============================================================================
// Voice Types
// ============================================================================

export type KokoroVoice = 'am_adam' | 'am_fenrir' | 'am_michael' | 'am_onyx';

export type VieNeuVoice =
  | 'Adam'
  | 'Minh Đức'
  | 'Minh Quân'
  | 'Mai Phương'
  | 'Mai Anh'
  | 'Trúc Ly'
  | 'Minh Triết'
  | 'Phạm Tuyên'
  | 'Thái Sơn'
  | 'Ngọc Linh'
  | string;

export type VoicePreset = VieNeuVoice | KokoroVoice;

export interface VoiceMetadata {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
  language: string;
  provider?: 'vieneu' | 'kokoro';
  sampleRate?: number;
  accent?: 'North' | 'Central' | 'South' | 'General';
  style?: 'news' | 'natural' | 'story' | 'documentary';
}

// ============================================================================
// Synthesize & TTS Options / Results
// ============================================================================

export interface SynthesizeOptions {
  text: string;
  voice?: VoicePreset | string;
  speed?: number; // default 1.0 (range 0.5 - 2.0)
  outputPath?: string; // If specified, writes WAV file to disk
  offline?: boolean; // If true, activates strict offline network guard
  sampleRate?: number; // Target sample rate: 24000 | 48000
}

export interface SynthesizeResult {
  audioBuffer: Buffer; // uncompressed mono PCM WAV buffer
  sampleRate: number; // 48000 for VieNeu, 24000 for Kokoro
  channels: 1; // Mono invariant
  bitDepth?: number; // 16-bit PCM invariant
  durationSec: number;
  outputPath?: string;
  rtf?: number; // Real-time factor
}

// ============================================================================
// Canonical TTSProvider Contracts
// ============================================================================

export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  outputPath?: string;
  sampleRate?: 24000 | 48000;
  offline?: boolean;
  format?: 'wav';
}

export interface TTSResult {
  audioPath?: string;
  durationSeconds: number;
  durationSec?: number;
  durationMs?: number;
  sampleRate: number;
  audioBuffer?: Buffer;
  outputPath?: string;
  channels?: number;
  bitDepth?: number;
}

export interface TTSProvider {
  readonly name?: string;
  synthesize(request: TTSRequest): Promise<TTSResult>;
  getAvailableVoices(): string[];
  getVoices?(): VoiceMetadata[];
}

export interface TtsEngine {
  synthesize(options: SynthesizeOptions): Promise<SynthesizeResult>;
  getAvailableVoices(): string[];
  validateModelAssets(): Promise<boolean>;
}

export interface VieNeuTtsEngineOptions {
  repoRoot?: string;
  scriptPath?: string;
  pythonPath?: string;
  offline?: boolean;
  defaultVoice?: string;
  sampleRate?: 24000 | 48000;
}

export interface KokoroTtsEngineOptions {
  repoRoot?: string;
  modelDir?: string;
  modelPath?: string;
  voicesPath?: string;
  pythonPath?: string;
  offline?: boolean;
}
