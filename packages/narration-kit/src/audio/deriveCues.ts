/**
 * packages/narration-kit/src/audio/deriveCues.ts
 * Derives animation and semantic cues from narration alignment and captions
 * without conflating authoritative word timing with animation cues.
 */

import { WordTiming } from '../alignment/AlignmentProvider';
import { CaptionGroup } from '../captions/types';

export interface DerivedCue {
  id: string;
  frame: number;
  timeSec: number;
  category: 'narrative' | 'action' | 'ui_accent';
  type: 'WORD_EMPHASIS' | 'SENTENCE_START' | 'SENTENCE_END';
  label: string;
  description?: string;
  durationFrames?: number;
}

export function deriveCuesFromNarration(
  words: WordTiming[],
  captionGroups: CaptionGroup[],
  fps: number = 30,
  emphasisWords: string[] = []
): DerivedCue[] {
  const cues: DerivedCue[] = [];
  const lowerEmphasis = new Set(emphasisWords.map((w) => w.toLowerCase()));
  let cueId = 1;

  // 1. Derive SENTENCE_START and SENTENCE_END from caption groups
  for (const cap of captionGroups) {
    const textSnippet = cap.lines.map((l) => l.text).join(' ');
    cues.push({
      id: `cue-${String(cueId++).padStart(3, '0')}`,
      frame: cap.startFrame,
      timeSec: cap.startTime,
      category: 'narrative',
      type: 'SENTENCE_START',
      label: `Caption start: "${textSnippet.slice(0, 20)}..."`,
      durationFrames: Math.max(1, cap.endFrame - cap.startFrame),
    });

    cues.push({
      id: `cue-${String(cueId++).padStart(3, '0')}`,
      frame: cap.endFrame,
      timeSec: cap.endTime,
      category: 'narrative',
      type: 'SENTENCE_END',
      label: `Caption end: "${textSnippet.slice(0, 20)}..."`,
    });
  }

  // 2. Derive WORD_EMPHASIS from configured emphasis_words
  for (const w of words) {
    const clean = (w.normalizedText || w.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && lowerEmphasis.has(clean)) {
      const startFrame = Math.round(w.start * fps);
      const endFrame = Math.round(w.end * fps);
      cues.push({
        id: `cue-${String(cueId++).padStart(3, '0')}`,
        frame: startFrame,
        timeSec: w.start,
        category: 'ui_accent',
        type: 'WORD_EMPHASIS',
        label: `Emphasize: "${w.text}"`,
        durationFrames: Math.max(1, endFrame - startFrame),
      });
    }
  }

  return cues.sort((a, b) => a.frame - b.frame);
}
