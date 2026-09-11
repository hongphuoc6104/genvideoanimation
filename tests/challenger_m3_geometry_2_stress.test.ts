/**
 * tests/challenger_m3_geometry_2_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS SUITE (Milenger M3 - Geometry Challenger 2)
 *
 * Adversarially challenges:
 * 1. Boundary conditions: clearance at exactly 29.9px (must fail) vs 30.0px (must pass).
 * 2. Monospace font handling (char factor 0.60 vs proportional 0.58-0.65).
 * 3. Negative coordinate spaces and nested group transformations.
 * 4. Zero-width or empty strings and degenerate text elements.
 * 5. Extreme text lengths in funnel tapering calculations and node invariants.
 * 6. AST Visitor transform accumulation and margin inspection limits.
 */

import * as assert from 'node:assert/strict';
import {
  estimateTextBounds,
  distancePointToSegment,
  distanceBoxToSegment,
  computeBoxIntersection,
  isBoxesDisjoint,
  calculateFunnelWidthAtY,
  calculateFunnelMaxTextWidth,
  calculateMinNodeRadius,
  calculateEdgeLabelDisplacement,
  calculateUnitNormal,
  computeEdgeLabelPosition,
  evaluateStageZone,
  parseTransformString,
  parsePolygonPoints,
  parseSvgPathSegments,
  getPolygonHorizontalBoundsAtY,
  lintLayoutGeometryCode,
  Box2D,
} from '../validators/validate-layout-geometry';

export function runEmpiricalChallengerSuite() {
  console.log('\n======================================================================');
  console.log(' EMPIRICAL ADVERSARIAL CHALLENGER SUITE: Geometry Challenger 2 (M3)');
  console.log(' Focus: Boundary Thresholds | Monospace | Negative Coords | Empty/Extreme');
  console.log('======================================================================\n');

  let passedAssertions = 0;
  const findings: Array<{ title: string; detail: string; severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO' }> = [];

  // =========================================================================
  // SUITE 1: Boundary Conditions (29.9px vs 30.0px Precision)
  // =========================================================================
  console.log('  [Suite 1] Adversarially challenging Boundary Thresholds (29.9px vs 30.0px)...');
  {
    // Text: 'ABCDE', fontSize = 30, sans-serif regular -> width = 5 * 30 * 0.58 = 87.0px
    // Height = 30 * 1.2 = 36.0px. yOffset = -24.0px.
    // If text is placed at x = 30, y = 30:
    // xMin = 30, xMax = 117.0px. yMin = 6.0px, yMax = 42.0px.

    // Test 1.1: Container Left Margin Boundary
    // Box 1: xMin = 0.1 (dLeft = 30 - 0.1 = 29.9px) -> MUST FAIL (< 30px)
    const code29_9Left = `
      export const Card29_9 = () => (
        <g>
          <rect x={0.1} y={-60} width={200} height={120} fill="#0F172A" />
          <text x={30} y={0} fontSize={30}>ABCDE</text>
        </g>
      );
    `;
    const res29_9Left = lintLayoutGeometryCode(code29_9Left, 'test-29_9-left.tsx');
    assert.ok(res29_9Left.length > 0, '29.9px margin must be rejected');
    const vio29_9 = res29_9Left.find((v) => v.ruleId === 'text-container-margin-insufficient');
    assert.ok(vio29_9, 'Must trigger text-container-margin-insufficient');
    assert.ok(Math.abs((vio29_9?.shortfallPx || 0) - 0.1) < 0.05, `Shortfall must be approx 0.1px (got ${vio29_9?.shortfallPx})`);
    passedAssertions += 3;

    // Box 2: xMin = 0.0 (dLeft = 30 - 0 = 30.0px, dRight = 200 - 117 = 83px) -> MUST PASS (>= 30px)
    const code30_0Left = `
      export const Card30_0 = () => (
        <g>
          <rect x={0} y={-60} width={200} height={120} fill="#0F172A" />
          <text x={30} y={0} fontSize={30}>ABCDE</text>
        </g>
      );
    `;
    const res30_0Left = lintLayoutGeometryCode(code30_0Left, 'test-30_0-left.tsx');
    assert.strictEqual(res30_0Left.length, 0, `30.0px margin must pass cleanly (got: ${JSON.stringify(res30_0Left)})`);
    passedAssertions += 1;

    // Test 1.2: Text-to-Vector Distance Boundary (29.9px vs 30.0px)
    // Vertical line at x = 0 from y = -100 to y = 100.
    // Text at x = 29.9, y = 0. Left border of text is at xMin = 29.9. Distance to line is 29.9px.
    const codeVec29_9 = `
      export const Vec29_9 = () => (
        <g>
          <line x1={0} y1={-100} x2={0} y2={100} stroke="#EF4444" strokeWidth={2} />
          <text x={29.9} y={0} fontSize={30} textAnchor="start">Near</text>
        </g>
      );
    `;
    const resVec29_9 = lintLayoutGeometryCode(codeVec29_9, 'test-vec-29_9.tsx');
    assert.ok(resVec29_9.length > 0, 'Vector distance 29.9px must fail');
    const vioVec29_9 = resVec29_9.find((v) => v.rule === 'text-vector-collision');
    assert.ok(vioVec29_9, 'Must trigger text-vector-collision');
    assert.strictEqual(vioVec29_9?.severity, 'MAJOR', 'Distance between 10px and 30px must be MAJOR');
    assert.ok(Math.abs((vioVec29_9?.shortfallPx || 0) - 0.1) < 0.05, 'Shortfall must be approx 0.1px');
    passedAssertions += 4;

    // Vector line at x = 0, text at x = 30.0px -> Distance = 30.0px -> MUST PASS
    const codeVec30_0 = `
      export const Vec30_0 = () => (
        <g>
          <line x1={0} y1={-100} x2={0} y2={100} stroke="#EF4444" strokeWidth={2} />
          <text x={30.0} y={0} fontSize={30} textAnchor="start">Safe</text>
        </g>
      );
    `;
    const resVec30_0 = lintLayoutGeometryCode(codeVec30_0, 'test-vec-30_0.tsx');
    assert.strictEqual(resVec30_0.length, 0, `Vector distance 30.0px must pass cleanly (got: ${JSON.stringify(resVec30_0)})`);
    passedAssertions += 1;

    // Test 1.3: Critical vs Major Distance Threshold at 9.9px vs 10.0px
    // Distance 9.9px (< 10px) -> CRITICAL
    const codeVec9_9 = `
      export const Vec9_9 = () => (
        <g>
          <line x1={0} y1={-100} x2={0} y2={100} stroke="#EF4444" strokeWidth={2} />
          <text x={9.9} y={0} fontSize={30} textAnchor="start">VeryNear</text>
        </g>
      );
    `;
    const resVec9_9 = lintLayoutGeometryCode(codeVec9_9, 'test-vec-9_9.tsx');
    const vioVec9_9 = resVec9_9.find((v) => v.rule === 'text-vector-collision');
    assert.strictEqual(vioVec9_9?.severity, 'CRITICAL', 'Distance < 10px must be CRITICAL');
    passedAssertions += 1;

    // Test 1.4: Container Top Margin Inspection (dTop < 30px)
    // Box: yMin = 0, height = 100. Text: y = 25, fontSize = 30 -> yMin = 25 - 24 = 1px.
    // dTop = 1px - 0px = 1px (insufficient margin < 30px)!
    const codeTopMargin = `
      export const CardTopMargin = () => (
        <g>
          <rect x={0} y={0} width={300} height={100} fill="#0F172A" />
          <text x={35} y={25} fontSize={30}>ABCDE</text>
        </g>
      );
    `;
    const resTopMargin = lintLayoutGeometryCode(codeTopMargin, 'test-top-margin.tsx');
    const hasTopMarginVio = resTopMargin.some(
      (v) => v.ruleId === 'text-container-top-margin' || v.message.includes('top margin')
    );
    if (!hasTopMarginVio) {
      findings.push({
        title: 'Asymmetry in Vertical Container Margin Enforcement (dTop omission)',
        detail:
          'In validators/validate-layout-geometry.ts lines 999 and 1043-1081: dTop is calculated at line 999 but dTop < 30px is never checked, whereas dBottom < 30px is checked. When text is placed 1px below rect top, no warning is emitted.',
        severity: 'MINOR',
      });
    }
  }
  console.log('    ✓ Suite 1: Boundary thresholds (29.9px vs 30.0px) verified.');

  // =========================================================================
  // SUITE 2: Monospace Font Handling & Typography Variants
  // =========================================================================
  console.log('  [Suite 2] Adversarially challenging Monospace and Typography Factors...');
  {
    // A. Monospace Factor Invariant: 0.60
    const text7 = '1234567';
    const monoReg = estimateTextBounds(text7, 30, 0, 0, 'start', true, 400);
    assert.strictEqual(monoReg.width, 7 * 30 * 0.60, 'Monospace regular width must be 0.60 * length * fontSize');

    // Monospace bold: MUST REMAIN 0.60 (fixed-pitch character matrix)
    const monoBold = estimateTextBounds(text7, 30, 0, 0, 'start', true, 700);
    assert.strictEqual(monoBold.width, 7 * 30 * 0.60, 'Monospace bold width must not expand to 0.65');
    assert.strictEqual(monoBold.width, monoReg.width, 'Monospace bold must equal monospace regular width');

    // Monospace uppercase > 40%: MUST NOT EXPAND
    const monoUpper = estimateTextBounds('ABCDEFG', 30, 0, 0, 'start', true, 400);
    assert.strictEqual(monoUpper.width, 7 * 30 * 0.60, 'Monospace uppercase must not expand to 0.65');
    passedAssertions += 4;

    // B. Proportional Factors: Regular 0.58 vs Bold 0.65 vs Uppercase 0.65
    const propReg = estimateTextBounds('abcdefg', 30, 0, 0, 'start', false, 400);
    assert.strictEqual(propReg.width, 7 * 30 * 0.58, 'Proportional regular width must be 0.58');

    const propBold = estimateTextBounds('abcdefg', 30, 0, 0, 'start', false, 700);
    assert.strictEqual(propBold.width, 7 * 30 * 0.65, 'Proportional bold width must be 0.65');

    const propUpper = estimateTextBounds('ABCDEFG', 30, 0, 0, 'start', false, 400);
    assert.strictEqual(propUpper.width, 7 * 30 * 0.65, 'Proportional uppercase (>40%) must expand to 0.65');

    const vietText = 'NGHIÊN CỨU KHOA HỌC';
    const propViet = estimateTextBounds(vietText, 30, 0, 0, 'start', false, 400);
    assert.strictEqual(propViet.width, vietText.length * 30 * 0.65, 'Vietnamese uppercase text must use 0.65 factor');
    passedAssertions += 4;

    // C. AST Extraction of Monospace in Code
    const codeMonoAst = `
      export const MonoNode = () => (
        <g>
          <rect x={0} y={0} width={130} height={60} fill="#0F172A" />
          <text x={0} y={30} fontSize={30} fontFamily="ui-monospace, SFMono-Regular, monospace">
            abcdef1
          </text>
        </g>
      );
    `;
    const resMono = lintLayoutGeometryCode(codeMonoAst, 'mono-ast.tsx');
    // Hash 'abcdef1' has length 7. At mono (0.60), width = 7 * 30 * 0.60 = 126px.
    // Container width is 130px. Margin is (130 - 126) / 2 = 2px (< 30px).
    assert.ok(resMono.length > 0, 'Monospace text in 130px container must fail clearance');
    passedAssertions += 1;
  }
  console.log('    ✓ Suite 2: Monospace font handling verified.');

  // =========================================================================
  // SUITE 3: Negative Coordinate Spaces & Nested Group Transformations
  // =========================================================================
  console.log('  [Suite 3] Adversarially challenging Negative Coordinate Spaces & Transformations...');
  {
    // A. Negative Coordinate Spaces
    // Rect at x = -400, y = -100, width = 800, height = 200 (x in [-400, 400], y in [-100, 100])
    // Text at x = 0, y = 0, fontSize = 30, middle anchor.
    // Text: 'NEGATIVE SPACE' (14 chars bold -> width = 14 * 30 * 0.65 = 273px)
    // xMin = -136.5, xMax = 136.5.
    // Left margin: -136.5 - (-400) = 263.5px (>= 30px). Right margin: 400 - 136.5 = 263.5px.
    // yMin = 0 - 24 = -24, yMax = -24 + 36 = 12.
    // Top margin: -24 - (-100) = 76px. Bottom margin: 100 - 12 = 88px.
    const codeNegativeClean = `
      export const NegativeClean = () => (
        <g>
          <rect x={-400} y={-100} width={800} height={200} fill="#0F172A" />
          <text x={0} y={0} fontSize={30} fontWeight={700} textAnchor="middle">
            NEGATIVE SPACE
          </text>
        </g>
      );
    `;
    const resNegClean = lintLayoutGeometryCode(codeNegativeClean, 'neg-clean.tsx');
    assert.strictEqual(resNegClean.length, 0, `Negative coordinate clean card must pass (got: ${JSON.stringify(resNegClean)})`);
    passedAssertions += 1;

    // Negative Coordinate Overflow Left
    // Rect x = -100, width = 150 (x in [-100, 50]).
    // Text at x = -80, fontSize = 30, text 'OVERFLOWING_TEXT' (16 chars * 30 * 0.58 = 278.4px)
    // xMax = -80 + 278.4 = 198.4 > 50 (overflows right border by 148.4px)
    const codeNegativeOverflow = `
      export const NegativeOverflow = () => (
        <g>
          <rect x={-100} y={-50} width={150} height={100} fill="#0F172A" />
          <text x={-80} y={0} fontSize={30}>OVERFLOWING_TEXT</text>
        </g>
      );
    `;
    const resNegOverflow = lintLayoutGeometryCode(codeNegativeOverflow, 'neg-overflow.tsx');
    assert.ok(resNegOverflow.length > 0, 'Negative coordinate overflow must be caught');
    const hasRightOverflow = resNegOverflow.some((v) => v.ruleId === 'text-container-overflow-right');
    assert.ok(hasRightOverflow, 'Must detect right border overflow in negative coordinate space');
    passedAssertions += 2;

    // B. Negative Vector Path Collision
    // Segment from (-200, -200) to (-200, 200).
    // Text at (-200, 0) -> distance = 0px -> CRITICAL collision
    const codeNegVector = `
      export const NegVector = () => (
        <g>
          <path d="M -200 -200 L -200 200" stroke="#EF4444" strokeWidth={4} />
          <text x={-200} y={0} fontSize={30} textAnchor="middle">Collision</text>
        </g>
      );
    `;
    const resNegVector = lintLayoutGeometryCode(codeNegVector, 'neg-vec.tsx');
    assert.ok(resNegVector.length > 0, 'Negative coordinate vector collision must be caught');
    const vioNegVec = resNegVector.find((v) => v.rule === 'text-vector-collision');
    assert.strictEqual(vioNegVec?.severity, 'CRITICAL', 'Direct superimposition must be CRITICAL');
    passedAssertions += 2;

    // C. Nested Group Transformations
    // Outer <g transform="translate(200, 300)">, Inner <g transform="translate(100, 150)">
    const codeNestedTransform = `
      export const NestedTransform = () => (
        <g transform="translate(200, 300)">
          <g transform="translate(100, 150)">
            <rect x={0} y={0} width={100} height={40} fill="#0F172A" />
            <text x={50} y={20} fontSize={30} textAnchor="middle">OVERFLOWING_TEXT</text>
          </g>
        </g>
      );
    `;
    const resNested = lintLayoutGeometryCode(codeNestedTransform, 'nested-transform.tsx');
    assert.ok(resNested.length > 0, 'Overflow inside nested group must be detected when text is centered');
    const vioNested = resNested.find((v) => v.rule === 'text-container-overflow');
    assert.ok(vioNested, 'Must detect text-container-overflow inside nested group');
    passedAssertions += 2;

    // C.2 Empirical Verification of Association Heuristic Blindspot (textCenter > box.xMax + 30)
    // Moderate overflow (5 chars): textCenter.x = 58.75 <= 130 -> Caught!
    const codeMod = `
      export const Mod = () => (
        <g>
          <rect x={0} y={0} width={100} height={40} fill="#0F172A" />
          <text x={10} y={20} fontSize={30}>ABCDE</text>
        </g>
      );
    `;
    const resMod = lintLayoutGeometryCode(codeMod, 'mod.tsx');
    assert.ok(resMod.length > 0, 'Moderate overflow (5 chars) must produce violations');

    // Catastrophic overflow (21 chars start-aligned): textCenter.x = 214.75 > 130 -> Uncaught!
    const codeCatastrophic = `
      export const Catastrophic = () => (
        <g>
          <rect x={0} y={0} width={100} height={40} fill="#0F172A" />
          <text x={10} y={20} fontSize={30}>LONG_TEXT_OVERFLOWING</text>
        </g>
      );
    `;
    const resCatastrophic = lintLayoutGeometryCode(codeCatastrophic, 'catastrophic.tsx');
    if (resCatastrophic.length === 0) {
      findings.push({
        title: 'Over-restrictive Association Heuristic Bypasses Large Start-Aligned Text Overflows',
        detail:
          'In validators/validate-layout-geometry.ts line 990: isAssociated requires textCenter.x <= box.xMax + 30. When text starts inside a container (x=10 in [0, 100]) but overflows significantly (>= 12 chars), textCenter shifts past box.xMax + 30, causing isAssociated to evaluate to false and completely evading the overflow validator (0 violations reported for 21-char text vs 2 violations for 5-char text). Same defect occurs in circle nodes (line 1125).',
        severity: 'CRITICAL',
      });
    }
    passedAssertions += 2;

    // D. Stage Zone Check with Cumulative Nested Group Translates
    // Outer group at y=1000, Inner group at y=500. Combined y = 1500px (inside Subtitle Safe Zone [1420, 1720])
    const codeNestedStageTrespass = `
      export const NestedStageTrespass = () => (
        <g transform="translate(0, 1000)">
          <g transform="translate(0, 500)">
            <rect x={100} y={0} width={400} height={100} />
          </g>
        </g>
      );
    `;
    const resNestedStage = lintLayoutGeometryCode(codeNestedStageTrespass, 'nested-stage.tsx');
    const hasSubtitleTrespass = resNestedStage.some((v) => v.ruleId === 'subtitle-zone-trespass');
    if (!hasSubtitleTrespass) {
      findings.push({
        title: 'Hierarchical Group Transform Accumulation Limitation in Stage Zone Check',
        detail:
          'checkStageZoneBoundaries inspects the transform on the immediate JSXElement node rather than accumulating parent translate(tx, ty). Two nested groups at y=1000 and y=500 individually evaluate to Zone 2 (<= 1420), but their composite coordinate y=1500 falls into Subtitle Safe Zone [1420, 1720].',
        severity: 'MAJOR',
      });
    }
  }
  console.log('    ✓ Suite 3: Negative coordinate spaces and transformations tested.');

  // =========================================================================
  // SUITE 4: Zero-Width, Empty Strings, and Degenerate Inputs
  // =========================================================================
  console.log('  [Suite 4] Adversarially challenging Zero-Width, Empty Strings & Degenerates...');
  {
    // A. Empty string bounding box behavior
    const emptyBounds = estimateTextBounds('', 30, 0, 0, 'start');
    assert.strictEqual(emptyBounds.text, '', 'Text should remain empty string');
    // Note: implementation uses Math.max(text.length, 1) = 1 char
    assert.strictEqual(emptyBounds.width, 30 * 0.58, 'Empty string defaults to 1-char width floor in estimator');
    passedAssertions += 2;

    // B. Empty text tag in JSX
    const codeEmptyText = `
      export const EmptyTag = () => (
        <g>
          <rect x={0} y={0} width={200} height={100} fill="#0F172A" />
          <text x={50} y={50} fontSize={30}></text>
        </g>
      );
    `;
    const resEmpty = lintLayoutGeometryCode(codeEmptyText, 'empty-text.tsx');
    assert.strictEqual(resEmpty.length, 0, 'Empty <text> tag must not trigger false positive violations');
    passedAssertions += 1;

    // C. Whitespace-only text tag
    const codeWhitespace = `
      export const WhitespaceTag = () => (
        <g>
          <rect x={0} y={0} width={200} height={100} fill="#0F172A" />
          <text x={50} y={50} fontSize={30}>   </text>
        </g>
      );
    `;
    const resWhitespace = lintLayoutGeometryCode(codeWhitespace, 'whitespace-text.tsx');
    assert.strictEqual(resWhitespace.length, 0, 'Whitespace-only <text> tag must not crash or false-flag');
    passedAssertions += 1;

    // D. Zero-width path string
    const segmentsEmpty = parseSvgPathSegments('');
    assert.strictEqual(segmentsEmpty.length, 0, 'Empty SVG path d attribute returns 0 segments');

    const segmentsWhitespace = parseSvgPathSegments('   ');
    assert.strictEqual(segmentsWhitespace.length, 0, 'Whitespace SVG path d attribute returns 0 segments');
    passedAssertions += 2;

    // E. Polygon points string with degenerate coordinates
    const polyEmpty = parsePolygonPoints('');
    assert.strictEqual(polyEmpty.length, 0, 'Empty polygon points string returns 0 points');

    const polyOdd = parsePolygonPoints('100,200 300'); // Odd number of coordinates
    assert.strictEqual(polyOdd.length, 1, 'Odd coordinate string safely parses completed pairs only');
    passedAssertions += 2;

    // F. Transform string with degenerate values
    const tEmpty = parseTransformString('');
    assert.strictEqual(tEmpty.tx, 0);
    assert.strictEqual(tEmpty.ty, 0);
    assert.strictEqual(tEmpty.scale, 1.0);

    const tMalformed = parseTransformString('translate(invalid, foo)');
    assert.strictEqual(tMalformed.tx, 0);
    assert.strictEqual(tMalformed.ty, 0);
    passedAssertions += 5;
  }
  console.log('    ✓ Suite 4: Zero-width, empty strings, and degenerates passed.');

  // =========================================================================
  // SUITE 5: Extreme Text Lengths & Funnel Tapering Calculations
  // =========================================================================
  console.log('  [Suite 5] Adversarially challenging Extreme Text Lengths & Funnel Math...');
  {
    // A. Extreme length (1,000 characters)
    const longText = 'A'.repeat(1000);
    const bounds1000 = estimateTextBounds(longText, 30, 0, 0, 'start', false, 700);
    assert.strictEqual(bounds1000.width, 1000 * 30 * 0.65, '1000 chars width must be 19,500px');
    passedAssertions += 1;

    // Extreme length node radius
    const minR1000 = calculateMinNodeRadius(bounds1000.width, bounds1000.height, 30);
    assert.ok(minR1000 > 9750, `Min node radius for 1000 chars (${minR1000.toFixed(1)}px) must exceed half width`);
    passedAssertions += 1;

    // B. Tapered Funnel Choke Point: wBot <= 60px
    const wChoke = calculateFunnelWidthAtY(200, 0, 200, 500, 50); // wBot = 50px
    assert.strictEqual(wChoke, 50, 'Width at bottom of choke funnel must be 50px');
    const maxTextAtChoke = calculateFunnelMaxTextWidth(wChoke, 30);
    assert.strictEqual(maxTextAtChoke, 0, 'Max text width when container width < 60px must be 0px');
    passedAssertions += 2;

    // C. Tapered Funnel with Scanline Outside Vertical Extent
    const polyPoints = parsePolygonPoints('-380,0 380,0 120,240 -120,240');
    const boundsAbove = getPolygonHorizontalBoundsAtY(polyPoints, -50);
    assert.strictEqual(boundsAbove, null, 'Scanline above polygon must return null');

    const boundsBelow = getPolygonHorizontalBoundsAtY(polyPoints, 300);
    assert.strictEqual(boundsBelow, null, 'Scanline below polygon must return null');
    passedAssertions += 2;

    // D. Scanline at Midpoint y = 120
    const boundsMid = getPolygonHorizontalBoundsAtY(polyPoints, 120);
    assert.ok(boundsMid !== null, 'Midpoint scanline must return bounds');
    const midWidth = boundsMid!.xRight - boundsMid!.xLeft;
    assert.ok(Math.abs(midWidth - 500) < 1.0, `Midpoint width must be ~500px (got: ${midWidth})`);
    passedAssertions += 2;

    // E. Extreme Length in Funnel AST Code:
    const codeFunnelExtreme = `
      export const FunnelExtreme = () => (
        <g>
          <polygon points="-380,0 380,0 120,240 -120,240" fill="url(#funnelGrad)" />
          <text x={0} y={120} fontSize={30} textAnchor="middle">
            ${'X'.repeat(200)}
          </text>
        </g>
      );
    `;
    const resFunnelExtreme = lintLayoutGeometryCode(codeFunnelExtreme, 'funnel-extreme.tsx');
    assert.ok(resFunnelExtreme.length > 0, 'Extreme 200-char text in funnel must be caught');
    const vioFunnel = resFunnelExtreme.find((v) => v.rule === 'text-container-overflow');
    assert.ok(vioFunnel, 'Must trigger text-container-overflow');
    assert.strictEqual(vioFunnel?.severity, 'CRITICAL', 'Funnel overflow must be CRITICAL');
    assert.ok((vioFunnel?.shortfallPx || 0) > 1000, 'Shortfall must be over 1000px');
    passedAssertions += 4;
  }
  console.log('    ✓ Suite 5: Extreme text lengths & funnel tapering math verified.');

  // =========================================================================
  // SUMMARY & REPORT
  // =========================================================================
  console.log('\n======================================================================');
  console.log(`✅ ALL 5 EMPIRICAL CHALLENGER SUITES PASSED (${passedAssertions} assertions verified)`);
  console.log(`   Discovered Findings: ${findings.length}`);
  for (const f of findings) {
    console.log(`   - [${f.severity}] ${f.title}`);
  }
  console.log('======================================================================\n');

  return { passedAssertions, findings };
}

const isDirect =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? process.argv[1].endsWith('challenger_m3_geometry_2_stress.test.ts')
    : false;

if (isDirect) {
  try {
    runEmpiricalChallengerSuite();
    process.exit(0);
  } catch (err) {
    console.error('❌ ADVERSARIAL SUITE FAILED:', err);
    process.exit(1);
  }
}
