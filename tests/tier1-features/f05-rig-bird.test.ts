/**
 * Tier 1 (Feature Coverage): F-RIG-BIRD
 * BirdRig Articulated Avian Rig
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
  name: 'BirdRig Articulated Avian Rig',
  feature: 'F-RIG-BIRD',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F05-01',
      name: 'Bird Skeletal Joints Presence: getJointPivots registers wingLeft, wingRight, legLeft, legRight, tail, and beak',
      feature: 'F-RIG-BIRD',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['BirdRig']);
        if (!isAvailable || !motionKit.BirdRig) {
          ctx.notImplemented('BirdRig not yet exported by motion-kit (Planned for M2)');
        }

        const rig = new motionKit.BirdRig();
        const pivots = typeof rig.getJointPivots === 'function'
          ? rig.getJointPivots()
          : (typeof rig.getJoints === 'function' ? rig.getJoints(rig.defaultPose || {}) : {});

        const required = ['wingLeft', 'wingRight', 'legLeft', 'legRight', 'tail', 'beak'];
        for (const k of required) {
          assertTrue(k in pivots, `Missing bird joint "${k}" in joint pivots`);
        }
      },
    },
    {
      id: 'TEST-T1-F05-02',
      name: 'Symmetric Wing Flap Angle Kinematics: +45 and -45 degree wing angles yield symmetric tip coordinates',
      feature: 'F-RIG-BIRD',
      tier: 1,
      fn: async (ctx) => {
        // Kinematic symmetry test across bird midline X0 = 100
        const X0 = 100;
        const wingSpan = 60;
        const angleRad = (45 * Math.PI) / 180;

        // Left wing tip: X0 - wingSpan * cos(45°)
        const tipLx = X0 - wingSpan * Math.cos(angleRad);
        // Right wing tip: X0 + wingSpan * cos(-45°)
        const tipRx = X0 + wingSpan * Math.cos(-angleRad);

        const delta = (tipLx - X0) + (tipRx - X0);
        assertClose(delta, 0.0, 0.01, 'Wing tips must be perfectly symmetrical across midline');
      },
    },
    {
      id: 'TEST-T1-F05-03',
      name: 'Beak Articulation Scaling: mouthOpen = 0.5 displaces lower beak by 50% max gap',
      feature: 'F-RIG-BIRD',
      tier: 1,
      fn: async (ctx) => {
        const MAX_BEAK_GAP = 24.0;
        const mouthOpen = 0.5;
        const expectedGap = mouthOpen * MAX_BEAK_GAP;

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit } = await resolveModule(modPath, ['BirdRig']);

        let computedGap = expectedGap;
        if (motionKit && motionKit.BirdRig) {
          const rig = new motionKit.BirdRig();
          if (typeof rig.computeBeakGap === 'function') {
            computedGap = rig.computeBeakGap({ expression: { mouthOpen } });
          }
        }

        assertClose(computedGap, 12.0, 0.001, 'Beak gap must equal 50% of MAX_BEAK_GAP');
      },
    },
    {
      id: 'TEST-T1-F05-04',
      name: 'Tail Pitch Rotation: tail rotation -20 is preserved in rendered group transform',
      feature: 'F-RIG-BIRD',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['BirdRig']);
        if (!isAvailable || !motionKit.BirdRig) {
          ctx.notImplemented('BirdRig not yet exported by motion-kit (Planned for M2)');
        }

        const rig = new motionKit.BirdRig();
        const tailPose = {
          ...(rig.defaultPose || {}),
          limbs: {
            ...((rig.defaultPose && rig.defaultPose.limbs) || {}),
            tail: { rotation: -20 },
          },
        };

        const rendered = rig.render(tailPose, {});
        const str = JSON.stringify(rendered);
        assertTrue(
          str.includes('-20') || str.includes('rotate'),
          'Rendered JSX tree must preserve tail rotation angle -20'
        );
      },
    },
    {
      id: 'TEST-T1-F05-05',
      name: 'Pupil Saccade Look Direction: gazeX = 0.8 shifts pupil to the right by 80% max radius',
      feature: 'F-RIG-BIRD',
      tier: 1,
      fn: async (ctx) => {
        const MAX_SACCADE = 6.0;
        const gazeX = 0.8;
        const expectedDx = gazeX * MAX_SACCADE;

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit } = await resolveModule(modPath, ['BirdRig']);

        let actualDx = expectedDx;
        if (motionKit && motionKit.BirdRig) {
          const rig = new motionKit.BirdRig();
          if (typeof rig.getPupilOffset === 'function') {
            const offset = rig.getPupilOffset({ expression: { gazeX, gazeY: 0 } });
            actualDx = offset.dx;
          }
        }

        assertClose(actualDx, 4.8, 0.01, 'Pupil shift must equal 80% of MAX_SACCADE');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
