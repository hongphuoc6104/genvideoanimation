import { StrokeRevealResult } from './types';
import { clamp } from './bezierMath';

/**
 * Synchronized stroke reveal coordinator.
 * Computes strokeDasharray and strokeDashoffset for SVG path animation.
 *
 * @param totalLength Total geometric arc length of the stroke
 * @param revealProgress Reveal progress in [0, 1]
 * @returns Stroke reveal styling attributes
 */
export function strokeReveal(totalLength: number, revealProgress: number): StrokeRevealResult {
  const safeLength = Math.max(0, totalLength);
  const clampedProgress = clamp(revealProgress, 0, 1);
  const strokeDashoffset = Math.max(0, safeLength * (1 - clampedProgress));

  return {
    strokeDasharray: `${safeLength} ${safeLength}`,
    strokeDashoffset,
    pathLength: safeLength,
  };
}

/**
 * Backward-compatible normalized reveal (pathLength = 1).
 */
export function pathReveal(progress: number): {
  pathLength: 1;
  strokeDasharray: 1;
  strokeDashoffset: number;
} {
  const c = clamp(progress, 0, 1);
  return {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - c,
  };
}

export function quadraticToPathD(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number]
): string {
  return `M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`;
}

export function cubicToPathD(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): string {
  return `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
}
