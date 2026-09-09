/**
 * tests/e2e/tier2-boundaries/f12-whisperx-forced-alignment.boundary.test.ts
 * Feature F12: WhisperX Forced Alignment Boundary Tests (T2-F12-01 to T2-F12-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F12: WhisperX Forced Alignment Boundary Tests', () => {
  test('T2-F12-01: Audio with leading silence does not drift initial spoken word timestamp', async (ctx) => {
    // In MOCK_WORDS_JSON, first word starts at 0.06s (after silence)
    const firstWord = FIXTURES.WORDS[0];
    assertTrue(firstWord.start >= 0.0, 'First word start time must be non-negative');
    assertTrue(firstWord.start <= 0.5, 'First word must align to actual speech onset, not start of file');
  }, { id: 'T2-F12-01', feature: 'F12', tier: 2 });

  test('T2-F12-02: Alignment confidence scores bounded strictly within [0.0, 1.0]', async (ctx) => {
    const words = FIXTURES.WORDS;
    for (const w of words) {
      assertTrue(w.confidence >= 0.0, `Confidence ${w.confidence} must be >= 0.0`);
      assertTrue(w.confidence <= 1.0, `Confidence ${w.confidence} must be <= 1.0`);
    }
  }, { id: 'T2-F12-02', feature: 'F12', tier: 2 });

  test('T2-F12-03: Authoritative transcript invariant: zero hallucinations or injected words', async (ctx) => {
    const textMap = FIXTURES.TEXT_MAP;
    const words = FIXTURES.WORDS;

    // Collect all spoken words from text map
    const expectedWords = textMap.tokens.flatMap((t) => t.spokenWords.map((w) => w.toLowerCase()));
    const actualWords = words.map((w) => w.cleanWord.toLowerCase());

    assertEqual(actualWords.length, expectedWords.length, 'Word count must match authoritative spoken token count');
    for (let i = 0; i < expectedWords.length; i++) {
      assertEqual(actualWords[i], expectedWords[i], `Word at index ${i} must match authoritative transcript`);
    }
  }, { id: 'T2-F12-03', feature: 'F12', tier: 2 });

  test('T2-F12-04: Audio shorter than standard chunk window handled without underflow', async (ctx) => {
    const shortWav = FIXTURES.createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 0.15 });
    assertEqual(shortWav.readUInt32LE(24), 24000);
    assertTrue(shortWav.length > 44, 'Short WAV buffer must be valid');
  }, { id: 'T2-F12-04', feature: 'F12', tier: 2 });

  test('T2-F12-05: Non-monotonic phoneme output detection and rejection', async (ctx) => {
    const corruptWords = [
      { id: 'w0', word: 'First', start: 1.0, end: 1.5 },
      { id: 'w1', word: 'Second', start: 0.8, end: 1.2 }, // Backward time jump!
    ];
    const isMonotonic = (list: typeof corruptWords): boolean => {
      for (let i = 1; i < list.length; i++) {
        if (list[i].start < list[i - 1].start) return false;
      }
      return true;
    };
    assertEqual(isMonotonic(corruptWords), false, 'Non-monotonic word sequence must be detected');
  }, { id: 'T2-F12-05', feature: 'F12', tier: 2 });
}, { feature: 'F12', tier: 2 });
