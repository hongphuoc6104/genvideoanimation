/**
 * packages/narration-kit/src/normalization/textNormalizer.ts
 * Main text normalizer with bidirectional token mapping, number/currency/unit expansion,
 * hierarchical lexicon integration, and authoritative V3.1 bilingual Vietnamese-First support.
 */

import {
  LanguageSpan,
  NarrationTextMap,
  NarrationToken,
  NormalizationResult,
  NormalizerOptions,
  PronunciationMapEntry,
  TokenType,
} from './types';
import {
  currencyToWords,
  dateToWords,
  decimalToWords,
  integerToWords,
  ordinalToWords,
  percentageToWords,
  yearToWords,
} from './numberNormalizer';
import {
  ACRONYM_EXPANSIONS,
  COMMON_ABBREVIATIONS,
  UNIT_DEFINITIONS,
  expandUrl,
  sanitizeUnicode,
} from './rules';
import {
  LanguageAwareTokenizer,
  TokenizeBilingualResult,
} from './languageAwareTokenizer';
import { LexiconManager } from './lexiconManager';

/**
 * Checks if a text string contains Vietnamese diacritics or common Vietnamese syllables.
 */
export function isVietnameseText(text: string): boolean {
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
}

/**
 * Normalizes text for speech synthesis, expanding numbers, currencies, dates,
 * units, URLs, and acronyms while sanitizing typographic Unicode characters.
 * Returns a clean primitive string.
 */
export function normalizeText(text: string, options?: NormalizerOptions): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // If text is Vietnamese or Vietnamese locale is requested, use LanguageAwareTokenizer
  const isVi = options?.locale?.startsWith('vi') || isVietnameseText(text);
  if (isVi) {
    const tokenizer = new LanguageAwareTokenizer(options);
    const res = tokenizer.tokenize(text, options);
    return res.spokenText;
  }

  // English-only legacy normalization
  let norm = sanitizeUnicode(text);

  // 2. Expand URLs
  norm = norm.replace(/https?:\/\/[^\s"'<>]+/gi, (urlMatch) => {
    return expandUrl(urlMatch).normalized;
  });

  // 3. Expand Currency
  norm = norm.replace(
    /(?:^|(?<=\s))([+-]?\$\d[\d,]*(?:\.\d+)?|\$[+-]?\d[\d,]*(?:\.\d+)?)(?=\s|[.,!?;:]|$)/gi,
    (m) => currencyToWords(m)
  );

  // 4. Expand Percentages
  norm = norm.replace(
    /(?:^|(?<=\s))([+-]?\d[\d,]*(?:\.\d+)?%)(?=\s|[.,!?;:]|$)/gi,
    (m) => percentageToWords(m)
  );

  // 5. Expand Units
  for (const def of UNIT_DEFINITIONS) {
    const unitRegex = new RegExp(
      `(?:^|(?<=\\s))${def.regexStr}(?=\\s|[.,!?;:]|$)`,
      'gi'
    );
    norm = norm.replace(unitRegex, (_m, numStr, unitStr) => {
      return def.expand(numStr, unitStr).words;
    });
  }

  // 6. Expand Decimals
  norm = norm.replace(
    /(?:^|(?<=\s))([+-]?\d[\d,]*\.\d+)(?=\s|[.,!?;:]|$)/g,
    (m) => decimalToWords(m)
  );

  // 6.5 Expand Dates (MM/DD/YYYY or MM/DD/YY)
  norm = norm.replace(
    /(?:^|(?<=\s))(\d{1,2}\/\d{1,2}\/\d{2,4})(?=\s|[.,!?;:]|$)/g,
    (m) => dateToWords(m)
  );

  // 7. Expand 4-digit years
  norm = norm.replace(
    /(?:^|(?<=\s))(19\d{2}|20\d{2})(?=\s|[.,!?;:]|$)/g,
    (m) => yearToWords(parseInt(m, 10))
  );

  // 8. Expand Ordinals
  norm = norm.replace(
    /(?:^|(?<=\s))(\d+)(?:st|nd|rd|th)(?=\s|[.,!?;:]|$)/gi,
    (_m, digits) => ordinalToWords(parseInt(digits, 10))
  );

  // 9. Expand Integers
  norm = norm.replace(
    /(?:^|(?<=\s))([+-]?\d[\d,]*)(?=\s|[.,!?;:]|$)/g,
    (m) => integerToWords(parseInt(m.replace(/,/g, ''), 10))
  );

  // 10. Expand Common Abbreviations
  for (const [abbr, expanded] of Object.entries(COMMON_ABBREVIATIONS)) {
    const abbrRegex = new RegExp(`\\b${abbr}\\b`, 'gi');
    norm = norm.replace(abbrRegex, expanded);
  }

  // 11. Expand Acronyms with spelling
  for (const [acronym, expanded] of Object.entries(ACRONYM_EXPANSIONS)) {
    const acrRegex = new RegExp(`\\b${acronym}\\b`, 'g');
    norm = norm.replace(acrRegex, expanded);
  }

  return norm.replace(/\s+/g, ' ').trim();
}

/**
 * Generates authoritative bidirectional narration-text-map.json object.
 */
export function createNarrationTextMap(
  originalText: string,
  options?: NormalizerOptions
): NarrationTextMap {
  if (!originalText || originalText.trim().length === 0) {
    return {
      version: '1.0.0',
      originalText: '',
      normalizedText: '',
      tokens: [],
      spokenText: '',
      displayText: '',
      languageSpans: [],
      pronunciationMap: [],
    };
  }

  // Use LanguageAwareTokenizer by default for Vietnamese-first bilingual production
  const tokenizer = new LanguageAwareTokenizer(options);
  const bilingualRes = tokenizer.tokenize(originalText, options);

  return {
    version: '1.0.0',
    originalText,
    normalizedText: bilingualRes.spokenText,
    displayText: bilingualRes.displayText,
    tokens: bilingualRes.tokens,
    spokenText: bilingualRes.spokenText,
    languageSpans: bilingualRes.languageSpans,
    pronunciationMap: bilingualRes.pronunciationMap,
  };
}

/**
 * TextNormalizer class implementing the complete normalization interface.
 */
export class TextNormalizer {
  private tokenizer: LanguageAwareTokenizer;

  constructor(private options?: NormalizerOptions) {
    this.tokenizer = new LanguageAwareTokenizer(options);
  }

  /**
   * Returns normalized text string directly.
   */
  public normalize(text: string): string {
    return normalizeText(text, this.options);
  }

  /**
   * Standalone alias for normalized text string.
   */
  public normalizeText(text: string): string {
    return normalizeText(text, this.options);
  }

  /**
   * Generates authoritative bidirectional narration-text-map.json object.
   */
  public createNarrationTextMap(text: string): NarrationTextMap {
    return createNarrationTextMap(text, this.options);
  }

  public createTextMap(text: string): NarrationTextMap {
    return createNarrationTextMap(text, this.options);
  }

  /**
   * Dedicated bilingual tokenization and classification method (V3.1).
   */
  public tokenizeBilingual(text: string): TokenizeBilingualResult {
    return this.tokenizer.tokenize(text, this.options);
  }

  /**
   * Backward compatibility for Milestone 1 interfaces.
   */
  public normalizeWithResult(text: string): NormalizationResult {
    const textMap = this.createNarrationTextMap(text);
    return {
      originalText: textMap.originalText,
      normalizedText: textMap.normalizedText,
      spokenText: textMap.spokenText || textMap.normalizedText,
      displayText: textMap.displayText,
      languageSpans: textMap.languageSpans,
      pronunciationMap: textMap.pronunciationMap,
      tokens: textMap.tokens.map((t) => ({
        id: t.id,
        original: t.originalWord,
        normalized: t.normalized || t.spokenWords.join(' '),
        spoken: t.spokenWords.join(' '),
        startChar: t.originalSpan[0],
        endChar: t.originalSpan[1],
        isPunctuation: t.type === 'punctuation',
      })),
    };
  }
}
