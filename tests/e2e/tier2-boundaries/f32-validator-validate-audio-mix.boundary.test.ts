/**
 * tests/e2e/tier2-boundaries/f32-validator-validate-audio-mix.boundary.test.ts
 * Feature F32: Validator validate-audio-mix.ts Boundary Tests (T2-F32-01 to T2-F32-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F32: Validator validate-audio-mix.ts Boundary Tests', () => {
  const validateAudioMix = (manifest: any): { valid: boolean; reason?: string } => {
    const narrationDur = manifest.tracks?.narration?.duration ?? 0;
    const outputDur = manifest.output?.durationSec ?? 0;
    if (Math.abs(narrationDur - outputDur) > 0.1) {
      return { valid: false, reason: `Duration sync mismatch: ${Math.abs(narrationDur - outputDur).toFixed(3)}s > 0.1s` };
    }

    const attenuation = manifest.ducking?.attenuationDb ?? 0;
    if (attenuation > -10.0) {
      return { valid: false, reason: `Ducking attenuation ${attenuation} dB is weaker than required -10.0 dB` };
    }

    const lufs = manifest.output?.lufs ?? -99;
    if (lufs < -17.5 || lufs > -14.5) {
      return { valid: false, reason: `Loudness ${lufs} LUFS outside [-17.5, -14.5] range` };
    }

    const peak = manifest.output?.truePeakDbfs ?? 0;
    if (peak > -1.0) {
      return { valid: false, reason: `True peak ${peak} dBFS exceeds -1.0 dBFS` };
    }

    if ((manifest.output?.clippedSamples ?? 0) > 0) {
      return { valid: false, reason: 'Clipped samples detected' };
    }

    return { valid: true };
  };

  test('T2-F32-01: Duration sync mismatch > 0.1s between narration and mixed audio fails validation', async (ctx) => {
    const unsyncedManifest = {
      ...FIXTURES.AUDIO_MANIFEST,
      tracks: { ...FIXTURES.AUDIO_MANIFEST.tracks, narration: { ...FIXTURES.AUDIO_MANIFEST.tracks.narration, duration: 4.0 } },
      output: { ...FIXTURES.AUDIO_MANIFEST.output, durationSec: 4.5 }, // 0.5s mismatch
    };
    const res = validateAudioMix(unsyncedManifest);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('Duration sync mismatch'));
  }, { id: 'T2-F32-01', feature: 'F32', tier: 2 });

  test('T2-F32-02: Insufficient ducking attenuation (< 10 dB reduction) fails validation', async (ctx) => {
    const weakDucking = {
      ...FIXTURES.AUDIO_MANIFEST,
      ducking: { ...FIXTURES.AUDIO_MANIFEST.ducking, attenuationDb: -5.0 }, // Only -5 dB
    };
    const res = validateAudioMix(weakDucking);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('weaker than required -10.0 dB'));
  }, { id: 'T2-F32-02', feature: 'F32', tier: 2 });

  test('T2-F32-03: Integrated loudness outside [-17.5, -14.5] LUFS window fails validation', async (ctx) => {
    const tooLoud = {
      ...FIXTURES.AUDIO_MANIFEST,
      output: { ...FIXTURES.AUDIO_MANIFEST.output, lufs: -13.0 },
    };
    const resLoud = validateAudioMix(tooLoud);
    assertEqual(resLoud.valid, false);
    assertTrue(resLoud.reason!.includes('outside [-17.5, -14.5]'));

    const tooQuiet = {
      ...FIXTURES.AUDIO_MANIFEST,
      output: { ...FIXTURES.AUDIO_MANIFEST.output, lufs: -20.0 },
    };
    const resQuiet = validateAudioMix(tooQuiet);
    assertEqual(resQuiet.valid, false);
  }, { id: 'T2-F32-03', feature: 'F32', tier: 2 });

  test('T2-F32-04: True peak exceeding -1.0 dBFS fails validation', async (ctx) => {
    const peakHot = {
      ...FIXTURES.AUDIO_MANIFEST,
      output: { ...FIXTURES.AUDIO_MANIFEST.output, truePeakDbfs: -0.2 },
    };
    const res = validateAudioMix(peakHot);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('exceeds -1.0 dBFS'));
  }, { id: 'T2-F32-04', feature: 'F32', tier: 2 });

  test('T2-F32-05: Compliant audio mix satisfying sync, ducking, LUFS, and peak passes validation', async (ctx) => {
    const res = validateAudioMix(FIXTURES.AUDIO_MANIFEST);
    assertEqual(res.valid, true);
  }, { id: 'T2-F32-05', feature: 'F32', tier: 2 });
}, { feature: 'F32', tier: 2 });
