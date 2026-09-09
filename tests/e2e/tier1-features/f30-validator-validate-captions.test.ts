/**
 * tests/e2e/tier1-features/f30-validator-validate-captions.test.ts
 * Tier 1: Feature Coverage Tests for F30 (Validator validate-captions.ts)
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_CAPTIONS_JSON } from '../harness/fixtures';

export function validateCaptions(manifest: typeof MOCK_CAPTIONS_JSON): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest || !Array.isArray(manifest.groups) || manifest.groups.length === 0) {
    errors.push('Captions manifest has no groups');
    return { valid: false, errors };
  }

  for (const group of manifest.groups) {
    if (group.lines.length < 1 || group.lines.length > 2) {
      errors.push(`Group ${group.id} has ${group.lines.length} lines (must be 1 or 2)`);
    }

    let groupChars = 0;
    for (const line of group.lines) {
      if (line.text.length > 42) {
        errors.push(`Group ${group.id} line exceeds 42 characters: "${line.text}" (${line.text.length} chars)`);
      }
      groupChars += line.text.length;
    }

    const duration = group.endTime - group.startTime;
    if (duration < 0.8 || duration > 7.0) {
      errors.push(`Group ${group.id} duration (${duration}s) out of bounds [0.8s, 7.0s]`);
    }

    const cps = duration > 0 ? groupChars / duration : 0;
    if (cps > 21.0) {
      errors.push(`Group ${group.id} CPS (${cps.toFixed(1)}) exceeds 21.0 limit`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export const suite: TestSuite = {
  name: 'Tier 1: F30 Validator validate-captions.ts',
  feature: 'F30',
  tier: 1,
  tests: [
    {
      id: 'T1-F30-01',
      name: 'Validator audits captions manifest structure and passes valid mock captions',
      feature: 'F30',
      tier: 1,
      fn: async (ctx) => {
        const res = validateCaptions(MOCK_CAPTIONS_JSON);
        assertTrue(res.valid, `Expected valid captions, got errors: ${res.errors.join(', ')}`);
        assertEqual(res.errors.length, 0);
      },
    },
    {
      id: 'T1-F30-02',
      name: 'Validator catches and rejects caption groups exceeding 2 lines',
      feature: 'F30',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        // groups[1] already has 2 lines. Pushing one more makes it 3 lines (> 2)
        invalidManifest.groups[1].lines.push({ text: 'Extra third line', words: [] });

        const res = validateCaptions(invalidManifest);
        assertFalse(res.valid, 'Should reject 3-line caption group');
        assertTrue(res.errors.some((e) => e.includes('lines (must be 1 or 2)')));
      },
    },
    {
      id: 'T1-F30-03',
      name: 'Validator catches and rejects lines exceeding 42 characters',
      feature: 'F30',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        invalidManifest.groups[0].lines[0].text = 'This is an extremely long subtitle line that definitely exceeds forty-two characters.';

        const res = validateCaptions(invalidManifest);
        assertFalse(res.valid, 'Should reject line > 42 chars');
        assertTrue(res.errors.some((e) => e.includes('exceeds 42 characters')));
      },
    },
    {
      id: 'T1-F30-04',
      name: 'Validator catches and rejects reading speed exceeding 21.0 CPS',
      feature: 'F30',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        // 40 characters in 0.9 seconds = 44.4 CPS (> 21.0)
        invalidManifest.groups[0].startTime = 0.0;
        invalidManifest.groups[0].endTime = 0.9;
        invalidManifest.groups[0].lines[0].text = 'A very rapid sentence with lots of words!';

        const res = validateCaptions(invalidManifest);
        assertFalse(res.valid, 'Should reject high CPS reading speed');
        assertTrue(res.errors.some((e) => e.includes('exceeds 21.0 limit')));
      },
    },
    {
      id: 'T1-F30-05',
      name: 'Validator catches group durations outside [0.8s, 7.0s] range',
      feature: 'F30',
      tier: 1,
      fn: async (ctx) => {
        const invalidManifest = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        // 0.4s duration (< 0.8s)
        invalidManifest.groups[0].startTime = 0.0;
        invalidManifest.groups[0].endTime = 0.4;

        const res = validateCaptions(invalidManifest);
        assertFalse(res.valid, 'Should reject duration < 0.8s');
        assertTrue(res.errors.some((e) => e.includes('out of bounds [0.8s, 7.0s]')));
      },
    },
  ],
};

registerSuite(suite);
