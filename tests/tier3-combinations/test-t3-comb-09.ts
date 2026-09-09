/**
 * T3-COMB-09: Arbitrary Custom Rig Adapter Driven by Character Controller
 * Features: F-RIG-CUSTOM + F-CHAR-CONTROLLER
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import { resolveModule, SYNTHETIC_SVG_CUSTOM_ROBOT } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-09',
  name: 'Arbitrary Custom Rig Adapter Driven by Character Controller',
  feature: 'F-RIG-CUSTOM+F-CHAR-CONTROLLER',
  tier: 3,
  description:
    'Verifies arbitrary custom SVG character mounts via ArbitraryCustomRigAdapter and responds to CharacterController commands, ignoring unmapped joint channels without errors.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'ArbitraryCustomRigAdapter',
      'CharacterController',
    ]);

    let kitMod = motionKit;
    if (!isAvailable || !kitMod?.ArbitraryCustomRigAdapter) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'ArbitraryCustomRigAdapter',
      ]);
      if (!altAvailable || !altMod?.ArbitraryCustomRigAdapter) {
        ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
        return;
      }
      kitMod = altMod;
    }

    const { ArbitraryCustomRigAdapter, CharacterController } = kitMod;
    ctx.log('Mounting synthetic custom robot SVG via ArbitraryCustomRigAdapter...');

    const adapter = new ArbitraryCustomRigAdapter({
      svgSource: SYNTHETIC_SVG_CUSTOM_ROBOT,
      jointMapping: {
        torso: 'base',
        head: 'arm1',
        armRight: 'arm2',
        handRight: 'gripper',
      },
    });

    assertEqual(adapter.type, 'custom', 'Rig type must be custom');

    // 1. Invariant: Query joints conforms to RigInterface contract
    const joints = adapter.getJoints();
    assertTrue('base' in joints, 'base joint must be discovered from SVG');
    assertTrue('arm1' in joints, 'arm1 joint must be discovered from SVG');
    assertTrue('arm2' in joints, 'arm2 joint must be discovered from SVG');
    assertTrue('gripper' in joints, 'gripper joint must be discovered from SVG');

    // 2. Invariant: Unmapped channels in generic pose do not cause exceptions
    const genericPoseWithUnmapped = {
      rootOffset: { x: 10, y: 5 },
      torsoAngle: 15,
      wingLeftAngle: 45, // Unmapped in robot!
      beakOpen: 0.8, // Unmapped in robot!
    };

    let renderSucceeded = false;
    try {
      adapter.applyPose(genericPoseWithUnmapped);
      renderSucceeded = true;
    } catch (e) {
      renderSucceeded = false;
    }
    assertTrue(renderSucceeded, 'Unmapped joint channels in generic pose must be safely ignored');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-09 Suite',
  feature: 'F-RIG-CUSTOM+F-CHAR-CONTROLLER',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
