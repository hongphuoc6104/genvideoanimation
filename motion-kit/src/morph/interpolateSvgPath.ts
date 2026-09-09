import React from 'react';
import { MorphOptions, PathMorphProps, Point2D } from './types';
import { samplePathArcLength } from './samplePathArcLength';
import { optimizeVertexPhaseShift } from './optimizeVertexPhaseShift';

/**
 * Continuous geometric SVG path morphing.
 * Resamples both paths into equidistant vertices, optimizes cyclic alignment,
 * and performs linear vertex-to-vertex coordinate interpolation.
 *
 * @param pathA Initial SVG path string
 * @param pathB Target SVG path string
 * @param progress Transition progress in [0, 1]
 * @param options Configuration options
 * @returns Interpolated SVG path 'd' string
 */
export function interpolateSvgPath(
  pathA: string,
  pathB: string,
  progress: number,
  options?: MorphOptions
): string {
  const sampleCount = options?.sampleCount ?? 64;
  const precision = options?.precision ?? 2;
  const closed = options?.closed ?? true;
  const wobbleAmp = options?.wobble ?? 0;

  // Strict boundary progress clamping (TEST-T2-F14-01)
  const t = Math.max(0, Math.min(1, progress));

  const verticesA = samplePathArcLength(pathA, sampleCount);
  const verticesB = samplePathArcLength(pathB, sampleCount);

  // Align vertices of B relative to A
  const phaseResult = optimizeVertexPhaseShift(verticesB, verticesA);
  const N = sampleCount;
  const rawB = phaseResult.reversed
    ? Array.from({ length: N }, (_, i) => verticesB[(N - 1 - i) % N])
    : verticesB;
  const shift = phaseResult.shiftIndex;

  const wobbleFactor = wobbleAmp > 0 ? Math.sin(t * Math.PI) * wobbleAmp : 0;

  const points: Point2D[] = [];
  for (let i = 0; i < N; i++) {
    const pA = verticesA[i];
    const pB = rawB[(i + shift) % N];

    let wx = 0;
    let wy = 0;
    if (wobbleFactor > 0) {
      const cx = (pA[0] + pB[0]) * 0.5;
      const cy = (pA[1] + pB[1]) * 0.5;
      const angle = Math.atan2(cy, cx);
      wx = Math.cos(angle * 3 + t * 8) * wobbleFactor * 12;
      wy = Math.sin(angle * 3 + t * 8) * wobbleFactor * 12;
    }

    const x = (1 - t) * pA[0] + t * pB[0] + wx;
    const y = (1 - t) * pA[1] + t * pB[1] + wy;
    points.push([x, y]);
  }

  // Format SVG path string
  const dParts: string[] = [`M ${points[0][0].toFixed(precision)} ${points[0][1].toFixed(precision)}`];
  for (let i = 1; i < points.length; i++) {
    dParts.push(`L ${points[i][0].toFixed(precision)} ${points[i][1].toFixed(precision)}`);
  }
  if (closed) {
    dParts.push('Z');
  }

  return dParts.join(' ');
}

/**
 * PathMorph React Component
 * Renders an SVG path dynamically morphed between two shapes.
 */
export const PathMorph: React.FC<PathMorphProps> = ({
  from,
  to,
  progress,
  sampleCount,
  precision,
  closed,
  wobble,
  ...svgProps
}) => {
  const d = interpolateSvgPath(from, to, progress, {
    sampleCount,
    precision,
    closed,
    wobble,
  });

  return React.createElement('path', { d, ...svgProps });
};
