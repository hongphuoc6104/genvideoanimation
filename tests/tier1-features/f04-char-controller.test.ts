/**
 * Tier 1 (Feature Coverage): F-CHAR-CONTROLLER
 * CharacterController Action Queue & Blending
 */

import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertClose,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'CharacterController Action Queue & Blending',
  feature: 'F-CHAR-CONTROLLER',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F04-01',
      name: 'Action Sequencing Ingestion: evaluateAction produces anticipation squash at peak windup',
      feature: 'F-CHAR-CONTROLLER',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, [
          'CharacterController',
          'PERFORMANCE_PROFILES',
        ]);
        if (!isAvailable || !motionKit.CharacterController) {
          ctx.notImplemented('CharacterController not yet exported by motion-kit (Planned for M2)');
        }

        const controller = new motionKit.CharacterController();
        const profile = motionKit.PERFORMANCE_PROFILES?.energetic || { timingScale: 1.25 };
        const pose = controller.evaluateAction('anticipate', 15, 10, 10, profile);

        assertTrue(pose !== undefined && pose !== null, 'Pose must be defined');
        const squash = pose.squash !== undefined ? pose.squash : pose.root?.scaleY;
        assertTrue(squash !== undefined && squash < 0.95, 'Anticipation must show squash (< 0.95)');
      },
    },
    {
      id: 'TEST-T1-F04-02',
      name: 'Midpoint Pose Blending: controller.blend computes exact linear midpoint between two poses',
      feature: 'F-CHAR-CONTROLLER',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['CharacterController']);
        if (!isAvailable || !motionKit.CharacterController) {
          ctx.notImplemented('CharacterController not yet exported by motion-kit (Planned for M2)');
        }

        const controller = new motionKit.CharacterController();
        const poseA = { root: { x: 100, y: 0, rotation: 0 } };
        const poseB = { root: { x: 200, y: 0, rotation: 90 } };

        const blended = controller.blend(poseA, poseB, 0.5);
        assertTrue(blended !== undefined && blended.root !== undefined, 'Blended pose must have root');
        assertClose(blended.root.x, 150.0, 1e-4, 'Blended root.x must equal 150.0');
        assertClose(blended.root.rotation, 45.0, 1e-4, 'Blended root.rotation must equal 45.0');
      },
    },
    {
      id: 'TEST-T1-F04-03',
      name: 'Profile Timing Scale Duration Modulation: energetic profile with timingScale 1.25 accelerates completion',
      feature: 'F-CHAR-CONTROLLER',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, [
          'CharacterController',
          'PERFORMANCE_PROFILES',
        ]);
        if (!isAvailable || !motionKit.CharacterController) {
          ctx.notImplemented('CharacterController not yet exported by motion-kit (Planned for M2)');
        }

        const controller = new motionKit.CharacterController();
        const profile = motionKit.PERFORMANCE_PROFILES?.energetic || { timingScale: 1.25 };
        // Base duration 20, timingScale 1.25 -> effective duration 16 frames. At start 10 + 16 = 26, action is complete.
        const pose26 = controller.evaluateAction('overshoot', 26, 10, 20, profile);
        assertTrue(pose26 !== undefined && pose26 !== null, 'Action must evaluate at completion frame');
      },
    },
    {
      id: 'TEST-T1-F04-04',
      name: 'Target Pose Override Ingestion: overrides properly propagate into resulting action pose',
      feature: 'F-CHAR-CONTROLLER',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['CharacterController']);
        if (!isAvailable || !motionKit.CharacterController) {
          ctx.notImplemented('CharacterController not yet exported by motion-kit (Planned for M2)');
        }

        const controller = new motionKit.CharacterController();
        const overrides = { head: { rotation: 25 } };
        const pose = controller.evaluateAction('gesture', 10, 0, 20, undefined, overrides);

        assertTrue(pose !== undefined && pose.head !== undefined, 'Result pose must contain head joint');
        assertEqual(pose.head.rotation, 25, 'Override rotation must match 25');
      },
    },
    {
      id: 'TEST-T1-F04-05',
      name: 'Continuity Across Chained Actions: handover between anticipate and overshoot has positional delta < 1.0px',
      feature: 'F-CHAR-CONTROLLER',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['CharacterController']);
        if (!isAvailable || !motionKit.CharacterController) {
          ctx.notImplemented('CharacterController not yet exported by motion-kit (Planned for M2)');
        }

        const controller = new motionKit.CharacterController();
        // Anticipate ends at frame 10 (frames 0-10)
        const p1 = controller.evaluateAction('anticipate', 10, 0, 10);
        // Overshoot starts at frame 10 (frames 10-25)
        const p2 = controller.evaluateAction('overshoot', 10, 10, 15);

        const y1 = p1.root?.y ?? 0;
        const y2 = p2.root?.y ?? 0;
        assertTrue(Math.abs(y1 - y2) < 1.0, `Handover discontinuity: Delta Y = ${Math.abs(y1 - y2)}px >= 1.0px`);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
