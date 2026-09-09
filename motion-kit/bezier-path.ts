/**
 * BEZIER PATH-FOLLOWING & REVEAL HELPERS
 * Exact mathematical trajectory calculations for packets and particles traveling along curves.
 * Enforces true mathematical path adherence (coordinates and tangent vectors).
 */

import { clamp } from './motion-primitives';

export type Point2D = [number, number];

export interface BezierTangent {
  vx: number;
  vy: number;
  speed: number;
  angleRad: number;
  angleDeg: number;
}

export interface PacketTravelState {
  x: number;
  y: number;
  angleDeg: number;
  angleRad: number;
  speed: number;
  transform: string;
}

/**
 * Calculates point along a quadratic Bezier curve at parameter t (0 to 1).
 * B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
 */
export function quadraticBezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): Point2D {
  const c = clamp(t);
  const u = 1 - c;
  const tt = c * c;
  const uu = u * u;

  const x = uu * p0[0] + 2 * u * c * p1[0] + tt * p2[0];
  const y = uu * p0[1] + 2 * u * c * p1[1] + tt * p2[1];

  return [x, y];
}

/**
 * Calculates velocity and tangent heading along a quadratic Bezier curve at parameter t.
 * B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
 */
export function quadraticBezierTangent(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): BezierTangent {
  const c = clamp(t);
  const u = 1 - c;

  const vx = 2 * u * (p1[0] - p0[0]) + 2 * c * (p2[0] - p1[0]);
  const vy = 2 * u * (p1[1] - p0[1]) + 2 * c * (p2[1] - p1[1]);

  const speed = Math.hypot(vx, vy);
  const angleRad = Math.atan2(vy, vx);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { vx, vy, speed, angleRad, angleDeg };
}

/**
 * Calculates point along a cubic Bezier curve at parameter t (0 to 1).
 * B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3
 */
export function cubicBezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const c = clamp(t);
  const u = 1 - c;
  const tt = c * c;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * c;

  const x = uuu * p0[0] + 3 * uu * c * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
  const y = uuu * p0[1] + 3 * uu * c * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];

  return [x, y];
}

/**
 * Calculates velocity and tangent heading along a cubic Bezier curve at parameter t.
 * B'(t) = 3(1-t)^2 * (P1 - P0) + 6(1-t)t * (P2 - P1) + 3t^2 * (P3 - P2)
 */
export function cubicBezierTangent(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): BezierTangent {
  const c = clamp(t);
  const u = 1 - c;
  const uu = u * u;
  const tt = c * c;

  const vx =
    3 * uu * (p1[0] - p0[0]) +
    6 * u * c * (p2[0] - p1[0]) +
    3 * tt * (p3[0] - p2[0]);
  const vy =
    3 * uu * (p1[1] - p0[1]) +
    6 * u * c * (p2[1] - p1[1]) +
    3 * tt * (p3[1] - p2[1]);

  const speed = Math.hypot(vx, vy);
  const angleRad = Math.atan2(vy, vx);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { vx, vy, speed, angleRad, angleDeg };
}

export type BezierCurveDef =
  | { type: 'quadratic'; p0: Point2D; p1: Point2D; p2: Point2D }
  | { type: 'cubic'; p0: Point2D; p1: Point2D; p2: Point2D; p3: Point2D };

/**
 * Calculates packet travel state along any Bezier curve.
 * Automatically aligns packet heading to the tangent vector.
 */
export function bezierPathPacketTravel(
  curve: BezierCurveDef,
  progress: number,
  options?: {
    rotateAlongPath?: boolean;
    offsetAngleDeg?: number;
  }
): PacketTravelState {
  const rotate = options?.rotateAlongPath !== false;
  const offsetAngle = options?.offsetAngleDeg ?? 0;

  let pos: Point2D;
  let tan: BezierTangent;

  if (curve.type === 'quadratic') {
    pos = quadraticBezierPoint(curve.p0, curve.p1, curve.p2, progress);
    tan = quadraticBezierTangent(curve.p0, curve.p1, curve.p2, progress);
  } else {
    pos = cubicBezierPoint(curve.p0, curve.p1, curve.p2, curve.p3, progress);
    tan = cubicBezierTangent(curve.p0, curve.p1, curve.p2, curve.p3, progress);
  }

  const heading = rotate ? tan.angleDeg + offsetAngle : offsetAngle;
  const rotStr = heading ? ` rotate(${heading})` : '';
  const transform = `translate(${pos[0]}, ${pos[1]})${rotStr}`;

  return {
    x: pos[0],
    y: pos[1],
    angleDeg: heading,
    angleRad: tan.angleRad,
    speed: tan.speed,
    transform,
  };
}

/**
 * Calculates path reveal stroke dash parameters for SVG paths.
 * Normalizes using pathLength = 1 for mathematical precision across all viewport scales.
 */
export function pathReveal(progress: number): {
  pathLength: 1;
  strokeDasharray: 1;
  strokeDashoffset: number;
} {
  const c = clamp(progress);
  return {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - c,
  };
}

/**
 * Formats a quadratic Bezier curve as an SVG path 'd' string.
 */
export function quadraticToPathD(p0: Point2D, p1: Point2D, p2: Point2D): string {
  return `M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`;
}

/**
 * Formats a cubic Bezier curve as an SVG path 'd' string.
 */
export function cubicToPathD(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): string {
  return `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
}
