/**
 * packages/narration-kit/src/pipeline/deriveCues.ts
 * Derives animation and semantic cues from narration alignment and captions
 * into V2 CueManifest format compatible with motion-kit.
 */

import * as fs from 'node:fs';
import { WordTiming } from '../alignment/AlignmentProvider';
import { CaptionGroup } from '../captions/types';

export interface CueEvent {
  id: string;
  frame: number;
  timeSec?: number;
  category?: 'whoosh' | 'impact' | 'chime' | 'ui_accent' | 'action' | 'narrative' | 'transition' | string;
  type?: 'WORD_EMPHASIS' | 'SENTENCE_START' | 'SENTENCE_END' | 'narrative' | 'action' | string;
  label?: string;
  description?: string;
  soundFx?: string;
  volume?: number;
  durationFrames?: number;
}

export type DerivedCue = CueEvent;

export interface CueManifest {
  compositionId?: string;
  fps: number;
  durationInFrames?: number;
  cues: CueEvent[];
}

export interface DeriveCuesOptions {
  fps?: number;
  compositionId?: string;
  durationInFrames?: number;
  emphasisWords?: string[];
  outputPath?: string;
}

/**
 * Derives semantic animation cues (SENTENCE_START, SENTENCE_END, WORD_EMPHASIS)
 * from aligned word timings and caption groups.
 * Guarantees strictly monotonic frame numbers (cues[i].frame > cues[i-1].frame).
 */
export function deriveCuesFromNarration(
  words: WordTiming[],
  captionGroups: CaptionGroup[] = [],
  fps: number = 30,
  emphasisWords: string[] = []
): CueEvent[] {
  const rawCues: CueEvent[] = [];
  const lowerEmphasis = new Set(
    emphasisWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean)
  );

  let sentenceIndex = 1;
  let inSentence = false;
  let sentenceStartWord: WordTiming | null = null;
  let sentenceWords: WordTiming[] = [];

  const flushSentence = (endWord: WordTiming) => {
    if (!sentenceStartWord) return;
    const startFrame = Math.max(0, Math.round(sentenceStartWord.start * fps));
    const endFrame = Math.max(startFrame, Math.round(endWord.end * fps));
    const sentenceText = sentenceWords.map((w) => w.word || w.text || '').join(' ');

    rawCues.push({
      id: `cue_sent_start_${sentenceIndex - 1}`,
      frame: startFrame,
      timeSec: Number((startFrame / fps).toFixed(3)),
      category: 'narrative',
      type: 'SENTENCE_START',
      label: `Sentence ${sentenceIndex} Start`,
      description: sentenceText,
      durationFrames: Math.max(1, endFrame - startFrame),
    });

    rawCues.push({
      id: `cue_sent_end_${sentenceIndex - 1}`,
      frame: endFrame,
      timeSec: Number((endFrame / fps).toFixed(3)),
      category: 'narrative',
      type: 'SENTENCE_END',
      label: `Sentence ${sentenceIndex} End`,
      description: 'End of sentence',
    });

    sentenceIndex++;
    inSentence = false;
    sentenceStartWord = null;
    sentenceWords = [];
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!inSentence) {
      inSentence = true;
      sentenceStartWord = w;
      sentenceWords = [];
    }
    sentenceWords.push(w);

    const isTerminating =
      w.punctuation === '.' ||
      w.punctuation === '!' ||
      w.punctuation === '?' ||
      (w.word && /[.!?]$/.test(w.word.trim())) ||
      i === words.length - 1;

    if (isTerminating) {
      flushSentence(w);
    }
  }

  // Fallback: If no cues created from punctuation but caption groups exist
  if (rawCues.length === 0 && captionGroups.length > 0) {
    const firstGroup = captionGroups[0];
    const lastGroup = captionGroups[captionGroups.length - 1];
    rawCues.push({
      id: 'cue_sent_start_0',
      frame: Math.max(0, firstGroup.startFrame),
      timeSec: firstGroup.startTime,
      category: 'narrative',
      type: 'SENTENCE_START',
      label: 'Sentence 1 Start',
      description: firstGroup.lines.map((l) => l.text).join(' '),
    });
    rawCues.push({
      id: 'cue_sent_end_0',
      frame: Math.max(firstGroup.startFrame, lastGroup.endFrame),
      timeSec: lastGroup.endTime,
      category: 'narrative',
      type: 'SENTENCE_END',
      label: 'Sentence 1 End',
      description: 'End of sentence',
    });
  }

  // 2. Derive WORD_EMPHASIS cues (category: 'action')
  let empCount = 0;
  for (const w of words) {
    const clean = (w.cleanWord || w.normalizedText || w.text || w.word || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (clean && lowerEmphasis.has(clean)) {
      const startFrame = Math.max(0, Math.round(w.start * fps));
      const endFrame = Math.max(startFrame, Math.round(w.end * fps));
      const displayWord = w.cleanWord || clean;

      rawCues.push({
        id: `cue_emp_${empCount++}`,
        frame: startFrame,
        timeSec: Number((startFrame / fps).toFixed(3)),
        category: 'action',
        type: 'WORD_EMPHASIS',
        label: `Emphasis: ${displayWord}`,
        description: `Word emphasis on ${displayWord}`,
        durationFrames: Math.max(1, endFrame - startFrame),
      });
    }
  }

  // 3. Sort strictly monotonically in time (T1-F21-05 requirement)
  // Tie-breaker priority: SENTENCE_START (0) -> WORD_EMPHASIS (1) -> SENTENCE_END (2)
  const typePriority: Record<string, number> = {
    SENTENCE_START: 0,
    WORD_EMPHASIS: 1,
    SENTENCE_END: 2,
  };

  rawCues.sort((a, b) => {
    if (a.frame !== b.frame) return a.frame - b.frame;
    const pA = typePriority[a.type || ''] ?? 1;
    const pB = typePriority[b.type || ''] ?? 1;
    return pA - pB;
  });

  // Enforce strict monotonicity: each frame > previous frame
  for (let i = 1; i < rawCues.length; i++) {
    if (rawCues[i].frame <= rawCues[i - 1].frame) {
      rawCues[i].frame = rawCues[i - 1].frame + 1;
      rawCues[i].timeSec = Number((rawCues[i].frame / fps).toFixed(3));
    }
  }

  return rawCues;
}

export const deriveSemanticAnimationCues = deriveCuesFromNarration;
export const deriveSemanticCues = deriveCuesFromNarration;
export const deriveCues = deriveCuesFromNarration;

/**
 * Creates a validated CueManifest conforming to motion-kit CueManifest contract.
 */
export function createCueManifestFromNarration(
  words: WordTiming[],
  captionGroups: CaptionGroup[] = [],
  options: DeriveCuesOptions = {}
): CueManifest {
  const fps = options.fps ?? 30;
  const compositionId = options.compositionId ?? 'v3_composition';
  const cues = deriveCuesFromNarration(words, captionGroups, fps, options.emphasisWords);
  const maxCueFrame = cues.reduce((max, c) => Math.max(max, c.frame), 0);
  const durationInFrames = options.durationInFrames ?? Math.max(150, maxCueFrame + 30);

  const manifest: CueManifest = {
    compositionId,
    fps,
    durationInFrames,
    cues,
  };

  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  return manifest;
}

export const createCueManifest = createCueManifestFromNarration;
