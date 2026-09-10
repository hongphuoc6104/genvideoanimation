/**
 * packages/narration-kit/src/tts/index.ts
 * Re-exports all TTS subsystem interfaces, providers, engines, and utilities.
 */

import { TTSProvider } from './types';
import { KokoroProvider } from './KokoroProvider';
import { VieNeuProvider } from './VieNeuProvider';
import { VieNeuTtsEngine } from './VieNeuTtsEngine';
import { isKokoroVoice } from './voices';

export * from './types';
export * from './voices';
export * from './vieneuVoices';
export * from './wav';
export * from './KokoroTtsEngine';
export * from './TTSProvider';
export * from './KokoroProvider';
export * from './KokoroAssetManager';
export * from './VieNeuTtsEngine';
export * from './VieNeuProvider';
export * from './textNormalizer';
export * from './chunkNarration';

export type TTSProviderType = 'vieneu' | 'kokoro';

export interface TTSFactoryOptions {
  provider?: TTSProviderType;
  primaryLanguage?: 'vi-VN' | 'en' | string;
  language?: 'vi-VN' | 'en' | string;
  voice?: string;
  offline?: boolean;
  pythonPath?: string;
  sampleRate?: 24000 | 48000;
}

/**
 * Canonical TTS Provider Factory:
 * Defaults to VieNeu-TTS v3 Turbo as primary engine, preserving Kokoro as fallback.
 */
export function createTTSProvider(options: TTSFactoryOptions = {}): TTSProvider {
  const normalizedVoice = options.voice?.trim();
  const isExplicitKokoro =
    options.provider === 'kokoro' ||
    options.primaryLanguage === 'en' ||
    options.language === 'en' ||
    (normalizedVoice ? isKokoroVoice(normalizedVoice) : false);

  if (isExplicitKokoro) {
    return new KokoroProvider();
  }

  return new VieNeuProvider(
    new VieNeuTtsEngine({
      offline: options.offline,
      pythonPath: options.pythonPath,
      sampleRate: options.sampleRate,
    })
  );
}

export const defaultTTSProvider = createTTSProvider();
