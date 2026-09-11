/**
 * tests/invariants/layout-geometry-clearance.test.ts
 *
 * Authoritative Invariant Test Suite for Zero-Collision & Bounding Box Clearance (Milestone M3).
 * Verifies mathematical formulas, geometric clearance standards, stage budget zones,
 * and deliberate collision fixtures (rejection) vs clean fixtures (acceptance):
 *
 * 1. INV-GEO-01: Bounding Box Estimation Formulas (Sans-serif, Bold, Monospace, SVG Baseline).
 * 2. INV-GEO-02: Container Clearance & Disjoint Bounding Boxes (Box_A ∩ Box_B = ∅, margin >= 30px).
 * 3. INV-GEO-03: Funnel Tapering Formula (W(y) - 60px max text capacity).
 * 4. INV-GEO-04: Node Radius Invariant (R_min vs text width & corner clearance).
 * 5. INV-GEO-05: Directed Edge Label Normal Displacement (|d_perp| >= H/2 + strokeWidth/2 + 30px).
 * 6. INV-GEO-06: Stage Budget 4 Zones (HUD, Main Stage, Subtitle Safe Zone, OS Margin).
 * 7. INV-GEO-07: Deliberate Collision Fixtures (100% Rejection) vs Clean Fixtures (100% Acceptance).
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
  STAGE_BUDGET_ZONES,
  evaluateStageZone,
  lintLayoutGeometryCode,
  Box2D,
} from '../../validators/validate-layout-geometry';

export function runLayoutGeometryInvariantTests() {
  console.log('\n======================================================================');
  console.log(' INVARIANT TEST SUITE: Zero-Collision & Bounding Box Clearance (M3)');
  console.log(' Standards: Margin >= 30px | Box_A ∩ Box_B = ∅ | Stage 4-Zone Budget');
  console.log('======================================================================\n');

  let totalAssertions = 0;

  // =========================================================================
  // GATE 1: Bounding Box Estimation Formulas (INV-GEO-01)
  // =========================================================================
  console.log('  [Gate 1] Verifying INV-GEO-01: Bounding Box Estimation Formulas...');
  {
    // A. Regular Sans-Serif font metrics (char factor 0.58)
    const textRegular = 'He thong phan tan';
    const boundsReg = estimateTextBounds(textRegular, 30, 100, 200, 'start', false, 400);
    const expectedWidthReg = textRegular.length * 30 * 0.58;
    assert.strictEqual(boundsReg.width, expectedWidthReg, 'Regular font width must match 0.58 factor');
    assert.strictEqual(boundsReg.xMin, 100, 'Start anchor xMin must equal x');
    assert.strictEqual(boundsReg.xMax, 100 + expectedWidthReg, 'xMax must equal xMin + width');
    assert.strictEqual(boundsReg.height, 30 * 1.2, 'Line height must be 1.2x fontSize');
    assert.strictEqual(boundsReg.yMin, 200 - 30 * 0.8, 'yMin must reflect typographic ascent (-0.8 * fontSize)');
    assert.strictEqual(boundsReg.yMax, boundsReg.yMin + boundsReg.height, 'yMax must equal yMin + height');
    totalAssertions += 6;

    // B. Bold Sans-Serif font metrics (char factor 0.65)
    const boundsBold = estimateTextBounds(textRegular, 30, 100, 200, 'start', false, 700);
    const expectedWidthBold = textRegular.length * 30 * 0.65;
    assert.strictEqual(boundsBold.width, expectedWidthBold, 'Bold font width must match 0.65 factor');
    assert.ok(boundsBold.width > boundsReg.width, 'Bold font width must be wider than regular');
    totalAssertions += 2;

    // C. Monospace font metrics (char factor 0.60)
    const hash = 'a1b2c3d';
    const boundsMono = estimateTextBounds(hash, 30, 0, 0, 'start', true, 400);
    const expectedWidthMono = 7 * 30 * 0.60;
    assert.strictEqual(boundsMono.width, expectedWidthMono, 'Monospace width must match 0.60 factor');
    totalAssertions += 1;

    // D. Anchor alignments: middle and end
    const boundsMiddle = estimateTextBounds('Center Text', 30, 540, 300, 'middle', false);
    assert.strictEqual(boundsMiddle.xOffset, -boundsMiddle.width / 2, 'Middle anchor xOffset must be -width / 2');
    assert.strictEqual(boundsMiddle.xMin, 540 - boundsMiddle.width / 2, 'Middle anchor xMin must be centered');
    assert.strictEqual(boundsMiddle.xMax, 540 + boundsMiddle.width / 2, 'Middle anchor xMax must be centered');

    const boundsEnd = estimateTextBounds('End Text', 30, 1000, 300, 'end', false);
    assert.strictEqual(boundsEnd.xOffset, -boundsEnd.width, 'End anchor xOffset must be -width');
    assert.strictEqual(boundsEnd.xMin, 1000 - boundsEnd.width, 'End anchor xMin must extend left');
    assert.strictEqual(boundsEnd.xMax, 1000, 'End anchor xMax must equal x');
    totalAssertions += 6;
  }
  console.log('    ✓ INV-GEO-01: Bounding box estimations passed.');

  // =========================================================================
  // GATE 2: Container Clearance & Disjoint Bounding Boxes (INV-GEO-02)
  // =========================================================================
  console.log('  [Gate 2] Verifying INV-GEO-02: Container Clearance & Disjoint Bounding Boxes...');
  {
    // A. Disjoint Bounding Boxes (Box_A ∩ Box_B = ∅)
    const box1: Box2D = { xMin: 100, xMax: 400, yMin: 200, yMax: 350, width: 300, height: 150 };
    const box2Disjoint: Box2D = { xMin: 450, xMax: 750, yMin: 200, yMax: 350, width: 300, height: 150 };
    assert.strictEqual(isBoxesDisjoint(box1, box2Disjoint), true, 'Disjoint boxes must return true');

    const isectDisjoint = computeBoxIntersection(box1, box2Disjoint);
    assert.strictEqual(isectDisjoint.intersects, false, 'Intersection must be false for disjoint boxes');
    assert.strictEqual(isectDisjoint.overlapW, 0, 'overlapW must be 0 for disjoint boxes');
    assert.strictEqual(isectDisjoint.overlapH, 0, 'overlapH must be 0 for disjoint boxes');
    totalAssertions += 4;

    // B. Overlapping Bounding Boxes (Box_A ∩ Box_B != ∅)
    const box2Overlapping: Box2D = { xMin: 300, xMax: 600, yMin: 250, yMax: 400, width: 300, height: 150 };
    assert.strictEqual(isBoxesDisjoint(box1, box2Overlapping), false, 'Overlapping boxes must return false');

    const isectOverlap = computeBoxIntersection(box1, box2Overlapping);
    assert.strictEqual(isectOverlap.intersects, true, 'Intersection must be true for overlapping boxes');
    assert.strictEqual(isectOverlap.overlapW, 100, 'overlapW must be 100px (400 - 300)');
    assert.strictEqual(isectOverlap.overlapH, 100, 'overlapH must be 100px (350 - 250)');
    totalAssertions += 4;

    // C. Container Clearance >= 30px verification
    const container: Box2D = { xMin: 100, xMax: 600, yMin: 300, yMax: 450, width: 500, height: 150 };
    // Safe text: inside with 40px left, 40px right, 35px top, 35px bottom
    const safeText = estimateTextBounds('Safe Text', 30, 140, 360, 'start', false);
    const dLeft = safeText.xMin - container.xMin;
    const dRight = container.xMax - safeText.xMax;
    const dTop = safeText.yMin - container.yMin;
    const dBottom = container.yMax - safeText.yMax;
    assert.ok(dLeft >= 30, `Safe text left margin (${dLeft}px) must be >= 30px`);
    assert.ok(dRight >= 30, `Safe text right margin (${dRight}px) must be >= 30px`);
    assert.ok(dTop >= 30, `Safe text top margin (${dTop}px) must be >= 30px`);
    assert.ok(dBottom >= 30, `Safe text bottom margin (${dBottom}px) must be >= 30px`);
    totalAssertions += 4;
  }
  console.log('    ✓ INV-GEO-02: Disjoint boxes and clearance rules passed.');

  // =========================================================================
  // GATE 3: Funnel Tapering Formula (INV-GEO-03)
  // =========================================================================
  console.log('  [Gate 3] Verifying INV-GEO-03: Funnel Tapering Formula (W(y) - 60px)...');
  {
    // Funnel geometry from Observation 1.1:
    // points="-380,0 380,0 120,240 -120,240"
    // Top width = 760, bottom width = 240, height = 240, y0 = 0
    const wTop = 760;
    const wBot = 240;
    const Hf = 240;
    const y0 = 0;

    // A. At top (y = 0)
    const wAtTop = calculateFunnelWidthAtY(0, y0, Hf, wTop, wBot);
    assert.strictEqual(wAtTop, 760, 'Width at top must be 760px');
    const maxTextAtTop = calculateFunnelMaxTextWidth(wAtTop);
    assert.strictEqual(maxTextAtTop, 700, 'Max text width at top must be 700px (760 - 60)');

    // B. At mid-point (y = 120)
    const wAtMid = calculateFunnelWidthAtY(120, y0, Hf, wTop, wBot);
    assert.strictEqual(wAtMid, 500, 'Width at mid must be 500px');
    const maxTextAtMid = calculateFunnelMaxTextWidth(wAtMid);
    assert.strictEqual(maxTextAtMid, 440, 'Max text width at mid must be 440px (500 - 60)');

    // C. At y = 205 (Observation 1.1 defect level)
    const wAt205 = calculateFunnelWidthAtY(205, y0, Hf, wTop, wBot);
    const expectedW205 = 760 - (760 - 240) * (205 / 240);
    assert.ok(Math.abs(wAt205 - expectedW205) < 1e-6, 'Width at y=205 must follow linear taper');
    assert.ok(Math.abs(wAt205 - 315.833) < 0.01, 'Width at y=205 must be approx 315.83px');

    const maxTextAt205 = calculateFunnelMaxTextWidth(wAt205);
    assert.ok(Math.abs(maxTextAt205 - 255.833) < 0.01, 'Max allowable text width at y=205 is ~255.83px');

    // Defect verification: 43 characters uppercase at 30px bold font
    const defectLabel = '3. KHOẢNG TRỐNG CẦN GIẢI QUYẾT (GAP NICHE)';
    const defectBounds = estimateTextBounds(defectLabel, 30, 0, 205, 'middle', false, 800);
    assert.ok(
      defectBounds.width > maxTextAt205,
      `Text width (${defectBounds.width.toFixed(1)}px) exceeds max allowable capacity (${maxTextAt205.toFixed(1)}px)`
    );
    // Text extends past funnel border
    const halfFunnelWidth = wAt205 / 2;
    const textHalfSpan = defectBounds.width / 2;
    const borderOverflow = textHalfSpan - halfFunnelWidth;
    assert.ok(borderOverflow > 180, `Text must overflow funnel vector border by > 180px (actual: ${borderOverflow.toFixed(1)}px)`);

    // D. At bottom (y = 240)
    const wAtBot = calculateFunnelWidthAtY(240, y0, Hf, wTop, wBot);
    assert.strictEqual(wAtBot, 240, 'Width at bottom must be 240px');
    const maxTextAtBot = calculateFunnelMaxTextWidth(wAtBot);
    assert.strictEqual(maxTextAtBot, 180, 'Max text width at bottom must be 180px (240 - 60)');
    totalAssertions += 8;
  }
  console.log('    ✓ INV-GEO-03: Funnel tapering formula passed.');

  // =========================================================================
  // GATE 4: Node Radius Invariant (INV-GEO-04)
  // =========================================================================
  console.log('  [Gate 4] Verifying INV-GEO-04: Node Radius Invariant (R_min vs Text Width)...');
  {
    // A. 7-character monospace SHA hash (Observation 1.5 in DagNode.tsx)
    const hash = 'a1b2c3d';
    const hashBounds = estimateTextBounds(hash, 30, 0, 0, 'middle', true, 400);
    assert.strictEqual(hashBounds.width, 126, '7-char monospace hash width at 30px must be 126px');
    assert.strictEqual(hashBounds.height, 36, 'Hash height at 30px must be 36px');

    const minR = calculateMinNodeRadius(hashBounds.width, hashBounds.height, 30);
    const expectedMinR = Math.sqrt((126 / 2) ** 2 + (36 / 2) ** 2) + 30; // sqrt(63^2 + 18^2) + 30 = 65.52 + 30 = 95.52
    assert.ok(Math.abs(minR - expectedMinR) < 1e-6, 'Minimum node radius must match formula');
    assert.ok(minR >= 95.0, `R_min (${minR.toFixed(1)}px) must be >= 95.0px`);

    // In DagNode.tsx, radius was 52px
    const legacyRadius = 52;
    assert.ok(legacyRadius < minR, `Legacy radius (${legacyRadius}px) violates minimum required radius (${minR.toFixed(1)}px)`);
    // Text diameter overflow: 2 * R = 104px < 126px
    assert.ok(2 * legacyRadius < hashBounds.width, 'Legacy circle diameter (104px) is strictly less than text width (126px)');

    // B. Clean node radius test
    const cleanRadius = 100;
    assert.ok(cleanRadius >= minR, 'Clean radius (100px) satisfies R_min requirement');
    const cornerClearance = cleanRadius - Math.sqrt((hashBounds.width / 2) ** 2 + (hashBounds.height / 2) ** 2);
    assert.ok(cornerClearance >= 30, `Corner clearance (${cornerClearance.toFixed(1)}px) must be >= 30px`);
    totalAssertions += 7;
  }
  console.log('    ✓ INV-GEO-04: Node radius invariant passed.');

  // =========================================================================
  // GATE 5: Directed Edge Label Normal Displacement (INV-GEO-05)
  // =========================================================================
  console.log('  [Gate 5] Verifying INV-GEO-05: Directed Edge Label Normal Displacement...');
  {
    // A. Perpendicular displacement calculation
    const fontSize = 30;
    const textHeight = fontSize * 1.2; // 36px
    const strokeWidth = 4;
    const dPerp = calculateEdgeLabelDisplacement(textHeight, strokeWidth, 30);
    // dPerp = 36/2 + 4/2 + 30 = 18 + 2 + 30 = 50px
    assert.strictEqual(dPerp, 50, 'Perpendicular displacement must equal H/2 + strokeWidth/2 + 30px = 50px');
    totalAssertions += 1;

    // B. Horizontal edge normal vector and positioning
    const p1 = { x: 100, y: 500 };
    const p2 = { x: 500, y: 500 };
    const normalHoriz = calculateUnitNormal(p1, p2);
    // Unit normal to horizontal line pointing right is (0, 1) or (0, -1)
    assert.strictEqual(normalHoriz.x, 0, 'Normal x to horizontal line must be 0');
    assert.strictEqual(Math.abs(normalHoriz.y), 1, 'Normal y to horizontal line must be 1');

    const labelPos = computeEdgeLabelPosition(p1, p2, dPerp, -1);
    assert.strictEqual(labelPos.x, 300, 'Label X must be at midpoint 300px');
    assert.strictEqual(labelPos.y, 500 - 50, 'Label Y must be displaced by 50px upwards');

    // Verify distance from text box to edge segment
    const labelBounds = estimateTextBounds('beta = 0.42', 30, labelPos.x, labelPos.y, 'middle', false);
    const distToSeg = distanceBoxToSegment(labelBounds, p1, p2);
    assert.ok(distToSeg >= 30, `Distance from text to edge (${distToSeg.toFixed(1)}px) must be >= 30px`);
    totalAssertions += 5;

    // C. Collision when displacement is 0 (Observation 1.2 & 1.3 defect)
    const collidingLabelBounds = estimateTextBounds('beta = 0.42', 30, 300, 500, 'middle', false);
    const distColliding = distanceBoxToSegment(collidingLabelBounds, p1, p2);
    assert.strictEqual(distColliding, 0, 'Direct superimposition must yield distance 0px (collision)');
    totalAssertions += 1;
  }
  console.log('    ✓ INV-GEO-05: Edge label normal displacement passed.');

  // =========================================================================
  // GATE 6: Stage Budget 4 Zones (INV-GEO-06)
  // =========================================================================
  console.log('  [Gate 6] Verifying INV-GEO-06: Stage Budget 4 Zones...');
  {
    // A. Verify Stage Budget Zones definitions
    assert.strictEqual(STAGE_BUDGET_ZONES.NOTCH_MARGIN.yMax, 80, 'Notch margin ends at y=80');
    assert.strictEqual(STAGE_BUDGET_ZONES.HUD.yMin, 80, 'HUD starts at y=80');
    assert.strictEqual(STAGE_BUDGET_ZONES.HUD.yMax, 220, 'HUD ends at y=220');
    assert.strictEqual(STAGE_BUDGET_ZONES.MAIN_STAGE.yMin, 220, 'Main stage starts at y=220');
    assert.strictEqual(STAGE_BUDGET_ZONES.MAIN_STAGE.yMax, 1420, 'Main stage ends at y=1420');
    assert.strictEqual(STAGE_BUDGET_ZONES.MAIN_STAGE.maxWidth, 920, 'Main stage max width is 920px');
    assert.strictEqual(STAGE_BUDGET_ZONES.SUBTITLE_SAFE_ZONE.yMin, 1420, 'Subtitle safe zone starts at y=1420');
    assert.strictEqual(STAGE_BUDGET_ZONES.SUBTITLE_SAFE_ZONE.yMax, 1720, 'Subtitle safe zone ends at y=1720');
    assert.strictEqual(STAGE_BUDGET_ZONES.OS_NAV_MARGIN.yMin, 1720, 'OS margin starts at y=1720');
    assert.strictEqual(STAGE_BUDGET_ZONES.OS_NAV_MARGIN.yMax, 1920, 'OS margin ends at y=1920');
    totalAssertions += 10;

    // B. Zone Evaluation checks
    const notchCheck = evaluateStageZone(40);
    assert.strictEqual(notchCheck.zone, 'NOTCH_MARGIN');
    assert.strictEqual(notchCheck.isNotchTrespass, true);

    const hudCheck = evaluateStageZone(150);
    assert.strictEqual(hudCheck.zone, 'HUD');
    assert.strictEqual(hudCheck.isMainStage, false);

    const stageCheck = evaluateStageZone(800);
    assert.strictEqual(stageCheck.zone, 'MAIN_STAGE');
    assert.strictEqual(stageCheck.isMainStage, true);
    assert.strictEqual(stageCheck.isSubtitleTrespass, false);

    const subCheck = evaluateStageZone(1550);
    assert.strictEqual(subCheck.zone, 'SUBTITLE_SAFE_ZONE');
    assert.strictEqual(subCheck.isSubtitleTrespass, true);

    const osCheck = evaluateStageZone(1800);
    assert.strictEqual(osCheck.zone, 'OS_NAV_MARGIN');
    assert.strictEqual(osCheck.isOsTrespass, true);
    totalAssertions += 9;
  }
  console.log('    ✓ INV-GEO-06: Stage budget zones passed.');

  // =========================================================================
  // GATE 7: Deliberate Collision Fixtures (Rejection) vs Clean Fixtures (INV-GEO-07)
  // =========================================================================
  console.log('  [Gate 7] Verifying INV-GEO-07: Deliberate Collision Rejection & Clean Acceptance...');
  {
    // A. Deliberate Bad Fixture 1: Text-in-Box Overflow (Observation 1.1 / 1.4)
    const badFixture1 = `
      import React from 'react';
      export const BadCard = () => (
        <g transform="translate(540, 400)">
          <rect x={-100} y={0} width={200} height={50} fill="#0F172A" />
          <text x={0} y={35} fontSize={30} textAnchor="middle">
            DAY LA MOT DOAN VAN BAN RAT DAI OVERFLOW
          </text>
        </g>
      );
    `;
    const res1 = lintLayoutGeometryCode(badFixture1, 'bad-card.tsx');
    assert.strictEqual(res1.length > 0, true, 'Bad fixture 1 must produce violations');
    const hasOverflow = res1.some((v) => v.rule === 'text-container-overflow');
    assert.strictEqual(hasOverflow, true, 'Bad fixture 1 must trigger text-container-overflow');
    totalAssertions += 2;

    // B. Deliberate Bad Fixture 2: Text-Vector Direct Collision (Observation 1.2 / 1.3)
    const badFixture2 = `
      import React from 'react';
      export const BadVectorCollision = () => (
        <g transform="translate(300, 500)">
          <path d="M 0 -200 L 0 200" stroke="#EF4444" strokeWidth={5} />
          <text x={0} y={0} fontSize={30} textAnchor="middle">
            Ro Ri Vao Trong
          </text>
        </g>
      );
    `;
    const res2 = lintLayoutGeometryCode(badFixture2, 'bad-vector.tsx');
    assert.strictEqual(res2.length > 0, true, 'Bad fixture 2 must produce violations');
    const hasVectorCol = res2.some((v) => v.rule === 'text-vector-collision');
    assert.strictEqual(hasVectorCol, true, 'Bad fixture 2 must trigger text-vector-collision');
    totalAssertions += 2;

    // C. Deliberate Bad Fixture 3: Overlapping Sibling Containers (Observation 1.7)
    const badFixture3 = `
      import React from 'react';
      export const BadSiblingOverlap = () => (
        <div style={{ position: 'relative', width: 1080, height: 1920 }}>
          <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
            <p style={{ fontSize: 34 }}>Beat 1 Content</p>
          </div>
          <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
            <p style={{ fontSize: 34 }}>Beat 2 Content</p>
          </div>
        </div>
      );
    `;
    const res3 = lintLayoutGeometryCode(badFixture3, 'bad-sibling.tsx');
    assert.strictEqual(res3.length > 0, true, 'Bad fixture 3 must produce violations');
    const hasSiblingOverlap = res3.some((v) => v.rule === 'bounding-box-overlap');
    assert.strictEqual(hasSiblingOverlap, true, 'Bad fixture 3 must trigger bounding-box-overlap');
    totalAssertions += 2;

    // D. Deliberate Bad Fixture 4: Stage Zone Trespass (Subtitle zone collision)
    const badFixture4 = `
      import React from 'react';
      export const BadStageZone = () => (
        <g transform="translate(540, 1550)">
          <rect x={-300} y={0} width={600} height={100} fill="#38BDF8" />
          <text x={0} y={60} fontSize={34} textAnchor="middle">
            Primary Mechanism in Subtitle Zone
          </text>
        </g>
      );
    `;
    const res4 = lintLayoutGeometryCode(badFixture4, 'bad-stage-zone.tsx');
    assert.strictEqual(res4.length > 0, true, 'Bad fixture 4 must produce violations');
    const hasZoneViolation = res4.some((v) => v.rule === 'stage-zone-violation');
    assert.strictEqual(hasZoneViolation, true, 'Bad fixture 4 must trigger stage-zone-violation');
    totalAssertions += 2;

    // E. Clean Fixture 1: Proper Text-in-Box Clearance (Margin >= 30px)
    const cleanFixture1 = `
      import React from 'react';
      export const CleanCard = () => (
        <g transform="translate(540, 500)">
          <rect x={-400} y={0} width={800} height={160} rx={16} fill="#0F172A" />
          <text x={0} y={60} fontSize={32} textAnchor="middle">
            TIEU DE CHUAN
          </text>
        </g>
      );
    `;
    const cleanRes1 = lintLayoutGeometryCode(cleanFixture1, 'clean-card.tsx');
    assert.strictEqual(cleanRes1.length, 0, `Clean fixture 1 must have 0 violations (got: ${JSON.stringify(cleanRes1)})`);
    totalAssertions += 1;

    // F. Clean Fixture 2: Text Displaced from Vector Path (Distance >= 30px)
    const cleanFixture2 = `
      import React from 'react';
      export const CleanVectorSeparation = () => (
        <g transform="translate(300, 500)">
          <path d="M 0 -200 L 0 200" stroke="#EF4444" strokeWidth={5} />
          <text x={60} y={0} fontSize={30} textAnchor="start">
            Ro Ri Vao Trong (Displaced)
          </text>
        </g>
      );
    `;
    const cleanRes2 = lintLayoutGeometryCode(cleanFixture2, 'clean-vector.tsx');
    assert.strictEqual(cleanRes2.length, 0, `Clean fixture 2 must have 0 violations (got: ${JSON.stringify(cleanRes2)})`);
    totalAssertions += 1;

    // G. Clean Fixture 3: Mutually Exclusive Sibling Containers (Gated by Phase)
    const cleanFixture3 = `
      import React from 'react';
      export const CleanGatedSiblings = ({ phase }: { phase: number }) => (
        <div style={{ position: 'relative', width: 1080, height: 1920 }}>
          {phase === 1 && (
            <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
              <p style={{ fontSize: 34 }}>Phase 1 Content</p>
            </div>
          )}
          {phase === 2 && (
            <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
              <p style={{ fontSize: 34 }}>Phase 2 Content</p>
            </div>
          )}
        </div>
      );
    `;
    const cleanRes3 = lintLayoutGeometryCode(cleanFixture3, 'clean-gated.tsx');
    assert.strictEqual(cleanRes3.length, 0, `Clean fixture 3 must have 0 violations (got: ${JSON.stringify(cleanRes3)})`);
    totalAssertions += 1;

    // H. Clean Fixture 4: Stage Zone Compliant (y in Zone 2 [220, 1420])
    const cleanFixture4 = `
      import React from 'react';
      export const CleanStageZone = () => (
        <g transform="translate(540, 600)">
          <rect x={-400} y={0} width={800} height={200} fill="#0F172A" />
          <text x={0} y={70} fontSize={34} textAnchor="middle">
            Primary Mechanism inside Zone 2
          </text>
        </g>
      );
    `;
    const cleanRes4 = lintLayoutGeometryCode(cleanFixture4, 'clean-stage.tsx');
    assert.strictEqual(cleanRes4.length, 0, `Clean fixture 4 must have 0 violations (got: ${JSON.stringify(cleanRes4)})`);
    totalAssertions += 1;
  }
  console.log('    ✓ INV-GEO-07: Deliberate collision rejection & clean acceptance passed.');

  console.log('\n======================================================================');
  console.log(`✅ ALL 7 INVARIANT GATES PASSED CLEANLY (${totalAssertions} assertions verified)`);
  console.log('   Layout Geometry & Zero-Collision Clearance Architecture: CERTIFIED');
  console.log('======================================================================\n');
}

const isDirectRun =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? process.argv[1].endsWith('layout-geometry-clearance.test.ts')
    : false;

if (isDirectRun) {
  try {
    runLayoutGeometryInvariantTests();
    process.exit(0);
  } catch (err) {
    console.error('❌ INVARIANT TEST SUITE FAILED:', err);
    process.exit(1);
  }
}
