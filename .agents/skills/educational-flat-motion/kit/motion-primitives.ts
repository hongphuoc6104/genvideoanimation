/**
 * MOTION PRIMITIVES
 * Pure mathematical and physical utilities for Remotion flat vector animation.
 * Follows 12 Principles of Animation: Squash & Stretch, Anticipation,
 * Follow-Through, Arcs, and Secondary Action.
 */

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

/**
 * Volume-conserving squash and stretch deformation.
 * When squashing vertically (scaleY < 1), scaleX expands to conserve apparent 2D volume:
 * scaleX = 1 / sqrt(scaleY)
 */
export interface SquashStretchResult {
  scaleX: number;
  scaleY: number;
}

export function squashStretch(verticalScale: number): SquashStretchResult {
  const safeY = Math.max(0.05, verticalScale);
  const scaleX = 1 / Math.sqrt(safeY);
  return { scaleX, scaleY: safeY };
}

/**
 * Anticipation helper:
 * Pulls slightly in the negative direction (wind-up) before springing forward.
 * @param t Normalized progress (0 to 1)
 * @param pullBack Amplitude of the backward anticipation (e.g. 0.12)
 */
export function anticipate(t: number, pullBack = 0.15): number {
  const clamped = clamp(t);
  return clamped * clamped * ((pullBack + 1) * clamped - pullBack);
}

/**
 * Damped harmonic oscillator / overshoot curve:
 * Passes the target 1.0, bounces back and settles cleanly at 1.0.
 * @param t Progress from 0 to 1
 * @param amplitude Initial overshoot magnitude (e.g. 0.22)
 * @param frequency Number of oscillations
 * @param decay Damping rate
 */
export function overshoot(
  t: number,
  amplitude = 0.22,
  frequency = 4,
  decay = 6
): number {
  const clamped = clamp(t);
  if (clamped >= 1) return 1;
  const decayFactor = Math.exp(-clamped * decay);
  const oscillation = Math.sin(clamped * frequency * Math.PI) * amplitude;
  return 1 - (1 - clamped) + oscillation * decayFactor;
}

/**
 * Multi-bounce settling curve, ideal for dropped objects or impact landing.
 */
export function settle(t: number, bounces = 2, decay = 7): number {
  const clamped = clamp(t);
  if (clamped >= 1) return 1;
  const wave = Math.cos(clamped * bounces * Math.PI * 2);
  const damping = Math.exp(-clamped * decay);
  return 1 - (1 - clamped) * wave * damping;
}

/**
 * Secondary follow-through calculation:
 * Delays a motion by a given number of frames with dampening.
 */
export function followThrough(
  currentFrame: number,
  driverFrame: number,
  lagFrames = 3,
  damping = 0.85
): number {
  const diff = currentFrame - driverFrame;
  if (diff <= 0) return 0;
  const progress = clamp(diff / (lagFrames * 4));
  return overshoot(progress, 0.15 * damping, 3, 5);
}

/**
 * Quadratic Bezier curve for natural curved flight / travel trajectories (Arcs).
 */
export function arcTrajectory(
  p0: [number, number],
  p1: [number, number], // Control point (peak of arc)
  p2: [number, number],
  t: number
): [number, number] {
  const clamped = clamp(t);
  const u = 1 - clamped;
  const tt = clamped * clamped;
  const uu = u * u;
  const x = uu * p0[0] + 2 * u * clamped * p1[0] + tt * p2[0];
  const y = uu * p0[1] + 2 * u * clamped * p1[1] + tt * p2[1];
  return [x, y];
}

/**
 * Cubic Bezier curve for S-curves and flight swoops.
 */
export function cubicTrajectory(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const clamped = clamp(t);
  const u = 1 - clamped;
  const x =
    u * u * u * p0[0] +
    3 * u * u * clamped * p1[0] +
    3 * u * clamped * clamped * p2[0] +
    clamped * clamped * clamped * p3[0];
  const y =
    u * u * u * p0[1] +
    3 * u * u * clamped * p1[1] +
    3 * u * clamped * clamped * p2[1] +
    clamped * clamped * clamped * p3[1];
  return [x, y];
}

/**
 * Calculates pupil gaze offsets toward a world target coordinate.
 * Clamps maximum pupil travel inside the eye socket.
 */
export function gazeTarget(
  pupilMaxRadius: number,
  characterPos: [number, number],
  targetPos: [number, number]
): { pupilX: number; pupilY: number } {
  const dx = targetPos[0] - characterPos[0];
  const dy = targetPos[1] - characterPos[1];
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return { pupilX: 0, pupilY: 0 };
  const travel = Math.min(pupilMaxRadius, dist * 0.05);
  return {
    pupilX: (dx / dist) * travel,
    pupilY: (dy / dist) * travel,
  };
}

/**
 * Staggered delay for secondary element animations.
 */
export function stagger(index: number, baseFrame: number, delayPerIndex = 2): number {
  return baseFrame + index * delayPerIndex;
}
