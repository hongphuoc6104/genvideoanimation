/**
 * packages/narration-kit/src/normalization/textNormalizer.ts
 * Main text normalizer with bidirectional token mapping, number/currency/unit expansion,
 * and authoritative narration-text-map.json schema compliance.
 */

import {
  NarrationTextMap,
  NarrationToken,
  NormalizationResult,
  NormalizerOptions,
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

/**
 * Normalizes text for speech synthesis, expanding numbers, currencies, dates,
 * units, URLs, and acronyms while sanitizing typographic Unicode characters.
 * Returns a clean primitive string.
 */
export function normalizeText(text: string, options?: NormalizerOptions): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // 1. Sanitize Unicode quotes, em-dashes, and ellipsis
  let norm = sanitizeUnicode(text);

  // 2. Expand URLs
  norm = norm.replace(/https?:\/\/[^\s"'<>]+/gi, (urlMatch) => {
    return expandUrl(urlMatch).normalized;
  });

  // 3. Expand Currency: e.g. $1,000,000,000,000, -$50.25, $0.00
  norm = norm.replace(
    /(?:^|(?<=\s))([+-]?\$\d[\d,]*(?:\.\d+)?|\$[+-]?\d[\d,]*(?:\.\d+)?)(?=\s|[.,!?;:]|$)/gi,
    (m) => currencyToWords(m)
  );

  // 4. Expand Percentages: e.g. +99.9%, -50%, 42%
  norm = norm.replace(
    /(?:^|(?<=\s))([+-]?\d[\d,]*(?:\.\d+)?%)(?=\s|[.,!?;:]|$)/gi,
    (m) => percentageToWords(m)
  );

  // 5. Expand MM/DD/YYYY Dates: e.g. 12/05/2026
  norm = norm.replace(/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, (m) => dateToWords(m));

  // 6. Expand Units: e.g. 24kHz, 60fps, 12dB, 100ms, 1080p, 16-bit
  for (const unitDef of UNIT_DEFINITIONS) {
    norm = norm.replace(new RegExp(`\\b${unitDef.regexStr}\\b`, 'gi'), (...args) => {
      const num = args[1];
      const unit = args[2] || '';
      return unitDef.expand(num, unit).words;
    });
  }

  // 7. Expand Ordinals: e.g. 1st, 2nd, 3rd, 23rd
  norm = norm.replace(/\b(\d+)(st|nd|rd|th)\b/gi, (_, n) => ordinalToWords(parseInt(n, 10)));

  // 8. Expand 4-digit years: e.g. 2026, 1999
  norm = norm.replace(/\b(19\d\d|20\d\d)\b/g, (m) => yearToWords(parseInt(m, 10)));

  // 9. Expand Decimals: e.g. 99.9, 2.0
  norm = norm.replace(/(?:^|(?<=\s))([+-]?\d[\d,]*\.\d+)(?=\s|[.,!?;:]|$)/g, (m) => decimalToWords(m));

  // 10. Expand Cardinals: e.g. 1,000, 42
  norm = norm.replace(/(?:^|(?<=\s))([+-]?\d[\d,]*)(?=\s|[.,!?;:]|$)/g, (m) => {
    const clean = m.replace(/,/g, '');
    try {
      return integerToWords(BigInt(clean));
    } catch {
      return m;
    }
  });

  // 11. Expand Abbreviations: e.g. dr., mr., vs., etc.
  norm = norm.replace(/\b(dr|mr|mrs|ms|prof|vs|etc|e\.g|i\.e|approx|dept|fig|sec|min)\./gi, (m) => {
    return COMMON_ABBREVIATIONS[m.toLowerCase()] || m;
  });

  // 12. Expand Acronyms: e.g. AI, TTS, GPU, CPU
  norm = norm.replace(/\b([A-Z]{2,5})\b/g, (word) => {
    if (ACRONYM_EXPANSIONS[word]) {
      return ACRONYM_EXPANSIONS[word];
    }
    // Expand any uppercase acronym to spaced letters unless in common short word list
    const COMMON_WORDS = new Set(['IN', 'ON', 'AT', 'TO', 'BY', 'OF', 'FOR', 'AND', 'OR', 'BUT', 'THE', 'NOT', 'IS', 'ARE', 'WAS', 'BE', 'SO', 'NO', 'YES', 'IT', 'HE', 'SHE', 'WE', 'ME', 'MY', 'UP', 'DO', 'GO', 'AN', 'AS', 'IF']);
    if (COMMON_WORDS.has(word)) {
      return word;
    }
    return word.split('').join(' ');
  });

  // 13. Clean up spacing and punctuation attachments
  return norm
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Creates an authoritative NarrationTextMap with bidirectional token mapping.
 * Invariant 1: originalText.slice(start, end) === originalWord.
 * Invariant 2: monotonic non-overlapping token intervals.
 * Invariant 3: spokenWords is a non-empty string array.
 */
export function createNarrationTextMap(
  originalText: string,
  options?: NormalizerOptions
): NarrationTextMap {
  if (!originalText || originalText.trim().length === 0) {
    return {
      version: '1.0.0',
      originalText: originalText || '',
      normalizedText: '',
      tokens: [],
      spokenText: '',
    };
  }

  const normalizedText = normalizeText(originalText, options);
  const tokens: NarrationToken[] = [];
  let tokenId = 0;

  let cursor = 0;
  const len = originalText.length;

  while (cursor < len) {
    // Skip whitespace
    if (/\s/.test(originalText[cursor])) {
      cursor++;
      continue;
    }

    const remaining = originalText.slice(cursor);
    let matchWord = '';
    let tokenType: TokenType = 'plain';
    let spokenWords: string[] = [];

    // 1. Check URL
    const urlMatch = remaining.match(/^https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) {
      matchWord = urlMatch[0];
      tokenType = 'url';
      spokenWords = expandUrl(matchWord).spokenWords;
    }

    // 2. Check Date (MM/DD/YYYY)
    if (!matchWord) {
      const dateMatch = remaining.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
      if (dateMatch) {
        matchWord = dateMatch[0];
        tokenType = 'date';
        spokenWords = dateToWords(matchWord).split(/\s+/).filter(Boolean);
      }
    }

    // 3. Check Currency
    if (!matchWord) {
      const currMatch = remaining.match(/^([+-]?\$\d[\d,]*(?:\.\d+)?|\$[+-]?\d[\d,]*(?:\.\d+)?)/i);
      if (currMatch) {
        matchWord = currMatch[0];
        tokenType = 'currency';
        spokenWords = currencyToWords(matchWord).split(/\s+/).filter(Boolean);
      }
    }

    // 4. Check Percentage
    if (!matchWord) {
      const pctMatch = remaining.match(/^[+-]?\d[\d,]*(?:\.\d+)?%/);
      if (pctMatch) {
        matchWord = pctMatch[0];
        tokenType = 'decimal';
        spokenWords = percentageToWords(matchWord).split(/\s+/).filter(Boolean);
      }
    }

    // 5. Check Units
    if (!matchWord) {
      for (const unitDef of UNIT_DEFINITIONS) {
        const uMatch = remaining.match(new RegExp(`^${unitDef.regexStr}\\b`, 'i'));
        if (uMatch) {
          matchWord = uMatch[0];
          tokenType = 'unit';
          const expanded = unitDef.expand(uMatch[1], uMatch[2] || '');
          spokenWords = expanded.spokenWords;
          break;
        }
      }
    }

    // 6. Check Ordinal numbers
    if (!matchWord) {
      const ordMatch = remaining.match(/^\d+(?:st|nd|rd|th)\b/i);
      if (ordMatch) {
        matchWord = ordMatch[0];
        tokenType = 'ordinal';
        const val = parseInt(matchWord, 10);
        spokenWords = ordinalToWords(val).split(/\s+/).filter(Boolean);
      }
    }

    // 7. Check Decimals
    if (!matchWord) {
      const decMatch = remaining.match(/^[+-]?\d[\d,]*\.\d+\b/);
      if (decMatch) {
        matchWord = decMatch[0];
        tokenType = 'decimal';
        spokenWords = decimalToWords(matchWord).split(/\s+/).filter(Boolean);
      }
    }

    // 8. Check Cardinals (integers)
    if (!matchWord) {
      const cardMatch = remaining.match(/^[+-]?\d[\d,]*\b/);
      if (cardMatch) {
        matchWord = cardMatch[0];
        tokenType = 'cardinal';
        const clean = matchWord.replace(/,/g, '');
        const val = parseInt(clean, 10);
        if (val >= 1000 && val <= 2999 && !matchWord.includes(',')) {
          // Year expansion: e.g. 2026 -> ['twenty', 'twenty-six']
          spokenWords = yearToWords(val).split(/\s+/).filter(Boolean);
        } else {
          spokenWords = integerToWords(BigInt(clean)).split(/\s+/).filter(Boolean);
        }
      }
    }

    // 9. Check Abbreviations
    if (!matchWord) {
      const abbrMatch = remaining.match(/^(?:dr|mr|mrs|ms|prof|vs|etc|e\.g|i\.e|approx|dept|fig|sec|min)\./i);
      if (abbrMatch) {
        matchWord = abbrMatch[0];
        tokenType = 'abbreviation';
        const exp = COMMON_ABBREVIATIONS[matchWord.toLowerCase()] || matchWord;
        spokenWords = exp.split(/\s+/).filter(Boolean);
      }
    }

    // 10. Check Acronyms
    if (!matchWord) {
      const acrMatch = remaining.match(/^([A-Z]{2,5})\b/);
      if (acrMatch) {
        const word = acrMatch[1];
        const COMMON_WORDS = new Set(['IN', 'ON', 'AT', 'TO', 'BY', 'OF', 'FOR', 'AND', 'OR', 'BUT', 'THE', 'NOT', 'IS', 'ARE', 'WAS', 'BE', 'SO', 'NO', 'YES', 'IT', 'HE', 'SHE', 'WE', 'ME', 'MY', 'UP', 'DO', 'GO', 'AN', 'AS', 'IF']);
        if (ACRONYM_EXPANSIONS[word] || !COMMON_WORDS.has(word)) {
          matchWord = word;
          tokenType = 'acronym';
          if (ACRONYM_EXPANSIONS[word]) {
            spokenWords = ACRONYM_EXPANSIONS[word].split(/\s+/).filter(Boolean);
          } else {
            spokenWords = word.split('');
          }
        }
      }
    }

    // 11. Check Plain Words
    if (!matchWord) {
      const wordMatch = remaining.match(/^[A-Za-z]+(?:['’\-][A-Za-z]+)*/);
      if (wordMatch) {
        matchWord = wordMatch[0];
        tokenType = 'plain';
        spokenWords = [matchWord];
      }
    }

    // 12. Check Punctuation or other symbols
    if (!matchWord) {
      const punctMatch = remaining.match(/^[.,!?;:()[\]"“”'—–-]/) || remaining.match(/^\S/);
      if (punctMatch) {
        matchWord = punctMatch[0];
        if (options?.includePunctuationTokens) {
          tokenType = 'punctuation';
          spokenWords = [matchWord];
        } else {
          // Skip punctuation symbol in default word tokenization
          cursor += matchWord.length;
          continue;
        }
      }
    }

    if (!matchWord) {
      cursor++;
      continue;
    }

    const start = cursor;
    const end = start + matchWord.length;

    tokens.push({
      id: `t${tokenId++}`,
      originalSpan: [start, end],
      originalWord: matchWord,
      spokenWords: spokenWords.length > 0 ? spokenWords : [matchWord],
      type: tokenType,
      normalized: spokenWords.join(' '),
    });

    cursor = end;
  }

  const spokenText = tokens
    .map((t) => t.spokenWords.join(' '))
    .filter(Boolean)
    .join(' ');

  return {
    version: '1.0.0',
    originalText,
    normalizedText,
    tokens,
    spokenText,
  };
}

/**
 * TextNormalizer class implementing the complete normalization interface.
 */
export class TextNormalizer {
  constructor(private options?: NormalizerOptions) {}

  /**
   * Returns normalized text string directly.
   * Enables: result.includes(...), result.toLowerCase()
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
   * Backward compatibility for Milestone 1 interfaces.
   */
  public normalizeWithResult(text: string): NormalizationResult {
    const textMap = this.createNarrationTextMap(text);
    return {
      originalText: textMap.originalText,
      normalizedText: textMap.normalizedText,
      spokenText: textMap.spokenText || textMap.normalizedText,
      tokens: textMap.tokens.map((t, idx) => ({
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
