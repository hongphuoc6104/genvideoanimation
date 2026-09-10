/**
 * Tier 2 Boundary Suite: F06 — Semantic Timeline Boundaries (R6)
 *
 * Verifies zero-duration beats, inverted frame ranges, maximum duration limits,
 * minimal compositions, and token range boundary consistency.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';
import {
  createMockSemanticTimeline,
  validateSemanticTimeline,
} from '../harness/mock-fixtures';

describe({ name: 'F06-B: Semantic Timeline Boundaries', feature: 'F06', tier: 2 }, () => {
  test(
    'F06-B01: Zero-duration beat rejection (startFrame === endFrame)',
    () => {
      const zeroDurationTimeline = createMockSemanticTimeline({
        beats: [
          {
            id: 'beat_zero',
            shotId: 'shot_01',
            narrationTokenRange: [0, 5],
            startSec: 0,
            endSec: 0,
            startFrame: 100,
            endFrame: 100, // duration = 0 frames
            visualIntent: 'Flash',
            primaryObject: 'none',
            cameraIntent: 'static',
            conceptId: 'concept_01',
          },
        ],
      });

      const check = validateSemanticTimeline(zeroDurationTimeline);
      assertFalse(check.valid, 'Zero duration beat must fail validation');
      assertTrue(check.errors.some((e) => e.includes('strictly less than endFrame')));
    },
    { id: 'T2-F06-001' }
  );

  test(
    'F06-B02: Backwards or inverted frame range rejection (startFrame > endFrame)',
    () => {
      const invertedTimeline = createMockSemanticTimeline({
        beats: [
          {
            id: 'beat_inverted',
            shotId: 'shot_01',
            narrationTokenRange: [0, 5],
            startSec: 5.0,
            endSec: 3.0,
            startFrame: 150,
            endFrame: 90, // inverted!
            visualIntent: 'Rewind',
            primaryObject: 'none',
            cameraIntent: 'static',
            conceptId: 'concept_01',
          },
        ],
      });

      const check = validateSemanticTimeline(invertedTimeline);
      assertFalse(check.valid);
      assertTrue(check.errors.some((e) => e.includes('strictly less than endFrame')));
    },
    { id: 'T2-F06-002' }
  );

  test(
    'F06-B03: Maximum single beat duration sanity check (beats > 30s flagged)',
    () => {
      const validateBeatDurationLimit = (durationSec: number): boolean => {
        const MAX_COGNITIVE_BEAT_SEC = 30.0;
        return durationSec <= MAX_COGNITIVE_BEAT_SEC;
      };

      assertTrue(validateBeatDurationLimit(3.5), 'Standard 3.5s beat passes');
      assertTrue(validateBeatDurationLimit(30.0), 'Exact 30.0s max beat passes');
      assertFalse(validateBeatDurationLimit(30.1), 'Beat exceeding 30s must be flagged for re-chunking');
      assertFalse(validateBeatDurationLimit(120.0), 'Monolithic 2-minute beat fails');
    },
    { id: 'T2-F06-003' }
  );

  test(
    'F06-B04: Single-beat minimal valid composition boundary',
    () => {
      const singleBeatTimeline = createMockSemanticTimeline({
        totalFrames: 90,
        durationSec: 3.0,
        beats: [
          {
            id: 'beat_only',
            shotId: 'shot_01',
            narrationTokenRange: [0, 10],
            startSec: 0.0,
            endSec: 3.0,
            startFrame: 0,
            endFrame: 90,
            visualIntent: 'Title card',
            primaryObject: 'title',
            cameraIntent: 'static',
            conceptId: 'concept_title',
          },
        ],
      });

      const check = validateSemanticTimeline(singleBeatTimeline);
      assertTrue(check.valid, 'Single-beat valid timeline passes');
      assertEqual(singleBeatTimeline.beats.length, 1);
    },
    { id: 'T2-F06-004' }
  );

  test(
    'F06-B05: Narration token range boundary consistency ([start, end] with start <= end)',
    () => {
      const isTokenRangeValid = (range: [number, number], totalTokens: number): boolean => {
        const [start, end] = range;
        return start >= 0 && end >= start && end <= totalTokens;
      };

      const totalTokens = 100;
      assertTrue(isTokenRangeValid([0, 10], totalTokens));
      assertTrue(isTokenRangeValid([10, 10], totalTokens), 'Single token span [10, 10] passes');
      assertTrue(isTokenRangeValid([0, 100], totalTokens), 'Full script range passes');

      assertFalse(isTokenRangeValid([15, 10], totalTokens), 'Inverted token range [15, 10] fails');
      assertFalse(isTokenRangeValid([-1, 10], totalTokens), 'Negative token index fails');
      assertFalse(isTokenRangeValid([0, 105], totalTokens), 'Token index exceeding script length fails');
    },
    { id: 'T2-F06-005' }
  );
});
