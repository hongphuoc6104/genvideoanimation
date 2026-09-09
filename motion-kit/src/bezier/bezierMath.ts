import { Point2D, EvaluatedPoint, createPoint, unpackPoint } from './types';

/**
 * Clamps a numerical value within [min, max].
 */
export function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Evaluates exact coordinates along a quadratic Bezier curve:
 * B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
 *
 * @param p0 Start control point
 * @param p1 Intermediate control point
 * @param p2 End control point
 * @param t Curve parameter in [0, 1] (clamped if out of range)
 * @returns EvaluatedPoint satisfying both [x, y] and { x, y } interfaces
 */
export function quadraticBezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): EvaluatedPoint {
  const c = clamp(t, 0, 1);
  const u = 1 - c;

  const [x0, y0] = unpackPoint(p0);
  const [x1, y1] = unpackPoint(p1);
  const [x2, y2] = unpackPoint(p2);

  const x = u * u * x0 + 2 * u * c * x1 + c * c * x2;
  const y = u * u * y0 + 2 * u * c * y1 + c * c * y2;

  return createPoint(x, y);
}

/**
 * Evaluates exact coordinates along a cubic Bezier curve:
 * B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t)t^2 P2 + t^3 P3
 *
 * @param p0 Start control point
 * @param p1 First control point
 * @param p2 Second control point
 * @param p3 End control point
 * @param t Curve parameter in [0, 1] (clamped if out of range)
 * @returns EvaluatedPoint satisfying both [x, y] and { x, y } interfaces
 */
export function cubicBezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): EvaluatedPoint {
  const c = clamp(t, 0, 1);
  const u = 1 - c;
  const uu = u * u;
  const tt = c * c;

  const [x0, y0] = unpackPoint(p0);
  const [x1, y1] = unpackPoint(p1);
  const [x2, y2] = unpackPoint(p2);
  const [x3, y3] = unpackPoint(p3);

  const x = uu * u * x0 + 3 * uu * c * x1 + 3 * u * tt * x2 + tt * c * x3;
  const y = uu * u * y0 + 3 * uu * c * y1 + 3 * u * tt * y2 + tt * c * y3;

  return createPoint(x, y);
}
