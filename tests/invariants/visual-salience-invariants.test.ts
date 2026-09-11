/**
 * tests/invariants/visual-salience-invariants.test.ts
 *
 * Authoritative Invariant Test Suite for Dual Visual Focus & Salience Standard (R2).
 * Verifies mathematical, geometric, and visual salience invariants:
 *
 * 1. INV-SAL-01: Mode 1 (Spotlight & Dim) Inactive Opacity bounded in [0.20, 0.30], desaturation > 0.
 * 2. INV-SAL-02: Mode 1 Active Scale === 1.05 and active glow drop-shadow with #38BDF8.
 * 3. INV-SAL-03: Mode 2 (Progressive Unveil) Inactive displays micro-pin (#idx) or hidden (zero angular clutter).
 * 4. INV-SAL-04: Micro-Pin Typography Floor enforcement: fontSize >= 30px at all times.
 * 5. INV-SAL-05: C0/C1 Transition Smoothness: strictly monotonic progression across 12 frames, zero 1-frame jumps.
 * 6. INV-SAL-06: Declarative Component Architecture: SalienceContainer & SalienceItem support SVG (<g>) and HTML (<div>).
 * 7. INV-SAL-07: Dynamic Beat Choreography Integration: seamless binding with useBeatChoreography.
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  DEFAULT_SALIENCE_CONFIG,
  resolveSalienceConfig,
  calculateItemSalienceProgress,
  computeItemSalienceState,
  MicroPin,
  SalienceContainer,
  SalienceItem,
  useVisualSalience,
  SalienceConfig,
} from '../../motion-kit/src/salience';

import { calculateBeatChoreography, TimelineBeat } from '../../motion-kit/src/cues/beatChoreography';

export function runVisualSalienceInvariantTests() {
  console.log('\n======================================================================');
  console.log(' INVARIANT TEST SUITE: Dual Visual Focus & Salience Standard (R2)');
  console.log(' Standards: Spotlight & Dim, Progressive Unveil, Mobile Typography Floor');
  console.log('======================================================================\n');

  let totalAssertions = 0;

  // =========================================================================
  // GATE 1: Mode 1 (Spotlight & Dim) Inactive Bounds & Desaturation (INV-SAL-01)
  // =========================================================================
  console.log('  [Gate 1] Verifying INV-SAL-01: Mode 1 Inactive Opacity [0.20, 0.30] & Desaturation > 0...');
  {
    // Test default configuration
    const activeIdx = 1;
    for (let itemIdx = 0; itemIdx < 5; itemIdx++) {
      if (itemIdx === activeIdx) continue;

      const state = computeItemSalienceState(itemIdx, activeIdx, 0, { mode: 'spotlight-dim' });

      // Inactive opacity must be strictly in [0.20, 0.30]
      assert.ok(
        state.opacity >= 0.20 && state.opacity <= 0.30,
        `[INV-SAL-01 Violation] Inactive item ${itemIdx} opacity (${state.opacity}) outside [0.20, 0.30]`
      );

      // Inactive desaturation (grayscale) must be > 0 (spec default 0.75 in [0.70, 0.80])
      assert.ok(
        state.grayscale >= 0.70 && state.grayscale <= 0.80,
        `[INV-SAL-01 Violation] Inactive item ${itemIdx} grayscale (${state.grayscale}) outside [0.70, 0.80]`
      );

      // Inactive scale must be baseline 1.0
      assert.strictEqual(state.scale, 1.0, `[INV-SAL-01 Violation] Inactive item ${itemIdx} scale must be 1.0`);
      assert.strictEqual(state.isActive, false, `[INV-SAL-01 Violation] Inactive item ${itemIdx} must have isActive === false`);
      assert.strictEqual(state.isFullDetailVisible, true, `[INV-SAL-01 Violation] In Mode 1 full detail remains visible`);
      assert.strictEqual(state.showMicroPinOnly, false, `[INV-SAL-01 Violation] Mode 1 does not use micro-pin only`);

      totalAssertions += 5;
    }

    // Test config normalization & clamping: user passes out-of-range values
    const clampedLow = resolveSalienceConfig({ mode: 'spotlight-dim', inactiveOpacity: 0.05, inactiveDesaturation: 0.1 });
    assert.strictEqual(clampedLow.inactiveOpacity, 0.20, 'Clamped low inactiveOpacity must be 0.20');
    assert.strictEqual(clampedLow.inactiveDesaturation, 0.70, 'Clamped low inactiveDesaturation must be 0.70');

    const clampedHigh = resolveSalienceConfig({ mode: 'spotlight-dim', inactiveOpacity: 0.60, inactiveDesaturation: 0.95 });
    assert.strictEqual(clampedHigh.inactiveOpacity, 0.30, 'Clamped high inactiveOpacity must be 0.30');
    assert.strictEqual(clampedHigh.inactiveDesaturation, 0.80, 'Clamped high inactiveDesaturation must be 0.80');
    totalAssertions += 4;

    console.log('    ✓ INV-SAL-01: Inactive opacity strictly bounded in [0.20, 0.30] and desaturation in [0.70, 0.80].');
  }

  // =========================================================================
  // GATE 2: Mode 1 Active Item Scale & Glow Invariants (INV-SAL-02)
  // =========================================================================
  console.log('  [Gate 2] Verifying INV-SAL-02: Mode 1 Active Scale 1.05x & Glow #38BDF8...');
  {
    const activeIdx = 2;
    const activeState = computeItemSalienceState(activeIdx, activeIdx, 1.0, { mode: 'spotlight-dim' });

    assert.strictEqual(activeState.isActive, true, 'Active item must report isActive === true');
    assert.strictEqual(activeState.scale, 1.05, `[INV-SAL-02 Violation] Active scale must be 1.05, got ${activeState.scale}`);
    assert.strictEqual(activeState.opacity, 1.0, `[INV-SAL-02 Violation] Active opacity must be 1.0, got ${activeState.opacity}`);
    assert.strictEqual(activeState.brightness, 1.20, `[INV-SAL-02 Violation] Active brightness must be 1.20, got ${activeState.brightness}`);
    assert.strictEqual(activeState.grayscale, 0.0, `[INV-SAL-02 Violation] Active grayscale must be 0.0, got ${activeState.grayscale}`);
    assert.strictEqual(activeState.glowOpacity, 1.0, 'Active glowOpacity must be 1.0');

    // Glow drop-shadow must be present and contain sky blue color #38BDF8
    assert.ok(
      activeState.glowDropShadow.includes('#38BDF8'),
      `[INV-SAL-02 Violation] Glow drop-shadow must contain #38BDF8, got: ${activeState.glowDropShadow}`
    );
    assert.ok(
      activeState.filter.includes('drop-shadow'),
      `[INV-SAL-02 Violation] Active filter must include drop-shadow, got: ${activeState.filter}`
    );
    assert.ok(
      activeState.transform.includes('scale(1.0500)'),
      `[INV-SAL-02 Violation] Active transform must contain scale(1.0500), got: ${activeState.transform}`
    );

    totalAssertions += 8;
    console.log('    ✓ INV-SAL-02: Active scale 1.05x, opacity 1.0, brightness 1.20, and sky-blue glow certified.');
  }

  // =========================================================================
  // GATE 3: Mode 2 (Progressive Unveil) Label Suppression & Solo Focus (INV-SAL-03)
  // =========================================================================
  console.log('  [Gate 3] Verifying INV-SAL-03: Mode 2 Progressive Unveil & Micro-Pin Isolation...');
  {
    const totalItems = 5;
    const activeIdx = 3;

    // A. Default: inactiveDisplay === 'micro-pin'
    for (let idx = 0; idx < totalItems; idx++) {
      const isTargetActive = idx === activeIdx;
      const state = computeItemSalienceState(idx, activeIdx, isTargetActive ? 1.0 : 0.0, {
        mode: 'progressive-unveil',
        inactiveDisplay: 'micro-pin',
      });

      if (isTargetActive) {
        assert.strictEqual(state.isFullDetailVisible, true, 'Active item must have full detail visible');
        assert.strictEqual(state.showMicroPinOnly, false, 'Active item must NOT be micro-pin only');
        assert.strictEqual(state.scale, 1.05, 'Active item scale must be 1.05');
      } else {
        assert.strictEqual(state.isFullDetailVisible, false, `Inactive item ${idx} must suppress full detail`);
        assert.strictEqual(state.showMicroPinOnly, true, `Inactive item ${idx} must show micro-pin only`);
        assert.strictEqual(state.pinLabel, `#${idx + 1}`, `Inactive item ${idx} pin label must be #${idx + 1}`);
        assert.strictEqual(state.scale, 1.0, `Inactive item ${idx} scale must be 1.0`);
      }
      totalAssertions += 3;
    }

    // B. Alternative: inactiveDisplay === 'hidden'
    for (let idx = 0; idx < totalItems; idx++) {
      const isTargetActive = idx === activeIdx;
      const state = computeItemSalienceState(idx, activeIdx, isTargetActive ? 1.0 : 0.0, {
        mode: 'progressive-unveil',
        inactiveDisplay: 'hidden',
      });

      if (!isTargetActive) {
        assert.strictEqual(state.isFullDetailVisible, false, 'Hidden inactive item suppresses full detail');
        assert.strictEqual(state.showMicroPinOnly, false, 'Hidden inactive item suppresses micro-pin');
        assert.strictEqual(state.opacity, 0, 'Hidden inactive item has opacity === 0');
        totalAssertions += 3;
      }
    }

    console.log('    ✓ INV-SAL-03: Progressive unveil correctly isolates active detail and suppresses inactive labels.');
  }

  // =========================================================================
  // GATE 4: Micro-Pin Mobile Typography Floor Invariant (INV-SAL-04)
  // =========================================================================
  console.log('  [Gate 4] Verifying INV-SAL-04: Micro-Pin Typography Floor >= 30px...');
  {
    // A. Default MicroPin render
    const defaultSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MicroPin, { label: '#1', cx: 100, cy: 200 })
    );
    assert.ok(defaultSvg.includes('font-size="30"'), 'Default MicroPin must render font-size="30"');
    assert.ok(defaultSvg.includes('#1'), 'MicroPin must render label #1');
    assert.ok(defaultSvg.includes('translate(100, 200)'), 'MicroPin must translate to (100, 200)');
    totalAssertions += 3;

    // B. Explicit valid larger font size
    const largeSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MicroPin, { label: '#2', fontSize: 36 })
    );
    assert.ok(largeSvg.includes('font-size="36"'), 'Explicit 36px font size must be respected');
    totalAssertions += 1;

    // C. Adversarial below-floor font size (must be clamped to 30px)
    const testCasesBelowFloor = [12, 14, 20, 24, 29, 0, -10];
    for (const badSize of testCasesBelowFloor) {
      const badSvg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MicroPin, { label: '#bad', fontSize: badSize })
      );
      assert.ok(
        badSvg.includes('font-size="30"'),
        `[INV-SAL-04 Violation] MicroPin with fontSize=${badSize} failed to clamp to 30px! Result: ${badSvg}`
      );
      assert.ok(
        !badSvg.includes(`font-size="${badSize}"`),
        `[INV-SAL-04 Violation] MicroPin output must not contain sub-floor font-size="${badSize}"`
      );
      totalAssertions += 2;
    }

    console.log('    ✓ INV-SAL-04: Micro-Pin strictly enforces mobile typography floor (>= 30px) under all inputs.');
  }

  // =========================================================================
  // GATE 5: C0/C1 Transition Smoothness & Monotonicity (INV-SAL-05)
  // =========================================================================
  console.log('  [Gate 5] Verifying INV-SAL-05: C0/C1 Transition Smoothness & Monotonicity...');
  {
    const transitionFrames = 12;
    const activeIndex = 2;
    const prevIndex = 1;

    // A. Incoming item progress must be strictly monotonic non-decreasing over [0, 12]
    let prevProg = -1;
    for (let f = 0; f <= transitionFrames; f++) {
      const prog = calculateItemSalienceProgress(activeIndex, activeIndex, f, 0, transitionFrames, prevIndex);

      assert.ok(
        prog >= 0 && prog <= 1.0,
        `Progress at frame ${f} (${prog}) must be within [0, 1]`
      );
      assert.ok(
        prog >= prevProg,
        `[INV-SAL-05 Violation] Incoming progress must be monotonically non-decreasing: f=${f}, prog=${prog} < prev=${prevProg}`
      );

      // Verify no 1-frame jump to 1.0 at start (smooth C0/C1 curve)
      if (f > 0) {
        const delta = prog - prevProg;
        assert.ok(
          delta < 0.40,
          `[INV-SAL-05 Violation] 1-frame jump too steep: delta=${delta} at frame ${f}`
        );
      }

      prevProg = prog;
      totalAssertions += 2;
    }
    assert.strictEqual(prevProg, 1.0, 'At end of transition window, active item progress must equal exactly 1.0');
    totalAssertions += 1;

    // B. Outgoing item progress must be strictly monotonic non-increasing over [0, 12]
    let prevOutProg = 2.0;
    for (let f = 0; f <= transitionFrames; f++) {
      const prog = calculateItemSalienceProgress(prevIndex, activeIndex, f, 0, transitionFrames, prevIndex);

      assert.ok(
        prog >= 0 && prog <= 1.0,
        `Outgoing progress at frame ${f} (${prog}) must be within [0, 1]`
      );
      assert.ok(
        prog <= prevOutProg,
        `[INV-SAL-05 Violation] Outgoing progress must be monotonically non-increasing: f=${f}, prog=${prog} > prev=${prevOutProg}`
      );

      prevOutProg = prog;
      totalAssertions += 2;
    }
    assert.strictEqual(prevOutProg, 0.0, 'At end of transition window, outgoing item progress must equal exactly 0.0');
    totalAssertions += 1;

    // C. Non-involved items must remain at 0 throughout
    for (let f = 0; f <= transitionFrames; f++) {
      const otherProg = calculateItemSalienceProgress(0, activeIndex, f, 0, transitionFrames, prevIndex);
      assert.strictEqual(otherProg, 0, `Uninvolved item must remain at progress 0 at frame ${f}`);
      totalAssertions += 1;
    }

    console.log('    ✓ INV-SAL-05: 12-frame spring/snappy transition certified monotonic, smooth, and pop-free.');
  }

  // =========================================================================
  // GATE 6: Declarative Component Architecture: SVG & HTML (INV-SAL-06)
  // =========================================================================
  console.log('  [Gate 6] Verifying INV-SAL-06: SalienceContainer & SalienceItem Architecture...');
  {
    // A. SVG mode rendering with render-prop
    const svgMarkup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        SalienceContainer,
        {
          mode: 'spotlight-dim',
          activeItemIndex: 1,
          currentFrameOverride: 30,
          transitionStartFrame: 0,
          transitionFrames: 12,
        },
        React.createElement(
          'svg',
          { width: 1080, height: 1920 },
          React.createElement(
            SalienceItem,
            { index: 0, cx: 100, cy: 200 },
            (state) => React.createElement('circle', { r: 50, 'data-opacity': state.opacity })
          ),
          React.createElement(
            SalienceItem,
            { index: 1, cx: 300, cy: 400 },
            (state) => React.createElement('circle', { r: 50, 'data-opacity': state.opacity })
          )
        )
      )
    );

    assert.ok(svgMarkup.includes('translate(100, 200)'), 'SVG item 0 has translate(100, 200)');
    assert.ok(svgMarkup.includes('translate(300, 400)'), 'SVG item 1 has translate(300, 400)');
    assert.ok(svgMarkup.includes('scale(1.0500)'), 'Active item 1 has scale(1.0500)');
    assert.ok(svgMarkup.includes('data-opacity="0.25"'), 'Inactive item 0 has data-opacity="0.25"');
    assert.ok(svgMarkup.includes('data-opacity="1"'), 'Active item 1 has data-opacity="1"');
    totalAssertions += 5;

    // B. HTML mode rendering
    const htmlMarkup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        SalienceContainer,
        {
          mode: 'spotlight-dim',
          activeItemIndex: 0,
          currentFrameOverride: 30,
          transitionStartFrame: 0,
        },
        React.createElement(
          SalienceItem,
          { index: 0, as: 'html', x: 50, y: 100 },
          React.createElement('div', null, 'Active Card')
        ),
        React.createElement(
          SalienceItem,
          { index: 1, as: 'html', x: 50, y: 300 },
          React.createElement('div', null, 'Inactive Card')
        )
      )
    );

    assert.ok(htmlMarkup.includes('left:50px'), 'HTML item positioned with left:50px');
    assert.ok(htmlMarkup.includes('top:100px'), 'HTML item 0 top:100px');
    assert.ok(htmlMarkup.includes('top:300px'), 'HTML item 1 top:300px');
    assert.ok(htmlMarkup.includes('Active Card'), 'Renders active card children');
    assert.ok(htmlMarkup.includes('Inactive Card'), 'Renders inactive card children');
    totalAssertions += 5;

    console.log('    ✓ INV-SAL-06: SalienceContainer & SalienceItem execute cleanly across SVG and HTML hierarchies.');
  }

  // =========================================================================
  // GATE 7: Dynamic Beat Choreography Integration (INV-SAL-07)
  // =========================================================================
  console.log('  [Gate 7] Verifying INV-SAL-07: Dynamic Beat Choreography Integration...');
  {
    const mockBeats: TimelineBeat[] = [
      { id: 'beat_0', startFrame: 0, endFrame: 100 },
      { id: 'beat_1', startFrame: 100, endFrame: 220 },
      { id: 'beat_2', startFrame: 220, endFrame: 360 },
    ];

    // Frame 50: middle of beat 0 (item 0 fully active, item 1 and 2 inactive)
    const ch0 = calculateBeatChoreography(mockBeats, 50, 360);
    assert.strictEqual(ch0.currentBeatIndex, 0);

    const s0_item0 = computeItemSalienceState(0, ch0.currentBeatIndex, 1.0, { mode: 'spotlight-dim' });
    const s0_item1 = computeItemSalienceState(1, ch0.currentBeatIndex, 0.0, { mode: 'spotlight-dim' });
    assert.strictEqual(s0_item0.isActive, true, 'Item 0 active during beat 0');
    assert.strictEqual(s0_item1.isActive, false, 'Item 1 inactive during beat 0');
    assert.strictEqual(s0_item0.scale, 1.05);
    assert.strictEqual(s0_item1.scale, 1.0);
    totalAssertions += 5;

    // Frame 106: beat 1 began at frame 100, 6 frames into a 12-frame transition
    const ch1 = calculateBeatChoreography(mockBeats, 106, 360);
    assert.strictEqual(ch1.currentBeatIndex, 1);

    const progIncoming = calculateItemSalienceProgress(1, ch1.currentBeatIndex, 106, ch1.beatStartRelFrame, 12, 0);
    const progOutgoing = calculateItemSalienceProgress(0, ch1.currentBeatIndex, 106, ch1.beatStartRelFrame, 12, 0);

    assert.ok(
      progIncoming > 0 && progIncoming < 1.0,
      `Incoming item 1 at frame 106 must be transitioning (prog=${progIncoming})`
    );
    assert.ok(
      progOutgoing > 0 && progOutgoing < 1.0,
      `Outgoing item 0 at frame 106 must be transitioning (prog=${progOutgoing})`
    );
    totalAssertions += 3;

    // Frame 150: middle of beat 1 (item 1 fully active, item 0 inactive)
    const ch2 = calculateBeatChoreography(mockBeats, 150, 360);
    assert.strictEqual(ch2.currentBeatIndex, 1);
    const s1_item1 = computeItemSalienceState(1, ch2.currentBeatIndex, 1.0, { mode: 'spotlight-dim' });
    assert.strictEqual(s1_item1.isActive, true);
    assert.strictEqual(s1_item1.opacity, 1.0);
    totalAssertions += 3;

    console.log('    ✓ INV-SAL-07: Dynamic synchronization with beat choreography verified across multi-beat timeline.');
  }

  console.log('\n======================================================================');
  console.log(` ALL 7 INVARIANT GATES PASSED (${totalAssertions} ASSERTIONS VERIFIED 100%)`);
  console.log('======================================================================\n');
}

// Support Jest or test runner globals if available
if (typeof describe === 'function' && typeof it === 'function') {
  describe('Visual Salience Invariant Suite (R2)', () => {
    it('passes all visual salience invariant gates', () => {
      runVisualSalienceInvariantTests();
    });
  });
}

// Self-executing runner for tsx/node CLI
if (
  require.main === module ||
  process.argv[1]?.includes('visual-salience-invariants')
) {
  try {
    runVisualSalienceInvariantTests();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ VISUAL SALIENCE INVARIANT TEST SUITE FAILED:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
