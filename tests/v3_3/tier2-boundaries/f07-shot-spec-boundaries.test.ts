/**
 * Tier 2 Boundary Suite: F07 — ShotSpec Boundaries (R7)
 *
 * Verifies exact impact boundary frames, out-of-bounds impact frames (+/-1),
 * ambient shots without impacts, minimal transition windows, and invalid transition names.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';
import {
  createMockShotSpec,
  validateShotSpec,
  WHITELISTED_TRANSITIONS,
} from '../harness/mock-fixtures';

describe({ name: 'F07-B: ShotSpec Boundaries', feature: 'F07', tier: 2 }, () => {
  test(
    'F07-B01: Impact frame at exact start and end frame boundaries passes',
    () => {
      const boundarySpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_exact',
            name: 'Exact Bounds Shot',
            startFrame: 100,
            endFrame: 200,
            duration: 100,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            impact_frames: [100, 200], // exact start and exact end
          },
        ],
      });

      const check = validateShotSpec(boundarySpec);
      assertTrue(check.valid, 'Impact frames on exact boundaries must pass');
    },
    { id: 'T2-F07-001' }
  );

  test(
    'F07-B02: Impact frame 1 past boundary (start - 1 or end + 1) fails',
    () => {
      // 1 frame before start
      const preSpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_pre',
            name: 'Pre Bound Shot',
            startFrame: 100,
            endFrame: 200,
            duration: 100,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            impact_frames: [99], // 100 - 1
          },
        ],
      });
      assertFalse(validateShotSpec(preSpec).valid, 'Impact frame 99 (start 100) must fail');

      // 1 frame after end
      const postSpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_post',
            name: 'Post Bound Shot',
            startFrame: 100,
            endFrame: 200,
            duration: 100,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            impact_frames: [201], // 200 + 1
          },
        ],
      });
      assertFalse(validateShotSpec(postSpec).valid, 'Impact frame 201 (end 200) must fail');
    },
    { id: 'T2-F07-002' }
  );

  test(
    'F07-B03: Ambient shot with empty impact_frames array [] passes',
    () => {
      const ambientSpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_ambient',
            name: 'Calm ambient shot without SFX hits',
            startFrame: 0,
            endFrame: 150,
            duration: 150,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            impact_frames: [], // empty
          },
        ],
      });

      assertTrue(validateShotSpec(ambientSpec).valid, 'Empty impact_frames is valid for calm shots');
    },
    { id: 'T2-F07-003' }
  );

  test(
    'F07-B04: Transition window minimal width (1 frame width [N, N+1]) passes',
    () => {
      const minimalTransitionSpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_1',
            name: 'Shot 1',
            startFrame: 0,
            endFrame: 100,
            duration: 100,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            transition_frames: [100, 101], // 1-frame boundary bridge
            transition_type: 'match_cut',
          },
        ],
      });

      assertTrue(validateShotSpec(minimalTransitionSpec).valid);
    },
    { id: 'T2-F07-004' }
  );

  test(
    'F07-B05: Invalid motivated transition string rejected against whitelist',
    () => {
      const invalidTransitions = ['dissolve', 'dip_to_black', 'random_glitch', 'fade_in'];
      for (const t of invalidTransitions) {
        assertFalse(
          (WHITELISTED_TRANSITIONS as readonly string[]).includes(t),
          `Transition "${t}" must not be whitelisted`
        );
      }
    },
    { id: 'T2-F07-005' }
  );
});
