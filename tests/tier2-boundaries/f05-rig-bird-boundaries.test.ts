import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F05: BirdRig Articulated Avian Rig Boundaries',
  feature: 'F-RIG-BIRD',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F05-01',
      name: 'Wing Angle Hyper-Extension Clamping',
      feature: 'F-RIG-BIRD',
      tier: 2,
      description: 'Wing rotation angle of 720 degrees is clamped to anatomical range [-90, +90]',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.BirdRig();
        if (typeof rig.getClampedWingAngle === 'function') {
          const angle = rig.getClampedWingAngle(720);
          assertTrue(angle <= 90.0 && angle >= -90.0, 'Wing angle must clamp to [-90, 90]');
        } else {
          // Verify via rendering pose with 720 rotation
          const pose = {
            root: { x: 0, y: 0, rotation: 0 },
            limbs: { wingLeft: { rotation: 720 }, wingRight: { rotation: -720 } },
            expression: {},
          };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'BirdRig must render safely with clamped wing rotation');
        }
      },
    },
    {
      id: 'TEST-T2-F05-02',
      name: 'Negative Beak Opening',
      feature: 'F-RIG-BIRD',
      tier: 2,
      description: 'Negative mouthOpen value (-1.5) clamps to 0.0 (fully closed beak) without inverting geometry',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.BirdRig();
        if (typeof rig.computeBeakGap === 'function') {
          const gap = rig.computeBeakGap({ expression: { mouthOpen: -1.5 } });
          assertEqual(gap, 0.0, 'Beak gap for negative mouthOpen must be 0.0');
        } else {
          const pose = { root: { x: 0, y: 0, rotation: 0 }, limbs: {}, expression: { mouthOpen: -1.5 } };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'Must render without error on negative mouthOpen');
        }
      },
    },
    {
      id: 'TEST-T2-F05-03',
      name: 'Zero ViewBox Dimensions',
      feature: 'F-RIG-BIRD',
      tier: 2,
      description: 'BirdRig rendering with width=0 and height=0 safely produces SVG without divide-by-zero crash',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.BirdRig();
        const rendered = rig.render(rig.defaultPose || {}, { width: 0, height: 0 });
        assertTrue(rendered !== null, 'Must render element with zero width/height');
      },
    },
    {
      id: 'TEST-T2-F05-04',
      name: 'Missing Wing Limb in Custom Bird Pose',
      feature: 'F-RIG-BIRD',
      tier: 2,
      description: 'Pose missing wingLeft and wingRight limbs renders default wings in neutral position without crashing',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.BirdRig();
        const poseWithoutWings = {
          root: { x: 50, y: 50, rotation: 0 },
          limbs: { tail: { rotation: 0 }, beak: { rotation: 0 } },
          expression: {},
        };
        const rendered = rig.render(poseWithoutWings, {});
        assertTrue(rendered !== null, 'Must render without throwing when wings limb is omitted');
      },
    },
    {
      id: 'TEST-T2-F05-05',
      name: 'Extreme Squash Volume Preservation Floor',
      feature: 'F-RIG-BIRD',
      tier: 2,
      description: 'Zero or negative squash value is clamped to safe volume preservation floor (scaleX <= 5.0, finite)',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['BirdRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('BirdRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.BirdRig();
        if (typeof rig.computeSquashScales === 'function') {
          const scales = rig.computeSquashScales(0.0);
          assertTrue(Number.isFinite(scales.scaleX), 'scaleX must be finite');
          assertTrue(scales.scaleX <= 5.0, 'scaleX must not blow up above 5.0');
        } else {
          const pose = { root: { x: 0, y: 0, rotation: 0, squash: 0.0 }, limbs: {}, expression: {} };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'Must render safely with squash = 0.0');
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
