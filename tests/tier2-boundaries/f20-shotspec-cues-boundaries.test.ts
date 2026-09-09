import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F20: ShotSpec Continuity Validator & Cue Manifest Boundaries',
  feature: 'F-SHOTSPEC-CUES',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F20-01',
      name: 'Consecutive Shot Frame Gap Defect',
      feature: 'F-SHOTSPEC-CUES',
      tier: 2,
      description: 'Temporal gap between consecutive shots (shot 1 ends at 60, shot 2 starts at 65) triggers validation failure',
      fn: async (ctx) => {
        const { module: validator, isAvailable } = await resolveModule(
          '../../validators/validate-shot-spec',
          ['validateShotSpecData', 'validateShotSpec']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet implemented (Planned for M4)');
          return;
        }

        const validateFn = validator.validateShotSpecData || validator.validateShotSpec;
        const gapSpec = {
          shots: [
            {
              id: 'shot_01',
              startFrame: 0,
              endFrame: 60,
              start_state: { camera: { x: 0, y: 0, zoom: 1 } },
              end_state: { camera: { x: 100, y: 0, zoom: 1 } },
            },
            {
              id: 'shot_02',
              startFrame: 65, // 5-frame gap!
              endFrame: 120,
              start_state: { camera: { x: 100, y: 0, zoom: 1 } },
              end_state: { camera: { x: 200, y: 0, zoom: 1 } },
            },
          ],
        };

        const result = validateFn(gapSpec);
        const isValid = typeof result === 'boolean' ? result : (result.valid ?? result.isValid ?? false);
        assertFalse(isValid, 'ShotSpec with frame gap between shots must fail validation');
      },
    },
    {
      id: 'TEST-T2-F20-02',
      name: 'Camera Zoom Discontinuity Mismatch',
      feature: 'F-SHOTSPEC-CUES',
      tier: 2,
      description: 'Camera zoom mismatch between shot[N].end_state and shot[N+1].start_state triggers continuity violation',
      fn: async (ctx) => {
        const { module: validator, isAvailable } = await resolveModule(
          '../../validators/validate-shot-spec',
          ['validateShotSpecData', 'validateShotSpec']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet implemented (Planned for M4)');
          return;
        }

        const validateFn = validator.validateShotSpecData || validator.validateShotSpec;
        const mismatchedZoomSpec = {
          shots: [
            {
              id: 'shot_01',
              startFrame: 0,
              endFrame: 60,
              start_state: { camera: { x: 0, y: 0, zoom: 1.0 } },
              end_state: { camera: { x: 100, y: 0, zoom: 1.5 } },
            },
            {
              id: 'shot_02',
              startFrame: 60,
              endFrame: 120,
              start_state: { camera: { x: 100, y: 0, zoom: 1.0 } }, // Zoom mismatch!
              end_state: { camera: { x: 200, y: 0, zoom: 1.0 } },
            },
          ],
        };

        const result = validateFn(mismatchedZoomSpec);
        const isValid = typeof result === 'boolean' ? result : (result.valid ?? result.isValid ?? false);
        assertFalse(isValid, 'Zoom mismatch at boundary must fail validation');
      },
    },
    {
      id: 'TEST-T2-F20-03',
      name: 'Malformed ShotSpec JSON Syntax',
      feature: 'F-SHOTSPEC-CUES',
      tier: 2,
      description: 'Malformed JSON syntax in shot-spec file throws SyntaxError or controlled loader failure',
      fn: async (ctx) => {
        const { module: validator, isAvailable } = await resolveModule(
          '../../validators/validate-shot-spec',
          ['parseShotSpec']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet implemented (Planned for M4)');
          return;
        }

        assertThrows(() => validator.parseShotSpec('{"shots": [ unclosed syntax'), /syntax|json/i);
      },
    },
    {
      id: 'TEST-T2-F20-04',
      name: 'Declared Impact Frame Outside Shot Range',
      feature: 'F-SHOTSPEC-CUES',
      tier: 2,
      description: 'Impact frame declared outside the shot interval [startFrame, endFrame] triggers validation error',
      fn: async (ctx) => {
        const { module: validator, isAvailable } = await resolveModule(
          '../../validators/validate-shot-spec',
          ['validateShotSpecData', 'validateShotSpec']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/validate-shot-spec not yet implemented (Planned for M4)');
          return;
        }

        const validateFn = validator.validateShotSpecData || validator.validateShotSpec;
        const outOfBoundsImpactSpec = {
          shots: [
            {
              id: 'shot_01',
              startFrame: 0,
              endFrame: 60,
              start_state: { camera: { x: 0, y: 0, zoom: 1.0 } },
              end_state: { camera: { x: 100, y: 0, zoom: 1.0 } },
              whitelisted_impact_frames: [150], // Out of bounds!
            },
          ],
        };

        const result = validateFn(outOfBoundsImpactSpec);
        const isValid = typeof result === 'boolean' ? result : (result.valid ?? result.isValid ?? false);
        assertFalse(isValid, 'Out of bounds impact frame must trigger validation error');
      },
    },
    {
      id: 'TEST-T2-F20-05',
      name: 'Negative or Non-Integer Cue Frame',
      feature: 'F-SHOTSPEC-CUES',
      tier: 2,
      description: 'Cue event with negative frame (-10) or non-integer frame (12.75) is rejected by schema validator',
      fn: async (ctx) => {
        const { module: cues, isAvailable } = await resolveModule(
          '../../motion-kit/src/cues/index',
          ['validateCueEvent', 'validateCueManifest']
        );
        if (!isAvailable) {
          ctx.notImplemented('validateCueEvent not yet implemented in motion-kit (Planned for M4)');
          return;
        }

        const validateFn = cues.validateCueEvent || cues.validateCueManifest;
        assertThrows(() => validateFn({ id: 'bad_cue', frame: -10 }), /integer|negative|>= 0/i);
        assertThrows(() => validateFn({ id: 'bad_cue', frame: 12.75 }), /integer/i);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
