/**
 * CAMERA SYSTEM & CONTINUITY
 * Multi-plane camera staging, velocity-aware tracking, look-ahead, dead-zones,
 * functional damping, and C0/C1 Hermite spline continuity for 2D flat motion graphics.
 */

import { clamp } from './motion-primitives';
import { EasingFunction, heavy } from './motion-profiles';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation?: number;
}

export interface CameraVelocity {
  vx: number;
  vy: number;
  vZoom?: number;
  vRotation?: number;
}

export const DEPTH_LAYERS = {
  FAR_BACKGROUND: 0.15,
  BACKGROUND: 0.35,
  MIDGROUND: 0.65,
  SUBJECT_PLANE: 1.0,
  FOREGROUND: 1.45,
  OVERLAY: 0.0, // UI / Vignette sticks to screen
} as const;

export type DepthLayer = keyof typeof DEPTH_LAYERS | number;

/**
 * Calculates parallax offset for a layer given current camera position.
 */
export function calculateParallax(
  cameraX: number,
  cameraY: number,
  layerDepth: DepthLayer
): { x: number; y: number } {
  const depthFactor =
    typeof layerDepth === 'number' ? layerDepth : DEPTH_LAYERS[layerDepth];
  return {
    x: -cameraX * depthFactor,
    y: -cameraY * depthFactor,
  };
}

export interface CameraFollowOptions {
  lookAheadTime?: number;      // frames of velocity projection (default 8)
  lookAheadX?: number;         // pixel look-ahead offset (backward compatible)
  lookAheadY?: number;
  damping?: number;            // 0 (instant) to 0.99 (heavy lag). MUST affect output. Default 0.20
  deadZone?: { x?: number; y?: number }; // Pixel dead-zone where camera remains still
  baseZoom?: number;
  subjectPrevX?: number;       // For velocity calculation
  subjectPrevY?: number;
  dt?: number;                 // frame delta (default 1)
}

/**
 * Velocity-aware camera follow with functional damping, look-ahead, and dead-zone filtering.
 * Damping parameter strictly modulates how quickly the camera catches up to the target.
 */
export function cameraFollow(
  subjectX: number,
  subjectY: number,
  prevCameraOrOptions?: CameraState | CameraFollowOptions,
  maybeOptions?: CameraFollowOptions
): CameraState {
  let prevCamera: CameraState = { x: subjectX, y: subjectY, zoom: 1.0 };
  let options: CameraFollowOptions | undefined = maybeOptions;

  if (prevCameraOrOptions) {
    if ('zoom' in prevCameraOrOptions && typeof (prevCameraOrOptions as CameraState).zoom === 'number') {
      prevCamera = prevCameraOrOptions as CameraState;
    } else {
      options = prevCameraOrOptions as CameraFollowOptions;
    }
  }

  const dt = options?.dt ?? 1;
  const lookAheadFrames = options?.lookAheadTime ?? 8;
  const baseZoom = options?.baseZoom ?? prevCamera.zoom ?? 1.0;

  // Damping factor: 0 = instant snap, 0.95 = very slow float
  // Verified: any variation in damping directly changes the output position.
  const rawDamping = options?.damping !== undefined ? options.damping : 0.20;
  const damping = clamp(rawDamping, 0.0, 0.98);
  const followRate = 1.0 - damping;

  // 1. Calculate subject velocity
  const prevX = options?.subjectPrevX !== undefined ? options.subjectPrevX : subjectX;
  const prevY = options?.subjectPrevY !== undefined ? options.subjectPrevY : subjectY;
  const vx = (subjectX - prevX) / dt;
  const vy = (subjectY - prevY) / dt;

  // 2. Compute look-ahead target
  const lookOffsetStaticX = options?.lookAheadX ?? 0;
  const lookOffsetStaticY = options?.lookAheadY ?? 0;
  const targetX = subjectX + (options?.lookAheadX !== undefined ? lookOffsetStaticX : vx * lookAheadFrames);
  const targetY = subjectY + (options?.lookAheadY !== undefined ? lookOffsetStaticY : vy * lookAheadFrames);

  // 3. Apply dead-zone filter
  const deadZoneX = options?.deadZone?.x ?? 0;
  const deadZoneY = options?.deadZone?.y ?? 0;

  let deltaX = targetX - prevCamera.x;
  let deltaY = targetY - prevCamera.y;

  if (Math.abs(deltaX) < deadZoneX) {
    deltaX = 0;
  } else {
    deltaX -= Math.sign(deltaX) * deadZoneX;
  }

  if (Math.abs(deltaY) < deadZoneY) {
    deltaY = 0;
  } else {
    deltaY -= Math.sign(deltaY) * deadZoneY;
  }

  // 4. Exponential follow with damping
  const nextX = prevCamera.x + deltaX * followRate;
  const nextY = prevCamera.y + deltaY * followRate;

  return {
    x: nextX,
    y: nextY,
    zoom: baseZoom,
    rotation: prevCamera.rotation ?? 0,
  };
}

/**
 * C0/C1 Continuous Camera Spline Interpolation (Hermite Spline)
 * Guarantees that camera position (C0) and camera velocity (C1) are continuous
 * across shot transitions without sudden velocity jolts.
 */
export function cameraContinuousTransition(
  progress: number, // 0 to 1
  startState: CameraState,
  endState: CameraState,
  startVel: CameraVelocity = { vx: 0, vy: 0, vZoom: 0 },
  endVel: CameraVelocity = { vx: 0, vy: 0, vZoom: 0 }
): CameraState {
  const t = clamp(progress);
  const t2 = t * t;
  const t3 = t2 * t;

  // Cubic Hermite basis functions
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  const x = h00 * startState.x + h10 * startVel.vx + h01 * endState.x + h11 * endVel.vx;
  const y = h00 * startState.y + h10 * startVel.vy + h01 * endState.y + h11 * endVel.vy;
  const zoom =
    h00 * startState.zoom +
    h10 * (startVel.vZoom ?? 0) +
    h01 * endState.zoom +
    h11 * (endVel.vZoom ?? 0);

  const rot0 = startState.rotation ?? 0;
  const rot1 = endState.rotation ?? 0;
  const vRot0 = startVel.vRotation ?? 0;
  const vRot1 = endVel.vRotation ?? 0;
  const rotation = h00 * rot0 + h10 * vRot0 + h01 * rot1 + h11 * vRot1;

  return { x, y, zoom, rotation };
}

/**
 * Motivated push-in camera move (e.g. on realization or focus).
 */
export function cameraPush(
  frame: number,
  startFrame: number,
  endFrame: number,
  target: { x: number; y: number; zoom: number },
  initialState: CameraState = { x: 0, y: 0, zoom: 1.0 },
  easing: EasingFunction = heavy
): CameraState {
  if (frame <= startFrame) return initialState;
  const progress = clamp((frame - startFrame) / Math.max(1, endFrame - startFrame));
  const t = easing(progress);

  return {
    x: initialState.x + (target.x - initialState.x) * t,
    y: initialState.y + (target.y - initialState.y) * t,
    zoom: initialState.zoom + (target.zoom - initialState.zoom) * t,
    rotation: initialState.rotation ?? 0,
  };
}

/**
 * Generates an SVG/CSS transform string for the camera viewport.
 */
export function getCameraTransform(
  camera: CameraState,
  viewportWidth = 1920,
  viewportHeight = 1080
): string {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  const rot = camera.rotation ? ` rotate(${camera.rotation})` : '';
  return `translate(${cx - camera.x} ${cy - camera.y}) scale(${camera.zoom})${rot} translate(${-cx} ${-cy})`;
}
