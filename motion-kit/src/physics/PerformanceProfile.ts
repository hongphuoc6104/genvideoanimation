/**
 * PERFORMANCE PROFILES
 * Physics-backed parameter configurations for character and element dynamics.
 * Controls timing duration, squash depth, overshoot amplitude, follow-through lag,
 * and settle damping across 5 distinct character temperaments.
 */

import { snappy, bouncy, heavy, organic } from '../../motion-profiles';

export type PerformanceProfileName =
  | 'calm'
  | 'energetic'
  | 'playful'
  | 'dramatic'
  | 'solemn';

export type PerformanceProfileType = PerformanceProfileName;

export interface SquashStretchResult {
  readonly scaleX: number;
  readonly scaleY: number;
}

export interface ProfileDynamicsState {
  readonly position: number;
  readonly velocity: number;
  readonly acceleration: number;
}

export interface PerformanceProfile {
  readonly name: PerformanceProfileName;
  /** Speed multiplier (higher = faster motion, shorter duration; base default = 1.0) */
  readonly timingScale: number;
  /** Legacy alias for timingScale */
  readonly timingMultiplier: number;
  /** Minimum scaleY during anticipation or landing squash [0.04, 1.0] */
  readonly squashFactor: number;
  /** Pull-back ratio during anticipation windup [0.0, 1.0] */
  readonly anticipationRatio: number;
  /** Peak overshoot amplitude above 1.0 target [0.0, 1.0] */
  readonly overshootAmplitude: number;
  /** Secondary motion lag frames for appendages (hair, tail, limbs) */
  readonly followThroughLagFrames: number;
  /** Legacy alias for followThroughLagFrames */
  readonly followThroughLag: number;
  /** Number of oscillation cycles before settling to rest */
  readonly settleOscillationCount: number;
  /** Legacy alias for settleOscillationCount */
  readonly settleFrequency: number;
  /** Exponential damping rate for settle oscillations */
  readonly settleDecayRate: number;
  /** Legacy alias for settleDecayRate */
  readonly settleDecay: number;
  /** Effective damping coefficient */
  readonly damping: number;

  // Nested structural aliases for E2E harness compatibility
  readonly anticipation: {
    readonly pullBack: number;
    readonly squashRatio: number;
  };
  readonly overshoot: {
    readonly amplitude: number;
    readonly decay: number;
    readonly frequency: number;
  };
  readonly followThrough: {
    readonly lagFrames: number;
    readonly damping: number;
  };
  readonly settle: {
    readonly bounces: number;
    readonly decay: number;
    readonly durationFrames: number;
  };
  readonly primaryEasing?: (t: number) => number;
  /** Legacy alias for primaryEasing */
  readonly easing: (t: number) => number;
}

export type PerformanceProfileConfig = PerformanceProfile;

function createFrozenProfile(
  name: PerformanceProfileName,
  timingScale: number,
  squashFactor: number,
  anticipationRatio: number,
  overshootAmplitude: number,
  followThroughLagFrames: number,
  settleOscillationCount: number,
  settleDecayRate: number,
  damping: number,
  primaryEasing: (t: number) => number
): PerformanceProfile {
  const anticipation = Object.freeze({
    pullBack: anticipationRatio,
    squashRatio: squashFactor,
  });

  const overshoot = Object.freeze({
    amplitude: overshootAmplitude,
    decay: settleDecayRate,
    frequency: settleOscillationCount,
  });

  const followThrough = Object.freeze({
    lagFrames: followThroughLagFrames,
    damping,
  });

  const settle = Object.freeze({
    bounces: settleOscillationCount,
    decay: settleDecayRate,
    durationFrames: Math.round(20 / timingScale),
  });

  return Object.freeze({
    name,
    timingScale,
    timingMultiplier: timingScale,
    squashFactor,
    anticipationRatio,
    overshootAmplitude,
    followThroughLagFrames,
    followThroughLag: followThroughLagFrames,
    settleOscillationCount,
    settleFrequency: settleOscillationCount,
    settleDecayRate,
    settleDecay: settleDecayRate,
    damping,
    anticipation,
    overshoot,
    followThrough,
    settle,
    primaryEasing,
    easing: primaryEasing,
  });
}

export const PERFORMANCE_PROFILES: Readonly<Record<PerformanceProfileName, PerformanceProfile>> =
  Object.freeze({
    calm: createFrozenProfile(
      'calm',
      0.85, // timingScale ~0.90 +- 0.15
      0.90, // squashFactor
      0.08, // pullBack <= 0.10
      0.06, // overshoot <= 0.10
      4,    // followThroughLagFrames
      1,    // settleOscillationCount <= 1
      2.0,  // settleDecayRate
      0.80, // damping
      organic
    ),

    energetic: createFrozenProfile(
      'energetic',
      1.35, // timingScale >= 1.20, energetic/calm ratio = 1.35/0.85 = 1.588 >= 1.5
      0.72, // deeper squash than calm (0.72 < 0.90)
      0.25, // pullBack >= 0.20
      0.32, // overshoot >= 0.30, peak in [1.25, 1.35]
      2,    // followThroughLagFrames
      2,    // settleOscillationCount >= 2
      3.0,  // settleDecayRate
      0.60, // damping
      snappy
    ),

    playful: createFrozenProfile(
      'playful',
      1.00, // timingScale
      0.65, // squashFactor <= 0.70
      0.20, // pullBack
      0.38, // overshoot >= 0.35
      3,    // followThroughLagFrames
      3,    // settleOscillationCount >= 3
      1.5,  // settleDecayRate
      0.50, // damping
      bouncy
    ),

    dramatic: createFrozenProfile(
      'dramatic',
      1.00, // timingScale
      0.70, // squashFactor
      0.28, // anticipationRatio > 0.20, exactly 0.28 for -0.28 pullBack at t=0.5
      0.25, // overshootAmplitude
      5,    // followThroughLagFrames
      2,    // settleOscillationCount
      2.5,  // settleDecayRate
      0.70, // damping
      heavy
    ),

    solemn: createFrozenProfile(
      'solemn',
      0.85, // timingScale
      0.97, // squashFactor >= 0.95
      0.04, // pullBack <= 0.05
      0.00, // overshootAmplitude strictly 0.0
      2,    // followThroughLagFrames
      0,    // settleOscillationCount strictly 0
      4.5,  // settleDecayRate >= 4.0
      0.95, // damping
      organic
    ),
  });

/**
 * Validates and retrieves a performance profile by name.
 * Throws a descriptive error if the profile name is unrecognized.
 */
export function getPerformanceProfile(name: PerformanceProfileName | string): PerformanceProfile {
  const profile = PERFORMANCE_PROFILES[name as PerformanceProfileName];
  if (!profile) {
    throw new Error(
      `Unknown performance profile: "${name}". Valid profiles are: calm, energetic, playful, dramatic, solemn.`
    );
  }
  return profile;
}

/**
 * Sanitizes an incoming profile or partial configuration, applying critical safety clamps:
 * - Clamps damping to >= 0.05 to avoid infinite resonance.
 * - Clamps timingScale to >= 0.1 to avoid negative or zero duration.
 */
export function sanitizeProfile(input: any): PerformanceProfile {
  if (!input || typeof input !== 'object') {
    return PERFORMANCE_PROFILES.calm;
  }

  const baseName: PerformanceProfileName =
    input.name && input.name in PERFORMANCE_PROFILES ? input.name : 'calm';
  const base = PERFORMANCE_PROFILES[baseName];

  const rawTiming = input.timingScale ?? input.timingMultiplier ?? base.timingScale;
  const timingScale = Math.max(0.1, Number.isFinite(rawTiming) ? rawTiming : 1.0);

  const rawDamping =
    input.damping ?? input.followThrough?.damping ?? base.damping;
  const damping = Math.max(0.05, Number.isFinite(rawDamping) ? rawDamping : 0.5);

  const rawSquash = input.squashFactor ?? input.anticipation?.squashRatio ?? base.squashFactor;
  const squashFactor = Math.max(0.04, Math.min(1.0, Number.isFinite(rawSquash) ? rawSquash : 0.85));

  const rawPullBack = input.anticipationRatio ?? input.anticipation?.pullBack ?? base.anticipationRatio;
  const anticipationRatio = Math.max(0.0, Math.min(1.0, Number.isFinite(rawPullBack) ? rawPullBack : 0.1));

  const rawOvershoot = input.overshootAmplitude ?? input.overshoot?.amplitude ?? base.overshootAmplitude;
  const overshootAmplitude = Math.max(0.0, Math.min(2.0, Number.isFinite(rawOvershoot) ? rawOvershoot : 0.0));

  const rawLag = input.followThroughLagFrames ?? input.followThroughLag ?? input.followThrough?.lagFrames ?? base.followThroughLagFrames;
  const followThroughLagFrames = Math.max(0, Math.round(Number.isFinite(rawLag) ? rawLag : 2));

  const rawBounces = input.settleOscillationCount ?? input.settleFrequency ?? input.settle?.bounces ?? base.settleOscillationCount;
  const settleOscillationCount = Math.max(0, Math.round(Number.isFinite(rawBounces) ? rawBounces : 1));

  const rawDecay = input.settleDecayRate ?? input.settleDecay ?? input.settle?.decay ?? base.settleDecayRate;
  const settleDecayRate = Math.max(0.01, Number.isFinite(rawDecay) ? rawDecay : 2.0);

  return createFrozenProfile(
    baseName,
    timingScale,
    squashFactor,
    anticipationRatio,
    overshootAmplitude,
    followThroughLagFrames,
    settleOscillationCount,
    settleDecayRate,
    damping,
    input.primaryEasing ?? input.easing ?? base.primaryEasing
  );
}

/**
 * Resolves an arbitrary profile identifier or configuration into a verified PerformanceProfile.
 */
export function resolveProfile(input?: string | Partial<PerformanceProfile> | null): PerformanceProfile {
  if (!input) {
    return PERFORMANCE_PROFILES.calm;
  }
  if (typeof input === 'string') {
    return getPerformanceProfile(input);
  }
  return sanitizeProfile(input);
}
