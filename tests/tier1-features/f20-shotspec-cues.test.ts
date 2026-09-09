/**
 * Tier 1 (Feature Coverage): F-SHOTSPEC-CUES
 * ShotSpec Continuity Validator & Audio Cue Manifest Sync
 */

import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertFalse,
  assertClose,
  assertDeepEqual,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';
import {
  VALID_SHOT_SPEC_2_SHOTS,
  VALID_CUE_MANIFEST,
} from '../harness/mock-helpers';

export const testSuite: TestSuite = {
  name: 'ShotSpec Continuity Validator & Audio Cue Manifest Sync',
  feature: 'F-SHOTSPEC-CUES',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F20-01',
      name: 'Valid Multi-Shot Spec Ingestion & Schema Compliance: parses and validates shots cleanly',
      feature: 'F-SHOTSPEC-CUES',
      tier: 1,
      fn: async (ctx) => {
        const valPath = path.resolve(__dirname, '../../validators/validate-shot-spec.ts');
        const { module: validator, isAvailable } = await resolveModule(valPath, [
          'validateShotSpecData',
          'validateShotSpec',
        ]);

        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet available (Planned for M4)');
        }

        const validateFn = validator.validateShotSpecData || validator.validateShotSpec;
        const res = validateFn(VALID_SHOT_SPEC_2_SHOTS);
        const isValid = typeof res === 'boolean' ? res : (res.valid ?? res.isValid ?? false);
        assertTrue(isValid, 'Valid 2-shot specification must pass schema validation');
        if (res.errors) {
          assertEqual(res.errors.length, 0, 'No validation errors expected for valid spec');
        }
      },
    },
    {
      id: 'TEST-T1-F20-02',
      name: 'Consecutive Inter-Shot Camera Continuity: verifies camera position and zoom match across boundary',
      feature: 'F-SHOTSPEC-CUES',
      tier: 1,
      fn: async (ctx) => {
        const valPath = path.resolve(__dirname, '../../validators/validate-shot-spec.ts');
        const { module: validator, isAvailable } = await resolveModule(valPath, [
          'validateShotContinuity',
          'normalizeShot',
          'validateShotSpec',
        ]);

        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet available (Planned for M4)');
        }

        const shot1 = VALID_SHOT_SPEC_2_SHOTS.shots[0];
        const shot2 = VALID_SHOT_SPEC_2_SHOTS.shots[1];

        // Valid continuity check
        if (typeof validator.validateShotContinuity === 'function') {
          const norm1 = validator.normalizeShot(shot1, 0);
          const norm2 = validator.normalizeShot(shot2, 1);
          const continuityRes = validator.validateShotContinuity(norm1, norm2);
          assertEqual(continuityRes.errors.length, 0, 'Matching camera states must produce 0 continuity errors');
        }

        // Camera jump failure check
        const validateFn = validator.validateShotSpec || validator.validateShotSpecData;
        const jumpedShot2 = {
          ...shot2,
          start_state: { camera: { x: 999, y: 888, zoom: 2.5 } },
        };

        const res = validateFn(jumpedShot2, shot1);
        const isValid = typeof res === 'boolean' ? res : (res.valid ?? res.isValid ?? false);
        assertFalse(isValid, 'Camera discontinuity between adjacent shots must fail validation');
      },
    },
    {
      id: 'TEST-T1-F20-03',
      name: 'ShotSpec Impact Frame Whitelisting Bounds: impact frames within [startFrame, endFrame] pass',
      feature: 'F-SHOTSPEC-CUES',
      tier: 1,
      fn: async (ctx) => {
        const valPath = path.resolve(__dirname, '../../validators/validate-shot-spec.ts');
        const { module: validator, isAvailable } = await resolveModule(valPath, [
          'validateShotSpecData',
          'validateShotSpec',
        ]);

        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet available (Planned for M4)');
        }

        const validateFn = validator.validateShotSpecData || validator.validateShotSpec;

        // In-bounds impact frame (frame 75 is inside [60, 120])
        const specInBounds = {
          shots: [
            {
              id: 'shot_impact_valid',
              startFrame: 60,
              endFrame: 120,
              start_state: { camera: { x: 100, y: 100, zoom: 1.0 } },
              end_state: { camera: { x: 200, y: 100, zoom: 1.0 } },
              impact_frames: [75, 90],
            },
          ],
        };

        const res = validateFn(specInBounds);
        const isValid = typeof res === 'boolean' ? res : (res.valid ?? res.isValid ?? false);
        assertTrue(isValid, 'Impact frames within duration bounds must be accepted');
      },
    },
    {
      id: 'TEST-T1-F20-04',
      name: 'Cue Manifest Creation & Zero-Drift Time Conversion: creates manifest and calculates exact timestamps',
      feature: 'F-SHOTSPEC-CUES',
      tier: 1,
      fn: async (ctx) => {
        const cuePath = path.resolve(__dirname, '../../motion-kit/src/cues/index.ts');
        const { module: cuesMod, isAvailable } = await resolveModule(cuePath, [
          'createCueManifest',
          'validateCueManifest',
        ]);

        if (!isAvailable || typeof cuesMod?.createCueManifest !== 'function') {
          ctx.notImplemented('motion-kit/src/cues not yet available (Planned for M4)');
        }

        const manifest = cuesMod.createCueManifest('test_comp', 300, 30, [
          { id: 'hit_01', frame: 15, category: 'impact' },
          { id: 'hit_02', frame: 90, category: 'whoosh' },
        ]);

        assertEqual(manifest.fps, 30, 'Manifest fps must match configured value');
        assertEqual(manifest.cues.length, 2, 'Manifest must contain 2 cues');
        assertClose(manifest.cues[0].timeSec!, 15 / 30, 1e-6, 'Timestamp must be frame / fps');
        assertClose(manifest.cues[1].timeSec!, 90 / 30, 1e-6, 'Timestamp must be frame / fps');

        if (typeof cuesMod.validateCueManifest === 'function') {
          assertTrue(cuesMod.validateCueManifest(manifest), 'Created manifest must validate');
        }
      },
    },
    {
      id: 'TEST-T1-F20-05',
      name: 'Cue Manifest Query & Retrieval: getActiveCues retrieves cues at target frame within tolerance',
      feature: 'F-SHOTSPEC-CUES',
      tier: 1,
      fn: async (ctx) => {
        const cuePath = path.resolve(__dirname, '../../motion-kit/src/cues/index.ts');
        const { module: cuesMod, isAvailable } = await resolveModule(cuePath, [
          'getActiveCues',
          'createCueManifest',
        ]);

        if (!isAvailable || typeof cuesMod?.getActiveCues !== 'function') {
          ctx.notImplemented('getActiveCues not yet available in motion-kit (Planned for M4)');
        }

        const manifest = cuesMod.createCueManifest({
          compositionId: 'query_comp',
          fps: 30,
          durationInFrames: 150,
          cues: [
            { id: 'cue_exact', frame: 45, category: 'impact' },
            { id: 'cue_near', frame: 47, category: 'whoosh' },
            { id: 'cue_far', frame: 120, category: 'chime' },
          ],
        });

        // Exact match at frame 45 (tolerance 0)
        const exact = cuesMod.getActiveCues(manifest, 45, 0);
        assertEqual(exact.length, 1, 'Should find exactly 1 cue with tolerance 0');
        assertEqual(exact[0].id, 'cue_exact', 'Should return cue_exact');

        // Tolerance window of 2 frames (covers 43 to 47)
        const inWindow = cuesMod.getActiveCues(manifest, 45, 2);
        assertEqual(inWindow.length, 2, 'Should find 2 cues with tolerance 2');

        // Miss (no cues at frame 10)
        const empty = cuesMod.getActiveCues(manifest, 10, 0);
        assertEqual(empty.length, 0, 'Should find 0 cues at non-cue frame');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
