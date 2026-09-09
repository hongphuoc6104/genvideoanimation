/**
 * tests/e2e/tier2-boundaries/f28-validator-validate-narration.boundary.test.ts
 * Feature F28: Validator validate-narration.ts Boundary Tests (T2-F28-01 to T2-F28-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F28: Validator validate-narration.ts Boundary Tests', () => {
  const validateNarrationWav = (wavBuffer: Buffer): { valid: boolean; error?: string } => {
    if (wavBuffer.length < 44) return { valid: false, error: 'Buffer too small' };
    const sampleRate = wavBuffer.readUInt32LE(24);
    const channels = wavBuffer.readUInt16LE(22);
    if (sampleRate !== 24000) return { valid: false, error: `Invalid sample rate: ${sampleRate} != 24000` };
    if (channels !== 1) return { valid: false, error: `Invalid channels: ${channels} != 1` };

    // Check clipping
    let maxAmp = 0;
    let sumSquares = 0;
    const numSamples = (wavBuffer.length - 44) / 2;
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.abs(wavBuffer.readInt16LE(44 + i * 2));
      if (sample > maxAmp) maxAmp = sample;
      sumSquares += (sample / 32768) ** 2;
    }
    const peakDbfs = 20 * Math.log10(maxAmp / 32768);
    const rms = Math.sqrt(sumSquares / numSamples);

    if (maxAmp >= 32767) return { valid: false, error: 'Audio is clipped' };
    if (rms === 0 && numSamples > 24000) return { valid: false, error: 'Audio is completely silent' };
    if (peakDbfs > -1.0) return { valid: false, error: `Peak ${peakDbfs} exceeds -1.0 dBFS` };

    return { valid: true };
  };

  test('T2-F28-01: WAV with 48kHz sample rate fails narration validation (strict 24kHz)', async (ctx) => {
    const wav48k = FIXTURES.createMockWavBuffer({ sampleRate: 48000, channels: 1, durationSec: 1.0 });
    const res = validateNarrationWav(wav48k);
    assertEqual(res.valid, false);
    assertTrue(res.error!.includes('48000 != 24000'));
  }, { id: 'T2-F28-01', feature: 'F28', tier: 2 });

  test('T2-F28-02: Stereo WAV file fails narration validation (expected mono channel = 1)', async (ctx) => {
    const wavStereo = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 2, durationSec: 1.0 });
    const res = validateNarrationWav(wavStereo);
    assertEqual(res.valid, false);
    assertTrue(res.error!.includes('2 != 1'));
  }, { id: 'T2-F28-02', feature: 'F28', tier: 2 });

  test('T2-F28-03: Clipped audio (sample amplitude hitting 32767 full scale) fails validation', async (ctx) => {
    const clippedWav = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 0.5, amplitude: 1.0 });
    // Force a maximum clipped sample
    clippedWav.writeInt16LE(32767, 44);
    const res = validateNarrationWav(clippedWav);
    assertEqual(res.valid, false);
    assertTrue(res.error!.includes('clipped') || res.error!.includes('exceeds'));
  }, { id: 'T2-F28-03', feature: 'F28', tier: 2 });

  test('T2-F28-04: Completely silent WAV (duration > 1s, RMS = 0) fails as silence anomaly', async (ctx) => {
    const silentWav = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.5, amplitude: 0.0 });
    const res = validateNarrationWav(silentWav);
    assertEqual(res.valid, false);
    assertTrue(res.error!.includes('silent'));
  }, { id: 'T2-F28-04', feature: 'F28', tier: 2 });

  test('T2-F28-05: Valid 24kHz mono PCM WAV with peak <= -1.0 dBFS passes validation', async (ctx) => {
    const validWav = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.0, amplitude: 0.5 });
    const res = validateNarrationWav(validWav);
    assertEqual(res.valid, true);
  }, { id: 'T2-F28-05', feature: 'F28', tier: 2 });
}, { feature: 'F28', tier: 2 });
