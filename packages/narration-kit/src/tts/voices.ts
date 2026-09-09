import { KokoroVoice, VoiceMetadata } from './types';

export const SUPPORTED_VOICES: readonly KokoroVoice[] = [
  'am_adam',
  'am_fenrir',
  'am_michael',
  'am_onyx',
] as const;

export const DEFAULT_VOICE: KokoroVoice = 'am_adam';

export const VOICE_METADATA: Record<KokoroVoice, VoiceMetadata> = {
  am_adam: {
    id: 'am_adam',
    name: 'Adam',
    gender: 'male',
    description: 'American Male, clear and measured, default educational narrator',
    language: 'en-us',
  },
  am_fenrir: {
    id: 'am_fenrir',
    name: 'Fenrir',
    gender: 'male',
    description: 'American Male, deep and authoritative, dramatic cadence',
    language: 'en-us',
  },
  am_michael: {
    id: 'am_michael',
    name: 'Michael',
    gender: 'male',
    description: 'American Male, warm and conversational, natural pacing',
    language: 'en-us',
  },
  am_onyx: {
    id: 'am_onyx',
    name: 'Onyx',
    gender: 'male',
    description: 'American Male, resonant and solemn, precise technical articulation',
    language: 'en-us',
  },
};

export function isKokoroVoice(v: string): v is KokoroVoice {
  return (SUPPORTED_VOICES as readonly string[]).includes(v);
}

export function validateVoice(voice?: string): KokoroVoice {
  if (!voice) return DEFAULT_VOICE;
  if (isKokoroVoice(voice)) return voice;
  throw new Error(
    `Unsupported voice: "${voice}". Supported voices are: ${SUPPORTED_VOICES.join(', ')}`
  );
}
