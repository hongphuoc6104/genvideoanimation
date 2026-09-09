/**
 * Tier 1 (Feature Coverage): F-PROFILE-ACTIONS
 * Profile-Driven Dynamics (Anticipate, Overshoot, Settle)
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
  name: 'Profile-Driven Dynamics (Anticipate, Overshoot, Settle)',
  feature: 'F-PROFILE-ACTIONS',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F09-01',
      name: 'Profile-Driven Anticipation Displacement: dramatic profile achieves -0.28 pullBack at t=0.5',
      feature: 'F-PROFILE-ACTIONS',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, [
          'evaluateAnticipation',
          'PERFORMANCE_PROFILES',
        ]);

        if (!isAvailable || typeof motionKit?.evaluateAnticipation !== 'function') {
          ctx.notImplemented('evaluateAnticipation with PerformanceProfile not yet available in motion-kit (Planned for M2)');
        }

        const profile = motionKit.PERFORMANCE_PROFILES?.dramatic || { anticipation: { pullBack: 0.28 } };
        const val = motionKit.evaluateAnticipation(0.5, profile);
        assertClose(val, -0.28, 0.005, 'Anticipation displacement at t=0.5 must be -0.28');
      },
    },
    {
      id: 'TEST-T1-F09-02',
      name: 'Profile-Driven Overshoot Peak Response: energetic profile peak response reaches between 1.25 and 1.35',
      feature: 'F-PROFILE-ACTIONS',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, [
          'evaluateOvershoot',
          'PERFORMANCE_PROFILES',
        ]);

        if (!isAvailable || typeof motionKit?.evaluateOvershoot !== 'function') {
          ctx.notImplemented('evaluateOvershoot with PerformanceProfile not yet available in motion-kit (Planned for M2)');
        }

        const profile = motionKit.PERFORMANCE_PROFILES?.energetic;
        let peak = 0;
        for (let i = 0; i <= 100; i++) {
          const val = motionKit.evaluateOvershoot(i / 100, profile);
          if (val > peak) peak = val;
        }

        assertTrue(peak >= 1.25 && peak <= 1.35, `Energetic peak response ${peak} not in [1.25, 1.35]`);
      },
    },
    {
      id: 'TEST-T1-F09-03',
      name: 'Multi-Bounce Settle Zero-Crossings: playful settle exhibits at least 3 zero-crossings around 1.0',
      feature: 'F-PROFILE-ACTIONS',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, [
          'evaluateSettle',
          'PERFORMANCE_PROFILES',
        ]);

        if (!isAvailable || typeof motionKit?.evaluateSettle !== 'function') {
          ctx.notImplemented('evaluateSettle with PerformanceProfile not yet available in motion-kit (Planned for M2)');
        }

        const profile = motionKit.PERFORMANCE_PROFILES?.playful;
        let zeroCrossings = 0;
        let prevSign = Math.sign(motionKit.evaluateSettle(0.01, profile) - 1.0);
        for (let i = 2; i <= 200; i++) {
          const t = i / 200;
          const diff = motionKit.evaluateSettle(t, profile) - 1.0;
          const sign = Math.sign(diff);
          if (sign !== 0 && sign !== prevSign) {
            zeroCrossings++;
            prevSign = sign;
          }
        }

        assertTrue(zeroCrossings >= 3, `Expected at least 3 zero-crossings for playful settle, found ${zeroCrossings}`);
      },
    },
    {
      id: 'TEST-T1-F09-04',
      name: 'Volume-Preserving Squash and Stretch Math: scaleY 0.64 yields scaleX 1.250 (1/sqrt(0.64))',
      feature: 'F-PROFILE-ACTIONS',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['squashStretch']);

        if (!isAvailable || typeof motionKit?.squashStretch !== 'function') {
          ctx.notImplemented('squashStretch not yet exported by motion-kit');
        }

        const res = motionKit.squashStretch(0.64);
        const scaleX = typeof res === 'object' ? res.scaleX : res;
        assertClose(scaleX, 1.250, 1e-4, 'ScaleX must equal 1.250 for volume preservation');
      },
    },
    {
      id: 'TEST-T1-F09-05',
      name: 'Solemn Monotonicity Invariant: solemn settle is monotonically non-decreasing with max <= 1.00001',
      feature: 'F-PROFILE-ACTIONS',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, [
          'evaluateSettle',
          'PERFORMANCE_PROFILES',
        ]);

        if (!isAvailable || typeof motionKit?.evaluateSettle !== 'function') {
          ctx.notImplemented('evaluateSettle with PerformanceProfile not yet available in motion-kit (Planned for M2)');
        }

        const profile = motionKit.PERFORMANCE_PROFILES?.solemn;
        const samples = Array.from({ length: 100 }, (_, i) => motionKit.evaluateSettle(i / 99, profile));
        const maxVal = Math.max(...samples);
        assertTrue(maxVal <= 1.00001, `Solemn settle must not overshoot 1.0 (max = ${maxVal})`);

        for (let i = 0; i < samples.length - 1; i++) {
          assertTrue(
            samples[i + 1] >= samples[i] - 1e-5,
            `Solemn curve must be monotonic non-decreasing at index ${i}`
          );
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
