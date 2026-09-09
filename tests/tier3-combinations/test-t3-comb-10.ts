/**
 * T3-COMB-10: ShotSpec Impact Whitelist vs Temporal QA Spike Detection
 * Features: F-SHOTSPEC-CUES + F-TEMPORAL-QA
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse, assertEqual, assertClose } from '../harness/assert';
import { resolveModule, evaluateMadSpikes } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-10',
  name: 'ShotSpec Impact Whitelist vs Temporal QA Spike Detection',
  feature: 'F-SHOTSPEC-CUES+F-TEMPORAL-QA',
  tier: 3,
  description:
    'Verifies high-velocity impact frame with MAD ratio > 4.0x is permitted when declared in ShotSpec impact whitelist, but rejected as a QA failure when omitted.',
  fn: async (ctx) => {
    let qaEvalFn = evaluateMadSpikes;

    // Try resolving from validators/temporal-render-qa if present
    const { module: qaMod, isAvailable } = await resolveModule('../../validators/temporal-render-qa', [
      'evaluateMadSpikes',
    ]);
    if (isAvailable && qaMod?.evaluateMadSpikes) {
      qaEvalFn = qaMod.evaluateMadSpikes;
    }

    ctx.log('Testing MAD spike filter with whitelisted and non-whitelisted shock frames...');

    // 60 frames with steady motion of MAD = 2.0
    const madSeries = new Array(60).fill(2.0);
    // Frame 30 has abrupt landing shock of MAD = 11.6 (5.8x local median)
    madSeries[30] = 11.6;

    // Test Case A: Frame 30 is whitelisted in ShotSpec
    const resultA = qaEvalFn(madSeries, 5, 4.0, [30]);
    assertTrue(resultA.valid, 'Evaluation with whitelisted impact frame must PASS QA');
    assertEqual(resultA.anomalies.length, 0, 'No unannotated anomalies should be reported');
    assertTrue(
      resultA.whitelistedEvents.some((e: any) => e.frame === 30),
      'Frame 30 must be recorded in whitelistedEvents'
    );

    // Test Case B: Frame 30 is NOT whitelisted
    const resultB = qaEvalFn(madSeries, 5, 4.0, []);
    assertFalse(resultB.valid, 'Evaluation with unannotated spike must FAIL QA');
    assertEqual(resultB.anomalies.length, 1, 'Exactly 1 unannotated anomaly should be caught');
    assertEqual(resultB.anomalies[0].frame, 30, 'Flagged anomaly must be frame 30');
    assertClose(resultB.anomalies[0].ratio, 5.8, 0.2, 'Reported ratio should be ~5.8x');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-10 Suite',
  feature: 'F-SHOTSPEC-CUES+F-TEMPORAL-QA',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
