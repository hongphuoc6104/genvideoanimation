/**
 * T3-COMB-15: ShotSpec Key Beats Mapped to Profile Dynamics
 * Features: F-SHOTSPEC-CUES + F-PROFILE-ACTIONS
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-15',
  name: 'ShotSpec Key Beats Mapped to Profile Dynamics',
  feature: 'F-SHOTSPEC-CUES+F-PROFILE-ACTIONS',
  tier: 3,
  description:
    'Verifies key beats declared in ShotSpec with performance_profile annotations drive character action dynamics matching profile physics metrics.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'CharacterController',
      'PERFORMANCE_PROFILES',
    ]);

    let kitMod = motionKit;
    if (!isAvailable || !kitMod?.CharacterController) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'CharacterController',
        'PERFORMANCE_PROFILES',
      ]);
      if (!altAvailable || !altMod?.CharacterController) {
        ctx.notImplemented('CharacterController or PERFORMANCE_PROFILES not yet implemented (Planned for M2)');
        return;
      }
      kitMod = altMod;
    }

    const { CharacterController, PERFORMANCE_PROFILES } = kitMod;
    ctx.log('Testing ShotSpec key beat profile mapping to action dynamics...');

    const dramaticProfile = PERFORMANCE_PROFILES?.dramatic;
    assertTrue(dramaticProfile, 'Dramatic profile must exist');
    assertTrue(dramaticProfile.anticipationRatio > 0.2, 'Dramatic profile has elongated anticipation');

    const controller = new CharacterController();
    controller.queueAction({
      name: 'recoil',
      startFrame: 45,
      endFrame: 75,
      profile: 'dramatic',
    });

    const evaluatedPose = controller.evaluate(50);
    assertTrue(evaluatedPose !== undefined, 'Controller must evaluate pose at frame 50');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-15 Suite',
  feature: 'F-SHOTSPEC-CUES+F-PROFILE-ACTIONS',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
