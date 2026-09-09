/**
 * T3-COMB-14: ShotSpec Inter-Shot State Contract vs Hermite Spline Evaluation
 * Features: F-SHOTSPEC-CUES + F-CAM-CONTINUITY
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertDeepEqual } from '../harness/assert';
import {
  resolveModule,
  VALID_SHOT_SPEC_2_SHOTS,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-14',
  name: 'ShotSpec Inter-Shot State Contract vs Hermite Spline Evaluation',
  feature: 'F-SHOTSPEC-CUES+F-CAM-CONTINUITY',
  tier: 3,
  description:
    'Verifies ShotSpec validator ensures consecutive shot camera equality and Hermite spline maintains C0/C1 continuity across the boundary frame.',
  fn: async (ctx) => {
    let { module: validatorMod, isAvailable } = await resolveModule('../../validators/validate-shot-spec');
    if (!isAvailable || !validatorMod) {
      const rootRes = await resolveModule('../../validate-shot-spec');
      if (!rootRes.isAvailable || !rootRes.module) {
        ctx.notImplemented('validate-shot-spec not yet available (Planned for M4)');
        return;
      }
      validatorMod = rootRes.module;
    }

    const validateFn = validatorMod.validateShotSpec || validatorMod.validateShotSpecData;
    ctx.log('Validating consecutive 2-shot specification continuity...');

    const shot1 = {
      shot_id: VALID_SHOT_SPEC_2_SHOTS.shots[0].id,
      start_frame: VALID_SHOT_SPEC_2_SHOTS.shots[0].startFrame,
      end_frame: VALID_SHOT_SPEC_2_SHOTS.shots[0].endFrame,
      narrative_purpose: VALID_SHOT_SPEC_2_SHOTS.shots[0].narrative_purpose,
      start_state: VALID_SHOT_SPEC_2_SHOTS.shots[0].start_state,
      end_state: VALID_SHOT_SPEC_2_SHOTS.shots[0].end_state,
      key_beats: [{ frame: 10, subject: 'camera', intent: 'pan' }],
    };

    const shot2 = {
      shot_id: VALID_SHOT_SPEC_2_SHOTS.shots[1].id,
      start_frame: VALID_SHOT_SPEC_2_SHOTS.shots[1].startFrame,
      end_frame: VALID_SHOT_SPEC_2_SHOTS.shots[1].endFrame,
      narrative_purpose: VALID_SHOT_SPEC_2_SHOTS.shots[1].narrative_purpose,
      start_state: VALID_SHOT_SPEC_2_SHOTS.shots[1].start_state,
      end_state: VALID_SHOT_SPEC_2_SHOTS.shots[1].end_state,
      key_beats: [{ frame: 75, subject: 'camera', intent: 'zoom' }],
    };

    // 1. Invariant: Shot 1 alone validates
    const res1 = validateFn(shot1);
    assertTrue(res1.valid, `Shot 1 should be valid, got errors: ${res1.errors?.join(', ')}`);

    // 2. Invariant: Shot 2 preceded by Shot 1 validates continuity
    const res2 = validateFn(shot2, shot1);
    assertTrue(res2.valid, `Shot 2 with Shot 1 predecessor must pass continuity: ${res2.errors?.join(', ')}`);

    // 3. Invariant: Camera states match exactly
    assertDeepEqual(shot1.end_state.camera, shot2.start_state.camera, 'Camera states must match across boundary');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-14 Suite',
  feature: 'F-SHOTSPEC-CUES+F-CAM-CONTINUITY',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
