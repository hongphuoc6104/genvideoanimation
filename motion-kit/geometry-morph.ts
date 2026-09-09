/**
 * REAL OBJECT & GEOMETRY MORPHING MACHINERY
 * Continuous geometric vertex interpolation for 2D vector shapes.
 * Eliminates faux conditional swapping (progress < 0.5 ? A : B).
 * Resamples arbitrary shapes to equal-length vertex rings and computes smooth transitions.
 */

import { clamp, overshoot } from './motion-primitives';
import { EasingFunction, heavy } from './motion-profiles';
import { Point2D } from './bezier-path';

export type { Point2D };

export interface MorphShape {
  points: Point2D[];
  closed?: boolean;
}

/**
 * Resamples any polygon to exactly `targetCount` equidistant points along its perimeter.
 */
export function resamplePolygon(points: Point2D[], targetCount = 64): Point2D[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(targetCount).fill(points[0]);

  // 1. Calculate cumulative perimeter lengths
  const cumLengths: number[] = [0];
  let totalLength = 0;

  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next[0] - points[i][0];
    const dy = next[1] - points[i][1];
    const dist = Math.hypot(dx, dy);
    totalLength += dist;
    cumLengths.push(totalLength);
  }

  if (totalLength === 0) {
    return Array(targetCount).fill(points[0]);
  }

  // 2. Sample at uniform intervals
  const resampled: Point2D[] = [];
  const step = totalLength / targetCount;

  for (let s = 0; s < targetCount; s++) {
    const targetDist = s * step;

    // Find segment containing targetDist
    let segIdx = 0;
    while (segIdx < points.length && cumLengths[segIdx + 1] < targetDist) {
      segIdx++;
    }

    const pA = points[segIdx % points.length];
    const pB = points[(segIdx + 1) % points.length];
    const segLen = cumLengths[segIdx + 1] - cumLengths[segIdx];
    const localT = segLen === 0 ? 0 : (targetDist - cumLengths[segIdx]) / segLen;

    const x = pA[0] + (pB[0] - pA[0]) * localT;
    const y = pA[1] + (pB[1] - pA[1]) * localT;
    resampled.push([x, y]);
  }

  return resampled;
}

/**
 * Circle shape generator with `sampleCount` vertices.
 */
export function createCirclePoints(cx: number, cy: number, radius: number, sampleCount = 64): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const angle = (i / sampleCount) * Math.PI * 2 - Math.PI / 2;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

/**
 * Rounded rectangle / document shape generator.
 */
export function createRectanglePoints(
  x: number,
  y: number,
  w: number,
  h: number,
  rx = 16,
  sampleCount = 64
): Point2D[] {
  // Define 4 corners with arcs
  const raw: Point2D[] = [
    [x + rx, y],
    [x + w - rx, y],
    [x + w, y + rx],
    [x + w, y + h - rx],
    [x + w - rx, y + h],
    [x + rx, y + h],
    [x, y + h - rx],
    [x, y + rx],
  ];
  return resamplePolygon(raw, sampleCount);
}

/**
 * Mechanical gear / cog shape generator.
 */
export function createGearPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  teeth = 8,
  sampleCount = 64
): Point2D[] {
  const raw: Point2D[] = [];
  const steps = teeth * 4;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const isTooth = i % 4 === 1 || i % 4 === 2;
    const r = isTooth ? outerRadius : innerRadius;
    raw.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }

  return resamplePolygon(raw, sampleCount);
}

/**
 * Star / badge shape generator.
 */
export function createStarPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  pointsCount = 5,
  sampleCount = 64
): Point2D[] {
  const raw: Point2D[] = [];
  const totalSteps = pointsCount * 2;

  for (let i = 0; i < totalSteps; i++) {
    const angle = (i / totalSteps) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    raw.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }

  return resamplePolygon(raw, sampleCount);
}

/**
 * True geometric vertex morph:
 * Computes 1-to-1 vertex interpolation between two geometry point sets.
 * Includes optional elastic organic wobble for biological or energetic materials.
 */
export function interpolateGeometry(
  shapeA: Point2D[],
  shapeB: Point2D[],
  progress: number,
  options?: {
    wobble?: number;      // Amplitude of elastic oscillation during midpoint (0 to 1)
    easing?: EasingFunction;
    vertexCount?: number;
  }
): Point2D[] {
  const targetCount = options?.vertexCount ?? 64;
  const polyA = shapeA.length === targetCount ? shapeA : resamplePolygon(shapeA, targetCount);
  const polyB = shapeB.length === targetCount ? shapeB : resamplePolygon(shapeB, targetCount);

  const rawT = clamp(progress);
  const easeFn = options?.easing ?? heavy;
  const t = easeFn(rawT);

  // Elastic wobble peaks at t = 0.5
  const wobbleAmp = options?.wobble ?? 0;
  const wobbleFactor = Math.sin(rawT * Math.PI) * wobbleAmp;

  const result: Point2D[] = [];

  for (let i = 0; i < targetCount; i++) {
    const pA = polyA[i];
    const pB = polyB[i];

    // Center of shape for radial wobble displacement
    const cx = (pA[0] + pB[0]) * 0.5;
    const cy = (pA[1] + pB[1]) * 0.5;
    const angle = Math.atan2(cy, cx);

    const wobbleX = Math.cos(angle * 3 + rawT * 8) * wobbleFactor * 12;
    const wobbleY = Math.sin(angle * 3 + rawT * 8) * wobbleFactor * 12;

    const x = pA[0] * (1 - t) + pB[0] * t + wobbleX;
    const y = pA[1] * (1 - t) + pB[1] * t + wobbleY;

    result.push([x, y]);
  }

  return result;
}

/**
 * Converts a series of 2D points into a smooth closed SVG path 'd' attribute using Catmull-Rom or cubic Bezier curves.
 */
export function pointsToSvgPath(points: Point2D[], closed = true): string {
  if (points.length < 2) return '';

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;

  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];

    // Catmull-Rom to Cubic Bezier control points conversion
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }

  if (closed) {
    d += ' Z';
  }

  return d;
}
