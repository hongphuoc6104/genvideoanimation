/**
 * tests/e2e/tier1-features/f32-validator-validate-audio-mix.test.ts
 * Tier 1: Feature Coverage Tests for F32 (Validator validate-audio-mix.ts)
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_AUDIO_MANIFEST_JSON } from '../harness/fixtures';

export function validateAudioMix(manifest: typeof MOCK_AUDIO_MANIFEST_JSON): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const narrationDur = manifest.tracks.narration.duration;
  const outputDur = manifest.output.durationSec;
  if (Math.abs(narrationDur - outputDur) > 0.1) {
    errors.push(`Track duration mismatch: narration=${narrationDur}s, output=${outputDur}s (delta > 0.1s)`);
  }

  const attenuationDb = manifest.ducking.attenuationDb;
  if (attenuationDb > -10.0) {
    errors.push(`Ducking attenuation ${attenuationDb} dB is insufficient (must be <= -10.0 dB)`);
  }

  const peak = manifest.output.truePeakDbfs;
  if (peak > -1.0) {
    errors.push(`Output true peak ${peak} dBFS exceeds limit -1.0 dBFS`);
  }

  if (manifest.output.clippedSamples > 0) {
    errors.push(`Output contains ${manifest.output.clippedSamples} clipped samples`);
  }

  const lufs = manifest.output.lufs;
  if (lufs < -17.5 || lufs > -14.5) {
    errors.push(`Output loudness ${lufs} LUFS is outside broadcast spec [-17.5, -14.5]`);
  }

  return { valid: errors.length === 0, errors };
}

export const suite: TestSuite = {
  name: 'Tier 1: F32 Validator validate-audio-mix.ts',
  feature: 'F32',
  tier: 1,
  tests: [
    {
      id: 'T1-F32-01',
      name: 'Validator accepts audio manifest and passes standard compliant mix',
      feature: 'F32',
      tier: 1,
      fn: async (ctx) => {
        const res = validateAudioMix(MOCK_AUDIO_MANIFEST_JSON);
        assertTrue(res.valid, `Expected valid audio mix, got errors: ${res.errors.join(', ')}`);
        assertEqual(res.errors.length, 0);
      },
    },
    {
      id: 'T1-F32-02',
      name: 'Validator catches and rejects track duration desynchronization exceeding 0.1s',
      feature: 'F32',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_AUDIO_MANIFEST_JSON));
        invalidManifest.output.durationSec = 4.5; // Narration is 4.1s (delta 0.4s > 0.1s)

        const res = validateAudioMix(invalidManifest);
        assertFalse(res.valid, 'Should reject desynchronized duration');
        assertTrue(res.errors.some((e) => e.includes('delta > 0.1s')));
      },
    },
    {
      id: 'T1-F32-03',
      name: 'Validator catches and rejects ducking attenuation weaker than 10 dB',
      feature: 'F32',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_AUDIO_MANIFEST_JSON));
        invalidManifest.ducking.attenuationDb = -6.0; // Weak ducking (-6 dB > -10.0 dB)

        const res = validateAudioMix(invalidManifest);
        assertFalse(res.valid, 'Should reject weak ducking');
        assertTrue(res.errors.some((e) => e.includes('insufficient')));
      },
    },
    {
      id: 'T1-F32-04',
      name: 'Validator catches true peak limit violations or clipped samples',
      feature: 'F32',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_AUDIO_MANIFEST_JSON));
        invalidManifest.output.truePeakDbfs = -0.4; // Exceeds -1.0 dBFS ceiling
        invalidManifest.output.clippedSamples = 12;

        const res = validateAudioMix(invalidManifest);
        assertFalse(res.valid, 'Should reject peak and clipped samples');
        assertTrue(res.errors.some((e) => e.includes('exceeds limit -1.0 dBFS')));
        assertTrue(res.errors.some((e) => e.includes('clipped samples')));
      },
    },
    {
      id: 'T1-F32-05',
      name: 'Validator enforces EBU R128 integrated loudness compliance [-17.5, -14.5] LUFS',
      feature: 'F32',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_AUDIO_MANIFEST_JSON));
        invalidManifest.output.lufs = -20.5; // Too quiet

        const res = validateAudioMix(invalidManifest);
        assertFalse(res.valid, 'Should reject non-compliant loudness');
        assertTrue(res.errors.some((e) => e.includes('outside broadcast spec')));
      },
    },
  ],
};

registerSuite(suite);
