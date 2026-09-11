/**
 * tests/challenger_m3_geometry_1_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE for Milestone M3
 * Author: challenger_m3_geometry_1 (Milestone M3 Geometry Challenger 1)
 *
 * Stress-tests the 4 layout clearance rules in validators/validate-layout-geometry.ts:
 * 1. Rule 1: Text-in-box clearance (margin >= 30px, overflow rejection).
 * 2. Rule 2: Text-vector separation (Euclidean distance >= 30px, unbacked collisions).
 * 3. Rule 3: Disjoint bounding boxes (Box_A ∩ Box_B = ∅ without gating).
 * 4. Rule 4: Stage budget 4 zones (HUD, Main Stage, Subtitle Safe Zone, OS Margin).
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
  validateLayoutGeometry,
} from '../validators/validate-layout-geometry';

export interface StressSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  vulnerabilitiesMined: Array<{
    id: string;
    title: string;
    severity: 'CRITICAL' | 'MAJOR';
    description: string;
    affectedLines: string;
    reproduction: string;
  }>;
}

export function runAdversarialGeometryStressSuite(): StressSummary {
  console.log('\n======================================================================');
  console.log(' ADVERSARIAL GEOMETRY & CLEARANCE STRESS HARNESS (M3 CHALLENGER 1)');
  console.log(' Scope: 4 Layout Clearance Rules | Parametric Stress & Failure Mining');
  console.log('======================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const vulnerabilities: StressSummary['vulnerabilitiesMined'] = [];

  function recordPass(testName: string) {
    totalTests++;
    passedTests++;
  }

  function recordFail(testName: string, message: string) {
    totalTests++;
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}: ${message}`);
  }

  function recordVulnerability(
    id: string,
    title: string,
    severity: 'CRITICAL' | 'MAJOR',
    description: string,
    affectedLines: string,
    reproduction: string
  ) {
    vulnerabilities.push({ id, title, severity, description, affectedLines, reproduction });
    console.log(`  🔍 [VULNERABILITY DISCOVERED] [${severity}] ${id}: ${title}`);
    console.log(`     Affected: ${affectedLines}`);
    console.log(`     ${description}\n`);
  }

  // =========================================================================
  // SECTION 1: RULE 1 - TEXT-IN-BOX CLEARANCE ADVERSARIAL SWEEP
  // =========================================================================
  console.log('--- [Section 1] Rule 1: Text-in-Box Clearance Stress Tests ---');

  // 1.1 Moderate Right Overflow Sweeps (within association threshold)
  {
    const widths = [200, 300, 400, 500];
    for (const w of widths) {
      const numChars = Math.floor((w * 1.3) / (30 * 0.58));
      const str = 'A'.repeat(numChars);
      const code = `
        <g>
          <rect x={0} y={0} width={${w}} height={100} />
          <text x={0} y={40} fontSize={30} textAnchor="start">
            ${str}
          </text>
        </g>
      `;
      const v = lintLayoutGeometryCode(code, `overflow-w${w}.tsx`);
      const hasOverflow = v.some(
        (item) =>
          item.rule === 'text-container-overflow' &&
          (item.ruleId === 'text-container-overflow-right' || item.severity === 'CRITICAL')
      );
      if (hasOverflow) {
        recordPass(`Moderate right overflow w=${w} rejected`);
      } else {
        recordFail(`Moderate right overflow w=${w}`, 'Validator failed to reject right container overflow');
      }
    }
  }

  // 1.2 Left Overflow Rejection
  {
    const codeLeft = `
      <g>
        <rect x={100} y={0} width={300} height={100} />
        <text x={50} y={40} fontSize={30} textAnchor="start">
          Text Spilling Left
        </text>
      </g>
    `;
    const vLeft = lintLayoutGeometryCode(codeLeft, 'left-overflow.tsx');
    const hasLeftOverflow = vLeft.some(
      (item) => item.rule === 'text-container-overflow' && item.ruleId === 'text-container-overflow-left'
    );
    if (hasLeftOverflow) {
      recordPass('Left overflow detection rejected');
    } else {
      recordFail('Left overflow detection', 'Validator failed to reject text spilling out of left border');
    }
  }

  // 1.3 Bottom Overflow Rejection
  {
    const codeBottom = `
      <g>
        <rect x={0} y={0} width={500} height={50} />
        <text x={20} y={60} fontSize={30} textAnchor="start">
          Text Spilling Bottom
        </text>
      </g>
    `;
    const vBottom = lintLayoutGeometryCode(codeBottom, 'bottom-overflow.tsx');
    const hasBottomOverflow = vBottom.some(
      (item) => item.rule === 'text-container-overflow' && item.ruleId === 'text-container-overflow-bottom'
    );
    if (hasBottomOverflow) {
      recordPass('Bottom overflow detection rejected');
    } else {
      recordFail('Bottom overflow detection', 'Validator failed to reject text spilling out of bottom border');
    }
  }

  // 1.4 Top Overflow Rejection
  {
    const codeTop = `
      <g>
        <rect x={0} y={50} width={500} height={100} />
        <text x={20} y={40} fontSize={30} textAnchor="start">
          Text Spilling Top
        </text>
      </g>
    `;
    const vTop = lintLayoutGeometryCode(codeTop, 'top-overflow.tsx');
    const hasTopOverflow = vTop.some(
      (item) => item.rule === 'text-container-overflow' && item.ruleId === 'text-container-overflow-top'
    );
    if (hasTopOverflow) {
      recordPass('Top overflow detection rejected');
    } else {
      recordFail('Top overflow detection', 'Validator failed to reject text spilling out of top border');
    }
  }

  // 1.5 Horizontal Margin Deficit (< 30px)
  {
    const codeMargin = `
      <g>
        <rect x={0} y={0} width={200} height={120} />
        <text x={100} y={60} fontSize={30} textAnchor="middle">
          MABCDEFG
        </text>
      </g>
    `;
    const vMargin = lintLayoutGeometryCode(codeMargin, 'horiz-margin.tsx');
    const hasMarginDeficit = vMargin.some(
      (item) => item.rule === 'text-container-overflow' && item.ruleId === 'text-container-margin-insufficient'
    );
    if (hasMarginDeficit) {
      recordPass('Horizontal margin deficit (< 30px) rejected');
    } else {
      recordFail('Horizontal margin deficit', 'Validator failed to reject horizontal margin < 30px');
    }
  }

  // 1.6 Bottom Margin Deficit (< 30px)
  {
    const codeBottomMargin = `
      <g>
        <rect x={0} y={0} width={600} height={80} />
        <text x={40} y={55} fontSize={30} textAnchor="start">
          Fits horizontally but tight vertically
        </text>
      </g>
    `;
    const vBottomMargin = lintLayoutGeometryCode(codeBottomMargin, 'bottom-margin.tsx');
    const hasBottomMarginDeficit = vBottomMargin.some(
      (item) => item.rule === 'text-container-overflow' && item.ruleId === 'text-container-bottom-margin'
    );
    if (hasBottomMarginDeficit) {
      recordPass('Bottom margin deficit (< 30px) rejected');
    } else {
      recordFail('Bottom margin deficit', 'Validator failed to reject bottom margin < 30px');
    }
  }

  // 1.7 Circle Node Text Overflow
  {
    const codeCircle = `
      <g>
        <circle cx={200} cy={200} r={50} fill="#1E293B" />
        <text x={200} y={200} fontSize={30} textAnchor="middle" fontFamily="monospace">
          abcdef1
        </text>
      </g>
    `;
    const vCircle = lintLayoutGeometryCode(codeCircle, 'circle-overflow.tsx');
    const hasCircleOverflow = vCircle.some(
      (item) => item.rule === 'text-container-overflow' && item.ruleId === 'text-circle-node-overflow'
    );
    if (hasCircleOverflow) {
      recordPass('Circle node text overflow rejected');
    } else {
      recordFail('Circle node text overflow', 'Validator failed to reject circle node text overflow');
    }
  }

  // 1.8 Compliant Text-in-Box Layout (100% PASS)
  {
    const codeCleanCard = `
      <g>
        <rect x={100} y={100} width={800} height={180} fill="#0F172A" />
        <text x={500} y={190} fontSize={34} textAnchor="middle" fontWeight={700}>
          CHUAN KHONG GIAN AN TOAN
        </text>
      </g>
    `;
    const vClean = lintLayoutGeometryCode(codeCleanCard, 'clean-card.tsx');
    if (vClean.length === 0) {
      recordPass('Compliant text-in-box layout passes with 0 violations');
    } else {
      recordFail('Compliant text-in-box layout', `False positive: ${JSON.stringify(vClean)}`);
    }
  }

  // 1.9 DISCOVERY: VULN-GEO-01 (Missing Top Container Margin Deficit Check)
  {
    const codePureTop = `
      <g>
        <rect x={0} y={0} width={800} height={120} />
        <text x={200} y={30} fontSize={30} textAnchor="start">
          Short Text
        </text>
      </g>
    `;
    const vTopMargin = lintLayoutGeometryCode(codePureTop, 'top-margin-deficit.tsx');
    const hasTopMarginDeficit = vTopMargin.some(
      (item) =>
        item.rule === 'text-container-overflow' &&
        (item.ruleId?.includes('top') || item.message.toLowerCase().includes('top'))
    );
    if (!hasTopMarginDeficit) {
      recordVulnerability(
        'VULN-GEO-01',
        'Missing Top Container Margin Deficit Check (dTop < 30px)',
        'CRITICAL',
        'In validators/validate-layout-geometry.ts (lines 1056-1081), the validator checks tb.yMin < box.yMin (overflow top) and dBottom < 30 (bottom margin deficit), but completely omits checking dTop < 30 && dTop >= 0. Text placed with top margin between 0px and 29.9px bypasses validation.',
        'validators/validate-layout-geometry.ts:1069-1081',
        codePureTop
      );
      recordFail('Top margin deficit check', 'Top margin < 30px (6px) silently passed with 0 violations');
    } else {
      recordPass('Top margin deficit check');
    }
  }

  // 1.10 DISCOVERY: VULN-GEO-07 (Inverse-Detection Flaw: Severe Overflow Bypass)
  {
    const codeSevereOverflow = `
      <g>
        <rect x={0} y={0} width={100} height={100} />
        <text x={0} y={40} fontSize={30} textAnchor="start">
          1234567890123456
        </text>
      </g>
    `;
    const vSevere = lintLayoutGeometryCode(codeSevereOverflow, 'severe-overflow.tsx');
    const hasViolation = vSevere.length > 0;
    if (!hasViolation) {
      recordVulnerability(
        'VULN-GEO-07',
        'Inverse-Detection Flaw in Text-Container Association (W_text > 2W + 60px)',
        'CRITICAL',
        'In validators/validate-layout-geometry.ts (lines 989-995), text is associated with a rect only if textCenter.x <= box.xMax + 30. When text severely overflows (W_text > 2*W + 60px), its center point exits this association window, causing the validator to treat the text as unrelated to the rect. Severe overflows bypass detection completely.',
        'validators/validate-layout-geometry.ts:989-995',
        codeSevereOverflow
      );
      recordFail('Severe container overflow detection', 'Severe text overflow (278px in 100px rect) was silently ignored');
    } else {
      recordPass('Severe container overflow detection');
    }
  }

  // 1.11 DISCOVERY: VULN-GEO-08 (Polygon Taper Corner Protrusion Bypass)
  {
    const codeFunnelCorner = `
      <g>
        <polygon points="-200,100 200,100 0,200" />
        <text x={0} y={150} fontSize={30} textAnchor="middle">
          ABCDEFGH
        </text>
      </g>
    `;
    const vFunnel = lintLayoutGeometryCode(codeFunnelCorner, 'funnel-corner.tsx');
    if (vFunnel.length === 0) {
      recordVulnerability(
        'VULN-GEO-08',
        'Polygon Taper Evaluation Only Samples Centerline y_mid, Ignoring Corner Protrusion',
        'MAJOR',
        'In validators/validate-layout-geometry.ts (line 1087), getPolygonHorizontalBoundsAtY is sampled only at y_mid = (tb.yMin + tb.yMax) / 2. In downward-tapering funnels or inverted polygons, text corners at yMax protrude through the polygon boundary while passing at y_mid.',
        'validators/validate-layout-geometry.ts:1087',
        codeFunnelCorner
      );
      recordFail('Polygon corner protrusion detection', 'Polygon bottom corner protrusion was silently accepted');
    } else {
      recordPass('Polygon corner protrusion detection');
    }
  }

  // =========================================================================
  // SECTION 2: RULE 2 - TEXT-VECTOR SEPARATION ADVERSARIAL SWEEP
  // =========================================================================
  console.log('--- [Section 2] Rule 2: Text-Vector Separation Stress Tests ---');

  // 2.1 Direct Superimposition on Line (0px distance)
  {
    const codeLineCol = `
      <g>
        <line x1={100} y1={200} x2={600} y2={200} stroke="#EF4444" strokeWidth={4} />
        <text x={350} y={200} fontSize={30} textAnchor="middle">
          Direct Line Superimposition
        </text>
      </g>
    `;
    const vLine = lintLayoutGeometryCode(codeLineCol, 'line-collision.tsx');
    const hasLineCol = vLine.some(
      (item) => item.rule === 'text-vector-collision' && item.ruleId === 'text-vector-superimposition'
    );
    if (hasLineCol) {
      recordPass('Direct line superimposition rejected');
    } else {
      recordFail('Direct line superimposition', 'Failed to reject text directly on line');
    }
  }

  // 2.2 Clearance Deficit (Distance 20px, < 30px)
  {
    const codeClearanceDeficit = `
      <g>
        <path d="M 100 200 L 700 200" stroke="#38BDF8" strokeWidth={4} />
        <text x={400} y={244} fontSize={30} textAnchor="middle">
          Distance 20px
        </text>
      </g>
    `;
    const vDeficit = lintLayoutGeometryCode(codeClearanceDeficit, 'line-deficit.tsx');
    const hasDeficit = vDeficit.some(
      (item) => item.rule === 'text-vector-collision' && item.ruleId === 'text-vector-clearance-deficit'
    );
    if (hasDeficit) {
      recordPass('Text-vector clearance deficit (20px) rejected');
    } else {
      recordFail('Text-vector clearance deficit', 'Failed to reject distance 20px < 30px');
    }
  }

  // 2.3 Cubic Bezier Collision (Observation 1.3 in SemCausalGraph.tsx)
  {
    const codeBezierCol = `
      <g>
        <path d="M 410,540 C 560,540 640,680 700,720" fill="none" stroke="#38BDF8" strokeWidth={4} />
        <text x={520} y={570} fontSize={30} fontWeight={700}>
          beta = 0.42***
        </text>
      </g>
    `;
    const vBezier = lintLayoutGeometryCode(codeBezierCol, 'bezier-collision.tsx');
    const hasBezierCol = vBezier.some((item) => item.rule === 'text-vector-collision');
    if (hasBezierCol) {
      recordPass('Cubic Bezier curve collision rejected');
    } else {
      recordFail('Cubic Bezier curve collision', 'Failed to reject text collision on Bezier curve');
    }
  }

  // 2.4 Exception: Opaque Badge Backing (100% PASS)
  {
    const codeBadge = `
      <g>
        <line x1={100} y1={200} x2={700} y2={200} stroke="#EF4444" strokeWidth={4} />
        <rect x={250} y={140} width={300} height={120} fill="#0F172A" />
        <text x={400} y={210} fontSize={30} textAnchor="middle">
          Short
        </text>
      </g>
    `;
    const vBadge = lintLayoutGeometryCode(codeBadge, 'badge-backed.tsx');
    const hasCollision = vBadge.some((item) => item.rule === 'text-vector-collision');
    if (!hasCollision && vBadge.length === 0) {
      recordPass('Opaque badge backing exception honored cleanly');
    } else {
      recordFail('Opaque badge backing exception', `Failed with violations: ${JSON.stringify(vBadge)}`);
    }
  }

  // 2.5 Exception: data-badge="true" attribute (100% PASS)
  {
    const codeDataBadge = `
      <g>
        <line x1={100} y1={200} x2={700} y2={200} stroke="#EF4444" strokeWidth={4} />
        <text x={400} y={210} fontSize={30} textAnchor="middle" data-badge="true">
          Badge Attr
        </text>
      </g>
    `;
    const vDataBadge = lintLayoutGeometryCode(codeDataBadge, 'data-badge.tsx');
    const hasCollision = vDataBadge.some((item) => item.rule === 'text-vector-collision');
    if (!hasCollision) {
      recordPass('data-badge attribute exception honored');
    } else {
      recordFail('data-badge attribute exception', 'data-badge was incorrectly flagged as collision');
    }
  }

  // 2.6 DISCOVERY: VULN-GEO-02 (Quadratic Bezier Q Commands Ignored)
  {
    const codeQCol = `
      <g>
        <path d="M 100 100 Q 300 50 500 100" stroke="#38BDF8" strokeWidth={4} />
        <text x={300} y={70} fontSize={30} textAnchor="middle">
          Direct Q Curve Collision
        </text>
      </g>
    `;
    const vQ = lintLayoutGeometryCode(codeQCol, 'q-collision.tsx');
    const hasQCol = vQ.some((item) => item.rule === 'text-vector-collision');
    if (!hasQCol) {
      recordVulnerability(
        'VULN-GEO-02',
        'Quadratic Bezier (Q) Path Commands Ignored in parseSvgPathSegments',
        'MAJOR',
        'In validators/validate-layout-geometry.ts (lines 449-553), parseSvgPathSegments only handles commands M, L, H, V, C, Z. Quadratic curves (Q) are not parsed, allowing direct collisions over quadratic curves to silently bypass the validator.',
        'validators/validate-layout-geometry.ts:449-553',
        codeQCol
      );
      recordFail('Quadratic Bezier collision rejection', 'Q curve collision was silently accepted');
    } else {
      recordPass('Quadratic Bezier collision rejection');
    }
  }

  // 2.7 DISCOVERY: VULN-GEO-03 (Text inside <tspan> ignored)
  {
    const codeTspan = `
      <g>
        <line x1={100} y1={200} x2={700} y2={200} stroke="#EF4444" strokeWidth={4} />
        <text x={400} y={200} fontSize={30} textAnchor="middle">
          <tspan>Direct Collision in Tspan</tspan>
        </text>
      </g>
    `;
    const vTspan = lintLayoutGeometryCode(codeTspan, 'tspan-collision.tsx');
    const hasTspanCol = vTspan.some((item) => item.rule === 'text-vector-collision');
    if (!hasTspanCol) {
      recordVulnerability(
        'VULN-GEO-03',
        'Text Inside <tspan> Elements Completely Ignored by AST Extractor',
        'CRITICAL',
        'In validators/validate-layout-geometry.ts (lines 693-728), extractTextStringFromChildren only checks JSXText, StringLiteral, and JSXExpressionContainer. Child JSXElements (such as <tspan>) are skipped, causing text wrapped in <tspan> to produce an empty string and completely evade all clearance and overflow checks.',
        'validators/validate-layout-geometry.ts:693-728',
        codeTspan
      );
      recordFail('Tspan text vector collision rejection', '<tspan> collision was silently ignored');
    } else {
      recordPass('Tspan text vector collision rejection');
    }
  }

  // =========================================================================
  // SECTION 3: RULE 3 - DISJOINT BOUNDING BOXES (Box_A ∩ Box_B = ∅)
  // =========================================================================
  console.log('--- [Section 3] Rule 3: Disjoint Sibling Bounding Boxes Stress Tests ---');

  // 3.1 CSS Positioned Overlapping Siblings (HTML divs)
  {
    const codeCssOverlap = `
      <div style={{ position: 'relative', width: 1080, height: 1920 }}>
        <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
          <p style={{ fontSize: 34 }}>Beat 1 Content</p>
        </div>
        <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
          <p style={{ fontSize: 34 }}>Beat 2 Content</p>
        </div>
      </div>
    `;
    const vCss = lintLayoutGeometryCode(codeCssOverlap, 'css-overlap.tsx');
    const hasOverlap = vCss.some(
      (item) => item.rule === 'bounding-box-overlap' && item.ruleId === 'sibling-container-overlap'
    );
    if (hasOverlap) {
      recordPass('CSS absolute positioned sibling overlap rejected');
    } else {
      recordFail('CSS absolute positioned sibling overlap', 'Failed to reject CSS overlapping containers');
    }
  }

  // 3.2 Mutually Exclusive Condition-Gated Siblings (100% PASS)
  {
    const codeGated = `
      <div style={{ position: 'relative', width: 1080, height: 1920 }}>
        {phase === 1 && (
          <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
            <p style={{ fontSize: 34 }}>Phase 1</p>
          </div>
        )}
        {phase === 2 && (
          <div style={{ position: 'absolute', top: 400, left: 100, width: 800, height: 300 }}>
            <p style={{ fontSize: 34 }}>Phase 2</p>
          </div>
        )}
      </div>
    `;
    const vGated = lintLayoutGeometryCode(codeGated, 'gated-siblings.tsx');
    const hasOverlap = vGated.some((item) => item.rule === 'bounding-box-overlap');
    if (!hasOverlap) {
      recordPass('Mutually exclusive condition-gated siblings pass cleanly');
    } else {
      recordFail('Mutually exclusive condition-gated siblings', 'Incorrectly flagged gated siblings as overlap');
    }
  }

  // 3.3 DISCOVERY: VULN-GEO-04 (Double-Transform Bug for SVG <g> Containers)
  {
    const codeSvgOverlap = `
      <g>
        <g transform="translate(100, 200)">
          <rect x={0} y={0} width={100} height={100} />
        </g>
        <g transform="translate(150, 250)">
          <rect x={0} y={0} width={100} height={100} />
        </g>
      </g>
    `;
    const vSvgOverlap = lintLayoutGeometryCode(codeSvgOverlap, 'svg-sibling-overlap.tsx');
    const hasSvgOverlap = vSvgOverlap.some((item) => item.rule === 'bounding-box-overlap');
    if (!hasSvgOverlap) {
      recordVulnerability(
        'VULN-GEO-04',
        'Double-Transform Calculation in computeElementSubTreeBox for SVG <g> Containers',
        'CRITICAL',
        'In validators/validate-layout-geometry.ts (line 967 and lines 1278-1288), when inspecting sibling containers, localTransform already contains the child transform. Passing it to computeElementSubTreeBox causes the transform to be parsed and added AGAIN, doubling the coordinates (tx -> 2*tx, ty -> 2*ty). This artificially shifts overlapping sibling containers away from each other, causing real 50px x 50px geometric collisions to silently PASS with 0 violations.',
        'validators/validate-layout-geometry.ts:967,1278-1288',
        codeSvgOverlap
      );
      recordFail('SVG transform sibling container overlap rejection', 'SVG sibling overlap (50px x 50px) silently passed due to double-transform bug');
    } else {
      recordPass('SVG transform sibling container overlap rejection');
    }
  }

  // =========================================================================
  // SECTION 4: RULE 4 - STAGE BUDGET 4 ZONES (Y in [220, 1420])
  // =========================================================================
  console.log('--- [Section 4] Rule 4: Stage Budget 4 Zones Stress Tests ---');

  // 4.1 SVG Transform Notch Trespass (y in [0, 80])
  {
    const codeNotch = `
      <g transform="translate(540, 40)">
        <rect x={-200} y={0} width={400} height={100} fill="#38BDF8" />
      </g>
    `;
    const vNotch = lintLayoutGeometryCode(codeNotch, 'notch-trespass.tsx');
    const hasNotch = vNotch.some(
      (item) => item.rule === 'stage-zone-violation' && item.ruleId === 'notch-margin-trespass'
    );
    if (hasNotch) {
      recordPass('Notch margin trespass rejected (ty=40px)');
    } else {
      recordFail('Notch margin trespass rejection', 'Failed to reject mechanism in Notch zone');
    }
  }

  // 4.2 SVG Transform Subtitle Safe Zone Trespass (y in [1420, 1720])
  {
    const codeSub = `
      <g transform="translate(540, 1550)">
        <rect x={-300} y={0} width={600} height={100} fill="#38BDF8" />
      </g>
    `;
    const vSub = lintLayoutGeometryCode(codeSub, 'subtitle-trespass.tsx');
    const hasSub = vSub.some(
      (item) => item.rule === 'stage-zone-violation' && item.ruleId === 'subtitle-zone-trespass'
    );
    if (hasSub) {
      recordPass('Subtitle safe zone trespass rejected (ty=1550px)');
    } else {
      recordFail('Subtitle safe zone trespass rejection', 'Failed to reject mechanism in Subtitle zone');
    }
  }

  // 4.3 SVG Transform OS Margin Trespass (y > 1720)
  {
    const codeOs = `
      <g transform="translate(540, 1800)">
        <rect x={-300} y={0} width={600} height={100} fill="#38BDF8" />
      </g>
    `;
    const vOs = lintLayoutGeometryCode(codeOs, 'os-trespass.tsx');
    const hasOs = vOs.some(
      (item) => item.rule === 'stage-zone-violation' && item.ruleId === 'os-margin-trespass'
    );
    if (hasOs) {
      recordPass('OS navigation margin trespass rejected (ty=1800px)');
    } else {
      recordFail('OS navigation margin trespass rejection', 'Failed to reject mechanism in OS zone');
    }
  }

  // 4.4 CSS Style Subtitle Safe Zone Trespass (top: 1550px)
  {
    const codeCssSub = `
      <div style={{ position: 'absolute', top: 1550, left: 100, width: 800, height: 100 }}>
        <p style={{ fontSize: 34 }}>Mechanism in Subtitle Zone</p>
      </div>
    `;
    const vCssSub = lintLayoutGeometryCode(codeCssSub, 'css-sub-trespass.tsx');
    const hasCssSub = vCssSub.some(
      (item) => item.rule === 'stage-zone-violation' && item.ruleId === 'css-subtitle-zone-trespass'
    );
    if (hasCssSub) {
      recordPass('CSS subtitle safe zone trespass rejected (top=1550px)');
    } else {
      recordFail('CSS subtitle safe zone trespass rejection', 'Failed to reject CSS top in Subtitle zone');
    }
  }

  // 4.5 DISCOVERY: VULN-GEO-05 (CSS style.top Ignores Notch < 80px and OS Margin > 1720px)
  {
    const codeCssNotch = `
      <div style={{ position: 'absolute', top: 40, left: 100, width: 800, height: 100 }}>
        <p style={{ fontSize: 34 }}>Mechanism in Notch Margin</p>
      </div>
    `;
    const vCssNotch = lintLayoutGeometryCode(codeCssNotch, 'css-notch-trespass.tsx');
    const hasCssNotch = vCssNotch.some((item) => item.rule === 'stage-zone-violation');
    if (!hasCssNotch) {
      recordVulnerability(
        'VULN-GEO-05',
        'CSS style.top Only Checks Subtitle Zone, Ignoring Notch (< 80px) and OS Margin (> 1720px)',
        'CRITICAL',
        'In validators/validate-layout-geometry.ts (lines 1496-1508), the style.top inspector strictly evaluates: if (topVal !== null && topVal > 1420 && topVal < 1720). It completely neglects to check topVal < 80 (Notch trespass) or topVal >= 1720 (OS navigation margin trespass). Any HTML-based mechanism mounted at top: 40px or top: 1800px completely bypasses the Stage Zone validator.',
        'validators/validate-layout-geometry.ts:1496-1508',
        codeCssNotch
      );
      recordFail('CSS notch margin trespass rejection', 'CSS top: 40px in Notch zone was silently accepted');
    } else {
      recordPass('CSS notch margin trespass rejection');
    }
  }

  // 4.6 DISCOVERY: VULN-GEO-06 (Boundary Condition Bug at y=0)
  {
    const codeY0 = `
      <g transform="translate(540, 0)">
        <rect x={-400} y={0} width={800} height={200} fill="#0F172A" />
        <text x={0} y={100} fontSize={30} textAnchor="middle">
          Mounted at Y=0
        </text>
      </g>
    `;
    const vY0 = lintLayoutGeometryCode(codeY0, 'y0-trespass.tsx');
    const hasY0 = vY0.some((item) => item.rule === 'stage-zone-violation');
    if (!hasY0) {
      recordVulnerability(
        'VULN-GEO-06',
        'Boundary Condition Bug at y=0 (ty > 0 Condition Skips y=0)',
        'MAJOR',
        'In validators/validate-layout-geometry.ts (line 1443), the Notch trespass condition is written as if (ty > 0 && ty < 80). When ty is exactly 0 (the extreme top of the mobile notch), ty > 0 evaluates to false. An element mounted at transform="translate(540, 0)" evades the notch zone violation check.',
        'validators/validate-layout-geometry.ts:1443',
        codeY0
      );
      recordFail('Boundary y=0 notch margin trespass rejection', 'ty=0 in Notch margin was silently accepted');
    } else {
      recordPass('Boundary y=0 notch margin trespass rejection');
    }
  }

  // 4.7 Compliant Main Stage Mechanisms (Zone 2, y in [220, 1420]) (100% PASS)
  {
    const yLevels = [300, 500, 700, 900, 1100, 1300];
    for (const y of yLevels) {
      const codeCleanZone = `
        <g transform="translate(540, ${y})">
          <rect x={-400} y={0} width={800} height={100} fill="#0F172A" />
          <text x={0} y={55} fontSize={30} textAnchor="middle">
            Stage Zone 2 Compliant at y=${y}
          </text>
        </g>
      `;
      const vClean = lintLayoutGeometryCode(codeCleanZone, `clean-zone-${y}.tsx`);
      const hasZoneViolation = vClean.some((item) => item.rule === 'stage-zone-violation');
      if (!hasZoneViolation) {
        recordPass(`Stage Zone 2 compliant element at y=${y} passes cleanly`);
      } else {
        recordFail(`Stage Zone 2 compliant element at y=${y}`, `False positive: ${JSON.stringify(vClean)}`);
      }
    }
  }

  // =========================================================================
  // SECTION 5: ROBUSTNESS, INTEGRITY & FAIL-CLOSED GATES
  // =========================================================================
  console.log('--- [Section 5] Robustness & Fail-Closed Gate Integrity Tests ---');

  // 5.1 Missing Target Path -> Fail Closed with CRITICAL
  {
    const res = validateLayoutGeometry(['non-existent-path-for-geometry-test.tsx']);
    assert.strictEqual(res.passed, false, 'Missing target must fail');
    assert.strictEqual(res.criticalCount > 0, true, 'Missing target must emit CRITICAL violation');
    const hasPathNotFound = res.violations.some((v) => v.rule === 'target-path-not-found');
    assert.strictEqual(hasPathNotFound, true, 'Must specify target-path-not-found rule');
    recordPass('Missing target path fails closed with target-path-not-found');
  }

  // 5.2 Syntax Error in TSX -> Fail Closed with CRITICAL
  {
    const badSyntax = `const broken = (<g><rect><text></g>);`;
    const vSyntax = lintLayoutGeometryCode(badSyntax, 'syntax-err.tsx');
    assert.strictEqual(vSyntax.length > 0, true, 'Syntax error must produce violation');
    assert.strictEqual(vSyntax[0].rule, 'syntax-error', 'Must report syntax-error rule');
    assert.strictEqual(vSyntax[0].severity, 'CRITICAL', 'Syntax error must be CRITICAL');
    recordPass('Syntax error fails closed with CRITICAL syntax-error');
  }

  // 5.3 Empty Code String -> Clean return with []
  {
    const vEmpty = lintLayoutGeometryCode('', 'empty.tsx');
    assert.strictEqual(vEmpty.length, 0, 'Empty code string must return empty violations list');
    recordPass('Empty code string handled gracefully');
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n======================================================================');
  console.log(' ADVERSARIAL STRESS TEST SUMMARY:');
  console.log(` Total Programmatic Tests Run: ${totalTests}`);
  console.log(` Tests Passed:                ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(` Tests Failed:                ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(` Vulnerabilities Mined:       ${vulnerabilities.length}`);
  console.log('======================================================================\n');

  return {
    totalTests,
    passedTests,
    failedTests,
    vulnerabilitiesMined: vulnerabilities,
  };
}

const isDirectRun =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? process.argv[1].endsWith('challenger_m3_geometry_1_stress.test.ts')
    : false;

if (isDirectRun) {
  runAdversarialGeometryStressSuite();
}
