/**
 * packages/narration-kit/src/prosody/index.ts
 * Deterministic Prosody Profiles Engine.
 * Canonical profiles controlling speed, pauses, and chunk boundaries.
 */

export type NarrationProfileName =
  | 'documentary'
  | 'educational'
  | 'energetic'
  | 'calm'
  | 'dramatic'
  | 'solemn';

export interface ProsodyProfile {
  name: NarrationProfileName;
  speed: number;
  pauseSec: number;
  sentencePauseMs: number;
  paragraphPauseMs: number;
  commaPauseMs: number;
  pauseAfterSentence: number; // Equal to pauseSec for dual representation
  pitchShift: number;
  pitchHint?: string;
  description: string;
}

export const CANONICAL_PROFILES: NarrationProfileName[] = [
  'documentary',
  'educational',
  'energetic',
  'calm',
  'dramatic',
  'solemn',
];

export const PROSODY_PROFILES: Record<NarrationProfileName, ProsodyProfile> = {
  documentary: {
    name: 'documentary',
    speed: 0.95,
    pauseSec: 0.5,
    sentencePauseMs: 500,
    paragraphPauseMs: 1000,
    commaPauseMs: 250,
    pauseAfterSentence: 0.5,
    pitchShift: 0.0,
    description: 'Authoritative, grounded cadence with spacious narrative pauses.',
  },
  educational: {
    name: 'educational',
    speed: 1.0,
    pauseSec: 0.4,
    sentencePauseMs: 400,
    paragraphPauseMs: 800,
    commaPauseMs: 200,
    pauseAfterSentence: 0.4,
    pitchShift: 0.0,
    description: 'Clear, engaging, pedagogical tempo ideal for conceptual explainers.',
  },
  energetic: {
    name: 'energetic',
    speed: 1.15,
    pauseSec: 0.25,
    sentencePauseMs: 250,
    paragraphPauseMs: 500,
    commaPauseMs: 120,
    pauseAfterSentence: 0.25,
    pitchShift: 0.05,
    description: 'Brisk, upbeat delivery for modern product demos and hooks.',
  },
  calm: {
    name: 'calm',
    speed: 0.9,
    pauseSec: 0.6,
    sentencePauseMs: 600,
    paragraphPauseMs: 1200,
    commaPauseMs: 300,
    pauseAfterSentence: 0.6,
    pitchShift: -0.02,
    description: 'Gentle, meditative pacing with warm intervals.',
  },
  dramatic: {
    name: 'dramatic',
    speed: 0.85,
    pauseSec: 0.8,
    sentencePauseMs: 800,
    paragraphPauseMs: 1500,
    commaPauseMs: 350,
    pauseAfterSentence: 0.8,
    pitchShift: -0.05,
    description: 'High-contrast, deliberate delivery with cinematic tension.',
  },
  solemn: {
    name: 'solemn',
    speed: 0.85,
    pauseSec: 0.9,
    sentencePauseMs: 900,
    paragraphPauseMs: 1600,
    commaPauseMs: 350,
    pauseAfterSentence: 0.9,
    pitchShift: -0.08,
    description: 'Deep, measured, and respectful delivery.',
  },
};

/**
 * Clamps speech speed multiplier within [0.5, 2.0].
 */
export function clampSpeed(speed: number): number {
  return Math.max(0.5, Math.min(2.0, speed));
}

/**
 * Clamps pause duration in seconds within [0.0, 5.0].
 */
export function clampPause(pauseSec: number): number {
  return Math.max(0.0, Math.min(5.0, pauseSec));
}

/**
 * Resolves a prosody profile by name, falling back to 'educational' if unknown or omitted.
 */
export function resolveProsodyProfile(name?: string | null): ProsodyProfile {
  if (name && (name as NarrationProfileName) in PROSODY_PROFILES) {
    return PROSODY_PROFILES[name as NarrationProfileName];
  }
  return PROSODY_PROFILES.educational;
}
