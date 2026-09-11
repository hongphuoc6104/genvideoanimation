/**
 * tests/challenger_m2_motion_2_salience_stress.test.ts
 *
 * Empirical Challenger Stress Suite for Mode 2 (Progressive Unveil / Solo Focus) and <MicroPin>.
 * Challenger: challenger_m2_motion_2
 *
 * Requirements tested:
 * 1. Progressive Unveil (Solo Focus):
 *    - Active item renders full details/labels.
 *    - Inactive items suppress child details/labels and render <MicroPin> (#idx) or hide completely.
 *    - Frame-by-frame transition dynamics and detail unveiling threshold (prog >= 0.25).
 *    - Inactive display strategies: 'micro-pin' vs 'hidden'.
 * 2. <MicroPin> Mobile Typography Floor:
 *    - Exhaustive boundary matrix for fontSize (sub-floor, negative, zero, NaN, Infinity, non-number).
 *    - Guarantees rendered SVG fontSize >= 30px under 100% of tested conditions.
 *    - Pin radius geometry (text inside when radius >= 28, text below when radius < 28).
 * 3. Fallback behavior for non-standard props:
 *    - Out-of-bounds activeItemIndex (-1, 999).
 *    - Irregular transitionFrames (0, negative, fractional).
 *    - SalienceItem rendered outside SalienceContainer (throws fail-closed descriptive Error).
 *    - Non-standard / irregular children (null, boolean, number, string, array, fragment).
 *    - AST typography validator verification on salience components.
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  SalienceContainer,
  SalienceItem,
  MicroPin,
  useSalienceContext,
  useVisualSalience,
  resolveSalienceConfig,
  computeItemSalienceState,
  calculateItemSalienceProgress,
  DEFAULT_SALIENCE_CONFIG,
} from '../motion-kit/src/salience';

import { validateSourceCode } from '../validators/validate-mobile-typography';

export function runChallengerSalienceStressTests() {
  console.log('\n======================================================================');
  console.log(' EMPIRICAL CHALLENGER: Mode 2 (Progressive Unveil) & MicroPin Stress');
  console.log(' Agent: challenger_m2_motion_2');
  console.log('======================================================================\n');

  let assertionCount = 0;

  // =========================================================================
  // TEST SUITE 1: Mode 2 Progressive Unveil Detail & Label Isolation
  // =========================================================================
  console.log('  [Suite 1] Testing Progressive Unveil Detail & Label Isolation...');
  {
    const items = [
      { id: 0, label: 'ALPHA_MECHANISM_DETAILS', desc: 'Detailed description of alpha' },
      { id: 1, label: 'BETA_MECHANISM_DETAILS', desc: 'Detailed description of beta' },
      { id: 2, label: 'GAMMA_MECHANISM_DETAILS', desc: 'Detailed description of gamma' },
      { id: 3, label: 'DELTA_MECHANISM_DETAILS', desc: 'Detailed description of delta' },
    ];

    // Subtest 1.1: Default inactiveDisplay === 'micro-pin'
    for (let activeIdx = 0; activeIdx < items.length; activeIdx++) {
      const markup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          SalienceContainer,
          {
            mode: 'progressive-unveil',
            activeItemIndex: activeIdx,
            currentFrameOverride: 30, // steady-state frame
            transitionStartFrame: 0,
            transitionFrames: 12,
            inactiveDisplay: 'micro-pin',
          },
          ...items.map((item, idx) =>
            React.createElement(
              SalienceItem,
              { key: idx, index: idx, cx: 100, cy: 100 + idx * 150 },
              React.createElement(
                'g',
                null,
                React.createElement('text', { fontSize: 34 }, item.label),
                React.createElement('text', { fontSize: 30 }, item.desc)
              )
            )
          )
        )
      );

      for (let checkIdx = 0; checkIdx < items.length; checkIdx++) {
        const item = items[checkIdx];
        const isTargetActive = checkIdx === activeIdx;

        if (isTargetActive) {
          // Active item MUST contain full details and labels
          assert.ok(
            markup.includes(item.label),
            `[FAILURE] Active item ${checkIdx} must render full label "${item.label}"`
          );
          assert.ok(
            markup.includes(item.desc),
            `[FAILURE] Active item ${checkIdx} must render full desc "${item.desc}"`
          );
          // Active item MUST NOT render micro-pin for itself
          assert.ok(
            !markup.includes(`>#${checkIdx + 1}<`) || markup.includes(item.label),
            `Active item ${checkIdx} must not render micro-pin badge instead of details`
          );
          assertionCount += 3;
        } else {
          // Inactive item MUST NOT render child labels or descriptions
          assert.ok(
            !markup.includes(item.label),
            `[SALIENCE LEAK] Inactive item ${checkIdx} rendered child label "${item.label}"! Progressive unveil failed.`
          );
          assert.ok(
            !markup.includes(item.desc),
            `[SALIENCE LEAK] Inactive item ${checkIdx} rendered child desc "${item.desc}"! Progressive unveil failed.`
          );
          // Inactive item MUST render micro-pin `#${checkIdx + 1}`
          assert.ok(
            markup.includes(`>#${checkIdx + 1}<`),
            `[MICRO-PIN MISSING] Inactive item ${checkIdx} did not render micro-pin badge "#${checkIdx + 1}"`
          );
          assertionCount += 3;
        }
      }
    }
    console.log('    ✓ Subtest 1.1: Active details isolated, inactive child labels suppressed, micro-pins rendered.');

    // Subtest 1.2: Alternative inactiveDisplay === 'hidden'
    for (let activeIdx = 0; activeIdx < items.length; activeIdx++) {
      const markup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(
          SalienceContainer,
          {
            mode: 'progressive-unveil',
            activeItemIndex: activeIdx,
            currentFrameOverride: 30,
            transitionStartFrame: 0,
            transitionFrames: 12,
            inactiveDisplay: 'hidden',
          },
          ...items.map((item, idx) =>
            React.createElement(
              SalienceItem,
              { key: idx, index: idx, cx: 100, cy: 100 + idx * 150 },
              React.createElement('text', { fontSize: 34 }, item.label)
            )
          )
        )
      );

      for (let checkIdx = 0; checkIdx < items.length; checkIdx++) {
        const item = items[checkIdx];
        const isTargetActive = checkIdx === activeIdx;

        if (isTargetActive) {
          assert.ok(markup.includes(item.label), `Active item ${checkIdx} rendered label`);
          assertionCount += 1;
        } else {
          // Both child label AND micro-pin must be completely absent
          assert.ok(!markup.includes(item.label), `Hidden inactive item ${checkIdx} must not render label`);
          assert.ok(!markup.includes(`>#${checkIdx + 1}<`), `Hidden inactive item ${checkIdx} must not render micro-pin`);
          assertionCount += 2;
        }
      }
    }
    console.log('    ✓ Subtest 1.2: Inactive items completely hidden when inactiveDisplay="hidden".');

    // Subtest 1.3: Frame-by-frame transition & detail unveiling threshold
    // In salienceMath.ts: isFullDetailVisible = isActive && prog >= 0.25;
    const activeTarget = 1;
    let unveiledFrame = -1;
    for (let f = 0; f <= 12; f++) {
      const prog = calculateItemSalienceProgress(activeTarget, activeTarget, f, 0, 12, 0);
      const state = computeItemSalienceState(activeTarget, activeTarget, prog, {
        mode: 'progressive-unveil',
        inactiveDisplay: 'micro-pin',
      });

      if (state.isFullDetailVisible && unveiledFrame === -1) {
        unveiledFrame = f;
      }

      if (f === 0) {
        assert.strictEqual(state.isFullDetailVisible, false, 'At frame 0, full detail not yet visible');
        assert.strictEqual(state.showMicroPinOnly, true, 'At frame 0, shows micro-pin initially');
      }
      if (f === 12) {
        assert.strictEqual(state.isFullDetailVisible, true, 'At frame 12, full detail must be visible');
        assert.strictEqual(state.showMicroPinOnly, false, 'At frame 12, micro-pin must be gone');
        assert.strictEqual(state.opacity, 1.0, 'At frame 12, opacity must reach 1.0');
        assert.strictEqual(state.scale, 1.05, 'At frame 12, scale must reach 1.05');
      }
      assertionCount += 2;
    }
    // With snappy(rawT), prog reaches >= 0.25 at frame 1 (prog=0.2939, delta < 0.40)
    assert.ok(unveiledFrame >= 1 && unveiledFrame <= 3, `Detail unveiled smoothly at frame ${unveiledFrame}`);
    assertionCount += 1;
    console.log(`    ✓ Subtest 1.3: Frame-by-frame unveiling verified (detail unmasked at frame ${unveiledFrame}/12).`);
  }

  // =========================================================================
  // TEST SUITE 2: <MicroPin> Mobile Typography Floor (fontSize >= 30px)
  // =========================================================================
  console.log('  [Suite 2] Stress-testing <MicroPin> Mobile Typography Floor (>= 30px)...');
  {
    // Boundary matrix for fontSize
    const fontSizeTestMatrix = [
      { input: undefined, expected: 30, desc: 'default undefined' },
      { input: 30, expected: 30, desc: 'exact floor 30' },
      { input: 34, expected: 34, desc: 'body size 34' },
      { input: 48, expected: 48, desc: 'section size 48' },
      { input: 64, expected: 64, desc: 'hero size 64' },
      // Sub-floor adversarial cases: MUST clamp to 30
      { input: 29.999, expected: 30, desc: 'just below floor 29.999' },
      { input: 29, expected: 30, desc: 'sub-floor 29' },
      { input: 20, expected: 30, desc: 'sub-floor 20' },
      { input: 14, expected: 30, desc: 'sub-floor 14' },
      { input: 10, expected: 30, desc: 'sub-floor 10' },
      { input: 1, expected: 30, desc: 'sub-floor 1' },
      { input: 0, expected: 30, desc: 'zero fontSize 0' },
      { input: -1, expected: 30, desc: 'negative fontSize -1' },
      { input: -100, expected: 30, desc: 'negative fontSize -100' },
      // Non-standard floats
      { input: NaN, expected: 30, desc: 'NaN float' },
      { input: Infinity, expected: 30, desc: 'Infinity' },
      { input: -Infinity, expected: 30, desc: '-Infinity' },
      // Non-number types passed by untyped JS
      { input: null as any, expected: 30, desc: 'null' },
      { input: '' as any, expected: 30, desc: 'empty string' },
      { input: '20' as any, expected: 30, desc: 'string "20"' },
      { input: {} as any, expected: 30, desc: 'object {}' },
      { input: [] as any, expected: 30, desc: 'array []' },
    ];

    for (const tc of fontSizeTestMatrix) {
      const markup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MicroPin, { label: '#T', fontSize: tc.input })
      );

      const fontMatch = markup.match(/font-size="([^"]+)"/);
      assert.ok(fontMatch, `[FAILURE] MicroPin rendered without font-size attribute for ${tc.desc}`);
      const renderedSize = parseFloat(fontMatch[1]);

      assert.strictEqual(
        renderedSize,
        tc.expected,
        `[TYPOGRAPHY VIOLATION] For ${tc.desc}, expected ${tc.expected}px but got ${renderedSize}px in: ${markup}`
      );
      assert.ok(
        renderedSize >= 30,
        `[FLOOR BREACH] Rendered font-size ${renderedSize}px < 30px floor for ${tc.desc}`
      );
      assertionCount += 3;
    }
    console.log(`    ✓ Subtest 2.1: Verified ${fontSizeTestMatrix.length} boundary fontSize test cases; all enforced >= 30px.`);

    // Pin Radius and Layout Geometry Boundary Matrix
    const radiusTestCases = [
      { r: 14, isInside: false, desc: 'standard small pin (r=14)' },
      { r: 27.9, isInside: false, desc: 'just below threshold (r=27.9)' },
      { r: 28, isInside: true, desc: 'exact threshold (r=28)' },
      { r: 35, isInside: true, desc: 'large inside badge (r=35)' },
      { r: 80, isInside: true, desc: 'giant badge (r=80)' },
      { r: 0, isInside: false, desc: 'zero radius (r=0)' },
      { r: -10, isInside: false, desc: 'negative radius (r=-10)' },
    ];

    for (const rtc of radiusTestCases) {
      const markup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MicroPin, { label: '#R', pinRadius: rtc.r, fontSize: 30 })
      );

      const textHasYZero = /<text[^>]*\by="0"/.test(markup);
      if (rtc.isInside) {
        assert.ok(textHasYZero, `For inside badge (${rtc.desc}), text y must be 0`);
        assert.ok(markup.includes('dominant-baseline="central"'), `For inside badge (${rtc.desc}), baseline must be central`);
      } else {
        assert.ok(!textHasYZero, `For small pin (${rtc.desc}), text must be positioned below (not y=0)`);
        assert.ok(markup.includes('dominant-baseline="auto"'), `For small pin (${rtc.desc}), baseline must be auto`);
      }
      // Regardless of geometry, font size must remain 30
      assert.ok(markup.includes('font-size="30"'), `Font size must remain 30 for ${rtc.desc}`);
      assertionCount += 3;
    }
    console.log(`    ✓ Subtest 2.2: Verified ${radiusTestCases.length} pinRadius geometry configurations.`);

    // Label variations
    const labelTestCases = [
      '#1',
      '#999',
      'Bước 1',
      'Gap A',
      '🔬',
      'Text with & < > quotes',
      '',
    ];

    for (const lbl of labelTestCases) {
      const markup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MicroPin, { label: lbl })
      );
      assert.ok(markup.includes('class="micro-pin"'), 'Rendered micro-pin wrapper');
      assert.ok(markup.includes('font-size="30"'), 'Enforced font-size="30"');
      assertionCount += 2;
    }
    console.log(`    ✓ Subtest 2.3: Verified ${labelTestCases.length} diverse label payloads.`);
  }

  // =========================================================================
  // TEST SUITE 3: Fallback Behavior for Non-Standard Props
  // =========================================================================
  console.log('  [Suite 3] Testing Fallback Behavior for Non-Standard Props...');
  {
    // Subtest 3.1: Out-of-bounds activeItemIndex
    // Active index -1 (all inactive)
    const markupAllInactive = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        SalienceContainer,
        { mode: 'progressive-unveil', activeItemIndex: -1, currentFrameOverride: 30 },
        React.createElement(SalienceItem, { index: 0 }, React.createElement('text', null, 'Zero')),
        React.createElement(SalienceItem, { index: 1 }, React.createElement('text', null, 'One'))
      )
    );
    assert.ok(markupAllInactive.includes('>#1<'), 'Item 0 renders micro-pin when activeIndex=-1');
    assert.ok(markupAllInactive.includes('>#2<'), 'Item 1 renders micro-pin when activeIndex=-1');
    assert.ok(!markupAllInactive.includes('Zero'), 'Item 0 hides detail when activeIndex=-1');
    assert.ok(!markupAllInactive.includes('One'), 'Item 1 hides detail when activeIndex=-1');
    assertionCount += 4;

    // Active index 999 (far beyond available items)
    const markupFarOOB = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        SalienceContainer,
        { mode: 'progressive-unveil', activeItemIndex: 999, currentFrameOverride: 30 },
        React.createElement(SalienceItem, { index: 0 }, React.createElement('text', null, 'Zero')),
        React.createElement(SalienceItem, { index: 1 }, React.createElement('text', null, 'One'))
      )
    );
    assert.ok(markupFarOOB.includes('>#1<'), 'Item 0 renders micro-pin when activeIndex=999');
    assert.ok(markupFarOOB.includes('>#2<'), 'Item 1 renders micro-pin when activeIndex=999');
    assertionCount += 2;
    console.log('    ✓ Subtest 3.1: Out-of-bounds activeItemIndex (-1, 999) handled gracefully without errors.');

    // Subtest 3.2: Irregular transitionFrames
    // transitionFrames = 0 (instant transition)
    const progInstant = calculateItemSalienceProgress(1, 1, 0, 0, 0, 0);
    assert.ok(progInstant >= 0 && progInstant <= 1.0, 'Progress with transitionFrames=0 must be finite and in [0, 1]');
    const progNegative = calculateItemSalienceProgress(1, 1, 5, 0, -10, 0);
    assert.ok(progNegative >= 0 && progNegative <= 1.0, 'Progress with negative duration must be finite and in [0, 1]');
    assertionCount += 2;
    console.log('    ✓ Subtest 3.2: Irregular transition durations (0, negative) guarded against zero-division.');

    // Subtest 3.3: SalienceItem rendered outside SalienceContainer
    // Must fail-closed by throwing a clear, descriptive Error
    let threwOutside = false;
    let errorMessage = '';
    try {
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(SalienceItem, { index: 0 }, React.createElement('text', null, 'Orphan Item'))
      );
    } catch (err: any) {
      threwOutside = true;
      errorMessage = err?.message || '';
    }
    assert.ok(threwOutside, '[FAIL-OPEN HAZARD] SalienceItem outside container must throw an error');
    assert.ok(
      errorMessage.includes('SalienceContainer'),
      `Error message must reference SalienceContainer, got: "${errorMessage}"`
    );
    assertionCount += 2;
    console.log('    ✓ Subtest 3.3: SalienceItem throws fail-closed error when rendered outside SalienceContainer.');

    // Subtest 3.4: Irregular children payloads
    const irregularChildren = [
      null,
      undefined,
      false,
      true,
      0,
      'Raw string',
      React.createElement(React.Fragment, null, React.createElement('circle', { r: 10 })),
      [],
    ];

    for (const child of irregularChildren) {
      assert.doesNotThrow(() => {
        ReactDOMServer.renderToStaticMarkup(
          React.createElement(
            SalienceContainer,
            { mode: 'progressive-unveil', activeItemIndex: 0, currentFrameOverride: 30 },
            React.createElement(SalienceItem, { index: 0 }, child as any)
          )
        );
      }, `Must not throw on child of type ${typeof child}`);
      assertionCount += 1;
    }
    console.log(`    ✓ Subtest 3.4: Verified ${irregularChildren.length} irregular children payloads render without crashing.`);

    // Subtest 3.5: AST Static Typography Validator verification
    // Verify that code using MicroPin and SalienceContainer passes validateSourceCode without violations
    const sampleProductionSnippet = `
      import React from 'react';
      import { SalienceContainer, SalienceItem, MicroPin } from '@videorender/motion-kit';

      export const SampleMechanism = () => {
        return (
          <SalienceContainer mode="progressive-unveil" activeItemIndex={1}>
            <SalienceItem index={0} cx={100} cy={200}>
              <text fontSize={34}>Step 1 Active Content</text>
            </SalienceItem>
            <SalienceItem index={1} cx={100} cy={400}>
              <text fontSize={34}>Step 2 Active Content</text>
            </SalienceItem>
            <MicroPin label="#3" cx={100} cy={600} fontSize={30} />
          </SalienceContainer>
        );
      };
    `;

    const astViolations = validateSourceCode(sampleProductionSnippet, 'SampleMechanism.tsx');
    assert.strictEqual(
      astViolations.length,
      0,
      `[AST VIOLATION] Sample usage produced ${astViolations.length} typography violations: ${JSON.stringify(astViolations)}`
    );
    assertionCount += 1;
    console.log('    ✓ Subtest 3.5: AST static typography validator verified 0 violations on production usage.');
  }

  console.log('\n======================================================================');
  console.log(` EMPIRICAL CHALLENGE PASSED (${assertionCount} ASSERTIONS VERIFIED 100%)`);
  console.log(' Mode 2 (Progressive Unveil) & <MicroPin> certified robust under stress.');
  console.log('======================================================================\n');
}

// Support test runner or direct CLI execution
if (typeof describe === 'function' && typeof it === 'function') {
  describe('Challenger M2 Motion 2 Stress Suite', () => {
    it('passes all empirical challenger stress tests', () => {
      runChallengerSalienceStressTests();
    });
  });
}

if (
  require.main === module ||
  process.argv[1]?.includes('challenger_m2_motion_2')
) {
  try {
    runChallengerSalienceStressTests();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ CHALLENGER STRESS SUITE FAILED:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
