import { Point2D, BezierTangent, BezierVelocityResult, createVelocityResult, unpackPoint } from './types';
import { clamp } from './bezierMath';

/**
 * Evaluates analytical first derivative and tangent properties for a quadratic Bezier:
 * B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
 */
export function quadraticBezierTangent(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): BezierTangent {
  const c = clamp(t, 0, 1);
  const u = 1 - c;

  const [x0, y0] = unpackPoint(p0);
  const [x1, y1] = unpackPoint(p1);
  const [x2, y2] = unpackPoint(p2);

  const vx = 2 * u * (x1 - x0) + 2 * c * (x2 - x1);
  const vy = 2 * u * (y1 - y0) + 2 * c * (y2 - y1);
  const speed = Math.hypot(vx, vy);

  let angleRad = Math.atan2(vy, vx);
  if (speed < 1e-9) {
    // Degeneracy or cusp fallback: look ahead along chord
    const dx = x2 - x0;
    const dy = y2 - y0;
    angleRad = Math.hypot(dx, dy) > 1e-9 ? Math.atan2(dy, dx) : 0;
  }
  const angleDeg = (angleRad * 180) / Math.PI;

  return { vx, vy, speed, angleRad, angleDeg };
}

/**
 * Evaluates analytical first derivative and tangent properties for a cubic Bezier:
 * B'(t) = 3(1-t)^2(P1 - P0) + 6(1-t)t(P2 - P1) + 3t^2(P3 - P2)
 */
export function cubicBezierTangent(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): BezierTangent {
  const c = clamp(t, 0, 1);
  const u = 1 - c;

  const [x0, y0] = unpackPoint(p0);
  const [x1, y1] = unpackPoint(p1);
  const [x2, y2] = unpackPoint(p2);
  const [x3, y3] = unpackPoint(p3);

  const vx = 3 * u * u * (x1 - x0) + 6 * u * c * (x2 - x1) + 3 * c * c * (x3 - x2);
  const vy = 3 * u * u * (y1 - y0) + 6 * u * c * (y2 - y1) + 3 * c * c * (y3 - y2);
  const speed = Math.hypot(vx, vy);

  let angleRad = Math.atan2(vy, vx);

  if (speed < 1e-9) {
    // Handle cusp singularity (e.g. P0 == P1 at t=0, TEST-T2-F16-01)
    if (c <= 0.5) {
      const dx2 = x2 - x0;
      const dy2 = y2 - y0;
      if (Math.hypot(dx2, dy2) > 1e-9) {
        angleRad = Math.atan2(dy2, dx2);
      } else {
        const dx3 = x3 - x0;
        const dy3 = y3 - y0;
        angleRad = Math.hypot(dx3, dy3) > 1e-9 ? Math.atan2(dy3, dx3) : 0;
      }
    } else {
      const dx2 = x3 - x1;
      const dy2 = y3 - y1;
      if (Math.hypot(dx2, dy2) > 1e-9) {
        angleRad = Math.atan2(dy2, dx2);
      } else {
        const dx0 = x3 - x0;
        const dy0 = y3 - y0;
        angleRad = Math.hypot(dx0, dy0) > 1e-9 ? Math.atan2(dy0, dx0) : 0;
      }
    }
  }

  const angleDeg = (angleRad * 180) / Math.PI;
  return { vx, vy, speed, angleRad, angleDeg };
}

function parsePointAndTArgs(args: any[]): { points: Point2D[]; t: number } {
  if (Array.isArray(args[0]) && typeof args[1] === 'number') {
    return { points: args[0], t: args[1] };
  }
  const t = args[args.length - 1];
  const points = args.slice(0, args.length - 1);
  return { points, t };
}

/**
 * Polymorphic velocity evaluator along a Bezier curve.
 * Accepts:
 *   - bezierVelocity(curve: Point2D[], t: number)
 *   - bezierVelocity(p0, p1, p2, [p3,] t)
 * Evaluates first derivative vector and speed. Clamps t outside [0, 1] to boundaries.
 */
export function bezierVelocity(...args: any[]): BezierVelocityResult {
  const { points, t } = parsePointAndTArgs(args);

  // Check degenerate zero-length curve (TEST-T2-F16-05)
  if (points.length >= 2) {
    const [x0, y0] = unpackPoint(points[0]);
    let allSame = true;
    for (let i = 1; i < points.length; i++) {
      const [xi, yi] = unpackPoint(points[i]);
      if (Math.hypot(xi - x0, yi - y0) > 1e-9) {
        allSame = false;
        break;
      }
    }
    if (allSame) {
      return createVelocityResult(0, 0);
    }
  }

  if (points.length === 3) {
    const tan = quadraticBezierTangent(points[0], points[1], points[2], t);
    return createVelocityResult(tan.vx, tan.vy);
  }
  if (points.length >= 4) {
    const tan = cubicBezierTangent(points[0], points[1], points[2], points[3], t);
    return createVelocityResult(tan.vx, tan.vy);
  }

  return createVelocityResult(0, 0);
}

/**
 * Polymorphic tangent orientation angle evaluator in degrees.
 * Accepts:
 *   - bezierTangentAngle(curve: Point2D[], t: number)
 *   - bezierTangentAngle(p0, p1, p2, [p3,] t)
 */
export function bezierTangentAngle(...args: any[]): number {
  const { points, t } = parsePointAndTArgs(args);

  // Check degenerate zero-length curve (TEST-T2-F16-05)
  if (points.length >= 2) {
    const [x0, y0] = unpackPoint(points[0]);
    let allSame = true;
    for (let i = 1; i < points.length; i++) {
      const [xi, yi] = unpackPoint(points[i]);
      if (Math.hypot(xi - x0, yi - y0) > 1e-9) {
        allSame = false;
        break;
      }
    }
    if (allSame) {
      return 0.0;
    }
  }

  if (points.length === 3) {
    return quadraticBezierTangent(points[0], points[1], points[2], t).angleDeg;
  }
  if (points.length >= 4) {
    return cubicBezierTangent(points[0], points[1], points[2], points[3], t).angleDeg;
  }

  return 0.0;
}
