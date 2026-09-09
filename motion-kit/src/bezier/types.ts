/**
 * Types and interfaces for Bezier Geometry and Motion Calculus.
 */

export type PointTuple = [number, number];
export type PointObject = { x: number; y: number };
export type Point2D = PointTuple | PointObject;

export interface EvaluatedPoint extends Array<number> {
  0: number;
  1: number;
  x: number;
  y: number;
  length: 2;
}

export function createPoint(x: number, y: number): EvaluatedPoint {
  const pt = [x, y] as unknown as EvaluatedPoint;
  pt.x = x;
  pt.y = y;
  return pt;
}

export function unpackPoint(p: Point2D): [number, number] {
  if (Array.isArray(p)) return [p[0], p[1]];
  return [p.x, p.y];
}

export interface BezierVelocityResult extends Array<number> {
  0: number; // vx
  1: number; // vy
  x: number; // vx
  y: number; // vy
  vx: number;
  vy: number;
  speed: number;
  length: 2;
}

export function createVelocityResult(vx: number, vy: number): BezierVelocityResult {
  const v = [vx, vy] as unknown as BezierVelocityResult;
  v.x = vx;
  v.y = vy;
  v.vx = vx;
  v.vy = vy;
  v.speed = Math.hypot(vx, vy);
  return v;
}

export interface BezierTangent {
  vx: number;
  vy: number;
  speed: number;
  angleRad: number;
  angleDeg: number;
}

export interface BezierLUTSample {
  t: number;
  distance: number;
  point: EvaluatedPoint;
}

export interface BezierLUT {
  totalLength: number;
  length: number; // Alias for totalLength
  samples: BezierLUTSample[];
  controlPoints: Point2D[];
}

export interface PacketTravelState {
  coordinate: EvaluatedPoint;
  x: number;
  y: number;
  tangentAngle: number; // in degrees
  angle: number;        // alias in degrees
  angleDeg: number;     // alias in degrees
  rotationDeg: number;  // alias in degrees
  angleRad: number;     // in radians
  velocity: number;     // speed
  speed: number;        // speed alias
  vx: number;
  vy: number;
  t: number;            // curve parameter t in [0, 1]
  arcProgress: number;  // normalized arc distance in [0, 1]
  distance: number;     // absolute arc distance
  transform: string;    // SVG transform helper
}

export interface StrokeRevealResult {
  strokeDasharray: string;
  strokeDashoffset: number;
  pathLength?: number;
}
