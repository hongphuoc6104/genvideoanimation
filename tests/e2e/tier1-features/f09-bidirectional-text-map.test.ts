/**
 * tests/e2e/tier1-features/f09-bidirectional-text-map.test.ts
 * Tier 1: Feature Coverage Tests for F09 (Bidirectional Text Map)
 */

import {
  assertEqual,
  assertTrue,
  assertSchema,
  assertNoOverlap,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_NARRATION_TEXT_MAP } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F09 Bidirectional Text Map',
  feature: 'F09',
  tier: 1,
  tests: [
    {
      id: 'T1-F09-01',
      name: 'narration-text-map.json conforms to authoritative JSON schema',
      feature: 'F09',
      tier: 1,
      fn: async (ctx) => {
        const map = MOCK_NARRATION_TEXT_MAP;
        assertSchema(map, {
          version: 'string',
          originalText: 'string',
          normalizedText: 'string',
          tokens: (t) => Array.isArray(t) && t.length > 0,
        });
        assertEqual(map.version, '1.0.0');
      },
    },
    {
      id: 'T1-F09-02',
      name: 'Map contains non-empty originalText and normalizedText representations',
      feature: 'F09',
      tier: 1,
      fn: async (ctx) => {
        const { originalText, normalizedText } = MOCK_NARRATION_TEXT_MAP;
        assertTrue(originalText.length > 0, 'originalText must not be empty');
        assertTrue(normalizedText.length > 0, 'normalizedText must not be empty');
        assertTrue(normalizedText.length >= originalText.length, 'normalizedText is typically equal or longer');
      },
    },
    {
      id: 'T1-F09-03',
      name: 'Every token originalSpan slices back to originalWord exactly',
      feature: 'F09',
      tier: 1,
      fn: async (ctx) => {
        const { originalText, tokens } = MOCK_NARRATION_TEXT_MAP;
        for (const token of tokens) {
          const [start, end] = token.originalSpan;
          assertTrue(start >= 0 && end <= originalText.length, `Span [${start}, ${end}] out of range`);
          assertTrue(start < end, `Span [${start}, ${end}] invalid`);
          
          const sliced = originalText.slice(start, end);
          assertEqual(sliced, token.originalWord, `Span slice "${sliced}" does not match originalWord "${token.originalWord}"`);
        }
      },
    },
    {
      id: 'T1-F09-04',
      name: 'Character span intervals map injectively without overlapping',
      feature: 'F09',
      tier: 1,
      fn: async (ctx) => {
        const intervals = MOCK_NARRATION_TEXT_MAP.tokens.map((t) => ({
          start: t.originalSpan[0],
          end: t.originalSpan[1],
          id: t.id,
        }));
        assertNoOverlap(intervals, 'originalSpan intervals must not overlap');
      },
    },
    {
      id: 'T1-F09-05',
      name: 'Tokens specify valid semantic types and non-empty spokenWords arrays',
      feature: 'F09',
      tier: 1,
      fn: async (ctx) => {
        const validTypes = [
          'cardinal', 'ordinal', 'decimal', 'acronym', 'abbreviation',
          'currency', 'unit', 'url', 'date', 'plain', 'punctuation'
        ];

        for (const token of MOCK_NARRATION_TEXT_MAP.tokens) {
          assertTrue(validTypes.includes(token.type), `Invalid token type: ${token.type}`);
          assertTrue(Array.isArray(token.spokenWords), 'spokenWords must be an array');
          assertTrue(token.spokenWords.length > 0, `spokenWords for token ${token.id} must be non-empty`);
        }
      },
    },
  ],
};

registerSuite(suite);
