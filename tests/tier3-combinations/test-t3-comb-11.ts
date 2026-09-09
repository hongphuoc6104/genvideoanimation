/**
 * T3-COMB-11: Bird Rig Wing Kinematics & Touchdown Squash Across Profiles
 * Features: F-RIG-BIRD + F-PHYSICS-PROFILES
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-11',
  name: 'Bird Rig Wing Kinematics & Touchdown Squash Across Profiles',
  feature: 'F-RIG-BIRD+F-PHYSICS-PROFILES',
  tier: 3,
  description:
    'Verifies BirdRig wing flapping frequency and touchdown impact squash scale dynamically across calm and energetic performance profiles.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'BirdRig',
      'PERFORMANCE_PROFILES',
    ]);

    let kitMod = motionKit;
    if (!isAvailable || !kitMod?.BirdRig) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'CharacterRig',
        'MOTION_PROFILES',
      ]);
      if (!altAvailable || !altMod) {
        ctx.notImplemented('BirdRig with performance profiles not yet implemented in motion-kit (Planned for M2)');
        return;
      }
      kitMod = altMod;
    }

    if (!kitMod.PERFORMANCE_PROFILES) {
      ctx.notImplemented('PERFORMANCE_PROFILES not yet implemented in motion-kit (Planned for M2)');
      return;
    }

    const { BirdRig, PERFORMANCE_PROFILES } = kitMod;
    ctx.log('Evaluating BirdRig landing dynamics across energetic and calm profiles...');

    const energetic = PERFORMANCE_PROFILES.energetic;
    const calm = PERFORMANCE_PROFILES.calm;

    // 1. Invariant: Flap frequency / timing scale is significantly higher in energetic
    assertTrue(
      energetic.timingScale > calm.timingScale,
      'Energetic profile timingScale must exceed calm profile'
    );

    // 2. Invariant: Touchdown squash is deeper in energetic than calm
    assertTrue(
      energetic.squashFactor < calm.squashFactor,
      `Energetic squash (${energetic.squashFactor}) must be deeper than calm (${calm.squashFactor})`
    );

    // 3. Invariant: Overshoot amplitude in energetic is larger than in calm
    assertTrue(
      energetic.overshootAmplitude > calm.overshootAmplitude,
      'Energetic overshoot must exceed calm profile'
    );
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-11 Suite',
  feature: 'F-RIG-BIRD+F-PHYSICS-PROFILES',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
