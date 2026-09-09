/**
 * 2ND-ORDER DAMPED HARMONIC SPRING DYNAMICS
 * Closed-form analytical ODE solver parameterized by PerformanceProfile metrics.
 */

import { PerformanceProfile, ProfileDynamicsState, resolveProfile } from './PerformanceProfile';

export interface SpringParameters {
  readonly omegaN: number;
  readonly zeta: number;
  readonly omegaD: number;
  readonly gamma: number;
}

/**
 * Computes undamped natural frequency (omegaN), damping ratio (zeta),
 * damped frequency (omegaD), and decay constant (gamma) from profile metrics.
 */
export function computeSpringParameters(profile: PerformanceProfile): SpringParameters {
  const timing = Math.max(0.1, profile.timingScale);
  const baseOmega = 8.0;
  const omegaN = baseOmega * timing;

  let zeta: number;
  if (profile.overshootAmplitude <= 0.001) {
    // Solemn or zero-overshoot: critically or slightly overdamped
    zeta = 1.05;
  } else {
    // Fractional peak overshoot relation: Mp = exp(-pi * zeta / sqrt(1 - zeta^2)) = A
    const A = Math.max(0.01, Math.min(1.5, profile.overshootAmplitude));
    const lnA = Math.log(A);
    const z = -lnA / Math.sqrt(Math.PI * Math.PI + lnA * lnA);
    zeta = Math.max(0.05, Math.min(0.999, z));
  }

  const omegaD = zeta < 1.0 ? omegaN * Math.sqrt(1.0 - zeta * zeta) : 0;
  const gamma = zeta * omegaN;

  return { omegaN, zeta, omegaD, gamma };
}

/**
 * Evaluates the exact closed-form analytical state of a 2nd-order damped harmonic spring
 * after time step dt.
 */
export function evaluateProfileDynamics(
  current: number,
  target: number,
  velocity: number,
  profile: PerformanceProfile,
  dt: number
): ProfileDynamicsState {
  if (dt <= 0) {
    const a0 = -2 * profile.damping * velocity - (current - target);
    return { position: current, velocity, acceleration: a0 };
  }

  const { omegaN, zeta, omegaD } = computeSpringParameters(profile);
  const x0 = current - target;
  const v0 = velocity;

  let pos: number;
  let vel: number;

  if (zeta < 0.999) {
    // Underdamped oscillation: x(t) = target + e^(-zeta*wN*t) * (C1*cos(wD*t) + C2*sin(wD*t))
    const C1 = x0;
    const C2 = omegaD > 1e-6 ? (v0 + zeta * omegaN * C1) / omegaD : 0;
    const expDamp = Math.exp(-zeta * omegaN * dt);
    const cosVal = Math.cos(omegaD * dt);
    const sinVal = Math.sin(omegaD * dt);

    pos = target + expDamp * (C1 * cosVal + C2 * sinVal);
    vel =
      expDamp *
      ((v0 - zeta * omegaN * C1) * cosVal -
        (zeta * omegaN * C2 + omegaD * C1) * sinVal);
  } else if (zeta <= 1.001) {
    // Critically damped: x(t) = target + e^(-wN*t) * (C1 + C2*t)
    const C1 = x0;
    const C2 = v0 + omegaN * C1;
    const expDamp = Math.exp(-omegaN * dt);

    pos = target + expDamp * (C1 + C2 * dt);
    vel = expDamp * (v0 - omegaN * C2 * dt);
  } else {
    // Overdamped: x(t) = target + C1*e^(r1*t) + C2*e^(r2*t)
    const omegaR = omegaN * Math.sqrt(zeta * zeta - 1.0);
    const r1 = -omegaN * zeta + omegaR;
    const r2 = -omegaN * zeta - omegaR;
    const diff = r1 - r2;

    const C1 = Math.abs(diff) > 1e-6 ? (v0 - r2 * x0) / diff : x0 * 0.5;
    const C2 = x0 - C1;

    const e1 = Math.exp(r1 * dt);
    const e2 = Math.exp(r2 * dt);

    pos = target + C1 * e1 + C2 * e2;
    vel = C1 * r1 * e1 + C2 * r2 * e2;
  }

  const acc = -2 * zeta * omegaN * vel - omegaN * omegaN * (pos - target);

  return {
    position: Number.isFinite(pos) ? pos : target,
    velocity: Number.isFinite(vel) ? vel : 0,
    acceleration: Number.isFinite(acc) ? acc : 0,
  };
}

/**
 * Computes an entire trajectory across multiple frames using the profile dynamics model.
 */
export function evaluateProfileDynamicsTrajectory(
  initialPos: number,
  targetPos: number,
  totalFrames: number,
  profileInput?: PerformanceProfile | string,
  fps = 30
): ProfileDynamicsState[] {
  const profile = resolveProfile(profileInput);
  const frames = Math.max(1, totalFrames);
  const dt = 1.0 / fps;
  const trajectory: ProfileDynamicsState[] = [];

  let currentPos = initialPos;
  let currentVel = 0;

  for (let f = 0; f <= frames; f++) {
    const state = evaluateProfileDynamics(currentPos, targetPos, currentVel, profile, dt);
    trajectory.push(state);
    currentPos = state.position;
    currentVel = state.velocity;
  }

  return trajectory;
}
