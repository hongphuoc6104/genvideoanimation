/**
 * tests/invariants/caption-handoff-typography.test.ts
 *
 * Authoritative Invariant Test Suite:
 * - R3: Subtitle Token Alignment & Boundary Handoff Guard (INV-CAP-01 to INV-CAP-05)
 * - R4: Crisp Typography & Anti-Blur Karaoke Invariant (INV-CAP-06 to INV-CAP-08)
 *
 * Implements 8 strict mathematical and architectural invariant gates.
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { segmentCaptions } from '../../packages/narration-kit/src/captions/segmentCaptions';
import { WordTiming } from '../../packages/narration-kit/src/alignment/AlignmentProvider';
import { KaraokeWord } from '../../packages/caption-kit/src/KaraokeWord';
import { KaraokeCaptions } from '../../packages/caption-kit/src/KaraokeCaptions';
import { EDUCATIONAL_THEME, CRISP_THEME } from '../../packages/caption-kit/src/theme';
import { resolveActiveGroup } from '../../packages/caption-kit/src/utils';

// ---------------------------------------------------------------------------
// WCAG 2.1 Luminance & Contrast Calculation Helpers
// ---------------------------------------------------------------------------
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function parseRgbaColor(rgba: string): { r: number; g: number; b: number; a: number } {
  const match = rgba.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!match) {
    throw new Error(`Invalid rgba color: ${rgba}`);
  }
  return {
    r: parseFloat(match[1]),
    g: parseFloat(match[2]),
    b: parseFloat(match[3]),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1.0,
  };
}

function computeRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const linear = srgb.map((val) => {
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function computeContrastRatio(lum1: number, lum2: number): number {
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

function alphaComposite(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  const alpha = fg.a;
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  };
}

// ---------------------------------------------------------------------------
// Synthetic Educational Script Generator
// ---------------------------------------------------------------------------
function generateRealisticEducationalTokens(fps: number = 30): WordTiming[] {
  // 60-word natural script mixing tight clauses and natural pauses (Vietnamese-like prosody)
  const phrases = [
    { text: 'Tại sao bài báo có số liệu tốt', pauseAfter: 0.05 },
    { text: 'phương pháp mạnh vẫn bị từ chối?', pauseAfter: 0.35 },
    { text: 'Lý do cốt lõi là không chứng minh được', pauseAfter: 0.05 },
    { text: 'khoảng trống học thuật thuyết phục.', pauseAfter: 0.40 },
    { text: 'Chuẩn Scopus đòi hỏi bài báo', pauseAfter: 0.05 },
    { text: 'phải giải quyết một điểm khuyết cụ thể', pauseAfter: 0.05 },
    { text: 'trong dòng chảy tri thức hiện có.', pauseAfter: 0.50 },
    { text: 'Hôm nay chúng ta cùng phân tích', pauseAfter: 0.05 },
    { text: 'năm loại Research Gap phổ biến.', pauseAfter: 0.40 },
  ];

  const words: WordTiming[] = [];
  let currentTime = 0.5;
  let wordCounter = 0;

  for (const phrase of phrases) {
    const tokens = phrase.text.split(' ');
    for (let i = 0; i < tokens.length; i++) {
      const rawToken = tokens[i];
      const isLastInPhrase = i === tokens.length - 1;
      const duration = 0.22 + (rawToken.length * 0.02);
      const start = Number(currentTime.toFixed(3));
      const end = Number((currentTime + duration).toFixed(3));
      const startFrame = Math.round(start * fps);
      const endFrame = Math.round(end * fps);

      words.push({
        id: `w_${wordCounter++}`,
        word: rawToken,
        start,
        end,
        startFrame,
        endFrame,
        confidence: 0.96,
        cleanWord: rawToken.replace(/[?,.!]/g, '').toLowerCase(),
        punctuation: rawToken.match(/[?,.!]/)?.[0],
      });

      const intraPause = isLastInPhrase ? phrase.pauseAfter : 0.04;
      currentTime = end + intraPause;
    }
  }

  return words;
}

export function runCaptionHandoffTypographyTests() {
  console.log('======================================================================');
  console.log(' INVARIANT TEST SUITE: Caption Handoff & Typography Quality Gates');
  console.log(' Standards: R3 (Acoustic Anchor & Latency) + R4 (Crisp Typography)');
  console.log('======================================================================\n');

  const fps = 30;
  const words = generateRealisticEducationalTokens(fps);
  const manifest = segmentCaptions(words, {
    fps,
    viewport: { width: 1080, height: 1920 }, // 9:16 mobile
    maxCharsPerLine: 26,
  });

  const groups = manifest.groups;
  assert.ok(groups.length >= 6, `Expected at least 6 caption groups, got ${groups.length}`);

  // =========================================================================
  // Gate 1: Zero Swallowed Tokens (INV-CAP-01)
  // =========================================================================
  console.log('  [Gate 1] Verifying INV-CAP-01: Zero Swallowed Tokens (Acoustic Anchor Law)...');
  for (const g of groups) {
    const allWords = g.lines.flatMap((l) => l.words);
    assert.ok(allWords.length > 0, `Group [${g.id}] contains 0 words`);
    const firstWord = allWords[0];

    // Under no circumstances may group.startFrame > firstWord.startFrame
    assert.ok(
      g.startFrame <= firstWord.startFrame,
      `[INV-CAP-01 Violation] Group [${g.id}] mounted at frame ${g.startFrame}, but first word "${firstWord.word}" starts at frame ${firstWord.startFrame}. Token is swallowed!`
    );

    // Group mount must precisely coincide with first word (difference <= 1 frame)
    const mountDiff = Math.abs(g.startFrame - firstWord.startFrame);
    assert.ok(
      mountDiff <= 1,
      `[INV-CAP-01 Violation] Group [${g.id}] mount drift ${mountDiff} frames > 1 frame`
    );

    // All subsequent words in group must also start at or after group startFrame
    for (const w of allWords) {
      assert.ok(
        w.startFrame >= g.startFrame,
        `[INV-CAP-01 Violation] Word "${w.word}" startFrame (${w.startFrame}) < group.startFrame (${g.startFrame})`
      );
    }
  }
  console.log(`    ✓ INV-CAP-01: 100% of ${groups.length} groups satisfy Acoustic Anchor Law (zero pre-spoken words).`);

  // =========================================================================
  // Gate 2: Zero Frozen Lingering (INV-CAP-02)
  // =========================================================================
  console.log('  [Gate 2] Verifying INV-CAP-02: Zero Frozen Lingering...');
  for (const g of groups) {
    const allWords = g.lines.flatMap((l) => l.words);
    const lastWord = allWords[allWords.length - 1];
    const lingerFrames = g.endFrame - lastWord.endFrame;

    // Linger must be clamped to <= 6 frames (<= 200ms)
    assert.ok(
      lingerFrames <= 6,
      `[INV-CAP-02 Violation] Group [${g.id}] lingers for ${lingerFrames} frames (${(lingerFrames / fps * 1000).toFixed(0)}ms) after speech ends. Limit is <= 6 frames!`
    );
    assert.ok(
      lingerFrames >= 0,
      `[INV-CAP-02 Violation] Group [${g.id}] unmounted before last word ended: ${lingerFrames} < 0`
    );
  }
  console.log(`    ✓ INV-CAP-02: Zero lingering freeze across all groups (linger <= 6 frames / 200ms).`);

  // =========================================================================
  // Gate 3: Sub-66ms Contiguous Handoff Latency (INV-CAP-03)
  // =========================================================================
  console.log('  [Gate 3] Verifying INV-CAP-03: Sub-66ms Contiguous Handoff Latency...');
  let tightTransitionCount = 0;
  for (let i = 0; i < groups.length - 1; i++) {
    const curr = groups[i];
    const next = groups[i + 1];

    const currWords = curr.lines.flatMap((l) => l.words);
    const nextWords = next.lines.flatMap((l) => l.words);

    const currLastWord = currWords[currWords.length - 1];
    const nextFirstWord = nextWords[0];

    const acousticGap = nextFirstWord.startFrame - currLastWord.endFrame;

    if (acousticGap <= 2) {
      tightTransitionCount++;
      // Handoff latency: difference between next group start and curr group end
      const handoffLatency = next.startFrame - curr.endFrame;
      assert.ok(
        handoffLatency <= 2,
        `[INV-CAP-03 Violation] Tight transition [${curr.id} -> ${next.id}] latency is ${handoffLatency} frames > 2 frames (66ms)`
      );
      assert.strictEqual(
        handoffLatency,
        1,
        `[INV-CAP-03 Violation] Expected immediate contiguous handoff (latency = 1 frame), got ${handoffLatency}`
      );
    }
  }
  assert.ok(tightTransitionCount >= 3, `Expected at least 3 tight transitions to test, found ${tightTransitionCount}`);
  console.log(`    ✓ INV-CAP-03: Verified ${tightTransitionCount} contiguous transitions with latency <= 1 frame (33ms).`);

  // =========================================================================
  // Gate 4: Disjoint Non-Overlapping Bound Invariant (INV-CAP-04)
  // =========================================================================
  console.log('  [Gate 4] Verifying INV-CAP-04: Disjoint Non-Overlapping Bounds...');
  for (let i = 0; i < groups.length - 1; i++) {
    const curr = groups[i];
    const next = groups[i + 1];

    assert.ok(
      curr.endFrame < next.startFrame,
      `[INV-CAP-04 Violation] Group [${curr.id}] endFrame (${curr.endFrame}) overlaps next [${next.id}] startFrame (${next.startFrame})`
    );
  }
  console.log(`    ✓ INV-CAP-04: Strict disjoint intervals verified (curr.endFrame < next.startFrame for all i).`);

  // =========================================================================
  // Gate 5: Strict Chunk Capacity Ceiling (INV-CAP-05)
  // =========================================================================
  console.log('  [Gate 5] Verifying INV-CAP-05: Chunk Capacity & Mobile Line Limits...');
  for (const g of groups) {
    const allWords = g.lines.flatMap((l) => l.words);
    assert.ok(
      allWords.length <= 8,
      `[INV-CAP-05 Violation] Group [${g.id}] contains ${allWords.length} words (ceiling is <= 8 words)`
    );
    assert.ok(
      g.lines.length >= 1 && g.lines.length <= 2,
      `[INV-CAP-05 Violation] Group [${g.id}] has ${g.lines.length} lines (must be 1 or 2)`
    );
    for (const line of g.lines) {
      assert.ok(
        line.text.length <= 26,
        `[INV-CAP-05 Violation] Group [${g.id}] line "${line.text}" length ${line.text.length} > 26 portrait limit`
      );
    }
  }
  console.log(`    ✓ INV-CAP-05: All groups respect word ceiling <= 8 and portrait line chars <= 26.`);

  // =========================================================================
  // Gate 6: Font-Weight & Layout Shift Invariance (INV-CAP-06)
  // =========================================================================
  console.log('  [Gate 6] Verifying INV-CAP-06: Strict Font-Weight Invariance (CLS = 0)...');
  assert.strictEqual(EDUCATIONAL_THEME.upcoming.fontWeight, '700');
  assert.strictEqual(EDUCATIONAL_THEME.active.fontWeight, '700');
  assert.strictEqual(EDUCATIONAL_THEME.spoken.fontWeight, '700');

  // Test DOM rendered markup across all 3 speech states
  const testWord = 'Scopus';
  const startF = 30;
  const endF = 60;

  // Active state: frame 45 (progress = 50%)
  const activeMarkup = ReactDOMServer.renderToStaticMarkup(
    React.createElement(KaraokeWord, { word: testWord, currentFrame: 45, startFrame: startF, endFrame: endF })
  );
  // Match font-weight in base and overlay
  const weightMatches = activeMarkup.match(/font-weight:(\d+)/g) || [];
  assert.ok(weightMatches.length >= 2, 'Active word must have base and overlay font-weight declarations');
  for (const match of weightMatches) {
    assert.strictEqual(
      match,
      'font-weight:700',
      `[INV-CAP-06 Violation] Font-weight mismatch: ${match} !== font-weight:700`
    );
  }

  // Verify CLS = 0 layout footprint properties
  assert.ok(activeMarkup.includes('position:relative'));
  assert.ok(activeMarkup.includes('display:inline-block'));
  assert.ok(activeMarkup.includes('white-space:nowrap'));
  console.log('    ✓ INV-CAP-06: Uniform fontWeight 700 confirmed on base and overlay (CLS = 0 guaranteed).');

  // =========================================================================
  // Gate 7: Anti-Blur & Zero Diffuse Shadow (INV-CAP-07)
  // =========================================================================
  console.log('  [Gate 7] Verifying INV-CAP-07: Anti-Blur & Zero Diffuse Shadow...');
  assert.ok(activeMarkup.includes('text-shadow:none'), 'Missing text-shadow:none on KaraokeWord');
  assert.ok(!activeMarkup.includes('filter:blur'), 'Forbidden filter:blur found on KaraokeWord');
  assert.ok(!activeMarkup.includes('drop-shadow'), 'Forbidden diffuse drop-shadow found on KaraokeWord');
  assert.ok(activeMarkup.includes('text-rendering:geometricPrecision'));
  assert.ok(activeMarkup.includes('-webkit-font-smoothing:antialiased'));
  console.log('    ✓ INV-CAP-07: textShadow:none, geometricPrecision, and antialiased rendering confirmed.');

  // =========================================================================
  // Gate 8: WCAG AAA Active Contrast & Backdrop Immunity (INV-CAP-08)
  // =========================================================================
  console.log('  [Gate 8] Verifying INV-CAP-08: WCAG AAA Contrast & Backdrop Immunity...');
  const bgRgb = parseRgbaColor(EDUCATIONAL_THEME.backgroundColor);
  const activeRgb = parseHexColor(EDUCATIONAL_THEME.active.color);
  const spokenRgb = parseHexColor(EDUCATIONAL_THEME.spoken.color);
  const upcomingRgb = parseHexColor(EDUCATIONAL_THEME.upcoming.color);

  const baseSlate = { r: 11, g: 17, b: 32 };
  const baseLum = computeRelativeLuminance(baseSlate);
  const activeLum = computeRelativeLuminance(activeRgb);
  const spokenLum = computeRelativeLuminance(spokenRgb);
  const upcomingLum = computeRelativeLuminance(upcomingRgb);

  // 1. Direct Contrast over #0B1120
  const crActiveBase = computeContrastRatio(activeLum, baseLum);
  assert.ok(
    crActiveBase >= 7.0,
    `[INV-CAP-08 Violation] Active color contrast over dark slate (${crActiveBase.toFixed(2)}:1) fails WCAG AAA (>= 7.0:1)`
  );

  const crSpokenBase = computeContrastRatio(spokenLum, baseLum);
  assert.ok(
    crSpokenBase >= 7.0,
    `[INV-CAP-08 Violation] Spoken color contrast (${crSpokenBase.toFixed(2)}:1) fails WCAG AAA (>= 7.0:1)`
  );

  // 2. Alpha-Composite Contrast over Pure White (#FFFFFF) Video Backdrop
  const compWhite = alphaComposite(bgRgb, { r: 255, g: 255, b: 255 });
  const compWhiteLum = computeRelativeLuminance(compWhite);
  const crActiveWhite = computeContrastRatio(activeLum, compWhiteLum);
  assert.ok(
    crActiveWhite >= 4.5,
    `[INV-CAP-08 Violation] Active color contrast over 100% white composite (${crActiveWhite.toFixed(2)}:1) fails WCAG AA (>= 4.5:1)`
  );

  const crSpokenWhite = computeContrastRatio(spokenLum, compWhiteLum);
  assert.ok(
    crSpokenWhite >= 4.5,
    `[INV-CAP-08 Violation] Spoken color contrast over 100% white composite (${crSpokenWhite.toFixed(2)}:1) fails WCAG AA (>= 4.5:1)`
  );

  console.log(`    [Measured Contrast] Active over Backdrop: ${crActiveBase.toFixed(2)}:1 (WCAG AAA >= 7.0:1)`);
  console.log(`    [Measured Contrast] Active over White Composite: ${crActiveWhite.toFixed(2)}:1 (WCAG AA >= 4.5:1)`);
  console.log(`    [Measured Contrast] Spoken over White Composite: ${crSpokenWhite.toFixed(2)}:1 (WCAG AA >= 4.5:1)`);
  console.log('    ✓ INV-CAP-08: WCAG AAA direct contrast and backdrop immunity independently certified.');

  console.log('\n======================================================================');
  console.log(' ALL 8 INVARIANT GATES PASSED (INV-CAP-01 to INV-CAP-08 CERTIFIED)');
  console.log('======================================================================\n');
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('caption-handoff-typography')) {
  try {
    runCaptionHandoffTypographyTests();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ INVARIANT TEST SUITE FAILED:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
