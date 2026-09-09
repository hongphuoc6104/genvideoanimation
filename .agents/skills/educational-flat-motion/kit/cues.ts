/**
 * CENTRAL CUE MANIFEST
 * Single source-of-truth for both animation frames and audio synthesis events.
 */

export interface CueItem {
  frame: number;
  timeSec: number;
  label: string;
  type: 'narrative' | 'sfx' | 'music_hit' | 'action';
  description?: string;
}

export function createCueManifest(fps = 30, cues: Omit<CueItem, 'timeSec'>[]): CueItem[] {
  return cues.map((c) => ({
    ...c,
    timeSec: Number((c.frame / fps).toFixed(3)),
  }));
}

/**
 * Checks if current frame matches or is within window of a cue
 */
export function isNearCue(frame: number, cueFrame: number, window = 1): boolean {
  return Math.abs(frame - cueFrame) <= window;
}
