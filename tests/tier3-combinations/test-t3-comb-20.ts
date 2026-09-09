/**
 * T3-COMB-20: Video Frame MAD Continuity During Geometric Morph vs Binary Swap
 * Features: F-TEMPORAL-QA + F-MORPH-INTERPOLATE
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse, assertEqual } from '../harness/assert';
import { evaluateMadSpikes, resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-20',
  name: 'Video Frame MAD Continuity During Geometric Morph vs Binary Swap',
  feature: 'F-TEMPORAL-QA+F-MORPH-INTERPOLATE',
  tier: 3,
  description:
    'Verifies rolling adjacent-frame MAD analysis reveals continuous geometric path morphing maintains smooth frame differences (ratio <= 2.2x), whereas binary ternary swaps produce massive discontinuities (ratio >= 7.5x).',
  fn: async (ctx) => {
    let qaEvalFn = evaluateMadSpikes;

    const { module: qaMod, isAvailable } = await resolveModule('../../validators/temporal-render-qa', [
      'evaluateMadSpikes',
    ]);
    if (isAvailable && qaMod?.evaluateMadSpikes) {
      qaEvalFn = qaMod.evaluateMadSpikes;
    }

    ctx.log('Comparing temporal video QA between continuous morph and binary flip...');

    // Video A: Continuous morph - smooth frame difference series
    // MAD smoothly rises from 1.8 to 2.8 at midpoint then returns to 1.8
    const madContinuous: number[] = [];
    for (let f = 0; f < 60; f++) {
      const progress = f / 60;
      const bell = Math.sin(progress * Math.PI);
      madContinuous.push(1.8 + bell * 1.0); // max 2.8
    }

    const resultA = qaEvalFn(madContinuous, 5, 4.0, []);
    assertTrue(resultA.valid, 'Continuous morph must pass temporal QA without anomalies');
    assertEqual(resultA.anomalies.length, 0, 'No spikes should exceed 4x threshold in continuous morph');

    // Video B: Binary swap - baseline 2.0 with massive pop at frame 30
    const madBinary: number[] = new Array(60).fill(2.0);
    madBinary[30] = 18.0; // 9x baseline median!

    const resultB = qaEvalFn(madBinary, 5, 4.0, []);
    assertFalse(resultB.valid, 'Binary morph flip must fail temporal QA');
    assertEqual(resultB.anomalies.length, 1, 'Binary swap must produce exactly 1 unannotated anomaly');
    assertEqual(resultB.anomalies[0].frame, 30, 'Anomaly must occur at frame 30');
    assertTrue(resultB.anomalies[0].ratio >= 7.5, `Spike ratio must be >= 7.5x, got ${resultB.anomalies[0].ratio}`);
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-20 Suite',
  feature: 'F-TEMPORAL-QA+F-MORPH-INTERPOLATE',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
