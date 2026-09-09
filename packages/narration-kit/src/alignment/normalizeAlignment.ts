/**
 * packages/narration-kit/src/alignment/normalizeAlignment.ts
 * Normalizes alignment timestamps, cleans trailing punctuation, and ensures monotonic sequentiality.
 */

import { WordTiming } from './AlignmentProvider';

export function normalizeAlignment(rawTimings: WordTiming[], audioDurationSec?: number): WordTiming[] {
  if (!rawTimings || rawTimings.length === 0) return [];

  const normalized: WordTiming[] = [];

  for (let i = 0; i < rawTimings.length; i++) {
    const item = rawTimings[i];
    let start = Math.max(0, Math.round(item.start * 1000) / 1000);
    let end = Math.round(item.end * 1000) / 1000;

    // Ensure non-zero positive duration
    if (end <= start) {
      end = Math.round((start + 0.05) * 1000) / 1000;
    }

    // Monotonic boundary alignment
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
    }

    normalized.push({
      id: `word-${String(i + 1).padStart(3, '0')}`,
      text: item.text,
      normalizedText: (item.normalizedText || item.text).toLowerCase().replace(/[^a-z0-9']/g, ''),
      start,
      end,
      confidence: item.confidence !== undefined ? Math.round(item.confidence * 100) / 100 : 0.95,
    });
  }

  return normalized;
}
