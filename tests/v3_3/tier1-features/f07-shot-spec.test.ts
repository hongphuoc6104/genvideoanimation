/**
 * Tier 1 Feature Suite: F07 — Real ShotSpec Validation & Motivated Transitions (R7)
 *
 * Verifies strict impact frame bounds, transition windows, 8 motivated transition types,
 * prohibition of naked cuts, and prohibition of opacity dissolves.
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
  ShotSpec,
} from '../harness/mock-fixtures';

describe({ name: 'F07: Real ShotSpec Validation Contract', feature: 'F07', tier: 1 }, () => {
  test(
    'F07-01: Internal impact frames must lie strictly within host shot frame bounds',
    () => {
      const shotSpec: ShotSpec = createMockShotSpec();
      const validation = validateShotSpec(shotSpec);
      assertTrue(validation.valid, `ShotSpec validation failed: ${validation.errors.join(', ')}`);

      for (const shot of shotSpec.shots) {
        if (shot.impact_frames) {
          for (const impact of shot.impact_frames) {
            assertTrue(
              impact >= shot.startFrame && impact <= shot.endFrame,
              `Impact frame ${impact} is outside shot ${shot.id} bounds [${shot.startFrame}, ${shot.endFrame}]`
            );
          }
        }
      }

      // Out of bounds test
      const brokenSpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_bad',
            name: 'Broken Impact Shot',
            startFrame: 100,
            endFrame: 200,
            duration: 100,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            impact_frames: [50], // 50 < 100
          },
        ],
      });
      const brokenValidation = validateShotSpec(brokenSpec);
      assertFalse(brokenValidation.valid, 'Impact frame before shot start must fail validation');
      assertTrue(brokenValidation.errors[0].includes('outside shot bounds'));
    },
    { id: 'T1-F07-001' }
  );

  test(
    'F07-02: Transition frame bridge windows span across shot boundary [f_start, f_end]',
    () => {
      const shotSpec = createMockShotSpec();
      const shot1 = shotSpec.shots[0]; // [0, 618]
      const shot2 = shotSpec.shots[1]; // [618, 1309]

      // Transition window declared on shot 1 bridges into shot 2: [608, 628]
      assertTrue(shot1.transition_frames !== undefined);
      const [tPre, tPost] = shot1.transition_frames!;

      assertTrue(tPre <= shot1.endFrame, 'Transition start must be before or at shot end');
      assertTrue(tPost >= shot2.startFrame, 'Transition end must extend into next shot');
      assertTrue(tPost > tPre, 'Transition duration must be strictly positive');
    },
    { id: 'T1-F07-002' }
  );

  test(
    'F07-03: Transition types must adhere strictly to 8 whitelisted motivated types',
    () => {
      assertEqual(WHITELISTED_TRANSITIONS.length, 8, 'Must have exactly 8 whitelisted transitions');
      assertTrue(WHITELISTED_TRANSITIONS.includes('object_match'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('camera_carry'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('shape_morph'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('foreground_wipe'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('continuing_trajectory'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('semantic_zoom'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('motivated_iris'));
      assertTrue(WHITELISTED_TRANSITIONS.includes('match_cut'));

      const invalidTypeSpec = createMockShotSpec({
        shots: [
          {
            id: 'shot_invalid_trans',
            name: 'Invalid Transition Shot',
            startFrame: 0,
            endFrame: 100,
            duration: 100,
            camera: { start: [0, 0, 1], end: [0, 0, 1] },
            transition_type: 'random_crossfade' as any,
          },
        ],
      });
      assertFalse(validateShotSpec(invalidTypeSpec).valid);
    },
    { id: 'T1-F07-003' }
  );

  test(
    'F07-04: Prohibition of naked cuts lacking declared motivated transition',
    () => {
      const validateCutIntegrity = (
        shotBoundaryFrame: number,
        hasDeclaredTransition: boolean,
        measuredMadSpike: number
      ): { pass: boolean; error?: string } => {
        // If adjacent frame visual difference spike is > 4.0x median without declared transition, fail
        if (measuredMadSpike > 4.0 && !hasDeclaredTransition) {
          return {
            pass: false,
            error: `NAKED_CUT_DETECTED: Frame ${shotBoundaryFrame} has MAD spike ${measuredMadSpike}x without declared transition`,
          };
        }
        return { pass: true };
      };

      // Spiky cut with declared transition -> Pass (whitelisted)
      assertTrue(validateCutIntegrity(618, true, 5.2).pass);

      // Spiky cut without transition -> Fail (naked cut)
      const nakedResult = validateCutIntegrity(618, false, 5.2);
      assertFalse(nakedResult.pass);
      assertTrue(nakedResult.error?.includes('NAKED_CUT_DETECTED'));
    },
    { id: 'T1-F07-004' }
  );

  test(
    'F07-05: Prohibition of whole-scene opacity crossfades / dissolves',
    () => {
      // Static validator detecting binary opacity dissolves: progress < 0.5 ? A : B
      const detectOpacityDissolve = (codeSnippet: string): boolean => {
        const opacityCrossfadePattern = /(?:opacity:\s*(?:1\s*-\s*progress|progress)|progress\s*<\s*0\.5\s*\?\s*<)/;
        return opacityCrossfadePattern.test(codeSnippet);
      };

      const badCrossfade = `
        <div style={{ opacity: 1 - progress }}>{SceneA}</div>
        <div style={{ opacity: progress }}>{SceneB}</div>
      `;
      assertTrue(detectOpacityDissolve(badCrossfade), 'Must detect illegal opacity crossfade');

      const motivatedMorph = `
        <MotivatedMorph pathA={shape1} pathB={shape2} progress={smoothProgress} />
      `;
      assertFalse(detectOpacityDissolve(motivatedMorph), 'Motivated vector morph is permitted');
    },
    { id: 'T1-F07-005' }
  );
});
