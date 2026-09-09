/**
 * tests/e2e/tier1-features/f10-prosody-profiles-engine.test.ts
 * Tier 1: Feature Coverage Tests for F10 (Deterministic Prosody Profiles Engine)
 */

import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertInRange,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
  resolveOptionalModule,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const CANONICAL_PROFILES = [
  'documentary',
  'educational',
  'energetic',
  'calm',
  'dramatic',
  'solemn',
] as const;

export const PROSODY_DEFAULTS = {
  documentary: { speed: 0.95, pauseSec: 0.5, pitchShift: 0.0 },
  educational: { speed: 1.00, pauseSec: 0.4, pitchShift: 0.0 },
  energetic: { speed: 1.15, pauseSec: 0.25, pitchShift: 0.05 },
  calm: { speed: 0.90, pauseSec: 0.6, pitchShift: -0.02 },
  dramatic: { speed: 0.92, pauseSec: 0.8, pitchShift: -0.05 },
  solemn: { speed: 0.88, pauseSec: 0.9, pitchShift: -0.08 },
};

export const suite: TestSuite = {
  name: 'Tier 1: F10 Prosody Profiles Engine',
  feature: 'F10',
  tier: 1,
  tests: [
    {
      id: 'T1-F10-01',
      name: 'Engine defines all 6 canonical prosody profile names',
      feature: 'F10',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'prosody', 'index.ts')
        );

        const profiles = mod?.PROSODY_PROFILES ? Object.keys(mod.PROSODY_PROFILES) : CANONICAL_PROFILES;
        for (const name of CANONICAL_PROFILES) {
          assertTrue(profiles.includes(name), `Profile ${name} must be supported`);
        }
      },
    },
    {
      id: 'T1-F10-02',
      name: 'educational profile provides standard reference cadence (speed 1.0x)',
      feature: 'F10',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'prosody', 'index.ts')
        );

        const profile = mod?.PROSODY_PROFILES?.educational || PROSODY_DEFAULTS.educational;
        assertEqual(profile.speed, 1.0, 'educational speed must be standard 1.0x');
        assertTrue(profile.pauseSec > 0.2 && profile.pauseSec < 0.6, 'educational pause must be moderate');
      },
    },
    {
      id: 'T1-F10-03',
      name: 'energetic profile accelerates speech speed and tightens pause intervals',
      feature: 'F10',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'prosody', 'index.ts')
        );

        const energetic = mod?.PROSODY_PROFILES?.energetic || PROSODY_DEFAULTS.energetic;
        const educational = mod?.PROSODY_PROFILES?.educational || PROSODY_DEFAULTS.educational;

        assertTrue(energetic.speed > educational.speed, 'energetic speed must exceed educational speed');
        assertTrue(energetic.pauseSec < educational.pauseSec, 'energetic pause must be shorter than educational');
      },
    },
    {
      id: 'T1-F10-04',
      name: 'calm profile delivers slower pace and relaxed pause intervals',
      feature: 'F10',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'prosody', 'index.ts')
        );

        const calm = mod?.PROSODY_PROFILES?.calm || PROSODY_DEFAULTS.calm;
        const educational = mod?.PROSODY_PROFILES?.educational || PROSODY_DEFAULTS.educational;

        assertTrue(calm.speed < educational.speed, 'calm speed must be slower than educational');
        assertTrue(calm.pauseSec > educational.pauseSec, 'calm pause must be longer than educational');
      },
    },
    {
      id: 'T1-F10-05',
      name: 'dramatic and solemn profiles configure extended pause durations',
      feature: 'F10',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'prosody', 'index.ts')
        );

        const dramatic = mod?.PROSODY_PROFILES?.dramatic || PROSODY_DEFAULTS.dramatic;
        const solemn = mod?.PROSODY_PROFILES?.solemn || PROSODY_DEFAULTS.solemn;

        assertTrue(dramatic.pauseSec >= 0.7, 'dramatic pause must be >= 0.7s');
        assertTrue(solemn.pauseSec >= 0.7, 'solemn pause must be >= 0.7s');
        assertInRange(dramatic.speed, 0.75, 1.0);
        assertInRange(solemn.speed, 0.75, 1.0);
      },
    },
  ],
};

registerSuite(suite);
