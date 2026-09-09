import React from 'react';
import { CameraState, CameraRigProps, DEPTH_LAYERS, DepthLayer } from './types';
import { interpolateCameraHermite } from './interpolateCameraHermite';
import { cameraFollowContinuous } from './cameraFollowContinuous';

/**
 * Calculates parallax offset for a layer given camera coordinates.
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
 * Generates an SVG transform matrix string for the camera viewport.
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

/**
 * PRODUCTION CAMERA RIG
 * Multi-depth parallax camera stage component with continuous velocity-aware
 * target tracking and Hermite C0/C1 spline shot transitions.
 */
export const CameraRig: React.FC<CameraRigProps> = ({
  camera,
  target,
  trackingConfig,
  transition,
  width = 1920,
  height = 1080,
  farBackground,
  background,
  midground,
  subjectPlane,
  foreground,
  overlay,
  children,
}) => {
  // Determine effective camera state
  let activeCamera: CameraState = camera ?? { x: 0, y: 0, zoom: 1.0 };

  if (transition) {
    activeCamera = interpolateCameraHermite(
      transition.from,
      transition.to,
      transition.fromVel ?? { vx: 0, vy: 0 },
      transition.toVel ?? { vx: 0, vy: 0 },
      transition.progress
    );
  } else if (target) {
    activeCamera = cameraFollowContinuous(
      { ...activeCamera, vx: 0, vy: 0 },
      target,
      trackingConfig
    );
  }

  const cameraTransform = getCameraTransform(activeCamera, width, height);

  const farBgOffset = calculateParallax(activeCamera.x, activeCamera.y, DEPTH_LAYERS.FAR_BACKGROUND);
  const bgOffset = calculateParallax(activeCamera.x, activeCamera.y, DEPTH_LAYERS.BACKGROUND);
  const midOffset = calculateParallax(activeCamera.x, activeCamera.y, DEPTH_LAYERS.MIDGROUND);
  const fgOffset = calculateParallax(activeCamera.x, activeCamera.y, DEPTH_LAYERS.FOREGROUND);

  return (
    <g data-camera-rig="true">
      {/* Dynamic Camera Transformed Stage */}
      <g transform={cameraTransform}>
        {/* Layer 1: Far Background (Least parallax) */}
        {farBackground && (
          <g transform={`translate(${farBgOffset.x} ${farBgOffset.y})`} data-layer="far-background">
            {farBackground}
          </g>
        )}

        {/* Layer 2: Background (Hills, distant city) */}
        {background && (
          <g transform={`translate(${bgOffset.x} ${bgOffset.y})`} data-layer="background">
            {background}
          </g>
        )}

        {/* Layer 3: Midground (Secondary structures) */}
        {midground && (
          <g transform={`translate(${midOffset.x} ${midOffset.y})`} data-layer="midground">
            {midground}
          </g>
        )}

        {/* Layer 4: Subject Plane (Standard depth 1.0) */}
        {subjectPlane && <g data-layer="subject-plane">{subjectPlane}</g>}

        {/* Layer 5: Foreground (Leaves, foreground elements moving faster) */}
        {foreground && (
          <g transform={`translate(${fgOffset.x} ${fgOffset.y})`} data-layer="foreground">
            {foreground}
          </g>
        )}

        {/* Additional children placed in subject plane */}
        {children && <g data-layer="scene-children">{children}</g>}
      </g>

      {/* Layer 6: Overlay (HUD, vignettes, fixed to screen) */}
      {overlay && <g data-layer="camera-overlay">{overlay}</g>}
    </g>
  );
};
