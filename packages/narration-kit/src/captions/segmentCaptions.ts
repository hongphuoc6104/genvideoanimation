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
  const isPortrait =
    (options.viewport?.height && options.viewport.height > options.viewport.width) ||
    (options.shotSpec?.viewport?.height && options.shotSpec.viewport.height > options.shotSpec.viewport.width) ||
    true; // Default to 9:16 vertical in V3.1
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

    // Boundary decision
    let shouldBreak = false;

    if (exceedsCapacity || exceedsMaxDuration) {
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
    startTime: number;
    endTime: number;
    totalChars: number;
  }

  const rawGroups: IntermediateGroup[] = [];

  for (let gIdx = 0; gIdx < groupWordClusters.length; gIdx++) {
    const cluster = groupWordClusters[gIdx];
    const lines = splitIntoLines(cluster, fps, maxCharsPerLine);
    const spokenStart = cluster[0].start;
    const spokenEnd = cluster[cluster.length - 1].end;
    const spokenDuration = spokenEnd - spokenStart;
    const totalChars = lines.reduce((acc, l) => acc + l.text.length, 0);

    const minReadingDuration = totalChars / maxCps;
    let targetDuration = Math.max(spokenDuration, minDurationSec, minReadingDuration);
    targetDuration = Math.min(targetDuration, maxDurationSec);

    const startTime = spokenStart;
    const endTime = startTime + targetDuration;

    rawGroups.push({
      id: `g${gIdx}`,
      cluster,
      lines,
      spokenStart,
      spokenEnd,
      startTime,
      endTime,
      totalChars,
    });
  }

  // 3. Reconcile timings to guarantee non-overlapping frames, minDuration, maxDuration, and CPS <= 21
  for (let i = 0; i < rawGroups.length; i++) {
    const curr = rawGroups[i];

    // Guarantee minimum duration
    if (curr.endTime - curr.startTime < minDurationSec) {
      curr.endTime = curr.startTime + minDurationSec;
    }
    // Guarantee max duration
    if (curr.endTime - curr.startTime > maxDurationSec) {
      curr.endTime = curr.startTime + maxDurationSec;
    }
    // Guarantee CPS <= 21.0
    const minReadingDuration = curr.totalChars / maxCps;
    if (curr.endTime - curr.startTime < minReadingDuration) {
      curr.endTime = curr.startTime + minReadingDuration;
    }

    if (i < rawGroups.length - 1) {
      const next = rawGroups[i + 1];
      // If curr encroaches next or next begins before curr ends:
      if (curr.endTime > next.startTime) {
        // Can curr end at next spoken start?
        const gap = next.spokenStart - curr.startTime;
        if (gap >= Math.max(minDurationSec, minReadingDuration)) {
          curr.endTime = next.spokenStart;
        } else {
          // Push next group's startTime to curr.endTime
          next.startTime = curr.endTime + (1 / fps);
        }
      }
    }
  }

  // 4. Construct final CaptionGroup items with frame numbers and safe placement
  const groups: CaptionGroup[] = [];

  for (let i = 0; i < rawGroups.length; i++) {
    const raw = rawGroups[i];
    let startFrame = Math.round(raw.startTime * fps);
    let endFrame = Math.round(raw.endTime * fps);

    // Enforce consecutive non-overlapping frame bounds: curr.startFrame >= prev.endFrame
    if (groups.length > 0) {
      const prev = groups[groups.length - 1];
      if (startFrame < prev.endFrame) {
        startFrame = prev.endFrame;
      }
    }

    // Guarantee minDuration and maxCps in discrete frame counts:
    const minDurFrames = Math.ceil(minDurationSec * fps);
    const minReadingFrames = Math.ceil((raw.totalChars / maxCps) * fps);
    const minRequiredFrames = Math.max(1, minDurFrames, minReadingFrames);

    if (endFrame - startFrame < minRequiredFrames) {
      endFrame = startFrame + minRequiredFrames;
    }

    // Guard against sub-millisecond toFixed(3) precision truncation causing CPS > maxCps
    while (
      raw.totalChars > 0 &&
      (Number((endFrame / fps).toFixed(3)) - Number((startFrame / fps).toFixed(3)) <= 0 ||
        raw.totalChars / (Number((endFrame / fps).toFixed(3)) - Number((startFrame / fps).toFixed(3))) > maxCps)
    ) {
      endFrame++;
    }

    const finalStartTime = Number((startFrame / fps).toFixed(3));
    const finalEndTime = Number((endFrame / fps).toFixed(3));

    const placement = resolveCaptionPlacement({
      viewport,
      safeMargin,
      position: requestedPosition,
      subjectRegion,
      lineCount: raw.lines.length,
    });

    groups.push({
      id: raw.id,
      startFrame,
      endFrame,
      startTime: finalStartTime,
      endTime: finalEndTime,
      position: placement.position,
      box: placement.box,
      lines: raw.lines,
    });
  }

  // Final verification: ensure every consecutive pair satisfies startFrame >= prev.endFrame
  for (let i = 1; i < groups.length; i++) {
    if (groups[i].startFrame < groups[i - 1].endFrame) {
      groups[i].startFrame = groups[i - 1].endFrame;
      const raw = rawGroups[i];
      const minDurFrames = Math.ceil(minDurationSec * fps);
      const minReadingFrames = Math.ceil((raw.totalChars / maxCps) * fps);
      const minRequiredFrames = Math.max(1, minDurFrames, minReadingFrames);

      if (groups[i].endFrame - groups[i].startFrame < minRequiredFrames) {
        groups[i].endFrame = groups[i].startFrame + minRequiredFrames;
      }
      while (
        raw.totalChars > 0 &&
        (Number((groups[i].endFrame / fps).toFixed(3)) - Number((groups[i].startFrame / fps).toFixed(3)) <= 0 ||
          raw.totalChars / (Number((groups[i].endFrame / fps).toFixed(3)) - Number((groups[i].startFrame / fps).toFixed(3))) > maxCps)
      ) {
        groups[i].endFrame++;
      }
      groups[i].startTime = Number((groups[i].startFrame / fps).toFixed(3));
      groups[i].endTime = Number((groups[i].endFrame / fps).toFixed(3));
    }
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
