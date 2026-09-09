/**
 * CHARACTER ACTIONS
 * Pre-orchestrated sequence generators for character behaviors:
 * Takeoff, Flight Cycles, Landing Sequences, Gestures, and Reactions.
 * Upgraded to accept PerformanceProfile (calm, energetic, playful, dramatic, solemn)
 * controlling timing, squash, overshoot, follow-through, and settle.
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
import {
  PerformanceProfileType,
  PerformanceProfileConfig,
  resolveProfile,
} from './performance-profiles';

/**
 * Generates an active flight flap cycle pose based on frame number.
 */
export function flightCycle(
  frame: number,
  period = 10,
  options?: {
    bankAngle?: number;
    gazeTarget?: [number, number];
    profile?: PerformanceProfileType | Partial<PerformanceProfileConfig>;
  }
): CharacterPose {
  const p = resolveProfile(options?.profile ?? 'energetic');
  const actualPeriod = Math.max(4, Math.round(period * p.timingMultiplier));
  const phase = (frame % actualPeriod) / actualPeriod; // 0 to 1
  const bank = options?.bankAngle ?? 0;

  // Upstroke (0 to 0.45), Downstroke (0.45 to 1.0)
  let basePose: CharacterPose;
  if (phase < 0.45) {
    const upT = phase / 0.45;
    basePose = blendPose(FLIGHT_DOWNSTROKE_POSE, FLIGHT_UPSTROKE_POSE, upT, decelerate);
  } else {
    const downT = (phase - 0.45) / 0.55;
    basePose = blendPose(FLIGHT_UPSTROKE_POSE, FLIGHT_DOWNSTROKE_POSE, downT, p.easing);
  }

  return {
    ...basePose,
    bodyTilt: (basePose.bodyTilt ?? 0) + bank,
    headAngle: (basePose.headAngle ?? 0) - bank * 0.4, // Head stabilizes against banking
  };
}

/**
 * Takeoff sequence parameterized by PerformanceProfile:
 * Anticipation crouch -> Explosive stretch launch -> Flap transition
 */
export function takeoffSequence(
  frame: number,
  startFrame: number,
  profile?: PerformanceProfileType | Partial<PerformanceProfileConfig>
): CharacterPose {
  const p = resolveProfile(profile ?? 'energetic');
  const rel = frame - startFrame;
  if (rel < 0) return IDLE_POSE;

  const crouchFrames = Math.max(3, Math.round(6 * p.timingMultiplier));
  const launchFrames = Math.max(3, Math.round(6 * p.timingMultiplier));
  const totalDuration = crouchFrames + launchFrames;

  const dynamicCrouchPose: CharacterPose = {
    ...ANTICIPATE_SQUASH_POSE,
    squash: p.squashFactor,
    bodyY: (1 - p.squashFactor) * 50,
  };

  if (rel <= crouchFrames) {
    // Stage 1: Anticipation crouch
    return blendPose(IDLE_POSE, dynamicCrouchPose, rel / crouchFrames, organic);
  } else if (rel <= totalDuration) {
    // Stage 2: Explosive launch with profile overshoot
    const launchRel = (rel - crouchFrames) / launchFrames;
    const stretchPose: CharacterPose = {
      ...IDLE_POSE,
      bodyY: -30 * (1 + p.overshootAmplitude),
      squash: 1 + 0.3 * (1 + p.overshootAmplitude), // Stretch along launch vector
      wingLeftAngle: -45,
      wingRightAngle: -45,
      wingLeftFold: 0.1,
      wingRightFold: 0.1,
      legBend: 0,
      headAngle: -10,
    };
    return blendPose(dynamicCrouchPose, stretchPose, launchRel, p.easing);
  } else {
    // Stage 3: Settle into flight
    return flightCycle(rel - totalDuration, 10, { profile: p });
  }
}

/**
 * Landing sequence:
 * Impact squash -> Rebound overshoot -> Physics settle oscillation.
 * Timing, squash factor, overshoot amplitude, and settle decay are all driven by PerformanceProfile.
 */
export function landingSequence(
  frame: number,
  startFrame: number,
  profileOrOptions?:
    | PerformanceProfileType
    | Partial<PerformanceProfileConfig>
    | { x?: number; y?: number; profile?: PerformanceProfileType | Partial<PerformanceProfileConfig> }
): CharacterPose {
  let profile: PerformanceProfileType | Partial<PerformanceProfileConfig> | undefined;
  let gazeTarget: { x?: number; y?: number } | undefined;

  if (profileOrOptions) {
    if (typeof profileOrOptions === 'string') {
      profile = profileOrOptions;
    } else if ('x' in profileOrOptions || 'y' in profileOrOptions) {
      gazeTarget = { x: (profileOrOptions as any).x, y: (profileOrOptions as any).y };
      profile = (profileOrOptions as any).profile;
    } else {
      profile = profileOrOptions as Partial<PerformanceProfileConfig>;
    }
  }

  const p = resolveProfile(profile ?? 'calm');
  const rel = frame - startFrame;
  if (rel < 0) return IDLE_POSE;

  const impactDuration = Math.max(2, Math.round(4 * p.timingMultiplier));
  const reboundDuration = Math.max(3, Math.round(6 * p.timingMultiplier));
  const settleDuration = Math.max(6, Math.round(14 * p.timingMultiplier));

  const tRebound = impactDuration + reboundDuration;
  const tTotal = tRebound + settleDuration;

  const dynamicImpactPose: CharacterPose = {
    ...LANDING_IMPACT_POSE,
    squash: p.squashFactor,
    bodyY: (1 - p.squashFactor) * 55,
    eyeGazeX: gazeTarget?.x ?? 0,
    eyeGazeY: gazeTarget?.y ?? 0,
  };

  const dynamicReboundPose: CharacterPose = {
    ...LANDING_REBOUND_POSE,
    squash: 1.0 + p.overshootAmplitude * 0.8,
    bodyY: -12 * (1 + p.overshootAmplitude),
    eyeGazeX: gazeTarget?.x ?? 0,
    eyeGazeY: gazeTarget?.y ?? 0,
  };

  if (rel <= impactDuration) {
    // 1. Hard impact squash
    const t = rel / impactDuration;
    return blendPose(IDLE_POSE, dynamicImpactPose, t, snappy);
  } else if (rel <= tRebound) {
    // 2. Elastic rebound with overshoot
    const t = (rel - impactDuration) / reboundDuration;
    return blendPose(dynamicImpactPose, dynamicReboundPose, t, p.easing);
  } else if (rel <= tTotal) {
    // 3. True physics settle oscillation
    const settleProgress = (rel - tRebound) / settleDuration;
    const decay = Math.exp(-settleProgress * p.settleDecay * 12);
    const oscillation = Math.sin(settleProgress * Math.PI * p.settleFrequency * 4) * decay;

    return {
      ...IDLE_POSE,
      bodyY: oscillation * 8 * (1 + p.overshootAmplitude),
      squash: 1.0 + oscillation * 0.15,
      bodyTilt: oscillation * 4,
      headAngle: -oscillation * 3 * (p.followThroughLag / 2),
      wingLeftFold: 0.8 + oscillation * 0.05,
      wingRightFold: 0.8 + oscillation * 0.05,
    };
  }

  return IDLE_POSE;
}

/**
 * Reaction sequence (e.g. shock, realization, delight, curiosity, solemn agreement):
 * Parameterized by reaction type and PerformanceProfile.
 */
export function reactionSequence(
  frame: number,
  startFrame: number,
  reaction: 'shock' | 'delight' | 'curious' | 'realization' | 'solemn' = 'delight',
  profile?: PerformanceProfileType | Partial<PerformanceProfileConfig>
): CharacterPose {
  const p = resolveProfile(profile ?? (reaction === 'solemn' ? 'solemn' : 'energetic'));
  const rel = frame - startFrame;
  if (rel < 0) return IDLE_POSE;

  const antDuration = Math.max(2, Math.round(5 * p.timingMultiplier));
  const peakDuration = Math.max(3, Math.round(8 * p.timingMultiplier));
  const settleDuration = Math.max(5, Math.round(15 * p.timingMultiplier));

  if (reaction === 'delight') {
    if (rel < antDuration) {
      // Crouch down slightly before jumping up
      const t = rel / antDuration;
      return {
        ...IDLE_POSE,
        bodyY: t * 12,
        squash: 1 - (1 - p.squashFactor) * 0.6 * t,
      };
    } else if (rel < antDuration + peakDuration) {
      const t = (rel - antDuration) / peakDuration;
      const pop = overshoot(t, p.overshootAmplitude);
      return {
        ...IDLE_POSE,
        bodyY: -25 * pop,
        squash: 1.0 + 0.22 * pop,
        bodyTilt: -6 * pop,
        headAngle: 12 * pop,
        eyeScale: 1.0 + 0.3 * pop,
        wingLeftAngle: -50 * pop,
        wingRightAngle: -50 * pop,
        wingLeftFold: 0.2,
        wingRightFold: 0.2,
      };
    } else {
      const settleT = clamp((rel - antDuration - peakDuration) / settleDuration);
      const s = settle(settleT, p.settleFrequency, p.settleDecay);
      return {
        ...IDLE_POSE,
        bodyY: s * -4,
        bodyTilt: s * -2,
        headAngle: s * 3,
        wingLeftAngle: -20 * (1 - settleT),
        wingRightAngle: -20 * (1 - settleT),
      };
    }
  }

  if (reaction === 'solemn') {
    // Restrained, dignified nod
    const total = antDuration + peakDuration + settleDuration;
    const t = clamp(rel / total);
    const nod = Math.sin(t * Math.PI) * 12;
    return {
      ...IDLE_POSE,
      bodyTilt: nod * 0.2,
      headAngle: nod * 0.8,
      eyeScale: 0.95,
      squash: 1.0 - nod * 0.005,
    };
  }

  // Realization / Curious
  const pop = overshoot(clamp(rel / (antDuration + peakDuration)), p.overshootAmplitude);
  return {
    ...IDLE_POSE,
    headAngle: 18 * pop,
    headY: -8 * pop,
    eyeScale: 1.0 + 0.25 * pop,
    eyeGazeX: 0.5 * pop,
    eyeGazeY: -0.4 * pop,
    bodyTilt: -4 * pop,
  };
}
