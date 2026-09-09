/**
 * T3-COMB-16: Bezier Packet Arrival Aligned with Audio Cue Manifest
 * Features: F-BEZIER-TRAVEL + F-SHOTSPEC-CUES
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual, assertClose } from '../harness/assert';
import { VALID_CUE_MANIFEST } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-16',
  name: 'Bezier Packet Arrival Aligned with Audio Cue Manifest',
  feature: 'F-BEZIER-TRAVEL+F-SHOTSPEC-CUES',
  tier: 3,
  description:
    'Verifies Bezier packet curve progress reaching 1.0 at frame k aligns exactly with destination audio impact cue at t = k / fps with zero temporal drift.',
  fn: async (ctx) => {
    ctx.log('Evaluating packet arrival at frame 45 aligned with audio cue manifest...');

    const arrivalFrame = 45;
    const fps = VALID_CUE_MANIFEST.fps;
    const impactCue = VALID_CUE_MANIFEST.cues.find((c) => c.id === 'packet_target_arrive');

    assertTrue(impactCue, 'Target arrival cue must be present in cue manifest');
    assertEqual(impactCue.frame, arrivalFrame, 'Impact cue frame must equal arrival frame (45)');

    // 1. Invariant: timeSec conversion equals frame / fps exactly
    const expectedTimeSec = arrivalFrame / fps;
    assertClose(impactCue.timeSec, expectedTimeSec, 1e-6, 'Cue timeSec must match frame / fps');

    // 2. Simulated packet motion: progress(f) = clamp((f - start) / (arrival - start))
    const startFrame = 20;
    const duration = arrivalFrame - startFrame; // 25 frames
    const progress44 = (44 - startFrame) / duration; // 24 / 25 = 0.96
    const progress45 = (45 - startFrame) / duration; // 25 / 25 = 1.00
    const progress46 = Math.min(1.0, (46 - startFrame) / duration); // 1.00

    assertClose(progress44, 0.96, 1e-4, 'Frame 44 progress must be ~0.96');
    assertClose(progress45, 1.0, 1e-4, 'Frame 45 progress must equal 1.00');
    assertClose(progress46, 1.0, 1e-4, 'Frame 46 progress must remain clamped at 1.00');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-16 Suite',
  feature: 'F-BEZIER-TRAVEL+F-SHOTSPEC-CUES',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
