/**
 * packages/narration-kit/src/tts/chunkNarration.ts
 * Semantic sentence chunking, clause breaking, and ShotSpec prosody bindings.
 */

import {
  NarrationProfileName,
  PROSODY_PROFILES,
  ProsodyProfile,
  clampPause,
  clampSpeed,
  resolveProsodyProfile,
} from '../prosody';

export * from '../prosody';

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

export interface ShotSpecBinding {
  shot_id: string;
  text?: string;
  narration?: string;
  narration_profile?: string;
  emphasis_words?: string[];
  pause_after?: number;
  duration_frames?: number;
  fps?: number;
}

export class NarrationChunker {
  /**
   * Chunks narration text by paragraphs, sentences, and sub-clauses for long sentences.
   */
  public chunkText(
    text: string,
    options: ChunkOptions = {}
  ): NarrationChunk[] {
    const profile = resolveProsodyProfile(options.profile);
    const maxWords = options.maxWordsPerChunk || 35;

    // Split paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: NarrationChunk[] = [];
    let chunkId = 1;

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx].trim();
      // Split sentences based on terminal punctuation followed by whitespace or end-of-string
      const rawSentences = para
        .split(/(?<=[.!?])\s+(?=[A-Z0-9"“'‘]|$)/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Break long sentences at clause boundaries if exceeding maxWords
      const sentences: { text: string; isClause: boolean }[] = [];
      for (const rawSentence of rawSentences) {
        const trimmed = rawSentence.trim();
        if (!trimmed) continue;

        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount > maxWords) {
          // Break at clause boundaries: comma, semicolon, colon, em-dash followed by whitespace
          const clauses = trimmed
            .split(/(?<=[,;:—–])\s+/)
            .map((c) => c.trim())
            .filter(Boolean);
          for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
            const cl = clauses[cIdx];
            if (cl) {
              sentences.push({ text: cl, isClause: cIdx < clauses.length - 1 });
            }
          }
        } else {
          sentences.push({ text: trimmed, isClause: false });
        }
      }

      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const item = sentences[sIdx];
        const sentence = item.text;
        if (!sentence) continue;

        const isLastInPara = sIdx === sentences.length - 1;
        const isLastOverall = isLastInPara && pIdx === paragraphs.length - 1;

        let pauseAfterMs: number;
        if (item.isClause) {
          pauseAfterMs = profile.commaPauseMs;
        } else if (isLastInPara) {
          pauseAfterMs = profile.paragraphPauseMs;
        } else {
          pauseAfterMs = profile.sentencePauseMs;
        }

        if (isLastOverall && options.pauseAfterOverrideMs !== undefined) {
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

  /**
   * Chunks narration across multiple shots declared in a ShotSpec array.
   * Shot-level prosody override supersedes global defaults.
   */
  public chunkShotSpec(
    shots: ShotSpecBinding[],
    globalProfile: NarrationProfileName = 'educational'
  ): NarrationChunk[] {
    const allChunks: NarrationChunk[] = [];
    let globalIndex = 0;

    for (let shotIdx = 0; shotIdx < shots.length; shotIdx++) {
      const shot = shots[shotIdx];
      const shotText = shot.text || shot.narration || '';
      if (!shotText.trim()) continue;

      const profileName = (shot.narration_profile || globalProfile) as NarrationProfileName;
      const profile = resolveProsodyProfile(profileName);

      const pauseAfterOverrideMs =
        shot.pause_after !== undefined
          ? Math.round(clampPause(shot.pause_after) * 1000)
          : undefined;

      const shotChunks = this.chunkText(shotText, {
        profile: profile.name,
        emphasisWords: shot.emphasis_words || [],
        pauseAfterOverrideMs,
      });

      for (const chunk of shotChunks) {
        allChunks.push({
          ...chunk,
          id: `chunk-${String(globalIndex + 1).padStart(3, '0')}`,
          index: globalIndex,
          shotId: shot.shot_id,
        });
        globalIndex++;
      }
    }

    return allChunks;
  }
}

/**
 * Standalone chunkText function.
 */
export function chunkText(text: string, options?: ChunkOptions): NarrationChunk[] {
  const chunker = new NarrationChunker();
  return chunker.chunkText(text, options);
}

/**
 * Standalone chunkShotSpec function.
 */
export function chunkShotSpec(
  shots: ShotSpecBinding[],
  globalProfile?: NarrationProfileName
): NarrationChunk[] {
  const chunker = new NarrationChunker();
  return chunker.chunkShotSpec(shots, globalProfile);
}
