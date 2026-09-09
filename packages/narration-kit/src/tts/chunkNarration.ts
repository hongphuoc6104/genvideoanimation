/**
 * packages/narration-kit/src/tts/chunkNarration.ts
 * Semantic sentence chunking and deterministic prosody profile engine.
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
  sentencePauseMs: number;
  paragraphPauseMs: number;
  commaPauseMs: number;
  pitchHint?: string;
  description: string;
}

export const PROSODY_PROFILES: Record<NarrationProfileName, ProsodyProfile> = {
  documentary: {
    name: 'documentary',
    speed: 0.95,
    sentencePauseMs: 500,
    paragraphPauseMs: 1000,
    commaPauseMs: 250,
    description: 'Authoritative, grounded cadence with spacious narrative pauses.',
  },
  educational: {
    name: 'educational',
    speed: 1.0,
    sentencePauseMs: 400,
    paragraphPauseMs: 800,
    commaPauseMs: 200,
    description: 'Clear, engaging, pedagogical tempo ideal for conceptual explainers.',
  },
  energetic: {
    name: 'energetic',
    speed: 1.15,
    sentencePauseMs: 250,
    paragraphPauseMs: 500,
    commaPauseMs: 120,
    description: 'Brisk, upbeat delivery for modern product demos and hooks.',
  },
  calm: {
    name: 'calm',
    speed: 0.9,
    sentencePauseMs: 600,
    paragraphPauseMs: 1200,
    commaPauseMs: 300,
    description: 'Gentle, meditative pacing with warm intervals.',
  },
  dramatic: {
    name: 'dramatic',
    speed: 0.85,
    sentencePauseMs: 800,
    paragraphPauseMs: 1500,
    commaPauseMs: 350,
    description: 'High-contrast, deliberate delivery with cinematic tension.',
  },
  solemn: {
    name: 'solemn',
    speed: 0.88,
    sentencePauseMs: 700,
    paragraphPauseMs: 1400,
    commaPauseMs: 320,
    description: 'Deep, measured, and respectful delivery.',
  },
};

export interface NarrationChunk {
  id: string;
  index: number;
  text: string;
  spokenText: string;
  pauseAfterMs: number;
  profile: ProsodyProfile;
  emphasisWords?: string[];
  shotId?: string;
}

export interface ChunkOptions {
  profile?: NarrationProfileName;
  maxWordsPerChunk?: number;
  emphasisWords?: string[];
  pauseAfterOverrideMs?: number;
}

export class NarrationChunker {
  public chunkText(
    text: string,
    options: ChunkOptions = {}
  ): NarrationChunk[] {
    const profileName = options.profile || 'educational';
    const profile = PROSODY_PROFILES[profileName] || PROSODY_PROFILES.educational;
    const maxWords = options.maxWordsPerChunk || 35;

    // Split paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: NarrationChunk[] = [];
    let chunkId = 1;

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx].trim();
      // Split sentences based on terminal punctuation
      const sentenceRegex = /([^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$)/g;
      const sentences = para.match(sentenceRegex) || [para];

      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const sentence = sentences[sIdx].trim();
        if (!sentence) continue;

        const isLastSentenceInPara = sIdx === sentences.length - 1;
        const isLastSentenceOverall = isLastSentenceInPara && pIdx === paragraphs.length - 1;

        let pauseAfterMs = isLastSentenceInPara
          ? profile.paragraphPauseMs
          : profile.sentencePauseMs;

        if (isLastSentenceOverall && options.pauseAfterOverrideMs !== undefined) {
          pauseAfterMs = options.pauseAfterOverrideMs;
        }

        chunks.push({
          id: `chunk-${String(chunkId).padStart(3, '0')}`,
          index: chunkId - 1,
          text: sentence,
          spokenText: sentence,
          pauseAfterMs,
          profile,
          emphasisWords: options.emphasisWords || [],
        });
        chunkId++;
      }
    }

    return chunks;
  }
}
