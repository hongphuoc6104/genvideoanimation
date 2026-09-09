/**
 * CHARACTER ACTIONS
 * Pre-orchestrated sequence generators for common character behaviors:
 * Takeoff, Flight Cycles, Landing Sequences, and Reactions.
 */

import { clamp, overshoot, settle } from './motion-primitives';
import {
  CharacterPose,
  IDLE_POSE,
  ANTICIPATE_SQUASH_POSE,
  FLIGHT_UPSTROKE_POSE,
  FLIGHT_DOWNSTROKE_POSE,
  LANDING_IMPACT_POSE,
  LANDING_REBOUND_POSE,
  blendPose,
} from './pose-blending';
import { snappy, bouncy, decelerate, organic } from './motion-profiles';

/**
 * Generates an active flight flap cycle pose based on frame number.
 */
export function flightCycle(
  frame: number,
  period = 10,
  options?: { bankAngle?: number; gazeTarget?: [number, number] }
): CharacterPose {
  const phase = (frame % period) / period; // 0 to 1
  const bank = options?.bankAngle ?? 0;

  // Upstroke (0 to 0.45), Downstroke (0.45 to 1.0)
  let basePose: CharacterPose;
  if (phase < 0.45) {
    const upT = phase / 0.45;
    basePose = blendPose(FLIGHT_DOWNSTROKE_POSE, FLIGHT_UPSTROKE_POSE, upT, decelerate);
  } else {
    const downT = (phase - 0.45) / 0.55;
    basePose = blendPose(FLIGHT_UPSTROKE_POSE, FLIGHT_DOWNSTROKE_POSE, downT, snappy);
  }

  return {
    ...basePose,
    bodyTilt: (basePose.bodyTilt ?? 0) + bank,
    headAngle: (basePose.headAngle ?? 0) - bank * 0.4, // Head stabilizes against banking
  };
}

/**
 * Takeoff sequence:
 * Crouch anticipation -> Explosive stretch launch -> Flap cycle
 */
export function takeoffSequence(frame: number, startFrame: number): CharacterPose {
  const rel = frame - startFrame;
  if (rel < 0) return IDLE_POSE;

  if (rel <= 6) {
    // Stage 1: Anticipation crouch (0 to 6 frames)
    return blendPose(IDLE_POSE, ANTICIPATE_SQUASH_POSE, rel / 6, organic);
  } else if (rel <= 12) {
    // Stage 2: Explosive launch (6 to 12 frames)
    return blendPose(ANTICIPATE_SQUASH_POSE, FLIGHT_UPSTROKE_POSE, (rel - 6) / 6, snappy);
  } else {
    // Stage 3: Flight cycle
    return flightCycle(rel - 12);
  }
}

/**
 * High-fidelity landing sequence:
 * Air brake glide -> Touchdown impact squash -> Rebound overshoot -> Settle into rest -> Gaze lock
 */
export function landingSequence(
  frame: number,
  contactFrame: number,
  gazeTargetCoords = { x: 0.8, y: -0.1 }
): CharacterPose {
  const rel = frame - contactFrame;

  if (rel < -8) {
    // Gliding down before contact
    return blendPose(
      FLIGHT_DOWNSTROKE_POSE,
      {
        ...ANTICIPATE_SQUASH_POSE,
        squash: 1.0,
        legBend: 0.4, // Feet reaching down to touch ground
        wingLeftAngle: -35,
        wingRightAngle: 35,
        wingLeftFold: 0.3,
        wingRightFold: 0.3,
      },
      clamp((rel + 20) / 12),
      decelerate
    );
  } else if (rel < 0) {
    // Final flare: wings scoop air, legs extend for touchdown
    const flareT = (rel + 8) / 8;
    return blendPose(
      {
        ...IDLE_POSE,
        bodyTilt: -8,
        wingLeftAngle: -45,
        wingRightAngle: 45,
        wingLeftFold: 0.2,
        wingRightFold: 0.2,
        legBend: 0.3,
      },
      LANDING_IMPACT_POSE,
      flareT,
      decelerate
    );
  } else if (rel <= 5) {
    // Instant impact: full squash (scaleY ~ 0.78), head dips with lag, eyes blink
    const impactT = rel / 5;
    return blendPose(LANDING_IMPACT_POSE, LANDING_REBOUND_POSE, impactT, snappy);
  } else if (rel <= 14) {
    // Rebound and spring back: stretch slightly, wings tuck in
    const reboundT = (rel - 5) / 9;
    const settledPose: CharacterPose = {
      ...IDLE_POSE,
      eyeGazeX: gazeTargetCoords.x,
      eyeGazeY: gazeTargetCoords.y,
    };
    return blendPose(LANDING_REBOUND_POSE, settledPose, reboundT, bouncy);
  } else {
    // Settle into idle with gaze lock
    const settleProgress = clamp((rel - 14) / 10);
    const headLagOscillation = Math.sin((rel - 14) * 0.4) * Math.exp(-(rel - 14) * 0.2) * 4;

    return {
      ...IDLE_POSE,
      headAngle: headLagOscillation,
      eyeGazeX: gazeTargetCoords.x,
      eyeGazeY: gazeTargetCoords.y,
      wingLeftFold: 0.85 + settle(settleProgress) * 0.05,
      wingRightFold: 0.85 + settle(settleProgress) * 0.05,
    };
  }
}

/**
 * Expressive reaction sequence:
 * Eye dart first -> Head follows (2-frame lag) -> Body responds (4-frame lag) -> Secondary settle
 */
export function reactionSequence(
  frame: number,
  triggerFrame: number,
  reaction: 'surprise' | 'delight' | 'curious' = 'delight'
): CharacterPose {
  const rel = frame - triggerFrame;
  if (rel < 0) return IDLE_POSE;

  // 1. Eye leads immediately (frame 0 to 4)
  const eyeT = clamp(rel / 4);
  const targetGazeX = reaction === 'surprise' ? 0 : 0.7;
  const targetGazeY = reaction === 'surprise' ? -0.5 : -0.2;
  const gazeX = targetGazeX * snappy(eyeT);
  const gazeY = targetGazeY * snappy(eyeT);

  // 2. Head follows with 2-frame lag (frame 2 to 8)
  const headRel = Math.max(0, rel - 2);
  const headT = clamp(headRel / 6);
  const headTargetAngle = reaction === 'curious' ? 12 : -6;
  const headAngle = headTargetAngle * overshoot(headT, 0.25, 3, 5);

  // 3. Body reacts with 4-frame lag (frame 4 to 12)
  const bodyRel = Math.max(0, rel - 4);
  const bodyT = clamp(bodyRel / 8);
  const bodySquash = reaction === 'delight' ? 1.0 + overshoot(bodyT, 0.15) * 0.08 : 0.95;
  const bodyY = reaction === 'delight' ? -overshoot(bodyT, 0.2) * 10 : 0;

  return {
    ...IDLE_POSE,
    bodyY,
    squash: bodySquash,
    headAngle,
    eyeGazeX: gazeX,
    eyeGazeY: gazeY,
    eyeScale: reaction === 'surprise' ? 1.3 : 1.1,
    beakOpen: reaction === 'delight' ? 0.35 : 0.1,
    wingLeftAngle: reaction === 'delight' ? -20 : 0,
    wingRightAngle: reaction === 'delight' ? 20 : 0,
  };
}
