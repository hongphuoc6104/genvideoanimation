/**
 * tests/invariants/headless-geometry-gate.test.ts
 *
 * Authoritative Invariant Test Suite for Generic Headless DOM Runtime Geometry Gate (G04D).
 * Verifies mathematical solvers, physical invariants, and CLI argument parsing:
 *
 * 1. INV-DOM-01: 2D Box Overlap & Segment-Box Math (getBoxOverlap, segmentIntersectsBox).
 * 2. INV-DOM-02: Invariant 1 - TEXT_COLLISION (AABB overlap > 2px, subpixel tolerance).
 * 3. INV-DOM-03: Invariant 2 - CONTAINER_OVERFLOW & CONTAINER_PADDING_DEFICIT (horizontal & vertical padding >= 30px).
 * 4. INV-DOM-04: Invariant 3 - UNSHIELDED_VECTOR_PIERCE (both <line> and discretized <path>, OpaqueCard shield bypass).
 * 5. INV-DOM-05: Invariant 4 - SUBTITLE_INTRUSION (stage bottom > 1420px, semantic subtitle exclusion).
 * 6. INV-DOM-06: Invariant 5 - VIEWPORT_OVERFLOW (margins [36, 1044], notch y < 80px, semantic HUD exclusion).
 * 7. INV-DOM-07: CLI Argument Parsing & Entrypoint / Project resolution.
 */

import * as assert from 'node:assert/strict';
import {
  getBoxOverlap,
  isPointInsideBox,
  doSegmentsIntersect,
  segmentIntersectsBox,
  BoxRect,
  Point,
  DOMTextElement,
  DOMCardElement,
  DOMVectorElement,
  DOMFrameSnapshot,
} from '../../validators/geometry-types';
import {
  evaluateFrameInvariants,
  parseCliArgs,
  CardElement,
} from '../../validators/validate-runtime-geometry';

export function runHeadlessGeometryGateTests(): number {
  console.log('\n======================================================================');
  console.log(' INVARIANT TEST SUITE: Headless DOM Runtime Geometry Gate (Layer 2 G04D)');
  console.log(' Scope: 5 Physical Invariants, Multi-point Paths, Strict 30px Padding');
  console.log('======================================================================\n');

  let totalAssertions = 0;

  // =========================================================================
  // GATE 1: Geometric Math & Intersection Solvers (INV-DOM-01)
  // =========================================================================
  console.log('  [Gate 1] Verifying INV-DOM-01: 2D Box Overlap & Segment Intersection...');

  // Overlapping boxes
  const boxA: BoxRect = { x: 100, y: 100, width: 200, height: 100 };
  const boxB: BoxRect = { x: 250, y: 150, width: 200, height: 100 };
  const overlapAB = getBoxOverlap(boxA, boxB);
  assert.equal(overlapAB.intersects, true, 'Boxes should intersect');
  assert.equal(overlapAB.overlapX, 50, 'Overlap width should be 50px');
  assert.equal(overlapAB.overlapY, 50, 'Overlap height should be 50px');
  totalAssertions += 3;

  // Disjoint boxes
  const boxC: BoxRect = { x: 500, y: 500, width: 100, height: 100 };
  const overlapAC = getBoxOverlap(boxA, boxC);
  assert.equal(overlapAC.intersects, false, 'Disjoint boxes should not intersect');
  assert.equal(overlapAC.overlapX, 0, 'Disjoint overlap width must be 0');
  totalAssertions += 2;

  // Point inside box
  const pInside: Point = { x: 150, y: 150 };
  const pOutside: Point = { x: 50, y: 50 };
  assert.equal(isPointInsideBox(pInside, boxA, 0), true, 'pInside must be inside boxA');
  assert.equal(isPointInsideBox(pOutside, boxA, 0), false, 'pOutside must not be inside boxA');
  assert.equal(isPointInsideBox({ x: 101, y: 150 }, boxA, 2), false, 'Point within 2px margin is rejected by margin=2');
  assert.equal(isPointInsideBox({ x: 103, y: 150 }, boxA, 2), true, 'Point 3px inside is accepted by margin=2');
  totalAssertions += 4;

  // Line segment intersecting box
  const segPiercing: [Point, Point] = [{ x: 50, y: 150 }, { x: 350, y: 150 }];
  assert.equal(segmentIntersectsBox(segPiercing[0], segPiercing[1], boxA), true, 'Piercing segment must intersect box');

  // Segment entirely outside box
  const segOutside: [Point, Point] = [{ x: 50, y: 50 }, { x: 350, y: 50 }];
  assert.equal(segmentIntersectsBox(segOutside[0], segOutside[1], boxA), false, 'Outside segment must not intersect box');

  // Segment with one endpoint inside
  const segEndpointInside: [Point, Point] = [{ x: 150, y: 150 }, { x: 350, y: 50 }];
  assert.equal(segmentIntersectsBox(segEndpointInside[0], segEndpointInside[1], boxA), true, 'Segment with endpoint inside must intersect');
  totalAssertions += 3;

  console.log('    ✓ Gate 1 passed (9 assertions)');

  // =========================================================================
  // GATE 2: Invariant 1 - TEXT_COLLISION (INV-DOM-02)
  // =========================================================================
  console.log('  [Gate 2] Verifying INV-DOM-02: Text-on-Text Collision Detection...');

  // Snapshot with 2 colliding texts
  const snapCollision: DOMFrameSnapshot = {
    frame: 10,
    beatId: 'b01',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Chức năng vận chuyển',
        rect: { x: 200, y: 400, width: 250, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
      {
        id: 't2',
        tag: 'text',
        text: 'Bơm Natri-Kali',
        rect: { x: 300, y: 410, width: 220, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [],
    stageElements: [],
  };

  const vCollision = evaluateFrameInvariants(snapCollision);
  assert.equal(vCollision.length, 1, 'Must detect exactly 1 text collision');
  assert.equal(vCollision[0].invariant, 'TEXT_COLLISION');
  assert.equal(vCollision[0].severity, 'CRITICAL');
  assert.ok(vCollision[0].message.includes('collides with'));
  totalAssertions += 4;

  // Subpixel touching text (<= 2px overlap) should pass cleanly
  const snapSubpixel: DOMFrameSnapshot = {
    frame: 10,
    beatId: 'b01',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Nhãn Một',
        rect: { x: 100, y: 400, width: 100, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
      {
        id: 't2',
        tag: 'text',
        text: 'Nhãn Hai',
        rect: { x: 199, y: 400, width: 100, height: 40 }, // 1px horizontal overlap
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [],
    stageElements: [],
  };
  const vSubpixel = evaluateFrameInvariants(snapSubpixel);
  assert.equal(vSubpixel.length, 0, '1px overlap within 2px tolerance must not flag collision');
  totalAssertions += 1;

  console.log('    ✓ Gate 2 passed (5 assertions)');

  // =========================================================================
  // GATE 3: Invariant 2 - CONTAINER_OVERFLOW & PADDING_DEFICIT (INV-DOM-03)
  // =========================================================================
  console.log('  [Gate 3] Verifying INV-DOM-03: Container Overflow & Horizontal/Vertical Padding Deficits...');

  // Test: Horizontal padding deficit (< 30px)
  const snapHorizPadDeficit: DOMFrameSnapshot = {
    frame: 20,
    beatId: 'b02',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Card Content Text',
        rect: { x: 215, y: 310, width: 270, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [
      {
        id: 'c1',
        tag: 'rect',
        rect: { x: 200, y: 300, width: 300, height: 100 }, // Left pad: 15px (< 30px), Right pad: 15px (< 30px)
        backgroundColor: '#1E293B',
        effectiveOpacity: 1.0,
        isOpaque: true,
        zIndex: 10,
        domIndex: 5,
      },
    ],
    vectors: [],
    stageElements: [],
  };
  const vHorizPad = evaluateFrameInvariants(snapHorizPadDeficit);
  const horizViolations = vHorizPad.filter((v) => v.invariant === 'CONTAINER_PADDING_DEFICIT' && v.message.includes('horizontal'));
  assert.equal(horizViolations.length, 1, 'Must detect horizontal padding deficit');
  assert.equal(horizViolations[0].shortfallPx, 15, 'Shortfall must be 30 - 15 = 15px');
  assert.equal(horizViolations[0].severity, 'CRITICAL');
  totalAssertions += 3;

  // Test: Vertical padding deficit (< 30px, e.g. padTop or padBottom < 30px)
  const snapVertPadDeficit: DOMFrameSnapshot = {
    frame: 20,
    beatId: 'b02',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Pill Label',
        rect: { x: 250, y: 310, width: 100, height: 40 }, // Top pad: 10px (< 30px)
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [
      {
        id: 'c1',
        tag: 'rect',
        rect: { x: 200, y: 300, width: 200, height: 100 }, // Left pad: 50px (safe), Top pad: 10px (DEFICIT)
        backgroundColor: '#1E293B',
        effectiveOpacity: 1.0,
        isOpaque: true,
        zIndex: 10,
        domIndex: 5,
      },
    ],
    vectors: [],
    stageElements: [],
  };
  const vVertPad = evaluateFrameInvariants(snapVertPadDeficit);
  const vertViolations = vVertPad.filter((v) => v.invariant === 'CONTAINER_PADDING_DEFICIT' && v.message.includes('vertical'));
  assert.equal(vertViolations.length, 1, 'Must detect vertical padding deficit');
  assert.equal(vertViolations[0].shortfallPx, 20, 'Shortfall must be 30 - 10 = 20px');
  totalAssertions += 2;

  // Test: No arbitrary size skips - small badge (width < 120, height < 40) is STILL verified!
  const snapSmallBadge: DOMFrameSnapshot = {
    frame: 20,
    beatId: 'b02',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Na⁺',
        rect: { x: 205, y: 305, width: 30, height: 20 },
        effectiveOpacity: 1.0,
        fontSize: 18,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [
      {
        id: 'c_small',
        tag: 'rect',
        rect: { x: 200, y: 300, width: 40, height: 30 }, // 40x30 container holding text
        backgroundColor: '#3B82F6',
        effectiveOpacity: 1.0,
        isOpaque: true,
        zIndex: 10,
        domIndex: 5,
      },
    ],
    vectors: [],
    stageElements: [],
  };
  const vSmall = evaluateFrameInvariants(snapSmallBadge);
  assert.ok(
    vSmall.some((v) => v.invariant === 'CONTAINER_PADDING_DEFICIT'),
    'Small badge with < 30px padding MUST NOT be skipped and must fail CONTAINER_PADDING_DEFICIT'
  );
  totalAssertions += 1;

  // Test: Container Overflow (text protruding outside card by > 2px)
  const snapOverflow: DOMFrameSnapshot = {
    frame: 20,
    beatId: 'b02',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Text Protruding Right',
        rect: { x: 220, y: 320, width: 250, height: 40 }, // Extends to x=470, card ends at x=400
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [
      {
        id: 'c1',
        tag: 'rect',
        rect: { x: 200, y: 300, width: 200, height: 100 },
        backgroundColor: '#1E293B',
        effectiveOpacity: 1.0,
        isOpaque: true,
        zIndex: 10,
        domIndex: 5,
      },
    ],
    vectors: [],
    stageElements: [],
  };
  const vOverflow = evaluateFrameInvariants(snapOverflow);
  const overflowViolations = vOverflow.filter((v) => v.invariant === 'CONTAINER_OVERFLOW');
  assert.equal(overflowViolations.length, 1, 'Must detect container overflow');
  assert.equal(overflowViolations[0].shortfallPx, 70, 'Overflow shortfall must be 470 - 400 = 70px');
  totalAssertions += 2;

  // Test: Compliant Card with >= 30px padding on all sides passes cleanly
  const snapCompliantCard: DOMFrameSnapshot = {
    frame: 20,
    beatId: 'b02',
    texts: [
      {
        id: 't1',
        tag: 'text',
        text: 'Compliant Text',
        rect: { x: 240, y: 340, width: 120, height: 30 }, // Left: 40px, Right: 40px, Top: 40px, Bottom: 40px
        effectiveOpacity: 1.0,
        fontSize: 24,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [
      {
        id: 'c1',
        tag: 'rect',
        rect: { x: 200, y: 300, width: 200, height: 110 },
        backgroundColor: '#0F172A',
        effectiveOpacity: 1.0,
        isOpaque: true,
        zIndex: 10,
        domIndex: 5,
      },
    ],
    vectors: [],
    stageElements: [],
  };
  const vCompliant = evaluateFrameInvariants(snapCompliantCard);
  assert.equal(vCompliant.length, 0, 'Card with >= 30px padding on all 4 sides must pass with 0 violations');
  totalAssertions += 1;

  console.log('    ✓ Gate 3 passed (9 assertions)');

  // =========================================================================
  // GATE 4: Invariant 3 - UNSHIELDED_VECTOR_PIERCE (INV-DOM-04)
  // =========================================================================
  console.log('  [Gate 4] Verifying INV-DOM-04: Line and Discretized Path Vector Piercing...');

  // Test 4A: Unshielded <line> segment piercing text AABB
  const snapLinePierce: DOMFrameSnapshot = {
    frame: 30,
    beatId: 'b03',
    texts: [
      {
        id: 't_pierced',
        tag: 'text',
        text: 'Nút Trung Tâm',
        rect: { x: 450, y: 480, width: 180, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [
      {
        id: 'vec_straight',
        type: 'line',
        p1: { x: 100, y: 500 },
        p2: { x: 900, y: 500 }, // Horizontal line at y=500 passes directly through text [y=480..520]
        strokeWidth: 2,
        rect: { x: 100, y: 500, width: 800, height: 2 },
        domIndex: 1,
        zIndex: 5,
      },
    ],
    stageElements: [],
  };
  const vLinePierce = evaluateFrameInvariants(snapLinePierce);
  assert.equal(vLinePierce.length, 1, 'Must detect unshielded vector pierce for <line>');
  assert.equal(vLinePierce[0].invariant, 'UNSHIELDED_VECTOR_PIERCE');
  assert.equal(vLinePierce[0].severity, 'CRITICAL');
  totalAssertions += 3;

  // Test 4B: Unshielded discretized <path> segment piercing text AABB
  const snapPathPierce: DOMFrameSnapshot = {
    frame: 30,
    beatId: 'b03',
    texts: [
      {
        id: 't_path_pierced',
        tag: 'text',
        text: 'Bơm Phức Hợp',
        rect: { x: 500, y: 580, width: 160, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [
      {
        id: 'vec_path_seg_12',
        type: 'path', // Discretized path segment
        p1: { x: 480, y: 600 },
        p2: { x: 550, y: 600 },
        strokeWidth: 2,
        rect: { x: 480, y: 600, width: 70, height: 2 },
        domIndex: 2,
        zIndex: 5,
      },
    ],
    stageElements: [],
  };
  const vPathPierce = evaluateFrameInvariants(snapPathPierce);
  assert.equal(vPathPierce.length, 1, 'Must detect unshielded vector pierce for discretized <path> segment');
  assert.equal(vPathPierce[0].invariant, 'UNSHIELDED_VECTOR_PIERCE');
  assert.ok(vPathPierce[0].message.includes('path segment'));
  totalAssertions += 3;

  // Test 4C: Vector segment passing behind text WITH OpaqueCard shield -> PASSES cleanly
  const snapShieldedPierce: DOMFrameSnapshot = {
    frame: 30,
    beatId: 'b03',
    texts: [
      {
        id: 't_shielded',
        tag: 'text',
        text: 'Được Bảo Vệ',
        rect: { x: 450, y: 480, width: 180, height: 40 },
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [
      {
        id: 'c_shield',
        tag: 'rect',
        rect: { x: 400, y: 440, width: 280, height: 120 }, // Encloses text completely with 50px/40px padding
        backgroundColor: '#0F172A',
        effectiveOpacity: 1.0,
        isOpaque: true,
        zIndex: 10, // Higher than vector zIndex (5)
        domIndex: 8, // Higher than vector domIndex (1)
      },
    ],
    vectors: [
      {
        id: 'vec_behind',
        type: 'line',
        p1: { x: 100, y: 500 },
        p2: { x: 900, y: 500 },
        strokeWidth: 2,
        rect: { x: 100, y: 500, width: 800, height: 2 },
        domIndex: 1,
        zIndex: 5,
      },
    ],
    stageElements: [],
  };
  const vShielded = evaluateFrameInvariants(snapShieldedPierce);
  assert.equal(vShielded.length, 0, 'Vector crossing coordinate space behind OpaqueCard must NOT flag violation');
  totalAssertions += 1;

  console.log('    ✓ Gate 4 passed (7 assertions)');

  // =========================================================================
  // GATE 5: Invariant 4 - SUBTITLE_INTRUSION (INV-DOM-05)
  // =========================================================================
  console.log('  [Gate 5] Verifying INV-DOM-05: Subtitle Intrusion & Semantic Subtitle Exclusion...');

  // Test 5A: Stage element bottom trespassing into subtitle safe zone (y + height > 1420px)
  const snapSubTrespass: DOMFrameSnapshot = {
    frame: 40,
    beatId: 'b04',
    texts: [],
    cards: [],
    vectors: [],
    stageElements: [
      {
        tag: 'rect',
        text: 'Cơ chế màng tế bào',
        rect: { x: 200, y: 1380, width: 680, height: 80 }, // bottom: 1380 + 80 = 1460 > 1420
        isSubtitle: false,
        isHud: false,
      },
    ],
  };
  const vSubTrespass = evaluateFrameInvariants(snapSubTrespass);
  assert.equal(vSubTrespass.length, 1, 'Must detect subtitle intrusion');
  assert.equal(vSubTrespass[0].invariant, 'SUBTITLE_INTRUSION');
  assert.equal(vSubTrespass[0].shortfallPx, 40, 'Shortfall must be 1460 - 1420 = 40px');
  totalAssertions += 3;

  // Test 5B: Real subtitle element at y=1500px with isSubtitle: true -> Passes cleanly
  const snapLegitSubtitle: DOMFrameSnapshot = {
    frame: 40,
    beatId: 'b04',
    texts: [],
    cards: [],
    vectors: [],
    stageElements: [
      {
        tag: 'div',
        text: 'Bơm Natri-Kali tiêu thụ năng lượng ATP',
        rect: { x: 200, y: 1480, width: 680, height: 100 }, // y=1480, bottom=1580, but isSubtitle = true
        isSubtitle: true,
        isHud: false,
      },
    ],
  };
  const vLegitSubtitle = evaluateFrameInvariants(snapLegitSubtitle);
  assert.equal(vLegitSubtitle.length, 0, 'Legitimate subtitle with isSubtitle: true must NOT be flagged as intrusion');
  totalAssertions += 1;

  console.log('    ✓ Gate 5 passed (4 assertions)');

  // =========================================================================
  // GATE 6: Invariant 5 - VIEWPORT_OVERFLOW (INV-DOM-06)
  // =========================================================================
  console.log('  [Gate 6] Verifying INV-DOM-06: Viewport Overflows & HUD Exception...');

  // Test 6A: Text overflowing left border (x < 36px)
  const snapLeftOverflow: DOMFrameSnapshot = {
    frame: 50,
    beatId: 'b05',
    texts: [
      {
        id: 't_left',
        tag: 'text',
        text: 'Tràn Lề Trái',
        rect: { x: 20, y: 500, width: 150, height: 40 }, // x = 20 < 36
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [],
    stageElements: [],
  };
  const vLeft = evaluateFrameInvariants(snapLeftOverflow);
  assert.equal(vLeft.length, 1, 'Must detect left edge viewport overflow');
  assert.equal(vLeft[0].invariant, 'VIEWPORT_OVERFLOW');
  assert.equal(vLeft[0].shortfallPx, 16, 'Shortfall must be 36 - 20 = 16px');
  totalAssertions += 3;

  // Test 6B: Text overflowing right border (x + width > 1044px)
  const snapRightOverflow: DOMFrameSnapshot = {
    frame: 50,
    beatId: 'b05',
    texts: [
      {
        id: 't_right',
        tag: 'text',
        text: 'Tràn Lề Phải',
        rect: { x: 900, y: 500, width: 170, height: 40 }, // x + w = 1070 > 1044
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [],
    stageElements: [],
  };
  const vRight = evaluateFrameInvariants(snapRightOverflow);
  assert.equal(vRight.length, 1, 'Must detect right edge viewport overflow');
  assert.equal(vRight[0].invariant, 'VIEWPORT_OVERFLOW');
  assert.equal(vRight[0].shortfallPx, 26, 'Shortfall must be 1070 - 1044 = 26px');
  totalAssertions += 3;

  // Test 6C: Stage text encroaching into notch zone (y < 80px) without HUD declaration
  const snapNotchTrespass: DOMFrameSnapshot = {
    frame: 50,
    beatId: 'b05',
    texts: [
      {
        id: 't_notch',
        tag: 'text',
        text: 'Vùng Notch Không Khai Báo',
        rect: { x: 200, y: 50, width: 300, height: 40 }, // y = 50 < 80, isHud: false
        effectiveOpacity: 1.0,
        fontSize: 32,
        isSubtitle: false,
        isHud: false,
      },
    ],
    cards: [],
    vectors: [],
    stageElements: [],
  };
  const vNotch = evaluateFrameInvariants(snapNotchTrespass);
  assert.equal(vNotch.length, 1, 'Must detect notch zone overflow for undeclared HUD');
  assert.equal(vNotch[0].shortfallPx, 30, 'Shortfall must be 80 - 50 = 30px');
  totalAssertions += 2;

  // Test 6D: Declared HUD header at y < 80px (isHud: true) passes cleanly
  const snapDeclaredHud: DOMFrameSnapshot = {
    frame: 50,
    beatId: 'b05',
    texts: [
      {
        id: 't_hud',
        tag: 'text',
        text: 'TIÊU ĐỀ BÀI GIẢNG',
        rect: { x: 200, y: 40, width: 300, height: 35 }, // y = 40 < 80, but isHud: true
        effectiveOpacity: 1.0,
        fontSize: 28,
        isSubtitle: false,
        isHud: true,
      },
    ],
    cards: [
      {
        id: 'c_hud',
        tag: 'header',
        rect: { x: 100, y: 5, width: 880, height: 110 },
        backgroundColor: '#0F172A',
        effectiveOpacity: 1.0,
        isOpaque: true,
        isHud: true,
        zIndex: 50,
        domIndex: 1,
      } as CardElement,
    ],
    vectors: [],
    stageElements: [],
  };
  const vHud = evaluateFrameInvariants(snapDeclaredHud);
  assert.equal(vHud.length, 0, 'Declared HUD element at y < 80px must NOT flag viewport overflow');
  totalAssertions += 1;

  console.log('    ✓ Gate 6 passed (9 assertions)');

  // =========================================================================
  // GATE 7: CLI Argument Parsing (INV-DOM-07)
  // =========================================================================
  console.log('  [Gate 7] Verifying INV-DOM-07: CLI Argument Parsing & Options...');

  const cli1 = parseCliArgs([
    '--project=connection-film/src/projects/sodium-potassium-pump',
    '--entry=connection-film/src/index.ts',
    '--composition=SodiumPumpComposition',
    '--frames=all',
    '--stride=5',
    '--verbose',
    '--json',
  ]);
  assert.equal(cli1.projectDir, 'connection-film/src/projects/sodium-potassium-pump');
  assert.equal(cli1.entryPoint, 'connection-film/src/index.ts');
  assert.equal(cli1.compositionId, 'SodiumPumpComposition');
  assert.equal(cli1.framesMode, 'all');
  assert.equal(cli1.stride, 5);
  assert.equal(cli1.verbose, true);
  assert.equal(cli1.json, true);
  totalAssertions += 7;

  // Positional argument parsing
  const cli2 = parseCliArgs(['connection-film/src/projects/scopus-research-gap']);
  assert.equal(cli2.projectDir, 'connection-film/src/projects/scopus-research-gap');
  assert.equal(cli2.framesMode, 'beats');
  assert.equal(cli2.verbose, false);
  assert.equal(cli2.json, false);
  totalAssertions += 4;

  console.log('    ✓ Gate 7 passed (11 assertions)');

  console.log(`\n======================================================================`);
  console.log(` ✅ ALL GATES PASSED: ${totalAssertions} assertions verified cleanly.`);
  console.log(`======================================================================\n`);

  return totalAssertions;
}

if (
  require.main === module ||
  process.argv[1]?.includes('headless-geometry-gate')
) {
  try {
    const passed = runHeadlessGeometryGateTests();
    if (passed < 40) {
      console.error(`❌ FAILED: Required >= 40 assertions, but only ran ${passed}.`);
      process.exit(1);
    }
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ HEADLESS GEOMETRY GATE TEST SUITE FAILED:');
    console.error(err?.message || err);
    console.error(err?.stack);
    process.exit(1);
  }
}
