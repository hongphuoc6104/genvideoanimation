/**
 * packages/narration-kit/src/normalization/languageAwareTokenizer.ts
 * Language-Aware Tokenizer and Classifier for V3.1 Bilingual Vietnamese-First Narration.
 * Complying with Requirements R2, R3, R4, R5, R6, and R11:
 * - 10 Semantic token types
 * - 5 Pronunciation modes
 * - Multi-word phrase matching via hierarchical lexicons
 * - Vietnamese Unicode diacritic preservation
 * - Strict unregistered acronym halt
 * - Dual text representation: displayText !== spokenText
 */

import { LexiconManager, ResolvedLexiconMatch } from './lexiconManager';
import {
  LanguageSpan,
  NarrationTextMap,
  NarrationToken,
  NormalizerOptions,
  PronunciationMapEntry,
  PronunciationMode,
  SemanticTokenType,
  UnregisteredAcronymError,
} from './types';
import { normalizeVietnameseNumberToken } from './vietnameseNumberNormalizer';

export interface TokenizeBilingualResult {
  displayText: string;
  spokenText: string;
  languageSpans: LanguageSpan[];
  pronunciationMap: PronunciationMapEntry[];
  tokens: NarrationToken[];
  stats: {
    totalTokens: number;
    vietnameseCount: number;
    vietnameseRatio: number;
    codeSwitchTerms: number;
  };
}

// Common Vietnamese syllable phonotactics and stopwords
const VIETNAMESE_COMMON_WORDS = new Set([
  'là', 'một', 'phần', 'quan', 'trọng', 'khi', 'viết', 'bài', 'báo', 'và', 'các', 'của',
  'trong', 'được', 'cho', 'với', 'những', 'này', 'đó', 'từ', 'có', 'thể', 'về', 'nghiên',
  'cứu', 'khoảng', 'trống', 'học', 'thuật', 'tạp', 'chí', 'quốc', 'tế', 'hướng', 'dẫn',
  'xác', 'định', 'chuẩn', 'phương', 'pháp', 'luận', 'tổng', 'quan', 'bản', 'chất', 'phân',
  'loại', 'quy', 'trình', 'bước', 'lập', 'luận', 'cấu', 'trúc', 'tầng', 'câu', 'mẫu',
  'cạm', 'bẫy', 'cần', 'tránh', 'năm', 'tháng', 'ngày', 'mô', 'hình', 'đưa', 'ra', 'kết',
  'quả', 'đánh', 'giá', 'hội', 'đồng', 'biên', 'tập', 'nghiên', 'cứu', 'sinh', 'khoa', 'học',
  'dữ', 'liệu', 'phân', 'tích', 'thực', 'nghiệm', 'giải', 'pháp', 'hệ', 'thống', 'tự', 'động',
  'công', 'bố', 'thành', 'công', 'chấp', 'nhận', 'từ', 'chối', 'điểm', 'cân', 'bằng', 'chỉ', 'rõ'
]);

export class LanguageAwareTokenizer {
  private lexiconManager: LexiconManager;

  constructor(options?: NormalizerOptions) {
    this.lexiconManager = LexiconManager.getInstance(options?.lexiconsDir);
  }

  /**
   * Tokenizes and classifies bilingual Vietnamese-English text.
   */
  public tokenize(text: string, options?: NormalizerOptions): TokenizeBilingualResult {
    const rawText = text;
    const spans: LanguageSpan[] = [];
    const pronMap: PronunciationMapEntry[] = [];
    const tokens: NarrationToken[] = [];

    const strict = options?.strictAcronymCheck ?? true;
    let cursor = 0;
    let spanCounter = 1;

    // Scan through input text
    while (cursor < rawText.length) {
      // 1. Skip whitespace
      const remaining = rawText.slice(cursor);
      const wsMatch = remaining.match(/^\s+/);
      if (wsMatch) {
        cursor += wsMatch[0].length;
        continue;
      }

      const currentRemaining = rawText.slice(cursor);

      // 2. Try phrase matching from Lexicons first (e.g. "Research Gap", "Web of Science")
      const phraseMatch = this.lexiconManager.matchAt(currentRemaining);
      if (phraseMatch && (phraseMatch.type === 'ENGLISH_PHRASE' || phraseMatch.matchedText.includes(' '))) {
        const spanText = phraseMatch.matchedText;
        const startChar = cursor;
        const endChar = cursor + spanText.length;

        const spanId = `span_${spanCounter++}`;
        const spanObj: LanguageSpan = {
          id: spanId,
          span: [startChar, endChar],
          text: spanText,
          semanticType: phraseMatch.type,
          pronunciationMode: phraseMatch.mode,
          spoken: phraseMatch.spoken,
          sourceLexicon: phraseMatch.sourceLexicon,
        };
        spans.push(spanObj);

        // Token entry
        const spokenWords = phraseMatch.spokenUnits;
        tokens.push({
          id: spanId,
          originalSpan: [startChar, endChar],
          originalWord: spanText,
          spokenWords,
          type: phraseMatch.type,
          semanticType: phraseMatch.type,
          pronunciationMode: phraseMatch.mode,
          spokenText: phraseMatch.spoken,
        });

        // Pronunciation map entry
        pronMap.push({
          token: spanText,
          displayToken: spanText,
          semanticType: phraseMatch.type,
          pronunciationMode: phraseMatch.mode,
          spokenUnits: phraseMatch.spokenUnits,
          spokenText: phraseMatch.spoken,
          originalSpan: [startChar, endChar],
          sourceLexicon: phraseMatch.sourceLexicon,
        });

        cursor = endChar;
        continue;
      }

      // 3. Match single token or symbols
      // Recognize words with Unicode letters (Vietnamese diacritics), numbers, hyphens, and model identifiers
      const tokenMatch = currentRemaining.match(
        /^([\p{L}\p{M}0-9]+(?:[\-_\/][\p{L}\p{M}0-9]+)*|[^\s\p{L}\p{M}0-9]+)/u
      );

      if (!tokenMatch) {
        // Fallback single character advance
        cursor++;
        continue;
      }

      const matchedToken = tokenMatch[1];
      const startChar = cursor;
      const endChar = cursor + matchedToken.length;

      // Handle pure punctuation/symbols
      if (/^[^\s\p{L}\p{M}0-9]+$/u.test(matchedToken)) {
        if (options?.includePunctuationTokens !== false) {
          const spanId = `span_${spanCounter++}`;
          tokens.push({
            id: spanId,
            originalSpan: [startChar, endChar],
            originalWord: matchedToken,
            spokenWords: [matchedToken],
            type: 'punctuation',
            spokenText: matchedToken,
          });
        }
        cursor = endChar;
        continue;
      }

      // Check context for number normalization
      const prevWord = tokens.length > 0 ? tokens[tokens.length - 1].originalWord : undefined;
      const nextContextMatch = rawText.slice(endChar).match(/^\s+([\p{L}\p{M}0-9]+)/u);
      const nextWord = nextContextMatch ? nextContextMatch[1] : undefined;

      // Classify the token
      const classification = this.classifySingleToken(
        matchedToken,
        [startChar, endChar],
        { prevWord, nextWord, strict }
      );

      const spanId = `span_${spanCounter++}`;
      const spanObj: LanguageSpan = {
        id: spanId,
        span: [startChar, endChar],
        text: matchedToken,
        semanticType: classification.type,
        pronunciationMode: classification.mode,
        spoken: classification.spoken,
        sourceLexicon: classification.sourceLexicon,
      };
      spans.push(spanObj);

      const spokenWords = classification.spokenUnits;
      tokens.push({
        id: spanId,
        originalSpan: [startChar, endChar],
        originalWord: matchedToken,
        spokenWords,
        type: classification.type,
        semanticType: classification.type,
        pronunciationMode: classification.mode,
        spokenText: classification.spoken,
      });

      pronMap.push({
        token: matchedToken,
        displayToken: matchedToken,
        semanticType: classification.type,
        pronunciationMode: classification.mode,
        spokenUnits: classification.spokenUnits,
        spokenText: classification.spoken,
        originalSpan: [startChar, endChar],
        sourceLexicon: classification.sourceLexicon,
      });

      cursor = endChar;
    }

    // Reconstruct displayText and spokenText using Smart Punctuation Joiner
    const displayText = rawText;
    const CLOSING_PUNCT = /^[.,!?;:…\)\]\}”'’]+$/;
    const OPENING_PUNCT = /^[\(\[\{“'‘]+$/;

    let spokenText = '';
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const word = (
        t.spokenText ||
        (t.spokenWords && t.spokenWords.length > 0 ? t.spokenWords.join(' ') : t.originalWord) ||
        ''
      ).trim();

      if (!word) continue;

      if (spokenText.length === 0) {
        spokenText = word;
      } else if (CLOSING_PUNCT.test(word)) {
        spokenText += word;
      } else if (OPENING_PUNCT.test(spokenText.slice(-1))) {
        spokenText += word;
      } else {
        spokenText += ' ' + word;
      }
    }

    spokenText = spokenText
      .replace(/\s+([,.;:!?…\)\]\}”'’])/g, '$1')
      .replace(/([\(\[\{“'‘])\s+/g, '$1')
      .trim();

    // Calculate language statistics
    let viCount = 0;
    let codeSwitchCount = 0;

    for (const s of spans) {
      if (s.semanticType === 'VIETNAMESE' || (s.semanticType === 'NUMBER' && s.pronunciationMode === 'vi')) {
        viCount++;
      } else if (
        s.semanticType === 'ENGLISH_WORD' ||
        s.semanticType === 'ENGLISH_PHRASE' ||
        s.semanticType === 'INITIALISM' ||
        s.semanticType === 'ACRONYM' ||
        s.semanticType === 'MODEL_NAME'
      ) {
        codeSwitchCount++;
      }
    }

    const totalSemanticTokens = spans.length || 1;
    const vietnameseRatio = Math.round((viCount / totalSemanticTokens) * 10000) / 100;

    return {
      displayText,
      spokenText,
      languageSpans: spans,
      pronunciationMap: pronMap,
      tokens,
      stats: {
        totalTokens: spans.length,
        vietnameseCount: viCount,
        vietnameseRatio,
        codeSwitchTerms: codeSwitchCount,
      },
    };
  }

  /**
   * Classifies a single token into one of the 10 Semantic Types & 5 Pronunciation Modes
   */
  private classifySingleToken(
    token: string,
    span: [number, number],
    context: { prevWord?: string; nextWord?: string; strict?: boolean }
  ): {
    type: SemanticTokenType;
    mode: PronunciationMode;
    spoken: string;
    spokenUnits: string[];
    sourceLexicon?: string;
  } {
    // 1. Check Lexicons first (highest priority)
    const lexMatch = this.lexiconManager.lookup(token);
    if (lexMatch) {
      return {
        type: lexMatch.type,
        mode: lexMatch.mode,
        spoken: lexMatch.spoken,
        spokenUnits: lexMatch.spokenUnits,
        sourceLexicon: lexMatch.sourceLexicon,
      };
    }

    // 2. Strict Acronym check: If token is all uppercase (length >= 2), halt if not in lexicon
    if (/^[A-Z][A-Z0-9\-]{1,}$/.test(token)) {
      this.lexiconManager.verifyAcronym(token, span, context.strict);
    }

    // 3. Numbers, Percentages, Currencies, Decimals
    if (/^-?\d+(?:[.,]\d+)?%?$/.test(token) || /^\$\d+/.test(token)) {
      const normalizedSpoken = normalizeVietnameseNumberToken(token, {
        prevWord: context.prevWord,
        nextWord: context.nextWord,
      });

      return {
        type: 'NUMBER',
        mode: 'vi',
        spoken: normalizedSpoken,
        spokenUnits: normalizedSpoken.split(/\s+/).filter(Boolean),
      };
    }

    // 4. Units (fps, kHz, ms, dB, etc.)
    if (/^(fps|kHz|ms|dB|dBFS|GB|MB|kbps|px)$/i.test(token)) {
      return {
        type: 'UNIT',
        mode: 'vi',
        spoken: token,
        spokenUnits: [token],
      };
    }

    // 5. Alphanumeric Model / Spec / Ranking identifiers (e.g., Q1, Q2, GPT-5, H-index, v3, 9x16)
    if (/^[A-Za-z]+[0-9]+[A-Za-z0-9\-]*$/.test(token) || /^[0-9]+[xX][0-9]+$/.test(token)) {
      // Model names
      return {
        type: 'MODEL_NAME',
        mode: 'custom',
        spoken: token,
        spokenUnits: [token],
      };
    }

    // 6. Vietnamese text detection (contains Vietnamese diacritics or is in common Vietnamese vocabulary)
    const hasVietnameseDiacritic = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(
      token
    );

    if (hasVietnameseDiacritic || VIETNAMESE_COMMON_WORDS.has(token.toLowerCase())) {
      return {
        type: 'VIETNAMESE',
        mode: 'vi',
        spoken: token,
        spokenUnits: [token],
      };
    }

    // 7. Capitalized Proper Nouns
    if (/^[A-Z][a-z]+$/.test(token)) {
      return {
        type: 'ENGLISH_WORD',
        mode: 'en_word',
        spoken: token,
        spokenUnits: [token],
      };
    }

    // 8. Default fallback: Classified as English Word or Vietnamese Word based on ASCII chars
    if (/^[A-Za-z]+$/.test(token)) {
      return {
        type: 'ENGLISH_WORD',
        mode: 'en_word',
        spoken: token,
        spokenUnits: [token],
      };
    }

    return {
      type: 'VIETNAMESE',
      mode: 'vi',
      spoken: token,
      spokenUnits: [token],
    };
  }
}
