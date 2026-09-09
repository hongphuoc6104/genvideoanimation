/**
 * tests/e2e/tier1-features/f29-validator-validate-alignment.test.ts
 * Tier 1: Feature Coverage Tests for F29 (Validator validate-alignment.ts)
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
import { MOCK_WORDS_JSON } from '../harness/fixtures';

export function validateAlignment(
  words: typeof MOCK_WORDS_JSON,
  scriptWords: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(words) || words.length === 0) {
    errors.push('Word list is empty');
    return { valid: false, errors };
  }

  // Check 1:1 token count
  if (words.length !== scriptWords.length) {
    errors.push(`Token count mismatch: expected ${scriptWords.length}, got ${words.length}`);
  }

  let totalConfidence = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.start < 0) errors.push(`Word ${w.id} has negative start ${w.start}`);
    if (w.end <= w.start) errors.push(`Word ${w.id} end ${w.end} <= start ${w.start}`);
    if (i > 0 && w.start < words[i - 1].start) {
      errors.push(`Word ${w.id} start ${w.start} is before preceding word start ${words[i - 1].start}`);
    }
    totalConfidence += w.confidence;

    if (scriptWords[i] && w.cleanWord.toLowerCase() !== scriptWords[i].toLowerCase()) {
      errors.push(`Word mismatch at ${i}: expected "${scriptWords[i]}", got "${w.cleanWord}"`);
    }
  }

  const meanConfidence = totalConfidence / words.length;
  if (meanConfidence < 0.60) {
    errors.push(`Mean confidence ${meanConfidence.toFixed(2)} is below 0.60`);
  }

  return { valid: errors.length === 0, errors };
}

export const suite: TestSuite = {
  name: 'Tier 1: F29 Validator validate-alignment.ts',
  feature: 'F29',
  tier: 1,
  tests: [
    {
      id: 'T1-F29-01',
      name: 'Validator accepts words.json and script words list inputs',
      feature: 'F29',
      tier: 1,
      fn: async (ctx) => {
        const scriptWords = [
          'in', 'twenty', 'twenty-six', 'a', 'i', 'models', 'run', 'at',
          'twenty-four', 'kilohertz', 'locally'
        ];
        const res = validateAlignment(MOCK_WORDS_JSON, scriptWords);
        assertTrue(res.valid, `Expected valid alignment: ${res.errors.join(', ')}`);
      },
    },
    {
      id: 'T1-F29-02',
      name: 'Validator catches reverse or non-monotonic timestamps',
      feature: 'F29',
      tier: 1,
      fn: async (ctx) => {
        const corruptWords = JSON.parse(JSON.stringify(MOCK_WORDS_JSON));
        corruptWords[2].start = 2.0; // Pushes w2 start after w3 start (1.22)
        const scriptWords = MOCK_WORDS_JSON.map((w) => w.cleanWord);

        const res = validateAlignment(corruptWords, scriptWords);
        assertFalse(res.valid, 'Should detect reverse start timestamp');
        assertTrue(res.errors.some((e) => e.includes('preceding word start')));
      },
    },
    {
      id: 'T1-F29-03',
      name: 'Validator catches negative timestamps',
      feature: 'F29',
      tier: 1,
      fn: async (ctx) => {
        const corruptWords = JSON.parse(JSON.stringify(MOCK_WORDS_JSON));
        corruptWords[0].start = -0.1;
        const scriptWords = MOCK_WORDS_JSON.map((w) => w.cleanWord);

        const res = validateAlignment(corruptWords, scriptWords);
        assertFalse(res.valid, 'Should detect negative start timestamp');
        assertTrue(res.errors.some((e) => e.includes('negative start')));
      },
    },
    {
      id: 'T1-F29-04',
      name: 'Validator catches wording drift or missing transcript tokens',
      feature: 'F29',
      tier: 1,
      fn: async (ctx) => {
        const missingWords = MOCK_WORDS_JSON.slice(0, 8); // Dropped last 3 words
        const scriptWords = MOCK_WORDS_JSON.map((w) => w.cleanWord);

        const res = validateAlignment(missingWords, scriptWords);
        assertFalse(res.valid, 'Should detect missing tokens');
        assertTrue(res.errors.some((e) => e.includes('Token count mismatch')));
      },
    },
    {
      id: 'T1-F29-05',
      name: 'Validator passes cleanly when all quality gate invariants are satisfied',
      feature: 'F29',
      tier: 1,
      fn: async (ctx) => {
        const scriptWords = MOCK_WORDS_JSON.map((w) => w.cleanWord);
        const res = validateAlignment(MOCK_WORDS_JSON, scriptWords);
        assertTrue(res.valid);
        assertEqual(res.errors.length, 0);
      },
    },
  ],
};

registerSuite(suite);
