/**
 * tests/e2e/tier1-features/f13-word-timing-output.test.ts
 * Tier 1: Feature Coverage Tests for F13 (Word Timing Output Artifact)
 */

import {
  assertEqual,
  assertTrue,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_WORDS_JSON } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F13 Word Timing Output (words.json)',
  feature: 'F13',
  tier: 1,
  tests: [
    {
      id: 'T1-F13-01',
      name: 'words.json entries conform to authoritative WordTimings schema',
      feature: 'F13',
      tier: 1,
      fn: async (ctx) => {
        assertTrue(Array.isArray(MOCK_WORDS_JSON), 'words.json must be an array');
        for (const word of MOCK_WORDS_JSON) {
          assertSchema(word, {
            id: 'string',
            word: 'string',
            cleanWord: 'string',
            start: 'number',
            end: 'number',
            confidence: 'number',
            punctuation: 'string',
          });
        }
      },
    },
    {
      id: 'T1-F13-02',
      name: 'Every word entry possesses sequential ID conforming to ^w[0-9]+$',
      feature: 'F13',
      tier: 1,
      fn: async (ctx) => {
        const idRegex = /^w[0-9]+$/;
        for (let i = 0; i < MOCK_WORDS_JSON.length; i++) {
          const item = MOCK_WORDS_JSON[i];
          assertTrue(idRegex.test(item.id), `ID "${item.id}" must match pattern ^w[0-9]+$`);
          assertEqual(item.id, `w${i}`, `Word ID must be sequential: expected w${i}, got ${item.id}`);
        }
      },
    },
    {
      id: 'T1-F13-03',
      name: 'Timestamps are strictly non-negative (>= 0.0s)',
      feature: 'F13',
      tier: 1,
      fn: async (ctx) => {
        for (const item of MOCK_WORDS_JSON) {
          assertTrue(item.start >= 0.0, `start timestamp must be >= 0.0: ${item.start}`);
          assertTrue(item.end >= 0.0, `end timestamp must be >= 0.0: ${item.end}`);
        }
      },
    },
    {
      id: 'T1-F13-04',
      name: 'Duration positivity: end > start with minimum display duration >= 0.05s',
      feature: 'F13',
      tier: 1,
      fn: async (ctx) => {
        for (const item of MOCK_WORDS_JSON) {
          const duration = item.end - item.start;
          assertTrue(duration >= 0.05, `Word ${item.id} duration (${duration}s) must be >= 0.05s`);
        }
      },
    },
    {
      id: 'T1-F13-05',
      name: 'Punctuation marks are separated into punctuation field for clean phonetic lookup',
      feature: 'F13',
      tier: 1,
      fn: async (ctx) => {
        const commaWord = MOCK_WORDS_JSON.find((w) => w.word.includes(','));
        const periodWord = MOCK_WORDS_JSON.find((w) => w.word.includes('.'));

        assertTrue(commaWord !== undefined, 'Expected word with comma');
        assertTrue(periodWord !== undefined, 'Expected word with period');

        assertEqual(commaWord.punctuation, ',');
        assertEqual(periodWord.punctuation, '.');
        assertEqual(commaWord.cleanWord, 'twenty-six');
        assertEqual(periodWord.cleanWord, 'locally');
      },
    },
  ],
};

registerSuite(suite);
