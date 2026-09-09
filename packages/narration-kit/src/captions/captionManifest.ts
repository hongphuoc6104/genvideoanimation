/**
 * packages/narration-kit/src/captions/captionManifest.ts
 * Type definitions and manifest helpers for Remotion captions.
 */

import { WordTiming } from '../alignment/AlignmentProvider';

export interface CaptionSegment {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
  words: WordTiming[];
  placement?: 'bottom' | 'lower-left' | 'lower-right' | 'top' | 'auto';
}

export interface CaptionManifest {
  version: '3.0';
  fps: number;
  totalDurationSec: number;
  captions: CaptionSegment[];
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
