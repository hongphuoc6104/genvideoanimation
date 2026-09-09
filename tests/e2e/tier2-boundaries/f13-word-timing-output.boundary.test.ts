/**
 * tests/e2e/tier2-boundaries/f13-word-timing-output.boundary.test.ts
 * Feature F13: Word Timing Output Boundary Tests (T2-F13-01 to T2-F13-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F13: Word Timing Output Boundary Tests', () => {
  test('T2-F13-01: Schema boundary validation for word timing items in words.json', async (ctx) => {
    const words = FIXTURES.WORDS;
    assertTrue(words.length > 0, 'words.json must contain words');
    for (const w of words) {
      assertSchema(w, {
        id: 'string',
        word: 'string',
        cleanWord: 'string',
        start: 'number',
        end: 'number',
        confidence: 'number',
      });
    }
  }, { id: 'T2-F13-01', feature: 'F13', tier: 2 });

  test('T2-F13-02: Minimum word duration constraint: duration >= 0.03s (at least 1 video frame @ 30fps)', async (ctx) => {
    const words = FIXTURES.WORDS;
    for (const w of words) {
      const duration = w.end - w.start;
      assertTrue(duration >= 0.03, `Word "${w.word}" duration ${duration}s must be >= 0.03s`);
    }
  }, { id: 'T2-F13-02', feature: 'F13', tier: 2 });

  test('T2-F13-03: Confidence score boundary: strictly bounded in [0.0, 1.0]', async (ctx) => {
    const words = FIXTURES.WORDS;
    for (const w of words) {
      assertTrue(w.confidence >= 0.0 && w.confidence <= 1.0, `Word "${w.word}" confidence out of bounds: ${w.confidence}`);
    }
  }, { id: 'T2-F13-03', feature: 'F13', tier: 2 });

  test('T2-F13-04: Non-negative timestamps and end > start invariant', async (ctx) => {
    const words = FIXTURES.WORDS;
    for (const w of words) {
      assertTrue(w.start >= 0.0, `Word "${w.word}" start ${w.start} must be non-negative`);
      assertTrue(w.end > w.start, `Word "${w.word}" end ${w.end} must be strictly greater than start ${w.start}`);
    }
  }, { id: 'T2-F13-04', feature: 'F13', tier: 2 });

  test('T2-F13-05: Punctuation stripping: cleanWord contains no trailing punctuation', async (ctx) => {
    const words = FIXTURES.WORDS;
    const punctRegex = /[.,!?;:"'—]$/;
    for (const w of words) {
      assertEqual(punctRegex.test(w.cleanWord), false, `cleanWord "${w.cleanWord}" must not contain trailing punctuation`);
    }
  }, { id: 'T2-F13-05', feature: 'F13', tier: 2 });
}, { feature: 'F13', tier: 2 });
