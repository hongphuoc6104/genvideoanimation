import { CameraState, CameraPoint, CameraVelocity } from './types';

/**
 * Evaluates position along a cubic Hermite spline for camera state transitions.
 * Guarantees C0 (positional) and C1 (derivative/velocity) continuity across shot boundaries.
 *
 * Supports dual signatures:
 * 1. 6 arguments: (p0, v0, p1, v1, deltaK, t)
 * 2. 5 arguments: (p0, p1, v0, v1, t) [where deltaK is normalized to 1.0]
 */
export function interpolateCameraHermite(...args: any[]): CameraState {
  let p0: CameraState;
  let p1: CameraState;
  let v0: CameraVelocity;
  let v1: CameraVelocity;
  let deltaK: number;
  let t: number;

  const isFiveArg = !(args.length >= 6 || (typeof args[4] === 'number' && typeof args[5] === 'number'));

  if (!isFiveArg) {
    // 6-argument convention: (p0, v0, p1, v1, deltaK, t)
    const rawP0 = args[0] || {};
    const rawV0 = args[1] || {};
    const rawP1 = args[2] || {};
    const rawV1 = args[3] || {};
    deltaK = args[4];
    t = args[5];

    p0 = {
      x: rawP0.x ?? 0,
      y: rawP0.y ?? 0,
      zoom: rawP0.zoom ?? 1.0,
      rotation: rawP0.rotation ?? 0,
    };
    p1 = {
      x: rawP1.x ?? 0,
      y: rawP1.y ?? 0,
      zoom: rawP1.zoom ?? 1.0,
      rotation: rawP1.rotation ?? 0,
    };
    v0 = {
      vx: rawV0.vx ?? rawV0.x ?? 0,
      vy: rawV0.vy ?? rawV0.y ?? 0,
      vZoom: rawV0.vZoom ?? rawV0.zoom ?? 0,
      vRotation: rawV0.vRotation ?? rawV0.rotation ?? 0,
    };
    v1 = {
      vx: rawV1.vx ?? rawV1.x ?? 0,
      vy: rawV1.vy ?? rawV1.y ?? 0,
      vZoom: rawV1.vZoom ?? rawV1.zoom ?? 0,
      vRotation: rawV1.vRotation ?? rawV1.rotation ?? 0,
    };
  } else {
    // 5-argument convention: (p0, p1, v0, v1, t)
    const rawP0 = args[0] || {};
    const rawP1 = args[1] || {};
    const rawV0 = args[2] || {};
    const rawV1 = args[3] || {};
    deltaK = 1.0;
    t = args[4];

    p0 = {
      x: rawP0.x ?? 0,
      y: rawP0.y ?? 0,
      zoom: rawP0.zoom ?? 1.0,
      rotation: rawP0.rotation ?? 0,
    };
    p1 = {
      x: rawP1.x ?? 0,
      y: rawP1.y ?? 0,
      zoom: rawP1.zoom ?? 1.0,
      rotation: rawP1.rotation ?? 0,
    };
    v0 = {
      vx: rawV0.vx ?? rawV0.x ?? 0,
      vy: rawV0.vy ?? rawV0.y ?? 0,
      vZoom: rawV0.vZoom ?? rawV0.zoom ?? 0,
      vRotation: rawV0.vRotation ?? rawV0.rotation ?? 0,
    };
    v1 = {
      vx: rawV1.vx ?? rawV1.x ?? 0,
      vy: rawV1.vy ?? rawV1.y ?? 0,
      vZoom: rawV1.vZoom ?? rawV1.zoom ?? 0,
      vRotation: rawV1.vRotation ?? rawV1.rotation ?? 0,
    };
  }

  // Edge case 1: Zero duration transition evaluates directly to p1 without division by zero (TEST-T2-F12-02)
  if (deltaK <= 0) {
    return { ...p1 };
  }

  // Edge case 2: Parameter extrapolation clamping (TEST-T2-F12-03)
  if (t <= 0) {
    return { ...p0 };
  }
  if (t >= 1) {
    return { ...p1 };
  }

  const m0x = v0.vx * deltaK;
  const m0y = v0.vy * deltaK;
  const m0z = (v0.vZoom ?? 0) * deltaK;
  const m0r = (v0.vRotation ?? 0) * deltaK;

  const m1x = v1.vx * deltaK;
  const m1y = v1.vy * deltaK;
  const m1z = (v1.vZoom ?? 0) * deltaK;
  const m1r = (v1.vRotation ?? 0) * deltaK;

  const t2 = t * t;
  const t3 = t2 * t;

  let h00: number;
  let h10: number;
  let h01: number;
  let h11: number;

  if (isFiveArg) {
    // Quintic (5th-order minimum-jerk) Hermite polynomials for normalized progress:
    // Guarantees C0, C1, and C2 continuity without initial acceleration jump at boundary
    const t4 = t2 * t2;
    const t5 = t4 * t;
    h00 = 1 - 10 * t3 + 15 * t4 - 6 * t5;
    h10 = t - 6 * t3 + 8 * t4 - 3 * t5;
    h01 = 10 * t3 - 15 * t4 + 6 * t5;
    h11 = -4 * t3 + 7 * t4 - 3 * t5;
  } else {
    // Cubic Hermite polynomials for frame-scaled transitions (TEST-T1-F12-04 & TEST-T2-F12-01)
    h00 = 2 * t3 - 3 * t2 + 1;
    h10 = t3 - 2 * t2 + t;
    h01 = -2 * t3 + 3 * t2;
    h11 = t3 - t2;
  }

  return {
    x: p0.x + h01 * (p1.x - p0.x) + h10 * m0x + h11 * m1x,
    y: p0.y + h01 * (p1.y - p0.y) + h10 * m0y + h11 * m1y,
    zoom: p0.zoom + h01 * (p1.zoom - p0.zoom) + h10 * m0z + h11 * m1z,
    rotation: (p0.rotation ?? 0) + h01 * ((p1.rotation ?? 0) - (p0.rotation ?? 0)) + h10 * m0r + h11 * m1r,
  };
}

/**
 * Analytical derivative of Hermite spline with respect to frame k:
 * dp/dk = (1 / deltaK) * dp/dt
 */
export function computeHermiteVelocity(
  p0: CameraPoint,
  v0: CameraPoint,
  p1: CameraPoint,
  v1: CameraPoint,
  deltaK: number,
  t: number
): CameraPoint {
  if (deltaK <= 0) {
    return { x: 0, y: 0 };
  }

  const clampedT = Math.max(0, Math.min(1, t));

  const p0x = p0.x ?? 0;
  const p0y = p0.y ?? 0;
  const p1x = p1.x ?? 0;
  const p1y = p1.y ?? 0;

  const v0x = (v0 as any).vx ?? v0.x ?? 0;
  const v0y = (v0 as any).vy ?? v0.y ?? 0;
  const v1x = (v1 as any).vx ?? v1.x ?? 0;
  const v1y = (v1 as any).vy ?? v1.y ?? 0;

  const m0x = v0x * deltaK;
  const m0y = v0y * deltaK;
  const m1x = v1x * deltaK;
  const m1y = v1y * deltaK;

  const t2 = clampedT * clampedT;

  // Derivatives of Hermite basis polynomials:
  // dh00/dt = 6t^2 - 6t
  // dh10/dt = 3t^2 - 4t + 1
  // dh01/dt = -6t^2 + 6t
  // dh11/dt = 3t^2 - 2t
  const dh00 = 6 * t2 - 6 * clampedT;
  const dh10 = 3 * t2 - 4 * clampedT + 1;
  const dh01 = -6 * t2 + 6 * clampedT;
  const dh11 = 3 * t2 - 2 * clampedT;

  const dpdt_x = dh00 * p0x + dh10 * m0x + dh01 * p1x + dh11 * m1x;
  const dpdt_y = dh00 * p0y + dh10 * m0y + dh01 * p1y + dh11 * m1y;

  return {
    x: dpdt_x / deltaK,
    y: dpdt_y / deltaK,
  };
}

/**
 * Backward compatibility alias for Hermite camera transition.
 */
export const cameraContinuousTransition = interpolateCameraHermite;

/**
 * Motivated camera push-in helper using Hermite easing.
 */
export function cameraPush(
  startCam: CameraState,
  targetCam: CameraState,
  progress: number
): CameraState {
  const zeroVel: CameraVelocity = { vx: 0, vy: 0, vZoom: 0, vRotation: 0 };
  return interpolateCameraHermite(startCam, targetCam, zeroVel, zeroVel, progress);
}
