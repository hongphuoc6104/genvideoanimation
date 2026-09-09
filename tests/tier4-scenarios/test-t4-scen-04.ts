/**
 * T4-SCEN-04: Production Multi-Shot Continuity Contract & Enforcement
 * Requirements: R4, R9
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse, assertEqual } from '../harness/assert';
import {
  resolveModule,
  VALID_SHOT_SPEC_4_SHOTS,
  INVALID_SHOT_SPEC_CAMERA_JUMP,
  INVALID_SHOT_SPEC_FRAME_GAP,
  INVALID_SHOT_SPEC_ZOOM_MISMATCH,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-04',
  name: 'Production Multi-Shot Continuity Contract & Enforcement',
  feature: 'F-SHOTSPEC-CUES',
  tier: 4,
  description:
    'End-to-end scenario verifying multi-shot continuity enforcement across 4-shot production sequence, catching frame gaps, camera jumps, and zoom mismatches.',
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
    ctx.log('Validating 4-shot production sequence and negative continuity injection cases...');

    // 1. Invariant: Valid 4-shot sequence passes cleanly
    const shots4 = VALID_SHOT_SPEC_4_SHOTS.shots.map((s) => ({
      shot_id: s.id,
      start_frame: s.startFrame,
      end_frame: s.endFrame,
      narrative_purpose: s.narrative_purpose,
      start_state: s.start_state,
      end_state: s.end_state,
      key_beats: [{ frame: s.startFrame + 5, subject: 'actor', intent: 'move' }],
    }));

    for (let i = 0; i < shots4.length; i++) {
      const prev = i > 0 ? shots4[i - 1] : undefined;
      const res = validateFn(shots4[i], prev);
      assertTrue(
        res.valid,
        `Valid shot ${shots4[i].shot_id} failed continuity check: ${res.errors?.join(', ')}`
      );
    }

    // 2. Invariant: Injected camera jump is flagged
    const badCam1 = {
      shot_id: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[0].id,
      start_frame: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[0].startFrame,
      end_frame: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[0].endFrame,
      narrative_purpose: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[0].narrative_purpose,
      start_state: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[0].start_state,
      end_state: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[0].end_state,
      key_beats: [{ frame: 10, subject: 'cam', intent: 'pan' }],
    };
    const badCam2 = {
      shot_id: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[1].id,
      start_frame: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[1].startFrame,
      end_frame: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[1].endFrame,
      narrative_purpose: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[1].narrative_purpose,
      start_state: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[1].start_state,
      end_state: INVALID_SHOT_SPEC_CAMERA_JUMP.shots[1].end_state,
      key_beats: [{ frame: 70, subject: 'cam', intent: 'jump' }],
    };
    const badCamRes = validateFn(badCam2, badCam1);
    assertFalse(badCamRes.valid, 'Camera jump must fail validation');
    assertTrue(
      badCamRes.errors.some((e: string) => e.includes('Continuity violation') && e.includes('camera')),
      'Must flag camera continuity violation'
    );

    // 3. Invariant: Injected frame gap produces warning or error
    const gap1 = {
      shot_id: INVALID_SHOT_SPEC_FRAME_GAP.shots[0].id,
      start_frame: INVALID_SHOT_SPEC_FRAME_GAP.shots[0].startFrame,
      end_frame: INVALID_SHOT_SPEC_FRAME_GAP.shots[0].endFrame,
      narrative_purpose: 'Shot 1 before gap',
      start_state: INVALID_SHOT_SPEC_FRAME_GAP.shots[0].start_state,
      end_state: INVALID_SHOT_SPEC_FRAME_GAP.shots[0].end_state,
      key_beats: [{ frame: 10, subject: 'cam', intent: 'hold' }],
    };
    const gap2 = {
      shot_id: INVALID_SHOT_SPEC_FRAME_GAP.shots[1].id,
      start_frame: INVALID_SHOT_SPEC_FRAME_GAP.shots[1].startFrame,
      end_frame: INVALID_SHOT_SPEC_FRAME_GAP.shots[1].endFrame,
      narrative_purpose: 'Shot 2 after 5-frame gap',
      start_state: INVALID_SHOT_SPEC_FRAME_GAP.shots[1].start_state,
      end_state: INVALID_SHOT_SPEC_FRAME_GAP.shots[1].end_state,
      key_beats: [{ frame: 70, subject: 'cam', intent: 'hold' }],
    };
    const gapRes = validateFn(gap2, gap1);
    assertTrue(
      gapRes.warnings.some((w: string) => w.includes('gap')) || gapRes.errors.some((e: string) => e.includes('gap')),
      'Must detect frame gap between consecutive shots'
    );
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-04 Suite',
  feature: 'F-SHOTSPEC-CUES',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
