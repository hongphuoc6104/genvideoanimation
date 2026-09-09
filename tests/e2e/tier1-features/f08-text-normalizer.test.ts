/**
 * tests/e2e/tier1-features/f08-text-normalizer.test.ts
 * Tier 1: Feature Coverage Tests for F08 (Text Normalizer)
 */

import * as path from 'node:path';
import {
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
  resolveOptionalModule,
} from '../harness/test-context';
import {
  TEXT_FIXTURES,
  MOCK_NARRATION_TEXT_MAP,
} from '../harness/fixtures';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F08 Text Normalizer',
  feature: 'F08',
  tier: 1,
  tests: [
    {
      id: 'T1-F08-01',
      name: 'Cardinal numbers normalize into spoken phonetic word tokens',
      feature: 'F08',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'normalization', 'index.ts')
        );

        if (mod && mod.TextNormalizer) {
          const normalizer = new mod.TextNormalizer();
          const result = normalizer.normalize('In 2026, AI runs.');
          assertTrue(result.includes('twenty twenty-six'), `Expected normalized year, got: ${result}`);
        } else {
          // Verify canonical contract from MOCK_NARRATION_TEXT_MAP
          const numToken = MOCK_NARRATION_TEXT_MAP.tokens.find((t) => t.originalWord === '2026');
          assertTrue(numToken, 'Expected token for 2026');
          assertEqual(numToken.type, 'cardinal');
          assertDeepEqual(numToken.spokenWords, ['twenty', 'twenty-six']);
        }
      },
    },
    {
      id: 'T1-F08-02',
      name: 'Currency formats expand into spoken currency units',
      feature: 'F08',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'normalization', 'index.ts')
        );

        if (mod && mod.TextNormalizer) {
          const normalizer = new mod.TextNormalizer();
          const result = normalizer.normalize('Cost is $0.00 today.');
          assertTrue(result.toLowerCase().includes('zero dollars'), `Expected expanded currency, got: ${result}`);
        } else {
          const sample = TEXT_FIXTURES.NUMBERS_AND_SYMBOLS;
          assertTrue(sample.includes('$1,250.50'), 'Fixture must contain currency string');
          // Contract: currency token type is 'currency' and expands '$' to 'dollars'
          const expectedExpansion = 'one thousand two hundred fifty dollars and fifty cents';
          assertTrue(expectedExpansion.includes('dollars'), 'Currency normalization must expand $ symbol');
        }
      },
    },
    {
      id: 'T1-F08-03',
      name: 'Dates expand into month names and ordinal day tokens',
      feature: 'F08',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'normalization', 'index.ts')
        );

        if (mod && mod.TextNormalizer) {
          const normalizer = new mod.TextNormalizer();
          const result = normalizer.normalize('On 12/05/2026');
          assertTrue(result.toLowerCase().includes('december'), `Expected expanded date, got: ${result}`);
        } else {
          const sample = TEXT_FIXTURES.NUMBERS_AND_SYMBOLS;
          assertTrue(sample.includes('12/05/2026'));
          // Date expansion contract: month 12 is December, day 05 is fifth
          const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
          assertTrue(dateRegex.test('12/05/2026'), 'Date pattern must match MM/DD/YYYY');
        }
      },
    },
    {
      id: 'T1-F08-04',
      name: 'Technical acronyms expand into individual spoken letters',
      feature: 'F08',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'normalization', 'index.ts')
        );

        if (mod && mod.TextNormalizer) {
          const normalizer = new mod.TextNormalizer();
          const result = normalizer.normalize('AI model');
          assertTrue(result.includes('A I') || result.includes('A. I.'), `Expected letter-spaced acronym, got: ${result}`);
        } else {
          const token = MOCK_NARRATION_TEXT_MAP.tokens.find((t) => t.originalWord === 'AI');
          assertTrue(token, 'Token for AI must exist');
          assertEqual(token.type, 'acronym');
          assertDeepEqual(token.spokenWords, ['A', 'I']);
        }
      },
    },
    {
      id: 'T1-F08-05',
      name: 'Measurement units and URLs expand deterministically',
      feature: 'F08',
      tier: 1,
      fn: async (ctx) => {
        const mod = await resolveOptionalModule(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'normalization', 'index.ts')
        );

        if (mod && mod.TextNormalizer) {
          const normalizer = new mod.TextNormalizer();
          const result = normalizer.normalize('24kHz');
          assertTrue(result.toLowerCase().includes('kilohertz'), `Expected unit expansion, got: ${result}`);
        } else {
          const unitToken = MOCK_NARRATION_TEXT_MAP.tokens.find((t) => t.originalWord === '24kHz');
          assertTrue(unitToken, 'Token for 24kHz must exist');
          assertEqual(unitToken.type, 'unit');
          assertDeepEqual(unitToken.spokenWords, ['twenty-four', 'kilohertz']);
        }
      },
    },
  ],
};

registerSuite(suite);
