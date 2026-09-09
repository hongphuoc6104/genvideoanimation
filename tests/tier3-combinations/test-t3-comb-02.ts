/**
 * T3-COMB-02: Character Controller Action Blending Continuity
 * Features: F-CHAR-CONTROLLER + F-PROFILE-ACTIONS
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose, assertInRange } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-02',
  name: 'Character Controller Action Blending Continuity',
  feature: 'F-CHAR-CONTROLLER+F-PROFILE-ACTIONS',
  tier: 3,
  description:
    'Verifies action transitions (anticipate -> react -> settle) maintain C0 joint position continuity across phase boundaries without teleports.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'CharacterController',
    ]);

    let controllerModule = motionKit;
    if (!isAvailable || !controllerModule?.CharacterController) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'CharacterController',
      ]);
      if (!altAvailable || !altMod?.CharacterController) {
        ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
        return;
      }
      controllerModule = altMod;
    }

    const { CharacterController } = controllerModule;
    const controller = new CharacterController();
    ctx.log('Testing CharacterController action sequence continuity under dramatic profile...');

    // Schedule 3 actions across 90 frames: anticipate (0-30), react (30-60), settle (60-90)
    controller.queueAction({ name: 'anticipate', startFrame: 0, endFrame: 30, profile: 'dramatic' });
    controller.queueAction({ name: 'react', startFrame: 30, endFrame: 60, profile: 'dramatic' });
    controller.queueAction({ name: 'settle', startFrame: 60, endFrame: 90, profile: 'dramatic' });

    // 1. Invariant: Anticipation phase exhibits negative pullback displacement
    let hasNegativePullback = false;
    let minDisplacement = 0;
    for (let f = 1; f < 25; f++) {
      const pose = controller.evaluate(f);
      const disp = pose.rootOffset?.x ?? pose.torsoOffset?.x ?? 0;
      if (disp < minDisplacement) {
        minDisplacement = disp;
        hasNegativePullback = true;
      }
    }
    assertTrue(hasNegativePullback, 'Anticipation phase must exhibit negative displacement (pull-back)');

    // 2. Invariant: C0 continuity across boundary frames t = 29, 30 and t = 59, 60
    const pose29 = controller.evaluate(29);
    const pose30 = controller.evaluate(30);
    const delta30 = Math.abs((pose30.rootOffset?.x ?? 0) - (pose29.rootOffset?.x ?? 0));
    assertTrue(delta30 <= 25.0, `Boundary delta at frame 30 must not exceed max velocity, got ${delta30}`);

    const pose59 = controller.evaluate(59);
    const pose60 = controller.evaluate(60);
    const delta60 = Math.abs((pose60.rootOffset?.x ?? 0) - (pose59.rootOffset?.x ?? 0));
    assertTrue(delta60 <= 25.0, `Boundary delta at frame 60 must not exceed max velocity, got ${delta60}`);
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-02 Suite',
  feature: 'F-CHAR-CONTROLLER+F-PROFILE-ACTIONS',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
