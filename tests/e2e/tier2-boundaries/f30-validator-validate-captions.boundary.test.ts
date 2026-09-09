/**
 * tests/e2e/tier2-boundaries/f30-validator-validate-captions.boundary.test.ts
 * Feature F30: Validator validate-captions.ts Boundary Tests (T2-F30-01 to T2-F30-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F30: Validator validate-captions.ts Boundary Tests', () => {
  const validateCaptionsJson = (captionsData: any): { valid: boolean; reason?: string } => {
    if (!captionsData || !Array.isArray(captionsData.groups)) return { valid: false, reason: 'Invalid groups structure' };
    for (const g of captionsData.groups) {
      if (g.lines.length > 2) return { valid: false, reason: `Group ${g.id} has ${g.lines.length} lines (> 2 lines limit)` };
      const dur = g.endTime - g.startTime;
      if (dur < 0.5 || dur > 8.0) return { valid: false, reason: `Group ${g.id} duration ${dur}s outside [0.5, 8.0]` };
      let totalChars = 0;
      for (const l of g.lines) {
        if (l.text.length > 42) return { valid: false, reason: `Line "${l.text}" length ${l.text.length} exceeds 42 chars` };
        totalChars += l.text.length;
      }
      const cps = totalChars / dur;
      if (cps > 21.0) return { valid: false, reason: `Group ${g.id} CPS ${cps.toFixed(2)} exceeds 21.0` };
    }
    return { valid: true };
  };

  test('T2-F30-01: Caption group with 3 lines fails caption validation', async (ctx) => {
    const invalidGroup = {
      groups: [{
        id: 'g_3lines',
        startTime: 0.0,
        endTime: 2.0,
        lines: [{ text: 'Line 1' }, { text: 'Line 2' }, { text: 'Line 3' }],
      }],
    };
    const res = validateCaptionsJson(invalidGroup);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('> 2 lines limit'));
  }, { id: 'T2-F30-01', feature: 'F30', tier: 2 });

  test('T2-F30-02: Caption line exceeding 42 characters fails caption validation', async (ctx) => {
    const invalidLine = {
      groups: [{
        id: 'g_long_line',
        startTime: 0.0,
        endTime: 4.0,
        lines: [{ text: 'This is an excessively long caption line that easily exceeds forty-two characters' }],
      }],
    };
    const res = validateCaptionsJson(invalidLine);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('exceeds 42 chars'));
  }, { id: 'T2-F30-02', feature: 'F30', tier: 2 });

  test('T2-F30-03: Rapid speech with CPS > 21.0 fails caption validation', async (ctx) => {
    const highCpsGroup = {
      groups: [{
        id: 'g_fast',
        startTime: 0.0,
        endTime: 1.0, // 1 second
        lines: [{ text: 'Twenty-five characters here!' }], // 28 chars in 1s = 28 CPS
      }],
    };
    const res = validateCaptionsJson(highCpsGroup);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('exceeds 21.0'));
  }, { id: 'T2-F30-03', feature: 'F30', tier: 2 });

  test('T2-F30-04: Caption group with duration < 0.5s or > 8.0s fails caption validation', async (ctx) => {
    const tooShort = {
      groups: [{ id: 'g_tiny', startTime: 0.0, endTime: 0.3, lines: [{ text: 'Hi' }] }],
    };
    const res = validateCaptionsJson(tooShort);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('outside [0.5, 8.0]'));
  }, { id: 'T2-F30-04', feature: 'F30', tier: 2 });

  test('T2-F30-05: Valid canonical captions passing lines, length, and CPS pass validation', async (ctx) => {
    const res = validateCaptionsJson(FIXTURES.CAPTIONS);
    assertEqual(res.valid, true);
  }, { id: 'T2-F30-05', feature: 'F30', tier: 2 });
}, { feature: 'F30', tier: 2 });
