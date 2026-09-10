/**
 * packages/narration-kit/src/captions/captionManifest.ts
 * Captions manifest helpers and backward-compatible interfaces.
 */

import { WordTiming } from '../alignment/AlignmentProvider';
import { CaptionGroup, CaptionsManifest, CaptionPosition } from './types';

// Backward compatibility alias
export interface CaptionSegment {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
  words: WordTiming[];
  placement?: CaptionPosition;
}

export interface CaptionManifest {
  version: '3.0' | '1.0.0';
  fps: number;
  totalDurationSec?: number;
  captions?: CaptionSegment[];
  groups?: CaptionGroup[];
}

export function getActiveCaption(
  captions: CaptionSegment[],
  timeSec: number
): CaptionSegment | null {
  for (const seg of captions) {
    if (timeSec >= seg.start && timeSec <= seg.end) {
      return seg;
    }
  }
  return null;
}

export function resolveActiveGroup(
  manifest: CaptionsManifest | CaptionGroup[] | null | undefined,
  currentFrame: number
): CaptionGroup | null {
  if (!manifest) {
    return null;
  }
  const groups = Array.isArray(manifest) ? manifest : manifest.groups;
  if (!Array.isArray(groups) || groups.length === 0) {
    return null;
  }
  return groups.find(
    (g) => currentFrame >= g.startFrame && currentFrame <= g.endFrame
  ) || null;
}
