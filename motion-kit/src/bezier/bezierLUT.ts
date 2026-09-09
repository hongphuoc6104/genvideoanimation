import { Point2D, BezierLUT, BezierLUTSample } from './types';
import { quadraticBezierPoint, cubicBezierPoint } from './bezierMath';

function parseLUTArgs(args: any[]): { points: Point2D[]; subdivisions: number } {
  if (Array.isArray(args[0]) && (args.length === 1 || typeof args[1] === 'number')) {
    return { points: args[0], subdivisions: args[1] ?? 100 };
  }
  if (typeof args[args.length - 1] === 'number') {
    return { points: args.slice(0, -1), subdivisions: args[args.length - 1] };
  }
  return { points: args, subdivisions: 100 };
}

/**
 * Computes an arc-length parameterized Look-Up Table for constant-velocity travel.
 * Accepts:
 *   - createBezierLUT(curve: Point2D[], subdivisions?: number)
 *   - createBezierLUT(p0, p1, p2, [p3,] subdivisions?)
 */
export function createBezierLUT(...args: any[]): BezierLUT {
  const { points, subdivisions: rawSub } = parseLUTArgs(args);
  const subdivisions = Math.max(2, Math.floor(rawSub));

  const samples: BezierLUTSample[] = [];
  let totalLength = 0;

  const evalPt = (t: number) => {
    if (points.length === 3) {
      return quadraticBezierPoint(points[0], points[1], points[2], t);
    }
    return cubicBezierPoint(points[0], points[1], points[2], points[3], t);
  };

  const p0 = evalPt(0);
  samples.push({ t: 0, distance: 0, point: p0 });
  let prevPt = p0;

  for (let i = 1; i <= subdivisions; i++) {
    const t = i / subdivisions;
    const pt = evalPt(t);
    const dist = Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
    totalLength += dist;
    samples.push({ t, distance: totalLength, point: pt });
    prevPt = pt;
  }

  return {
    totalLength,
    length: totalLength,
    samples,
    controlPoints: points,
  };
}

/**
 * Inverts arc-length distance d in [0, L] to parameter t in [0, 1] via binary search.
 */
export function invertLUTDistance(lut: BezierLUT, targetDistance: number): number {
  if (lut.totalLength <= 0 || targetDistance <= 0) return 0;
  if (targetDistance >= lut.totalLength) return 1;

  const samples = lut.samples;
  let low = 0;
  let high = samples.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid].distance < targetDistance) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idx = Math.min(samples.length - 1, Math.max(1, low));
  const sPrev = samples[idx - 1];
  const sNext = samples[idx];
  const segDist = sNext.distance - sPrev.distance;
  const segT = segDist > 0 ? (targetDistance - sPrev.distance) / segDist : 0;
  return sPrev.t + segT * (sNext.t - sPrev.t);
}
