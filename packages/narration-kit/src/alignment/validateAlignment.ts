/**
 * packages/narration-kit/src/alignment/validateAlignment.ts
 * Alignment Quality Gates conforming to V3 R7 specification.
 * Throws explicit descriptive errors on any quality gate failure.
 */

import { WordTiming } from './AlignmentProvider';

export interface AlignmentValidationOptions {
  audioDurationSec?: number;
  minConfidence?: number;
  maxSilenceGapSec?: number;
  expectedWordCount?: number;
}

export interface AlignmentValidationReport {
  valid: boolean;
  totalWords: number;
  firstWordStart: number;
  lastWordEnd: number;
  minConfidence: number;
  maxSilenceGap: number;
  errors: string[];
}

export function validateAlignment(
  timings: WordTiming[],
  options: AlignmentValidationOptions = {}
): AlignmentValidationReport {
  const errors: string[] = [];
  const minConfidence = options.minConfidence ?? 0.6;
  const maxSilenceGap = options.maxSilenceGapSec ?? 4.0;

  if (!Array.isArray(timings) || timings.length === 0) {
    errors.push('Alignment contains zero word timings.');
    return {
      valid: false,
      totalWords: 0,
      firstWordStart: 0,
      lastWordEnd: 0,
      minConfidence: 0,
      maxSilenceGap: 0,
      errors,
    };
  }

  let observedMinConf = 1.0;
  let observedMaxSilence = 0;

  for (let i = 0; i < timings.length; i++) {
    const w = timings[i];

    // Gate 1: start >= 0
    if (w.start < 0) {
      errors.push(`Word [${w.id}: "${w.text}"] has negative start time (${w.start}s).`);
    }

    // Gate 2: end > start
    if (w.end <= w.start) {
      errors.push(`Word [${w.id}: "${w.text}"] has invalid duration: start=${w.start}s, end=${w.end}s.`);
    }

    // Gate 3 & 4: Monotonicity and overlap
    if (i > 0) {
      const prev = timings[i - 1];
      if (w.start < prev.start) {
        errors.push(
          `Timestamp decreased at word [${w.id}: "${w.text}"] (${w.start}s < ${prev.start}s).`
        );
      }
      if (w.start < prev.end - 0.001) {
        errors.push(
          `Word interval overlap between [${prev.id}: "${prev.text}"] (ends ${prev.end}s) and [${w.id}: "${w.text}"] (starts ${w.start}s).`
        );
      }

      // Check unexplained silence gaps
      const silence = w.start - prev.end;
      if (silence > observedMaxSilence) {
        observedMaxSilence = silence;
      }
      if (silence > maxSilenceGap) {
        errors.push(
          `Large unexplained silence gap (${silence.toFixed(2)}s) between "${prev.text}" and "${w.text}".`
        );
      }
    }

    if (w.confidence !== undefined) {
      if (w.confidence < observedMinConf) observedMinConf = w.confidence;
      if (w.confidence < minConfidence) {
        errors.push(
          `Word [${w.id}: "${w.text}"] confidence (${w.confidence}) falls below threshold (${minConfidence}).`
        );
      }
    }
  }

  // Gate 5: Final word exceeds audio duration
  const lastWord = timings[timings.length - 1];
  if (options.audioDurationSec !== undefined && lastWord.end > options.audioDurationSec + 0.05) {
    errors.push(
      `Final word [${lastWord.id}: "${lastWord.text}"] end (${lastWord.end}s) exceeds audio duration (${options.audioDurationSec}s).`
    );
  }

  // Expected word count check if supplied
  if (options.expectedWordCount !== undefined && timings.length !== options.expectedWordCount) {
    errors.push(
      `Transcript word count mismatch: expected ${options.expectedWordCount} words, aligned ${timings.length}.`
    );
  }

  return {
    valid: errors.length === 0,
    totalWords: timings.length,
    firstWordStart: timings[0].start,
    lastWordEnd: lastWord.end,
    minConfidence: observedMinConf,
    maxSilenceGap: observedMaxSilence,
    errors,
  };
}
