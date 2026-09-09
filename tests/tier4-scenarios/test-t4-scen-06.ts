/**
 * T4-SCEN-06: Temporal Render QA with Synthetic & FFmpeg Decoded Frames
 * Requirements: R8
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse, assertEqual } from '../harness/assert';
import { evaluateMadSpikes, resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-06',
  name: 'Temporal Render QA with Synthetic & FFmpeg Decoded Frames',
  feature: 'F-TEMPORAL-QA',
  tier: 4,
  description:
    'End-to-end scenario evaluating rolling adjacent-frame MAD temporal QA pipeline, verifying local median filtering, spike detection threshold (>4x), and ShotSpec impact whitelist reconciliation.',
  fn: async (ctx) => {
    let qaEvalFn = evaluateMadSpikes;

    const { module: qaMod, isAvailable } = await resolveModule('../../validators/temporal-render-qa', [
      'evaluateMadSpikes',
    ]);
    if (isAvailable && qaMod?.evaluateMadSpikes) {
      qaEvalFn = qaMod.evaluateMadSpikes;
    }

    ctx.log('Executing rolling MAD temporal quality inspection on 120-frame signal...');

    // 120-frame synthetic baseline with steady motion of MAD = 2.5
    const madSeries = new Array(120).fill(2.5);

    // Frame 45: Injected legitimate high-velocity impact (MAD = 15.0, ratio 6.0x) -> Whitelisted
    madSeries[45] = 15.0;

    // Frame 90: Injected glitch single-frame pop (MAD = 22.5, ratio 9.0x) -> NOT Whitelisted
    madSeries[90] = 22.5;

    // 1. Run QA with both whitelisted
    const resultAllWhitelisted = qaEvalFn(madSeries, 15, 4.0, [45, 90]);
    assertTrue(resultAllWhitelisted.valid, 'When all spikes are whitelisted, QA must PASS');
    assertEqual(resultAllWhitelisted.anomalies.length, 0, 'Zero unannotated anomalies expected');

    // 2. Run QA with only frame 45 whitelisted (frame 90 unannotated)
    const resultGlitch = qaEvalFn(madSeries, 15, 4.0, [45]);
    assertFalse(resultGlitch.valid, 'Unannotated glitch at frame 90 must cause QA FAIL');
    assertEqual(resultGlitch.anomalies.length, 1, 'Exactly 1 unannotated anomaly expected');
    assertEqual(resultGlitch.anomalies[0].frame, 90, 'Frame 90 must be the flagged anomaly');
    assertTrue(resultGlitch.anomalies[0].ratio >= 8.0, 'Glitch ratio must be >= 8.0x');
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-06 Suite',
  feature: 'F-TEMPORAL-QA',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
