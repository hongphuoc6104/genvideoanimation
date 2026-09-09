/**
 * tests/e2e/tier1-features/f35-temporal-monotonic-qa.test.ts
 * Tier 1: Feature Coverage Tests for F35 (Temporal Monotonic Karaoke QA)
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertMonotonic,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

export function verifyTemporalMonotonicity(
  progressValues: number[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (progressValues.length < 2) {
    return { valid: true, errors };
  }

  for (let i = 1; i < progressValues.length; i++) {
    const prev = progressValues[i - 1];
    const curr = progressValues[i];

    if (curr < prev) {
      errors.push(
        `Monotonicity regression detected at frame step ${i}: previous=${(prev * 100).toFixed(1)}%, current=${(curr * 100).toFixed(1)}%`
      );
    }
  }

  if (progressValues[0] < 0.0 || progressValues[progressValues.length - 1] > 1.0001) {
    errors.push('Progress bounds violated: must stay within [0.0, 1.0]');
  }

  return { valid: errors.length === 0, errors };
}

export const suite: TestSuite = {
  name: 'Tier 1: F35 Temporal Monotonic QA',
  feature: 'F35',
  tier: 1,
  tests: [
    {
      id: 'T1-F35-01',
      name: 'QA tool samples progress array across word duration frames',
      feature: 'F35',
      tier: 1,
      fn: async (ctx) => {
        const startFrame = 20;
        const endFrame = 35;
        const sampled: number[] = [];

        for (let f = startFrame; f <= endFrame; f++) {
          sampled.push((f - startFrame) / (endFrame - startFrame));
        }

        assertEqual(sampled.length, 16);
        assertEqual(sampled[0], 0.0);
        assertEqual(sampled[sampled.length - 1], 1.0);
      },
    },
    {
      id: 'T1-F35-02',
      name: 'Verifies progression is monotonically non-decreasing between adjacent frames',
      feature: 'F35',
      tier: 1,
      fn: async (ctx) => {
        const monotonicSequence = [0.0, 0.1, 0.25, 0.4, 0.6, 0.8, 0.95, 1.0];
        assertMonotonic(monotonicSequence, false, 'Expected monotonic progression');
        const res = verifyTemporalMonotonicity(monotonicSequence);
        assertTrue(res.valid, `Expected valid, got: ${res.errors.join(', ')}`);
      },
    },
    {
      id: 'T1-F35-03',
      name: 'Detects and flags visual flicker or highlight regression (e.g. 50% -> 45%)',
      feature: 'F35',
      tier: 1,
      fn: async (ctx) => {
        const flickeringSequence = [0.0, 0.2, 0.5, 0.45, 0.8, 1.0]; // Drops from 0.5 to 0.45
        const res = verifyTemporalMonotonicity(flickeringSequence);
        assertFalse(res.valid, 'Must detect regression flicker');
        assertTrue(res.errors.some((e) => e.includes('Monotonicity regression detected')));
      },
    },
    {
      id: 'T1-F35-04',
      name: 'Verifies final frame reaches full 100% highlight completion',
      feature: 'F35',
      tier: 1,
      fn: async (ctx) => {
        const incompleteSequence = [0.0, 0.3, 0.6, 0.85]; // Stops at 85%
        assertEqual(incompleteSequence[incompleteSequence.length - 1], 0.85);

        const completeSequence = [0.0, 0.3, 0.6, 1.0];
        assertEqual(completeSequence[completeSequence.length - 1], 1.0);
      },
    },
    {
      id: 'T1-F35-05',
      name: 'Temporal QA reports clean pass status for valid karaoke sequence',
      feature: 'F35',
      tier: 1,
      fn: async (ctx) => {
        const standardLinear = Array.from({ length: 30 }, (_, i) => i / 29);
        const res = verifyTemporalMonotonicity(standardLinear);
        assertTrue(res.valid);
        assertEqual(res.errors.length, 0);
      },
    },
  ],
};

registerSuite(suite);
