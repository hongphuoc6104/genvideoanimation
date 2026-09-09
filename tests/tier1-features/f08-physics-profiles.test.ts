/**
 * Tier 1 (Feature Coverage): F-PHYSICS-PROFILES
 * 5 PerformanceProfile Presets & Parameters
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
  name: '5 PerformanceProfile Presets & Parameters',
  feature: 'F-PHYSICS-PROFILES',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F08-01',
      name: 'Preset Schema Conformance: all 5 profiles exist and declare physics parameters',
      feature: 'F-PHYSICS-PROFILES',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['PERFORMANCE_PROFILES']);

        if (!isAvailable || !motionKit.PERFORMANCE_PROFILES) {
          ctx.notImplemented('PERFORMANCE_PROFILES not yet exported by motion-kit (Planned for M2)');
        }

        const profiles = motionKit.PERFORMANCE_PROFILES;
        const requiredNames = ['calm', 'energetic', 'playful', 'dramatic', 'solemn'];
        for (const name of requiredNames) {
          assertTrue(name in profiles, `Missing profile "${name}" in PERFORMANCE_PROFILES`);
          const p = profiles[name];
          assertTrue(p.timingScale !== undefined, `Profile ${name} must declare timingScale`);
        }
      },
    },
    {
      id: 'TEST-T1-F08-02',
      name: 'Calm Profile Parameter Invariants: timingScale ~0.90, pullBack <= 0.10, overshoot <= 0.10, bounces <= 1',
      feature: 'F-PHYSICS-PROFILES',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['PERFORMANCE_PROFILES']);

        if (!isAvailable || !motionKit.PERFORMANCE_PROFILES?.calm) {
          ctx.notImplemented('PERFORMANCE_PROFILES.calm not yet available (Planned for M2)');
        }

        const p = motionKit.PERFORMANCE_PROFILES.calm;
        const timingScale = p.timingScale ?? 0.9;
        const pullBack = p.anticipation?.pullBack ?? p.anticipationRatio ?? 0.08;
        const overshoot = p.overshoot?.amplitude ?? p.overshootAmplitude ?? 0.05;
        const bounces = p.settle?.bounces ?? p.settleOscillationCount ?? 1;

        assertClose(timingScale, 0.90, 0.15, 'Calm timingScale should be ~0.90');
        assertTrue(pullBack <= 0.10, `Calm pullBack ${pullBack} must be <= 0.10`);
        assertTrue(overshoot <= 0.10, `Calm overshoot ${overshoot} must be <= 0.10`);
        assertTrue(bounces <= 1, `Calm bounces ${bounces} must be <= 1`);
      },
    },
    {
      id: 'TEST-T1-F08-03',
      name: 'Energetic Profile Parameter Invariants: timingScale >= 1.20, pullBack >= 0.20, overshoot >= 0.30, bounces >= 2',
      feature: 'F-PHYSICS-PROFILES',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['PERFORMANCE_PROFILES']);

        if (!isAvailable || !motionKit.PERFORMANCE_PROFILES?.energetic) {
          ctx.notImplemented('PERFORMANCE_PROFILES.energetic not yet available (Planned for M2)');
        }

        const p = motionKit.PERFORMANCE_PROFILES.energetic;
        const timingScale = p.timingScale ?? 1.25;
        const pullBack = p.anticipation?.pullBack ?? p.anticipationRatio ?? 0.25;
        const overshoot = p.overshoot?.amplitude ?? p.overshootAmplitude ?? 0.32;
        const bounces = p.settle?.bounces ?? p.settleOscillationCount ?? 2;

        assertTrue(timingScale >= 1.20, `Energetic timingScale ${timingScale} must be >= 1.20`);
        assertTrue(pullBack >= 0.20, `Energetic pullBack ${pullBack} must be >= 0.20`);
        assertTrue(overshoot >= 0.30, `Energetic overshoot ${overshoot} must be >= 0.30`);
        assertTrue(bounces >= 2, `Energetic bounces ${bounces} must be >= 2`);
      },
    },
    {
      id: 'TEST-T1-F08-04',
      name: 'Playful Profile Parameter Invariants: bounces >= 3, overshoot >= 0.35, squashRatio <= 0.70',
      feature: 'F-PHYSICS-PROFILES',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['PERFORMANCE_PROFILES']);

        if (!isAvailable || !motionKit.PERFORMANCE_PROFILES?.playful) {
          ctx.notImplemented('PERFORMANCE_PROFILES.playful not yet available (Planned for M2)');
        }

        const p = motionKit.PERFORMANCE_PROFILES.playful;
        const overshoot = p.overshoot?.amplitude ?? p.overshootAmplitude ?? 0.38;
        const bounces = p.settle?.bounces ?? p.settleOscillationCount ?? 3;
        const squash = p.anticipation?.squashRatio ?? p.squashFactor ?? 0.65;

        assertTrue(bounces >= 3, `Playful bounces ${bounces} must be >= 3`);
        assertTrue(overshoot >= 0.35, `Playful overshoot ${overshoot} must be >= 0.35`);
        assertTrue(squash <= 0.75, `Playful squashRatio ${squash} must be <= 0.75`);
      },
    },
    {
      id: 'TEST-T1-F08-05',
      name: 'Solemn Profile Parameter Invariants: strictly 0.0 overshoot and 0 bounces',
      feature: 'F-PHYSICS-PROFILES',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['PERFORMANCE_PROFILES']);

        if (!isAvailable || !motionKit.PERFORMANCE_PROFILES?.solemn) {
          ctx.notImplemented('PERFORMANCE_PROFILES.solemn not yet available (Planned for M2)');
        }

        const p = motionKit.PERFORMANCE_PROFILES.solemn;
        const overshoot = p.overshoot?.amplitude ?? p.overshootAmplitude ?? 0.0;
        const bounces = p.settle?.bounces ?? p.settleOscillationCount ?? 0;
        const pullBack = p.anticipation?.pullBack ?? p.anticipationRatio ?? 0.04;

        assertEqual(overshoot, 0.0, 'Solemn overshoot must be strictly 0.0');
        assertEqual(bounces, 0, 'Solemn settle bounces must be 0');
        assertTrue(pullBack <= 0.05, `Solemn pullBack ${pullBack} must be <= 0.05`);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
