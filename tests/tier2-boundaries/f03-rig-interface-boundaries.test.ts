import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F03: RigInterface Contract & Joint Hierarchy Boundaries',
  feature: 'F-RIG-INTERFACE',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F03-01',
      name: 'Empty Limbs Dictionary Ingestion',
      feature: 'F-RIG-INTERFACE',
      tier: 2,
      description: 'Rig renders core torso/root or defaults without unhandled TypeError when limbs dictionary is empty',
      fn: async (ctx) => {
        const { module: rigs, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig / RigInterface not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new rigs.BirdRig();
        const defaultPose = rig.defaultPose || { root: { x: 0, y: 0, rotation: 0 }, limbs: {}, expression: {} };
        const emptyLimbPose = { ...defaultPose, limbs: {} };

        let rendered: any;
        try {
          rendered = rig.render(emptyLimbPose, {});
        } catch (err: any) {
          throw new Error(`Rig threw error on empty limbs: ${err.message}`);
        }
        assertTrue(rendered !== null && rendered !== undefined, 'Rig must return a renderable element');
      },
    },
    {
      id: 'TEST-T2-F03-02',
      name: 'Extreme Expression Range Clamping',
      feature: 'F-RIG-INTERFACE',
      tier: 2,
      description: 'Expression parameters exceeding physiological bounds are clamped to [-1.0, 1.0] and [0.0, 1.0]',
      fn: async (ctx) => {
        const { module: rigs, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['clampExpressionParams']
        );
        if (!isAvailable) {
          ctx.notImplemented('clampExpressionParams not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const clamped = rigs.clampExpressionParams({
          gazeX: 100.0,
          gazeY: -50.0,
          mouthOpen: 25.0,
        });
        assertEqual(clamped.gazeX, 1.0, 'gazeX must clamp to 1.0');
        assertEqual(clamped.gazeY, -1.0, 'gazeY must clamp to -1.0');
        assertEqual(clamped.mouthOpen, 1.0, 'mouthOpen must clamp to 1.0');
      },
    },
    {
      id: 'TEST-T2-F03-03',
      name: 'Extreme Scale and Rotation Values',
      feature: 'F-RIG-INTERFACE',
      tier: 2,
      description: 'Transform matrix calculation with extreme scales and large rotations produces finite coefficients',
      fn: async (ctx) => {
        const { module: rigs, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['computeJointMatrix']
        );
        if (!isAvailable) {
          ctx.notImplemented('computeJointMatrix not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const mat = rigs.computeJointMatrix({
          x: 0,
          y: 0,
          scaleX: 0,
          scaleY: 1e-9,
          rotation: 720000,
        });
        assertTrue(Array.isArray(mat) || typeof mat === 'object', 'Matrix must be array or object');
        const values = Array.isArray(mat) ? mat : Object.values(mat);
        for (const val of values) {
          if (typeof val === 'number') {
            assertTrue(Number.isFinite(val), `Matrix value ${val} must be finite`);
          }
        }
      },
    },
    {
      id: 'TEST-T2-F03-04',
      name: 'Null / Undefined Pose Parameter',
      feature: 'F-RIG-INTERFACE',
      tier: 2,
      description: 'Rig render safely handles undefined/null pose by falling back to defaultPose without unhandled crash',
      fn: async (ctx) => {
        const { module: rigs, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new rigs.BirdRig();
        let el: any;
        try {
          el = rig.render(undefined as any, {});
        } catch (err: any) {
          // If typed exception is thrown, verify it is controlled
          assertTrue(/invalid pose/i.test(err.message), 'Must throw controlled descriptive error on invalid pose');
          return;
        }
        assertTrue(el !== null && el !== undefined, 'Rig must return a fallback element');
      },
    },
    {
      id: 'TEST-T2-F03-05',
      name: 'Cyclic Joint Hierarchy Defense',
      feature: 'F-RIG-INTERFACE',
      tier: 2,
      description: 'Kinematic solver detects cyclic parent relationships and terminates with error instead of stack overflow',
      fn: async (ctx) => {
        const { module: rigs, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['solveKinematicChain']
        );
        if (!isAvailable) {
          ctx.notImplemented('solveKinematicChain not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const cyclicHierarchy = {
          jointA: { id: 'jointA', parent: 'jointB' },
          jointB: { id: 'jointB', parent: 'jointA' },
        };
        assertThrows(() => rigs.solveKinematicChain(cyclicHierarchy), /cyclic joint hierarchy/i);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
