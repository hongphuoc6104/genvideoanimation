/**
 * packages/narration-kit/src/normalization/types.ts
 * Authoritative types for text normalization and bidirectional token mapping.
 */

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

export interface NarrationToken {
  id: string;
  originalSpan: [number, number];
  originalWord: string;
  spokenWords: string[];
  type: TokenType;
  normalized?: string;
}

export interface NarrationTextMap {
  version: '1.0.0';
  originalText: string;
  normalizedText: string;
  tokens: NarrationToken[];
  spokenText?: string;
}

export interface NormalizerOptions {
  locale?: string;
  includePunctuationTokens?: boolean;
}

// Backward compatibility interfaces
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
}
