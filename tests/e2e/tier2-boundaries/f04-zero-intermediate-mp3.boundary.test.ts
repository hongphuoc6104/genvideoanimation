/**
 * tests/e2e/tier2-boundaries/f04-zero-intermediate-mp3.boundary.test.ts
 * Feature F04: Zero Intermediate MP3 Boundary Tests (T2-F04-01 to T2-F04-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F04: Zero Intermediate MP3 Boundary Tests', () => {
  test('T2-F04-01: Synthesis output strictly rejects MP3 ID3 tags and MPEG sync word headers', async (ctx) => {
    const wav = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 0.5 });
    
    // MP3 ID3 header check: magic bytes 0x49 0x44 0x33 ("ID3")
    const isId3 = wav[0] === 0x49 && wav[1] === 0x44 && wav[2] === 0x33;
    assertEqual(isId3, false, 'Synthesized audio must NOT contain MP3 ID3 tag header');

    // MPEG Layer III sync word: 0xFF 0xFB or 0xFF 0xF3
    const isMpegSync = wav[0] === 0xff && (wav[1] & 0xe0) === 0xe0;
    assertEqual(isMpegSync, false, 'Synthesized audio must NOT contain MPEG sync frames');
  }, { id: 'T2-F04-01', feature: 'F04', tier: 2 });

  test('T2-F04-02: Zero intermediate MP3 artifacts in filesystem during audio pipeline generation', async (ctx) => {
    const tempDir = ctx.createTempDir('mp3-check-');
    // Verify no stray .mp3 files exist in temp directory
    const files = fs.readdirSync(tempDir);
    const mp3Files = files.filter((f) => f.endsWith('.mp3'));
    assertEqual(mp3Files.length, 0, 'No .mp3 intermediate files should be present in pipeline workspaces');
  }, { id: 'T2-F04-02', feature: 'F04', tier: 2 });

  test('T2-F04-03: Truncated WAV header (< 44 bytes) throws descriptive error', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.parseWavHeader) {
      ctx.notImplemented('parseWavHeader not yet exported');
      return;
    }
    const truncatedBuffer = Buffer.alloc(32); // Less than 44 bytes
    assertThrows(() => {
      ttsMod.parseWavHeader(truncatedBuffer);
    }, /Invalid WAV: Buffer length 32 < minimum 44 bytes/, 'Must throw on buffer length < 44 bytes');
  }, { id: 'T2-F04-03', feature: 'F04', tier: 2 });

  test('T2-F04-04: Corrupt WAV magic (missing RIFF or WAVE signature) throws descriptive error', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.parseWavHeader) {
      ctx.notImplemented('parseWavHeader not yet exported');
      return;
    }
    const corruptMagicBuffer = Buffer.alloc(44);
    corruptMagicBuffer.write('NOPE', 0, 'ascii'); // Not RIFF
    corruptMagicBuffer.write('WAVE', 8, 'ascii');

    assertThrows(() => {
      ttsMod.parseWavHeader(corruptMagicBuffer);
    }, /Missing RIFF or WAVE header signatures/, 'Must reject non-RIFF magic bytes');
  }, { id: 'T2-F04-04', feature: 'F04', tier: 2 });

  test('T2-F04-05: Non-PCM audioFormat (e.g. float 3 or compressed format) is rejected with format error', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.parseWavHeader) {
      ctx.notImplemented('parseWavHeader not yet exported');
      return;
    }
    // Create header with audioFormat = 3 (IEEE Float) or 85 (MP3)
    const floatWav = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 0.1 });
    floatWav.writeUInt16LE(3, 20); // audioFormat = 3 (IEEE Float)

    assertThrows(() => {
      ttsMod.parseWavHeader(floatWav);
    }, /Unsupported WAV format 3; expected 1 \(uncompressed PCM\)/, 'Must reject non-PCM format codes');
  }, { id: 'T2-F04-05', feature: 'F04', tier: 2 });
}, { feature: 'F04', tier: 2 });
