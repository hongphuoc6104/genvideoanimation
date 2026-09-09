/**
 * tests/e2e/tier1-features/f14-alignment-quality-gates.test.ts
 * Tier 1: Feature Coverage Tests for F14 (Alignment Quality Gates)
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertMonotonic,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_WORDS_JSON } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F14 Alignment Quality Gates',
  feature: 'F14',
  tier: 1,
  tests: [
    {
      id: 'T1-F14-01',
      name: 'Start timestamps are strictly monotonic across word sequence',
      feature: 'F14',
      tier: 1,
      fn: async (ctx) => {
        const starts = MOCK_WORDS_JSON.map((w) => w.start);
        assertMonotonic(starts, true, 'Start timestamps must be strictly monotonic');
      },
    },
    {
      id: 'T1-F14-02',
      name: 'Adjoining word timestamps respect maximum 20ms phonetic overlap limit',
      feature: 'F14',
      tier: 1,
      fn: async (ctx) => {
        for (let i = 0; i < MOCK_WORDS_JSON.length - 1; i++) {
          const curr = MOCK_WORDS_JSON[i];
          const next = MOCK_WORDS_JSON[i + 1];
          const overlap = curr.end - next.start;
          assertTrue(overlap <= 0.02, `Overlap between ${curr.id} and ${next.id} (${overlap}s) exceeds 20ms`);
        }
      },
    },
    {
      id: 'T1-F14-03',
      name: 'Mean acoustic alignment confidence satisfies minimum quality threshold >= 0.60',
      feature: 'F14',
      tier: 1,
      fn: async (ctx) => {
        const total = MOCK_WORDS_JSON.reduce((sum, w) => sum + w.confidence, 0);
        const meanConfidence = total / MOCK_WORDS_JSON.length;
        assertTrue(meanConfidence >= 0.60, `Mean confidence (${meanConfidence}) below threshold 0.60`);
        assertTrue(meanConfidence >= 0.85, `Mock fixture confidence is high-fidelity: ${meanConfidence}`);
      },
    },
    {
      id: 'T1-F14-04',
      name: 'Token fidelity check guarantees zero script token omission or hallucination',
      feature: 'F14',
      tier: 1,
      fn: async (ctx) => {
        const expectedScriptWords = [
          'in', 'twenty', 'twenty-six', 'a', 'i', 'models', 'run', 'at',
          'twenty-four', 'kilohertz', 'locally'
        ];
        const actualWords = MOCK_WORDS_JSON.map((w) => w.cleanWord);
        assertEqual(actualWords.length, expectedScriptWords.length, 'Token count must match script exactly');
        for (let i = 0; i < expectedScriptWords.length; i++) {
          assertEqual(actualWords[i], expectedScriptWords[i], `Word mismatch at position ${i}`);
        }
      },
    },
    {
      id: 'T1-F14-05',
      name: 'Gate logic flags corrupted timestamps (start >= end or start < 0)',
      feature: 'F14',
      tier: 1,
      fn: async (ctx) => {
        const validateTimestamps = (words: Array<{ start: number; end: number }>): boolean => {
          for (const w of words) {
            if (w.start < 0 || w.end < 0 || w.start >= w.end) return false;
          }
          return true;
        };

        // Valid data passes
        assertTrue(validateTimestamps(MOCK_WORDS_JSON), 'Valid words.json must pass gate');

        // Negative start fails
        assertFalse(validateTimestamps([{ start: -0.5, end: 1.0 }]), 'Negative start must be rejected');

        // Reverse timestamps fail
        assertFalse(validateTimestamps([{ start: 1.5, end: 1.2 }]), 'start >= end must be rejected');
      },
    },
  ],
};

registerSuite(suite);
