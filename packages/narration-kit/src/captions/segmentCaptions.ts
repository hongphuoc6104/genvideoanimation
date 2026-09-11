/**
 * packages/narration-kit/src/captions/segmentCaptions.ts
 * Punctuation- & Pause-Aware Caption Segmentation Engine conforming to V3 CaptionsManifest.
 */

import { WordTiming } from '../alignment/AlignmentProvider';
import {
  CaptionGroup,
  CaptionLine,
  CaptionWord,
  CaptionsManifest,
  SegmentOptions,
} from './types';
import { resolveCaptionPlacement } from './safePlacement';

const SENTENCE_PUNCTUATION = new Set(['.', '?', '!']);
const CLAUSE_PUNCTUATION = new Set([',', ';', ':', '—', '-']);

/**
 * Checks if a word token has sentence-ending punctuation.
 */
function isSentenceEnd(w: WordTiming): boolean {
  if (w.punctuation && SENTENCE_PUNCTUATION.has(w.punctuation.trim())) return true;
  const lastChar = w.word.trim().slice(-1);
  return SENTENCE_PUNCTUATION.has(lastChar);
}

/**
 * Checks if a word token has clause-ending punctuation.
 */
function isClauseEnd(w: WordTiming): boolean {
  if (w.punctuation && CLAUSE_PUNCTUATION.has(w.punctuation.trim())) return true;
  const lastChar = w.word.trim().slice(-1);
  return CLAUSE_PUNCTUATION.has(lastChar);
}

/**
 * Determines whether an array of words can be split into at most 2 lines
 * with each line having length <= maxCharsPerLine.
 */
function canFitInTwoLines(words: WordTiming[], maxCharsPerLine: number = 42): boolean {
  if (words.length === 0) return true;
  const fullText = words.map((w) => w.word).join(' ');
  if (fullText.length <= maxCharsPerLine) return true;

  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).map((w) => w.word).join(' ');
    const l2 = words.slice(i).map((w) => w.word).join(' ');
    if (l1.length <= maxCharsPerLine && l2.length <= maxCharsPerLine) {
      return true;
    }
  }
  return false;
}

/**
 * Splits a slice of WordTiming tokens into 1 or 2 lines satisfying <= maxCharsPerLine.
 */
function splitIntoLines(
  words: WordTiming[],
  fps: number,
  maxCharsPerLine: number = 42
): CaptionLine[] {
  if (words.length === 0) return [];

  const mapWord = (w: WordTiming): CaptionWord => {
    const sFrame = Math.round(w.start * fps);
    const eFrame = Math.max(sFrame + 1, Math.round(w.end * fps));
    return {
      id: w.id,
      word: w.word,
      start: w.start,
      end: w.end,
      startFrame: sFrame,
      endFrame: eFrame,
      cleanWord: w.cleanWord,
      confidence: w.confidence,
      punctuation: w.punctuation,
      subunits: w.subunits,
    };
  };

  const fullText = words.map((w) => w.word).join(' ');

  // If entire phrase fits on 1 line
  if (fullText.length <= maxCharsPerLine) {
    return [
      {
        text: fullText,
        words: words.map(mapWord),
      },
    ];
  }

  // Must split into 2 lines. Find optimal split point.
  let bestSplit = -1;
  let bestScore = Infinity;

  for (let i = 1; i < words.length; i++) {
    const line1Words = words.slice(0, i);
    const line2Words = words.slice(i);
    const text1 = line1Words.map((w) => w.word).join(' ');
    const text2 = line2Words.map((w) => w.word).join(' ');

    if (text1.length > maxCharsPerLine || text2.length > maxCharsPerLine) {
      continue;
    }

    // Heuristic score: minimize length imbalance + reward clause punctuation break
    const balancePenalty = Math.abs(text1.length - text2.length);
    const lastWordLine1 = line1Words[line1Words.length - 1];
    const punctuationBonus = isClauseEnd(lastWordLine1) ? -15 : 0;
    const score = balancePenalty + punctuationBonus;

    if (score < bestScore) {
      bestScore = score;
      bestSplit = i;
    }
  }

  // Fallback if no clean 2-line split found: greedy split at maxCharsPerLine
  if (bestSplit === -1) {
    let currentLen = 0;
    bestSplit = 1;
    for (let i = 0; i < words.length; i++) {
      const addedLen = (currentLen === 0 ? 0 : 1) + words[i].word.length;
      if (currentLen + addedLen <= maxCharsPerLine) {
        currentLen += addedLen;
        bestSplit = i + 1;
      } else {
        break;
      }
    }
    bestSplit = Math.max(1, Math.min(bestSplit, words.length - 1));
  }

  const l1Words = words.slice(0, bestSplit);
  const l2Words = words.slice(bestSplit);

  return [
    {
      text: l1Words.map((w) => w.word).join(' '),
      words: l1Words.map(mapWord),
    },
    {
      text: l2Words.map((w) => w.word).join(' '),
      words: l2Words.map(mapWord),
    },
  ];
}

/**
 * Segments aligned word timings into canonical captions.json manifest.
 */
export function segmentCaptions(
  words: WordTiming[],
  options: SegmentOptions = {}
): CaptionsManifest {
  const fps = options.fps ?? options.shotSpec?.fps ?? 30;
  const isPortrait = options.viewport
    ? options.viewport.height > options.viewport.width
    : options.shotSpec?.viewport
    ? options.shotSpec.viewport.height > options.shotSpec.viewport.width
    : true; // Default to 9:16 vertical in V3.1
  const defaultMaxChars = isPortrait ? 26 : 42;
  const maxCharsPerLine = options.maxCharsPerLine ?? defaultMaxChars;
  const maxCps = options.maxCps ?? 21.0;
  const minDurationSec = options.minDurationSec ?? 0.8;
  const maxDurationSec = options.maxDurationSec ?? 7.0;
  const pauseThreshold = options.acousticPauseThresholdSec ?? 0.3;

  if (!words || words.length === 0) {
    return {
      version: '1.0.0',
      fps,
      groups: [],
    };
  }

  // 1. Partition words into candidate group token clusters
  const groupWordClusters: WordTiming[][] = [];
  let currentCluster: WordTiming[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentCluster.push(w);

    const isLastWord = i === words.length - 1;
    if (isLastWord) {
      groupWordClusters.push(currentCluster);
      break;
    }

    const nextWord = words[i + 1];
    const pause = nextWord.start - w.end;
    const isSentence = isSentenceEnd(w);
    const isClause = isClauseEnd(w);
    const isAcousticPause = pause >= pauseThreshold;
    const currentDuration = nextWord.end - currentCluster[0].start;

    // Line capacity check: can current cluster + nextWord fit within 2 lines of maxCharsPerLine?
    const exceedsCapacity = !canFitInTwoLines([...currentCluster, nextWord], maxCharsPerLine);
    const exceedsMaxDuration = currentDuration > maxDurationSec;
    const exceedsWordLimit = currentCluster.length >= 8; // Enforce compact 4-8 word chunks

    // Boundary decision
    let shouldBreak = false;

    if (exceedsCapacity || exceedsMaxDuration || exceedsWordLimit) {
      shouldBreak = true;
    } else if (isSentence) {
      shouldBreak = true;
    } else if (isAcousticPause && currentCluster.length >= 2) {
      shouldBreak = true;
    } else if (isClause && currentCluster.length >= 3 && currentDuration >= minDurationSec) {
      // Clause boundary if group already has enough length
      shouldBreak = true;
    }

    if (shouldBreak) {
      groupWordClusters.push(currentCluster);
      currentCluster = [];
    }
  }

  // 2. Build preliminary CaptionGroup objects
  const viewport = options.viewport ?? options.shotSpec?.viewport ?? { width: 1920, height: 1080 };
  const safeMargin = options.safeMargin ?? options.shotSpec?.safe_margin ?? 96;
  const requestedPosition = options.position ?? options.shotSpec?.caption_position ?? 'bottom';
  const subjectRegion = options.shotSpec?.subject_region;

  interface IntermediateGroup {
    id: string;
    cluster: WordTiming[];
    lines: CaptionLine[];
    spokenStart: number;
    spokenEnd: number;
    startFrame: number;
    rawEndFrame: number;
    totalChars: number;
  }

  const rawGroups: IntermediateGroup[] = [];

  for (let gIdx = 0; gIdx < groupWordClusters.length; gIdx++) {
    const cluster = groupWordClusters[gIdx];
    const lines = splitIntoLines(cluster, fps, maxCharsPerLine);
    const firstWord = cluster[0];
    const lastWord = cluster[cluster.length - 1];
    const spokenStart = firstWord.start;
    const spokenEnd = lastWord.end;
    const totalChars = lines.reduce((acc, l) => acc + l.text.length, 0);

    const sFrame = (firstWord as any).startFrame !== undefined
      ? (firstWord as any).startFrame
      : Math.round(firstWord.start * fps);

    const eFrame = (lastWord as any).endFrame !== undefined
      ? (lastWord as any).endFrame
      : Math.max(sFrame + 1, Math.round(lastWord.end * fps));

    rawGroups.push({
      id: `g${gIdx}`,
      cluster,
      lines,
      spokenStart,
      spokenEnd,
      startFrame: sFrame,
      rawEndFrame: eFrame,
      totalChars,
    });
  }

  // 3. Timing Derivation: Enforce Acoustic Anchor Law & Seamless Boundary Handoff
  const resolvedGroups: Array<{
    id: string;
    cluster: WordTiming[];
    lines: CaptionLine[];
    startFrame: number;
    endFrame: number;
    startTime: number;
    endTime: number;
  }> = [];

  for (let i = 0; i < rawGroups.length; i++) {
    const curr = rawGroups[i];
    // Acoustic Anchor Law: startFrame is strictly anchored to firstWord
    const startFrame = curr.startFrame;
    let endFrame = curr.rawEndFrame;

    if (i < rawGroups.length - 1) {
      const next = rawGroups[i + 1];
      const nextStartFrame = next.startFrame;
      const gap = nextStartFrame - curr.rawEndFrame;

      if (gap <= 2) {
        // Tight acoustic gap (<= 2 frames / 66ms): immediate seamless contiguous handoff
        endFrame = Math.max(startFrame + 1, nextStartFrame - 1);
      } else {
        // Inter-chunk pause: hold briefly (clamped to <= 3 frames, never encroaching next), then unmount
        const postHold = Math.min(3, Math.max(0, gap - 1));
        endFrame = Math.min(curr.rawEndFrame + postHold, nextStartFrame - 1);
      }
    } else {
      // Final group: post-speech hold
      const minDurFrames = minDurationSec ? Math.ceil(minDurationSec * fps) : 3;
      endFrame = Math.max(curr.rawEndFrame + 3, startFrame + minDurFrames);
    }

    if (maxDurationSec) {
      const maxDurFrames = Math.floor(maxDurationSec * fps);
      if (endFrame - startFrame > maxDurFrames) {
        endFrame = startFrame + maxDurFrames;
      }
    }

    // Ensure endFrame > startFrame
    if (endFrame <= startFrame) {
      endFrame = startFrame + 1;
    }

    resolvedGroups.push({
      id: curr.id,
      cluster: curr.cluster,
      lines: curr.lines,
      startFrame,
      endFrame,
      startTime: Number((startFrame / fps).toFixed(3)),
      endTime: Number((endFrame / fps).toFixed(3)),
    });
  }

  // If explicit broadcast reading limit (maxCps) was requested, enforce reading expansion:
  if (options.maxCps !== undefined) {
    for (let i = 0; i < resolvedGroups.length; i++) {
      const curr = resolvedGroups[i];
      const totalChars = curr.lines.reduce((acc, l) => acc + l.text.length, 0);
      const minReadingFrames = Math.ceil((totalChars / options.maxCps) * fps);
      const minDurFrames = minDurationSec ? Math.ceil(minDurationSec * fps) : 0;
      const requiredFrames = Math.max(minReadingFrames, minDurFrames);

      if (curr.endFrame - curr.startFrame < requiredFrames) {
        curr.endFrame = curr.startFrame + requiredFrames;
        curr.endTime = Number((curr.endFrame / fps).toFixed(3));
      }

      if (i < resolvedGroups.length - 1) {
        const next = resolvedGroups[i + 1];
        if (curr.endFrame >= next.startFrame) {
          next.startFrame = curr.endFrame + 1;
          next.startTime = Number((next.startFrame / fps).toFixed(3));
        }
      }
    }
  }

  // 4. Construct final CaptionGroup items with frame numbers and safe placement
  const groups: CaptionGroup[] = [];

  for (let i = 0; i < resolvedGroups.length; i++) {
    const raw = resolvedGroups[i];
    const placement = resolveCaptionPlacement({
      viewport,
      safeMargin,
      position: requestedPosition,
      subjectRegion,
      lineCount: raw.lines.length,
    });

    groups.push({
      id: raw.id,
      startFrame: raw.startFrame,
      endFrame: raw.endFrame,
      startTime: raw.startTime,
      endTime: raw.endTime,
      position: placement.position,
      box: placement.box,
      lines: raw.lines,
    });
  }

  return {
    version: '1.0.0',
    fps,
    groups,
  };
}

/**
 * Class wrapper for QA governance export contract (T3-COMB-40).
 */
export class CaptionSegmenter {
  constructor(private defaultOptions?: SegmentOptions) {}

  public segment(words: WordTiming[], options?: SegmentOptions): CaptionsManifest {
    return segmentCaptions(words, { ...this.defaultOptions, ...options });
  }

  public static segment(words: WordTiming[], options?: SegmentOptions): CaptionsManifest {
    return segmentCaptions(words, options);
  }
}
