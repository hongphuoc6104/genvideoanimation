/**
 * CANONICAL V2 MOTION-KIT ENTRY POINT
 * Re-exports camera, morph, and bezier subsystems, alongside core rigs, physics, and foundation primitives.
 */

// Camera Subsystem
export * from './camera';

// Morph Subsystem
export * from './morph';

// Bezier Subsystem
export * from './bezier';

// Subsystems from parallel milestones
export * from './physics';
export * from './cues';
export * from './rigs';
export * from './salience';

// Geometry Subsystem (Reusable Smart Geometric Primitives)
export * from './geometry';

// Disambiguations
export type { Point2D } from './bezier/types';
export { clamp } from './bezier/bezierMath';

// M1 Backward Compatibility Primitives & Transitions
export {
  anticipate,
  overshoot,
  settle,
  followThrough,
  arcTrajectory,
  cubicTrajectory,
  gazeTarget,
  stagger,
} from '../motion-primitives';

export {
  linear,
  snappy,
  bouncy,
  heavy,
  organic,
  decelerate,
} from '../motion-profiles';

export {
  blendPose,
  IDLE_POSE,
  ANTICIPATE_SQUASH_POSE,
  FLIGHT_UPSTROKE_POSE,
  FLIGHT_DOWNSTROKE_POSE,
  LANDING_IMPACT_POSE,
  LANDING_REBOUND_POSE,
} from '../pose-blending';

export {
  flightCycle,
  takeoffSequence,
  landingSequence,
  reactionSequence,
} from '../character-actions';

export {
  calculateParallax,
  cameraFollow,
  cameraContinuousTransition,
  cameraPush,
  getCameraTransform,
  DEPTH_LAYERS,
} from '../camera-system';

export {
  motivatedIris,
  morphTransition,
} from '../motivated-transitions';

export { CharacterRig } from '../components/CharacterRig';
export { CameraRig } from '../components/CameraRig';
export { GeometryMorph } from '../components/GeometryMorph';
export { CustomRigAdapter } from '../components/CustomRigAdapter';
