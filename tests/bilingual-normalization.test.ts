/**
 * tests/bilingual-normalization.test.ts
 * Rigorous test suite for Milestone 2: Bilingual NLP, Tokenization & Lexicons.
 * Testing Requirements R2, R3, R4, R5, R6, and R11.
 */

import * as assert from 'node:assert';
import {
  LanguageAwareTokenizer,
  LexiconManager,
  TextNormalizer,
  UnregisteredAcronymError,
  normalizeVietnameseInteger,
  normalizeVietnameseYear,
  normalizeVietnamesePercent,
} from '../packages/narration-kit/src/normalization';

let totalTests = 0;
let passedTests = 0;

function check(desc: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${desc}`);
  } catch (err: any) {
    console.error(`  ✗ ${desc}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runMilestone2Tests() {
  console.log('======================================================================');
  console.log(' MILESTONE 2: BILINGUAL NLP, TOKENIZATION & LEXICONS TEST SUITE');
  console.log('======================================================================');

  const lexiconManager = LexiconManager.getInstance();
  const tokenizer = new LanguageAwareTokenizer();
  const normalizer = new TextNormalizer();

  // Test Section 1: Hierarchical Lexicons
  console.log('\n--- 1. Hierarchical YAML Lexicons & Precedence ---');
  check('Lexicons load terms from academic and technology domains', () => {
    assert.ok(lexiconManager.lookup('Scopus'), 'Scopus found in lexicon');
    assert.ok(lexiconManager.lookup('AI'), 'AI found in lexicon');
    assert.ok(lexiconManager.lookup('GPU'), 'GPU found in lexicon');
    assert.ok(lexiconManager.lookup('Web of Science'), 'Web of Science found in lexicon');
  });

  check('Pronunciation modes mapped correctly from lexicon', () => {
    const ai = lexiconManager.lookup('AI')!;
    assert.strictEqual(ai.mode, 'en_spell', 'AI is en_spell');
    assert.strictEqual(ai.spoken, 'A I', 'AI spoken is A I');
    assert.deepStrictEqual(ai.spokenUnits, ['A', 'I'], 'AI spokenUnits are ["A", "I"]');

    const gpu = lexiconManager.lookup('GPU')!;
    assert.strictEqual(gpu.mode, 'en_spell', 'GPU is en_spell');
    assert.deepStrictEqual(gpu.spokenUnits, ['G', 'P', 'U'], 'GPU spokenUnits are ["G", "P", "U"]');

    const scopus = lexiconManager.lookup('Scopus')!;
    assert.strictEqual(scopus.mode, 'en_word', 'Scopus is en_word');

    const gap = lexiconManager.lookup('Research Gap')!;
    assert.strictEqual(gap.mode, 'en_phrase', 'Research Gap is en_phrase');
    assert.strictEqual(gap.type, 'ENGLISH_PHRASE', 'Research Gap is ENGLISH_PHRASE');
  });

  // Test Section 2: Strict Unregistered Acronym Halt Policy
  console.log('\n--- 2. Strict Unregistered Acronym Halt Policy (R4 / R11) ---');
  check('Registered acronyms pass verification without error', () => {
    assert.doesNotThrow(() => {
      lexiconManager.verifyAcronym('GPU', [0, 3], true);
      lexiconManager.verifyAcronym('DOI', [0, 3], true);
      lexiconManager.verifyAcronym('ORCID', [0, 5], true);
    });
  });

  check('Unregistered uppercase acronym throws UnregisteredAcronymError', () => {
    assert.throws(
      () => {
        tokenizer.tokenize('Nghiên cứu về XYZABC chuẩn Scopus.', { strictAcronymCheck: true });
      },
      (err: any) => {
        return (
          err instanceof UnregisteredAcronymError &&
          err.acronym === 'XYZABC'
        );
      },
      'Throws UnregisteredAcronymError on unknown uppercase acronym'
    );
  });

  // Test Section 3: Vietnamese Number & Year Normalization
  console.log('\n--- 3. Vietnamese Number & Year Normalization (R6 / R11) ---');
  check('4-digit years normalized to Vietnamese cardinal words (never English)', () => {
    assert.strictEqual(
      normalizeVietnameseYear('2026'),
      'hai nghìn không trăm hai mươi sáu',
      '2026 -> hai nghìn không trăm hai mươi sáu'
    );
    assert.strictEqual(
      normalizeVietnameseYear('1990'),
      'một nghìn chín trăm chín mươi',
      '1990 -> một nghìn chín trăm chín mươi'
    );
  });

  check('Vietnamese numbers obey rules of mốt, lăm, tư', () => {
    assert.strictEqual(normalizeVietnameseInteger(21), 'hai mươi mốt');
    assert.strictEqual(normalizeVietnameseInteger(15), 'mười lăm');
    assert.strictEqual(normalizeVietnameseInteger(25), 'hai mươi lăm');
    assert.strictEqual(normalizeVietnameseInteger(24), 'hai mươi tư');
    assert.strictEqual(normalizeVietnameseInteger(105), 'một trăm không trăm linh năm');
  });

  check('Percentages and decimals normalized to Vietnamese', () => {
    assert.strictEqual(normalizeVietnamesePercent('99%'), 'chín mươi chín phần trăm');
  });

  // Test Section 4: Decoupled displayText vs spokenText
  console.log('\n--- 4. Decoupled displayText vs spokenText (R5 / R11) ---');
  check('displayText is strictly identical to original script', () => {
    const input = 'Nghiên cứu về AI và GPU năm 2026 chuẩn Scopus.';
    const result = normalizer.tokenizeBilingual(input);

    assert.strictEqual(result.displayText, input, 'displayText matches original script 100%');
    assert.ok(result.spokenText.includes('A I'), 'spokenText contains expanded A I');
    assert.ok(result.spokenText.includes('G P U'), 'spokenText contains expanded G P U');
    assert.ok(result.spokenText.includes('hai nghìn không trăm hai mươi sáu'), 'spokenText contains Vietnamese year words');
    assert.ok(!result.spokenText.includes('twenty'), 'spokenText contains zero English year words');
  });

  check('Acronym display token preserves exact string without spaces', () => {
    const input = 'AI hỗ trợ xác định Research Gap.';
    const result = normalizer.tokenizeBilingual(input);

    const gpuEntry = result.pronunciationMap.find((p) => p.token === 'AI');
    assert.ok(gpuEntry, 'AI found in pronunciation map');
    assert.strictEqual(gpuEntry.displayToken, 'AI', 'displayToken is "AI" (no spaces)');
    assert.deepStrictEqual(gpuEntry.spokenUnits, ['A', 'I'], 'spokenUnits are ["A", "I"]');
  });

  // Test Section 5: Complex Bilingual Sentences Tokenization
  console.log('\n--- 5. Complex Bilingual Academic Sentence Tokenization ---');
  check('Full academic test sentence tokenizes cleanly', () => {
    const script = 'Năm 2026, các mô hình AI và kiến trúc GPT chạy trên GPU đang hỗ trợ viết bài báo Scopus và Web of Science để tránh bị Desk Reject từ Springer với phân hạng Q1 và mã DOI.';
    const result = normalizer.tokenizeBilingual(script);

    assert.strictEqual(result.displayText, script);
    assert.ok(result.stats.vietnameseRatio >= 70, `Vietnamese ratio >= 70% (got ${result.stats.vietnameseRatio}%)`);
    assert.ok(result.stats.codeSwitchTerms >= 8, `Detected at least 8 code-switching terms (got ${result.stats.codeSwitchTerms})`);

    // Verify language spans coverage
    assert.ok(result.languageSpans.length > 20, 'Spans coverage complete');
    const scopusSpan = result.languageSpans.find((s) => s.text === 'Scopus');
    assert.ok(scopusSpan && scopusSpan.semanticType === 'ENGLISH_WORD', 'Scopus classified as ENGLISH_WORD');

    const wosSpan = result.languageSpans.find((s) => s.text === 'Web of Science');
    assert.ok(wosSpan && wosSpan.semanticType === 'ENGLISH_PHRASE', 'Web of Science classified as ENGLISH_PHRASE');

    const deskRejectSpan = result.languageSpans.find((s) => s.text === 'Desk Reject');
    assert.ok(deskRejectSpan && deskRejectSpan.semanticType === 'ENGLISH_PHRASE', 'Desk Reject classified as ENGLISH_PHRASE');

    const q1Span = result.languageSpans.find((s) => s.text === 'Q1');
    assert.ok(q1Span && q1Span.semanticType === 'MODEL_NAME', 'Q1 classified as MODEL_NAME');
  });

  console.log('\n======================================================================');
  console.log(` ✅ ALL MILESTONE 2 TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('======================================================================\n');
}

runMilestone2Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
