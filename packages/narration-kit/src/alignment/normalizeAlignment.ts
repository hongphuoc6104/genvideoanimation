/**
 * packages/narration-kit/src/alignment/normalizeAlignment.ts
 * Normalizes alignment timestamps for Remotion progressive karaoke highlights,
 * cleans punctuation, enforces strictly non-overlapping intervals, and assigns canonical IDs.
 */

import { WordTiming } from './AlignmentProvider';

export function normalizeAlignment(rawTimings: WordTiming[], audioDurationSec?: number): WordTiming[] {
  if (!rawTimings || rawTimings.length === 0) return [];

  const normalized: WordTiming[] = [];

  for (let i = 0; i < rawTimings.length; i++) {
    const item = rawTimings[i];
    let start = Math.max(0, Math.round(item.start * 1000) / 1000);
    let end = Math.round(item.end * 1000) / 1000;

    // Ensure non-zero positive duration (at least 0.05s / ~1.5 frames @ 30fps)
    if (end <= start) {
      end = Math.round((start + 0.05) * 1000) / 1000;
    }

    // Monotonic boundary alignment: clamp start to previous end for visual highlight
    if (i > 0) {
      const prev = normalized[i - 1];
      if (start < prev.end) {
        start = prev.end;
        if (end <= start) {
          end = Math.round((start + 0.05) * 1000) / 1000;
        }
      }
    }

    if (audioDurationSec !== undefined && end > audioDurationSec) {
      end = Math.round(audioDurationSec * 1000) / 1000;
      if (start >= end) {
        start = Math.max(0, Math.round((end - 0.05) * 1000) / 1000);
      }
    }

    const word = item.word || item.text || '';
    let punctuation = item.punctuation;
    if (punctuation === undefined) {
      const punctMatch = word.match(/([.,!?;:'"]+)$/);
      punctuation = punctMatch ? punctMatch[1] : '';
    }

    let cleanWord = item.cleanWord;
    if (!cleanWord) {
      cleanWord = word
        .toLowerCase()
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
    }

    normalized.push({
      id: `w${i}`,
      word,
      cleanWord,
      punctuation,
      start,
      end,
      confidence: item.confidence !== undefined ? Math.round(item.confidence * 1000) / 1000 : 0.95,
      // Backward compatibility aliases
      text: word,
      normalizedText: cleanWord,
    });
  }

  return normalized;
}
