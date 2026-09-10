/**
 * tests/challenger_m2_normalization.test.ts
 * Empirical Adversarial Challenge Suite for packages/narration-kit normalization and prosody profiles.
 *
 * Authored by: challenger_m2_1 (teamwork_preview_challenger)
 * Roles: critic, specialist
 */

import * as assert from 'node:assert/strict';
import {
  normalizeText,
  createNarrationTextMap,
  TextNormalizer,
  currencyToWords,
  dateToWords,
  decimalToWords,
  integerToWords,
  ordinalToWords,
  percentageToWords,
  yearToWords,
  expandUrl,
  sanitizeUnicode,
  NarrationTextMap,
  NarrationToken,
} from '../packages/narration-kit/src/normalization';
import {
  CANONICAL_PROFILES,
  PROSODY_PROFILES,
  clampPause,
  clampSpeed,
  resolveProsodyProfile,
} from '../packages/narration-kit/src/prosody';
import {
  chunkText,
  chunkShotSpec,
  ShotSpecBinding,
} from '../packages/narration-kit/src/tts/chunkNarration';

export interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export const results: TestResult[] = [];

function recordTest(category: string, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ category, name, passed: true });
      console.log(`  ✓ [${category}] ${name}`);
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        error: err?.message || String(err),
        details: err?.stack,
      });
      console.error(`  ✗ [${category}] ${name}: ${err?.message || err}`);
    }
  };
}

/**
 * Validates that a NarrationTextMap satisfies all structural invariants:
 * 1. version is '1.0.0'
 * 2. monotonic non-overlapping intervals: start >= prevEnd, end >= start
 * 3. 100% slice fidelity: originalText.slice(start, end) === originalWord
 * 4. spokenWords is non-empty array of strings
 */
export function assertTokenMapInvariants(map: NarrationTextMap, originalText: string, contextMsg = '') {
  assert.strictEqual(map.version, '1.0.0', `Version must be 1.0.0 ${contextMsg}`);
  assert.strictEqual(map.originalText, originalText, `originalText must match input ${contextMsg}`);
  assert.strictEqual(typeof map.normalizedText, 'string', `normalizedText must be string ${contextMsg}`);
  assert.ok(Array.isArray(map.tokens), `tokens must be an array ${contextMsg}`);

  let prevEnd = 0;
  for (let i = 0; i < map.tokens.length; i++) {
    const t = map.tokens[i];
    const [start, end] = t.originalSpan;

    assert.ok(
      typeof start === 'number' && typeof end === 'number',
      `Token ${t.id} originalSpan must be [number, number] ${contextMsg}`
    );
    assert.ok(start >= 0, `Token ${t.id} start (${start}) must be >= 0 ${contextMsg}`);
    assert.ok(end >= start, `Token ${t.id} end (${end}) must be >= start (${start}) ${contextMsg}`);
    assert.ok(
      end <= originalText.length,
      `Token ${t.id} end (${end}) exceeds text length (${originalText.length}) ${contextMsg}`
    );
    assert.ok(
      start >= prevEnd,
      `Token ${t.id} overlaps with previous token: start=${start}, prevEnd=${prevEnd} ${contextMsg}`
    );

    // CRITICAL: Strict Slice identity
    const sliced = originalText.slice(start, end);
    assert.strictEqual(
      sliced,
      t.originalWord,
      `Token ${t.id} slice invariant violation: text.slice(${start}, ${end})="${sliced}" !== originalWord="${t.originalWord}" ${contextMsg}`
    );

    assert.ok(Array.isArray(t.spokenWords), `Token ${t.id} spokenWords must be array ${contextMsg}`);
    assert.ok(t.spokenWords.length > 0, `Token ${t.id} spokenWords must not be empty ${contextMsg}`);
    for (const w of t.spokenWords) {
      assert.strictEqual(typeof w, 'string', `Token ${t.id} spoken word must be string ${contextMsg}`);
      assert.ok(w.length > 0, `Token ${t.id} spoken word must be non-empty ${contextMsg}`);
    }

    prevEnd = end;
  }
}

export async function runAllM2Challenges() {
  console.log('======================================================================');
  console.log(' EMPIRICAL ADVERSARIAL CHALLENGE: Text Normalization & Prosody Profiles');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: Extreme Numbers, Decimals, Zeros, Exponentials
  // --------------------------------------------------------------------------
  console.log('--- Category 1: Extreme Numbers & Edge Cases ---');

  await recordTest('Numbers - Quadrillions', 'correctly formats 1 quadrillion and large BigInt values', () => {
    const q1 = integerToWords(1_000_000_000_000_000n);
    assert.ok(q1.includes('one quadrillion'), `Expected "one quadrillion", got: ${q1}`);

    const qWithRest = integerToWords(1_999_999_999_999_999n);
    assert.ok(qWithRest.startsWith('one quadrillion') && qWithRest.includes('nine hundred ninety-nine trillion'), `Got: ${qWithRest}`);

    const maxTrillion = integerToWords(999_999_999_999_999n);
    assert.ok(maxTrillion.startsWith('nine hundred ninety-nine trillion'), `Got: ${maxTrillion}`);

    // Numbers even larger than quadrillion (quintillion range) must not crash
    const quintillion = integerToWords(5_000_000_000_000_000_000n);
    assert.ok(typeof quintillion === 'string' && quintillion.includes('quadrillion'));
  })();

  await recordTest('Numbers - Negative Decimals & Signs', 'handles negative decimals, plus signs, and fractional zeros', () => {
    const negDec = decimalToWords('-0.005');
    assert.strictEqual(negDec, 'negative zero point zero zero five');

    const posDec = decimalToWords('+99.9');
    assert.strictEqual(posDec, 'positive ninety-nine point nine');

    const piLike = decimalToWords('3.14159');
    assert.strictEqual(piLike, 'three point one four one five nine');

    const leadDot = decimalToWords('.5');
    assert.strictEqual(leadDot, 'zero point five');
  })();

  await recordTest('Numbers - Zeros', 'handles all variations of zero (signed, float, ordinal, unit)', () => {
    assert.strictEqual(integerToWords(0), 'zero');
    assert.strictEqual(integerToWords(0n), 'zero');
    assert.strictEqual(decimalToWords('0.0'), 'zero point zero');
    assert.strictEqual(decimalToWords('0.00'), 'zero point zero zero');
    assert.strictEqual(percentageToWords('0%'), 'zero percent');

    const norm0 = normalizeText('0 and 0.0 and +0 and -0 and 0%');
    assert.ok(norm0.includes('zero') && norm0.includes('point') && norm0.includes('percent'));
  })();

  await recordTest('Numbers - Exponential Forms', 'normalizes or cleanly tokenizes exponential forms without crashing', () => {
    const exps = ['1e10', '1.5e-3', '2.3e+4', '1E6', '0e0', '1.0e-10'];
    for (const exp of exps) {
      const norm = normalizeText(`The value is ${exp}.`);
      assert.ok(typeof norm === 'string' && norm.length > 0);
      const map = createNarrationTextMap(`The value is ${exp}.`);
      assertTokenMapInvariants(map, `The value is ${exp}.`, `(exponential ${exp})`);
    }
  })();

  // --------------------------------------------------------------------------
  // SECTION 2: Currency Variations, Combinations, and Edge Cases
  // --------------------------------------------------------------------------
  console.log('\n--- Category 2: Currencies & Financial Combos ---');

  await recordTest('Currencies - Combinations', 'handles zero dollars, cents only, large sums, and signed amounts', () => {
    assert.strictEqual(currencyToWords('$0.00'), 'zero dollars');
    assert.strictEqual(currencyToWords('$0'), 'zero dollars');
    assert.strictEqual(currencyToWords('$1'), 'one dollar');
    assert.strictEqual(currencyToWords('$1.00'), 'one dollar');
    assert.strictEqual(currencyToWords('$1.01'), 'one dollar and one cent');
    assert.strictEqual(currencyToWords('$1.50'), 'one dollar and fifty cents');
    assert.strictEqual(currencyToWords('$0.99'), 'ninety-nine cents');
    assert.strictEqual(currencyToWords('+$0.50'), 'positive fifty cents');
    assert.strictEqual(currencyToWords('-$0.01'), 'negative one cent');
    assert.strictEqual(currencyToWords('-$50.25'), 'negative fifty dollars and twenty-five cents');
    assert.strictEqual(currencyToWords('$-50.25'), 'negative fifty dollars and twenty-five cents');

    const trillion = currencyToWords('$1,000,000,000,000');
    assert.strictEqual(trillion, 'one trillion dollars');

    const quadrillion = currencyToWords('$1,000,000,000,000,000.50');
    assert.strictEqual(quadrillion, 'one quadrillion dollars and fifty cents');
  })();

  await recordTest('Currencies - Sentence Embedding & Token Mapping', 'tokenizes currency tokens with strict slice equality', () => {
    const sentence = 'Budget was -$50.25, raised to +$1,000,000.00, but now is $0.00!';
    const map = createNarrationTextMap(sentence);
    assertTokenMapInvariants(map, sentence);

    const currTokens = map.tokens.filter((t) => t.type === 'currency');
    assert.ok(currTokens.length >= 3, `Expected at least 3 currency tokens, got: ${currTokens.length}`);
    assert.strictEqual(currTokens[0].originalWord, '-$50.25');
    assert.strictEqual(currTokens[1].originalWord, '+$1,000,000.00');
    assert.strictEqual(currTokens[2].originalWord, '$0.00');
  })();

  // --------------------------------------------------------------------------
  // SECTION 3: Typographic Unicode, Quotes, Dashes, Line Breaks, Emoji
  // --------------------------------------------------------------------------
  console.log('\n--- Category 3: Unicode, Punctuation, Line Breaks & Emoji ---');

  await recordTest('Unicode - Smart Quotes & Typographic Punctuation', 'sanitizes smart quotes, em-dashes, and ellipsis into spoken speech', () => {
    const raw = '“The model’s performance — astounding… isn’t it?”';
    const clean = sanitizeUnicode(raw);
    assert.strictEqual(clean, '"The model\'s performance ,  astounding... isn\'t it?"');

    const norm = normalizeText(raw);
    assert.ok(norm.includes("model's performance") && norm.includes("isn't it"));

    const map = createNarrationTextMap(raw);
    assertTokenMapInvariants(map, raw);
  })();

  await recordTest('Unicode - Mixed Line Breaks (CRLF, LF, CR, Tabs)', 'preserves character spans across mixed newline standards', () => {
    const raw = "Line one.\r\nLine two with CRLF.\nLine three with LF.\rLine four with CR.\r\n\r\nDouble break.";
    const map = createNarrationTextMap(raw);
    assertTokenMapInvariants(map, raw, 'mixed newlines');

    const words = map.tokens.map((t) => t.originalWord);
    assert.ok(words.includes('Line'));
    assert.ok(words.includes('CRLF'));
    assert.ok(words.includes('LF'));
    assert.ok(words.includes('CR'));
    assert.ok(words.includes('Double'));
  })();

  await recordTest('Unicode - Emoji & Surrogate Pairs', 'handles single-point, multi-point, and ZWJ emoji without desync', () => {
    const raw = "Rocket 🚀 launch with family 👨‍👩‍👧‍👦 at 100% speed! 🔥";
    const map = createNarrationTextMap(raw);
    assertTokenMapInvariants(map, raw, 'emoji & surrogate pairs');

    // Test with includePunctuationTokens: true
    const mapWithPunct = createNarrationTextMap(raw, { includePunctuationTokens: true });
    assertTokenMapInvariants(mapWithPunct, raw, 'emoji with includePunctuationTokens');
  })();

  await recordTest('Unicode - Foreign Scripts & Non-Latin Characters', 'tolerates non-Latin scripts (Vietnamese, Chinese, Cyrillic) gracefully', () => {
    const raw = "Khung hình 60fps trong Remotion 2026. 你好世界! Привет мир.";
    const map = createNarrationTextMap(raw);
    assertTokenMapInvariants(map, raw, 'foreign scripts');
  })();

  // --------------------------------------------------------------------------
  // SECTION 4: Complex Nested URLs
  // --------------------------------------------------------------------------
  console.log('\n--- Category 4: Complex Nested URLs ---');

  await recordTest('URLs - Complex Queries, Ports, and Hashes', 'expands URLs with queries, anchors, port numbers into spoken words', () => {
    const url = 'https://api.v2.remotion.dev:8443/render?task=v3&debug=true#output-stream';
    const expanded = expandUrl(url);
    assert.ok(expanded.spokenWords.includes('h'));
    assert.ok(expanded.spokenWords.includes('t'));
    assert.ok(expanded.spokenWords.includes('slash'));
    assert.ok(expanded.spokenWords.includes('question'));
    assert.ok(expanded.spokenWords.includes('equals'));
    assert.ok(expanded.spokenWords.includes('hash'));

    const sentence = `Documentation at ${url} is available.`;
    const map = createNarrationTextMap(sentence);
    assertTokenMapInvariants(map, sentence, 'complex URL');

    const urlToken = map.tokens.find((t) => t.type === 'url');
    assert.ok(urlToken, 'Must find a URL token');
    assert.strictEqual(urlToken.originalWord, url);
  })();

  await recordTest('URLs - Multiple URLs and Adjacent Punctuation', 'handles consecutive URLs and maintains 100% slice identity', () => {
    const sentence = 'Check https://first.org/v1?a=1 and http://second.net/v2#section for details.';
    const map = createNarrationTextMap(sentence);
    assertTokenMapInvariants(map, sentence, 'multiple URLs');

    const urlTokens = map.tokens.filter((t) => t.type === 'url');
    assert.strictEqual(urlTokens.length, 2);
    assert.strictEqual(urlTokens[0].originalWord, 'https://first.org/v1?a=1');
    assert.strictEqual(urlTokens[1].originalWord, 'http://second.net/v2#section');

    // Also test parenthesized URL: slice invariant must strictly hold even when trailing char is consumed
    const parenSentence = 'Visit (https://first.org/v1?a=1) now.';
    const parenMap = createNarrationTextMap(parenSentence);
    assertTokenMapInvariants(parenMap, parenSentence, 'parenthesized URL');
  })();

  // --------------------------------------------------------------------------
  // SECTION 5: Units, Ordinals, Dates, Acronyms & Abbreviations
  // --------------------------------------------------------------------------
  console.log('\n--- Category 5: Units, Ordinals, Dates, Acronyms & Abbreviations ---');

  await recordTest('Dates - Valid and Edge Dates', 'expands MM/DD/YYYY dates with full ordinal day and year', () => {
    assert.strictEqual(dateToWords('12/05/2026'), 'December fifth twenty twenty-six');
    assert.strictEqual(dateToWords('01/01/2000'), 'January first two thousand');
    assert.strictEqual(dateToWords('07/04/1776'), 'July fourth seventeen seventy-six');
    assert.strictEqual(dateToWords('10/15/99'), 'October fifteenth nineteen ninety-nine');

    const norm = normalizeText('Released on 12/05/2026 at 24kHz.');
    assert.ok(norm.includes('December fifth twenty twenty-six') && norm.includes('kilohertz'));
  })();

  await recordTest('Ordinals - Comprehensive Span', 'expands ordinals from 1st up to millions accurately', () => {
    assert.strictEqual(ordinalToWords(1), 'first');
    assert.strictEqual(ordinalToWords(2), 'second');
    assert.strictEqual(ordinalToWords(3), 'third');
    assert.strictEqual(ordinalToWords(4), 'fourth');
    assert.strictEqual(ordinalToWords(11), 'eleventh');
    assert.strictEqual(ordinalToWords(12), 'twelfth');
    assert.strictEqual(ordinalToWords(13), 'thirteenth');
    assert.strictEqual(ordinalToWords(20), 'twentieth');
    assert.strictEqual(ordinalToWords(21), 'twenty-first');
    assert.strictEqual(ordinalToWords(22), 'twenty-second');
    assert.strictEqual(ordinalToWords(23), 'twenty-third');
    assert.strictEqual(ordinalToWords(100), 'one hundredth');
    assert.strictEqual(ordinalToWords(112), 'one hundred twelfth');
    assert.strictEqual(ordinalToWords(120), 'one hundred twentieth');
  })();

  await recordTest('Units - Technical Audio & Video Specifications', 'expands 24kHz, 60fps, 12dB, 100ms, 1080p, 16-bit accurately', () => {
    const text = 'Render 1080p at 60fps with 24kHz 16-bit mono audio at -3dB in 100ms.';
    const norm = normalizeText(text);
    assert.ok(norm.includes('ten eighty p'));
    assert.ok(norm.includes('frames per second'));
    assert.ok(norm.includes('kilohertz'));
    assert.ok(norm.includes('bit'));
    assert.ok(norm.includes('decibels'));
    assert.ok(norm.includes('milliseconds'));

    const map = createNarrationTextMap(text);
    assertTokenMapInvariants(map, text, 'technical units');
  })();

  await recordTest('Acronyms - Expansion vs Common Uppercase Words', 'expands technical acronyms while preserving plain uppercase words', () => {
    const text = 'THE AI SYSTEM AND GPU IN THE UI ARE FAST.';
    const norm = normalizeText(text);
    assert.ok(norm.includes('THE A I SYSTEM AND G P U IN THE U I ARE'));

    const map = createNarrationTextMap(text);
    assertTokenMapInvariants(map, text, 'acronyms & uppercase words');

    const aiToken = map.tokens.find((t) => t.originalWord === 'AI');
    assert.ok(aiToken && aiToken.type === 'acronym');
    assert.deepStrictEqual(aiToken.spokenWords, ['A', 'I']);

    const theToken = map.tokens.find((t) => t.originalWord === 'THE');
    assert.ok(theToken && theToken.type === 'plain');
    assert.deepStrictEqual(theToken.spokenWords, ['THE']);

    const andToken = map.tokens.find((t) => t.originalWord === 'AND');
    assert.ok(andToken && andToken.type === 'plain');
  })();

  // --------------------------------------------------------------------------
  // SECTION 6: Prosody Profiles Engine & ShotSpec Chunking Invariants
  // --------------------------------------------------------------------------
  console.log('\n--- Category 6: Prosody Profiles Engine & ShotSpec Chunking ---');

  await recordTest('Prosody - All 6 Canonical Profiles', 'validates that all 6 canonical profiles exist and have self-consistent parameters', () => {
    assert.strictEqual(CANONICAL_PROFILES.length, 6);
    for (const name of CANONICAL_PROFILES) {
      const p = PROSODY_PROFILES[name];
      assert.ok(p, `Profile ${name} must be defined`);
      assert.strictEqual(p.name, name);
      assert.ok(p.speed >= 0.5 && p.speed <= 2.0, `Speed out of bounds for ${name}: ${p.speed}`);
      assert.ok(p.pauseSec >= 0.0 && p.pauseSec <= 5.0, `pauseSec out of bounds for ${name}: ${p.pauseSec}`);
      assert.strictEqual(p.pauseAfterSentence, p.pauseSec, `Dual representation mismatch for ${name}`);
      assert.strictEqual(p.sentencePauseMs, Math.round(p.pauseSec * 1000), `sentencePauseMs mismatch for ${name}`);
      assert.ok(p.paragraphPauseMs >= p.sentencePauseMs, `paragraphPauseMs must be >= sentencePauseMs for ${name}`);
      assert.ok(p.commaPauseMs <= p.sentencePauseMs, `commaPauseMs must be <= sentencePauseMs for ${name}`);
    }
  })();

  await recordTest('Prosody - Clamping Functions', 'clamps speed [0.5, 2.0] and pause [0.0, 5.0] accurately', () => {
    assert.strictEqual(clampSpeed(0.1), 0.5);
    assert.strictEqual(clampSpeed(0.5), 0.5);
    assert.strictEqual(clampSpeed(1.2), 1.2);
    assert.strictEqual(clampSpeed(2.0), 2.0);
    assert.strictEqual(clampSpeed(5.0), 2.0);
    assert.strictEqual(clampSpeed(-10), 0.5);

    assert.strictEqual(clampPause(-1), 0.0);
    assert.strictEqual(clampPause(0.0), 0.0);
    assert.strictEqual(clampPause(2.5), 2.5);
    assert.strictEqual(clampPause(5.0), 5.0);
    assert.strictEqual(clampPause(100), 5.0);
  })();

  await recordTest('Prosody - Profile Resolution Fallback', 'falls back to educational for null, undefined, or unknown names', () => {
    assert.strictEqual(resolveProsodyProfile(null).name, 'educational');
    assert.strictEqual(resolveProsodyProfile(undefined).name, 'educational');
    assert.strictEqual(resolveProsodyProfile('').name, 'educational');
    assert.strictEqual(resolveProsodyProfile('non_existent_profile').name, 'educational');
    assert.strictEqual(resolveProsodyProfile('energetic').name, 'energetic');
  })();

  await recordTest('Prosody - ShotSpec Chunking & Overrides', 'chunks across ShotSpec array and respects shot-level prosody overrides', () => {
    const mockShots: ShotSpecBinding[] = [
      {
        shot_id: 'shot-001',
        text: 'Welcome to this educational presentation. We will learn audio synthesis.',
        narration_profile: 'calm',
        pause_after: 0.8,
        emphasis_words: ['educational'],
      },
      {
        shot_id: 'shot-002',
        text: 'Act fast! The GPU is computing at maximum capacity!',
        narration_profile: 'energetic',
        pause_after: 0.2,
        emphasis_words: ['fast', 'GPU'],
      },
    ];

    const chunks = chunkShotSpec(mockShots, 'documentary');
    assert.strictEqual(chunks.length, 4, `Expected 4 sentence chunks, got ${chunks.length}`);

    // Shot 1 checks
    assert.strictEqual(chunks[0].shotId, 'shot-001');
    assert.strictEqual(chunks[0].profile.name, 'calm');
    assert.strictEqual(chunks[1].shotId, 'shot-001');
    assert.strictEqual(chunks[1].profile.name, 'calm');
    assert.strictEqual(chunks[1].pauseAfterMs, 800, 'Shot 1 override pause_after: 0.8s -> 800ms');

    // Shot 2 checks
    assert.strictEqual(chunks[2].shotId, 'shot-002');
    assert.strictEqual(chunks[2].profile.name, 'energetic');
    assert.strictEqual(chunks[3].shotId, 'shot-002');
    assert.strictEqual(chunks[3].profile.name, 'energetic');
    assert.strictEqual(chunks[3].pauseAfterMs, 200, 'Shot 2 override pause_after: 0.2s -> 200ms');
  })();

  // --------------------------------------------------------------------------
  // SECTION 7: Fuzzing & Property-Based Adversarial Generation (10,000 Iterations)
  // --------------------------------------------------------------------------
  console.log('\n--- Category 7: 10,000-Iteration Fuzzing & Invariant Verification ---');

  await recordTest('Fuzzing - 10,000 Random Invariant Checks', 'executes 10,000 random adversarial text combinations with 100% slice identity', () => {
    const vocab = [
      '', ' ', '  ', '\t', '\n', '\r\n',
      '0', '-0', '+0', '42', '-100', '+999', '1,000', '-1,000,000', '999,999,999,999,999', '1,000,000,000,000,000',
      '0.0', '0.00', '0.001', '3.14159', '-99.9', '+12.34',
      '$0', '$0.00', '$1', '$1.50', '$0.99', '-$50.25', '+$1,000,000', '$-20',
      '0%', '100%', '+99.9%', '-50%',
      '1st', '2nd', '3rd', '4th', '21st', '100th',
      '12/05/2026', '01/01/2000', '1999', '2026', '2005',
      '24kHz', '60fps', '12dB', '100ms', '1080p', '16-bit',
      'AI', 'TTS', 'GPU', 'CPU', 'API', 'PCM', 'HTML', 'CSS', 'THE', 'IN', 'AND',
      'dr.', 'mr.', 'vs.', 'etc.', 'e.g.',
      '“quoted”', '‘single’', '—', '–', '…',
      '😊', '🚀', '🔥', '💯', '👨‍👩‍👧‍👦',
      'https://example.com/api/v2?id=123#top', 'http://sub.domain.org/path',
      'hello', 'world', 'FooBar', 'test', 'variable_name', 'kebab-case',
      '!', '?', '.', ',', ';', ':', '(', ')', '[', ']', '"', "'",
      '1e10', '1.5e-3',
      'zero\u200Bwidth', '\uFEFFBOM',
    ];

    const ITERATIONS = 10000;
    const tStart = Date.now();
    let totalTokensVerified = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const numSegments = Math.floor(Math.random() * 6) + 1;
      let text = '';
      for (let s = 0; s < numSegments; s++) {
        text += vocab[Math.floor(Math.random() * vocab.length)];
        if (Math.random() > 0.4) text += ' ';
      }

      const map = createNarrationTextMap(text);
      assertTokenMapInvariants(map, text, `(fuzz sample #${i}: "${text.slice(0, 40)}")`);
      totalTokensVerified += map.tokens.length;
    }

    const tElapsed = Date.now() - tStart;
    console.log(`    -> Verified ${ITERATIONS} samples (${totalTokensVerified} tokens) in ${tElapsed}ms`);
    assert.ok(totalTokensVerified > 0);
  })();

  // --------------------------------------------------------------------------
  // SECTION 8: Performance, Memory & Resource Stress
  // --------------------------------------------------------------------------
  console.log('\n--- Category 8: Heavy Text & Memory Stress ---');

  await recordTest('Stress - Huge Text Payload (50,000 tokens)', 'normalizes and maps huge payload without call stack overflow or OOM', () => {
    const baseSentence = 'In 2026, the AI model generates 24kHz audio at 60fps for $100.50 with +99.9% accuracy on 12/05/2026. ';
    // Repeat to create ~50,000 words / ~400 KB text
    const largeText = baseSentence.repeat(2500);

    const memBefore = process.memoryUsage().heapUsed;
    const t0 = Date.now();

    const normalized = normalizeText(largeText);
    assert.ok(normalized.length > 0);

    const map = createNarrationTextMap(largeText);
    const tElapsed = Date.now() - t0;
    const memAfter = process.memoryUsage().heapUsed;
    const memDiffMb = (memAfter - memBefore) / (1024 * 1024);

    console.log(`    -> Processed ${map.tokens.length} tokens in ${tElapsed}ms, heap delta: ${memDiffMb.toFixed(2)} MB`);
    assertTokenMapInvariants(map, largeText, '(huge payload)');
    assert.ok(map.tokens.length >= 20000, `Expected >= 20,000 tokens, got ${map.tokens.length}`);
  })();

  // --------------------------------------------------------------------------
  // Summary and Verdict
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(' ADVERSARIAL CHALLENGE EXECUTION SUMMARY');
  console.log('======================================================================');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Challenges: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed / Invariants Violated: ${failedCount}`);

  if (failedCount > 0) {
    console.log('\nViolations / Failures Flagged:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - [${r.category}] ${r.name}`);
      console.log(`    Error: ${r.error}`);
    }
  }

  return { total: results.length, passed: passedCount, failed: failedCount, results };
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('challenger_m2_normalization')) {
  runAllM2Challenges()
    .then((summary) => {
      if (summary.failed > 0) {
        console.error(`\nFAILED: ${summary.failed} challenges violated invariants!`);
        process.exit(1);
      } else {
        console.log(`\nSUCCESS: All ${summary.passed} adversarial challenges PASSED with 100% invariant compliance.`);
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal runner error:', err);
      process.exit(1);
    });
}
