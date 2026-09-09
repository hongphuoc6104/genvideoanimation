/**
 * POSE BLENDING
 * Interpolates character rig transforms and deformation parameters between distinct poses.
 * Replaces fake opacity crossfade with true skeletal/joint blending.
 */

import { clamp } from './motion-primitives';
import { EasingFunction, organic } from './motion-profiles';

export interface CharacterPose {
  // Torso / Body
  bodyY?: number;
  bodyTilt?: number; // degrees
  squash?: number; // scaleY (volume-conserving)

  // Head
  headAngle?: number; // degrees
  headY?: number;

  // Eyes & Gaze
  eyeGazeX?: number; // -1 to 1
  eyeGazeY?: number; // -1 to 1
  blink?: boolean;
  eyeScale?: number;

  // Wings / Arms
  wingLeftAngle?: number; // degrees
  wingRightAngle?: number; // degrees
  wingLeftFold?: number; // 0 = fully extended, 1 = tucked
  wingRightFold?: number;

  // Legs
  legBend?: number; // 0 = straight, 1 = deep crouch
  legLeftAngle?: number;
  legRightAngle?: number;

  // Beak / Mouth
  beakOpen?: number; // 0 = closed, 1 = wide
  beakTilt?: number;

  // Tail
  tailAngle?: number;
}

/**
 * Standard default poses
 */
export const IDLE_POSE: CharacterPose = {
  bodyY: 0,
  bodyTilt: 0,
  squash: 1.0,
  headAngle: 0,
  headY: 0,
  eyeGazeX: 0,
  eyeGazeY: 0,
  blink: false,
  eyeScale: 1,
  wingLeftAngle: 5,
  wingRightAngle: -5,
  wingLeftFold: 0.9,
  wingRightFold: 0.9,
  legBend: 0,
  legLeftAngle: 0,
  legRightAngle: 0,
  beakOpen: 0,
  beakTilt: 0,
  tailAngle: 0,
};

export const ANTICIPATE_SQUASH_POSE: CharacterPose = {
  bodyY: 14,
  bodyTilt: -4,
  squash: 0.82,
  headAngle: 8,
  headY: 6,
  eyeGazeX: 0.3,
  eyeGazeY: -0.4,
  blink: false,
  eyeScale: 0.95,
  wingLeftAngle: -25,
  wingRightAngle: 25,
  wingLeftFold: 0.6,
  wingRightFold: 0.6,
  legBend: 0.65,
  legLeftAngle: -8,
  legRightAngle: 8,
  beakOpen: 0.1,
  beakTilt: -3,
  tailAngle: -10,
};

export const FLIGHT_UPSTROKE_POSE: CharacterPose = {
  bodyY: -10,
  bodyTilt: 12,
  squash: 1.08,
  headAngle: -6,
  headY: -4,
  eyeGazeX: 0.5,
  eyeGazeY: -0.2,
  blink: false,
  eyeScale: 1.05,
  wingLeftAngle: -55,
  wingRightAngle: -55,
  wingLeftFold: 0.1,
  wingRightFold: 0.1,
  legBend: 0.1,
  legLeftAngle: 15,
  legRightAngle: 18,
  beakOpen: 0.2,
  beakTilt: 2,
  tailAngle: 15,
};

export const FLIGHT_DOWNSTROKE_POSE: CharacterPose = {
  bodyY: 6,
  bodyTilt: 4,
  squash: 0.96,
  headAngle: 2,
  headY: 2,
  eyeGazeX: 0.5,
  eyeGazeY: -0.1,
  blink: false,
  eyeScale: 1.0,
  wingLeftAngle: 38,
  wingRightAngle: 38,
  wingLeftFold: 0.0,
  wingRightFold: 0.0,
  legBend: 0.05,
  legLeftAngle: 22,
  legRightAngle: 24,
  beakOpen: 0.0,
  beakTilt: 0,
  tailAngle: -5,
};

export const LANDING_IMPACT_POSE: CharacterPose = {
  bodyY: 20,
  bodyTilt: -2,
  squash: 0.78, // Heavy landing squash
  headAngle: 14, // Head lags and pushes forward
  headY: 10,
  eyeGazeX: 0.8,
  eyeGazeY: 0.2,
  blink: true, // Impact blink
  eyeScale: 0.8,
  wingLeftAngle: -40, // Flared wings for braking
  wingRightAngle: 40,
  wingLeftFold: 0.3,
  wingRightFold: 0.3,
  legBend: 0.85,
  legLeftAngle: -12,
  legRightAngle: 12,
  beakOpen: 0.4,
  beakTilt: -6,
  tailAngle: -20,
};

export const LANDING_REBOUND_POSE: CharacterPose = {
  bodyY: -6,
  bodyTilt: 1,
  squash: 1.08, // Stretch rebound
  headAngle: -4,
  headY: -3,
  eyeGazeX: 0.9,
  eyeGazeY: 0.0,
  blink: false,
  eyeScale: 1.1,
  wingLeftAngle: -10,
  wingRightAngle: 10,
  wingLeftFold: 0.7,
  wingRightFold: 0.7,
  legBend: 0.15,
  legLeftAngle: -2,
  legRightAngle: 2,
  beakOpen: 0.1,
  beakTilt: 2,
  tailAngle: 8,
};

/**
 * Linearly interpolates two numbers with an easing curve
 */
function interpolateNumber(a: number | undefined, b: number | undefined, t: number, defaultVal = 0): number {
  const valA = a ?? defaultVal;
  const valB = b ?? defaultVal;
  return valA + (valB - valA) * t;
}

/**
 * Blends smoothly between two poses without opacity crossfade.
 */
export function blendPose(
  fromPose: CharacterPose,
  toPose: CharacterPose,
  progress: number,
  easing: EasingFunction = organic
): CharacterPose {
  const t = easing(clamp(progress));

  return {
    bodyY: interpolateNumber(fromPose.bodyY, toPose.bodyY, t, 0),
    bodyTilt: interpolateNumber(fromPose.bodyTilt, toPose.bodyTilt, t, 0),
    squash: interpolateNumber(fromPose.squash, toPose.squash, t, 1.0),
    headAngle: interpolateNumber(fromPose.headAngle, toPose.headAngle, t, 0),
    headY: interpolateNumber(fromPose.headY, toPose.headY, t, 0),
    eyeGazeX: interpolateNumber(fromPose.eyeGazeX, toPose.eyeGazeX, t, 0),
    eyeGazeY: interpolateNumber(fromPose.eyeGazeY, toPose.eyeGazeY, t, 0),
    eyeScale: interpolateNumber(fromPose.eyeScale, toPose.eyeScale, t, 1.0),
    blink: t > 0.4 && t < 0.6 ? (toPose.blink ?? fromPose.blink ?? false) : (t >= 0.5 ? toPose.blink : fromPose.blink),
    wingLeftAngle: interpolateNumber(fromPose.wingLeftAngle, toPose.wingLeftAngle, t, 0),
    wingRightAngle: interpolateNumber(fromPose.wingRightAngle, toPose.wingRightAngle, t, 0),
    wingLeftFold: interpolateNumber(fromPose.wingLeftFold, toPose.wingLeftFold, t, 0.5),
    wingRightFold: interpolateNumber(fromPose.wingRightFold, toPose.wingRightFold, t, 0.5),
    legBend: interpolateNumber(fromPose.legBend, toPose.legBend, t, 0),
    legLeftAngle: interpolateNumber(fromPose.legLeftAngle, toPose.legLeftAngle, t, 0),
    legRightAngle: interpolateNumber(fromPose.legRightAngle, toPose.legRightAngle, t, 0),
    beakOpen: interpolateNumber(fromPose.beakOpen, toPose.beakOpen, t, 0),
    beakTilt: interpolateNumber(fromPose.beakTilt, toPose.beakTilt, t, 0),
    tailAngle: interpolateNumber(fromPose.tailAngle, toPose.tailAngle, t, 0),
  };
}
