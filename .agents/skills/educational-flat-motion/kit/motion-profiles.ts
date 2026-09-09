/**
 * MOTION PROFILES
 * Curated easing curves designed for physical and biological realism in flat-vector motion.
 */

import { clamp } from './motion-primitives';

export type EasingFunction = (t: number) => number;

/**
 * Snappy: Instant explosive launch, fast deceleration, crisp stop.
 * Best for: UI elements, eye gaze darts, swift character reactions, wing snaps.
 */
export const snappy: EasingFunction = (t: number) => {
  const c = clamp(t);
  return 1 - Math.pow(1 - c, 4);
};

/**
 * Heavy: Slow start against inertia, massive momentum, gradual stop.
 * Best for: Planets, massive structures, slow emotional turns, heavy machinery.
 */
export const heavy: EasingFunction = (t: number) => {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/**
 * Bouncy: Energetic overshoot with subtle rebound.
 * Best for: Character landings, squash-recovery, dropped items, pop-in badges.
 */
export const bouncy: EasingFunction = (t: number) => {
  const c = clamp(t);
  const n1 = 7.5625;
  const d1 = 2.75;

  if (c < 1 / d1) {
    return n1 * c * c;
  } else if (c < 2 / d1) {
    const x = c - 1.5 / d1;
    return n1 * x * x + 0.75;
  } else if (c < 2.5 / d1) {
    const x = c - 2.25 / d1;
    return n1 * x * x + 0.9375;
  } else {
    const x = c - 2.625 / d1;
    return n1 * x * x + 0.984375;
  }
};

/**
 * Organic: Natural biological ease (gentle acceleration and deceleration).
 * Best for: Creature breathing, head turns, branch swaying, subtle floats.
 */
export const organic: EasingFunction = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

/**
 * Linear: Constant velocity.
 * Best for: Orbital rotation, steady backgrounds, continuous ticker.
 */
export const linear: EasingFunction = (t: number) => clamp(t);

/**
 * Decelerate: Rapid initial burst with long glide.
 * Best for: Skidding to a halt, air-braking, deceleration flair.
 */
export const decelerate: EasingFunction = (t: number) => {
  const c = clamp(t);
  return 1 - Math.pow(1 - c, 2);
};

export const MOTION_PROFILES = {
  snappy,
  heavy,
  bouncy,
  organic,
  linear,
  decelerate,
};
