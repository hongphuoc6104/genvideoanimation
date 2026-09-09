/**
 * PROFILE-DRIVEN ACTION EVALUATORS & CURVES
 * Provides anticipation, overshoot, settle, oscillator, and volume-conserving squash math.
 */

import {
  PerformanceProfile,
  SquashStretchResult,
  resolveProfile,
} from './PerformanceProfile';

/**
 * Evaluates profile-driven anticipation displacement.
 * Reaches peak negative pullback at t = 0.5: y(0.5) = -anticipationRatio.
 * At t <= 0 or t >= 1, evaluates to 0.0.
 */
export function evaluateAnticipation(
  t: number,
  profileInput?: PerformanceProfile | any
): number {
  if (t <= 0 || t >= 1) {
    return 0.0;
  }
  const profile = resolveProfile(profileInput);
  const pullBack =
    profile.anticipation?.pullBack ??
    profile.anticipationRatio ??
    0.1;

  // Exact sinusoidal negative windup
  return -pullBack * Math.sin(Math.PI * t);
}

/**
 * Evaluates profile-driven overshoot trajectory.
 * Bounded by: t = 0.0 => 0.0; t = 1.0 => 1.0.
 * Out of bounds t < 0 clamps to 0.0, t > 1 clamps to 1.0.
 * Peak under energetic profile reaches between 1.25 and 1.35.
 * Strictly monotonic non-decreasing under solemn (amplitude = 0).
 */
export function evaluateOvershoot(
  t: number,
  profileInput?: PerformanceProfile | any
): number {
  if (t <= 0.0) {
    return 0.0;
  }
  if (t >= 1.0) {
    return 1.0;
  }

  const profile = resolveProfile(profileInput);
  const amplitude =
    profile.overshoot?.amplitude ??
    profile.overshootAmplitude ??
    0.0;

  const tClamped = Math.max(0, Math.min(1, t));
  const baseEase = 1.0 - Math.pow(1.0 - tClamped, 4);

  if (amplitude <= 0.0001) {
    return baseEase;
  }

  return baseEase + amplitude * Math.sin(Math.PI * tClamped);
}

/**
 * Evaluates profile-driven settle oscillation trajectory.
 * Under playful: produces >= 3 zero crossings around 1.0.
 * Under solemn: monotonic non-decreasing, max <= 1.00001.
 * Safely handles extreme decay (e.g. 1e9) at t > 0 without NaN or overflow.
 */
export function evaluateSettle(
  t: number,
  profileInput?: PerformanceProfile | any
): number {
  if (t <= 0.0) {
    return 0.0;
  }
  if (t >= 1.0) {
    return 1.0;
  }

  const profile = resolveProfile(profileInput);
  const bounces =
    profile.settle?.bounces ??
    profile.settleOscillationCount ??
    0;
  const decay =
    profile.settle?.decay ??
    profile.settleDecayRate ??
    2.0;

  // Defense against extreme decay rate
  if (decay >= 1000.0) {
    return 1.0;
  }

  if (bounces === 0) {
    // Monotonic non-decreasing exponential approach
    const expTerm = Math.exp(-decay * t);
    return 1.0 - (1.0 - t) * expTerm;
  }

  // Damped harmonic oscillation
  const expTerm = Math.exp(-decay * t);
  const oscTerm = Math.cos(2.0 * Math.PI * bounces * t);
  return 1.0 - (1.0 - t) * oscTerm * expTerm;
}

/**
 * Computes volume-conserving squash and stretch scale factors.
 * In 2D/3D continuum mechanics, volume preservation gives:
 * scaleX * scaleX * scaleY = 1  => scaleX = 1 / sqrt(scaleY).
 * Implements safe floor when verticalScale <= 0: scaleX <= 5.0, non-zero and finite.
 */
export function squashStretch(
  verticalScale: number,
  volumePreserve = true
): SquashStretchResult {
  const safeY = Math.max(0.04, verticalScale);
  const safeScaleY = Number.isFinite(verticalScale) ? verticalScale : 1.0;

  if (!volumePreserve) {
    return { scaleX: 1.0, scaleY: safeScaleY };
  }

  const rawScaleX = 1.0 / Math.sqrt(safeY);
  const scaleX = Math.min(5.0, Math.max(0.2, Number.isFinite(rawScaleX) ? rawScaleX : 1.0));

  return { scaleX, scaleY: safeScaleY };
}

/**
 * Evaluates a generic harmonic oscillator with damping.
 * Guaranteed to stay bounded by 1.0 + amplitude even when decay is 0.
 */
export function evaluateOscillator(
  t: number,
  amplitude: number,
  frequency: number,
  decay: number
): number {
  if (!Number.isFinite(t)) return 1.0;
  const amp = Number.isFinite(amplitude) ? amplitude : 0;
  const freq = Number.isFinite(frequency) ? frequency : 1;
  const dec = Math.max(0, Number.isFinite(decay) ? decay : 0);

  const damp = dec > 0 ? Math.exp(-dec * t) : 1.0;
  return 1.0 + amp * Math.sin(Math.PI * freq * t) * damp;
}

// ---------------------------------------------------------------------------
// Action Pose Generators
// ---------------------------------------------------------------------------

export interface ActionPoseResult {
  rootOffset: { x: number; y: number };
  torsoOffset: { x: number; y: number };
  squash: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  expression?: Record<string, any>;
  limbs?: Record<string, any>;
}

/**
 * Generates anticipation state at normalized progress t [0, 1].
 */
export function anticipateAction(
  t: number,
  profileInput?: PerformanceProfile | any
): ActionPoseResult {
  const profile = resolveProfile(profileInput);
  const disp = evaluateAnticipation(t, profile) * 40.0; // 40px base displacement
  const squashFactor = profile.anticipation?.squashRatio ?? profile.squashFactor ?? 0.85;
  const currentSquash = 1.0 - (1.0 - squashFactor) * Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
  const { scaleX, scaleY } = squashStretch(currentSquash);

  return {
    rootOffset: { x: disp, y: disp * 0.5 },
    torsoOffset: { x: disp, y: disp * 0.5 },
    squash: currentSquash,
    scaleX,
    scaleY,
    rotation: -disp * 0.2,
    expression: { eyeScale: 1.15, mouthOpen: 0.1 },
  };
}

/**
 * Generates overshoot state at normalized progress t [0, 1].
 */
export function overshootAction(
  t: number,
  profileInput?: PerformanceProfile | any
): ActionPoseResult {
  const profile = resolveProfile(profileInput);
  const p = evaluateOvershoot(t, profile);
  const amp = profile.overshoot?.amplitude ?? profile.overshootAmplitude ?? 0.1;
  const stretchY = 1.0 + amp * 0.5 * (1.0 - Math.max(0, Math.min(1, t)));
  const { scaleX, scaleY } = squashStretch(stretchY);

  return {
    rootOffset: { x: (p - 1.0) * 20.0, y: (p - 1.0) * 15.0 },
    torsoOffset: { x: (p - 1.0) * 20.0, y: (p - 1.0) * 15.0 },
    squash: stretchY,
    scaleX,
    scaleY,
    rotation: (p - 1.0) * 10.0,
    expression: { eyeScale: 1.0, mouthOpen: Math.max(0, (p - 1.0) * 2.0) },
  };
}

/**
 * Generates settle state at normalized progress t [0, 1].
 */
export function settleAction(
  t: number,
  profileInput?: PerformanceProfile | any
): ActionPoseResult {
  const profile = resolveProfile(profileInput);
  const s = evaluateSettle(t, profile);
  const { scaleX, scaleY } = squashStretch(1.0);

  return {
    rootOffset: { x: (1.0 - s) * 5.0, y: (1.0 - s) * 5.0 },
    torsoOffset: { x: (1.0 - s) * 5.0, y: (1.0 - s) * 5.0 },
    squash: 1.0,
    scaleX,
    scaleY,
    rotation: (1.0 - s) * 2.0,
    expression: { eyeScale: 1.0, mouthOpen: 0.0 },
  };
}
