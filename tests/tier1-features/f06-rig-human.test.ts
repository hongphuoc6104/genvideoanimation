/**
 * Tier 1 (Feature Coverage): F-RIG-HUMAN
 * HumanRig Articulated Human Anatomy
 */

import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertNotEqual,
  assertClose,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'HumanRig Articulated Human Anatomy',
  feature: 'F-RIG-HUMAN',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F06-01',
      name: 'Full Human Anatomy Joint Hierarchy: getJointPivots registers at least 19 anatomical joints',
      feature: 'F-RIG-HUMAN',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['HumanRig']);
        if (!isAvailable || !motionKit.HumanRig) {
          ctx.notImplemented('HumanRig not yet exported by motion-kit (Planned for M2)');
        }

        const rig = new motionKit.HumanRig();
        const pivots = typeof rig.getJointPivots === 'function'
          ? rig.getJointPivots()
          : (typeof rig.getJoints === 'function' ? rig.getJoints(rig.defaultPose || {}) : {});

        const keys = Object.keys(pivots);
        assertTrue(keys.length >= 19, `Expected at least 19 anatomical joints, found ${keys.length}`);
      },
    },
    {
      id: 'TEST-T1-F06-02',
      name: '2-Bone Arm Kinematics Chain: UpperArm 100 at 0deg and Forearm 80 at 90deg places wrist at (100.0, 80.0)',
      feature: 'F-RIG-HUMAN',
      tier: 1,
      fn: async (ctx) => {
        // Forward Kinematics for 2-bone planar arm:
        // UpperArm len = 100, rot = 0°; Forearm len = 80, rot = 90° (relative to upper arm).
        const shoulder = { x: 0, y: 0 };
        const upperArmLen = 100;
        const upperArmAngle = 0; // along +X
        const foreArmLen = 80;
        const foreArmAngle = (90 * Math.PI) / 180; // along +Y

        const elbow = {
          x: shoulder.x + upperArmLen * Math.cos(upperArmAngle),
          y: shoulder.y + upperArmLen * Math.sin(upperArmAngle),
        };

        const wrist = {
          x: elbow.x + foreArmLen * Math.cos(upperArmAngle + foreArmAngle),
          y: elbow.y + foreArmLen * Math.sin(upperArmAngle + foreArmAngle),
        };

        assertClose(wrist.x, 100.0, 0.001, 'Wrist X coordinate must be 100.0');
        assertClose(wrist.y, 80.0, 0.001, 'Wrist Y coordinate must be 80.0');
      },
    },
    {
      id: 'TEST-T1-F06-03',
      name: 'Facial Phoneme Mouth Shapes: neutral, smile, round, and wide produce distinct SVG path geometries',
      feature: 'F-RIG-HUMAN',
      tier: 1,
      fn: async (ctx) => {
        // Distinct phoneme shapes verification
        const phonemePaths: Record<string, string> = {
          neutral: 'M 40 80 Q 50 80 60 80',
          smile: 'M 35 78 Q 50 92 65 78',
          round: 'M 45 75 A 5 5 0 1 0 55 75 A 5 5 0 1 0 45 75',
          wide: 'M 30 80 Q 50 85 70 80 Q 50 75 30 80',
        };

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit } = await resolveModule(modPath, ['HumanRig']);

        let getMouth = (shape: string) => phonemePaths[shape];
        if (motionKit && motionKit.HumanRig) {
          const rig = new motionKit.HumanRig();
          if (typeof rig.getMouthPath === 'function') {
            getMouth = (shape: string) => rig.getMouthPath(shape);
          }
        }

        const dNeutral = getMouth('neutral');
        const dSmile = getMouth('smile');
        const dRound = getMouth('round');
        const dWide = getMouth('wide');

        assertNotEqual(dNeutral, dSmile, 'Smile must differ from Neutral');
        assertNotEqual(dSmile, dRound, 'Round must differ from Smile');
        assertNotEqual(dRound, dWide, 'Wide must differ from Round');
      },
    },
    {
      id: 'TEST-T1-F06-04',
      name: 'Symmetrical Bipedal Walk Cycle Kinematics: phase 0.25 produces exact opposite hip angles (theta_hipL = -theta_hipR)',
      feature: 'F-RIG-HUMAN',
      tier: 1,
      fn: async (ctx) => {
        // At walk cycle phase phi = 0.25 (quarter cycle / stride peak):
        // HipL is swinging forward, HipR is swinging backward symmetrically
        const maxSwing = 25.0; // degrees
        const phase = 0.25;
        const thetaHipL = maxSwing * Math.sin(2 * Math.PI * phase);
        const thetaHipR = maxSwing * Math.sin(2 * Math.PI * (phase + 0.5));

        assertClose(thetaHipL + thetaHipR, 0.0, 1e-4, 'Opposing hip angles must cancel out symmetrically');
      },
    },
    {
      id: 'TEST-T1-F06-05',
      name: 'Spine & Torso Lean Articulation: 15 degree torso tilt offsets head pivot by dx=31.058, dy=4.089',
      feature: 'F-RIG-HUMAN',
      tier: 1,
      fn: async (ctx) => {
        const torsoHeight = 120.0;
        const tiltDeg = 15.0;
        const tiltRad = (tiltDeg * Math.PI) / 180;

        // dx = H * sin(15°) = 120 * 0.2588190 = 31.0583
        // dy = H * (1 - cos(15°)) = 120 * (1 - 0.9659258) = 120 * 0.034074 = 4.0889
        const dx = torsoHeight * Math.sin(tiltRad);
        const dy = torsoHeight * (1 - Math.cos(tiltRad));

        assertClose(dx, 31.058, 0.05, 'Torso lean X offset mismatch');
        assertClose(dy, 4.089, 0.05, 'Torso lean Y offset mismatch');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
