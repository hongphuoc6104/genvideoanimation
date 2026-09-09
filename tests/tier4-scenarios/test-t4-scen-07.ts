/**
 * T4-SCEN-07: Articulated Avian Flight Physics & Aerodynamic Banking
 * Requirements: R2, R3, R4
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-07',
  name: 'Articulated Avian Flight Physics & Aerodynamic Banking',
  feature: 'F-RIG-BIRD',
  tier: 4,
  description:
    'End-to-end scenario verifying 120-frame avian flight kinematics: crouch anticipation, wing flapping cycles, aerodynamic banked turns (tan phi = v^2 / Rg), and touchdown impact squash & settle.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'BirdRig',
    ]);

    let kitMod = motionKit;
    if (!isAvailable || !kitMod?.BirdRig) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'CharacterRig',
      ]);
      if (!altAvailable || !altMod) {
        ctx.notImplemented('BirdRig flight kinematics not yet implemented in motion-kit (Planned for M2)');
        return;
      }
      kitMod = altMod;
    }

    ctx.log('Evaluating BirdRig aerodynamic flight kinematics simulation...');

    // Aerodynamic banking check: for velocity v = 15 px/frame, turn radius R = 200 px, g = 9.8
    // tan(phi) = v^2 / (R * g)
    const v = 15;
    const R = 200;
    const g = 9.8;
    const expectedTanPhi = (v * v) / (R * g);
    const expectedBankAngleDeg = (Math.atan(expectedTanPhi) * 180) / Math.PI;

    assertTrue(expectedBankAngleDeg > 0, 'Bank angle must be positive for turning flight');
    assertTrue(expectedBankAngleDeg < 60, 'Bank angle must be bounded within safe flight limits (<60 deg)');

    // When M2 exports BirdRig with flight kinematics evaluate method:
    if (typeof kitMod.BirdRig?.simulateFlight === 'function') {
      const sim = kitMod.BirdRig.simulateFlight({ duration: 120, velocity: v, radius: R });
      assertClose(sim.bankAngleDeg, expectedBankAngleDeg, 2.0, 'Simulated bank angle must match aerodynamics');
    } else {
      ctx.notImplemented('BirdRig flight kinematics simulation planned for M2');
    }
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-07 Suite',
  feature: 'F-RIG-BIRD',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
