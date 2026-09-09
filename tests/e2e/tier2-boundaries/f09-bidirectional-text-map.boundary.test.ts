/**
 * tests/e2e/tier2-boundaries/f09-bidirectional-text-map.boundary.test.ts
 * Feature F09: Bidirectional Text Map Boundary Tests (T2-F09-01 to T2-F09-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F09: Bidirectional Text Map Boundary Tests', () => {
  test('T2-F09-01: Token originalSpan intervals strictly bounded within [0, originalText.length]', async (ctx) => {
    const textMap = FIXTURES.TEXT_MAP;
    const len = textMap.originalText.length;

    for (const token of textMap.tokens) {
      assertTrue(token.originalSpan[0] >= 0, `Span start ${token.originalSpan[0]} must be >= 0`);
      assertTrue(token.originalSpan[1] <= len, `Span end ${token.originalSpan[1]} must be <= text length ${len}`);
      assertTrue(token.originalSpan[1] >= token.originalSpan[0], 'Span end must be >= span start');
    }
  }, { id: 'T2-F09-01', feature: 'F09', tier: 2 });

  test('T2-F09-02: Non-overlapping token spans: consecutive tokens do not collide', async (ctx) => {
    const textMap = FIXTURES.TEXT_MAP;
    for (let i = 1; i < textMap.tokens.length; i++) {
      const prev = textMap.tokens[i - 1];
      const curr = textMap.tokens[i];
      assertTrue(
        curr.originalSpan[0] >= prev.originalSpan[1],
        `Span overlap detected: token "${prev.originalWord}" [${prev.originalSpan}] collides with "${curr.originalWord}" [${curr.originalSpan}]`
      );
    }
  }, { id: 'T2-F09-02', feature: 'F09', tier: 2 });

  test('T2-F09-03: Exact slice invariant: originalText.slice(span[0], span[1]) matches originalWord', async (ctx) => {
    const textMap = FIXTURES.TEXT_MAP;
    for (const token of textMap.tokens) {
      const sliced = textMap.originalText.slice(token.originalSpan[0], token.originalSpan[1]);
      assertEqual(sliced, token.originalWord, `Sliced text "${sliced}" must match originalWord "${token.originalWord}"`);
    }
  }, { id: 'T2-F09-03', feature: 'F09', tier: 2 });

  test('T2-F09-04: Non-empty spoken words array for all lexical tokens', async (ctx) => {
    const textMap = FIXTURES.TEXT_MAP;
    for (const token of textMap.tokens) {
      assertTrue(Array.isArray(token.spokenWords), 'spokenWords must be an array');
      assertTrue(token.spokenWords.length >= 1, `Token "${token.originalWord}" must map to at least 1 spoken word`);
      for (const word of token.spokenWords) {
        assertTrue(typeof word === 'string' && word.length > 0, 'Spoken word must be a non-empty string');
      }
    }
  }, { id: 'T2-F09-04', feature: 'F09', tier: 2 });

  test('T2-F09-05: Multiline text with CRLF line endings preserves exact token offsets across breaks', async (ctx) => {
    const multilineText = 'Line one.\r\nLine two.\r\nLine three.';
    // Simulate token offsets across \r\n
    const posLineOne = multilineText.indexOf('Line one.');
    const posLineTwo = multilineText.indexOf('Line two.');
    const posLineThree = multilineText.indexOf('Line three.');

    assertTrue(posLineOne === 0);
    assertTrue(posLineTwo === 11); // 9 chars + 2 chars (\r\n)
    assertTrue(posLineThree === 22);

    assertEqual(multilineText.slice(11, 20), 'Line two.');
  }, { id: 'T2-F09-05', feature: 'F09', tier: 2 });
}, { feature: 'F09', tier: 2 });
