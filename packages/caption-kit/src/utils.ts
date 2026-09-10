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
 * Isolates the exact active CaptionGroup for the given composition frame.
 * Accepts polymorphic input: CaptionsData or CaptionGroup[].
 * Returns null if the frame falls during a silence gap, before speech starts,
 * or after speech ends.
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
  const rawItem = groups.find(
    (g: any) => currentFrame >= g.startFrame && currentFrame <= g.endFrame
  );
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
      x: 72,
      y: 1410,
      width: 936,
      height: 220,
    },
    lines,
  };
}

