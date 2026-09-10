import { KokoroVoice, VoiceMetadata } from './types';
import {
  VIENEU_SUPPORTED_VOICES,
  VIENEU_PRIMARY_VOICES,
  VIENEU_VOICE_ALIASES,
  VIENEU_VOICE_METADATA,
  DEFAULT_VIENEU_VOICE,
  resolveVieNeuVoice,
  isVieNeuVoice,
} from './vieneuVoices';

// ============================================================================
// Preserved Kokoro Voice Registry (Backward Compatibility)
// ============================================================================

export const KOKORO_SUPPORTED_VOICES: readonly KokoroVoice[] = [
  'am_adam',
  'am_fenrir',
  'am_michael',
  'am_onyx',
] as const;

export const KOKORO_DEFAULT_VOICE: KokoroVoice = 'am_adam';

/**
 * Backward compatibility alias: SUPPORTED_VOICES originally pointed to Kokoro voices.
 */
export const SUPPORTED_VOICES: readonly KokoroVoice[] = KOKORO_SUPPORTED_VOICES;

export const DEFAULT_VOICE: KokoroVoice = 'am_adam';

/**
 * Authoritative V3.3 production default voice (VieNeu-TTS 'Adam').
 */
export const DEFAULT_PRODUCTION_VOICE: string = DEFAULT_VIENEU_VOICE;

export const KOKORO_VOICE_METADATA: Record<KokoroVoice, VoiceMetadata> = {
  am_adam: {
    id: 'am_adam',
    name: 'Adam',
    gender: 'male',
    description: 'American Male, clear and measured, default educational narrator',
    language: 'en-us',
    provider: 'kokoro',
    sampleRate: 24000,
  },
  am_fenrir: {
    id: 'am_fenrir',
    name: 'Fenrir',
    gender: 'male',
    description: 'American Male, deep and authoritative, dramatic cadence',
    language: 'en-us',
    provider: 'kokoro',
    sampleRate: 24000,
  },
  am_michael: {
    id: 'am_michael',
    name: 'Michael',
    gender: 'male',
    description: 'American Male, warm and conversational, natural pacing',
    language: 'en-us',
    provider: 'kokoro',
    sampleRate: 24000,
  },
  am_onyx: {
    id: 'am_onyx',
    name: 'Onyx',
    gender: 'male',
    description: 'American Male, resonant and solemn, precise technical articulation',
    language: 'en-us',
    provider: 'kokoro',
    sampleRate: 24000,
  },
};

/**
 * Backward compatibility alias for Kokoro VOICE_METADATA.
 */
export const VOICE_METADATA = KOKORO_VOICE_METADATA;

export function isKokoroVoice(v: string): v is KokoroVoice {
  return (KOKORO_SUPPORTED_VOICES as readonly string[]).includes(v);
}

export function validateVoice(voice?: string): KokoroVoice {
  if (!voice) return DEFAULT_VOICE;
  if (isKokoroVoice(voice)) return voice;
  throw new Error(
    `Unsupported voice: "${voice}". Supported voices are: ${SUPPORTED_VOICES.join(', ')}`
  );
}

// ============================================================================
// Unified Voice Metadata & Resolution
// ============================================================================

export const ALL_VOICE_METADATA: Record<string, VoiceMetadata> = {
  ...KOKORO_VOICE_METADATA,
  ...VIENEU_VOICE_METADATA,
};

export function resolveAnyVoice(voice?: string): { resolvedName: string; provider: 'vieneu' | 'kokoro' } {
  const trimmed = voice?.trim();
  if (!trimmed) {
    return { resolvedName: DEFAULT_VIENEU_VOICE, provider: 'vieneu' };
  }
  if (isKokoroVoice(trimmed)) {
    return { resolvedName: trimmed, provider: 'kokoro' };
  }
  return { resolvedName: resolveVieNeuVoice(trimmed), provider: 'vieneu' };
}

// Re-export VieNeu items
export {
  VIENEU_SUPPORTED_VOICES,
  VIENEU_PRIMARY_VOICES,
  VIENEU_VOICE_ALIASES,
  VIENEU_VOICE_METADATA,
  DEFAULT_VIENEU_VOICE,
  resolveVieNeuVoice,
  isVieNeuVoice,
};
