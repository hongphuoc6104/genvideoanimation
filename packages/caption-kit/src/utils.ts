/**
 * packages/caption-kit/src/utils.ts
 * Mathematical calculations and frame resolution utilities for Karaoke Captions.
 */

import { CaptionsData, CaptionGroup } from './types';

/**
 * Calculates deterministic progressive highlight fill ratio [0.0, 1.0].
 * Handles zero-duration words and negative scrubbing frames safely.
 */
export function calculateProgressiveFill(
  frame: number,
  startFrame: number,
  endFrame: number
): number {
  if (startFrame >= endFrame) {
    return frame >= startFrame ? 1.0 : 0.0;
  }
  if (frame <= startFrame) return 0.0;
  if (frame >= endFrame) return 1.0;
  return (frame - startFrame) / (endFrame - startFrame);
}

/**
 * Calculates deterministic progressive highlight fill ratio [0.0, 1.0] for a CaptionWord object.
 */
export function calculateWordProgress(
  frame: number,
  word: { startFrame?: number; endFrame?: number; start?: number; end?: number },
  fps: number = 30
): number {
  const startFrame = word.startFrame !== undefined ? word.startFrame : Math.round((word.start ?? 0) * fps);
  const endFrame = word.endFrame !== undefined ? word.endFrame : Math.round((word.end ?? 0) * fps);
  return calculateProgressiveFill(frame, startFrame, endFrame);
}

/**
 * Computes sub-pixel precision CSS clip-path inset formatting.
 * At 0% progress, 100% is clipped from the right: inset(0 100.00% 0 0)
 * At 50% progress, 50% is clipped from the right: inset(0 50.00% 0 0)
 * At 100% progress, 0% is clipped: inset(0 0.00% 0 0)
 */
export function computeClipPathInset(progress: number): string {
  const clamped = Math.max(0, Math.min(1, progress));
  const rightInset = ((1 - clamped) * 100).toFixed(2);
  return `inset(0 ${rightInset}% 0 0)`;
}

/**
 * Safely extracts earliest word start frame and latest word end frame from a group.
 */
function extractWordBounds(g: any, fps: number = 30): { firstWordStart: number; lastWordEnd: number } | null {
  const words: any[] = [];
  if (Array.isArray(g.lines)) {
    for (const line of g.lines) {
      if (Array.isArray(line.words)) words.push(...line.words);
    }
  } else if (Array.isArray(g.words)) {
    words.push(...g.words);
  }
  if (words.length === 0) return null;
  const starts = words.map((w: any) => w.startFrame !== undefined ? w.startFrame : Math.round((w.start ?? 0) * fps));
  const ends = words.map((w: any) => w.endFrame !== undefined ? w.endFrame : Math.round((w.end ?? 0) * fps));
  return {
    firstWordStart: Math.min(...starts),
    lastWordEnd: Math.max(...ends),
  };
}

/**
 * Isolates the exact active CaptionGroup for the given composition frame.
 * Accepts polymorphic input: CaptionsData or CaptionGroup[].
 * Guarantees zero-hang boundary handoff: no group lingers once next group's words begin.
 */
export function resolveActiveGroup(
  captions: CaptionsData | CaptionGroup[] | any | null | undefined,
  currentFrame: number
): CaptionGroup | null {
  if (!captions) {
    return null;
  }
  const groups = Array.isArray(captions) ? captions : captions.groups;
  if (!Array.isArray(groups) || groups.length === 0) {
    return null;
  }

  const rawItem = groups.find((g: any, idx: number) => {
    const nextG = groups[idx + 1];
    const bounds = extractWordBounds(g);
    const nextBounds = nextG ? extractWordBounds(nextG) : null;

    // Effective start: if words exist, cannot start later than words[0].startFrame
    let effectiveStart = g.startFrame;
    if (bounds) {
      effectiveStart = Math.min(g.startFrame, bounds.firstWordStart);
    }

    // Effective end: must hand off before next group's words begin, or cap at 10 frames post-speech
    let effectiveEnd = g.endFrame;
    if (bounds) {
      effectiveEnd = Math.min(g.endFrame, bounds.lastWordEnd + 10);
    }
    if (nextBounds) {
      // If the next group's speech has started, g must yield immediately
      effectiveEnd = Math.min(effectiveEnd, nextBounds.firstWordStart);
    }

    // Prioritize next group at exact speech onset
    if (nextBounds && currentFrame >= nextBounds.firstWordStart) {
      return false;
    }
    if (nextG && currentFrame >= effectiveEnd && nextG.startFrame <= effectiveEnd) {
      return false;
    }

    return currentFrame >= effectiveStart && currentFrame <= effectiveEnd;
  });
  if (!rawItem) {
    return null;
  }

  // If already a canonical CaptionGroup with box and lines, return it directly
  if (rawItem.box && Array.isArray(rawItem.lines)) {
    return rawItem as CaptionGroup;
  }

  // Normalize simple segment/word array into canonical CaptionGroup
  const words = (rawItem.words || []).map((w: any, idx: number) => ({
    id: w.id || `w_${idx}`,
    word: w.word || w.text || '',
    start: w.start ?? ((w.startFrame ?? 0) / 30),
    end: w.end ?? ((w.endFrame ?? 0) / 30),
    startFrame: w.startFrame,
    endFrame: w.endFrame,
    cleanWord: w.cleanWord || w.word,
  }));

  const lines = rawItem.lines || [
    {
      text: rawItem.text || words.map((w: any) => w.word).join(' '),
      words,
    },
  ];

  return {
    id: rawItem.id || 'group_auto',
    startFrame: rawItem.startFrame,
    endFrame: rawItem.endFrame,
    startTime: rawItem.startTime ?? (rawItem.startFrame / 30),
    endTime: rawItem.endTime ?? (rawItem.endFrame / 30),
    position: rawItem.position || 'bottom',
    box: rawItem.box || {
      x: 80,
      y: 1480,
      width: 920,
      height: 180,
    },
    lines,
  };
}

