/**
 * MOTIVATED TRANSITIONS
 * Transitions driven by narrative purpose and geometric transformation
 * rather than simple opacity crossfades.
 */

import { clamp, overshoot } from './motion-primitives';
import { heavy, snappy } from './motion-profiles';

export interface MorphState {
  progress: number; // 0 to 1
  scale: number;
  rotation: number;
  glow: number;
}

/**
 * Geometric morph transition:
 * Focal object grows / transforms directly into the starting object of the next shot.
 */
export function morphTransition(
  frame: number,
  startFrame: number,
  durationFrames = 24
): MorphState {
  const rel = frame - startFrame;
  if (rel < 0) return { progress: 0, scale: 1, rotation: 0, glow: 0 };

  const rawT = clamp(rel / durationFrames);
  const progress = heavy(rawT);
  const scale = 1 + overshoot(rawT, 0.15) * 0.4;
  const rotation = progress * 45;
  const glow = Math.sin(rawT * Math.PI);

  return {
    progress,
    scale,
    rotation,
    glow,
  };
}

/**
 * Motivated Iris transition:
 * Expands or contracts a circular clip-path around the viewer's current focal point.
 */
export function motivatedIris(
  frame: number,
  startFrame: number,
  durationFrames = 20,
  options?: {
    focalPoint?: [number, number];
    maxRadius?: number;
    direction?: 'in' | 'out';
  }
): { cx: number; cy: number; radius: number; opacity: number } {
  const rel = frame - startFrame;
  const dir = options?.direction ?? 'out';
  const focal = options?.focalPoint ?? [960, 540];
  const maxR = options?.maxRadius ?? 1400;

  if (rel < 0) {
    return {
      cx: focal[0],
      cy: focal[1],
      radius: dir === 'out' ? 0 : maxR,
      opacity: dir === 'out' ? 0 : 1,
    };
  }

  const rawT = clamp(rel / durationFrames);
  const t = snappy(rawT);
  const radius = dir === 'out' ? t * maxR : (1 - t) * maxR;

  return {
    cx: focal[0],
    cy: focal[1],
    radius,
    opacity: dir === 'out' ? Math.min(1, rawT * 3) : 1 - rawT,
  };
}
