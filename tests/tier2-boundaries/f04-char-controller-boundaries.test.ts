import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F04: CharacterController Action Queue & Blending Boundaries',
  feature: 'F-CHAR-CONTROLLER',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F04-01',
      name: 'Zero Duration Action Evaluation',
      feature: 'F-CHAR-CONTROLLER',
      tier: 2,
      description: 'Action evaluation with durationFrames = 0 avoids division by zero and clamps to end state',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['CharacterController']
        );
        if (!isAvailable) {
          ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const controller = new mod.CharacterController();
        const pose = controller.evaluateAction('overshoot', 10, 10, 0);
        assertTrue(pose !== null && typeof pose === 'object', 'Must return valid pose');
        assertTrue(Number.isFinite(pose.root?.x ?? 0), 'root.x must be finite number');
        assertTrue(Number.isFinite(pose.root?.y ?? 0), 'root.y must be finite number');
      },
    },
    {
      id: 'TEST-T2-F04-02',
      name: 'Pre-Start Negative Frame Evaluation (t < 0)',
      feature: 'F-CHAR-CONTROLLER',
      tier: 2,
      description: 'Evaluating action at currentFrame < startFrame returns initial start pose without negative extrapolation',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['CharacterController']
        );
        if (!isAvailable) {
          ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const controller = new mod.CharacterController();
        const preStartPose = controller.evaluateAction('anticipate', 5, 10, 10);
        const startPose = controller.evaluateAction('anticipate', 10, 10, 10);
        assertClose(preStartPose.root.y, startPose.root.y, 1e-4, 'Pre-start pose must match start pose at t=0');
      },
    },
    {
      id: 'TEST-T2-F04-03',
      name: 'Post-Duration Frame Evaluation (t > 1)',
      feature: 'F-CHAR-CONTROLLER',
      tier: 2,
      description: 'Evaluating action past its duration clamps to settled end pose without divergence',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['CharacterController']
        );
        if (!isAvailable) {
          ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const controller = new mod.CharacterController();
        const poseAtEnd = controller.evaluateAction('settle', 30, 0, 30);
        const poseAt100 = controller.evaluateAction('settle', 100, 0, 30);
        assertClose(poseAt100.root.y, poseAtEnd.root.y, 1e-4, 'Pose at frame 100 must equal settled pose at frame 30');
      },
    },
    {
      id: 'TEST-T2-F04-04',
      name: 'Unknown Action Name Fallback',
      feature: 'F-CHAR-CONTROLLER',
      tier: 2,
      description: 'Unrecognized action name falls back to idle/default pose safely without unhandled crash',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['CharacterController']
        );
        if (!isAvailable) {
          ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const controller = new mod.CharacterController();
        const fallbackPose = controller.evaluateAction('invalid_teleport_burst' as any, 15, 10, 10);
        assertTrue(fallbackPose !== null && typeof fallbackPose === 'object', 'Must return valid pose on unknown action');
      },
    },
    {
      id: 'TEST-T2-F04-05',
      name: 'Non-Finite Progress in Pose Blending',
      feature: 'F-CHAR-CONTROLLER',
      tier: 2,
      description: 'controller.blend safely handles NaN or Infinity progress by clamping to [0, 1]',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['CharacterController']
        );
        if (!isAvailable) {
          ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const controller = new mod.CharacterController();
        const poseA = { root: { x: 100, y: 50, rotation: 0 }, limbs: {} };
        const poseB = { root: { x: 200, y: 150, rotation: 45 }, limbs: {} };

        const blendedNaN = controller.blend(poseA, poseB, NaN);
        assertTrue(Number.isFinite(blendedNaN.root.x), 'root.x must be finite when progress is NaN');
        assertTrue(Number.isFinite(blendedNaN.root.y), 'root.y must be finite when progress is NaN');

        const blendedInf = controller.blend(poseA, poseB, Infinity);
        assertTrue(Number.isFinite(blendedInf.root.x), 'root.x must be finite when progress is Infinity');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
