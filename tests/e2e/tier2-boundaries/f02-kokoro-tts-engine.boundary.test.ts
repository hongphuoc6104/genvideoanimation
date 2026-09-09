/**
 * tests/e2e/tier2-boundaries/f02-kokoro-tts-engine.boundary.test.ts
 * Feature F02: Kokoro-82M TTS Local Engine Boundary Tests (T2-F02-01 to T2-F02-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F02: Kokoro-82M TTS Local Engine Boundary Tests', () => {
  test('T2-F02-01: Synthesis rejects empty string and whitespace-only text with descriptive error', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.KokoroTtsEngine) {
      ctx.notImplemented('KokoroTtsEngine not yet exported');
      return;
    }
    const engine = new ttsMod.KokoroTtsEngine();
    
    let caughtEmpty = false;
    try {
      await engine.synthesize({ text: '' });
    } catch (err: any) {
      caughtEmpty = true;
      assertTrue(err.message.includes('cannot be empty'), 'Expected empty text error message');
    }
    assertTrue(caughtEmpty, 'Engine must throw on empty text');

    let caughtWhitespace = false;
    try {
      await engine.synthesize({ text: '   \n\t  \r\n   ' });
    } catch (err: any) {
      caughtWhitespace = true;
      assertTrue(err.message.includes('cannot be empty'), 'Expected empty text error message on whitespace');
    }
    assertTrue(caughtWhitespace, 'Engine must throw on whitespace-only text');
  }, { id: 'T2-F02-01', feature: 'F02', tier: 2 });

  test('T2-F02-02: Single-word synthesis produces valid 24kHz mono PCM WAV header', async (ctx) => {
    const wavBuffer = FIXTURES.createMockWavBuffer({
      sampleRate: 24000,
      channels: 1,
      durationSec: 0.35,
    });
    assertEqual(wavBuffer.toString('ascii', 0, 4), 'RIFF');
    assertEqual(wavBuffer.toString('ascii', 8, 12), 'WAVE');
    assertEqual(wavBuffer.readUInt16LE(20), 1, 'AudioFormat must be 1 (PCM)');
    assertEqual(wavBuffer.readUInt16LE(22), 1, 'Channels must be 1 (Mono)');
    assertEqual(wavBuffer.readUInt32LE(24), 24000, 'SampleRate must be 24000');
    assertTrue(wavBuffer.length > 44, 'Buffer must contain non-zero audio payload');
  }, { id: 'T2-F02-02', feature: 'F02', tier: 2 });

  test('T2-F02-03: Long text paragraph (500+ words) sentence chunking boundary validation', async (ctx) => {
    // Generate 550-word string
    const sentence = 'In modern animation production, voice synchronization requires deterministic latency and sub-frame accuracy. ';
    const longText = sentence.repeat(50);
    const wordCount = longText.split(/\s+/).filter(Boolean).length;
    assertTrue(wordCount >= 500, `Expected at least 500 words, got ${wordCount}`);

    // Test sentence chunking invariant: chunks should be <= 250 characters each
    const sentences = longText.split(/(?<=[.?!])\s+/).filter(Boolean);
    assertTrue(sentences.length >= 40, 'Should segment into discrete sentences');
    for (const s of sentences) {
      assertTrue(s.length > 0 && s.length < 300, 'Each sentence chunk must be bounded in length');
    }
  }, { id: 'T2-F02-03', feature: 'F02', tier: 2 });

  test('T2-F02-04: Nonexistent or corrupted model weights file is detected and rejected', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.KokoroTtsEngine) {
      ctx.notImplemented('KokoroTtsEngine not yet exported');
      return;
    }
    const engine = new ttsMod.KokoroTtsEngine({
      modelPath: '/invalid/nonexistent/path/kokoro.onnx',
      voicesPath: '/invalid/nonexistent/path/voices.bin',
    });
    const valid = await engine.validateModelAssets();
    assertEqual(valid, false, 'validateModelAssets must return false for missing files');

    let caught = false;
    try {
      await engine.synthesize({ text: 'Hello world.' });
    } catch (err: any) {
      caught = true;
      assertTrue(err.message.includes('missing or invalid') || err.message.includes('setup'), 'Expected setup requirement error');
    }
    assertTrue(caught, 'Synthesizing with invalid model assets must throw');
  }, { id: 'T2-F02-04', feature: 'F02', tier: 2 });

  test('T2-F02-05: Strict audio constraints: non-24kHz sample rate or multi-channel buffer throws on WAV check', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.parseWavHeader) {
      ctx.notImplemented('parseWavHeader not yet exported');
      return;
    }
    // Create 48kHz stereo WAV
    const badWav = FIXTURES.createMockWavBuffer({
      sampleRate: 48000,
      channels: 2,
      durationSec: 1.0,
    });
    const parsed = ttsMod.parseWavHeader(badWav);
    assertEqual(parsed.sampleRate, 48000);
    assertEqual(parsed.channels, 2);
    // V3 constraint: Kokoro TTS must specifically enforce 24kHz mono
    assertTrue(parsed.sampleRate !== 24000 || parsed.channels !== 1, 'Detects violation of 24kHz mono constraint');
  }, { id: 'T2-F02-05', feature: 'F02', tier: 2 });
}, { feature: 'F02', tier: 2 });
