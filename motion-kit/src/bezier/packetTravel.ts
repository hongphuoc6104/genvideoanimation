import { Point2D, BezierLUT, PacketTravelState, BezierTangent, unpackPoint } from './types';
import { createBezierLUT, invertLUTDistance } from './bezierLUT';
import { quadraticBezierPoint, cubicBezierPoint, clamp } from './bezierMath';
import { quadraticBezierTangent, cubicBezierTangent } from './bezierTangent';

/**
 * Evaluates exact packet travel kinematics along a Bezier curve.
 * Parameterized by arc length for constant physical speed.
 *
 * Supports dual invocation patterns:
 *   1. evaluatePacketTravel(curve: Point2D[], progress: number, lut?: BezierLUT)
 *   2. evaluatePacketTravel(lut: BezierLUT, distanceOrProgress: number)
 */
export function evaluatePacketTravel(
  arg1: Point2D[] | BezierLUT,
  arg2: number,
  arg3?: BezierLUT
): PacketTravelState {
  let lut: BezierLUT;
  let points: Point2D[];
  let targetDist: number;
  let progress: number;

  const isLUT = (obj: any): obj is BezierLUT =>
    obj && typeof obj === 'object' && Array.isArray(obj.samples) && typeof obj.totalLength === 'number';

  if (isLUT(arg1)) {
    lut = arg1;
    points = lut.controlPoints;
    const val = arg2;
    if (val > 1.0) {
      targetDist = clamp(val, 0, lut.totalLength);
      progress = lut.totalLength > 0 ? targetDist / lut.totalLength : 0;
    } else {
      progress = clamp(val, 0, 1);
      targetDist = progress * lut.totalLength;
    }
  } else {
    points = arg1;
    progress = clamp(arg2, 0, 1);
    lut = isLUT(arg3) ? arg3 : createBezierLUT(points, 100);
    targetDist = progress * lut.totalLength;
  }

  // Check degenerate zero-length curve (TEST-T2-F17-01)
  let isZeroLength = lut.totalLength <= 1e-9;
  if (!isZeroLength && points.length >= 2) {
    const [x0, y0] = unpackPoint(points[0]);
    let allSame = true;
    for (let i = 1; i < points.length; i++) {
      const [xi, yi] = unpackPoint(points[i]);
      if (Math.hypot(xi - x0, yi - y0) > 1e-9) {
        allSame = false;
        break;
      }
    }
    if (allSame) isZeroLength = true;
  }

  if (isZeroLength) {
    const pt = points.length === 3
      ? quadraticBezierPoint(points[0], points[1], points[2], 0)
      : cubicBezierPoint(points[0], points[1], points[2], points[3] ?? points[2], 0);

    const transform = `translate(${pt.x}, ${pt.y}) rotate(0)`;
    return {
      coordinate: pt,
      x: pt.x,
      y: pt.y,
      tangentAngle: 0.0,
      angle: 0.0,
      angleDeg: 0.0,
      rotationDeg: 0.0,
      angleRad: 0.0,
      velocity: 0.0,
      speed: 0.0,
      vx: 0.0,
      vy: 0.0,
      t: 0.0,
      arcProgress: progress,
      distance: 0.0,
      transform,
    };
  }

  const t = invertLUTDistance(lut, targetDist);

  const pt = points.length === 3
    ? quadraticBezierPoint(points[0], points[1], points[2], t)
    : cubicBezierPoint(points[0], points[1], points[2], points[3], t);

  const tan: BezierTangent = points.length === 3
    ? quadraticBezierTangent(points[0], points[1], points[2], t)
    : cubicBezierTangent(points[0], points[1], points[2], points[3], t);

  const transform = `translate(${pt.x}, ${pt.y}) rotate(${tan.angleDeg})`;

  return {
    coordinate: pt,
    x: pt.x,
    y: pt.y,
    tangentAngle: tan.angleDeg,
    angle: tan.angleDeg,
    angleDeg: tan.angleDeg,
    rotationDeg: tan.angleDeg,
    angleRad: tan.angleRad,
    velocity: tan.speed,
    speed: tan.speed,
    vx: tan.vx,
    vy: tan.vy,
    t,
    arcProgress: progress,
    distance: targetDist,
    transform,
  };
}

/**
 * Backward-compatible helper matching legacy bezier-path.ts signature.
 */
export function bezierPathPacketTravel(
  curve: { type: 'quadratic' | 'cubic'; p0: Point2D; p1: Point2D; p2: Point2D; p3?: Point2D },
  progress: number,
  options?: { rotateAlongPath?: boolean; offsetAngleDeg?: number }
): PacketTravelState {
  const pts = curve.type === 'quadratic'
    ? [curve.p0, curve.p1, curve.p2]
    : [curve.p0, curve.p1, curve.p2, curve.p3!];
  const state = evaluatePacketTravel(pts, progress);
  const rotate = options?.rotateAlongPath !== false;
  const offset = options?.offsetAngleDeg ?? 0;
  const heading = rotate ? state.tangentAngle + offset : offset;
  const rotStr = heading ? ` rotate(${heading})` : '';
  const transform = `translate(${state.x}, ${state.y})${rotStr}`;
  return {
    ...state,
    angleDeg: heading,
    rotationDeg: heading,
    angle: heading,
    transform,
  };
}
