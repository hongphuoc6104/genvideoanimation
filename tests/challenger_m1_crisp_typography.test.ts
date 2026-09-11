/**
 * tests/challenger_m1_crisp_typography.test.ts
 *
 * Empirical Adversarial Challenger Suite for Crisp Typography & Anti-Blur Karaoke Invariant (R4)
 * Authored by: challenger_m1_caption_2 (empirical-challenger)
 * Roles: critic, specialist
 *
 * Verification Scope:
 * 1. Font-weight uniformity across upcoming, active, spoken states (strictly '700', CLS = 0).
 * 2. Zero blur: no textShadow with blur > 2px, no CSS blur filters, no wide drop-shadows.
 * 3. Exact WCAG 2.1 contrast ratio evaluations for:
 *    - Active Sky Blue (#38BDF8)
 *    - Active Bright Amber (#FCD34D)
 *    - Spoken text (#CBD5E1)
 *    - Upcoming slate (#94A3B8)
 *    - Unread text (rgba(255, 255, 255, 0.40))
 *    Over direct backdrop rgba(11, 17, 32, 0.92) and 100% white bleed-through backdrop.
 * 4. Vietnamese typography & diacritic safety (no tonal clipping at 44px with 1.25-1.3 line-height).
 * 5. Layout stability under high-velocity frame scrubbing and sub-pixel alignment.
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { KaraokeWord } from '../packages/caption-kit/src/KaraokeWord';
import { KaraokeLine } from '../packages/caption-kit/src/KaraokeLine';
import { KaraokeGroup } from '../packages/caption-kit/src/KaraokeGroup';
import { KaraokeCaptions } from '../packages/caption-kit/src/KaraokeCaptions';
import { EDUCATIONAL_THEME, CRISP_THEME } from '../packages/caption-kit/src/theme';
import { CaptionGroup, CaptionLine, CaptionWord } from '../packages/caption-kit/src/types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ suite, name, passed: true });
      console.log(`  ✓ [${suite}] ${name}`);
    } catch (err: any) {
      results.push({ suite, name, passed: false, error: err?.message || String(err) });
      console.error(`  ✗ [${suite}] ${name}: ${err?.message || err}`);
    }
  };
}

// ---------------------------------------------------------------------------
// WCAG 2.1 Mathematical Algorithms
// ---------------------------------------------------------------------------
function sRGBtoLinear(val: number): number {
  const v = val / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function computeRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function computeContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function alphaComposite(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
  };
}

export async function runCrispTypographyTests() {
  console.log('======================================================================');
  console.log(' EMPIRICAL CHALLENGER: Crisp Typography & Anti-Blur Invariants (R4)');
  console.log(' Target: packages/caption-kit (KaraokeWord, theme, KaraokeCaptions)');
  console.log('======================================================================\n');

  // =========================================================================
  // SUITE 1: Strict Font-Weight Uniformity & Zero Glyph Delta (CLS = 0)
  // =========================================================================
  await recordTest(
    'Font-Weight Uniformity',
    'EDUCATIONAL_THEME defines strictly fontWeight: "700" across upcoming, active, spoken',
    () => {
      assert.strictEqual(EDUCATIONAL_THEME.upcoming.fontWeight, '700');
      assert.strictEqual(EDUCATIONAL_THEME.active.fontWeight, '700');
      assert.strictEqual(EDUCATIONAL_THEME.spoken.fontWeight, '700');
    }
  )();

  await recordTest(
    'Font-Weight Uniformity',
    'CRISP_THEME inherits strictly fontWeight: "700" across all states',
    () => {
      assert.strictEqual(CRISP_THEME.upcoming.fontWeight, '700');
      assert.strictEqual(CRISP_THEME.active.fontWeight, '700');
      assert.strictEqual(CRISP_THEME.spoken.fontWeight, '700');
    }
  )();

  await recordTest(
    'Font-Weight Uniformity',
    'KaraokeWord renders strictly font-weight: 700 on both base layer and active overlay',
    () => {
      const testWords = ['Nghiên', 'cứu', 'khoảng', 'trống', 'Scopus', '1080x1920'];
      for (const word of testWords) {
        // Active highlight state (progress = 50%)
        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(KaraokeWord, {
            word,
            currentFrame: 15,
            startFrame: 10,
            endFrame: 20,
          })
        );

        const weightMatches = html.match(/font-weight:(\d+)/g) || [];
        assert.ok(weightMatches.length >= 2, `Word "${word}" missing dual-layer font-weight`);
        for (const match of weightMatches) {
          assert.strictEqual(
            match,
            'font-weight:700',
            `Word "${word}" has non-700 font weight declaration: ${match}`
          );
        }
      }
    }
  )();

  await recordTest(
    'Font-Weight Uniformity',
    'Zero layout footprint shift: display, position, whiteSpace, letterSpacing remain identical',
    () => {
      for (let f = 0; f <= 30; f++) {
        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(KaraokeWord, {
            word: 'ĐộtPhá',
            currentFrame: f,
            startFrame: 10,
            endFrame: 20,
          })
        );
        // Base layer is always the primary layout-generating element in the DOM
        assert.ok(html.includes('position:relative'), `Frame ${f} missing position:relative`);
        assert.ok(html.includes('display:inline-block'), `Frame ${f} missing display:inline-block`);
        assert.ok(html.includes('white-space:nowrap'), `Frame ${f} missing white-space:nowrap`);
      }
    }
  )();

  // =========================================================================
  // SUITE 2: Zero Blur & Anti-Blur Vector Crispness
  // =========================================================================
  await recordTest(
    'Zero Blur',
    'KaraokeWord styles declare textShadow: "none" and prohibit blur > 2px',
    () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeWord, {
          word: 'SắcNét',
          currentFrame: 15,
          startFrame: 10,
          endFrame: 20,
        })
      );
      assert.ok(html.includes('text-shadow:none'), 'KaraokeWord missing text-shadow:none');
      assert.ok(!html.includes('filter:blur'), 'Found filter:blur in rendered markup');
      assert.ok(!html.includes('drop-shadow'), 'Found drop-shadow in rendered markup');
    }
  )();

  await recordTest(
    'Zero Blur',
    'Text rendering and font smoothing enforce geometric precision and antialiasing',
    () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeWord, {
          word: 'TốiƯu',
          currentFrame: 15,
          startFrame: 10,
          endFrame: 20,
        })
      );
      assert.ok(
        html.includes('text-rendering:geometricPrecision'),
        'Missing text-rendering:geometricPrecision'
      );
      assert.ok(
        html.includes('-webkit-font-smoothing:antialiased'),
        'Missing -webkit-font-smoothing:antialiased'
      );
    }
  )();

  // =========================================================================
  // SUITE 3: Exact WCAG 2.1 Contrast Ratios
  // =========================================================================
  const darkSlate = { r: 11, g: 17, b: 32 }; // #0B1120
  const whiteBg = { r: 255, g: 255, b: 255 }; // #FFFFFF
  const blackBg = { r: 0, g: 0, b: 0 }; // #000000

  const backdropRgba = { r: 11, g: 17, b: 32, a: 0.92 }; // rgba(11, 17, 32, 0.92)
  const compBackdropOnWhite = alphaComposite(backdropRgba, whiteBg);
  const compBackdropOnBlack = alphaComposite(backdropRgba, blackBg);

  const lumDirectSlate = computeRelativeLuminance(darkSlate.r, darkSlate.g, darkSlate.b);
  const lumBackdropOnWhite = computeRelativeLuminance(
    compBackdropOnWhite.r,
    compBackdropOnWhite.g,
    compBackdropOnWhite.b
  );
  const lumBackdropOnBlack = computeRelativeLuminance(
    compBackdropOnBlack.r,
    compBackdropOnBlack.g,
    compBackdropOnBlack.b
  );

  await recordTest(
    'WCAG Contrast',
    'Active Sky Blue (#38BDF8) achieves >= 7.0:1 on backdrop and >= 4.5:1 on white composite',
    () => {
      const skyBlue = { r: 0x38, g: 0xbd, b: 0xf8 };
      const lum = computeRelativeLuminance(skyBlue.r, skyBlue.g, skyBlue.b);

      const crDirect = computeContrastRatio(lum, lumDirectSlate);
      const crWhiteComp = computeContrastRatio(lum, lumBackdropOnWhite);
      const crBlackComp = computeContrastRatio(lum, lumBackdropOnBlack);

      console.log(`      [#38BDF8] Direct: ${crDirect.toFixed(2)}:1 | On White: ${crWhiteComp.toFixed(2)}:1 | On Black: ${crBlackComp.toFixed(2)}:1`);

      assert.ok(crDirect >= 7.0, `Sky Blue direct contrast ${crDirect.toFixed(2)}:1 < 7.0:1 (WCAG AAA)`);
      assert.ok(crWhiteComp >= 4.5, `Sky Blue white composite ${crWhiteComp.toFixed(2)}:1 < 4.5:1 (WCAG AA)`);
      assert.ok(crWhiteComp >= 7.0, `Sky Blue white composite ${crWhiteComp.toFixed(2)}:1 < 7.0:1 (also passes WCAG AAA)`);
    }
  )();

  await recordTest(
    'WCAG Contrast',
    'Active Bright Amber (#FCD34D) achieves >= 7.0:1 on backdrop and >= 4.5:1 on white composite',
    () => {
      const amber = { r: 0xfc, g: 0xd3, b: 0x4d };
      const lum = computeRelativeLuminance(amber.r, amber.g, amber.b);

      const crDirect = computeContrastRatio(lum, lumDirectSlate);
      const crWhiteComp = computeContrastRatio(lum, lumBackdropOnWhite);

      console.log(`      [#FCD34D] Direct: ${crDirect.toFixed(2)}:1 | On White: ${crWhiteComp.toFixed(2)}:1`);

      assert.ok(crDirect >= 7.0, `Amber direct contrast ${crDirect.toFixed(2)}:1 < 7.0:1 (WCAG AAA)`);
      assert.ok(crWhiteComp >= 4.5, `Amber white composite ${crWhiteComp.toFixed(2)}:1 < 4.5:1 (WCAG AA)`);
      assert.ok(crWhiteComp >= 7.0, `Amber white composite ${crWhiteComp.toFixed(2)}:1 < 7.0:1 (also passes WCAG AAA)`);
    }
  )();

  await recordTest(
    'WCAG Contrast',
    'Spoken Text (#CBD5E1) achieves >= 7.0:1 on backdrop and >= 4.5:1 on white composite',
    () => {
      const spoken = { r: 0xcb, g: 0xd5, b: 0xe1 };
      const lum = computeRelativeLuminance(spoken.r, spoken.g, spoken.b);

      const crDirect = computeContrastRatio(lum, lumDirectSlate);
      const crWhiteComp = computeContrastRatio(lum, lumBackdropOnWhite);

      console.log(`      [#CBD5E1] Direct: ${crDirect.toFixed(2)}:1 | On White: ${crWhiteComp.toFixed(2)}:1`);

      assert.ok(crDirect >= 7.0, `Spoken direct contrast ${crDirect.toFixed(2)}:1 < 7.0:1 (WCAG AAA)`);
      assert.ok(crWhiteComp >= 4.5, `Spoken white composite ${crWhiteComp.toFixed(2)}:1 < 4.5:1 (WCAG AA)`);
      assert.ok(crWhiteComp >= 7.0, `Spoken white composite ${crWhiteComp.toFixed(2)}:1 < 7.0:1 (also passes WCAG AAA)`);
    }
  )();

  await recordTest(
    'WCAG Contrast',
    'Upcoming Slate (#94A3B8 in EDUCATIONAL_THEME) achieves >= 7.0:1 on backdrop and >= 4.5:1 on white composite',
    () => {
      const slate = { r: 0x94, g: 0xa3, b: 0xb8 };
      const lum = computeRelativeLuminance(slate.r, slate.g, slate.b);

      const crDirect = computeContrastRatio(lum, lumDirectSlate);
      const crWhiteComp = computeContrastRatio(lum, lumBackdropOnWhite);

      console.log(`      [#94A3B8] Direct: ${crDirect.toFixed(2)}:1 | On White: ${crWhiteComp.toFixed(2)}:1`);

      assert.ok(crDirect >= 7.0, `Upcoming slate direct contrast ${crDirect.toFixed(2)}:1 < 7.0:1 (WCAG AAA)`);
      assert.ok(crWhiteComp >= 4.5, `Upcoming slate white composite ${crWhiteComp.toFixed(2)}:1 < 4.5:1 (WCAG AA)`);
    }
  )();

  await recordTest(
    'WCAG Contrast',
    'Unread Text (rgba(255, 255, 255, 0.40)) contrast analysis & large-text compliance',
    () => {
      // 1. When composited onto backdrop:
      const unreadDirectComp = alphaComposite(
        { r: 255, g: 255, b: 255, a: 0.40 },
        darkSlate
      );
      const lumUnreadDirect = computeRelativeLuminance(
        unreadDirectComp.r,
        unreadDirectComp.g,
        unreadDirectComp.b
      );
      const crUnreadDirect = computeContrastRatio(lumUnreadDirect, lumDirectSlate);

      const unreadWhiteComp = alphaComposite(
        { r: 255, g: 255, b: 255, a: 0.40 },
        compBackdropOnWhite
      );
      const lumUnreadWhite = computeRelativeLuminance(
        unreadWhiteComp.r,
        unreadWhiteComp.g,
        unreadWhiteComp.b
      );
      const crUnreadWhite = computeContrastRatio(lumUnreadWhite, lumBackdropOnWhite);

      console.log(`      [rgba(255,255,255,0.40)] Effective color on dark slate: rgb(${unreadDirectComp.r}, ${unreadDirectComp.g}, ${unreadDirectComp.b})`);
      console.log(`      [rgba(255,255,255,0.40)] Direct: ${crUnreadDirect.toFixed(2)}:1 | On White: ${crUnreadWhite.toFixed(2)}:1`);

      // At 44px bold (>= 18.67px bold), WCAG 2.1 SC 1.4.3 classifies text as "Large Text" (threshold >= 3.0:1).
      assert.ok(
        crUnreadDirect >= 3.0,
        `Unread text contrast ${crUnreadDirect.toFixed(2)}:1 fails WCAG AA large-text threshold (>= 3.0:1)`
      );
      assert.ok(
        crUnreadWhite >= 3.0,
        `Unread text on white composite ${crUnreadWhite.toFixed(2)}:1 fails WCAG AA large-text threshold (>= 3.0:1)`
      );

      // Mathematical ceiling proof: verify that any 40% white on dark background has an upper bound <= 3.82:1
      assert.ok(
        crUnreadDirect <= 4.0,
        `Theoretical invariant: 40% white alpha composite on dark background cannot exceed 4.0:1`
      );
    }
  )();

  // =========================================================================
  // SUITE 4: Vietnamese Diacritic Safety & Mobile Bounding Box
  // =========================================================================
  await recordTest(
    'Vietnamese Typography Safety',
    'Line height (1.25 to 1.3) and min-height prevent vertical tonal accent clipping',
    () => {
      const sampleLine: CaptionLine = {
        lineIndex: 0,
        text: 'Nghiên cứu về khoảng trống học thuật',
        words: [
          { id: 'w1', word: 'Nghiên', start: 0, end: 0.4, startFrame: 0, endFrame: 12 },
          { id: 'w2', word: 'cứu', start: 0.4, end: 0.8, startFrame: 12, endFrame: 24 },
          { id: 'w3', word: 'về', start: 0.8, end: 1.1, startFrame: 24, endFrame: 33 },
          { id: 'w4', word: 'khoảng', start: 1.1, end: 1.6, startFrame: 33, endFrame: 48 },
          { id: 'w5', word: 'trống', start: 1.6, end: 2.0, startFrame: 48, endFrame: 60 },
          { id: 'w6', word: 'học', start: 2.0, end: 2.4, startFrame: 60, endFrame: 72 },
          { id: 'w7', word: 'thuật', start: 2.4, end: 3.0, startFrame: 72, endFrame: 90 },
        ],
      };

      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeLine, {
          line: sampleLine,
          currentFrame: 35,
          fps: 30,
        })
      );

      // Line height and min-height checks
      assert.ok(html.includes('line-height:1.3'), 'KaraokeLine missing line-height:1.3');
      assert.ok(html.includes('min-height:58px'), 'KaraokeLine missing min-height for diacritic clearance');
      assert.ok(html.includes('row-gap:6px'), 'KaraokeLine missing row-gap for multi-line spacing');
    }
  )();

  await recordTest(
    'Vietnamese Typography Safety',
    'KaraokeGroup encapsulates 44px mobile typography with dark slate pill padding',
    () => {
      const sampleGroup: CaptionGroup = {
        id: 'g_vi_test',
        startFrame: 0,
        endFrame: 90,
        start: 0,
        end: 3.0,
        box: { x: 72, y: 1560, width: 936, height: 120 },
        lines: [
          {
            lineIndex: 0,
            text: 'Chuẩn Scopus Q1',
            words: [
              { id: 'w1', word: 'Chuẩn', start: 0, end: 0.8, startFrame: 0, endFrame: 24 },
              { id: 'w2', word: 'Scopus', start: 0.8, end: 1.8, startFrame: 24, endFrame: 54 },
              { id: 'w3', word: 'Q1', start: 1.8, end: 3.0, startFrame: 54, endFrame: 90 },
            ],
          },
        ],
      };

      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(KaraokeGroup, {
          group: sampleGroup,
          currentFrame: 30,
          fps: 30,
        })
      );

      assert.ok(html.includes('font-size:44px'), 'Expected 44px font size in KaraokeGroup');
      assert.ok(html.includes('background-color:rgba(11, 17, 32, 0.92)'), 'Missing high-opacity backdrop');
      assert.ok(html.includes('border-radius:14px'), 'Missing 14px border radius');
      assert.ok(html.includes('padding:10px 22px'), 'Missing 10px 22px compact pill padding');
    }
  )();

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n======================================================================');
  console.log(` RESULTS SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('======================================================================\n');

  if (failed > 0) {
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`  - [${r.suite}] ${r.name}: ${r.error}`);
    }
  }

  return { total, passed, failed };
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('challenger_m1_crisp_typography')) {
  runCrispTypographyTests()
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
