import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F09: Profile-Driven Dynamics Boundaries',
  feature: 'F-PROFILE-ACTIONS',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F09-01',
      name: 'Exact Boundaries t = 0.0 and t = 1.0',
      feature: 'F-PROFILE-ACTIONS',
      tier: 2,
      description: 'Profile evaluation at t=0 and t=1 evaluates exactly to 0.0 and 1.0 across presets',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['evaluateOvershoot', 'PERFORMANCE_PROFILES']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluateOvershoot / PERFORMANCE_PROFILES not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        for (const [name, profile] of Object.entries(mod.PERFORMANCE_PROFILES)) {
          const valAt0 = mod.evaluateOvershoot(0.0, profile);
          const valAt1 = mod.evaluateOvershoot(1.0, profile);
          assertClose(valAt0, 0.0, 1e-6, `evaluateOvershoot at t=0 for ${name} must equal 0.0`);
          assertClose(valAt1, 1.0, 1e-6, `evaluateOvershoot at t=1 for ${name} must equal 1.0`);
        }
      },
    },
    {
      id: 'TEST-T2-F09-02',
      name: 'Out-of-Bounds Parameter Clamping (t < 0, t > 1)',
      feature: 'F-PROFILE-ACTIONS',
      tier: 2,
      description: 'Evaluation with t = -0.5 and t = 1.8 clamps to t = 0.0 and t = 1.0 respectively',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['evaluateOvershoot', 'PERFORMANCE_PROFILES']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluateOvershoot / PERFORMANCE_PROFILES not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const profile = mod.PERFORMANCE_PROFILES.energetic;
        const valNeg = mod.evaluateOvershoot(-0.5, profile);
        const valZero = mod.evaluateOvershoot(0.0, profile);
        assertClose(valNeg, valZero, 1e-6, 'Negative t must clamp to t=0');

        const valOver = mod.evaluateOvershoot(1.8, profile);
        const valOne = mod.evaluateOvershoot(1.0, profile);
        assertClose(valOver, valOne, 1e-6, 't > 1 must clamp to t=1');
      },
    },
    {
      id: 'TEST-T2-F09-03',
      name: 'Zero Scale in Squash & Stretch',
      feature: 'F-PROFILE-ACTIONS',
      tier: 2,
      description: 'squashStretch(0.0) returns safe floor scale without division by zero NaN',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['squashStretch']
        );
        if (!isAvailable) {
          ctx.notImplemented('squashStretch not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const res = mod.squashStretch(0.0);
        assertTrue(Number.isFinite(res.scaleX), 'scaleX must be finite');
        assertTrue(res.scaleX > 0, 'scaleX must be positive');
        assertTrue(res.scaleX <= 5.0, 'scaleX must not exceed safe limit 5.0');
      },
    },
    {
      id: 'TEST-T2-F09-04',
      name: 'Zero Decay Oscillator Protection',
      feature: 'F-PROFILE-ACTIONS',
      tier: 2,
      description: 'Harmonic oscillator with zero decay stays bounded by amplitude A without exploding',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['evaluateOscillator']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluateOscillator not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const A = 0.3;
        const val = mod.evaluateOscillator(0.5, A, 5, 0);
        assertTrue(Number.isFinite(val), 'Oscillator value must be finite');
        assertTrue(val <= 1.0 + A + 0.05, `Oscillator value ${val} must remain bounded by 1.0 + A`);
      },
    },
    {
      id: 'TEST-T2-F09-05',
      name: '1-Frame Action Duration',
      feature: 'F-PROFILE-ACTIONS',
      tier: 2,
      description: 'Action duration of 1 frame evaluates cleanly from frame 0 to frame 1 without NaN',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['CharacterController']
        );
        if (!isAvailable) {
          ctx.notImplemented('CharacterController not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const controller = new mod.CharacterController();
        const p0 = controller.evaluateAction('overshoot', 0, 0, 1);
        const p1 = controller.evaluateAction('overshoot', 1, 0, 1);
        assertTrue(Number.isFinite(p0.root?.x ?? 0), 'p0 root.x must be finite');
        assertTrue(Number.isFinite(p1.root?.x ?? 0), 'p1 root.x must be finite');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
