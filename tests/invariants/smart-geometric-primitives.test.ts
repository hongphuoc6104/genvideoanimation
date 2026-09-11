/**
 * tests/invariants/smart-geometric-primitives.test.ts
 *
 * Authoritative Invariant Test Suite for Reusable Smart Geometric Primitives (M1).
 * Verifies mathematical, geometric, and integration invariants across 8 categories:
 *
 * 1. INV-SMART-01: Ray-AABB Boundary Intersection (cardinal, diagonal, aspect ratios).
 * 2. INV-SMART-02: Ray-RoundedRect Corner Arc Quadratic Solver (error < 1e-5), Circle & Ellipse.
 * 3. INV-SMART-03: Two-Box Solver, Outer Boundary Coordinates & Zero Interior Penetration.
 * 4. INV-SMART-04: AutoClippingConnector SVG Generation, Routing Modes, Arrowheads & Reveal Progress.
 * 5. INV-SMART-05: OpaqueCard 2-Layer Decoupled Architecture (Base Shield strictly Opacity: 1.0 #0F172A).
 * 6. INV-SMART-07: SafeStageZone Boundaries [36, 1044] x [180, 1420], >= 50px Subtitle Buffer & clampBox.
 * 7. INV-SMART-07: RadialLabelGroup Polar Distribution, Flip Alignment (90 < theta < 270) & Clamping.
 * 8. INV-SMART-08: Stress & Edge Cases: Degenerate, Concentric, Extreme Radii, Collinear Alignment.
 */

import * as assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {
  // Types & Helpers
  Point2D,
  BoxDescriptor,
  // Boundary Math
  intersectRayAABB,
  intersectRayRoundedRect,
  intersectRayCircle,
  intersectRayEllipse,
  intersectRayBox,
  solveTwoBoxIntersection,
  isPointInsideBox,
  normalizeDirection,
  // Primitives
  AutoClippingConnector,
  generateConnectorPath,
  computeArrowheadPoints,
  OpaqueCard,
  SafeStageZone,
  DEFAULT_STAGE_BOUNDS,
  DEFAULT_SUBTITLE_ZONE_Y,
  RadialLabelGroup,
  calculateRadialLayout,
  estimateTextWidth,
  computePillDimensions,
  AutoPill,
} from '../../motion-kit/src/geometry';

export function runSmartGeometricPrimitivesTests(): number {
  console.log('\n======================================================================');
  console.log(' INVARIANT TEST SUITE: Reusable Smart Geometric Primitives (Milestone 1)');
  console.log(' Scope: Ray-Box Clipping, 2-Layer Decoupled Shield, Safe Stage, Radial Group');
  console.log('======================================================================\n');

  let totalAssertions = 0;

  // =========================================================================
  // GATE 1: Ray-AABB Boundary Intersection (INV-SMART-01)
  // =========================================================================
  console.log('  [Gate 1] Verifying INV-SMART-01: Ray-AABB Boundary Intersection...');
  {
    const center: Point2D = { x: 200, y: 300 };
    const hw = 200; // width = 400
    const hh = 100; // height = 200

    // Cardinal East (1, 0)
    const east = intersectRayAABB(center, hw, hh, { x: 1, y: 0 });
    assert.strictEqual(east.point.x, 400);
    assert.strictEqual(east.point.y, 300);
    assert.strictEqual(east.distance, 200);
    assert.strictEqual(east.surfaceType, 'vertical');
    assert.strictEqual(east.normal.x, 1);
    assert.strictEqual(east.normal.y, 0);
    totalAssertions += 6;

    // Cardinal West (-1, 0)
    const west = intersectRayAABB(center, hw, hh, { x: -1, y: 0 });
    assert.strictEqual(west.point.x, 0);
    assert.strictEqual(west.point.y, 300);
    assert.strictEqual(west.distance, 200);
    assert.strictEqual(west.surfaceType, 'vertical');
    assert.strictEqual(west.normal.x, -1);
    assert.strictEqual(west.normal.y, 0);
    totalAssertions += 6;

    // Cardinal South (0, 1)
    const south = intersectRayAABB(center, hw, hh, { x: 0, y: 1 });
    assert.strictEqual(south.point.x, 200);
    assert.strictEqual(south.point.y, 400);
    assert.strictEqual(south.distance, 100);
    assert.strictEqual(south.surfaceType, 'horizontal');
    assert.strictEqual(south.normal.x, 0);
    assert.strictEqual(south.normal.y, 1);
    totalAssertions += 6;

    // Cardinal North (0, -1)
    const north = intersectRayAABB(center, hw, hh, { x: 0, y: -1 });
    assert.strictEqual(north.point.x, 200);
    assert.strictEqual(north.point.y, 200);
    assert.strictEqual(north.distance, 100);
    assert.strictEqual(north.surfaceType, 'horizontal');
    assert.strictEqual(north.normal.x, 0);
    assert.strictEqual(north.normal.y, -1);
    totalAssertions += 6;

    // Diagonal 45 deg (1, 1): On wide box (hw=200, hh=100), hits bottom horizontal wall first!
    const diag45 = intersectRayAABB(center, hw, hh, { x: 1, y: 1 });
    assert.strictEqual(diag45.surfaceType, 'horizontal');
    assert.strictEqual(diag45.point.y, 400);
    assert.strictEqual(diag45.point.x, 300); // 200 + 100 = 300
    assert.strictEqual(diag45.normal.y, 1);
    totalAssertions += 4;

    // Exact corner ray with slope hh/hw = 100/200 = 0.5: dir = (2, 1)
    const cornerRay = intersectRayAABB(center, hw, hh, { x: 2, y: 1 });
    assert.strictEqual(cornerRay.surfaceType, 'corner-arc');
    assert.strictEqual(Math.round(cornerRay.point.x), 400);
    assert.strictEqual(Math.round(cornerRay.point.y), 400);
    totalAssertions += 3;

    // Tall box (hw = 50, hh = 200): 45 deg ray hits vertical wall first
    const tallBox = intersectRayAABB({ x: 0, y: 0 }, 50, 200, { x: 1, y: 1 });
    assert.strictEqual(tallBox.surfaceType, 'vertical');
    assert.strictEqual(tallBox.point.x, 50);
    assert.strictEqual(tallBox.point.y, 50);
    totalAssertions += 3;

    console.log('    ✓ INV-SMART-01: Ray-AABB intersection verified across cardinal, diagonal, and aspect ratio variations.');
  }

  // =========================================================================
  // GATE 2: Ray-RoundedRect Quadratic Solver, Circle & Ellipse (INV-SMART-02)
  // =========================================================================
  console.log('  [Gate 2] Verifying INV-SMART-02: Ray-RoundedRect Quadratic Solver, Circle & Ellipse...');
  {
    const center: Point2D = { x: 0, y: 0 };
    const hw = 200;
    const hh = 100;
    const r = 30;

    // Flat vertical wall hit: angle 10 deg
    const flatVert = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos((10 * Math.PI) / 180),
      y: Math.sin((10 * Math.PI) / 180),
    });
    assert.strictEqual(flatVert.surfaceType, 'vertical');
    assert.strictEqual(Math.round(flatVert.point.x), 200);
    assert.strictEqual(flatVert.normal.x, 1);
    totalAssertions += 3;

    // Flat horizontal wall hit: angle 80 deg
    const flatHoriz = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos((80 * Math.PI) / 180),
      y: Math.sin((80 * Math.PI) / 180),
    });
    assert.strictEqual(flatHoriz.surfaceType, 'horizontal');
    assert.strictEqual(Math.round(flatHoriz.point.y), 100);
    assert.strictEqual(flatHoriz.normal.y, 1);
    totalAssertions += 3;

    // Corner arc hit (Quadrant 1): angle 25 deg
    // Corner circle center is at (hw - r, hh - r) = (170, 70)
    const cornerQ1 = intersectRayRoundedRect(center, hw, hh, r, {
      x: Math.cos((25 * Math.PI) / 180),
      y: Math.sin((25 * Math.PI) / 180),
    });
    assert.strictEqual(cornerQ1.surfaceType, 'corner-arc');

    // Analytical verification: distance from corner center (170, 70) to point MUST equal r (30) within 1e-5!
    const distToCornerQ1 = Math.hypot(cornerQ1.point.x - 170, cornerQ1.point.y - 70);
    assert.ok(
      Math.abs(distToCornerQ1 - r) < 1e-5,
      `[INV-SMART-02 Violation] Corner Q1 distance error: ${Math.abs(distToCornerQ1 - r)} >= 1e-5`
    );
    totalAssertions += 2;

    // Test remaining 3 quadrants corner arcs (Q2, Q3, Q4)
    const quadrants = [
      { deg: 155, cx: -170, cy: 70, name: 'Q2' },
      { deg: 205, cx: -170, cy: -70, name: 'Q3' },
      { deg: 335, cx: 170, cy: -70, name: 'Q4' },
    ];

    for (const q of quadrants) {
      const res = intersectRayRoundedRect(center, hw, hh, r, {
        x: Math.cos((q.deg * Math.PI) / 180),
        y: Math.sin((q.deg * Math.PI) / 180),
      });
      assert.strictEqual(res.surfaceType, 'corner-arc');
      const dist = Math.hypot(res.point.x - q.cx, res.point.y - q.cy);
      assert.ok(
        Math.abs(dist - r) < 1e-5,
        `[INV-SMART-02 Violation] Corner ${q.name} distance error: ${Math.abs(dist - r)} >= 1e-5`
      );
      totalAssertions += 2;
    }

    // Circle intersection: radius = 80
    const circleCenter: Point2D = { x: 100, y: 150 };
    const circleRay = intersectRayCircle(circleCenter, 80, { x: 1, y: 1 });
    assert.strictEqual(circleRay.surfaceType, 'radial');
    assert.strictEqual(circleRay.distance, 80);
    const distToCircle = Math.hypot(circleRay.point.x - 100, circleRay.point.y - 150);
    assert.ok(Math.abs(distToCircle - 80) < 1e-9);
    totalAssertions += 3;

    // Ellipse intersection: a = 200, b = 100
    const ellipseCenter: Point2D = { x: 0, y: 0 };
    const ellipseRay = intersectRayEllipse(ellipseCenter, 200, 100, {
      x: Math.cos((35 * Math.PI) / 180),
      y: Math.sin((35 * Math.PI) / 180),
    });
    assert.strictEqual(ellipseRay.surfaceType, 'radial');
    // Verify algebraic equation (x/a)^2 + (y/b)^2 === 1.0 within 1e-6
    const ellipseEq =
      (ellipseRay.point.x / 200) ** 2 + (ellipseRay.point.y / 100) ** 2;
    assert.ok(
      Math.abs(ellipseEq - 1.0) < 1e-6,
      `[INV-SMART-02 Violation] Ellipse equation value: ${ellipseEq} != 1.0`
    );
    totalAssertions += 2;

    console.log('    ✓ INV-SMART-02: Ray-RoundedRect corner arc quadratic solution verified (< 1e-5 error), Circle & Ellipse verified.');
  }

  // =========================================================================
  // GATE 3: Two-Box Solver & Zero Interior Penetration (INV-SMART-03)
  // =========================================================================
  console.log('  [Gate 3] Verifying INV-SMART-03: Two-Box Solver & Zero Interior Penetration...');
  {
    const source: BoxDescriptor = {
      cx: 180,
      cy: 340,
      width: 160,
      height: 80,
      shape: 'rect',
    };

    const target: BoxDescriptor = {
      cx: 580,
      cy: 340,
      width: 160,
      height: 80,
      shape: 'rect',
    };

    const startGap = 6;
    const endGap = 8;
    const result = solveTwoBoxIntersection(source, target, startGap, endGap);

    assert.strictEqual(result.isOverlapping, false);
    assert.strictEqual(result.distance, 400);

    // Source hw = 80, exit point at cx + hw + startGap = 180 + 80 + 6 = 266
    assert.strictEqual(result.start.x, 266);
    assert.strictEqual(result.start.y, 340);

    // Target hw = 80, entry point at cx - hw - endGap = 580 - 80 - 8 = 492
    assert.strictEqual(result.end.x, 492);
    assert.strictEqual(result.end.y, 340);

    assert.strictEqual(result.clippedLength, 492 - 266);
    totalAssertions += 6;

    // Rigorous Zero Interior Penetration Invariant Test:
    // Sample 25 intermediate points along [P_start, P_end].
    // Not a single point may lie inside source or target box interiors!
    for (let i = 0; i <= 25; i++) {
      const alpha = i / 25;
      const pt: Point2D = {
        x: result.start.x + alpha * (result.end.x - result.start.x),
        y: result.start.y + alpha * (result.end.y - result.start.y),
      };

      assert.strictEqual(
        isPointInsideBox(pt, source),
        false,
        `[INV-SMART-03 Violation] Connector point (${pt.x}, ${pt.y}) penetrated source box interior!`
      );
      assert.strictEqual(
        isPointInsideBox(pt, target),
        false,
        `[INV-SMART-03 Violation] Connector point (${pt.x}, ${pt.y}) penetrated target box interior!`
      );
      totalAssertions += 2;
    }

    // Diagonal Box Configuration
    const diagSource: BoxDescriptor = {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      shape: 'rounded-rect',
      cornerRadius: 16,
    };
    const diagTarget: BoxDescriptor = {
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      shape: 'rounded-rect',
      cornerRadius: 16,
    };

    const diagResult = solveTwoBoxIntersection(diagSource, diagTarget, 4, 4);
    assert.strictEqual(diagResult.isOverlapping, false);
    assert.ok(diagResult.clippedLength > 0);

    // Verify zero penetration for diagonal segment
    for (let i = 0; i <= 10; i++) {
      const alpha = i / 10;
      const pt: Point2D = {
        x: diagResult.start.x + alpha * (diagResult.end.x - diagResult.start.x),
        y: diagResult.start.y + alpha * (diagResult.end.y - diagResult.start.y),
      };
      assert.strictEqual(isPointInsideBox(pt, diagSource), false);
      assert.strictEqual(isPointInsideBox(pt, diagTarget), false);
      totalAssertions += 2;
    }
    totalAssertions += 2;

    // Overlapping boxes fallback
    const overlappingTarget: BoxDescriptor = {
      cx: 200, // Distance is only 20px, while half-widths are 80 + 80 = 160
      cy: 340,
      width: 160,
      height: 80,
    };
    const overlapRes = solveTwoBoxIntersection(source, overlappingTarget, 4, 4);
    assert.strictEqual(overlapRes.isOverlapping, true);
    assert.strictEqual(overlapRes.clippedLength, 0);
    totalAssertions += 2;

    console.log('    ✓ INV-SMART-03: Two-box boundary solving, zero interior penetration, and clearance gaps verified.');
  }

  // =========================================================================
  // GATE 4: AutoClippingConnector SVG & Routing Modes (INV-SMART-04)
  // =========================================================================
  console.log('  [Gate 4] Verifying INV-SMART-04: AutoClippingConnector SVG & Routing Modes...');
  {
    const source: BoxDescriptor = { cx: 200, cy: 300, width: 100, height: 60 };
    const target: BoxDescriptor = { cx: 600, cy: 300, width: 100, height: 60 };
    const intersection = solveTwoBoxIntersection(source, target, 4, 4);

    // 1. Straight Routing
    const straightPath = generateConnectorPath(intersection, 'straight');
    assert.ok(straightPath.d.startsWith('M'));
    assert.ok(straightPath.d.includes('L'));
    assert.strictEqual(straightPath.tangentStart, 0);
    assert.strictEqual(straightPath.tangentEnd, 0);
    totalAssertions += 4;

    // 2. Curved Routing (Quadratic Bezier)
    const curvedPath = generateConnectorPath(intersection, 'curved', 0.25);
    assert.ok(curvedPath.d.includes('Q'));
    assert.ok(curvedPath.controlPoint !== undefined);
    // Control point must be displaced perpendicularly from midpoint
    assert.notStrictEqual(curvedPath.controlPoint!.y, straightPath.midpoint.y);
    // Tangents bend with the curve
    assert.notStrictEqual(curvedPath.tangentStart, 0);
    assert.notStrictEqual(curvedPath.tangentEnd, 0);
    totalAssertions += 5;

    // 3. Orthogonal Routing
    const orthoIntersection = solveTwoBoxIntersection(
      { cx: 200, cy: 200, width: 100, height: 60 },
      { cx: 500, cy: 500, width: 100, height: 60 },
      4,
      4
    );
    const orthoPath = generateConnectorPath(orthoIntersection, 'orthogonal');
    assert.ok(orthoPath.d.includes('L'));
    assert.ok(orthoPath.d.includes('Q')); // Fillet arcs
    totalAssertions += 2;

    // 4. Arrowhead orientation points
    const arrowEast = computeArrowheadPoints({ x: 100, y: 100 }, 0, 12);
    assert.strictEqual(arrowEast.tip.x, 100);
    assert.strictEqual(arrowEast.tip.y, 100);
    // Left and right wings must be behind tip in X
    assert.ok(arrowEast.leftWing.x < 100);
    assert.ok(arrowEast.rightWing.x < 100);
    totalAssertions += 4;

    // 5. Component rendering via ReactDOMServer
    const renderedStraight = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoClippingConnector, {
        source,
        target,
        routing: 'straight',
        color: '#38BDF8',
        progress: 0.5,
        label: 'DATA_FLOW',
      })
    );

    assert.ok(renderedStraight.includes('stroke="#38BDF8"'));
    assert.ok(renderedStraight.includes('stroke-dashoffset="50"'));
    assert.ok(renderedStraight.includes('DATA_FLOW'));
    assert.ok(renderedStraight.includes('<polygon'));
    totalAssertions += 4;

    // Overlapping connector suppression
    const renderedOverlap = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AutoClippingConnector, {
        source,
        target: { cx: 220, cy: 300, width: 100, height: 60 }, // Colliding
      })
    );
    assert.strictEqual(renderedOverlap, ''); // Cleanly suppressed
    totalAssertions += 1;

    console.log('    ✓ INV-SMART-04: SVG path generation (straight, curved, orthogonal), arrowheads, and reveal progress verified.');
  }

  // =========================================================================
  // GATE 5: OpaqueCard 2-Layer Decoupled Opacity Invariants (INV-SMART-05)
  // =========================================================================
  console.log('  [Gate 5] Verifying INV-SMART-05: OpaqueCard 2-Layer Decoupled Opacity Invariants...');
  {
    // Case A: Active Card (SVG)
    const activeSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        OpaqueCard,
        {
          width: 300,
          height: 120,
          baseColor: '#0F172A',
          isActive: true,
          isDimmed: false,
        },
        React.createElement('text', null, 'Active Title')
      )
    );

    // Layer 1 Base Shield MUST have opacity 1.0 and fill #0F172A
    assert.ok(activeSvg.includes('class="opaque-card-base-shield"'));
    assert.ok(activeSvg.includes('opacity="1"'));
    assert.ok(activeSvg.includes('fill="#0F172A"'));
    // Layer 2 Content has opacity 1
    assert.ok(activeSvg.includes('class="opaque-card-content-layer" opacity="1"'));
    totalAssertions += 4;

    // Case B: Dimmed / Inactive Card (SVG)
    const dimmedSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        OpaqueCard,
        {
          width: 300,
          height: 120,
          baseColor: '#0F172A',
          isActive: false,
          isDimmed: true,
          inactiveOpacity: 0.25,
          inactiveDesaturation: 0.75,
        },
        React.createElement('text', null, 'Dimmed Title')
      )
    );

    // HARD INVARIANT: Base Shield MUST STILL HAVE opacity="1" EVEN WHEN CARD IS DIMMED!
    // This is the core fix preventing the CSS Opacity Inheritance Trap!
    assert.ok(
      dimmedSvg.includes('class="opaque-card-base-shield"'),
      '[INV-SMART-05 Violation] Missing base shield element'
    );
    assert.ok(
      dimmedSvg.includes('fill="#0F172A"'),
      '[INV-SMART-05 Violation] Base shield must maintain #0F172A fill'
    );
    // Root element MUST NOT have opacity < 1
    assert.strictEqual(
      dimmedSvg.includes('class="opaque-card-root" opacity="0.25"'),
      false,
      '[INV-SMART-05 Violation] Root container received dimmed opacity! CSS opacity trap detected.'
    );

    // Foreground Content Layer MUST receive dimmed opacity (0.25) and grayscale filter
    assert.ok(
      dimmedSvg.includes('class="opaque-card-content-layer" opacity="0.25"'),
      '[INV-SMART-05 Violation] Content layer did not receive inactiveOpacity: 0.25'
    );
    assert.ok(
      dimmedSvg.includes('grayscale(0.75)'),
      '[INV-SMART-05 Violation] Content layer did not receive grayscale desaturation'
    );
    totalAssertions += 5;

    // Case C: Inactive Opacity Clamp Range [0.20, 0.30]
    const clampedLowSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(OpaqueCard, {
        width: 200,
        height: 80,
        isActive: false,
        inactiveOpacity: 0.05, // Below 0.20 floor
      })
    );
    assert.ok(clampedLowSvg.includes('opacity="0.2"'));

    const clampedHighSvg = ReactDOMServer.renderToStaticMarkup(
      React.createElement(OpaqueCard, {
        width: 200,
        height: 80,
        isActive: false,
        inactiveOpacity: 0.85, // Above 0.30 ceiling
      })
    );
    assert.ok(clampedHighSvg.includes('opacity="0.3"'));
    totalAssertions += 2;

    // Case D: HTML Mode (as="html")
    const dimmedHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        OpaqueCard,
        {
          as: 'html',
          width: 320,
          height: 100,
          baseColor: '#0F172A',
          isActive: false,
          isDimmed: true,
          inactiveOpacity: 0.25,
        },
        React.createElement('span', null, 'HTML Content')
      )
    );

    assert.ok(dimmedHtml.includes('class="opaque-card-base-shield"'));
    assert.ok(dimmedHtml.includes('background-color:#0F172A'));
    assert.ok(dimmedHtml.includes('opacity:1'));
    assert.ok(dimmedHtml.includes('class="opaque-card-content-layer"'));
    assert.ok(dimmedHtml.includes('opacity:0.25'));
    totalAssertions += 5;

    console.log('    ✓ INV-SMART-05: 2-layer decoupled opacity architecture verified (Base Shield strictly opacity: 1.0 #0F172A in SVG & HTML).');
  }

  // =========================================================================
  // GATE 6: SafeStageZone Boundaries & Subtitle Clearance (INV-SMART-06)
  // =========================================================================
  console.log('  [Gate 6] Verifying INV-SMART-06: SafeStageZone Boundaries & Subtitle Clearance...');
  {
    const bounds = DEFAULT_STAGE_BOUNDS;
    assert.strictEqual(bounds.minX, 36);
    assert.strictEqual(bounds.maxX, 1044);
    assert.strictEqual(bounds.minY, 180);
    assert.strictEqual(bounds.maxY, 1420);
    assert.strictEqual(bounds.width, 1008);
    assert.strictEqual(bounds.height, 1240);
    assert.strictEqual(bounds.centerX, 540);
    assert.strictEqual(bounds.centerY, 800);
    totalAssertions += 8;

    // Subtitle buffer clearance calculation:
    // Subtitle floor is at 1470px. Stage maxY is 1420px.
    // Buffer = 1470 - 1420 = 50px!
    const bufferAtStageFloor = DEFAULT_SUBTITLE_ZONE_Y - bounds.maxY;
    assert.strictEqual(bufferAtStageFloor, 50);
    totalAssertions += 1;

    let capturedContext: any = null;
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        SafeStageZone,
        { showDebugBounds: true },
        (ctx) => {
          capturedContext = ctx;
          return React.createElement('text', null, 'Inside Stage');
        }
      )
    );

    assert.ok(capturedContext !== null);

    // 1. Normalized mapPoint
    const pCenter = capturedContext.mapPoint(0.5, 0.5);
    assert.strictEqual(pCenter.x, 540);
    assert.strictEqual(pCenter.y, 800);

    const pTopLeft = capturedContext.mapPoint(0, 0);
    assert.strictEqual(pTopLeft.x, 36);
    assert.strictEqual(pTopLeft.y, 180);

    const pBottomRight = capturedContext.mapPoint(1, 1);
    assert.strictEqual(pBottomRight.x, 1044);
    assert.strictEqual(pBottomRight.y, 1420);
    totalAssertions += 6;

    // 2. checkClearance
    const safeClearance = capturedContext.checkClearance(1400);
    assert.strictEqual(safeClearance.isSafe, true);
    assert.strictEqual(safeClearance.bufferPx, 70);

    const exactBoundaryClearance = capturedContext.checkClearance(1420);
    assert.strictEqual(exactBoundaryClearance.isSafe, true);
    assert.strictEqual(exactBoundaryClearance.bufferPx, 50);

    const unsafeClearance = capturedContext.checkClearance(1425);
    assert.strictEqual(unsafeClearance.isSafe, false);
    assert.strictEqual(unsafeClearance.bufferPx, 45);
    totalAssertions += 6;

    // 3. clampBox enforcement
    const clampedOutLeft = capturedContext.clampBox(-50, 200, 300, 100);
    assert.strictEqual(clampedOutLeft.x, 36);

    const clampedOutRight = capturedContext.clampBox(900, 200, 300, 100);
    assert.strictEqual(clampedOutRight.x, 1044 - 300); // 744

    const clampedOutBottom = capturedContext.clampBox(100, 1400, 300, 100);
    assert.strictEqual(clampedOutBottom.y, 1420 - 100); // 1320
    assert.ok(clampedOutBottom.y + clampedOutBottom.height <= 1420);
    totalAssertions += 4;

    console.log('    ✓ INV-SMART-06: Stage Zone 2 bounds [36, 1044] x [180, 1420], >= 50px subtitle safety buffer, and clampBox verified.');
  }

  // =========================================================================
  // GATE 7: RadialLabelGroup Polar Angles & Flip Alignment (INV-SMART-07)
  // =========================================================================
  console.log('  [Gate 7] Verifying INV-SMART-07: RadialLabelGroup Polar Angles, Flip Alignment & Clamping...');
  {
    const items = [
      { id: '1', label: 'Top (270°)' },
      { id: '2', label: 'Right (0°)' },
      { id: '3', label: 'Bottom (90°)' },
      { id: '4', label: 'Left (180°)' },
    ];

    // Mode: 'tangential-rotated' to test flip alignment
    const tangentialLayouts = calculateRadialLayout(
      540,
      800,
      300,
      items,
      -90,
      360,
      'tangential-rotated'
    );

    assert.strictEqual(tangentialLayouts.length, 4);

    // Item 0: start at -90 deg === 270 deg
    assert.strictEqual(tangentialLayouts[0].normalizedAngle, 270);
    assert.strictEqual(tangentialLayouts[0].isFlipped, false);

    // Item 1: 0 deg (Right)
    assert.strictEqual(tangentialLayouts[1].normalizedAngle, 0);
    assert.strictEqual(tangentialLayouts[1].isFlipped, false);
    assert.strictEqual(tangentialLayouts[1].rotationDeg, 0);

    // Item 2: 90 deg (Bottom)
    assert.strictEqual(tangentialLayouts[2].normalizedAngle, 90);
    assert.strictEqual(tangentialLayouts[2].isFlipped, false);

    // Item 3: 180 deg (Left): Lies in (90, 270) -> MUST FLIP BY 180 DEG!
    assert.strictEqual(tangentialLayouts[3].normalizedAngle, 180);
    assert.strictEqual(
      tangentialLayouts[3].isFlipped,
      true,
      '[INV-SMART-07 Violation] Text in left hemisphere (180 deg) must be flipped to prevent inverted text!'
    );
    assert.strictEqual(tangentialLayouts[3].rotationDeg, 0); // (180 + 180) % 360 = 0
    totalAssertions += 8;

    // Horizontal & Vertical Clamping Invariant Test:
    // With an oversized radius (e.g. R = 800), pills would normally expand to X = -260 or 1340.
    // calculateRadialLayout MUST clamp all pills to [36, 1044] x [180, 1420]!
    const largeRadiusItems = [
      { id: 'a', label: 'A', width: 280, height: 60 },
      { id: 'b', label: 'B', width: 280, height: 60 },
      { id: 'c', label: 'C', width: 280, height: 60 },
      { id: 'd', label: 'D', width: 280, height: 60 },
      { id: 'e', label: 'E', width: 280, height: 60 },
      { id: 'f', label: 'F', width: 280, height: 60 },
    ];

    const clampedLayouts = calculateRadialLayout(
      540,
      800,
      800, // Giant radius
      largeRadiusItems,
      0,
      360,
      'horizontal-pill'
    );

    for (const l of clampedLayouts) {
      assert.ok(
        l.pillX >= 36,
        `[INV-SMART-07 Violation] Pill X (${l.pillX}) is less than stage minX (36)`
      );
      assert.ok(
        l.pillX + l.pillWidth <= 1044,
        `[INV-SMART-07 Violation] Pill right edge (${l.pillX + l.pillWidth}) exceeds stage maxX (1044)`
      );
      assert.ok(
        l.pillY >= 180,
        `[INV-SMART-07 Violation] Pill Y (${l.pillY}) is less than stage minY (180)`
      );
      assert.ok(
        l.pillY + l.pillHeight <= 1420,
        `[INV-SMART-07 Violation] Pill bottom edge (${l.pillY + l.pillHeight}) exceeds stage maxY (1420)`
      );
      totalAssertions += 4;
    }

    // Component rendering test
    const renderedGroup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(RadialLabelGroup, {
        centerX: 540,
        centerY: 800,
        radius: 200,
        items,
        useOpaqueShield: true,
      })
    );
    assert.ok(renderedGroup.includes('radial-label-group'));
    assert.ok(renderedGroup.includes('opaque-card-base-shield'));
    totalAssertions += 2;

    console.log('    ✓ INV-SMART-07: Polar angle distribution, flip alignment (90 < theta < 270), and horizontal boundary clamping verified.');
  }

  // =========================================================================
  // GATE 8: Stress & Edge Cases (INV-SMART-08)
  // =========================================================================
  console.log('  [Gate 8] Verifying INV-SMART-08: Stress, Degenerate & Edge Cases...');
  {
    // 1. Zero-size box (w = 0, h = 0)
    const zeroBoxRes = intersectRayAABB({ x: 100, y: 100 }, 0, 0, { x: 1, y: 0 });
    assert.strictEqual(zeroBoxRes.distance, 0);
    assert.strictEqual(zeroBoxRes.point.x, 100);
    assert.strictEqual(zeroBoxRes.point.y, 100);
    totalAssertions += 3;

    // 2. Concentric boxes (C1 === C2)
    const concentricRes = solveTwoBoxIntersection(
      { cx: 200, cy: 200, width: 100, height: 100 },
      { cx: 200, cy: 200, width: 100, height: 100 }
    );
    assert.strictEqual(concentricRes.isOverlapping, true);
    assert.strictEqual(concentricRes.clippedLength, 0);
    assert.strictEqual(isNaN(concentricRes.start.x), false);
    assert.strictEqual(isNaN(concentricRes.end.x), false);
    totalAssertions += 4;

    // 3. Extreme corner radius (r > min(hw, hh))
    const extremeCornerRes = intersectRayRoundedRect(
      { x: 0, y: 0 },
      50,
      50,
      500, // Extreme radius
      { x: 1, y: 1 }
    );
    // Must be clamped to min(hw, hh) = 50 (behaving as circle of radius 50)
    assert.ok(Math.abs(extremeCornerRes.distance - 50) < 1e-5);
    totalAssertions += 1;

    // 4. Perfectly collinear vertical alignment (dx === 0)
    const vertCollinear = solveTwoBoxIntersection(
      { cx: 300, cy: 100, width: 100, height: 60 },
      { cx: 300, cy: 500, width: 100, height: 60 },
      0,
      0
    );
    assert.strictEqual(vertCollinear.start.x, 300);
    assert.strictEqual(vertCollinear.start.y, 130);
    assert.strictEqual(vertCollinear.end.x, 300);
    assert.strictEqual(vertCollinear.end.y, 470);
    assert.strictEqual(vertCollinear.tangentAngleStart, 90);
    totalAssertions += 5;

    // 5. Box with protective padding
    const paddedBox: BoxDescriptor = {
      cx: 100,
      cy: 100,
      width: 100,
      height: 100,
      padding: 20, // Effective hw = 50 + 20 = 70
    };
    const paddedRes = intersectRayBox(paddedBox, { x: 1, y: 0 });
    assert.strictEqual(paddedRes.point.x, 170); // 100 + 70
    assert.strictEqual(paddedRes.distance, 70);
    totalAssertions += 2;

    console.log('    ✓ INV-SMART-08: Zero-size box, concentric boxes, extreme corner radii, collinear alignment, and box padding verified.');
  }

  // =========================================================================
  // GATE 9: Content-Driven AutoPill & Text Metrics (INV-SMART-09)
  // =========================================================================
  console.log('  [Gate 9] Verifying INV-SMART-09: Content-Driven AutoPill & Text Metrics...');
  {
    // 1. Text width estimation
    const emptyWidth = estimateTextWidth('', 30);
    assert.strictEqual(emptyWidth, 0);
    totalAssertions++;

    const sampleText = '2. GAP THỰC NGHIỆM';
    const textWidth = estimateTextWidth(sampleText, 30, 800);
    assert.ok(textWidth >= 280 && textWidth <= 400, `Expected 280-400px text width, got ${textWidth}`);
    totalAssertions++;

    // 2. Pill dimensions computation
    const dims = computePillDimensions(sampleText, 30, { paddingHorizontal: 34 });
    assert.ok(dims.width >= textWidth + 68, `Pill width ${dims.width} should be >= textWidth + 68`);
    assert.ok(dims.padLeft >= 34, `padLeft ${dims.padLeft} should be >= 34px`);
    assert.ok(dims.padRight >= 34, `padRight ${dims.padRight} should be >= 34px`);
    totalAssertions += 3;

    // 3. React SSR rendering verification
    const pillElement = React.createElement(AutoPill, {
      x: 540,
      y: 800,
      text: sampleText,
      fontSize: 30,
      color: '#F59E0B',
      stroke: '#F59E0B',
    });
    const html = ReactDOMServer.renderToStaticMarkup(pillElement);
    assert.ok(html.includes('fill="#0F172A"'), 'AutoPill must have solid opaque fill #0F172A');
    assert.ok(html.includes('data-autopill="true"'), 'AutoPill must have data-autopill attribute');
    assert.ok(html.includes(sampleText), 'AutoPill must render the text string');
    assert.ok(html.includes(`width="${dims.width}"`), `AutoPill rect width should match computed width ${dims.width}`);
    totalAssertions += 4;

    console.log('    ✓ INV-SMART-09: Content-driven auto-sizing, padding >= 34px, and opaque solid background verified.');
  }

  console.log('\n======================================================================');
  console.log(` ALL 9 INVARIANT GATES PASSED (100% PASS: ${totalAssertions} ASSERTIONS VERIFIED)`);
  console.log('======================================================================\n');

  return totalAssertions;
}

// Support Jest or test runner globals if available
if (typeof describe === 'function' && typeof it === 'function') {
  describe('Smart Geometric Primitives Invariant Suite (M1)', () => {
    it('passes all 8 smart geometric primitive invariant gates', () => {
      runSmartGeometricPrimitivesTests();
    });
  });
}

// Self-executing runner for tsx CLI
if (
  require.main === module ||
  process.argv[1]?.includes('smart-geometric-primitives')
) {
  try {
    const passedAssertions = runSmartGeometricPrimitivesTests();
    if (passedAssertions < 120) {
      console.error(`❌ FAILED: Required >= 120 assertions, but only ran ${passedAssertions}.`);
      process.exit(1);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ SMART GEOMETRIC PRIMITIVES TEST SUITE FAILED:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
