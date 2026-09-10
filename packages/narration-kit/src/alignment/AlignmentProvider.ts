/**
 * packages/narration-kit/src/alignment/AlignmentProvider.ts
 * Core alignment interfaces and data structures conforming to words.json specification.
 */

export interface WordTiming {
  id: string;
  word: string;
  cleanWord: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence: number;
  punctuation: string;
  // Backward compatibility fields
  text?: string;
  normalizedText?: string;
}

export type AlignedWord = WordTiming;

export interface AlignmentProvider {
  align(audioPath: string, transcript: string, textMapPath?: string): Promise<WordTiming[]>;
}
