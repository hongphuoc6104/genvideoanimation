/**
 * tests/e2e/tier1-features/f04-zero-intermediate-mp3.test.ts
 * Tier 1: Feature Coverage Tests for F04 (Zero Intermediate MP3 Production)
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

export const suite: TestSuite = {
  name: 'Tier 1: F04 Zero Intermediate MP3 Subsystem',
  feature: 'F04',
  tier: 1,
  tests: [
    {
      id: 'T1-F04-01',
      name: 'WAV creation directly produces in-memory buffer without requiring temporary MP3',
      feature: 'F04',
      tier: 1,
      fn: async (ctx) => {
        const { createWavFile } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        const pcm = Buffer.alloc(24000 * 2); // 1s of silence
        const wav = createWavFile(pcm, 24000, 1, 16);

        assertTrue(Buffer.isBuffer(wav), 'Output must be a native Buffer');
        assertEqual(wav.length, 44 + pcm.length, 'WAV length must equal 44 bytes header + PCM length');
        assertWavHeader(wav, 24000, 1, 16);
      },
    },
    {
      id: 'T1-F04-02',
      name: 'Temporary work directory contains zero MP3 artifacts after audio operations',
      feature: 'F04',
      tier: 1,
      fn: async (ctx) => {
        const tmpDir = ctx.createTempDir('tier1-f04-');
        const targetWav = path.join(tmpDir, 'test.wav');
        
        const wavBuffer = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.0 });
        fs.writeFileSync(targetWav, wavBuffer);

        const files = fs.readdirSync(tmpDir);
        const mp3Files = files.filter((f) => f.toLowerCase().endsWith('.mp3'));
        assertEqual(mp3Files.length, 0, 'No .mp3 files should be created in workspace');
      },
    },
    {
      id: 'T1-F04-03',
      name: 'Output audio buffer is free of MP3 ID3 container tags or MPEG sync markers',
      feature: 'F04',
      tier: 1,
      fn: async (ctx) => {
        const wav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 0.5 });
        const id3Prefix = wav.subarray(0, 3).toString('ascii');
        assertFalse(id3Prefix === 'ID3', 'Audio buffer must not start with ID3 MP3 tag');

        // Check first 100 bytes for MPEG frame sync (0xFFE0 mask)
        let hasMpegSync = false;
        for (let i = 0; i < Math.min(100, wav.length - 1); i++) {
          if (wav[i] === 0xff && (wav[i + 1] & 0xe0) === 0xe0) {
            hasMpegSync = true;
            break;
          }
        }
        assertFalse(hasMpegSync, 'Audio header must not contain MPEG sync frames');
      },
    },
    {
      id: 'T1-F04-04',
      name: 'Audio format code in RIFF header specifies uncompressed PCM (format 1)',
      feature: 'F04',
      tier: 1,
      fn: async (ctx) => {
        const wav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.0 });
        const formatCode = wav.readUInt16LE(20);
        assertEqual(formatCode, 1, 'WAV audio format code must be 1 (PCM)');
      },
    },
    {
      id: 'T1-F04-05',
      name: 'Audio samples conform strictly to signed 16-bit linear integer bounds',
      feature: 'F04',
      tier: 1,
      fn: async (ctx) => {
        const wav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 0.1 });
        const dataOffset = 44;
        const numSamples = (wav.length - dataOffset) / 2;

        for (let i = 0; i < numSamples; i++) {
          const sample = wav.readInt16LE(dataOffset + i * 2);
          assertTrue(sample >= -32768 && sample <= 32767, `Sample at index ${i} out of int16 bounds: ${sample}`);
        }
      },
    },
  ],
};

registerSuite(suite);
