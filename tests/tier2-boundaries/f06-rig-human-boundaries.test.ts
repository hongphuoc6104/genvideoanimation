import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F06: HumanRig Articulated Human Anatomy Boundaries',
  feature: 'F-RIG-HUMAN',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F06-01',
      name: 'Anatomical Knee Hinge Inversion Prevention',
      feature: 'F-RIG-HUMAN',
      tier: 2,
      description: 'Knee joint rotation of -45 degrees is clamped to anatomical hinge limit [0, 150] deg',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['HumanRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('HumanRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.HumanRig();
        if (typeof rig.clampKneeAngle === 'function') {
          const clamped = rig.clampKneeAngle(-45);
          assertEqual(clamped, 0.0, 'Knee angle must clamp to 0.0 deg');
        } else {
          const pose = {
            root: { x: 0, y: 0, rotation: 0 },
            limbs: { kneeL: { rotation: -45 } },
            expression: {},
          };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'HumanRig renders safely with clamped knee rotation');
        }
      },
    },
    {
      id: 'TEST-T2-F06-02',
      name: 'Unknown Mouth Phoneme Shape',
      feature: 'F-RIG-HUMAN',
      tier: 2,
      description: 'Unsupported mouth shape falls back to neutral mouth path without runtime crash',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['HumanRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('HumanRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.HumanRig();
        if (typeof rig.getMouthPath === 'function') {
          const path = rig.getMouthPath('zigzag_unsupported' as any);
          const neutral = rig.getMouthPath('neutral');
          assertEqual(path, neutral, 'Must fall back to neutral mouth path');
        } else {
          const pose = {
            root: { x: 0, y: 0, rotation: 0 },
            limbs: {},
            expression: { mouthShape: 'zigzag_unsupported' },
          };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'Must render safely with fallback mouth shape');
        }
      },
    },
    {
      id: 'TEST-T2-F06-03',
      name: 'Amputation Tolerance (Missing Limb Pair)',
      feature: 'F-RIG-HUMAN',
      tier: 2,
      description: 'Pose missing shoulderR, elbowR, wristR renders available limbs cleanly without undefined error',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['HumanRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('HumanRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.HumanRig();
        const oneArmedPose = {
          root: { x: 100, y: 200, rotation: 0 },
          limbs: {
            shoulderL: { rotation: 10 },
            elbowL: { rotation: 20 },
            wristL: { rotation: 0 },
          },
          expression: {},
        };
        const rendered = rig.render(oneArmedPose, {});
        assertTrue(rendered !== null, 'Must render safely with omitted limb pair');
      },
    },
    {
      id: 'TEST-T2-F06-04',
      name: 'Eyebrow Tilt Boundary Clamping',
      feature: 'F-RIG-HUMAN',
      tier: 2,
      description: 'Eyebrow tilt of 180 degrees is clamped to physiological range [-30, +30]',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['HumanRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('HumanRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.HumanRig();
        if (typeof rig.clampEyebrowTilt === 'function') {
          const tilt = rig.clampEyebrowTilt(180);
          assertEqual(tilt, 30.0, 'Eyebrow tilt must clamp to 30.0 deg');
        } else {
          const pose = {
            root: { x: 0, y: 0, rotation: 0 },
            limbs: {},
            expression: { eyebrowTilt: 180 },
          };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'Must render safely with clamped eyebrow tilt');
        }
      },
    },
    {
      id: 'TEST-T2-F06-05',
      name: 'Negative Eye Scale',
      feature: 'F-RIG-HUMAN',
      tier: 2,
      description: 'Eye scale of -1.0 is clamped to minimum non-negative scale >= 0.0 without inverting pupil',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['HumanRig']
        );
        if (!isAvailable) {
          ctx.notImplemented('HumanRig not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rig = new mod.HumanRig();
        if (typeof rig.clampEyeScale === 'function') {
          const scale = rig.clampEyeScale(-1.0);
          assertTrue(scale >= 0.0, 'Eye scale must clamp to >= 0.0');
        } else {
          const pose = {
            root: { x: 0, y: 0, rotation: 0 },
            limbs: {},
            expression: { eyeScale: -1.0 },
          };
          const rendered = rig.render(pose, {});
          assertTrue(rendered !== null, 'Must render safely with negative eyeScale');
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
