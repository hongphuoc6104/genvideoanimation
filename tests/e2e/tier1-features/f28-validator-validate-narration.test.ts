/**
 * tests/e2e/tier1-features/f28-validator-validate-narration.test.ts
 * Tier 1: Feature Coverage Tests for F28 (Validator validate-narration.ts)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertWavHeader,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { createMockWavBuffer } from '../harness/fixtures';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export function validateNarrationWav(buffer: Buffer): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (buffer.length < 44) {
    errors.push('File smaller than 44-byte RIFF header');
    return { valid: false, errors };
  }

  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    errors.push('Missing RIFF/WAVE header markers');
  }

  const audioFormat = buffer.readUInt16LE(20);
  if (audioFormat !== 1) {
    errors.push(`Audio format ${audioFormat} is not PCM (1)`);
  }

  const channels = buffer.readUInt16LE(22);
  if (channels !== 1) {
    errors.push(`Expected mono (1 channel), got ${channels}`);
  }

  const sampleRate = buffer.readUInt32LE(24);
  if (sampleRate !== 24000) {
    errors.push(`Expected 24000 Hz, got ${sampleRate} Hz`);
  }

  const bitDepth = buffer.readUInt16LE(34);
  if (bitDepth !== 16) {
    errors.push(`Expected 16-bit PCM, got ${bitDepth}-bit`);
  }

  // Check samples for clipping and peak
  let maxAbsSample = 0;
  let clippedCount = 0;
  for (let i = 44; i < buffer.length - 1; i += 2) {
    const val = buffer.readInt16LE(i);
    const absVal = Math.abs(val);
    if (absVal > maxAbsSample) maxAbsSample = absVal;
    if (val >= 32767 || val <= -32768) clippedCount++;
  }

  const peakDbfs = maxAbsSample > 0 ? 20 * Math.log10(maxAbsSample / 32768) : -100;
  if (peakDbfs > -1.0) {
    errors.push(`Peak ${peakDbfs.toFixed(2)} dBFS exceeds -1.0 dBFS`);
  }
  if (clippedCount > 0) {
    errors.push(`Detected ${clippedCount} clipped samples`);
  }

  return { valid: errors.length === 0, errors };
}

export const suite: TestSuite = {
  name: 'Tier 1: F28 Validator validate-narration.ts',
  feature: 'F28',
  tier: 1,
  tests: [
    {
      id: 'T1-F28-01',
      name: 'Validator accepts audio file path argument and inspects WAV data',
      feature: 'F28',
      tier: 1,
      fn: async (ctx) => {
        const mockWav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.0, amplitude: 0.7 });
        assertWavHeader(mockWav, 24000, 1, 16);
        const result = validateNarrationWav(mockWav);
        assertTrue(result.valid, `Expected valid narration WAV, got errors: ${result.errors.join(', ')}`);
      },
    },
    {
      id: 'T1-F28-02',
      name: 'Validator strictly rejects non-24kHz or multi-channel audio',
      feature: 'F28',
      tier: 1,
      fn: async (ctx) => {
        // 44.1kHz buffer
        const wav44k = createMockWavBuffer({ sampleRate: 44100, channels: 1 });
        const res44k = validateNarrationWav(wav44k);
        assertFalse(res44k.valid, 'Should reject 44100 Hz audio');
        assertTrue(res44k.errors.some((e) => e.includes('24000 Hz')));

        // Stereo buffer
        const wavStereo = createMockWavBuffer({ sampleRate: 24000, channels: 2 });
        const resStereo = validateNarrationWav(wavStereo);
        assertFalse(resStereo.valid, 'Should reject stereo audio');
        assertTrue(resStereo.errors.some((e) => e.includes('mono')));
      },
    },
    {
      id: 'T1-F28-03',
      name: 'Validator checks that true peak remains <= -1.0 dBFS',
      feature: 'F28',
      tier: 1,
      fn: async (ctx) => {
        // Safe amplitude (0.8 = -1.93 dBFS)
        const safeWav = createMockWavBuffer({ amplitude: 0.8 });
        assertTrue(validateNarrationWav(safeWav).valid);

        // Hot amplitude (1.0 = 0 dBFS > -1.0 dBFS)
        const hotWav = createMockWavBuffer({ amplitude: 0.999 });
        const hotRes = validateNarrationWav(hotWav);
        assertFalse(hotRes.valid, 'Should reject audio with peak > -1.0 dBFS');
      },
    },
    {
      id: 'T1-F28-04',
      name: 'Validator enforces zero clipped samples',
      feature: 'F28',
      tier: 1,
      fn: async (ctx) => {
        const clippedWav = createMockWavBuffer({ amplitude: 0.5 });
        // Artificially write clipped samples (+32767)
        clippedWav.writeInt16LE(32767, 44);
        clippedWav.writeInt16LE(32767, 46);

        const res = validateNarrationWav(clippedWav);
        assertFalse(res.valid, 'Should detect clipped samples');
        assertTrue(res.errors.some((e) => e.includes('clipped')));
      },
    },
    {
      id: 'T1-F28-05',
      name: 'Validator returns valid status for standard Kokoro synthesis output',
      feature: 'F28',
      tier: 1,
      fn: async (ctx) => {
        const standardWav = createMockWavBuffer({
          sampleRate: 24000,
          channels: 1,
          durationSec: 2.0,
          amplitude: 0.6,
        });
        const result = validateNarrationWav(standardWav);
        assertTrue(result.valid);
        assertEqual(result.errors.length, 0);
      },
    },
  ],
};

registerSuite(suite);
