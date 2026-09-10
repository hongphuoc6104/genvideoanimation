/**
 * packages/narration-kit/src/normalization/types.ts
 * Authoritative types for text normalization, language-aware tokenization,
 * hierarchical lexicons, and bidirectional token mapping for V3.1 bilingual production.
 */

// Legacy token types for backward compatibility
export type TokenType =
  | 'cardinal'
  | 'ordinal'
  | 'decimal'
  | 'acronym'
  | 'abbreviation'
  | 'currency'
  | 'unit'
  | 'url'
  | 'date'
  | 'plain'
  | 'punctuation';

// V3.1 10 Semantic Token Types (Requirement R3)
export type SemanticTokenType =
  | 'VIETNAMESE'
  | 'ENGLISH_WORD'
  | 'ENGLISH_PHRASE'
  | 'ACRONYM'
  | 'INITIALISM'
  | 'PROPER_NOUN'
  | 'NUMBER'
  | 'UNIT'
  | 'FORMULA'
  | 'MODEL_NAME';

// V3.1 5 Pronunciation Modes (Requirement R4)
export type PronunciationMode =
  | 'vi'
  | 'en_word'
  | 'en_phrase'
  | 'en_spell'
  | 'custom';

export interface LexiconEntry {
  term: string;
  type: SemanticTokenType;
  mode: PronunciationMode;
  spoken: string;
  case_sensitive?: boolean;
  notes?: string;
  phonemes?: string;
}

export interface LexiconFile {
  version: string;
  domain: 'custom' | 'academic' | 'technology';
  description?: string;
  entries: LexiconEntry[];
}

export interface LanguageSpan {
  id: string;
  span: [number, number];
  text: string;
  semanticType: SemanticTokenType;
  pronunciationMode: PronunciationMode;
  spoken: string;
  sourceLexicon?: string;
}

export interface PronunciationMapEntry {
  token: string;
  displayToken: string;
  semanticType: SemanticTokenType;
  pronunciationMode: PronunciationMode;
  spokenUnits: string[];
  spokenText: string;
  originalSpan: [number, number];
  sourceLexicon?: string;
}

export interface NarrationToken {
  id: string;
  originalSpan: [number, number];
  originalWord: string;
  spokenWords: string[];
  type: TokenType | SemanticTokenType;
  normalized?: string;
  semanticType?: SemanticTokenType;
  pronunciationMode?: PronunciationMode;
  spokenText?: string;
}

export interface NarrationTextMap {
  version: '1.0.0';
  originalText: string;
  normalizedText: string;
  tokens: NarrationToken[];
  spokenText?: string;
  displayText?: string;
  languageSpans?: LanguageSpan[];
  pronunciationMap?: PronunciationMapEntry[];
}

export interface NormalizerOptions {
  locale?: string;
  includePunctuationTokens?: boolean;
  lexiconsDir?: string;
  strictAcronymCheck?: boolean;
}

export interface TokenMapping {
  id: string;
  original: string;
  normalized: string;
  spoken: string;
  startChar: number;
  endChar: number;
  isPunctuation?: boolean;
}

export interface NormalizationResult {
  originalText: string;
  normalizedText: string;
  spokenText: string;
  tokens: TokenMapping[];
  displayText?: string;
  languageSpans?: LanguageSpan[];
  pronunciationMap?: PronunciationMapEntry[];
}

export class UnregisteredAcronymError extends Error {
  public readonly acronym: string;
  public readonly span: [number, number];

  constructor(acronym: string, span: [number, number]) {
    super(
      `[UnregisteredAcronymError]: Token '${acronym}' at span [${span[0]}, ${span[1]}] is an unregistered uppercase acronym.\n` +
      `Silent guessing is strictly prohibited by R4 and R11.\n` +
      `Action required: Register '${acronym}' in lexicons/academic-vi-en.yaml, lexicons/technology-vi-en.yaml, or lexicons/custom.yaml.`
    );
    this.name = 'UnregisteredAcronymError';
    this.acronym = acronym;
    this.span = span;
  }
}
