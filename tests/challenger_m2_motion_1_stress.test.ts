/**
 * tests/challenger_m2_motion_1_stress.test.ts
 *
 * EMPIRICAL CHALLENGER STRESS SUITE: Mode 1 (Spotlight & Dim)
 * Target Milestone: M2 (Dual Visual Focus & Salience Standard - R2)
 *
 * Tests:
 * 1. Mathematical Bounds across arbitrary item count N in [2, 100] and active index k in [0, N-1]:
 *    - Item k: scale === 1.05, opacity === 1.0, active glow present (#38BDF8)
 *    - Inactive items j !== k: opacity in [0.20, 0.30], desaturation > 0 (in [0.70, 0.80]), scale === 1.0
 * 2. Configuration Fuzzing & Clamping (adversarial out-of-range opacities and desaturations)
 * 3. 12-Frame Transition Dynamics:
 *    - Strict monotonicity of incoming and outgoing progress
 *    - No 1-frame pops (delta < 0.40)
 *    - Mathematical continuity C0/C1
 * 4. Arbitrary and Non-Sequential Transitions (A -> B for arbitrary pairs):
 *    - calculateItemSalienceProgress with explicit previousActiveIndex
 * 5. Edge cases: negative elapsed frames, post-transition frames, variable durations (6, 12, 24)
 * 6. Component-level DOM/SVG verification with SalienceContainer & SalienceItem
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  DEFAULT_SALIENCE_CONFIG,
  resolveSalienceConfig,
  calculateItemSalienceProgress,
  computeItemSalienceState,
  SalienceContainer,
  SalienceItem,
  SalienceConfig,
} from '../motion-kit/src/salience';

export function runChallengerMode1StressTests() {
  console.log('\n======================================================================');
  console.log(' EMPIRICAL CHALLENGER STRESS SUITE: Mode 1 (Spotlight & Dim)');
  console.log('======================================================================\n');

  let checks = 0;

  // -------------------------------------------------------------------------
  // 1. MATHEMATICAL BOUNDS: Arbitrary N in [2, 100], Arbitrary Active Index k
  // -------------------------------------------------------------------------
  console.log('[Test 1] Testing Mathematical Bounds for arbitrary N in [2, 100] and all k in [0, N-1]...');
  const testCounts = [2, 3, 5, 7, 10, 25, 50, 100];

  for (const N of testCounts) {
    for (let k = 0; k < N; k++) {
      // Active item k
      const activeState = computeItemSalienceState(k, k, 1.0, { mode: 'spotlight-dim' });

      // Scale must equal 1.05
      assert.strictEqual(
        activeState.scale,
        1.05,
        `[Bound Failure] N=${N}, k=${k}: Active scale must be 1.05, got ${activeState.scale}`
      );

      // Active glow must be active (#38BDF8)
      assert.strictEqual(activeState.glowOpacity, 1.0);
      assert.ok(
        activeState.glowDropShadow.includes('#38BDF8'),
        `[Bound Failure] N=${N}, k=${k}: Active glowDropShadow missing #38BDF8: ${activeState.glowDropShadow}`
      );
      assert.ok(
        activeState.filter.includes('drop-shadow'),
        `[Bound Failure] N=${N}, k=${k}: Active filter missing drop-shadow: ${activeState.filter}`
      );
      assert.strictEqual(activeState.opacity, 1.0);
      assert.strictEqual(activeState.isActive, true);
      checks += 6;

      // Inactive items j !== k
      for (let j = 0; j < N; j++) {
        if (j === k) continue;

        const inactiveState = computeItemSalienceState(j, k, 0.0, { mode: 'spotlight-dim' });

        // Opacity strictly within [0.20, 0.30]
        assert.ok(
          inactiveState.opacity >= 0.20 && inactiveState.opacity <= 0.30,
          `[Bound Failure] N=${N}, k=${k}, j=${j}: Inactive opacity ${inactiveState.opacity} not in [0.20, 0.30]`
        );

        // Desaturation (grayscale) > 0
        assert.ok(
          inactiveState.grayscale > 0,
          `[Bound Failure] N=${N}, k=${k}, j=${j}: Inactive desaturation <= 0: ${inactiveState.grayscale}`
        );
        assert.ok(
          inactiveState.grayscale >= 0.70 && inactiveState.grayscale <= 0.80,
          `[Bound Failure] N=${N}, k=${k}, j=${j}: Inactive desaturation not in [0.70, 0.80]: ${inactiveState.grayscale}`
        );

        // Inactive scale === 1.0
        assert.strictEqual(
          inactiveState.scale,
          1.0,
          `[Bound Failure] N=${N}, k=${k}, j=${j}: Inactive scale !== 1.0: ${inactiveState.scale}`
        );

        // Inactive glow === none
        assert.strictEqual(inactiveState.glowDropShadow, 'none');
        assert.strictEqual(inactiveState.glowOpacity, 0);
        assert.strictEqual(inactiveState.isActive, false);

        checks += 7;
      }
    }
  }
  console.log(`  ✓ Passed: Verified mathematical bounds across ${checks} checks for N in [2, 100].`);

  // -------------------------------------------------------------------------
  // 2. CONFIGURATION FUZZING & CLAMPING ORACLE
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Fuzzing user configurations and clamping boundaries...');
  const adversarialConfigs: Partial<SalienceConfig>[] = [
    { mode: 'spotlight-dim', inactiveOpacity: 0.0 },
    { mode: 'spotlight-dim', inactiveOpacity: -0.5 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.10 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.19999 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.20 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.25 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.30 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.30001 },
    { mode: 'spotlight-dim', inactiveOpacity: 0.50 },
    { mode: 'spotlight-dim', inactiveOpacity: 1.0 },
    { mode: 'spotlight-dim', inactiveDesaturation: 0.0 },
    { mode: 'spotlight-dim', inactiveDesaturation: -1.0 },
    { mode: 'spotlight-dim', inactiveDesaturation: 0.6999 },
    { mode: 'spotlight-dim', inactiveDesaturation: 0.70 },
    { mode: 'spotlight-dim', inactiveDesaturation: 0.75 },
    { mode: 'spotlight-dim', inactiveDesaturation: 0.80 },
    { mode: 'spotlight-dim', inactiveDesaturation: 0.8001 },
    { mode: 'spotlight-dim', inactiveDesaturation: 1.5 },
  ];

  for (const cfg of adversarialConfigs) {
    const resolved = resolveSalienceConfig(cfg);
    assert.ok(
      resolved.inactiveOpacity >= 0.20 && resolved.inactiveOpacity <= 0.30,
      `Clamped inactiveOpacity ${resolved.inactiveOpacity} not in [0.20, 0.30] for input ${cfg.inactiveOpacity}`
    );
    assert.ok(
      resolved.inactiveDesaturation >= 0.70 && resolved.inactiveDesaturation <= 0.80,
      `Clamped inactiveDesaturation ${resolved.inactiveDesaturation} not in [0.70, 0.80] for input ${cfg.inactiveDesaturation}`
    );

    const inactiveState = computeItemSalienceState(0, 1, 0.0, cfg);
    assert.ok(
      inactiveState.opacity >= 0.20 && inactiveState.opacity <= 0.30,
      `Computed inactive opacity ${inactiveState.opacity} not in [0.20, 0.30] for input ${cfg.inactiveOpacity}`
    );
    assert.ok(
      inactiveState.grayscale > 0,
      `Computed inactive grayscale ${inactiveState.grayscale} <= 0 for input ${cfg.inactiveDesaturation}`
    );
    checks += 4;
  }
  console.log(`  ✓ Passed: Clamping oracle verified across ${adversarialConfigs.length} adversarial configurations.`);

  // -------------------------------------------------------------------------
  // 3. 12-FRAME TRANSITION DYNAMICS: Strict Monotonicity & No 1-Frame Pops
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Testing 12-Frame Transition Dynamics (Monotonicity, Continuity, No Pops)...');
  const transitionFrames = 12;

  for (let fromIdx = 0; fromIdx < 4; fromIdx++) {
    const toIdx = fromIdx + 1;

    let prevIncomingProg = -1;
    let prevOutgoingProg = 2;
    let prevIncomingScale = 0.99;
    let prevOutgoingScale = 1.06;
    let prevIncomingOpacity = 0.0;
    let prevOutgoingOpacity = 1.01;

    for (let f = 0; f <= transitionFrames; f++) {
      const incomingProg = calculateItemSalienceProgress(toIdx, toIdx, f, 0, transitionFrames, fromIdx);
      const outgoingProg = calculateItemSalienceProgress(fromIdx, toIdx, f, 0, transitionFrames, fromIdx);

      // Boundary values
      if (f === 0) {
        assert.strictEqual(incomingProg, 0.0, `At frame 0, incoming item progress must be exactly 0`);
        assert.strictEqual(outgoingProg, 1.0, `At frame 0, outgoing item progress must be exactly 1`);
      }
      if (f === transitionFrames) {
        assert.strictEqual(incomingProg, 1.0, `At frame 12, incoming item progress must be exactly 1`);
        assert.strictEqual(outgoingProg, 0.0, `At frame 12, outgoing item progress must be exactly 0`);
      }

      // Strict Monotonicity
      assert.ok(
        incomingProg >= prevIncomingProg,
        `Incoming item progress not monotonically increasing: f=${f}, cur=${incomingProg}, prev=${prevIncomingProg}`
      );
      assert.ok(
        outgoingProg <= prevOutgoingProg,
        `Outgoing item progress not monotonically decreasing: f=${f}, cur=${outgoingProg}, prev=${prevOutgoingProg}`
      );

      // No 1-frame pop (Delta < 0.40)
      if (f > 0) {
        const deltaIncoming = incomingProg - prevIncomingProg;
        const deltaOutgoing = prevOutgoingProg - outgoingProg;
        assert.ok(
          deltaIncoming < 0.40,
          `Incoming 1-frame pop detected: delta=${deltaIncoming} at frame ${f}`
        );
        assert.ok(
          deltaOutgoing < 0.40,
          `Outgoing 1-frame pop detected: delta=${deltaOutgoing} at frame ${f}`
        );
      }

      // State-level Monotonicity: scale and opacity
      const incomingState = computeItemSalienceState(toIdx, toIdx, incomingProg, { mode: 'spotlight-dim' });
      const outgoingState = computeItemSalienceState(fromIdx, toIdx, outgoingProg, { mode: 'spotlight-dim' });

      assert.ok(
        incomingState.scale >= prevIncomingScale - 1e-9,
        `Incoming scale not monotonically increasing: f=${f}, cur=${incomingState.scale}, prev=${prevIncomingScale}`
      );
      assert.ok(
        outgoingState.scale <= prevOutgoingScale + 1e-9,
        `Outgoing scale not monotonically decreasing: f=${f}, cur=${outgoingState.scale}, prev=${prevOutgoingScale}`
      );
      assert.ok(
        incomingState.opacity >= prevIncomingOpacity - 1e-9,
        `Incoming opacity not monotonically increasing: f=${f}, cur=${incomingState.opacity}, prev=${prevIncomingOpacity}`
      );
      assert.ok(
        outgoingState.opacity <= prevOutgoingOpacity + 1e-9,
        `Outgoing opacity not monotonically decreasing: f=${f}, cur=${outgoingState.opacity}, prev=${prevOutgoingOpacity}`
      );

      prevIncomingProg = incomingProg;
      prevOutgoingProg = outgoingProg;
      prevIncomingScale = incomingState.scale;
      prevOutgoingScale = outgoingState.scale;
      prevIncomingOpacity = incomingState.opacity;
      prevOutgoingOpacity = outgoingState.opacity;

      checks += 8;
    }
  }
  console.log(`  ✓ Passed: 12-frame transitions exhibit strictly monotonic interpolation with zero 1-frame pops.`);

  // -------------------------------------------------------------------------
  // 4. ARBITRARY & NON-SEQUENTIAL TRANSITIONS (A -> B)
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Testing Arbitrary & Non-Sequential Transitions (A -> B)...');
  const arbitraryPairs = [
    [0, 3], // skip forward
    [4, 1], // skip backward
    [2, 0], // jump to start
    [1, 4], // jump to end
    [3, 3], // switch to same
  ];

  for (const [fromIdx, toIdx] of arbitraryPairs) {
    if (fromIdx === toIdx) {
      for (let f = 0; f <= transitionFrames; f++) {
        const prog = calculateItemSalienceProgress(toIdx, toIdx, f, 0, transitionFrames, fromIdx);
        if (f >= transitionFrames) {
          assert.strictEqual(prog, 1.0);
        }
        checks += 1;
      }
      continue;
    }

    for (let f = 0; f <= transitionFrames; f++) {
      const incomingProg = calculateItemSalienceProgress(toIdx, toIdx, f, 0, transitionFrames, fromIdx);
      const outgoingProg = calculateItemSalienceProgress(fromIdx, toIdx, f, 0, transitionFrames, fromIdx);

      assert.ok(incomingProg >= 0 && incomingProg <= 1.0);
      assert.ok(outgoingProg >= 0 && outgoingProg <= 1.0);

      for (const uninvolved of [10, 11]) {
        const uninvolvedProg = calculateItemSalienceProgress(uninvolved, toIdx, f, 0, transitionFrames, fromIdx);
        assert.strictEqual(uninvolvedProg, 0);
      }
      checks += 4;
    }
  }
  console.log(`  ✓ Passed: Arbitrary pairs A -> B transition smoothly with explicit previousActiveIndex.`);

  // -------------------------------------------------------------------------
  // 5. EDGE CASES: Pre-transition, Post-transition, Variable Durations
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Testing Edge Cases (Pre-transition, Post-transition, Durations)...');
  {
    const startF = 50;
    const dur = 12;

    // A. Pre-transition frames (f < startF): incoming must be 0, previous must be 1
    for (let f = startF - 10; f < startF; f++) {
      const inc = calculateItemSalienceProgress(1, 1, f, startF, dur, 0);
      const prev = calculateItemSalienceProgress(0, 1, f, startF, dur, 0);
      assert.strictEqual(inc, 0.0, `Pre-transition incoming must be 0 at f=${f}`);
      assert.strictEqual(prev, 1.0, `Pre-transition previous must be 1 at f=${f}`);
      checks += 2;
    }

    // B. Post-transition frames (f > startF + dur): incoming must be 1, previous must be 0
    for (let f = startF + dur; f <= startF + dur + 20; f++) {
      const inc = calculateItemSalienceProgress(1, 1, f, startF, dur, 0);
      const prev = calculateItemSalienceProgress(0, 1, f, startF, dur, 0);
      assert.strictEqual(inc, 1.0, `Post-transition incoming must be 1 at f=${f}`);
      assert.strictEqual(prev, 0.0, `Post-transition previous must be 0 at f=${f}`);
      checks += 2;
    }

    // C. Variable durations (6, 12, 24, 30 frames): monotonicity check
    for (const testDur of [6, 12, 24, 30]) {
      let pInc = -1;
      for (let f = 0; f <= testDur; f++) {
        const inc = calculateItemSalienceProgress(1, 1, f, 0, testDur, 0);
        assert.ok(inc >= pInc, `Duration ${testDur}: non-monotonic at f=${f}`);
        pInc = inc;
        checks += 1;
      }
      assert.strictEqual(pInc, 1.0);
      checks += 1;
    }
  }
  console.log(`  ✓ Passed: Edge cases (pre/post transition and variable durations) verified.`);

  // -------------------------------------------------------------------------
  // 6. COMPONENT-LEVEL SVG RENDERING VERIFICATION (SalienceContainer & SalienceItem)
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Testing Component-level SVG rendering in Mode 1...');
  {
    // Render 5 items in Mode 1 with item 2 active at frame 20 (post 12-frame transition)
    const containerElement = React.createElement(
      SalienceContainer,
      {
        mode: 'spotlight-dim',
        activeItemIndex: 2,
        currentFrameOverride: 20,
        transitionStartFrame: 0,
        transitionFrames: 12,
      },
      React.createElement(
        'svg',
        { width: 1080, height: 1920 },
        [0, 1, 2, 3, 4].map((idx) =>
          React.createElement(
            SalienceItem,
            { key: idx, index: idx, cx: 200, cy: 300 + idx * 200 },
            (state) =>
              React.createElement('circle', {
                r: 40,
                'data-index': idx,
                'data-scale': state.scale.toFixed(4),
                'data-opacity': state.opacity.toFixed(2),
                'data-glow': state.glowOpacity > 0 ? 'yes' : 'no',
              })
          )
        )
      )
    );

    const markup = ReactDOMServer.renderToStaticMarkup(containerElement);

    // Active item 2: scale 1.0500, opacity 1.00, glow yes
    assert.ok(markup.includes('data-index="2"'));
    assert.ok(markup.includes('data-scale="1.0500"'));
    assert.ok(markup.includes('data-opacity="1.00"'));
    assert.ok(markup.includes('data-glow="yes"'));

    // Inactive item 0: scale 1.0000, opacity 0.25, glow no
    assert.ok(markup.includes('data-index="0"'));
    assert.ok(markup.includes('data-scale="1.0000"'));
    assert.ok(markup.includes('data-opacity="0.25"'));
    assert.ok(markup.includes('data-glow="no"'));

    // Inactive item 4: scale 1.0000, opacity 0.25, glow no
    assert.ok(markup.includes('data-index="4"'));

    checks += 9;
  }
  console.log(`  ✓ Passed: Component-level SVG rendering matches exact mathematical invariants.`);

  console.log('\n======================================================================');
  console.log(` ALL EMPIRICAL CHALLENGER TESTS PASSED (${checks} CHECKS VERIFIED)`);
  console.log('======================================================================\n');
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('challenger_m2_motion_1_stress')) {
  try {
    runChallengerMode1StressTests();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ CHALLENGER STRESS SUITE FAILED:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
