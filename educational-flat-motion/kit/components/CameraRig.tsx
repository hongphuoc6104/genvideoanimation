import React from 'react';
import { CameraState, calculateParallax, DEPTH_LAYERS, getCameraTransform } from '../camera-system';

export interface CameraRigProps {
  camera: CameraState;
  width?: number;
  height?: number;
  farBackground?: React.ReactNode;
  background?: React.ReactNode;
  midground?: React.ReactNode;
  subjectPlane?: React.ReactNode;
  foreground?: React.ReactNode;
  overlay?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * CAMERA RIG COMPONENT
 * Wraps visual scene in multi-depth planes with automatic parallax.
 */
export const CameraRig: React.FC<CameraRigProps> = ({
  camera,
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
  const cameraTransform = getCameraTransform(camera, width, height);

  const farBgOffset = calculateParallax(camera.x, camera.y, DEPTH_LAYERS.FAR_BACKGROUND);
  const bgOffset = calculateParallax(camera.x, camera.y, DEPTH_LAYERS.BACKGROUND);
  const midOffset = calculateParallax(camera.x, camera.y, DEPTH_LAYERS.MIDGROUND);
  const fgOffset = calculateParallax(camera.x, camera.y, DEPTH_LAYERS.FOREGROUND);

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

        {/* Layer 4: Subject Plane (Full 1:1 camera focus) */}
        {subjectPlane && (
          <g data-layer="subject-plane">
            {subjectPlane}
          </g>
        )}

        {/* General children default to Subject Plane */}
        {children && <g data-layer="children">{children}</g>}

        {/* Layer 5: Foreground (High parallax foreground occluders) */}
        {foreground && (
          <g transform={`translate(${fgOffset.x} ${fgOffset.y})`} data-layer="foreground">
            {foreground}
          </g>
        )}
      </g>

      {/* Layer 6: Overlay (Screen-space fixed HUD / Vignette / Letterbox) */}
      {overlay && <g data-layer="overlay">{overlay}</g>}
    </g>
  );
};
