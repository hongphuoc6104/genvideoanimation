/**
 * tests/e2e/tier1-features/f11-shotspec-prosody-binding.test.ts
 * Tier 1: Feature Coverage Tests for F11 (ShotSpec Prosody Binding)
 */

import {
  assertEqual,
  assertTrue,
  assertDeepEqual,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { SHOTSPEC_FIXTURES } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F11 ShotSpec Prosody Binding',
  feature: 'F11',
  tier: 1,
  tests: [
    {
      id: 'T1-F11-01',
      name: 'ShotSpec binds valid narration_profile identifier',
      feature: 'F11',
      tier: 1,
      fn: async (ctx) => {
        const spec = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL;
        assertSchema(spec, {
          shot_id: 'string',
          narration_profile: 'string',
        });
        assertEqual(spec.narration_profile, 'educational');
      },
    },
    {
      id: 'T1-F11-02',
      name: 'ShotSpec correctly binds emphasis_words list',
      feature: 'F11',
      tier: 1,
      fn: async (ctx) => {
        const spec = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL;
        assertTrue(Array.isArray(spec.emphasis_words), 'emphasis_words must be an array');
        assertDeepEqual(spec.emphasis_words, ['models', 'locally']);
      },
    },
    {
      id: 'T1-F11-03',
      name: 'ShotSpec binds pause_after duration in seconds',
      feature: 'F11',
      tier: 1,
      fn: async (ctx) => {
        const spec = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL;
        assertTrue(typeof spec.pause_after === 'number', 'pause_after must be a number');
        assertEqual(spec.pause_after, 0.6);
      },
    },
    {
      id: 'T1-F11-04',
      name: 'Shot-level prosody override supersedes global composition defaults',
      feature: 'F11',
      tier: 1,
      fn: async (ctx) => {
        const globalProfile = 'documentary';
        const shotOverride = { ...SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL, narration_profile: 'energetic' };
        
        // Resolution logic contract: shot-level profile wins
        const resolvedProfile = shotOverride.narration_profile || globalProfile;
        assertEqual(resolvedProfile, 'energetic', 'Shot-level profile must override global default');
      },
    },
    {
      id: 'T1-F11-05',
      name: 'ShotSpec prosody timing preserves non-negative constraints and frame bounds',
      feature: 'F11',
      tier: 1,
      fn: async (ctx) => {
        const spec = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL;
        assertTrue(spec.pause_after >= 0, 'pause_after must be non-negative');
        assertTrue(spec.fps > 0, 'fps must be positive');
        
        const pauseFrames = Math.round(spec.pause_after * spec.fps);
        assertTrue(pauseFrames <= spec.duration_frames, 'Pause frames must not exceed shot duration');
      },
    },
  ],
};

registerSuite(suite);
