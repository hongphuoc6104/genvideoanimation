/**
 * CAMERA SYSTEM & PARALLAX
 * Multi-plane camera staging for cinematic 2D motion graphics.
 * Enforces motivated camera movement and depth perception.
 */

import { clamp, overshoot } from './motion-primitives';
import { EasingFunction, heavy, snappy } from './motion-profiles';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation?: number;
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
  };
}

/**
 * Camera follow tracking a subject with look-ahead and damping.
 */
export function cameraFollow(
  subjectX: number,
  subjectY: number,
  options?: {
    lookAheadX?: number;
    damping?: number;
    baseZoom?: number;
  }
): CameraState {
  const lookAhead = options?.lookAheadX ?? 60;
  const zoom = options?.baseZoom ?? 1.0;
  return {
    x: subjectX + lookAhead,
    y: subjectY * 0.5,
    zoom,
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
