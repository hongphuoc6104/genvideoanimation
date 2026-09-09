import type React from 'react';

/**
 * Camera Subsystem Type Definitions
 */

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

export interface CameraPoint {
  x: number;
  y: number;
  zoom?: number;
  rotation?: number;
}

export interface CameraLookAheadConfig {
  kLead?: number;        // Lead factor in frames (default 3.5)
  minLead?: number;      // Minimum lead offset in px (default 0)
  maxLead?: number;      // Maximum clamped lead offset in px
  smoothFactor?: number; // Smoothing factor for velocity transitions
}

export interface CameraTrackingConfig extends CameraLookAheadConfig {
  leadFactor?: number;      // Alias for kLead
  lookAheadTime?: number;   // Alias for kLead
  deadZoneRadius?: number;  // Radial dead-zone threshold in px (default 15)
  deadZone?: { x?: number; y?: number };
  omega?: number;           // Natural angular frequency of spring (default 4.0)
  zeta?: number;            // Damping ratio (default 1.0 = critical damping)
  dt?: number;              // Delta time per step (default 1/30)
}

export interface HermiteKeyframe {
  frame: number;
  camera: CameraState;
  velocity?: CameraVelocity;
}

export const DEPTH_LAYERS = {
  FAR_BACKGROUND: 0.15,
  BACKGROUND: 0.35,
  MIDGROUND: 0.65,
  SUBJECT_PLANE: 1.0,
  FOREGROUND: 1.45,
  OVERLAY: 0.0,
} as const;

export type DepthLayer = keyof typeof DEPTH_LAYERS | number;

export interface CameraRigProps {
  camera?: CameraState;
  target?: { x: number; y: number; vx?: number; vy?: number };
  trackingConfig?: CameraTrackingConfig;
  transition?: {
    from: CameraState;
    to: CameraState;
    fromVel?: CameraVelocity;
    toVel?: CameraVelocity;
    progress: number;
  };
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
