/**
 * Tier 1 Feature Suite: F01 — Canonical Production Policy (R1)
 *
 * Verifies production-policy contract, defaults, thresholds, and constraints.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertEqual,
  assertInRange,
  assertSchema,
} from '../harness/assert';
import {
  createMockProductionPolicy,
  validateProductionPolicy,
  ProductionPolicy,
} from '../harness/mock-fixtures';

describe({ name: 'F01: Canonical Production Policy Contract', feature: 'F01', tier: 1 }, () => {
  test(
    'F01-01: Validates complete schema structure matching V3.3 contract',
    () => {
      const policy: ProductionPolicy = createMockProductionPolicy();
      const validation = validateProductionPolicy(policy);
      assertTrue(validation.valid, `Policy schema validation failed: ${validation.errors.join(', ')}`);
      assertEqual(policy.version, '3.3.0', 'Policy version must be 3.3.0');

      assertSchema(policy, {
        version: 'string',
        canvas: (c) => typeof c === 'object' && c !== null,
        typography: (t) => typeof t === 'object' && t !== null,
        audio: (a) => typeof a === 'object' && a !== null,
        speech: (s) => typeof s === 'object' && s !== null,
        acceptance: (acc) => typeof acc === 'object' && acc !== null,
      });
    },
    { id: 'T1-F01-001' }
  );

  test(
    'F01-02: Canvas 1080x1920 30fps defaults and 360x640 preview scale factor',
    () => {
      const policy = createMockProductionPolicy();
      assertEqual(policy.canvas.width, 1080, 'Canvas width must be 1080');
      assertEqual(policy.canvas.height, 1920, 'Canvas height must be 1920');
      assertEqual(policy.canvas.aspectRatio, '9:16', 'Aspect ratio must be 9:16');
      assertEqual(policy.canvas.fps, 30, 'Frame rate must be 30fps');

      assertEqual(policy.canvas.preview.width, 360, 'Preview width must be 360');
      assertEqual(policy.canvas.preview.height, 640, 'Preview height must be 640');
      assertEqual(policy.canvas.preview.scale, 360 / 1080, 'Preview scale must be exact ratio 360/1080');

      assertEqual(policy.canvas.safeMargins.horizontal, 80, 'Safe horizontal margin must be 80px');
      assertEqual(policy.canvas.safeMargins.vertical, 140, 'Safe vertical margin must be 140px');
      assertEqual(policy.canvas.safeMargins.captionRegion.top, 1600, 'Caption top safe bound must be 1600');
      assertEqual(policy.canvas.safeMargins.captionRegion.bottom, 1800, 'Caption bottom safe bound must be 1800');
    },
    { id: 'T1-F01-002' }
  );

  test(
    'F01-03: Typography minimums enforce mobile floor and semantic thresholds',
    () => {
      const policy = createMockProductionPolicy();
      const mins = policy.typography.minimums;

      assertTrue(mins.hero >= 64, `Hero font size must be >= 64, got ${mins.hero}`);
      assertTrue(mins.section >= 48, `Section title font size must be >= 48, got ${mins.section}`);
      assertTrue(mins.card >= 38, `Card title font size must be >= 38, got ${mins.card}`);
      assertTrue(mins.body >= 34, `Body font size must be >= 34, got ${mins.body}`);
      assertTrue(mins.secondary >= 30, `Secondary informational font size must be >= 30, got ${mins.secondary}`);
      assertTrue(mins.caption >= 52, `Karaoke caption font size must be >= 52, got ${mins.caption}`);

      assertTrue(policy.typography.enforceEffectiveScale === true, 'enforceEffectiveScale must be enabled');
      assertEqual(policy.typography.absoluteMobileFloor, 30, 'absoluteMobileFloor must be 30px');
    },
    { id: 'T1-F01-003' }
  );

  test(
    'F01-04: Audio policy specifies narration-sfx, PREMIXED strategy, and role pauses',
    () => {
      const policy = createMockProductionPolicy();
      assertEqual(policy.audio.policy, 'narration-sfx', 'Audio policy must be narration-sfx');
      assertEqual(policy.audio.strategy, 'PREMIXED', 'Audio strategy must be PREMIXED');
      assertEqual(policy.audio.allowMusic, false, 'Production policy prohibits background music');
      assertEqual(policy.audio.targetLoudnessLufs, -15.0, 'Target loudness must be -15.0 LUFS');
      assertEqual(policy.audio.loudnessToleranceLufs, 1.0, 'Loudness tolerance must be 1.0 LUFS');
      assertEqual(policy.audio.truePeakCeilingDbTp, -1.8, 'True peak ceiling must be -1.8 dBTP');
      assertEqual(policy.audio.sampleRate, 48000, 'Sample rate must be 48000 Hz');

      const pauses = policy.audio.rolePauses;
      assertInRange(pauses.withinClause[0], 0.05, 0.15, 'withinClause min bound');
      assertInRange(pauses.withinClause[1], 0.15, 0.25, 'withinClause max bound');
      assertInRange(pauses.majorSectionTransition[0], 0.35, 0.5, 'section transition min bound');
      assertInRange(pauses.majorSectionTransition[1], 0.7, 0.85, 'section transition max bound');
      assertEqual(pauses.maxUnmotivatedPause, 0.85, 'maxUnmotivatedPause must be 0.85s');
    },
    { id: 'T1-F01-004' }
  );

  test(
    'F01-05: Quality gate acceptance thresholds enforce zero-tolerance invariants',
    () => {
      const policy = createMockProductionPolicy();
      const acc = policy.acceptance;

      assertEqual(acc.overallRubricMin, 4.5, 'Overall rubric average must be >= 4.50');
      assertEqual(acc.floorRubricMin, 4.0, 'Floor rubric minimum must be >= 4.00');
      assertEqual(acc.criticalRubricMin, 4.3, 'Critical categories minimum must be >= 4.30');
      assertEqual(acc.contentCoverageRatio, 1.0, 'Curriculum content coverage ratio must be 1.00');
      assertEqual(acc.maxAllowedTemporalSpikes, 0, 'Unannotated temporal spikes must be 0');
      assertEqual(acc.maxAllowedAbsolutePaths, 0, 'Machine-specific absolute paths must be 0');
      assertEqual(acc.maxAllowedDualAudioTags, 0, 'Secondary discrete audio tags must be 0');
    },
    { id: 'T1-F01-005' }
  );
});
