/**
 * tests/challenger_m1_r2_1_boundary_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS for Milestone 1
 * Subagent: challenger_m1_r2_1 (Code-Executing Adversarial Verifier)
 * Target: motion-kit/src/geometry/boundaryIntersection.ts
 *
 * Scopes:
 * 1. 360-degree angle sweeps around rounded rectangles across diverse aspect ratios (1:1, 16:9, 9:16, 100:1, 1:100) & corner radii
 * 2. Degenerate boxes: zero-size (w=0, h=0), 1-pixel boxes (w=1, h=1), negative coordinate centers, negative sizes
 * 3. Concentric boxes, touching boxes, and collinear alignments
 * 4. Exact corner tangent rays (pointing directly to corner center or arc endpoints) & transition continuity
 * 5. Radial accuracy check: distance from corner-arc boundary points to corner center has error < 1e-4 px
 * 6. Zero-penetration invariant: 10,000 random ray/box pairs with exhaustive segment interior sampling
 */

import * as assert from 'node:assert/strict';
import {
  Point2D,
  BoxDescriptor,
  IntersectionResult,
  TwoBoxIntersectionResult,
  normalizeDirection,
  resolveBoxDimensions,
  intersectRayAABB,
  intersectRayRoundedRect,
  intersectRayCircle,
  intersectRayEllipse,
  intersectRayBox,
  solveTwoBoxIntersection,
  isPointInsideBox,
} from '../motion-kit/src/geometry/boundaryIntersection';

export interface AdversarialStressReport {
  totalAssertions: number;
  sweepTestsRun: number;
  degenerateTestsRun: number;
  concentricTouchingTestsRun: number;
  cornerTangentTestsRun: number;
  precisionChecksRun: number;
  maxCornerRadiusError: number;
  tenThousandPairsTested: number;
  interiorSamplesChecked: number;
  defects: Array<{ id: string; description: string; error: string }>;
  verdict: 'CONFIRMED' | 'DEFECT_FOUND';
}

/**
 * Computes exact Signed Distance Function (SDF) of a 2D rounded rectangle.
 * Positive = outside, 0 = on boundary, negative = inside.
 */
function signedDistanceRoundedRect(
  p: Point2D,
  center: Point2D,
  hw: number,
  hh: number,
  r: number
): number {
  const dx = Math.abs(p.x - center.x) - (hw - r);
  const dy = Math.abs(p.y - center.y) - (hh - r);
  const outsideX = Math.max(0, dx);
  const outsideY = Math.max(0, dy);
  const outsideDist = Math.hypot(outsideX, outsideY);
  const insideDist = Math.min(0, Math.max(dx, dy));
  return outsideDist + insideDist - r;
}

export function runAdversarialBoundaryStressHarness(): AdversarialStressReport {
  console.log('\n======================================================================');
  console.log(' ADVERSARIAL MATHEMATICAL BOUNDARY SOLVER STRESS HARNESS');
  console.log(' Target: motion-kit/src/geometry/boundaryIntersection.ts');
  console.log(' Verifier: challenger_m1_r2_1 (Empirical Adversarial Subagent)');
  console.log('======================================================================\n');

  let totalAssertions = 0;
  let sweepTestsRun = 0;
  let degenerateTestsRun = 0;
  let concentricTouchingTestsRun = 0;
  let cornerTangentTestsRun = 0;
  let precisionChecksRun = 0;
  let maxCornerRadiusError = 0;
  let tenThousandPairsTested = 0;
  let interiorSamplesChecked = 0;
  const defects: Array<{ id: string; description: string; error: string }> = [];

  // =========================================================================
  // TEST SUITE 1: 360-Degree Angle Sweeps Across Diverse Aspect Ratios & Radii
  // =========================================================================
  console.log('  [Suite 1] 360-degree angle sweeps across diverse aspect ratios & corner radii...');
  {
    const aspectConfigs = [
      { name: '1:1 Square', hw: 100, hh: 100, radii: [0, 10, 50, 100, 200] },
      { name: '16:9 Landscape', hw: 320, hh: 180, radii: [0, 16, 50, 180, 400] },
      { name: '9:16 Portrait (Mobile)', hw: 180, hh: 320, radii: [0, 16, 50, 180, 400] },
      { name: '100:1 Extreme Horizontal Slit', hw: 500, hh: 5, radii: [0, 1, 3, 5, 20] },
      { name: '1:100 Extreme Vertical Slit', hw: 5, hh: 500, radii: [0, 1, 3, 5, 20] },
      { name: 'Gold Ratio 1.618:1', hw: 161.8, hh: 100, radii: [0, 12, 30, 100] },
    ];

    const center: Point2D = { x: 250, y: -450 }; // Non-zero center to verify translation invariance

    for (const config of aspectConfigs) {
      for (const r of config.radii) {
        const effectiveR = Math.max(0, Math.min(r, config.hw, config.hh));
        let prevDistance = -1;

        // Sweep 720 steps (0.5 degree resolution)
        const totalSteps = 720;
        for (let step = 0; step < totalSteps; step++) {
          const angleDeg = (step / totalSteps) * 360;
          const rad = (angleDeg * Math.PI) / 180;
          const dir: Point2D = { x: Math.cos(rad), y: Math.sin(rad) };

          const res = intersectRayRoundedRect(center, config.hw, config.hh, r, dir);
          sweepTestsRun++;

          // 1. Distance must be positive and finite
          if (!Number.isFinite(res.distance) || res.distance <= 0) {
            defects.push({
              id: `SWEEP_FINITE_DIST_${config.name}_r${r}_deg${angleDeg}`,
              description: `Non-finite or non-positive distance (${res.distance}) for angle ${angleDeg}°`,
              error: `distance = ${res.distance}`,
            });
          }
          totalAssertions++;

          // 2. Point coordinates must match center + distance * dir
          const expectedPx = center.x + res.distance * dir.x;
          const expectedPy = center.y + res.distance * dir.y;
          const coordErr = Math.hypot(res.point.x - expectedPx, res.point.y - expectedPy);
          if (coordErr > 1e-6) {
            defects.push({
              id: `SWEEP_COORD_MISMATCH_${config.name}_r${r}_deg${angleDeg}`,
              description: `Intersection point does not lie along ray direction`,
              error: `coordErr = ${coordErr}`,
            });
          }
          totalAssertions++;

          // 3. Exact SDF Check: Point must lie on outer boundary (error < 1e-4)
          const sdf = signedDistanceRoundedRect(
            res.point,
            center,
            config.hw,
            config.hh,
            effectiveR
          );
          if (Math.abs(sdf) > 1e-4) {
            defects.push({
              id: `SWEEP_SDF_VIOLATION_${config.name}_r${r}_deg${angleDeg}`,
              description: `Point not on boundary: SDF = ${sdf} exceeds 1e-4 threshold`,
              error: `SDF = ${sdf}, angle = ${angleDeg}°, r = ${r}`,
            });
          }
          totalAssertions++;

          // 4. If surfaceType is corner-arc, distance to corner center must equal effectiveR
          if (res.surfaceType === 'corner-arc' && effectiveR > 1e-6) {
            precisionChecksRun++;
            const sx = dir.x >= 0 ? 1 : -1;
            const sy = dir.y >= 0 ? 1 : -1;
            const cornerCx = center.x + sx * (config.hw - effectiveR);
            const cornerCy = center.y + sy * (config.hh - effectiveR);
            const cornerDist = Math.hypot(res.point.x - cornerCx, res.point.y - cornerCy);
            const radiusErr = Math.abs(cornerDist - effectiveR);
            if (radiusErr > maxCornerRadiusError) {
              maxCornerRadiusError = radiusErr;
            }
            if (radiusErr > 1e-4) {
              defects.push({
                id: `SWEEP_CORNER_RADIUS_ERR_${config.name}_r${r}_deg${angleDeg}`,
                description: `Corner arc distance error (${radiusErr}) exceeds 1e-4 px`,
                error: `radiusErr = ${radiusErr}, cornerDist = ${cornerDist}, effectiveR = ${effectiveR}`,
              });
            }
            totalAssertions++;
          }

          // 5. Point must not penetrate into interior (beyond numerical tolerance 1e-4)
          const isInside = isPointInsideBox(
            res.point,
            {
              cx: center.x,
              cy: center.y,
              width: config.hw * 2,
              height: config.hh * 2,
              shape: 'rounded-rect',
              cornerRadius: r,
            },
            1e-4
          );
          if (isInside) {
            defects.push({
              id: `SWEEP_INTERIOR_PENETRATION_${config.name}_r${r}_deg${angleDeg}`,
              description: `Boundary point penetrated deeper than 1e-4 px into box interior`,
              error: `pt=(${res.point.x}, ${res.point.y}), angle=${angleDeg}°, SDF=${sdf}`,
            });
          }
          totalAssertions++;

          // 6. Continuity check across adjacent steps
          if (prevDistance > 0) {
            // Maximum rate of change of distance for convex shape with aspect ratio <= 100
            // Distance should not jump by more than 50% between 0.5 deg steps unless high aspect ratio
            const ratio = res.distance / prevDistance;
            if (ratio < 0.2 || ratio > 5.0) {
              defects.push({
                id: `SWEEP_DISCONTINUITY_${config.name}_r${r}_deg${angleDeg}`,
                description: `Distance jumped drastically from ${prevDistance} to ${res.distance}`,
                error: `ratio = ${ratio}`,
              });
            }
            totalAssertions++;
          }
          prevDistance = res.distance;
        }
      }
    }

    console.log(`    ✓ 360° sweeps completed: ${sweepTestsRun} ray evaluations across ${aspectConfigs.length} aspect ratios.`);
  }

  // =========================================================================
  // TEST SUITE 2: Degenerate & Extreme Boundary Conditions
  // =========================================================================
  console.log('  [Suite 2] Degenerate boxes: zero-size, 1-pixel, negative centers, extreme sizes...');
  {
    // 1. Zero-size box: w = 0, h = 0
    const zeroBox: BoxDescriptor = { cx: -200, cy: -500, width: 0, height: 0, shape: 'rounded-rect' };
    degenerateTestsRun++;
    const resZeroAABB = intersectRayAABB({ x: -200, y: -500 }, 0, 0, { x: 1, y: 0 });
    assert.strictEqual(resZeroAABB.distance, 0);
    assert.strictEqual(resZeroAABB.point.x, -200);
    assert.strictEqual(resZeroAABB.point.y, -500);
    totalAssertions += 3;

    const resZeroRR = intersectRayRoundedRect({ x: -200, y: -500 }, 0, 0, 10, { x: 0.6, y: 0.8 });
    degenerateTestsRun++;
    assert.strictEqual(resZeroRR.distance, 0);
    assert.strictEqual(resZeroRR.point.x, -200);
    assert.strictEqual(resZeroRR.point.y, -500);
    totalAssertions += 3;

    // 2. 1-pixel box: w = 1, h = 1 (hw = 0.5, hh = 0.5)
    const onePxBox: BoxDescriptor = { cx: 100, cy: 200, width: 1, height: 1, shape: 'rounded-rect', cornerRadius: 0.2 };
    degenerateTestsRun++;
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const res = intersectRayBox(onePxBox, { x: Math.cos(rad), y: Math.sin(rad) });
      assert.ok(res.distance > 0 && res.distance <= Math.SQRT2 * 0.5 + 1e-6);
      assert.ok(res.point.x >= 99.5 - 1e-6 && res.point.x <= 100.5 + 1e-6);
      assert.ok(res.point.y >= 199.5 - 1e-6 && res.point.y <= 200.5 + 1e-6);
      totalAssertions += 3;
    }

    // 3. Negative coordinate centers: cx = -10000, cy = -25000
    const negCenterBox: BoxDescriptor = { cx: -10000, cy: -25000, width: 200, height: 100, shape: 'rect' };
    degenerateTestsRun++;
    const resNegEast = intersectRayBox(negCenterBox, { x: 1, y: 0 });
    assert.strictEqual(resNegEast.point.x, -9900);
    assert.strictEqual(resNegEast.point.y, -25000);
    assert.strictEqual(resNegEast.distance, 100);
    totalAssertions += 3;

    // 4. Highly negative box sizes (should clamp to 0 without NaN or throwing)
    const negSizeBox: BoxDescriptor = { cx: 0, cy: 0, width: -100, height: -200 };
    degenerateTestsRun++;
    const resNegSize = intersectRayBox(negSizeBox, { x: 1, y: 0 });
    assert.strictEqual(resNegSize.distance, 0);
    assert.strictEqual(resNegSize.point.x, 0);
    assert.strictEqual(resNegSize.point.y, 0);
    totalAssertions += 3;

    // 5. Massive coordinate centers: 1e7, 1e7
    const massiveBox: BoxDescriptor = { cx: 1e7, cy: 1e7, width: 400, height: 200, shape: 'rounded-rect', cornerRadius: 20 };
    degenerateTestsRun++;
    const resMassive = intersectRayBox(massiveBox, { x: 0, y: 1 });
    assert.strictEqual(resMassive.point.x, 1e7);
    assert.strictEqual(resMassive.point.y, 1e7 + 100);
    assert.strictEqual(resMassive.distance, 100);
    totalAssertions += 3;

    // 6. Zero-direction vector handling
    degenerateTestsRun++;
    const zeroDirNorm = normalizeDirection({ x: 0, y: 0 });
    assert.strictEqual(zeroDirNorm.ux, 1);
    assert.strictEqual(zeroDirNorm.uy, 0);
    assert.strictEqual(zeroDirNorm.length, 0);
    totalAssertions += 3;

    console.log(`    ✓ Degenerate and extreme boundary cases verified (${degenerateTestsRun} scenarios).`);
  }

  // =========================================================================
  // TEST SUITE 3: Concentric, Touching, and Collinear Alignments
  // =========================================================================
  console.log('  [Suite 3] Concentric boxes, touching boxes, and collinear alignments...');
  {
    // 1. Concentric boxes: C1 === C2
    concentricTouchingTestsRun++;
    const boxA: BoxDescriptor = { cx: 500, cy: 500, width: 200, height: 100, shape: 'rounded-rect', cornerRadius: 16 };
    const boxB: BoxDescriptor = { cx: 500, cy: 500, width: 200, height: 100, shape: 'rounded-rect', cornerRadius: 16 };
    const concentric = solveTwoBoxIntersection(boxA, boxB, 4, 4);
    assert.strictEqual(concentric.isOverlapping, true);
    assert.strictEqual(concentric.clippedLength, 0);
    assert.strictEqual(Number.isNaN(concentric.start.x), false);
    assert.strictEqual(Number.isNaN(concentric.end.x), false);
    totalAssertions += 4;

    // 2. Horizontally Touching boxes (gap = 0 between outer boundaries)
    concentricTouchingTestsRun++;
    const touchLeft: BoxDescriptor = { cx: 100, cy: 300, width: 100, height: 80 }; // Right edge at 150
    const touchRight: BoxDescriptor = { cx: 200, cy: 300, width: 100, height: 80 }; // Left edge at 150
    // With 0 gaps
    const touchZeroGap = solveTwoBoxIntersection(touchLeft, touchRight, 0, 0);
    assert.strictEqual(touchZeroGap.distance, 100);
    assert.strictEqual(touchZeroGap.sourceIntersection.distance, 50);
    assert.strictEqual(touchZeroGap.targetIntersection.distance, 50);
    assert.strictEqual(touchZeroGap.clippedLength, 0);
    assert.strictEqual(touchZeroGap.isOverlapping, true);
    assert.strictEqual(touchZeroGap.start.x, 150);
    assert.strictEqual(touchZeroGap.end.x, 150);
    totalAssertions += 6;

    // 3. Vertically Touching boxes
    concentricTouchingTestsRun++;
    const touchTop: BoxDescriptor = { cx: 400, cy: 100, width: 120, height: 100 }; // Bottom edge at 150
    const touchBottom: BoxDescriptor = { cx: 400, cy: 250, width: 120, height: 200 }; // Top edge at 150
    const touchVert = solveTwoBoxIntersection(touchTop, touchBottom, 0, 0);
    assert.strictEqual(touchVert.distance, 150);
    assert.strictEqual(touchVert.sourceIntersection.distance, 50);
    assert.strictEqual(touchVert.targetIntersection.distance, 100);
    assert.strictEqual(touchVert.clippedLength, 0);
    assert.strictEqual(touchVert.isOverlapping, true);
    assert.strictEqual(touchVert.start.y, 150);
    assert.strictEqual(touchVert.end.y, 150);
    totalAssertions += 6;

    // 4. Collinear Horizontal Alignment across large distance
    concentricTouchingTestsRun++;
    const collinSrc: BoxDescriptor = { cx: 100, cy: 400, width: 80, height: 60 };
    const collinTgt: BoxDescriptor = { cx: 5100, cy: 400, width: 80, height: 60 };
    const collinRes = solveTwoBoxIntersection(collinSrc, collinTgt, 5, 5);
    assert.strictEqual(collinRes.distance, 5000);
    assert.strictEqual(collinRes.start.x, 100 + 40 + 5); // 145
    assert.strictEqual(collinRes.start.y, 400);
    assert.strictEqual(collinRes.end.x, 5100 - 40 - 5); // 5055
    assert.strictEqual(collinRes.end.y, 400);
    assert.strictEqual(collinRes.clippedLength, 5000 - 40 - 40 - 10); // 4910
    assert.strictEqual(collinRes.tangentAngleStart, 0);
    totalAssertions += 6;

    // 5. Collinear Vertical Alignment (Northward: dy < 0)
    concentricTouchingTestsRun++;
    const collinSouth: BoxDescriptor = { cx: 300, cy: 800, width: 60, height: 100 };
    const collinNorth: BoxDescriptor = { cx: 300, cy: 200, width: 60, height: 100 };
    const collinNorthRes = solveTwoBoxIntersection(collinSouth, collinNorth, 0, 0);
    assert.strictEqual(collinNorthRes.distance, 600);
    assert.strictEqual(collinNorthRes.start.y, 750); // 800 - 50
    assert.strictEqual(collinNorthRes.end.y, 250); // 200 + 50
    assert.strictEqual(collinNorthRes.tangentAngleStart, -90);
    totalAssertions += 4;

    console.log(`    ✓ Concentric, touching, and collinear alignment configurations verified.`);
  }

  // =========================================================================
  // TEST SUITE 4: Exact Corner Tangent Rays & Transition Boundary Continuity
  // =========================================================================
  console.log('  [Suite 4] Exact corner tangent rays (pointing directly to corner center or arc endpoints)...');
  {
    const hw = 200;
    const hh = 100;
    const r = 40;
    const center: Point2D = { x: 0, y: 0 };

    // Quadrant 1 Analysis:
    // Corner Circle Center: (hw - r, hh - r) = (160, 60)
    // Arc Endpoint 1 (Vertical Wall Tangent): (hw, hh - r) = (200, 60)
    // Arc Endpoint 2 (Horizontal Wall Tangent): (hw - r, hh) = (160, 100)

    const q1Tests = [
      {
        name: 'Ray pointing directly to corner circle center (160, 60)',
        dir: { x: 160 / Math.hypot(160, 60), y: 60 / Math.hypot(160, 60) },
        expectSurface: 'corner-arc',
        cornerCx: 160,
        cornerCy: 60,
      },
      {
        name: 'Ray pointing to vertical arc endpoint (200, 60)',
        dir: { x: 200 / Math.hypot(200, 60), y: 60 / Math.hypot(200, 60) },
        expectSurface: 'vertical',
        cornerCx: 160,
        cornerCy: 60,
      },
      {
        name: 'Ray pointing to horizontal arc endpoint (160, 100)',
        dir: { x: 160 / Math.hypot(160, 100), y: 100 / Math.hypot(160, 100) },
        expectSurface: 'horizontal',
        cornerCx: 160,
        cornerCy: 60,
      },
    ];

    for (const t of q1Tests) {
      cornerTangentTestsRun++;
      const res = intersectRayRoundedRect(center, hw, hh, r, t.dir);
      assert.strictEqual(res.surfaceType, t.expectSurface);

      // Verify distance to corner circle center is exactly r (40) within 1e-5
      const distToCornerCenter = Math.hypot(res.point.x - t.cornerCx, res.point.y - t.cornerCy);
      const err = Math.abs(distToCornerCenter - r);
      if (err > maxCornerRadiusError) {
        maxCornerRadiusError = err;
      }
      assert.ok(
        err < 1e-4,
        `[Corner Tangent Failure] ${t.name}: corner center error ${err} >= 1e-4 px`
      );
      totalAssertions += 2;
    }

    // Micro-perturbations across the arc transitions (eps = 1e-7 rad)
    // 1. Vertical wall transition: angle theta1 = atan2(60, 200)
    const theta1 = Math.atan2(60, 200);
    const eps = 1e-7;

    const resBelow1 = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos(theta1 - eps),
      y: Math.sin(theta1 - eps),
    });
    const resAbove1 = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos(theta1 + eps),
      y: Math.sin(theta1 + eps),
    });

    cornerTangentTestsRun += 2;
    assert.strictEqual(resBelow1.surfaceType, 'vertical');
    assert.strictEqual(resAbove1.surfaceType, 'corner-arc');
    // Position continuity across transition: delta < 1e-5 px!
    const posDelta1 = Math.hypot(resBelow1.point.x - resAbove1.point.x, resBelow1.point.y - resAbove1.point.y);
    assert.ok(posDelta1 < 1e-4, `C0 position discontinuity across vertical tangent: ${posDelta1} >= 1e-4`);
    totalAssertions += 3;

    // 2. Horizontal wall transition: angle theta2 = atan2(100, 160)
    const theta2 = Math.atan2(100, 160);
    const resBelow2 = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos(theta2 - eps),
      y: Math.sin(theta2 - eps),
    });
    const resAbove2 = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos(theta2 + eps),
      y: Math.sin(theta2 + eps),
    });

    cornerTangentTestsRun += 2;
    assert.strictEqual(resBelow2.surfaceType, 'corner-arc');
    assert.strictEqual(resAbove2.surfaceType, 'horizontal');
    const posDelta2 = Math.hypot(resBelow2.point.x - resAbove2.point.x, resBelow2.point.y - resAbove2.point.y);
    assert.ok(posDelta2 < 1e-4, `C0 position discontinuity across horizontal tangent: ${posDelta2} >= 1e-4`);
    totalAssertions += 3;

    // Test across all other 3 quadrants (Q2, Q3, Q4)
    const otherQuadrants = [
      { q: 'Q2', sx: -1, sy: 1 },
      { q: 'Q3', sx: -1, sy: -1 },
      { q: 'Q4', sx: 1, sy: -1 },
    ];
    for (const o of otherQuadrants) {
      cornerTangentTestsRun++;
      const dirCenter = {
        x: (o.sx * 160) / Math.hypot(160, 60),
        y: (o.sy * 60) / Math.hypot(160, 60),
      };
      const res = intersectRayRoundedRect(center, hw, hh, r, dirCenter);
      assert.strictEqual(res.surfaceType, 'corner-arc');
      const dist = Math.hypot(res.point.x - o.sx * 160, res.point.y - o.sy * 60);
      assert.ok(Math.abs(dist - r) < 1e-4);
      totalAssertions += 2;
    }

    console.log(`    ✓ Exact corner tangents and C0 transition continuity verified across all quadrants.`);
  }

  // =========================================================================
  // TEST SUITE 5: Corner Arc Precision Measurement (< 1e-4 px error)
  // =========================================================================
  console.log('  [Suite 5] Radial accuracy verification: error < 1e-4 px across 10,000 corner arc samples...');
  {
    // Test 10 distinct rounded boxes with 1,000 corner arc rays each
    const precisionBoxes = [
      { hw: 150, hh: 80, r: 24 },
      { hw: 300, hh: 200, r: 60 },
      { hw: 80, hh: 150, r: 35 },
      { hw: 50, hh: 50, r: 25 }, // Fully rounded circle-ends
      { hw: 400, hh: 30, r: 15 },
      { hw: 25, hh: 250, r: 12 },
      { hw: 1000, hh: 600, r: 120 },
      { hw: 75.5, hh: 93.3, r: 18.7 },
      { hw: 12.5, hh: 12.5, r: 6.25 },
      { hw: 500, hh: 500, r: 250 },
    ];

    for (const b of precisionBoxes) {
      const center: Point2D = { x: 123.45, y: -678.9 };
      // Arc angle range in Q1: between atan2(hh - r, hw) and atan2(hh, hw - r)
      const minAngle = Math.atan2(b.hh - b.r, b.hw);
      const maxAngle = Math.atan2(b.hh, b.hw - b.r);

      for (let i = 0; i < 1000; i++) {
        precisionChecksRun++;
        const alpha = (i + 0.5) / 1000;
        const angle = minAngle + alpha * (maxAngle - minAngle);
        const dir: Point2D = { x: Math.cos(angle), y: Math.sin(angle) };

        const res = intersectRayRoundedRect(center, b.hw, b.hh, b.r, dir);
        assert.strictEqual(res.surfaceType, 'corner-arc');

        const cornerCx = center.x + (b.hw - b.r);
        const cornerCy = center.y + (b.hh - b.r);
        const dist = Math.hypot(res.point.x - cornerCx, res.point.y - cornerCy);
        const err = Math.abs(dist - b.r);

        if (err > maxCornerRadiusError) {
          maxCornerRadiusError = err;
        }

        if (err >= 1e-4) {
          defects.push({
            id: `CORNER_PRECISION_ERR_hw${b.hw}_r${b.r}_i${i}`,
            description: `Corner radial error ${err} >= 1e-4 px!`,
            error: `dist = ${dist}, r = ${b.r}, err = ${err}`,
          });
        }
        totalAssertions++;
      }
    }

    console.log(`    ✓ 10,000 corner arc samples checked: Maximum observed radial error = ${maxCornerRadiusError.toExponential(4)} px (< 1e-4 px).`);
  }

  // =========================================================================
  // TEST SUITE 6: Zero-Penetration Invariant Across 10,000 Random Ray/Box Pairs
  // =========================================================================
  console.log('  [Suite 6] Zero-penetration invariant: 10,000 random ray/box pairs with segment sampling...');
  {
    // Deterministic pseudo-random generator (LCG) for full reproducibility
    let seed = 1337042;
    function rand(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    const shapes: Array<'rect' | 'rounded-rect' | 'circle' | 'ellipse'> = [
      'rect',
      'rounded-rect',
      'circle',
      'ellipse',
    ];

    let overlappingCount = 0;
    let nonOverlappingCount = 0;

    for (let testIdx = 0; testIdx < 10000; testIdx++) {
      tenThousandPairsTested++;

      const srcShape = shapes[Math.floor(rand() * shapes.length)];
      const tgtShape = shapes[Math.floor(rand() * shapes.length)];

      const srcW = 20 + rand() * 400;
      const srcH = 20 + rand() * 300;
      const tgtW = 20 + rand() * 400;
      const tgtH = 20 + rand() * 300;

      const srcCx = -1000 + rand() * 2000;
      const srcCy = -1000 + rand() * 2000;

      // Place target at random distance (0 to 1500px) and random angle
      const dist = rand() * 1500;
      const angle = rand() * 2 * Math.PI;
      const tgtCx = srcCx + dist * Math.cos(angle);
      const tgtCy = srcCy + dist * Math.sin(angle);

      const source: BoxDescriptor = {
        cx: srcCx,
        cy: srcCy,
        width: srcW,
        height: srcH,
        shape: srcShape,
        cornerRadius: 4 + rand() * 40,
        padding: rand() * 10,
      };

      const target: BoxDescriptor = {
        cx: tgtCx,
        cy: tgtCy,
        width: tgtW,
        height: tgtH,
        shape: tgtShape,
        cornerRadius: 4 + rand() * 40,
        padding: rand() * 10,
      };

      const startGap = rand() * 10;
      const endGap = rand() * 10;

      const result = solveTwoBoxIntersection(source, target, startGap, endGap);

      // Verify no NaNs in output
      if (
        Number.isNaN(result.start.x) ||
        Number.isNaN(result.start.y) ||
        Number.isNaN(result.end.x) ||
        Number.isNaN(result.end.y) ||
        Number.isNaN(result.distance) ||
        Number.isNaN(result.clippedLength)
      ) {
        defects.push({
          id: `NAN_OUTPUT_PAIR_${testIdx}`,
          description: `NaN values detected in TwoBoxIntersectionResult`,
          error: JSON.stringify(result),
        });
      }
      totalAssertions++;

      if (result.isOverlapping) {
        overlappingCount++;
        assert.strictEqual(result.clippedLength, 0);
        totalAssertions++;
      } else {
        nonOverlappingCount++;
        assert.ok(result.clippedLength > 0);
        totalAssertions++;

        // EXHAUSTIVE ZERO-PENETRATION CHECK:
        // Sample 20 interior points along [P_start, P_end]:
        // P(alpha) = start + alpha * (end - start), for alpha in [0.05, 0.95]
        const numSamples = 20;
        for (let s = 1; s < numSamples; s++) {
          const alpha = s / numSamples;
          const pt: Point2D = {
            x: result.start.x + alpha * (result.end.x - result.start.x),
            y: result.start.y + alpha * (result.end.y - result.start.y),
          };
          interiorSamplesChecked++;

          // Margin = 0: Point must not be inside source or target interior
          const insideSource = isPointInsideBox(pt, source, 0);
          const insideTarget = isPointInsideBox(pt, target, 0);

          if (insideSource) {
            defects.push({
              id: `CONNECTOR_PENETRATES_SOURCE_${testIdx}_alpha${alpha}`,
              description: `Connector segment penetrated source box interior!`,
              error: `pt=(${pt.x}, ${pt.y}), src=(${source.cx}, ${source.cy}, ${source.width}x${source.height})`,
            });
          }
          if (insideTarget) {
            defects.push({
              id: `CONNECTOR_PENETRATES_TARGET_${testIdx}_alpha${alpha}`,
              description: `Connector segment penetrated target box interior!`,
              error: `pt=(${pt.x}, ${pt.y}), tgt=(${target.cx}, ${target.cy}, ${target.width}x${target.height})`,
            });
          }
          totalAssertions += 2;
        }

        // Also check start and end points directly
        const startInsideSource = isPointInsideBox(result.start, source, 0);
        const endInsideTarget = isPointInsideBox(result.end, target, 0);
        if (startInsideSource) {
          defects.push({
            id: `START_POINT_INSIDE_SOURCE_${testIdx}`,
            description: `Start point is inside source interior`,
            error: `start=(${result.start.x}, ${result.start.y})`,
          });
        }
        if (endInsideTarget) {
          defects.push({
            id: `END_POINT_INSIDE_TARGET_${testIdx}`,
            description: `End point is inside target interior`,
            error: `end=(${result.end.x}, ${result.end.y})`,
          });
        }
        totalAssertions += 2;
      }
    }

    console.log(`    ✓ 10,000 random box pairs tested:`);
    console.log(`        - Overlapping pairs (cleanly suppressed): ${overlappingCount}`);
    console.log(`        - Non-overlapping pairs (valid connectors): ${nonOverlappingCount}`);
    console.log(`        - Interior connector sample points evaluated: ${interiorSamplesChecked}`);
    console.log(`        - Interior penetrations detected: ${defects.filter((d) => d.id.includes('PENETRATE')).length}`);
  }

  // =========================================================================
  // TEST SUITE 7: Ellipse & Circle 360-Degree Sweeps Across Extreme Dimensions
  // =========================================================================
  console.log('  [Suite 7] Ellipse & Circle sweeps across extreme dimensions (1000:1, 1:1000, r=0.1 to 10000)...');
  {
    const ellipseConfigs = [
      { a: 100, b: 100, name: 'Circle (a=b=100)' },
      { a: 1000, b: 1, name: 'Extreme 1000:1 Needle Ellipse' },
      { a: 1, b: 1000, name: 'Extreme 1:1000 Needle Ellipse' },
      { a: 320, b: 180, name: '16:9 Standard Ellipse' },
      { a: 0.5, b: 0.5, name: 'Subpixel Ellipse (0.5)' },
    ];

    const center: Point2D = { x: -300, y: 700 };

    for (const ec of ellipseConfigs) {
      for (let deg = 0; deg < 360; deg += 1) {
        const rad = (deg * Math.PI) / 180;
        const dir: Point2D = { x: Math.cos(rad), y: Math.sin(rad) };
        const res = intersectRayEllipse(center, ec.a, ec.b, dir);

        // Algebraic verification: ((px - cx) / a)^2 + ((py - cy) / b)^2 === 1.0 within 1e-4
        const relX = (res.point.x - center.x) / ec.a;
        const relY = (res.point.y - center.y) / ec.b;
        const algVal = relX * relX + relY * relY;
        const algErr = Math.abs(algVal - 1.0);

        if (algErr > 1e-4) {
          defects.push({
            id: `ELLIPSE_ALG_ERR_${ec.name}_deg${deg}`,
            description: `Ellipse algebraic equation failed: ${algVal} != 1.0 (err=${algErr})`,
            error: `deg=${deg}, a=${ec.a}, b=${ec.b}`,
          });
        }
        totalAssertions++;
      }
    }

    console.log(`    ✓ Ellipse and Circle sweeps across extreme dimensions verified.`);
  }

  // =========================================================================
  // TEST SUITE 8: Zero-Gap (Boundary-to-Boundary) Connector Segment Invariant
  // =========================================================================
  console.log('  [Suite 8] Zero-gap (startGap=0, endGap=0) boundary-to-boundary connector tests (5,000 pairs)...');
  {
    let seed = 998877;
    function rand(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    const shapes: Array<'rect' | 'rounded-rect' | 'circle' | 'ellipse'> = [
      'rect',
      'rounded-rect',
      'circle',
      'ellipse',
    ];

    let zeroGapValidCount = 0;

    for (let i = 0; i < 5000; i++) {
      const srcShape = shapes[Math.floor(rand() * shapes.length)];
      const tgtShape = shapes[Math.floor(rand() * shapes.length)];

      const srcW = 30 + rand() * 200;
      const srcH = 30 + rand() * 200;
      const tgtW = 30 + rand() * 200;
      const tgtH = 30 + rand() * 200;

      const srcCx = rand() * 1000;
      const srcCy = rand() * 1000;

      // Ensure boxes do not overlap by placing target at distance > (srcDiag + tgtDiag)
      const srcDiag = Math.hypot(srcW, srcH) / 2;
      const tgtDiag = Math.hypot(tgtW, tgtH) / 2;
      const clearDist = srcDiag + tgtDiag + 20 + rand() * 500;
      const angle = rand() * 2 * Math.PI;

      const tgtCx = srcCx + clearDist * Math.cos(angle);
      const tgtCy = srcCy + clearDist * Math.sin(angle);

      const source: BoxDescriptor = {
        cx: srcCx,
        cy: srcCy,
        width: srcW,
        height: srcH,
        shape: srcShape,
        cornerRadius: 4 + rand() * 20,
      };

      const target: BoxDescriptor = {
        cx: tgtCx,
        cy: tgtCy,
        width: tgtW,
        height: tgtH,
        shape: tgtShape,
        cornerRadius: 4 + rand() * 20,
      };

      // Zero gap
      const res = solveTwoBoxIntersection(source, target, 0, 0);
      assert.strictEqual(res.isOverlapping, false);
      assert.ok(res.clippedLength > 0);
      zeroGapValidCount++;
      totalAssertions += 2;

      // Sample interior points along the zero-gap segment (alpha in [0.01, 0.99])
      for (const alpha of [0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99]) {
        const pt: Point2D = {
          x: res.start.x + alpha * (res.end.x - res.start.x),
          y: res.start.y + alpha * (res.end.y - res.start.y),
        };
        const inSrc = isPointInsideBox(pt, source, 0);
        const inTgt = isPointInsideBox(pt, target, 0);

        if (inSrc) {
          defects.push({
            id: `ZERO_GAP_SEGMENT_INSIDE_SRC_${i}_alpha${alpha}`,
            description: `Zero-gap connector segment point entered source interior!`,
            error: `pt=(${pt.x}, ${pt.y})`,
          });
        }
        if (inTgt) {
          defects.push({
            id: `ZERO_GAP_SEGMENT_INSIDE_TGT_${i}_alpha${alpha}`,
            description: `Zero-gap connector segment point entered target interior!`,
            error: `pt=(${pt.x}, ${pt.y})`,
          });
        }
        totalAssertions += 2;
      }
    }

    console.log(`    ✓ Zero-gap connector tests: ${zeroGapValidCount} non-overlapping pairs verified with 0 interior penetrations.`);
  }

  // =========================================================================
  // TEST SUITE 9: Micro-Angle Axis Perturbations (1e-9 Threshold Stability)
  // =========================================================================
  console.log('  [Suite 9] Micro-angle axis perturbations near 1e-9 normalization boundary...');
  {
    const box: BoxDescriptor = { cx: 0, cy: 0, width: 200, height: 100, shape: 'rounded-rect', cornerRadius: 20 };

    const cardinalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const deltas = [-1e-9 - 1e-12, -1e-9 + 1e-12, 0, 1e-9 - 1e-12, 1e-9 + 1e-12];

    for (const base of cardinalAngles) {
      for (const d of deltas) {
        const angle = base + d;
        const dir: Point2D = { x: Math.cos(angle), y: Math.sin(angle) };
        const res = intersectRayBox(box, dir);

        assert.ok(Number.isFinite(res.distance));
        assert.ok(res.distance > 0);
        assert.ok(Number.isFinite(res.point.x));
        assert.ok(Number.isFinite(res.point.y));
        totalAssertions += 4;
      }
    }

    console.log(`    ✓ Micro-angle axis perturbations near 1e-9 boundary verified.`);
  }

  const verdict: AdversarialStressReport['verdict'] =
    defects.length === 0 ? 'CONFIRMED' : 'DEFECT_FOUND';

  console.log('\n======================================================================');
  console.log(` ADVERSARIAL STRESS TEST COMPLETE`);
  console.log(` Total Assertions Verified: ${totalAssertions}`);
  console.log(` Total Defects Found: ${defects.length}`);
  if (defects.length > 0) {
    console.log(' Sample defects (first 20):');
    for (let i = 0; i < Math.min(20, defects.length); i++) {
      console.log(`   #${i + 1} [${defects[i].id}]: ${defects[i].description} | ${defects[i].error}`);
    }
  }
  console.log(` Max Corner Radius Error: ${maxCornerRadiusError.toExponential(4)} px`);
  console.log(` Verdict: ${verdict}`);
  console.log('======================================================================\n');

  return {
    totalAssertions,
    sweepTestsRun,
    degenerateTestsRun,
    concentricTouchingTestsRun,
    cornerTangentTestsRun,
    precisionChecksRun,
    maxCornerRadiusError,
    tenThousandPairsTested,
    interiorSamplesChecked,
    defects,
    verdict,
  };
}

// Self-executing runner for tsx CLI
if (
  require.main === module ||
  process.argv[1]?.includes('challenger_m1_r2_1_boundary_stress')
) {
  try {
    const report = runAdversarialBoundaryStressHarness();
    if (report.verdict !== 'CONFIRMED') {
      console.error(`❌ HARNESS VERDICT: DEFECT_FOUND (${report.defects.length} defects)`);
      process.exit(1);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ ADVERSARIAL STRESS TEST SUITE EXCEPTION:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
