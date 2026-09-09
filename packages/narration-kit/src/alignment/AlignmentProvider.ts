/**
 * packages/narration-kit/src/alignment/AlignmentProvider.ts
 * Core alignment interfaces and data structures.
 */

export interface WordTiming {
  id: string;
  text: string;
  normalizedText: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence?: number;
}

export interface AlignmentProvider {
  align(audioPath: string, transcript: string): Promise<WordTiming[]>;
}
