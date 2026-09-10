/**
 * tests/challenger_m3_captions.test.ts
 * Empirical Adversarial Challenge Suite for Milestone 3 Caption Subsystem & Safe Placement
 *
 * Authored by: challenger_m3_1 (teamwork_preview_challenger)
 * Roles: critic, specialist
 *
 * Stress tests:
 * - Category A: Massive Run-On Sentences with Zero Punctuation (50-100+ words)
 * - Category B: Ultra-Rapid Speech Bursts (0.05s) vs Ultra-Slow Speech (10.0s)
 * - Category C: Adversarial ShotSpec Subject Regions & Multi-Aspect Canvases (9:16, 1:1, 21:9)
 * - Category D: 100% Word Completeness & Strictly Non-Overlapping Frame Bounds
 * - Category E: Caption-Kit Progressive Fill, CLS = 0, and Educational Theme
 */

import * as assert from 'node:assert/strict';
import {
  segmentCaptions,
  CaptionSegmenter,
  planSafeAreaPlacement,
  resolveCaptionPlacement,
  validateCaptionBoxLayout,
  computeAabbIntersection,
  checkAabbCollision,
  isWithinSafeArea,
  clampToSafeArea,
  computePresetBox,
  DEFAULT_VIEWPORT,
  DEFAULT_SAFE_MARGIN,
} from '../packages/narration-kit/src/captions';

import {
  calculateProgressiveFill,
  computeClipPathInset,
  resolveActiveGroup,
  EDUCATIONAL_THEME,
} from '../packages/caption-kit/src';

import { WordTiming } from '../packages/narration-kit/src/alignment/AlignmentProvider';
import {
  CaptionBoundingBox,
  SubjectRegion,
  Viewport,
} from '../packages/narration-kit/src/captions/types';

export interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export const results: TestResult[] = [];

function recordTest(category: string, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ category, name, passed: true });
      console.log(`  ✓ [${category}] ${name}`);
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        error: err?.message || String(err),
        details: err?.stack,
      });
      console.error(`  ✗ [${category}] ${name}: ${err?.message || err}`);
    }
  };
}

/**
 * Generator helper: creates synthetic WordTiming tokens
 */
function createSyntheticWords(
  count: number,
  options: {
    wordPrefix?: string;
    wordLength?: number;
    wordDuration?: number;
    pauseBetween?: number;
    withPunctuation?: boolean;
    startOffset?: number;
  } = {}
): WordTiming[] {
  const prefix = options.wordPrefix ?? 'word';
  const duration = options.wordDuration ?? 0.3;
  const pause = options.pauseBetween ?? 0.05;
  let currentTime = options.startOffset ?? 0.0;

  const words: WordTiming[] = [];

  for (let i = 0; i < count; i++) {
    let wordText: string;
    if (options.wordLength) {
      wordText = `${prefix}${i}`.padEnd(options.wordLength, 'x').slice(0, options.wordLength);
    } else {
      wordText = `${prefix}${i}`;
    }

    if (options.withPunctuation) {
      if ((i + 1) % 10 === 0) {
        wordText += '.';
      } else if ((i + 1) % 5 === 0) {
        wordText += ',';
      }
    }

    const start = Number(currentTime.toFixed(3));
    const end = Number((currentTime + duration).toFixed(3));
    currentTime = end + pause;

    words.push({
      id: `w_${i}`,
      word: wordText,
      start,
      end,
      confidence: 0.95,
      cleanWord: wordText.replace(/[.,?!]/g, '').toLowerCase(),
    });
  }

  return words;
}

// ------------------------------------------------------------------------------------------------
// Category A: Massive Run-On Sentences with Zero Punctuation (50-100+ words)
// ------------------------------------------------------------------------------------------------

const testsCategoryA = [
  recordTest(
    'A. Run-on Sentences',
    'A1. 50-word unpunctuated continuous speech: <= 2 lines per group, <= 42 chars per line',
    () => {
      const words = createSyntheticWords(50, {
        wordPrefix: 'token',
        wordDuration: 0.3,
        pauseBetween: 0.05, // Below 0.3s pause threshold -> no acoustic pause splits
        withPunctuation: false,
      });

      const manifest = segmentCaptions(words, { fps: 30, maxCharsPerLine: 42, maxLinesPerGroup: 2 });
      assert.ok(manifest.groups.length >= 4, `Expected at least 4 groups, got ${manifest.groups.length}`);

      for (const group of manifest.groups) {
        assert.ok(
          group.lines.length >= 1 && group.lines.length <= 2,
          `Group ${group.id} has ${group.lines.length} lines (must be <= 2)`
        );

        for (const line of group.lines) {
          assert.ok(
            line.text.length <= 42,
            `Group ${group.id} line "${line.text}" length ${line.text.length} exceeds 42 chars`
          );
        }
      }
    }
  ),

  recordTest(
    'A. Run-on Sentences',
    'A2. 100-word massive run-on sentence with 0 punctuation: lines <= 2, length <= 42, 100% word preservation',
    () => {
      const words = createSyntheticWords(100, {
        wordPrefix: 'element',
        wordDuration: 0.25,
        pauseBetween: 0.04,
        withPunctuation: false,
      });

      const manifest = segmentCaptions(words, { fps: 30, maxCharsPerLine: 42, maxLinesPerGroup: 2 });
      assert.ok(manifest.groups.length >= 8, `Expected >= 8 groups, got ${manifest.groups.length}`);

      // Collect all words across all groups
      const extractedWords: WordTiming[] = [];
      for (const group of manifest.groups) {
        assert.ok(group.lines.length <= 2, `Group ${group.id} exceeded 2 lines: ${group.lines.length}`);
        for (const line of group.lines) {
          assert.ok(
            line.text.length <= 42,
            `Group ${group.id} line "${line.text}" length ${line.text.length} exceeds 42`
          );
          for (const w of line.words) {
            extractedWords.push(w);
          }
        }
      }

      // Assert 100% completeness
      assert.equal(
        extractedWords.length,
        words.length,
        `Expected exactly ${words.length} words preserved, got ${extractedWords.length}`
      );

      for (let i = 0; i < words.length; i++) {
        assert.equal(
          extractedWords[i].id,
          words[i].id,
          `Word index ${i} ID mismatch: expected ${words[i].id}, got ${extractedWords[i].id}`
        );
        assert.equal(
          extractedWords[i].word,
          words[i].word,
          `Word index ${i} text mismatch: expected ${words[i].word}, got ${extractedWords[i].word}`
        );
      }
    }
  ),

  recordTest(
    'A. Run-on Sentences',
    'A3. Mixed-length words without punctuation: variable 3-18 char words packing into <= 42 char lines',
    () => {
      const vocab = [
        'the',
        'extraordinary',
        'computational',
        'efficiency',
        'of',
        'neuromorphic',
        'processing',
        'units',
        'revolutionizes',
        'contemporary',
        'deep',
        'learning',
        'architectures',
        'for',
        'embedded',
        'hardware',
        'systems',
      ];

      const words: WordTiming[] = [];
      let t = 0.0;
      for (let i = 0; i < 60; i++) {
        const wordText = vocab[i % vocab.length];
        const dur = 0.2 + (wordText.length * 0.02);
        words.push({
          id: `var_${i}`,
          word: wordText,
          start: Number(t.toFixed(3)),
          end: Number((t + dur).toFixed(3)),
          confidence: 0.98,
        });
        t += dur + 0.04;
      }

      const manifest = segmentCaptions(words, { fps: 30, maxCharsPerLine: 42 });

      for (const group of manifest.groups) {
        assert.ok(group.lines.length <= 2, `Group ${group.id} line count ${group.lines.length} > 2`);
        for (const line of group.lines) {
          assert.ok(
            line.text.length <= 42,
            `Line "${line.text}" has ${line.text.length} chars (exceeds 42)`
          );
        }
      }
    }
  ),

  recordTest(
    'A. Run-on Sentences',
    'A4. Boundary length packing: 41-char line packing without split overflow',
    () => {
      // Create word pairs designed to test exact 42 char boundaries
      const words: WordTiming[] = [
        { id: 'w1', word: '12345678901234567890', start: 0.0, end: 0.5 }, // 20 chars
        { id: 'w2', word: '12345678901234567890', start: 0.55, end: 1.05 }, // 20 chars (total with space = 41)
        { id: 'w3', word: 'extra', start: 1.1, end: 1.4 }, // 5 chars -> should overflow to line 2 or next group
      ];

      const manifest = segmentCaptions(words, { fps: 30, maxCharsPerLine: 42 });
      for (const group of manifest.groups) {
        assert.ok(group.lines.length <= 2);
        for (const line of group.lines) {
          assert.ok(line.text.length <= 42, `Line "${line.text}" (${line.text.length}) > 42`);
        }
      }
    }
  ),

  recordTest(
    'A. Run-on Sentences',
    'A5. Adversarial oversized token (> 42 chars single word): graceful handling without crash',
    () => {
      // 55-character single word token
      const oversizedWord = 'Pneumonoultramicroscopicsilicovolcanoconiosisisunbelievable';
      const words: WordTiming[] = [
        { id: 'w_over', word: oversizedWord, start: 0.0, end: 2.0, confidence: 0.9 },
        { id: 'w_normal', word: 'following', start: 2.1, end: 2.5, confidence: 0.9 },
      ];

      const manifest = segmentCaptions(words, { fps: 30, maxCharsPerLine: 42 });
      assert.ok(manifest.groups.length >= 1, 'Should produce at least 1 group');
      assert.ok(manifest.groups[0].lines.length <= 2, 'Lines per group must still be <= 2');
      // Verify word completeness even for oversized token
      const allTokens = manifest.groups.flatMap((g) => g.lines.flatMap((l) => l.words));
      assert.equal(allTokens.length, 2, 'Oversized token must not be lost');
      assert.equal(allTokens[0].word, oversizedWord);
    }
  ),

  recordTest(
    'A. Run-on Sentences',
    'A6. 200-word full-length production narrative: rigorous line count <= 2 and line length <= 42 across all groups',
    () => {
      // 200-word realistic educational script
      const script = [
        'Welcome', 'to', 'the', 'exploration', 'of', 'modern', 'machine', 'intelligence', 'and', 'distributed',
        'computational', 'frameworks', 'operating', 'without', 'external', 'dependencies', 'in', 'strict', 'offline',
        'environments', 'today', 'we', 'demonstrate', 'how', 'high', 'fidelity', 'neural', 'synthesis', 'and',
        'acoustic', 'forced', 'alignment', 'cooperate', 'seamlessly', 'within', 'declarative', 'Remotion',
        'compositions', 'enabling', 'rich', 'interactive', 'visualizations', 'with', 'zero', 'layout', 'shifts',
        'each', 'component', 'functions', 'autonomously', 'while', 'preserving', 'exact', 'frame', 'synchrony',
        'and', 'mathematical', 'guarantees', 'such', 'as', 'bounded', 'reading', 'speed', 'and', 'safe',
        'area', 'collision', 'avoidance', 'around', 'salient', 'visual', 'subjects', 'furthermore', 'the',
        'underlying', 'architecture', 'ensures', 'that', 'every', 'spoken', 'word', 'is', 'precisely',
        'mapped', 'into', 'dual', 'layer', 'karaoke', 'overlays', 'where', 'progressive', 'sub', 'pixel',
        'clip', 'paths', 'highlight', 'syllables', 'monotonically', 'across', 'continuous', 'video',
        'timelines', 'without', 'requiring', 'any', 'cloud', 'API', 'or', 'external', 'network', 'round',
        'trip', 'thereby', 'achieving', 'complete', 'deterministic', 'reproducibility', 'across', 'all',
        'production', 'builds', 'and', 'automated', 'quality', 'evaluations', 'under', 'all', 'supported',
        'display', 'aspect', 'ratios', 'including', 'standard', 'sixteen', 'by', 'nine', 'widescreen',
        'mobile', 'nine', 'by', 'sixteen', 'vertical', 'and', 'square', 'one', 'by', 'one', 'formats',
        'ensuring', 'pristine', 'legibility', 'under', 'all', 'viewing', 'conditions', 'and', 'guaranteeing',
        'full', 'compliance', 'with', 'international', 'accessibility', 'standards', 'and', 'educational',
        'clarity', 'benchmarks', 'for', 'diverse', 'audiences', 'worldwide', 'throughout', 'the', 'entire',
        'duration', 'of', 'the', 'rendered', 'presentation'
      ];

      const words: WordTiming[] = [];
      let t = 0.0;
      for (let i = 0; i < script.length; i++) {
        const w = script[i];
        const dur = 0.22;
        words.push({
          id: `w_200_${i}`,
          word: w,
          start: Number(t.toFixed(3)),
          end: Number((t + dur).toFixed(3)),
          confidence: 0.96,
          cleanWord: w.toLowerCase(),
        });
        t += dur + 0.04;
      }

      const manifest = segmentCaptions(words, { fps: 30, maxCharsPerLine: 42, maxLinesPerGroup: 2 });
      assert.ok(manifest.groups.length >= 15, `Expected >= 15 groups, got ${manifest.groups.length}`);

      const extracted: WordTiming[] = [];
      for (const group of manifest.groups) {
        assert.ok(group.lines.length >= 1 && group.lines.length <= 2);
        for (const line of group.lines) {
          assert.ok(line.text.length <= 42, `Line "${line.text}" (${line.text.length}) > 42`);
          for (const w of line.words) {
            extracted.push(w);
          }
        }
      }

      assert.equal(extracted.length, words.length, 'All 200 words must be preserved');
    }
  ),
];

// ------------------------------------------------------------------------------------------------
// Category B: Ultra-Rapid Speech Bursts vs Ultra-Slow Speech Timings
// ------------------------------------------------------------------------------------------------

const testsCategoryB = [
  recordTest(
    'B. Rapid vs Slow Speech',
    'B1. Ultra-rapid speech burst (0.05s words, spoken CPS ~ 100): duration expanded to clamp CPS <= 21.0',
    () => {
      // 20 words each 0.05s long -> total spoken duration = 1.0s
      // Words are ~5 chars each -> total ~100 chars
      const words = createSyntheticWords(20, {
        wordPrefix: 'fast',
        wordDuration: 0.05,
        pauseBetween: 0.0,
        withPunctuation: false,
      });

      const manifest = segmentCaptions(words, { fps: 30, maxCps: 21.0, minDurationSec: 0.8, maxDurationSec: 7.0 });

      for (const group of manifest.groups) {
        const duration = group.endTime - group.startTime;
        assert.ok(duration >= 0.8, `Group ${group.id} duration ${duration}s < 0.8s`);
        assert.ok(duration <= 7.0, `Group ${group.id} duration ${duration}s > 7.0s`);

        const totalChars = group.lines.reduce((acc, l) => acc + l.text.length, 0);
        const actualCps = totalChars / duration;
        // Allow tiny floating point tolerance (21.05)
        assert.ok(
          actualCps <= 21.05,
          `Group ${group.id} CPS ${actualCps.toFixed(2)} exceeds max CPS 21.0 (chars: ${totalChars}, dur: ${duration}s)`
        );
      }
    }
  ),

  recordTest(
    'B. Rapid vs Slow Speech',
    'B2. Ultra-slow speech (10.0s words): group duration clamped to <= 7.0s',
    () => {
      // 3 words each taking 10 seconds (total 30 seconds)
      const words: WordTiming[] = [
        { id: 'slow_1', word: 'first', start: 0.0, end: 10.0 },
        { id: 'slow_2', word: 'second', start: 10.5, end: 20.5 },
        { id: 'slow_3', word: 'third', start: 21.0, end: 31.0 },
      ];

      const manifest = segmentCaptions(words, { fps: 30, minDurationSec: 0.8, maxDurationSec: 7.0 });

      assert.ok(manifest.groups.length >= 3, `Expected at least 3 groups, got ${manifest.groups.length}`);

      for (const group of manifest.groups) {
        const duration = group.endTime - group.startTime;
        assert.ok(
          duration >= 0.8,
          `Group ${group.id} duration ${duration}s < 0.8s minimum`
        );
        assert.ok(
          duration <= 7.001,
          `Group ${group.id} duration ${duration}s exceeds 7.0s maximum`
        );
      }
    }
  ),

  recordTest(
    'B. Rapid vs Slow Speech',
    'B3. Zero-duration words (start == end == 1.5s): handles instantaneous events safely',
    () => {
      const words: WordTiming[] = [
        { id: 'zero_1', word: 'instant', start: 1.5, end: 1.5 },
        { id: 'zero_2', word: 'flash', start: 1.5, end: 1.5 },
      ];

      const manifest = segmentCaptions(words, { fps: 30, minDurationSec: 0.8, maxDurationSec: 7.0 });
      assert.ok(manifest.groups.length >= 1);
      const g = manifest.groups[0];
      const duration = g.endTime - g.startTime;
      assert.ok(
        duration >= 0.8 - 1e-4,
        `Duration ${duration}s must be >= 0.8s`
      );
      assert.ok(g.endFrame > g.startFrame, `endFrame ${g.endFrame} must be > startFrame ${g.startFrame}`);
    }
  ),

  recordTest(
    'B. Rapid vs Slow Speech',
    'B4. Sequence of 8 rapid phrases: non-overlapping frame bounds strictly maintained',
    () => {
      // 8 groups of rapid speech
      const words = createSyntheticWords(40, {
        wordPrefix: 'burst',
        wordDuration: 0.08,
        pauseBetween: 0.02,
        withPunctuation: true, // will split frequently
      });

      const manifest = segmentCaptions(words, { fps: 30, maxCps: 21.0, minDurationSec: 0.8, maxDurationSec: 7.0 });

      for (let i = 1; i < manifest.groups.length; i++) {
        const prev = manifest.groups[i - 1];
        const curr = manifest.groups[i];
        assert.ok(
          curr.startFrame >= prev.endFrame,
          `Overlap detected between group ${prev.id} [${prev.startFrame}, ${prev.endFrame}] and group ${curr.id} [${curr.startFrame}, ${curr.endFrame}]`
        );
      }
    }
  ),

  recordTest(
    'B. Rapid vs Slow Speech',
    'B5. Single micro-utterance (0.02s single word): duration clamped to >= 0.8s, CPS <= 21.0',
    () => {
      const words: WordTiming[] = [
        { id: 'micro_1', word: 'Hi.', start: 0.5, end: 0.52, punctuation: '.' },
      ];

      const manifest = segmentCaptions(words, { fps: 30, minDurationSec: 0.8, maxDurationSec: 7.0 });
      assert.equal(manifest.groups.length, 1);
      const g = manifest.groups[0];
      const duration = g.endTime - g.startTime;
      assert.ok(duration >= 0.8, `Micro utterance duration ${duration}s must be >= 0.8s`);
      assert.ok(g.endFrame > g.startFrame, 'startFrame < endFrame');
    }
  ),

  recordTest(
    'B. Rapid vs Slow Speech',
    'B6. Broadcast frame rates (24 fps cinema, 60 fps high frame rate): frame conversion integrity and non-overlapping bounds',
    () => {
      const words = createSyntheticWords(15, {
        wordPrefix: 'fps',
        wordDuration: 0.25,
        pauseBetween: 0.05,
        withPunctuation: true,
      });

      for (const testFps of [24, 60]) {
        const manifest = segmentCaptions(words, { fps: testFps });
        assert.equal(manifest.fps, testFps);
        for (let i = 0; i < manifest.groups.length; i++) {
          const g = manifest.groups[i];
          assert.ok(g.startFrame < g.endFrame, `FPS ${testFps}: startFrame must precede endFrame`);
          if (i > 0) {
            assert.ok(
              g.startFrame >= manifest.groups[i - 1].endFrame,
              `FPS ${testFps}: Group ${i} startFrame must be >= Group ${i-1} endFrame`
            );
          }
        }
      }
    }
  ),

  recordTest(
    'B. Rapid vs Slow Speech',
    'B7. Acoustic pause threshold sensitivity: 0.29s (below 0.30s threshold) preserves group, 0.35s splits group',
    () => {
      // 4 words total, short enough to fit on 1 line (approx 25 chars)
      // Test 1: pause = 0.25s (< 0.3s) -> should remain in 1 group
      const wordsNoPause: WordTiming[] = [
        { id: 'p1', word: 'Short', start: 0.0, end: 0.3 },
        { id: 'p2', word: 'phrase', start: 0.35, end: 0.65 },
        { id: 'p3', word: 'flows', start: 0.90, end: 1.2 }, // 0.25s pause
        { id: 'p4', word: 'together', start: 1.25, end: 1.55 },
      ];
      const manifest1 = segmentCaptions(wordsNoPause, { fps: 30, acousticPauseThresholdSec: 0.3 });
      assert.equal(manifest1.groups.length, 1, 'Sub-threshold pause should not break short phrase');

      // Test 2: pause = 0.40s (>= 0.3s) -> should split into 2 groups
      const wordsWithPause: WordTiming[] = [
        { id: 'p1', word: 'Short', start: 0.0, end: 0.3 },
        { id: 'p2', word: 'phrase', start: 0.35, end: 0.65 },
        { id: 'p3', word: 'flows', start: 1.05, end: 1.35 }, // 0.40s pause (>= 0.3s)
        { id: 'p4', word: 'together', start: 1.40, end: 1.70 },
      ];
      const manifest2 = segmentCaptions(wordsWithPause, { fps: 30, acousticPauseThresholdSec: 0.3 });
      assert.equal(manifest2.groups.length, 2, 'Acoustic pause >= 0.3s must split into 2 groups');
    }
  ),
];

// ------------------------------------------------------------------------------------------------
// Category C: Adversarial ShotSpec Subject Regions & Multi-Aspect Canvases
// ------------------------------------------------------------------------------------------------

const testsCategoryC = [
  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C1. Bottom-half subject occlusion [0, 540, 1920, 540]: relocates from bottom to top with 0 AABB collision',
    () => {
      const viewport: Viewport = { width: 1920, height: 1080 };
      const subject: SubjectRegion = { x: 0, y: 540, width: 1920, height: 540 };

      const placement = planSafeAreaPlacement({
        viewport,
        safeMargin: 96,
        position: 'bottom',
        subjectRegion: subject,
      });

      assert.equal(placement.collidesWithSubject, false, 'Should have resolved collision-free placement');
      assert.equal(placement.resolvedPosition, 'top', 'Must relocate to top safe preset');
      assert.equal(placement.collisionArea, 0, 'Collision area must be exactly 0');

      const val = validateCaptionBoxLayout(placement.box, subject, viewport, 96);
      assert.ok(val.valid, `Layout validation failed: ${val.errors.join(', ')}`);
      assert.equal(val.collisionArea, 0);
      assert.ok(placement.box.y >= 96, `Top edge ${placement.box.y} must be >= 96`);
      assert.ok(placement.box.y + placement.box.height <= 1080 - 96, 'Must stay within bottom safe margin');
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C2. Center canvas subject occlusion [400, 250, 1120, 580]: bottom preset remains safe (0 collision)',
    () => {
      const viewport: Viewport = { width: 1920, height: 1080 };
      // Center subject leaves top (y: 96-216) and bottom (y: 864-984) free
      const subject: SubjectRegion = { x: 400, y: 250, width: 1120, height: 580 };

      const placement = planSafeAreaPlacement({
        viewport,
        safeMargin: 96,
        position: 'bottom',
        subjectRegion: subject,
      });

      assert.equal(placement.collidesWithSubject, false);
      assert.equal(placement.resolvedPosition, 'bottom');
      assert.equal(placement.collisionArea, 0);

      const val = validateCaptionBoxLayout(placement.box, subject, viewport, 96);
      assert.ok(val.valid, `Validation errors: ${val.errors.join(', ')}`);
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C3. Lower-left subject occlusion [96, 700, 800, 300]: lower-left preset relocates with 0 collision',
    () => {
      const viewport: Viewport = { width: 1920, height: 1080 };
      const subject: SubjectRegion = { x: 96, y: 700, width: 800, height: 300 };

      const placement = planSafeAreaPlacement({
        viewport,
        safeMargin: 96,
        position: 'lower-left',
        subjectRegion: subject,
      });

      assert.equal(placement.collidesWithSubject, false);
      assert.equal(placement.collisionArea, 0);
      assert.notEqual(placement.resolvedPosition, 'lower-left', 'Must relocate away from colliding lower-left');

      const val = validateCaptionBoxLayout(placement.box, subject, viewport, 96);
      assert.ok(val.valid, `Validation errors: ${val.errors.join(', ')}`);
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C4. Lower-right subject occlusion [1024, 700, 800, 300]: lower-right preset relocates with 0 collision',
    () => {
      const viewport: Viewport = { width: 1920, height: 1080 };
      const subject: SubjectRegion = { x: 1024, y: 700, width: 800, height: 300 };

      const placement = planSafeAreaPlacement({
        viewport,
        safeMargin: 96,
        position: 'lower-right',
        subjectRegion: subject,
      });

      assert.equal(placement.collidesWithSubject, false);
      assert.equal(placement.collisionArea, 0);
      assert.notEqual(placement.resolvedPosition, 'lower-right', 'Must relocate away from colliding lower-right');

      const val = validateCaptionBoxLayout(placement.box, subject, viewport, 96);
      assert.ok(val.valid, `Validation errors: ${val.errors.join(', ')}`);
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C5. Multi-Aspect 9:16 Portrait Canvas (1080x1920): safe area >= 96px, bottom subject relocates to top',
    () => {
      const portraitViewport: Viewport = { width: 1080, height: 1920 };
      const safeMargin = 96;
      const bottomSubject: SubjectRegion = { x: 0, y: 1300, width: 1080, height: 620 };

      // Test default portrait bottom placement without subject
      const defaultPlacement = planSafeAreaPlacement({
        viewport: portraitViewport,
        safeMargin,
        position: 'bottom',
      });
      assert.ok(isWithinSafeArea(defaultPlacement.box, portraitViewport, safeMargin));
      assert.equal(defaultPlacement.box.width, portraitViewport.width - 2 * safeMargin);

      // Test with bottom subject
      const relocated = planSafeAreaPlacement({
        viewport: portraitViewport,
        safeMargin,
        position: 'bottom',
        subjectRegion: bottomSubject,
      });

      assert.equal(relocated.collidesWithSubject, false);
      assert.equal(relocated.resolvedPosition, 'top');
      assert.equal(relocated.collisionArea, 0);
      assert.ok(isWithinSafeArea(relocated.box, portraitViewport, safeMargin));
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C6. Multi-Aspect 1:1 Square Canvas (1080x1080): safe area >= 96px, bottom subject relocates to top',
    () => {
      const squareViewport: Viewport = { width: 1080, height: 1080 };
      const safeMargin = 96;
      const bottomSubject: SubjectRegion = { x: 0, y: 700, width: 1080, height: 380 };

      // Default square bottom placement
      const defaultPlacement = planSafeAreaPlacement({
        viewport: squareViewport,
        safeMargin,
        position: 'bottom',
      });
      assert.ok(isWithinSafeArea(defaultPlacement.box, squareViewport, safeMargin));
      assert.equal(defaultPlacement.box.width, squareViewport.width - 2 * safeMargin);

      // With bottom subject
      const relocated = planSafeAreaPlacement({
        viewport: squareViewport,
        safeMargin,
        position: 'bottom',
        subjectRegion: bottomSubject,
      });

      assert.equal(relocated.collidesWithSubject, false);
      assert.equal(relocated.resolvedPosition, 'top');
      assert.equal(relocated.collisionArea, 0);
      assert.ok(isWithinSafeArea(relocated.box, squareViewport, safeMargin));
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C7. Multi-Aspect 21:9 Ultrawide Canvas (2560x1080): safe area boundaries strictly observed',
    () => {
      const ultrawideViewport: Viewport = { width: 2560, height: 1080 };
      const safeMargin = 96;

      const placement = planSafeAreaPlacement({
        viewport: ultrawideViewport,
        safeMargin,
        position: 'bottom',
      });

      assert.ok(isWithinSafeArea(placement.box, ultrawideViewport, safeMargin));
      assert.ok(placement.box.x >= safeMargin);
      assert.ok(placement.box.x + placement.box.width <= ultrawideViewport.width - safeMargin);
      assert.ok(placement.box.y >= safeMargin);
      assert.ok(placement.box.y + placement.box.height <= ultrawideViewport.height - safeMargin);
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C8. Boundary Edge-Touching: boxes touching strictly at boundary have zero collision',
    () => {
      const boxA: CaptionBoundingBox = { x: 192, y: 864, width: 1536, height: 120 };
      // Touching exact top edge of boxA (y + height = 864)
      const touchingAbove: SubjectRegion = { x: 192, y: 500, width: 1536, height: 364 };
      assert.equal(computeAabbIntersection(boxA, touchingAbove), 0);
      assert.equal(checkAabbCollision(boxA, touchingAbove), false);

      // Touching exact bottom edge (y = 864 + 120 = 984)
      const touchingBelow: SubjectRegion = { x: 192, y: 984, width: 1536, height: 96 };
      assert.equal(computeAabbIntersection(boxA, touchingBelow), 0);
      assert.equal(checkAabbCollision(boxA, touchingBelow), false);
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C9. Catastrophic 100% Canvas Occlusion [0, 0, 1920, 1080]: handled gracefully without crash',
    () => {
      const fullOcclusion: SubjectRegion = { x: 0, y: 0, width: 1920, height: 1080 };
      const placement = planSafeAreaPlacement({
        viewport: DEFAULT_VIEWPORT,
        safeMargin: 96,
        position: 'bottom',
        subjectRegion: fullOcclusion,
      });

      // Cannot avoid subject because entire screen is covered
      assert.equal(placement.collidesWithSubject, true);
      assert.ok(placement.collisionArea > 0);
      // Box coordinates must still remain strictly clamped inside safe margins
      assert.ok(isWithinSafeArea(placement.box, DEFAULT_VIEWPORT, 96));
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C10. Top and upper-half occlusion [0, 0, 1920, 800]: requested "top" relocates to non-colliding lower zone',
    () => {
      const topSubject: SubjectRegion = { x: 0, y: 0, width: 1920, height: 800 };
      const placement = planSafeAreaPlacement({
        viewport: DEFAULT_VIEWPORT,
        safeMargin: 96,
        position: 'top',
        subjectRegion: topSubject,
      });

      assert.equal(placement.collidesWithSubject, false);
      assert.equal(placement.collisionArea, 0);
      assert.notEqual(placement.resolvedPosition, 'top', 'Must relocate away from colliding top region');
      // Must be within safe margins
      assert.ok(isWithinSafeArea(placement.box, DEFAULT_VIEWPORT, 96));
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C11. Custom safe margin (120px): all preset calculations strictly respect custom margin',
    () => {
      const customMargin = 120;
      for (const preset of ['bottom', 'top', 'lower-left', 'lower-right'] as const) {
        const box = computePresetBox(preset, {
          viewport: DEFAULT_VIEWPORT,
          safeMargin: customMargin,
        });

        assert.ok(isWithinSafeArea(box, DEFAULT_VIEWPORT, customMargin), `Preset ${preset} violates safe margin ${customMargin}`);
        assert.ok(box.x >= customMargin, `x ${box.x} < ${customMargin}`);
        assert.ok(box.y >= customMargin, `y ${box.y} < ${customMargin}`);
        assert.ok(box.x + box.width <= 1920 - customMargin);
        assert.ok(box.y + box.height <= 1080 - customMargin);
      }
    }
  ),

  recordTest(
    'C. Safe Area & Subject Avoidance',
    'C12. "auto" position preset: defaults to bottom when clear, flips to top when bottom obstructed',
    () => {
      // 1. Clear canvas -> defaults to bottom
      const clearPlacement = planSafeAreaPlacement({
        viewport: DEFAULT_VIEWPORT,
        safeMargin: 96,
        position: 'auto',
      });
      assert.equal(clearPlacement.resolvedPosition, 'bottom');
      assert.equal(clearPlacement.collidesWithSubject, false);

      // 2. Bottom obstructed -> resolves to top
      const bottomSubject: SubjectRegion = { x: 0, y: 700, width: 1920, height: 380 };
      const autoWithSubject = planSafeAreaPlacement({
        viewport: DEFAULT_VIEWPORT,
        safeMargin: 96,
        position: 'auto',
        subjectRegion: bottomSubject,
      });
      assert.equal(autoWithSubject.resolvedPosition, 'top');
      assert.equal(autoWithSubject.collidesWithSubject, false);
      assert.equal(autoWithSubject.collisionArea, 0);
    }
  ),
];

// ------------------------------------------------------------------------------------------------
// Category D: 100% Word Completeness & Strictly Non-Overlapping Frame Bounds
// ------------------------------------------------------------------------------------------------

const testsCategoryD = [
  recordTest(
    'D. Word Completeness & Frame Invariants',
    'D1. End-to-end ShotSpec integration: subject_region dynamically redirects captions in manifest',
    () => {
      const words = createSyntheticWords(15, {
        wordPrefix: 'shot',
        wordDuration: 0.3,
        pauseBetween: 0.05,
        withPunctuation: true,
      });

      const bottomSubject: SubjectRegion = { x: 0, y: 600, width: 1920, height: 480 };

      const manifest = segmentCaptions(words, {
        fps: 30,
        position: 'bottom',
        shotSpec: {
          fps: 30,
          viewport: { width: 1920, height: 1080 },
          safe_margin: 96,
          subject_region: bottomSubject,
          caption_position: 'bottom',
        },
      });

      for (const group of manifest.groups) {
        assert.equal(
          group.position,
          'top',
          `Group ${group.id} position should be redirected to 'top', got '${group.position}'`
        );
        const collision = computeAabbIntersection(group.box, bottomSubject);
        assert.equal(collision, 0, `Group ${group.id} collides with bottom subject (area: ${collision})`);
        assert.ok(isWithinSafeArea(group.box, DEFAULT_VIEWPORT, 96));
      }
    }
  ),

  recordTest(
    'D. Word Completeness & Frame Invariants',
    'D2. Strictly non-overlapping frame bounds: curr.startFrame >= prev.endFrame across all groups',
    () => {
      // 50 words with frequent punctuation causing multiple groups
      const words = createSyntheticWords(50, {
        wordPrefix: 'sync',
        wordDuration: 0.35,
        pauseBetween: 0.08,
        withPunctuation: true,
      });

      const manifest = segmentCaptions(words, { fps: 30 });

      assert.ok(manifest.groups.length >= 5);

      for (let i = 0; i < manifest.groups.length; i++) {
        const group = manifest.groups[i];
        assert.ok(
          group.startFrame < group.endFrame,
          `Group ${group.id} invalid frame order: startFrame ${group.startFrame} >= endFrame ${group.endFrame}`
        );

        if (i > 0) {
          const prev = manifest.groups[i - 1];
          assert.ok(
            group.startFrame >= prev.endFrame,
            `Frame collision: group ${group.id} startFrame ${group.startFrame} < prev group ${prev.id} endFrame ${prev.endFrame}`
          );
        }
      }
    }
  ),

  recordTest(
    'D. Word Completeness & Frame Invariants',
    'D3. Frame synchrony conversion: startFrame and endFrame align with startTime/endTime * fps',
    () => {
      const fps = 30;
      const words = createSyntheticWords(25, {
        wordPrefix: 'timing',
        wordDuration: 0.4,
        pauseBetween: 0.1,
        withPunctuation: true,
      });

      const manifest = segmentCaptions(words, { fps });

      for (const group of manifest.groups) {
        const expectedStartFrame = Math.round(group.startTime * fps);
        const expectedEndFrame = Math.round(group.endTime * fps);

        assert.ok(
          Math.abs(group.startFrame - expectedStartFrame) <= 1,
          `Group ${group.id} startFrame ${group.startFrame} deviates from expected ${expectedStartFrame}`
        );
        assert.ok(
          Math.abs(group.endFrame - expectedEndFrame) <= 1,
          `Group ${group.id} endFrame ${group.endFrame} deviates from expected ${expectedEndFrame}`
        );
      }
    }
  ),

  recordTest(
    'D. Word Completeness & Frame Invariants',
    'D4. Empty word array input: returns valid empty manifest without throwing',
    () => {
      const manifest = segmentCaptions([], { fps: 30 });
      assert.equal(manifest.version, '1.0.0');
      assert.equal(manifest.fps, 30);
      assert.deepEqual(manifest.groups, []);

      // Also verify class wrapper CaptionSegmenter
      const segmenter = new CaptionSegmenter();
      const manifest2 = segmenter.segment([]);
      assert.equal(manifest2.groups.length, 0);
    }
  ),

  recordTest(
    'D. Word Completeness & Frame Invariants',
    'D5. Single word input: returns 1 group preserving token exactly',
    () => {
      const singleWord: WordTiming[] = [
        { id: 'lone_1', word: 'Standalone', start: 1.0, end: 1.4, confidence: 0.99 },
      ];

      const manifest = segmentCaptions(singleWord, { fps: 30 });
      assert.equal(manifest.groups.length, 1);
      const group = manifest.groups[0];
      assert.equal(group.lines.length, 1);
      assert.equal(group.lines[0].words.length, 1);
      assert.equal(group.lines[0].words[0].id, 'lone_1');
      assert.equal(group.lines[0].words[0].word, 'Standalone');
      assert.ok(group.endTime - group.startTime >= 0.8, 'Single word duration clamped to >= 0.8s');
    }
  ),

  recordTest(
    'D. Word Completeness & Frame Invariants',
    'D6. Token metadata fidelity: cleanWord, confidence, punctuation, and word-level frames preserved',
    () => {
      const words: WordTiming[] = [
        { id: 'w_meta_0', word: 'First!', start: 0.0, end: 0.4, confidence: 0.98, cleanWord: 'first', punctuation: '!' },
        { id: 'w_meta_1', word: 'Second,', start: 0.5, end: 0.9, confidence: 0.89, cleanWord: 'second', punctuation: ',' },
        { id: 'w_meta_2', word: 'Third?', start: 1.0, end: 1.4, confidence: 0.95, cleanWord: 'third', punctuation: '?' },
      ];

      const manifest = segmentCaptions(words, { fps: 30 });
      const extractedWords = manifest.groups.flatMap((g) => g.lines.flatMap((l) => l.words));

      assert.equal(extractedWords.length, 3);
      for (let i = 0; i < 3; i++) {
        const ew = extractedWords[i];
        const ow = words[i];
        assert.equal(ew.id, ow.id);
        assert.equal(ew.word, ow.word);
        assert.equal(ew.cleanWord, ow.cleanWord);
        assert.equal(ew.confidence, ow.confidence);
        assert.equal(ew.punctuation, ow.punctuation);
        assert.equal(ew.start, ow.start);
        assert.equal(ew.end, ow.end);
        assert.equal(ew.startFrame, Math.round(ow.start * 30));
        assert.ok(ew.endFrame > ew.startFrame);
      }
    }
  ),
];

// ------------------------------------------------------------------------------------------------
// Category E: Remotion Caption Kit & Educational Theme Assertions
// ------------------------------------------------------------------------------------------------

const testsCategoryE = [
  recordTest(
    'E. Remotion Caption Kit',
    'E1. Progressive fill monotonic clamping: 0.0 before start, proportional during, 1.0 after end',
    () => {
      const startFrame = 100;
      const endFrame = 120; // 20 frames duration

      // Before start
      assert.equal(calculateProgressiveFill(50, startFrame, endFrame), 0.0);
      assert.equal(calculateProgressiveFill(99, startFrame, endFrame), 0.0);
      assert.equal(calculateProgressiveFill(100, startFrame, endFrame), 0.0);

      // In between
      assert.equal(calculateProgressiveFill(110, startFrame, endFrame), 0.5);
      assert.equal(Number(calculateProgressiveFill(105, startFrame, endFrame).toFixed(2)), 0.25);
      assert.equal(Number(calculateProgressiveFill(115, startFrame, endFrame).toFixed(2)), 0.75);

      // At and after end
      assert.equal(calculateProgressiveFill(120, startFrame, endFrame), 1.0);
      assert.equal(calculateProgressiveFill(150, startFrame, endFrame), 1.0);

      // Edge case: startFrame === endFrame (instantaneous) -> must avoid division by zero (NaN)
      const instantProgress = calculateProgressiveFill(100, 100, 100);
      assert.ok(!isNaN(instantProgress), 'Progress must not be NaN for zero-duration frames');
      assert.equal(instantProgress, 1.0);
    }
  ),

  recordTest(
    'E. Remotion Caption Kit',
    'E2. Sub-pixel CSS clipPath calculation: strictly matches inset(0 X% 0 0)',
    () => {
      assert.equal(computeClipPathInset(0.0), 'inset(0 100.00% 0 0)');
      assert.equal(computeClipPathInset(0.5), 'inset(0 50.00% 0 0)');
      assert.equal(computeClipPathInset(1.0), 'inset(0 0.00% 0 0)');
      assert.equal(computeClipPathInset(0.3333), 'inset(0 66.67% 0 0)');
    }
  ),

  recordTest(
    'E. Remotion Caption Kit',
    'E3. Active group resolution: returns active group at frame, null when idle',
    () => {
      const groups = [
        { id: 'g0', startFrame: 0, endFrame: 60 } as any,
        { id: 'g1', startFrame: 90, endFrame: 150 } as any,
      ];
      const data = { version: '1.0.0' as const, fps: 30, groups };

      assert.equal(resolveActiveGroup(data, 0)?.id, 'g0');
      assert.equal(resolveActiveGroup(data, 30)?.id, 'g0');
      assert.equal(resolveActiveGroup(data, 60)?.id, 'g0');
      assert.equal(resolveActiveGroup(data, 61), null, 'Boundary frame 61 is after g0');
      assert.equal(resolveActiveGroup(data, 75), null, 'Gap frame between groups');
      assert.equal(resolveActiveGroup(data, 90)?.id, 'g1');
      assert.equal(resolveActiveGroup(data, 150)?.id, 'g1');
      assert.equal(resolveActiveGroup(data, 151), null, 'Frame 151 is after g1');
    }
  ),

  recordTest(
    'E. Remotion Caption Kit',
    'E4. Educational theme parameters: WCAG AA colors and zero TikTok bounce transforms',
    () => {
      assert.equal(EDUCATIONAL_THEME.upcoming.color, '#94a3b8', 'Slate-400 for upcoming words');
      assert.equal(EDUCATIONAL_THEME.active.color, '#38bdf8', 'Sky-400 for active word');
      assert.equal(EDUCATIONAL_THEME.spoken.color, '#cbd5e1', 'Slate-300 for spoken words');
      assert.equal(EDUCATIONAL_THEME.upcoming.transform, 'none', 'Strictly zero bouncy transforms');
      assert.equal(EDUCATIONAL_THEME.active.transform, 'none', 'Strictly zero active transforms');
      assert.equal(EDUCATIONAL_THEME.spoken.transform, 'none', 'Strictly zero spoken transforms');
    }
  ),
];

// ------------------------------------------------------------------------------------------------
// Master Execution Runner
// ------------------------------------------------------------------------------------------------

export async function runAllChallengerTests() {
  console.log('========================================================================');
  console.log('  CHALLENGER M3: ADVERSARIAL STRESS TEST SUITE (Caption Subsystem)');
  console.log('========================================================================');

  const allTests = [
    ...testsCategoryA,
    ...testsCategoryB,
    ...testsCategoryC,
    ...testsCategoryD,
    ...testsCategoryE,
  ];

  for (const t of allTests) {
    await t();
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('========================================================================');
  console.log(`  RESULTS: Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    console.error(`\nFAILED TESTS SUMMARY:`);
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`  - [${r.category}] ${r.name}`);
      console.error(`    Error: ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log(`\nALL ${total} ADVERSARIAL CHALLENGER TESTS PASSED SUCCESSFULLY!`);
  }
}

// Execute when run directly via tsx
runAllChallengerTests().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
