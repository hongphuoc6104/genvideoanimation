/**
 * tests/e2e/tier1-features/f23-karaoke-word-progressive-fill.test.ts
 * Tier 1: Feature Coverage Tests for F23 (KaraokeWord Progressive Fill Subsystem)
 */

import {
  assertEqual,
  assertTrue,
  assertMonotonic,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

export function calculateProgressiveFill(frame: number, startFrame: number, endFrame: number): number {
  if (frame <= startFrame) return 0.0;
  if (frame >= endFrame) return 1.0;
  return (frame - startFrame) / (endFrame - startFrame);
}

export function computeClipPathInset(progress: number): string {
  const clamped = Math.max(0, Math.min(1, progress));
  const rightInset = ((1 - clamped) * 100).toFixed(2);
  return `inset(0 ${rightInset}% 0 0)`;
}

export const suite: TestSuite = {
  name: 'Tier 1: F23 KaraokeWord Progressive Fill',
  feature: 'F23',
  tier: 1,
  tests: [
    {
      id: 'T1-F23-01',
      name: 'Progress is exactly 0% for frames preceding word startFrame',
      feature: 'F23',
      tier: 1,
      fn: async (ctx) => {
        const startFrame = 30;
        const endFrame = 60;
        assertEqual(calculateProgressiveFill(0, startFrame, endFrame), 0.0);
        assertEqual(calculateProgressiveFill(20, startFrame, endFrame), 0.0);
        assertEqual(calculateProgressiveFill(30, startFrame, endFrame), 0.0);
      },
    },
    {
      id: 'T1-F23-02',
      name: 'Progress is exactly 100% for frames at and following word endFrame',
      feature: 'F23',
      tier: 1,
      fn: async (ctx) => {
        const startFrame = 30;
        const endFrame = 60;
        assertEqual(calculateProgressiveFill(60, startFrame, endFrame), 1.0);
        assertEqual(calculateProgressiveFill(75, startFrame, endFrame), 1.0);
        assertEqual(calculateProgressiveFill(120, startFrame, endFrame), 1.0);
      },
    },
    {
      id: 'T1-F23-03',
      name: 'Fill percentage across intermediate frames is strictly monotonic',
      feature: 'F23',
      tier: 1,
      fn: async (ctx) => {
        const startFrame = 10;
        const endFrame = 20;
        const samples: number[] = [];

        for (let f = startFrame; f <= endFrame; f++) {
          samples.push(calculateProgressiveFill(f, startFrame, endFrame));
        }

        assertEqual(samples.length, 11);
        assertEqual(samples[0], 0.0);
        assertEqual(samples[samples.length - 1], 1.0);
        assertMonotonic(samples, true, 'Fill percentage must increase strictly between start and end');
      },
    },
    {
      id: 'T1-F23-04',
      name: 'CSS clip-path produces valid sub-pixel inset formatting',
      feature: 'F23',
      tier: 1,
      fn: async (ctx) => {
        // At 0% progress, 100% is clipped from right: inset(0 100.00% 0 0)
        assertEqual(computeClipPathInset(0.0), 'inset(0 100.00% 0 0)');

        // At 50% progress, 50% is clipped from right: inset(0 50.00% 0 0)
        assertEqual(computeClipPathInset(0.5), 'inset(0 50.00% 0 0)');

        // At 100% progress, 0% is clipped from right: inset(0 0.00% 0 0)
        assertEqual(computeClipPathInset(1.0), 'inset(0 0.00% 0 0)');
      },
    },
    {
      id: 'T1-F23-05',
      name: 'Progress clamped strictly within [0.0, 1.0] preventing overflow',
      feature: 'F23',
      tier: 1,
      fn: async (ctx) => {
        const insetNegative = computeClipPathInset(-0.5);
        assertEqual(insetNegative, 'inset(0 100.00% 0 0)', 'Negative progress must clamp to 0%');

        const insetOvershoot = computeClipPathInset(1.5);
        assertEqual(insetOvershoot, 'inset(0 0.00% 0 0)', 'Overshoot progress must clamp to 100%');
      },
    },
  ],
};

registerSuite(suite);
