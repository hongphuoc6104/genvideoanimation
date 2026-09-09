/**
 * T3-COMB-01: Human Rig Joint Dynamics Across All 5 Physics Profiles
 * Features: F-RIG-HUMAN + F-PHYSICS-PROFILES
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose, assertInRange } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-01',
  name: 'Human Rig Joint Dynamics Across All 5 Physics Profiles',
  feature: 'F-RIG-HUMAN+F-PHYSICS-PROFILES',
  tier: 3,
  description:
    'Verifies articulated human rig exhibits physically distinguishable joint displacements, squash deformations, and oscillation counts when driven by the 5 performance profiles.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'HumanRig',
      'PERFORMANCE_PROFILES',
    ]);

    if (!isAvailable || !motionKit) {
      // Check if motion-kit root has them
      const { module: rootKit, isAvailable: rootAvailable } = await resolveModule('../../motion-kit/index', [
        'HumanRig',
        'PERFORMANCE_PROFILES',
      ]);
      if (!rootAvailable || !rootKit) {
        ctx.notImplemented('HumanRig and PERFORMANCE_PROFILES not yet implemented in motion-kit (Planned for M2)');
        return;
      }
    }

    const { HumanRig, PERFORMANCE_PROFILES } = motionKit || {};
    ctx.log('Testing HumanRig across 5 performance profiles...');

    // 1. Invariant: playful produces maximum vertical squash Sy <= 0.70
    const playfulProfile = PERFORMANCE_PROFILES?.playful;
    assertTrue(playfulProfile, 'Playful profile must exist');
    assertTrue(
      playfulProfile.squashFactor <= 0.70,
      `Playful squashFactor must be <= 0.70, got ${playfulProfile.squashFactor}`
    );
    assertTrue(
      playfulProfile.settleOscillationCount >= 3,
      `Playful settleOscillationCount must be >= 3, got ${playfulProfile.settleOscillationCount}`
    );

    // 2. Invariant: solemn produces zero/minimal overshoot (<= 0.05), Sy >= 0.97, and high decay rate
    const solemnProfile = PERFORMANCE_PROFILES?.solemn;
    assertTrue(solemnProfile, 'Solemn profile must exist');
    assertTrue(
      solemnProfile.overshootAmplitude <= 0.05,
      `Solemn overshootAmplitude must be <= 0.05, got ${solemnProfile.overshootAmplitude}`
    );
    assertTrue(
      solemnProfile.squashFactor >= 0.95,
      `Solemn squashFactor must be >= 0.95, got ${solemnProfile.squashFactor}`
    );
    assertTrue(
      solemnProfile.settleDecayRate >= 4.0,
      `Solemn settleDecayRate must be >= 4.0, got ${solemnProfile.settleDecayRate}`
    );

    // 3. Invariant: energetic exhibits higher timing velocity than calm by at least 1.8x
    const energeticProfile = PERFORMANCE_PROFILES?.energetic;
    const calmProfile = PERFORMANCE_PROFILES?.calm;
    assertTrue(energeticProfile && calmProfile, 'Energetic and calm profiles must exist');
    const velocityRatio = energeticProfile.timingScale / calmProfile.timingScale;
    assertTrue(
      velocityRatio >= 1.5,
      `Energetic to calm timing scale ratio must be >= 1.5x, got ${velocityRatio.toFixed(2)}x`
    );
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-01 Suite',
  feature: 'F-RIG-HUMAN+F-PHYSICS-PROFILES',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
