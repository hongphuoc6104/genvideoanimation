import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F08: 5 PerformanceProfile Presets & Parameters Boundaries',
  feature: 'F-PHYSICS-PROFILES',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F08-01',
      name: 'Unknown Profile Name Request',
      feature: 'F-PHYSICS-PROFILES',
      tier: 2,
      description: 'Requesting unknown performance profile name throws descriptive error',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['getPerformanceProfile']
        );
        if (!isAvailable) {
          ctx.notImplemented('getPerformanceProfile not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        assertThrows(
          () => mod.getPerformanceProfile('hyperactive' as any),
          /unknown performance profile/i
        );
      },
    },
    {
      id: 'TEST-T2-F08-02',
      name: 'Zero Damping Profile Clamping',
      feature: 'F-PHYSICS-PROFILES',
      tier: 2,
      description: 'Zero damping parameter is clamped to safe minimum >= 0.05 to avoid infinite resonance',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['sanitizeProfile', 'PERFORMANCE_PROFILES']
        );
        if (!isAvailable) {
          ctx.notImplemented('sanitizeProfile not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const inputProfile = {
          ...mod.PERFORMANCE_PROFILES.calm,
          followThrough: { damping: 0.0, lagFrames: 2 },
          damping: 0.0,
        };
        const safe = mod.sanitizeProfile(inputProfile);
        const effectiveDamping = safe.damping ?? safe.followThrough?.damping ?? 0.05;
        assertTrue(effectiveDamping >= 0.05, `Effective damping must be >= 0.05, got ${effectiveDamping}`);
      },
    },
    {
      id: 'TEST-T2-F08-03',
      name: 'Negative Timing Scale Clamping',
      feature: 'F-PHYSICS-PROFILES',
      tier: 2,
      description: 'Negative timing scale is clamped to minimum positive scale >= 0.1',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['sanitizeProfile', 'PERFORMANCE_PROFILES']
        );
        if (!isAvailable) {
          ctx.notImplemented('sanitizeProfile not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const inputProfile = {
          ...mod.PERFORMANCE_PROFILES.energetic,
          timingScale: -1.5,
        };
        const safe = mod.sanitizeProfile(inputProfile);
        assertTrue(safe.timingScale >= 0.1, `timingScale must clamp to >= 0.1, got ${safe.timingScale}`);
      },
    },
    {
      id: 'TEST-T2-F08-04',
      name: 'Infinite Settle Decay Rate',
      feature: 'F-PHYSICS-PROFILES',
      tier: 2,
      description: 'Extremely high settle decay rate (1e9) settles to 1.0 at t > 0 without NaN or overflow',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['evaluateSettle', 'PERFORMANCE_PROFILES']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluateSettle not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const extremeProfile = {
          ...mod.PERFORMANCE_PROFILES.calm,
          settle: { decay: 1e9, bounces: 0, durationFrames: 10 },
          settleDecayRate: 1e9,
        };
        const val = mod.evaluateSettle(0.01, extremeProfile);
        assertTrue(Number.isFinite(val), 'Settle value must be finite');
        assertClose(val, 1.0, 1e-3, 'Settle value with 1e9 decay must equal 1.0 at t=0.01');
      },
    },
    {
      id: 'TEST-T2-F08-05',
      name: 'Preset Immutability Invariant',
      feature: 'F-PHYSICS-PROFILES',
      tier: 2,
      description: 'PERFORMANCE_PROFILES presets are frozen and cannot be mutated at runtime',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/physics/index',
          ['PERFORMANCE_PROFILES']
        );
        if (!isAvailable) {
          ctx.notImplemented('PERFORMANCE_PROFILES not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const originalTiming = mod.PERFORMANCE_PROFILES.calm.timingScale;
        try {
          (mod.PERFORMANCE_PROFILES.calm as any).timingScale = 999.0;
        } catch {}

        assertEqual(
          mod.PERFORMANCE_PROFILES.calm.timingScale,
          originalTiming,
          'Preset timingScale must remain immutable'
        );
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
