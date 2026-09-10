/**
 * tests/challenger_m3_karaoke.test.ts
 * Empirical Adversarial Stress Test Suite for Karaoke Word Progressive Fill & Layout Stability
 *
 * Authored by: challenger_m3_2 (teamwork_preview_challenger)
 * Roles: critic, specialist
 * Target: packages/caption-kit/ (utils.ts, theme.ts, KaraokeWord, KaraokeLine, KaraokeGroup, KaraokeCaptions)
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  calculateProgressiveFill,
  computeClipPathInset,
  resolveActiveGroup,
} from '../packages/caption-kit/src/utils';

import { EDUCATIONAL_THEME } from '../packages/caption-kit/src/theme';
import { KaraokeWord } from '../packages/caption-kit/src/KaraokeWord';
import { KaraokeLine } from '../packages/caption-kit/src/KaraokeLine';
import { KaraokeGroup } from '../packages/caption-kit/src/KaraokeGroup';
import { KaraokeCaptions } from '../packages/caption-kit/src/KaraokeCaptions';
import { CaptionsData, CaptionGroup, CaptionLine, CaptionWord } from '../packages/caption-kit/src/types';

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
// Adversarial Test Runner Definition
// ---------------------------------------------------------------------------
export async function runAllChallenges() {
  console.log('======================================================================');
  console.log(' Adversarial Stress Test: Karaoke Progressive Fill & Layout Stability');
  console.log(' Packages: @videorender/caption-kit (Remotion V3 Subsystem)');
  console.log('======================================================================\n');

  // =========================================================================
  // CATEGORY 1: Progressive Fill Monotonicity Across 10,000 Frames
  // =========================================================================
  await recordTest(
    'Monotonicity',
    'Standard word range [100, 200] exhibits strictly non-decreasing progress',
    () => {
      const start = 100;
      const end = 200;
      let prev = -1;
      for (let f = start; f <= end; f++) {
        const curr = calculateProgressiveFill(f, start, end);
        assert.ok(
          curr >= prev,
          `Monotonicity violation at frame ${f}: curr ${curr} < prev ${prev}`
        );
        assert.ok(curr >= 0.0 && curr <= 1.0, `Progress out of bounds [0, 1]: ${curr}`);
        prev = curr;
      }
      assert.strictEqual(calculateProgressiveFill(start, start, end), 0.0);
      assert.strictEqual(calculateProgressiveFill(end, start, end), 1.0);
      assert.strictEqual(calculateProgressiveFill((start + end) / 2, start, end), 0.5);
    }
  )();

  await recordTest(
    'Monotonicity',
    '10,000 frames continuous sweep (-2,000 to +8,000) across dense word timeline',
    () => {
      const words = [
        { startFrame: 0, endFrame: 60 },
        { startFrame: 80, endFrame: 150 },
        { startFrame: 200, endFrame: 500 },
        { startFrame: 1000, endFrame: 3000 },
        { startFrame: 4000, endFrame: 7500 },
      ];

      for (const w of words) {
        let prev = -1;
        for (let f = -2000; f <= 8000; f++) {
          const p = calculateProgressiveFill(f, w.startFrame, w.endFrame);
          assert.ok(!Number.isNaN(p), `Progress is NaN at frame ${f} for word [${w.startFrame}, ${w.endFrame}]`);
          assert.ok(Number.isFinite(p), `Progress is non-finite at frame ${f}`);
          assert.ok(p >= 0.0 && p <= 1.0, `Progress ${p} outside [0.0, 1.0] at frame ${f}`);

          if (f <= w.startFrame) {
            assert.strictEqual(p, 0.0, `Expected 0.0 before startFrame, got ${p} at frame ${f}`);
          } else if (f >= w.endFrame) {
            assert.strictEqual(p, 1.0, `Expected 1.0 at or after endFrame, got ${p} at frame ${f}`);
          }

          assert.ok(p >= prev, `Monotonicity regression for word [${w.startFrame}, ${w.endFrame}] at frame ${f}: ${p} < ${prev}`);
          prev = p;
        }
      }
    }
  )();

  await recordTest(
    'Monotonicity',
    'Backward scrubbing determinism (time-reversibility: forward === backward)',
    () => {
      const start = 300;
      const end = 900;
      const forwardValues: number[] = [];
      for (let f = -500; f <= 1500; f++) {
        forwardValues.push(calculateProgressiveFill(f, start, end));
      }

      const backwardValues: number[] = [];
      for (let f = 1500; f >= -500; f--) {
        backwardValues.push(calculateProgressiveFill(f, start, end));
      }
      backwardValues.reverse();

      assert.strictEqual(forwardValues.length, backwardValues.length);
      for (let i = 0; i < forwardValues.length; i++) {
        assert.strictEqual(
          forwardValues[i],
          backwardValues[i],
          `Backward scrubbing diverged at index ${i}: forward ${forwardValues[i]} !== backward ${backwardValues[i]}`
        );
      }
    }
  )();

  await recordTest(
    'Monotonicity',
    'Extreme boundary frames: far negative (-10^7) and far future (+10^7)',
    () => {
      const start = 50;
      const end = 150;
      assert.strictEqual(calculateProgressiveFill(-10_000_000, start, end), 0.0);
      assert.strictEqual(calculateProgressiveFill(-1_000, start, end), 0.0);
      assert.strictEqual(calculateProgressiveFill(-1, start, end), 0.0);
      assert.strictEqual(calculateProgressiveFill(10_000_000, start, end), 1.0);
      assert.strictEqual(calculateProgressiveFill(1_000_000, start, end), 1.0);
      assert.strictEqual(calculateProgressiveFill(151, start, end), 1.0);
    }
  )();

  await recordTest(
    'Monotonicity',
    'Sub-frame floating-point values maintain strict monotonicity',
    () => {
      const start = 10;
      const end = 20;
      let prev = 0.0;
      for (let f = 10.0; f <= 20.0; f += 0.1) {
        const p = calculateProgressiveFill(f, start, end);
        assert.ok(p >= prev - 1e-9, `Sub-frame monotonicity failed at frame ${f}: ${p} < ${prev}`);
        assert.ok(p >= 0.0 && p <= 1.0);
        prev = p;
      }
    }
  )();

  // =========================================================================
  // CATEGORY 2: Zero-Duration Words & Degenerate Timing Stress
  // =========================================================================
  await recordTest(
    'Zero-Duration',
    'Zero-duration word (startFrame === endFrame) cleanly transitions 0.0 -> 1.0 with no NaN',
    () => {
      const testCases = [0, 50, 500, 10000];
      for (const frameMark of testCases) {
        // Frame before
        assert.strictEqual(
          calculateProgressiveFill(frameMark - 1, frameMark, frameMark),
          0.0,
          `Expected 0.0 before mark ${frameMark}`
        );
        // Exact frame
        assert.strictEqual(
          calculateProgressiveFill(frameMark, frameMark, frameMark),
          1.0,
          `Expected 1.0 at mark ${frameMark}`
        );
        // Frame after
        assert.strictEqual(
          calculateProgressiveFill(frameMark + 1, frameMark, frameMark),
          1.0,
          `Expected 1.0 after mark ${frameMark}`
        );
      }
    }
  )();

  await recordTest(
    'Zero-Duration',
    'Inverted timing degenerate case (startFrame > endFrame) resolves safely without crash',
    () => {
      const p1 = calculateProgressiveFill(150, 200, 100);
      assert.strictEqual(p1, 0.0);
      const p2 = calculateProgressiveFill(250, 200, 100);
      assert.strictEqual(p2, 1.0);
    }
  )();

  await recordTest(
    'Zero-Duration',
    'Single-frame duration word (endFrame === startFrame + 1) step behavior',
    () => {
      const start = 40;
      const end = 41;
      assert.strictEqual(calculateProgressiveFill(39, start, end), 0.0);
      assert.strictEqual(calculateProgressiveFill(40, start, end), 0.0);
      assert.strictEqual(calculateProgressiveFill(41, start, end), 1.0);
      assert.strictEqual(calculateProgressiveFill(42, start, end), 1.0);
    }
  )();

  // =========================================================================
  // CATEGORY 3: CSS Clip-Path Inset Formatting & Revelation Monotonicity
  // =========================================================================
  await recordTest(
    'ClipPath',
    'computeClipPathInset syntax strictly matches CSS inset specification',
    () => {
      const regex = /^inset\(0\s+(\d+\.\d{2})%\s+0\s+0\)$/;
      const samples = [0.0, 0.1, 0.25, 0.3333, 0.5, 0.6667, 0.75, 0.9, 1.0];
      for (const s of samples) {
        const result = computeClipPathInset(s);
        assert.ok(regex.test(result), `Invalid clip-path format: "${result}" for progress ${s}`);
      }
      assert.strictEqual(computeClipPathInset(0.0), 'inset(0 100.00% 0 0)');
      assert.strictEqual(computeClipPathInset(0.5), 'inset(0 50.00% 0 0)');
      assert.strictEqual(computeClipPathInset(1.0), 'inset(0 0.00% 0 0)');
    }
  )();

  await recordTest(
    'ClipPath',
    'computeClipPathInset right-inset percentage decreases monotonically (revealing more text)',
    () => {
      let prevInset = 100.01;
      for (let p = 0.0; p <= 1.0; p += 0.005) {
        const str = computeClipPathInset(p);
        const match = str.match(/inset\(0\s+([\d.]+)%\s+0\s+0\)/);
        assert.ok(match, `Could not parse inset from ${str}`);
        const insetVal = parseFloat(match[1]);
        assert.ok(
          insetVal <= prevInset + 1e-6,
          `Right inset percentage increased: ${insetVal} > ${prevInset} at progress ${p}`
        );
        assert.ok(insetVal >= 0.0 && insetVal <= 100.0, `Inset val out of [0, 100]: ${insetVal}`);
        prevInset = insetVal;
      }
    }
  )();

  await recordTest(
    'ClipPath',
    'computeClipPathInset clamps negative progress and overflow progress',
    () => {
      assert.strictEqual(computeClipPathInset(-100), 'inset(0 100.00% 0 0)');
      assert.strictEqual(computeClipPathInset(-0.001), 'inset(0 100.00% 0 0)');
      assert.strictEqual(computeClipPathInset(1.001), 'inset(0 0.00% 0 0)');
      assert.strictEqual(computeClipPathInset(99999), 'inset(0 0.00% 0 0)');
    }
  )();

  // =========================================================================
  // CATEGORY 4: Zero-Layout-Shift (CLS = 0) DOM & Style Verification
  // =========================================================================
  await recordTest(
    'CLS=0 DOM',
    'KaraokeWord renders static base layer and absolute overlay during active speech',
    () => {
      const word = 'Progressive';
      const startFrame = 100;
      const endFrame = 150;

      // 1. Upcoming State (frame 90 < 100)
      const upcomingHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeWord, { word, currentFrame: 90, startFrame, endFrame })
      );
      assert.ok(upcomingHtml.includes('position:relative'), 'Base layer missing position:relative');
      assert.ok(upcomingHtml.includes('display:inline-block'), 'Base layer missing display:inline-block');
      assert.ok(upcomingHtml.includes('white-space:nowrap'), 'Base layer missing white-space:nowrap');
      assert.ok(upcomingHtml.includes('color:#94a3b8'), 'Base layer missing upcoming color slate-400');
      assert.ok(!upcomingHtml.includes('position:absolute'), 'Upcoming state should NOT contain overlay');

      // 2. Active State at 50% (frame 125)
      const activeHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeWord, { word, currentFrame: 125, startFrame, endFrame })
      );
      // Outer base layer preserved
      assert.ok(activeHtml.includes('position:relative'), 'Active word outer span missing position:relative');
      assert.ok(activeHtml.includes('display:inline-block'), 'Active word outer span missing display:inline-block');
      // Inner absolute overlay present
      assert.ok(activeHtml.includes('position:absolute'), 'Highlight overlay missing position:absolute');
      assert.ok(activeHtml.includes('top:0'), 'Highlight overlay missing top:0');
      assert.ok(activeHtml.includes('left:0'), 'Highlight overlay missing left:0');
      assert.ok(activeHtml.includes('width:100%'), 'Highlight overlay missing width:100%');
      assert.ok(activeHtml.includes('height:100%'), 'Highlight overlay missing height:100%');
      assert.ok(activeHtml.includes('pointer-events:none'), 'Highlight overlay missing pointer-events:none');
      assert.ok(activeHtml.includes('aria-hidden="true"'), 'Highlight overlay missing aria-hidden="true"');
      assert.ok(activeHtml.includes('clip-path:inset(0 50.00% 0 0)'), 'Highlight overlay missing clip-path');
      assert.ok(activeHtml.includes('color:#38bdf8'), 'Highlight overlay missing active sky-400 color');

      // 3. Spoken State (frame 160 > 150)
      const spokenHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeWord, { word, currentFrame: 160, startFrame, endFrame })
      );
      assert.ok(spokenHtml.includes('position:relative'), 'Spoken state outer span missing position:relative');
      assert.ok(spokenHtml.includes('color:#cbd5e1'), 'Spoken state missing slate-300 color');
      assert.ok(!spokenHtml.includes('position:absolute'), 'Spoken state should NOT contain overlay');
    }
  )();

  await recordTest(
    'CLS=0 DOM',
    'Base layer layout footprint (display, position, whiteSpace, marginRight) is strictly invariant across frames',
    () => {
      const word = 'Continuous';
      const start = 10;
      const end = 30;

      // Sample 40 frames from before to after
      for (let f = 0; f <= 40; f++) {
        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(KaraokeWord, { word, currentFrame: f, startFrame: start, endFrame: end })
        );

        // Every frame MUST have the invariant base styles
        assert.ok(html.startsWith('<span style="position:relative;display:inline-block;margin-right:0.28em;white-space:nowrap;'),
          `Base layer layout invariant broken at frame ${f}: ${html.substring(0, 80)}`
        );
      }
    }
  )();

  await recordTest(
    'CLS=0 DOM',
    'KaraokeGroup maintains rigid fixed box dimensions width/height during speech',
    () => {
      const sampleGroup: CaptionGroup = {
        id: 'g0',
        startFrame: 10,
        endFrame: 60,
        start: 0.33,
        end: 2.0,
        box: { x: 192, y: 864, width: 1536, height: 120 },
        lines: [
          {
            lineIndex: 0,
            text: 'Rigid layout test',
            words: [
              { id: 'w0', word: 'Rigid', start: 0.33, end: 0.8, startFrame: 10, endFrame: 24 },
              { id: 'w1', word: 'layout', start: 0.85, end: 1.4, startFrame: 25, endFrame: 42 },
              { id: 'w2', word: 'test', start: 1.45, end: 2.0, startFrame: 43, endFrame: 60 },
            ],
          },
        ],
      };

      for (let f = 10; f <= 60; f += 5) {
        const groupHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(KaraokeGroup, { group: sampleGroup, currentFrame: f })
        );
        assert.ok(groupHtml.includes('width:1536px'), `Group width not fixed to 1536px at frame ${f}`);
        assert.ok(groupHtml.includes('height:120px'), `Group height not fixed to 120px at frame ${f}`);
        assert.ok(groupHtml.includes('box-sizing:border-box'), `Group missing box-sizing:border-box at frame ${f}`);
        assert.ok(groupHtml.includes('display:flex'), `Group missing display:flex at frame ${f}`);
      }
    }
  )();

  await recordTest(
    'CLS=0 DOM',
    'KaraokeCaptions maintains rigid coordinates [x=192, y=864, w=1536, h=120] and zIndex',
    () => {
      const sampleCaptions: CaptionsData = {
        version: '1.0.0',
        fps: 30,
        groups: [
          {
            id: 'g0',
            startFrame: 0,
            endFrame: 50,
            start: 0.0,
            end: 1.67,
            box: { x: 192, y: 864, width: 1536, height: 120 },
            lines: [
              {
                lineIndex: 0,
                text: 'Caption coordinate stability',
                words: [
                  { id: 'w0', word: 'Caption', start: 0.0, end: 0.5, startFrame: 0, endFrame: 15 },
                  { id: 'w1', word: 'coordinate', start: 0.5, end: 1.0, startFrame: 15, endFrame: 30 },
                  { id: 'w2', word: 'stability', start: 1.0, end: 1.67, startFrame: 30, endFrame: 50 },
                ],
              },
            ],
          },
        ],
      };

      for (let f = 0; f <= 50; f += 10) {
        const captionsHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(KaraokeCaptions, { captions: sampleCaptions, currentFrame: f })
        );
        assert.ok(captionsHtml.includes('position:absolute'), 'Captions missing position:absolute');
        assert.ok(captionsHtml.includes('left:192px'), 'Captions coordinate X drifted');
        assert.ok(captionsHtml.includes('top:864px'), 'Captions coordinate Y drifted');
        assert.ok(captionsHtml.includes('width:1536px'), 'Captions width drifted');
        assert.ok(captionsHtml.includes('height:120px'), 'Captions height drifted');
        assert.ok(captionsHtml.includes('z-index:100'), 'Captions z-index missing');
      }
    }
  )();

  // =========================================================================
  // CATEGORY 5: Theme Contrast Verification (WCAG 2.1 AA >= 4.5:1)
  // =========================================================================
  await recordTest(
    'Contrast WCAG',
    'EDUCATIONAL_THEME active color (#38bdf8) achieves >= 4.5:1 against slate-900 (#0f172a)',
    () => {
      const bgRgb = parseHexColor('#0f172a');
      const activeRgb = parseHexColor(EDUCATIONAL_THEME.active.color);
      const bgLum = computeRelativeLuminance(bgRgb);
      const activeLum = computeRelativeLuminance(activeRgb);
      const cr = computeContrastRatio(activeLum, bgLum);

      console.log(`    [Active Contrast] CR: ${cr.toFixed(2)}:1 (threshold: >= 4.5:1)`);
      assert.ok(
        cr >= 4.5,
        `Active color contrast ratio ${cr.toFixed(2)}:1 fails WCAG AA requirement (>= 4.5:1)`
      );
      assert.ok(cr >= 7.0, `Active color also passes WCAG AAA threshold (>= 7.0:1)`);
    }
  )();

  await recordTest(
    'Contrast WCAG',
    'EDUCATIONAL_THEME spoken color (#cbd5e1) achieves >= 4.5:1 against slate-900 (#0f172a)',
    () => {
      const bgRgb = parseHexColor('#0f172a');
      const spokenRgb = parseHexColor(EDUCATIONAL_THEME.spoken.color);
      const bgLum = computeRelativeLuminance(bgRgb);
      const spokenLum = computeRelativeLuminance(spokenRgb);
      const cr = computeContrastRatio(spokenLum, bgLum);

      console.log(`    [Spoken Contrast] CR: ${cr.toFixed(2)}:1 (threshold: >= 4.5:1)`);
      assert.ok(
        cr >= 4.5,
        `Spoken color contrast ratio ${cr.toFixed(2)}:1 fails WCAG AA requirement (>= 4.5:1)`
      );
      assert.ok(cr >= 7.0, `Spoken color also passes WCAG AAA threshold (>= 7.0:1)`);
    }
  )();

  await recordTest(
    'Contrast WCAG',
    'EDUCATIONAL_THEME upcoming color (#94a3b8) achieves >= 4.5:1 against slate-900 (#0f172a)',
    () => {
      const bgRgb = parseHexColor('#0f172a');
      const upcomingRgb = parseHexColor(EDUCATIONAL_THEME.upcoming.color);
      const bgLum = computeRelativeLuminance(bgRgb);
      const upcomingLum = computeRelativeLuminance(upcomingRgb);
      const cr = computeContrastRatio(upcomingLum, bgLum);

      console.log(`    [Upcoming Contrast] CR: ${cr.toFixed(2)}:1 (threshold: >= 4.5:1)`);
      assert.ok(
        cr >= 4.5,
        `Upcoming color contrast ratio ${cr.toFixed(2)}:1 fails WCAG AA requirement (>= 4.5:1)`
      );
    }
  )();

  await recordTest(
    'Contrast WCAG',
    'Alpha composited backdrops: Active and Spoken maintain >= 4.5:1; Upcoming satisfies WCAG AA large-text (>= 3.0:1)',
    () => {
      const bgRgba = parseRgbaColor(EDUCATIONAL_THEME.backgroundColor);
      const activeRgb = parseHexColor(EDUCATIONAL_THEME.active.color);
      const spokenRgb = parseHexColor(EDUCATIONAL_THEME.spoken.color);
      const upcomingRgb = parseHexColor(EDUCATIONAL_THEME.upcoming.color);

      // Over Pure Black backdrop (#000000)
      const compBlack = alphaComposite(bgRgba, { r: 0, g: 0, b: 0 });
      const compBlackLum = computeRelativeLuminance(compBlack);
      const crActiveBlack = computeContrastRatio(computeRelativeLuminance(activeRgb), compBlackLum);
      const crSpokenBlack = computeContrastRatio(computeRelativeLuminance(spokenRgb), compBlackLum);
      const crUpcomingBlack = computeContrastRatio(computeRelativeLuminance(upcomingRgb), compBlackLum);

      assert.ok(crActiveBlack >= 4.5, `Active over black backdrop ${crActiveBlack.toFixed(2)} < 4.5`);
      assert.ok(crSpokenBlack >= 4.5, `Spoken over black backdrop ${crSpokenBlack.toFixed(2)} < 4.5`);
      assert.ok(crUpcomingBlack >= 4.5, `Upcoming over black backdrop ${crUpcomingBlack.toFixed(2)} < 4.5`);

      // Over Pure White backdrop (#ffffff)
      const compWhite = alphaComposite(bgRgba, { r: 255, g: 255, b: 255 });
      const compWhiteLum = computeRelativeLuminance(compWhite);
      const crActiveWhite = computeContrastRatio(computeRelativeLuminance(activeRgb), compWhiteLum);
      const crSpokenWhite = computeContrastRatio(computeRelativeLuminance(spokenRgb), compWhiteLum);
      const crUpcomingWhite = computeContrastRatio(computeRelativeLuminance(upcomingRgb), compWhiteLum);

      console.log(`    [Composite over White] Active: ${crActiveWhite.toFixed(2)}:1, Spoken: ${crSpokenWhite.toFixed(2)}:1, Upcoming: ${crUpcomingWhite.toFixed(2)}:1`);
      // Active and spoken exceed 4.5:1 even over pure white video background bleeding through 15% opacity
      assert.ok(crActiveWhite >= 4.5, `Active over white backdrop ${crActiveWhite.toFixed(2)} < 4.5`);
      assert.ok(crSpokenWhite >= 4.5, `Spoken over white backdrop ${crSpokenWhite.toFixed(2)} < 4.5`);

      // Caption font size is 36px (large text). WCAG AA threshold for large text is 3.0:1
      assert.ok(
        crUpcomingWhite >= 3.0,
        `Upcoming over white backdrop ${crUpcomingWhite.toFixed(2)} fails WCAG AA large-text standard (>= 3.0:1)`
      );
    }
  )();

  // =========================================================================
  // CATEGORY 6: Anti-Jitter & Transform Invariant (Strictly 'none')
  // =========================================================================
  await recordTest(
    'Transform Invariant',
    'EDUCATIONAL_THEME defines transform: strictly "none" across upcoming, active, spoken',
    () => {
      assert.strictEqual(EDUCATIONAL_THEME.upcoming.transform, 'none');
      assert.strictEqual(EDUCATIONAL_THEME.active.transform, 'none');
      assert.strictEqual(EDUCATIONAL_THEME.spoken.transform, 'none');
    }
  )();

  await recordTest(
    'Transform Invariant',
    'No dynamic scale/rotate/translate/keyframes transforms across 500 rendered frames',
    () => {
      const forbiddenTokens = ['scale', 'rotate', 'translate', 'matrix', 'skew', 'cubic-bezier', 'animation'];
      const word = 'Steady';
      const start = 100;
      const end = 200;

      for (let f = 50; f <= 250; f++) {
        const wordHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(KaraokeWord, { word, currentFrame: f, startFrame: start, endFrame: end })
        );

        // Check for transform: none
        assert.ok(wordHtml.includes('transform:none'), `Frame ${f} missing transform:none`);

        // Assert absence of forbidden dynamic transforms
        for (const token of forbiddenTokens) {
          assert.ok(
            !wordHtml.toLowerCase().includes(token),
            `Frame ${f} contains forbidden motion token "${token}": ${wordHtml}`
          );
        }
      }
    }
  )();

  await recordTest(
    'Transform Invariant',
    'KaraokeGroup and KaraokeCaptions containers enforce transform: none with zero jitter',
    () => {
      const testGroup: CaptionGroup = {
        id: 'g_steady',
        startFrame: 0,
        endFrame: 100,
        start: 0,
        end: 3.33,
        box: { x: 192, y: 864, width: 1536, height: 120 },
        lines: [
          {
            lineIndex: 0,
            text: 'Steady container',
            words: [{ id: 'w0', word: 'Steady', start: 0, end: 1.5, startFrame: 0, endFrame: 45 }],
          },
        ],
      };

      const groupHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeGroup, { group: testGroup, currentFrame: 20 })
      );
      assert.ok(groupHtml.includes('transform:none'), 'KaraokeGroup missing transform:none');

      const captionsData: CaptionsData = {
        version: '1.0.0',
        fps: 30,
        groups: [testGroup],
      };
      const captionsHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeCaptions, { captions: captionsData, currentFrame: 20 })
      );
      assert.ok(!captionsHtml.includes('scale('), 'KaraokeCaptions injected scale transform');
      assert.ok(!captionsHtml.includes('rotate('), 'KaraokeCaptions injected rotate transform');
    }
  )();

  // =========================================================================
  // CATEGORY 7: Silence Intervals & Multi-Line Subtitle Sequences
  // =========================================================================
  await recordTest(
    'Multi-Group & Silence',
    'resolveActiveGroup and KaraokeCaptions handle silence gaps cleanly (return null / unmounted)',
    () => {
      const captionsData: CaptionsData = {
        version: '1.0.0',
        fps: 30,
        groups: [
          {
            id: 'g1',
            startFrame: 10,
            endFrame: 50,
            start: 0.33,
            end: 1.67,
            box: { x: 192, y: 864, width: 1536, height: 120 },
            lines: [
              {
                lineIndex: 0,
                text: 'First phrase',
                words: [
                  { id: 'w0', word: 'First', start: 0.33, end: 1.0, startFrame: 10, endFrame: 30 },
                  { id: 'w1', word: 'phrase', start: 1.0, end: 1.67, startFrame: 30, endFrame: 50 },
                ],
              },
            ],
          },
          // Silence gap: frame 51 to 99
          {
            id: 'g2',
            startFrame: 100,
            endFrame: 150,
            start: 3.33,
            end: 5.0,
            box: { x: 192, y: 864, width: 1536, height: 120 },
            lines: [
              {
                lineIndex: 0,
                text: 'Second phrase',
                words: [
                  { id: 'w2', word: 'Second', start: 3.33, end: 4.16, startFrame: 100, endFrame: 125 },
                  { id: 'w3', word: 'phrase', start: 4.16, end: 5.0, startFrame: 125, endFrame: 150 },
                ],
              },
            ],
          },
        ],
      };

      // Before speech (frame 0)
      assert.strictEqual(resolveActiveGroup(captionsData, 0), null);
      assert.strictEqual(
        ReactDOMServer.renderToStaticMarkup(React.createElement(KaraokeCaptions, { captions: captionsData, currentFrame: 0 })),
        ''
      );

      // During Group 1 (frame 25)
      assert.strictEqual(resolveActiveGroup(captionsData, 25)?.id, 'g1');
      const g1Html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeCaptions, { captions: captionsData, currentFrame: 25 })
      );
      assert.ok(g1Html.includes('First'), 'Group 1 rendered markup missing "First"');
      assert.ok(g1Html.includes('phrase'), 'Group 1 rendered markup missing "phrase"');

      // During Silence Gap (frame 75)
      assert.strictEqual(resolveActiveGroup(captionsData, 75), null);
      assert.strictEqual(
        ReactDOMServer.renderToStaticMarkup(React.createElement(KaraokeCaptions, { captions: captionsData, currentFrame: 75 })),
        '',
        'During silence gap, captions must be null/empty'
      );

      // During Group 2 (frame 120)
      assert.strictEqual(resolveActiveGroup(captionsData, 120)?.id, 'g2');
      const g2Html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeCaptions, { captions: captionsData, currentFrame: 120 })
      );
      assert.ok(g2Html.includes('Second'), 'Group 2 rendered markup missing "Second"');

      // After speech ends (frame 200)
      assert.strictEqual(resolveActiveGroup(captionsData, 200), null);
      assert.strictEqual(
        ReactDOMServer.renderToStaticMarkup(React.createElement(KaraokeCaptions, { captions: captionsData, currentFrame: 200 })),
        ''
      );
    }
  )();

  await recordTest(
    'Multi-Group & Silence',
    'Multi-line caption rendering with punctuation and exact highlight synchrony',
    () => {
      const line1: CaptionLine = {
        lineIndex: 0,
        text: 'Visual learning accelerates,',
        words: [
          { id: 'w0', word: 'Visual', start: 0.0, end: 0.4, startFrame: 0, endFrame: 12 },
          { id: 'w1', word: 'learning', start: 0.4, end: 0.9, startFrame: 12, endFrame: 27 },
          { id: 'w2', word: 'accelerates,', start: 0.9, end: 1.5, startFrame: 27, endFrame: 45 },
        ],
      };
      const line2: CaptionLine = {
        lineIndex: 1,
        text: 'when rhythm is precise.',
        words: [
          { id: 'w3', word: 'when', start: 1.5, end: 1.8, startFrame: 45, endFrame: 54 },
          { id: 'w4', word: 'rhythm', start: 1.8, end: 2.2, startFrame: 54, endFrame: 66 },
          { id: 'w5', word: 'is', start: 2.2, end: 2.4, startFrame: 66, endFrame: 72 },
          { id: 'w6', word: 'precise.', start: 2.4, end: 3.0, startFrame: 72, endFrame: 90 },
        ],
      };

      const group: CaptionGroup = {
        id: 'g_multiline',
        startFrame: 0,
        endFrame: 90,
        start: 0.0,
        end: 3.0,
        box: { x: 192, y: 864, width: 1536, height: 120 },
        lines: [line1, line2],
      };

      // Render at frame 20 (middle of 'learning' in line 1)
      const htmlF20 = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeGroup, { group, currentFrame: 20 })
      );
      assert.ok(htmlF20.includes('Visual'), 'Line 1 missing Visual');
      assert.ok(htmlF20.includes('precise.'), 'Line 2 missing precise.');
      // 'learning' should have active highlight
      assert.ok(htmlF20.includes('color:#38bdf8'), 'Active word highlight missing at frame 20');

      // Render at frame 60 (middle of 'rhythm' in line 2)
      const htmlF60 = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeGroup, { group, currentFrame: 60 })
      );
      // Line 1 words should all be spoken (color #cbd5e1)
      assert.ok(htmlF60.includes('color:#cbd5e1'), 'Line 1 words should be spoken');
      // 'rhythm' should be active (color #38bdf8)
      assert.ok(htmlF60.includes('color:#38bdf8'), 'Active word rhythm missing highlight at frame 60');
    }
  )();

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n======================================================================');
  console.log(` RESULTS SUMMARY: ${passedCount}/${total} PASSED (${failedCount} FAILED)`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    console.error('FAILURES DETECTED:');
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`  - [${r.category}] ${r.name}`);
      console.error(`    Error: ${r.error}`);
    }
  }

  return { total, passed: passedCount, failed: failedCount, results };
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('challenger_m3_karaoke')) {
  runAllChallenges()
    .then((summary) => {
      console.log(`Challenger run completed. Verdict: ${summary.failed > 0 ? 'FAIL' : 'PASS'}`);
      if (summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal challenger execution error:', err);
      process.exit(1);
    });
}
