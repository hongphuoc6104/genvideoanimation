/**
 * packages/narration-kit/src/alignment/validateAlignment.ts
 * Alignment Quality Gates conforming to V3 R7 specification.
 * Validates timestamp monotonicity, 20ms phonetic overlap limit,
 * mean confidence threshold, script token fidelity, and silence anomalies.
 */

import { WordTiming } from './AlignmentProvider';

export interface AlignmentValidationOptions {
  audioDurationSec?: number;
  minConfidence?: number;
  maxSilenceGapSec?: number;
  expectedWordCount?: number;
  maxPhoneticOverlapSec?: number;
  scriptWords?: string[];
}

export interface AlignmentValidationReport {
  valid: boolean;
  totalWords: number;
  firstWordStart: number;
  lastWordEnd: number;
  minConfidence: number;
  meanConfidence: number;
  maxSilenceGap: number;
  errors: string[];
}

export function validateAlignment(
  timings: WordTiming[],
  optionsOrScriptWords?: AlignmentValidationOptions | string[]
): AlignmentValidationReport {
  const errors: string[] = [];

  const options: AlignmentValidationOptions = Array.isArray(optionsOrScriptWords)
    ? { scriptWords: optionsOrScriptWords }
    : optionsOrScriptWords || {};

  const minConfidence = options.minConfidence ?? 0.6;
  const maxSilenceGap = options.maxSilenceGapSec ?? 4.0;
  const maxOverlapSec = options.maxPhoneticOverlapSec ?? 0.02; // 20ms phonetic overlap limit

  if (!Array.isArray(timings) || timings.length === 0) {
    errors.push('Alignment contains zero word timings.');
    return {
      valid: false,
      totalWords: 0,
      firstWordStart: 0,
      lastWordEnd: 0,
      minConfidence: 0,
      meanConfidence: 0,
      maxSilenceGap: 0,
      errors,
    };
  }

  // Token count check against script words if provided
  if (options.scriptWords && timings.length !== options.scriptWords.length) {
    errors.push(
      `Token count mismatch: expected ${options.scriptWords.length}, got ${timings.length}`
    );
  } else if (options.expectedWordCount !== undefined && timings.length !== options.expectedWordCount) {
    errors.push(
      `Transcript word count mismatch: expected ${options.expectedWordCount} words, aligned ${timings.length}.`
    );
  }

  let observedMinConf = 1.0;
  let totalConfidence = 0;
  let observedMaxSilence = 0;

  for (let i = 0; i < timings.length; i++) {
    const w = timings[i];
    const wordDisplay = w.word || w.text || `w${i}`;

    // Gate 1: start >= 0
    if (w.start < 0) {
      errors.push(`Word [${w.id}: "${wordDisplay}"] has negative start time (${w.start}s).`);
    }

    // Gate 2: end > start
    if (w.end <= w.start) {
      errors.push(
        `Word [${w.id}: "${wordDisplay}"] end ${w.end} <= start ${w.start}`
      );
    }

    // Gate 3 & 4: Monotonicity and phonetic overlap
    if (i > 0) {
      const prev = timings[i - 1];
      const prevDisplay = prev.word || prev.text || `w${i - 1}`;

      if (w.start < prev.start) {
        errors.push(
          `Word ${w.id} start ${w.start} is before preceding word start ${prev.start}`
        );
      }

      // Adjoining word phonetic overlap limit: maximum 20ms (0.02s) allowed
      const overlap = prev.end - w.start;
      if (overlap > maxOverlapSec + 1e-4) {
        errors.push(
          `Word interval overlap between [${prev.id}: "${prevDisplay}"] (ends ${prev.end}s) and [${w.id}: "${wordDisplay}"] (starts ${w.start}s) exceeds ${Math.round(maxOverlapSec * 1000)}ms.`
        );
      }

      // Check unexplained silence gaps
      const silence = w.start - prev.end;
      if (silence > observedMaxSilence) {
        observedMaxSilence = silence;
      }
      if (silence > maxSilenceGap) {
        errors.push(
          `Large unexplained silence gap (${silence.toFixed(2)}s) between "${prevDisplay}" and "${wordDisplay}".`
        );
      }
    }

    const conf = w.confidence !== undefined ? w.confidence : 1.0;
    totalConfidence += conf;
    if (conf < observedMinConf) observedMinConf = conf;

    // Check script word fidelity if provided
    if (options.scriptWords && options.scriptWords[i]) {
      const actualClean = (w.cleanWord || w.normalizedText || w.word || w.text || '').toLowerCase();
      const expectedClean = options.scriptWords[i].toLowerCase();
      if (actualClean !== expectedClean) {
        errors.push(
          `Word mismatch at ${i}: expected "${options.scriptWords[i]}", got "${actualClean}"`
        );
      }
    }
  }

  const meanConfidence = totalConfidence / timings.length;
  if (meanConfidence < minConfidence) {
    errors.push(`Mean confidence ${meanConfidence.toFixed(2)} is below ${minConfidence}`);
  }

  // Gate 5: Final word exceeds audio duration
  const lastWord = timings[timings.length - 1];
  if (options.audioDurationSec !== undefined && lastWord.end > options.audioDurationSec + 0.05) {
    const wordDisplay = lastWord.word || lastWord.text || lastWord.id;
    errors.push(
      `Final word [${lastWord.id}: "${wordDisplay}"] end (${lastWord.end}s) exceeds audio duration (${options.audioDurationSec}s).`
    );
  }

  return {
    valid: errors.length === 0,
    totalWords: timings.length,
    firstWordStart: timings[0].start,
    lastWordEnd: lastWord.end,
    minConfidence: observedMinConf,
    meanConfidence,
    maxSilenceGap: observedMaxSilence,
    errors,
  };
}
