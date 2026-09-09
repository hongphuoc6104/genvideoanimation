/**
 * tests/e2e/tier2-boundaries/f29-validator-validate-alignment.boundary.test.ts
 * Feature F29: Validator validate-alignment.ts Boundary Tests (T2-F29-01 to T2-F29-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F29: Validator validate-alignment.ts Boundary Tests', () => {
  const validateAlignmentData = (words: any[], expectedTranscriptLength?: number): { valid: boolean; reason?: string } => {
    if (!Array.isArray(words) || words.length === 0) return { valid: false, reason: 'Words list is empty' };
    if (expectedTranscriptLength !== undefined && words.length !== expectedTranscriptLength) {
      return { valid: false, reason: 'Token count mismatch against transcript' };
    }
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.start < 0) return { valid: false, reason: `Negative start timestamp at word ${i}` };
      if (w.end <= w.start) return { valid: false, reason: `Non-positive duration at word ${i}` };
      if (i > 0) {
        const prev = words[i - 1];
        if (w.start < prev.start) return { valid: false, reason: `Non-monotonic start time at word ${i}` };
        if (w.start < prev.end - 1e-4) return { valid: false, reason: `Overlap detected between word ${i - 1} and ${i}` };
      }
    }
    return { valid: true };
  };

  test('T2-F29-01: Non-monotonic start times fails alignment validation', async (ctx) => {
    const corruptWords = [
      { id: 'w0', cleanWord: 'hello', start: 1.0, end: 1.5 },
      { id: 'w1', cleanWord: 'world', start: 0.9, end: 1.4 },
    ];
    const res = validateAlignmentData(corruptWords);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('Non-monotonic'));
  }, { id: 'T2-F29-01', feature: 'F29', tier: 2 });

  test('T2-F29-02: Overlapping intervals fails alignment validation', async (ctx) => {
    const overlappingWords = [
      { id: 'w0', cleanWord: 'hello', start: 1.0, end: 1.5 },
      { id: 'w1', cleanWord: 'world', start: 1.4, end: 1.9 },
    ];
    const res = validateAlignmentData(overlappingWords);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('Overlap'));
  }, { id: 'T2-F29-02', feature: 'F29', tier: 2 });

  test('T2-F29-03: Negative timestamp fails alignment validation', async (ctx) => {
    const negativeWords = [
      { id: 'w0', cleanWord: 'hello', start: -0.1, end: 0.5 },
    ];
    const res = validateAlignmentData(negativeWords);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('Negative'));
  }, { id: 'T2-F29-03', feature: 'F29', tier: 2 });

  test('T2-F29-04: Missing words compared to transcript token count fails validation', async (ctx) => {
    const words = FIXTURES.WORDS.slice(0, 5); // truncated
    const res = validateAlignmentData(words, FIXTURES.WORDS.length);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('Token count mismatch'));
  }, { id: 'T2-F29-04', feature: 'F29', tier: 2 });

  test('T2-F29-05: Valid monotonically increasing words pass alignment validation cleanly', async (ctx) => {
    const words = FIXTURES.WORDS;
    const res = validateAlignmentData(words, FIXTURES.WORDS.length);
    assertEqual(res.valid, true);
  }, { id: 'T2-F29-05', feature: 'F29', tier: 2 });
}, { feature: 'F29', tier: 2 });
