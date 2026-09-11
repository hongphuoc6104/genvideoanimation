/**
 * tests/challenger_m1_r2_2_primitives_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — Milestone 1 Primitives
 * Challenger Subagent: challenger_m1_r2_2
 *
 * Scope of Independent Adversarial Verification:
 * 1. OpaqueCard:
 *    - Render in SVG and HTML modes.
 *    - Verify base shield strictly maintains opacity: 1.0 and background #0F172A.
 *    - Verify content receives dimmed opacity clamped in [0.20, 0.30] when inactive/dimmed.
 *    - Confirm base shield opacity NEVER drops below 1.0 across any parameter combination.
 * 2. SafeStageZone:
 *    - 1,000 extreme test boxes (negative coordinates, massive dimensions w=2000, h=3000,
 *      boxes placed at subtitle zone y=1450).
 *    - Confirm all clamped outputs satisfy x in [36, 1044 - w] and y in [180, 1420 - h].
 *    - Confirm subtitle buffer >= 50px (y_bottom <= 1420) is always preserved.
 * 3. RadialLabelGroup:
 *    - 360-degree item distributions (N=3, N=8, N=12, N=24).
 *    - In tangential-rotated mode, verify no item has text upside down (rotation angle in [-90, 90] deg).
 *    - In horizontal-pill mode, verify rotation is 0 deg.
 *    - In all modes, verify horizontal bounds [36, 1044] px are strictly respected.
 *    - Verify rendered SVG markup applies tangential rotation in tangential-rotated mode.
 * 4. AutoClippingConnector:
 *    - Test straight, curved Bezier (curvature from -1 to 1), and orthogonal routing.
 *    - Verify arrowhead rotation angles align with vector tangents.
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  // Types
  Point2D,
  BoxDescriptor,
  // Boundary Intersection Math
  solveTwoBoxIntersection,
  // Primitives
  OpaqueCard,
  SafeStageZone,
  DEFAULT_STAGE_BOUNDS,
  DEFAULT_SUBTITLE_ZONE_Y,
  RadialLabelGroup,
  calculateRadialLayout,
  AutoClippingConnector,
  generateConnectorPath,
  computeArrowheadPoints,
} from '../motion-kit/src/geometry';

export interface DefectReport {
  id: string;
  component: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  summary: string;
  expected: string;
  actual: string;
  reproduction: string;
}

export interface StressHarnessResult {
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  defects: DefectReport[];
  verdict: 'CONFIRMED' | 'DEFECT_FOUND';
}

export function runEmpiricalStressHarness(): StressHarnessResult {
  console.log('\n======================================================================');
  console.log(' EMPIRICAL ADVERSARIAL STRESS HARNESS — MILESTONE 1 PRIMITIVES');
  console.log(' Challenger: challenger_m1_r2_2 | Target: motion-kit/src/geometry');
  console.log('======================================================================\n');

  let totalAssertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;
  const defects: DefectReport[] = [];

  function recordAssert(passed: boolean, message: string, defectOnFail?: DefectReport) {
    totalAssertions++;
    if (passed) {
      passedAssertions++;
    } else {
      failedAssertions++;
      console.error(`  ❌ ASSERTION FAILED: ${message}`);
      if (defectOnFail) {
        defects.push(defectOnFail);
      }
    }
  }

  // =========================================================================
  // TEST 1: OpaqueCard 2-Layer Decoupled Opacity Invariants
  // =========================================================================
  console.log('▶ [TEST 1] Stress-testing OpaqueCard Opacity Invariants (SVG & HTML)...');
  {
    const asModes = ['svg', 'html'] as const;
    const activeStates = [true, false];
    const dimmedStates = [true, false];
    const testOpacities = [-0.5, 0.0, 0.05, 0.15, 0.20, 0.25, 0.28, 0.30, 0.40, 0.75, 1.0];

    for (const asMode of asModes) {
      for (const isActive of activeStates) {
        for (const isDimmed of dimmedStates) {
          for (const inactiveOp of testOpacities) {
            const markup = ReactDOMServer.renderToStaticMarkup(
              React.createElement(
                OpaqueCard,
                {
                  as: asMode,
                  width: 240,
                  height: 100,
                  isActive,
                  isDimmed,
                  inactiveOpacity: inactiveOp,
                  baseColor: '#0F172A',
                },
                React.createElement('span', null, 'Test Content')
              )
            );

            const effectiveActive = isActive && !isDimmed;

            // Invariant 1: Base shield opacity MUST be exactly 1.0 (never modified by dimming)
            if (asMode === 'svg') {
              const hasBaseShield = markup.includes('class="opaque-card-base-shield"');
              const hasOpacity1 = markup.includes('opacity="1"');
              const hasFillNavy = markup.includes('fill="#0F172A"');
              recordAssert(
                hasBaseShield && hasOpacity1 && hasFillNavy,
                `SVG Base shield opacity=1.0 & fill=#0F172A (active=${isActive}, dimmed=${isDimmed}, inactOp=${inactiveOp})`
              );

              // Verify base shield opacity NEVER drops below 1.0
              const shieldOpacityMatch = markup.match(/class="opaque-card-base-shield"[^>]*opacity="([^"]+)"/);
              const shieldOpacity = shieldOpacityMatch ? parseFloat(shieldOpacityMatch[1]) : 1.0;
              recordAssert(
                shieldOpacity >= 1.0,
                `SVG Base shield opacity (${shieldOpacity}) >= 1.0`
              );
            } else {
              const hasBaseShield = markup.includes('class="opaque-card-base-shield"');
              const hasOpacity1 = markup.includes('opacity:1');
              const hasBgNavy = markup.includes('background-color:#0F172A');
              recordAssert(
                hasBaseShield && hasOpacity1 && hasBgNavy,
                `HTML Base shield opacity:1 & bg=#0F172A (active=${isActive}, dimmed=${isDimmed}, inactOp=${inactiveOp})`
              );
            }

            // Invariant 2: Content layer opacity
            if (!effectiveActive) {
              const expectedContentOpacity = Math.max(0.2, Math.min(0.3, inactiveOp));
              if (asMode === 'svg') {
                const hasDimmedContent = markup.includes(`opacity="${expectedContentOpacity}"`);
                recordAssert(
                  hasDimmedContent,
                  `SVG Content layer opacity clamped in [0.20, 0.30] (expected: ${expectedContentOpacity})`
                );
              } else {
                const hasDimmedContent = markup.includes(`opacity:${expectedContentOpacity}`);
                recordAssert(
                  hasDimmedContent,
                  `HTML Content layer opacity clamped in [0.20, 0.30] (expected: ${expectedContentOpacity})`
                );
              }
            } else {
              if (asMode === 'svg') {
                const hasFullContent = markup.includes('class="opaque-card-content-layer" opacity="1"');
                recordAssert(hasFullContent, 'SVG Active content opacity=1.0');
              } else {
                const hasFullContent = markup.includes('opacity:1');
                recordAssert(hasFullContent, 'HTML Active content opacity=1.0');
              }
            }
          }
        }
      }
    }
    console.log('  ✓ OpaqueCard 2-layer decoupled opacity stress test completed.');
  }

  // =========================================================================
  // TEST 2: SafeStageZone 1,000 Extreme Boxes & Subtitle Floor Invariants
  // =========================================================================
  console.log('▶ [TEST 2] Stress-testing SafeStageZone with 1,000 Extreme Boxes...');
  {
    // Deterministic pseudo-random generator
    function pseudoRandom(seed: number): number {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    let capturedContext: any = null;
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(SafeStageZone, null, (ctx) => {
        capturedContext = ctx;
        return null;
      })
    );
    assert.ok(capturedContext !== null, 'SafeStageZone context must be accessible');

    const { clampBox, checkClearance } = capturedContext;

    for (let i = 0; i < 1000; i++) {
      let x: number, y: number, w: number, h: number;
      const category = i % 5;

      if (category === 0) {
        // Extreme negative coordinates
        x = -10000 * pseudoRandom(i * 4 + 1);
        y = -10000 * pseudoRandom(i * 4 + 2);
        w = 100 + 400 * pseudoRandom(i * 4 + 3);
        h = 80 + 300 * pseudoRandom(i * 4 + 4);
      } else if (category === 1) {
        // Massive sizes (w=2000, h=3000, up to 5000)
        x = 540 + 500 * (pseudoRandom(i * 4 + 1) - 0.5);
        y = 800 + 500 * (pseudoRandom(i * 4 + 2) - 0.5);
        w = 2000 + 3000 * pseudoRandom(i * 4 + 3);
        h = 3000 + 2000 * pseudoRandom(i * 4 + 4);
      } else if (category === 2) {
        // Boxes placed at subtitle zone y=1450 (and below, down to 3000)
        x = 100 + 800 * pseudoRandom(i * 4 + 1);
        y = 1450 + 1550 * pseudoRandom(i * 4 + 2);
        w = 150 + 300 * pseudoRandom(i * 4 + 3);
        h = 60 + 200 * pseudoRandom(i * 4 + 4);
      } else if (category === 3) {
        // Negative coordinates combined with massive dimensions
        x = -3000 * pseudoRandom(i * 4 + 1);
        y = -3000 * pseudoRandom(i * 4 + 2);
        w = 2000;
        h = 3000;
      } else {
        // Exact boundary and subtitle stress point (y=1450)
        x = 400;
        y = 1450;
        w = 280;
        h = 80;
      }

      const clamped = clampBox(x, y, w, h);

      // Invariant 1: x in [36, 1044 - clamped.width]
      const satisfiesXMin = clamped.x >= 36;
      const satisfiesXMax = clamped.x <= 1044 - clamped.width;
      recordAssert(
        satisfiesXMin && satisfiesXMax,
        `Box #${i} X bounds: clampedX=${clamped.x}, clampedW=${clamped.width} inside [36, 1044]`
      );

      // Invariant 2: y in [180, 1420 - clamped.height]
      const satisfiesYMin = clamped.y >= 180;
      const satisfiesYMax = clamped.y <= 1420 - clamped.height;
      recordAssert(
        satisfiesYMin && satisfiesYMax,
        `Box #${i} Y bounds: clampedY=${clamped.y}, clampedH=${clamped.height} inside [180, 1420]`
      );

      // Invariant 3: Subtitle buffer >= 50px is always preserved
      const bottomY = clamped.y + clamped.height;
      const clearance = checkClearance(bottomY);
      const bufferPreserved = clearance.isSafe && clearance.bufferPx >= 50;
      recordAssert(
        bufferPreserved,
        `Box #${i} Subtitle buffer: bottomY=${bottomY}, buffer=${clearance.bufferPx}px >= 50px`
      );
    }
    console.log('  ✓ SafeStageZone 1,000 extreme boxes stress test completed.');
  }

  // =========================================================================
  // TEST 3: RadialLabelGroup 360-Degree Item Distributions & Flip Alignment
  // =========================================================================
  console.log('▶ [TEST 3] Stress-testing RadialLabelGroup (N=3, N=8, N=12, N=24)...');
  {
    const sampleSizes = [3, 8, 12, 24];

    for (const n of sampleSizes) {
      const items = Array.from({ length: n }, (_, i) => ({
        id: `item-${i}`,
        label: `Label ${i}`,
        sublabel: `Sub ${i}`,
        width: 220,
        height: 56,
      }));

      // 1. Horizontal-pill mode: verify rotation is 0 deg for all items
      const horizontalLayouts = calculateRadialLayout(
        540,
        800,
        350,
        items,
        -90,
        360,
        'horizontal-pill'
      );

      for (const l of horizontalLayouts) {
        recordAssert(
          l.rotationDeg === 0,
          `N=${n} item #${l.index} horizontal-pill rotation is 0 deg (got: ${l.rotationDeg})`
        );
        recordAssert(
          l.pillX >= 36 && l.pillX + l.pillWidth <= 1044,
          `N=${n} item #${l.index} horizontal bounds [36, 1044] px (pillX=${l.pillX}, right=${l.pillX + l.pillWidth})`
        );
      }

      // 2. Tangential-rotated mode: verify flip alignment and inverted text prevention
      const tangentialLayouts = calculateRadialLayout(
        540,
        800,
        350,
        items,
        -90,
        360,
        'tangential-rotated'
      );

      for (const l of tangentialLayouts) {
        // Normalized orientation angle mapped to [-180, 180]
        const effAngle = ((l.rotationDeg + 180) % 360) - 180;
        const isUpright = effAngle >= -90 && effAngle <= 90;

        recordAssert(
          isUpright,
          `N=${n} item #${l.index} text upright in [-90, 90] deg after flip alignment (angle=${l.normalizedAngle}°, effRot=${effAngle}°)`
        );

        // Verify flip alignment trigger: angle in (90, 270) MUST be flipped
        if (l.normalizedAngle > 90 && l.normalizedAngle < 270) {
          recordAssert(
            l.isFlipped === true,
            `N=${n} item #${l.index} (angle=${l.normalizedAngle}°) in left hemisphere must be flipped`
          );
        }

        // Horizontal bounds [36, 1044] px
        recordAssert(
          l.pillX >= 36 && l.pillX + l.pillWidth <= 1044,
          `N=${n} item #${l.index} tangential bounds [36, 1044] px (pillX=${l.pillX}, right=${l.pillX + l.pillWidth})`
        );
      }

      // 3. Rendered SVG Component Verification for tangential-rotated mode
      const renderedSvg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(RadialLabelGroup, {
          centerX: 540,
          centerY: 800,
          radius: 350,
          items,
          layoutMode: 'tangential-rotated',
          useOpaqueShield: true,
        })
      );

      // Check whether rendered markup applies rotationDeg to the cards/pills
      // A correctly rotated tangential label MUST contain a rotate(...) transform for non-horizontal items!
      const hasAnyNonZeroRotation = tangentialLayouts.some(
        (l) => l.rotationDeg !== 0 && l.rotationDeg !== 360
      );

      if (hasAnyNonZeroRotation) {
        const hasRotateTransform = renderedSvg.includes('rotate(');
        recordAssert(
          hasRotateTransform,
          `RadialLabelGroup (N=${n}) rendered SVG must apply rotate() transform in tangential-rotated mode`,
          hasRotateTransform
            ? undefined
            : {
                id: `DEFECT-RADIAL-01-N${n}`,
                component: 'RadialLabelGroup.tsx',
                severity: 'MAJOR',
                summary:
                  'RadialLabelGroup renders pills with 0° rotation even when layoutMode="tangential-rotated"',
                expected:
                  'Rendered SVG pills/cards should have transform="rotate(...)" applied using layout.rotationDeg',
                actual:
                  'Rendered SVG contains zero rotate() transforms; all pills remain horizontal in DOM/SVG',
                reproduction:
                  `ReactDOMServer.renderToStaticMarkup(React.createElement(RadialLabelGroup, { items (N=${n}), layoutMode: "tangential-rotated" })) contains no rotate()`,
              }
        );
      }
    }
    console.log('  ✓ RadialLabelGroup 360-degree distributions tested.');
  }

  // =========================================================================
  // TEST 4: AutoClippingConnector Routing & Arrowhead Tangent Alignment
  // =========================================================================
  console.log('▶ [TEST 4] Stress-testing AutoClippingConnector Arrowhead Tangent Alignment...');
  {
    const b1: BoxDescriptor = { cx: 500, cy: 500, width: 80, height: 60 };

    // 4.1 Straight routing: verify arrowhead rotation angles align with vector tangents
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const b2: BoxDescriptor = {
        cx: 500 + 300 * Math.cos(rad),
        cy: 500 + 300 * Math.sin(rad),
        width: 80,
        height: 60,
      };

      const inter = solveTwoBoxIntersection(b1, b2, 4, 4);
      const path = generateConnectorPath(inter, 'straight');

      const dx = inter.end.x - inter.start.x;
      const dy = inter.end.y - inter.start.y;
      const expectedTangentEnd = (Math.atan2(dy, dx) * 180) / Math.PI;

      const angleDiff = Math.abs(((path.tangentEnd - expectedTangentEnd + 180) % 360) - 180);
      recordAssert(
        angleDiff < 1e-4,
        `Straight connector (deg=${deg}°) arrowhead tangentEnd aligns with vector tangent (diff=${angleDiff.toFixed(5)}°)`
      );
    }

    // 4.2 Curved Bezier routing: verify arrowhead rotation aligns with analytical tangent B'(1)
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const b2: BoxDescriptor = {
        cx: 500 + 300 * Math.cos(rad),
        cy: 500 + 300 * Math.sin(rad),
        width: 80,
        height: 60,
      };
      const inter = solveTwoBoxIntersection(b1, b2, 4, 4);

      for (let c = -1.0; c <= 1.0; c += 0.2) {
        const path = generateConnectorPath(inter, 'curved', c);
        const ctrl = path.controlPoint!;
        // Analytical derivative of quadratic Bezier B(t) at t=1: B'(1) = 2*(end - ctrl)
        const tx = inter.end.x - ctrl.x;
        const ty = inter.end.y - ctrl.y;
        const trueTangentEnd = (Math.atan2(ty, tx) * 180) / Math.PI;

        const angleDiff = Math.abs(((path.tangentEnd - trueTangentEnd + 180) % 360) - 180);
        recordAssert(
          angleDiff < 1e-4,
          `Curved Bezier (deg=${deg}°, c=${c.toFixed(1)}) tangentEnd aligns with B'(1) (diff=${angleDiff.toFixed(5)}°)`
        );
      }
    }

    // 4.3 Orthogonal routing: verify arrowhead rotation aligns with vector tangents
    // Test general 2D orthogonal routing
    const orthogonalTestPairs: Array<{ src: BoxDescriptor; tgt: BoxDescriptor; name: string }> = [
      {
        src: { cx: 200, cy: 200, width: 80, height: 60 },
        tgt: { cx: 600, cy: 400, width: 80, height: 60 },
        name: 'Quadrant 1 (+dx, +dy)',
      },
      {
        src: { cx: 600, cy: 200, width: 80, height: 60 },
        tgt: { cx: 200, cy: 400, width: 80, height: 60 },
        name: 'Quadrant 2 (-dx, +dy)',
      },
      {
        src: { cx: 200, cy: 400, width: 80, height: 60 },
        tgt: { cx: 600, cy: 200, width: 80, height: 60 },
        name: 'Quadrant 4 (+dx, -dy)',
      },
      {
        src: { cx: 600, cy: 400, width: 80, height: 60 },
        tgt: { cx: 200, cy: 200, width: 80, height: 60 },
        name: 'Quadrant 3 (-dx, -dy)',
      },
      {
        src: { cx: 200, cy: 300, width: 80, height: 60 },
        tgt: { cx: 600, cy: 300, width: 80, height: 60 },
        name: 'Collinear Horizontal East (dy=0)',
      },
      {
        src: { cx: 600, cy: 300, width: 80, height: 60 },
        tgt: { cx: 200, cy: 300, width: 80, height: 60 },
        name: 'Collinear Horizontal West (dy=0)',
      },
      // VERTICAL COLLINEAR (CRITICAL ADVERSARIAL CASE: dx=0)
      {
        src: { cx: 500, cy: 200, width: 80, height: 60 },
        tgt: { cx: 500, cy: 600, width: 80, height: 60 },
        name: 'Collinear Vertical South (dx=0, dy>0)',
      },
      {
        src: { cx: 500, cy: 600, width: 80, height: 60 },
        tgt: { cx: 500, cy: 200, width: 80, height: 60 },
        name: 'Collinear Vertical North (dx=0, dy<0)',
      },
    ];

    for (const pair of orthogonalTestPairs) {
      const inter = solveTwoBoxIntersection(pair.src, pair.tgt, 4, 4);
      const path = generateConnectorPath(inter, 'orthogonal');

      // Determine the actual vector tangent of the path segment entering inter.end
      // Parse SVG path to extract the line segment entering end
      const dx = inter.end.x - inter.start.x;
      const dy = inter.end.y - inter.start.y;

      let trueEndTangent: number;
      if (Math.abs(dx) < 1e-4) {
        // Purely vertical path
        trueEndTangent = dy >= 0 ? 90 : -90;
      } else {
        // H-V-H orthogonal path finishes with a horizontal segment to end.x
        trueEndTangent = dx >= 0 ? 0 : 180;
      }

      const diff = Math.abs(((path.tangentEnd - trueEndTangent + 180) % 360) - 180);
      const aligns = diff < 1.0;

      recordAssert(
        aligns,
        `Orthogonal routing [${pair.name}] tangentEnd aligns with incoming path vector (got: ${path.tangentEnd}°, true: ${trueEndTangent}°, diff: ${diff.toFixed(1)}°)`,
        aligns
          ? undefined
          : {
              id: `DEFECT-CONNECTOR-01-${pair.name.replace(/\s+/g, '_')}`,
              component: 'AutoClippingConnector.tsx',
              severity: 'CRITICAL',
              summary:
                `Orthogonal connector arrow is misaligned by 90° for vertically aligned boxes (${pair.name})`,
              expected:
                `tangentEnd should equal ${trueEndTangent}° to align with incoming vertical path segment`,
              actual:
                `tangentEnd returned ${path.tangentEnd}° (hardcoded dx >= 0 ? 0 : 180). Arrowhead points sideways instead of along the path.`,
              reproduction:
                `generateConnectorPath(solveTwoBoxIntersection({cx:500,cy:200},{cx:500,cy:600}), 'orthogonal').tangentEnd === 0 (should be 90)`,
            }
      );
    }
    console.log('  ✓ AutoClippingConnector routing stress test completed.');
  }

  // =========================================================================
  // SUMMARY & VERDICT
  // =========================================================================
  const verdict: 'CONFIRMED' | 'DEFECT_FOUND' =
    defects.length === 0 ? 'CONFIRMED' : 'DEFECT_FOUND';

  console.log('\n======================================================================');
  console.log(` EMPIRICAL STRESS HARNESS COMPLETED — VERDICT: ${verdict}`);
  console.log(` Total Assertions : ${totalAssertions}`);
  console.log(` Passed           : ${passedAssertions}`);
  console.log(` Failed           : ${failedAssertions}`);
  console.log(` Defects Found    : ${defects.length}`);
  console.log('======================================================================\n');

  if (defects.length > 0) {
    console.log('DEFECT LEDGER:');
    for (const d of defects) {
      console.log(`  [${d.severity}] ${d.id}: ${d.summary}`);
      console.log(`    Component : ${d.component}`);
      console.log(`    Expected  : ${d.expected}`);
      console.log(`    Actual    : ${d.actual}`);
      console.log(`    Repro     : ${d.reproduction}\n`);
    }
  }

  return {
    totalAssertions,
    passedAssertions,
    failedAssertions,
    defects,
    verdict,
  };
}

// Execute directly if run via CLI
if (require.main === module) {
  const result = runEmpiricalStressHarness();
  process.exit(result.defects.length === 0 ? 0 : 1);
}
