#!/usr/bin/env tsx
/**
 * LAYOUT GEOMETRY & ZERO-COLLISION AST VALIDATOR (TIER 2 QA GATE)
 * 
 * Inspects scene and mechanism TSX ASTs using Babel/TypeScript parser to enforce
 * mathematical and spatial clearance invariants (Requirement R1 & R5):
 * 
 * 1. Check 1 (Text-in-Box Clearance): If a <text> is enclosed or co-located with a
 *    <rect>, <polygon>, <circle>, or card container, verify text bounding box fits
 *    within container with margin >= 30px (container width >= text width + 60px,
 *    container height >= line height + 60px).
 * 2. Check 2 (Text-Vector Separation): Detect direct superimposition of text over
 *    vector paths/strokes (<path>, <line>). Enforce minimum Euclidean distance >= 30px.
 * 3. Check 3 (Sibling Box Clearance): Detect overlapping sibling containers
 *    (Box_A ∩ Box_B != ∅) when both are rendered simultaneously without phase/opacity gating.
 * 4. Check 4 (Stage Zone Boundaries): Verify primary mechanism elements remain within
 *    Explanatory Stage Zone 2 (y in [220, 1420]) and do not trespass into Subtitle
 *    Safe Zone (y in [1420, 1720]) or OS margin (y > 1720).
 * 
 * CLI: npx tsx validators/validate-layout-geometry.ts <targetDirOrFile> [options]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@babel/parser';
// @ts-ignore - babel traverse module resolution
import traverseModule from '@babel/traverse';

const traverse = (traverseModule as any).default || traverseModule;

export type GeometryRule =
  | 'text-container-overflow'
  | 'text-vector-collision'
  | 'bounding-box-overlap'
  | 'stage-zone-violation'
  | 'syntax-error'
  | 'target-path-not-found'
  | 'zero-files-analyzed';

export type GeometrySeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface GeometryViolation {
  file: string;
  line: number;
  column: number;
  rule: GeometryRule;
  ruleId?: string;
  severity: GeometrySeverity;
  message: string;
  shortfallPx?: number;
  snippet?: string;
}

export interface GeometryValidationResult {
  filesAnalyzed: number;
  violations: GeometryViolation[];
  passed: boolean;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
}

export interface GeometryValidatorOptions {
  json?: boolean;
  strict?: boolean;
  verbose?: boolean;
}

// -----------------------------------------------------------------------------
// 1. Geometric Data Structures & Math Helpers
// -----------------------------------------------------------------------------

export interface Point2D {
  x: number;
  y: number;
}

export interface Box2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  width: number;
  height: number;
}

export interface TextBounds extends Box2D {
  text: string;
  fontSize: number;
  anchor: string;
  xOffset: number;
  yOffset: number;
}

export interface ContainerShape {
  type: 'rect' | 'polygon' | 'circle' | 'ellipse';
  box: Box2D;
  polygonPoints?: Point2D[];
  circleRadius?: number;
  circleCenter?: Point2D;
  loc: { line: number; column: number };
  rawTag: string;
  fill?: string;
  isOpaque?: boolean;
}

export interface VectorPathSegment {
  p1: Point2D;
  p2: Point2D;
}

export interface VectorPathElement {
  segments: VectorPathSegment[];
  loc: { line: number; column: number };
  rawD: string;
  strokeWidth: number;
}

/**
 * Deterministic estimation of rendered text bounding box in 1080x1920 mobile viewport.
 * Calibrated font metrics: Sans-serif: 0.58 regular, 0.65 bold/uppercase, Mono: 0.60.
 */
export function estimateTextBounds(
  text: string,
  fontSize: number,
  x: number = 0,
  y: number = 0,
  anchor: string = 'start',
  isMonospace: boolean = false,
  fontWeight: number | string = 400
): TextBounds {
  const isBold =
    fontWeight === 'bold' ||
    fontWeight === '700' ||
    fontWeight === 700 ||
    fontWeight === '800' ||
    fontWeight === 800 ||
    fontWeight === '900' ||
    fontWeight === 900;

  let charFactor = isMonospace ? 0.60 : isBold ? 0.65 : 0.58;

  // Account for heavy Vietnamese uppercase / capital acronyms
  const upperCount = (text.match(/[A-ZÀ-Ỹ]/g) || []).length;
  if (upperCount > text.length * 0.4 && !isMonospace) {
    charFactor = Math.max(charFactor, 0.65);
  }

  const effectiveChars = Math.max(text.length, 1);
  const width = effectiveChars * fontSize * charFactor;
  // Typography line height: 1.2x font size
  const height = fontSize * 1.2;

  let xOffset = 0;
  if (anchor === 'middle') xOffset = -width / 2;
  else if (anchor === 'end') xOffset = -width;

  // In SVG, y is baseline. Typographic ascent is approx 0.8 * fontSize above baseline
  const yOffset = -fontSize * 0.8;

  const xMin = x + xOffset;
  const xMax = xMin + width;
  const yMin = y + yOffset;
  const yMax = yMin + height;

  return {
    text,
    fontSize,
    anchor,
    xOffset,
    yOffset,
    xMin,
    xMax,
    yMin,
    yMax,
    width,
    height,
  };
}

/**
 * Computes intersection between two axis-aligned 2D bounding boxes.
 */
export function computeBoxIntersection(
  boxA: Box2D,
  boxB: Box2D
): { intersects: boolean; overlapW: number; overlapH: number } {
  const rawOverlapW = Math.min(boxA.xMax, boxB.xMax) - Math.max(boxA.xMin, boxB.xMin);
  const rawOverlapH = Math.min(boxA.yMax, boxB.yMax) - Math.max(boxA.yMin, boxB.yMin);
  const intersects = rawOverlapW > 0 && rawOverlapH > 0;
  return {
    intersects,
    overlapW: intersects ? rawOverlapW : 0,
    overlapH: intersects ? rawOverlapH : 0,
  };
}

/**
 * Checks if two bounding boxes are completely disjoint (Box_A ∩ Box_B = ∅).
 */
export function isBoxesDisjoint(boxA: Box2D, boxB: Box2D): boolean {
  return !computeBoxIntersection(boxA, boxB).intersects;
}

/**
 * Tapered Geometric Funnel Width at vertical coordinate y.
 * W(y) = W_top - (W_top - W_bot) * (y - y0) / H_f
 */
export function calculateFunnelWidthAtY(
  y: number,
  y0: number,
  height: number,
  wTop: number,
  wBot: number
): number {
  if (height <= 0) return wTop;
  const progress = Math.max(0, Math.min(1, (y - y0) / height));
  return wTop - (wTop - wBot) * progress;
}

/**
 * Maximum allowable text width within a funnel at vertical coordinate y.
 * W_text_max(y) = W(y) - 2 * M_safe = W(y) - 60px
 */
export function calculateFunnelMaxTextWidth(
  widthAtY: number,
  safeMargin: number = 30
): number {
  return Math.max(0, widthAtY - 2 * safeMargin);
}

/**
 * Minimum Node Radius to contain text with safe clearance.
 * R_min >= sqrt((W_text / 2)^2 + (H_text / 2)^2) + safeMargin
 */
export function calculateMinNodeRadius(
  textWidth: number,
  textHeight: number,
  safeMargin: number = 30
): number {
  const halfW = textWidth / 2;
  const halfH = textHeight / 2;
  return Math.sqrt(halfW * halfW + halfH * halfH) + safeMargin;
}

/**
 * Directed Edge Label Perpendicular Displacement.
 * |d_perp| >= H_text / 2 + strokeWidth / 2 + safeMargin
 */
export function calculateEdgeLabelDisplacement(
  textHeight: number,
  strokeWidth: number,
  safeMargin: number = 30
): number {
  return textHeight / 2 + strokeWidth / 2 + safeMargin;
}

/**
 * Unit Normal Vector to a 2D line segment (p1 -> p2).
 * Tangent: t = (dx, dy) / len. Normal: n = (-t_y, t_x).
 */
export function calculateUnitNormal(p1: Point2D, p2: Point2D): Point2D {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: -1 };
  const nx = -dy / len;
  const ny = dx / len;
  return { x: Object.is(nx, -0) || nx === 0 ? 0 : nx, y: Object.is(ny, -0) || ny === 0 ? 0 : ny };
}

/**
 * Computes edge label position displaced normally from segment midpoint.
 */
export function computeEdgeLabelPosition(
  p1: Point2D,
  p2: Point2D,
  displacement: number,
  normalDirection: 1 | -1 = 1
): Point2D {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const n = calculateUnitNormal(p1, p2);
  return {
    x: midX + normalDirection * displacement * n.x,
    y: midY + normalDirection * displacement * n.y,
  };
}

/**
 * Canonical 1080x1920 Stage Partition Budget
 */
export const STAGE_BUDGET_ZONES = {
  NOTCH_MARGIN: { yMin: 0, yMax: 80, name: 'Mobile Notch & Status Bar Margin' },
  HUD: { yMin: 80, yMax: 220, name: 'Semantic HUD & Anchor Zone' },
  MAIN_STAGE: {
    yMin: 220,
    yMax: 1420,
    xMin: 80,
    xMax: 1000,
    maxWidth: 920,
    name: 'Primary Explanatory Kinetic Stage',
  },
  SUBTITLE_SAFE_ZONE: { yMin: 1420, yMax: 1720, name: 'Subtitle Clearance Safe Zone' },
  OS_NAV_MARGIN: { yMin: 1720, yMax: 1920, name: 'Mobile OS Navigation Bar Margin' },
} as const;

export type StageZoneName = keyof typeof STAGE_BUDGET_ZONES;

/**
 * Evaluates whether a vertical coordinate y falls in the expected stage zone.
 */
export function evaluateStageZone(y: number): {
  zone: StageZoneName;
  isMainStage: boolean;
  isSubtitleTrespass: boolean;
  isOsTrespass: boolean;
  isNotchTrespass: boolean;
} {
  if (y < 80) {
    return {
      zone: 'NOTCH_MARGIN',
      isMainStage: false,
      isSubtitleTrespass: false,
      isOsTrespass: false,
      isNotchTrespass: true,
    };
  }
  if (y < 220) {
    return {
      zone: 'HUD',
      isMainStage: false,
      isSubtitleTrespass: false,
      isOsTrespass: false,
      isNotchTrespass: false,
    };
  }
  if (y <= 1420) {
    return {
      zone: 'MAIN_STAGE',
      isMainStage: true,
      isSubtitleTrespass: false,
      isOsTrespass: false,
      isNotchTrespass: false,
    };
  }
  if (y <= 1720) {
    return {
      zone: 'SUBTITLE_SAFE_ZONE',
      isMainStage: false,
      isSubtitleTrespass: true,
      isOsTrespass: false,
      isNotchTrespass: false,
    };
  }
  return {
    zone: 'OS_NAV_MARGIN',
    isMainStage: false,
    isSubtitleTrespass: false,
    isOsTrespass: true,
    isNotchTrespass: false,
  };
}

/**
 * Calculates Euclidean distance between point (px, py) and segment (p1, p2).
 */
export function distancePointToSegment(p: Point2D, p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(p.x - p1.x, p.y - p1.y);
  }
  const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lenSq));
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Checks if line segment (p1, p2) intersects axis-aligned bounding box.
 */
export function segmentIntersectsBox(p1: Point2D, p2: Point2D, box: Box2D): boolean {
  if (p1.x >= box.xMin && p1.x <= box.xMax && p1.y >= box.yMin && p1.y <= box.yMax) return true;
  if (p2.x >= box.xMin && p2.x <= box.xMax && p2.y >= box.yMin && p2.y <= box.yMax) return true;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let t0 = 0.0;
  let t1 = 1.0;

  const p = [-dx, dx, -dy, dy];
  const q = [p1.x - box.xMin, box.xMax - p1.x, p1.y - box.yMin, box.yMax - p1.y];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 <= t1;
}

/**
 * Calculates minimum distance between axis-aligned box and line segment.
 */
export function distanceBoxToSegment(box: Box2D, p1: Point2D, p2: Point2D): number {
  if (segmentIntersectsBox(p1, p2, box)) {
    return 0.0;
  }

  const corners: Point2D[] = [
    { x: box.xMin, y: box.yMin },
    { x: box.xMax, y: box.yMin },
    { x: box.xMin, y: box.yMax },
    { x: box.xMax, y: box.yMax },
  ];

  let minDist = Infinity;
  for (const c of corners) {
    minDist = Math.min(minDist, distancePointToSegment(c, p1, p2));
  }

  const clampEndpointDist = (pt: Point2D) => {
    const cx = Math.max(box.xMin, Math.min(box.xMax, pt.x));
    const cy = Math.max(box.yMin, Math.min(box.yMax, pt.y));
    return Math.hypot(pt.x - cx, pt.y - cy);
  };

  minDist = Math.min(minDist, clampEndpointDist(p1));
  minDist = Math.min(minDist, clampEndpointDist(p2));

  return minDist;
}

/**
 * Parses SVG path d attribute string into polyline segments.
 * Supports M, L, H, V, C (Cubic Bezier sampled at 12 steps), and Z.
 */
export function parseSvgPathSegments(d: string): VectorPathSegment[] {
  const segments: VectorPathSegment[] = [];
  if (!d || !d.trim()) return segments;

  const cmdRegex = /([a-df-z])([^a-df-z]*)/gi;
  let match;
  let curr: Point2D = { x: 0, y: 0 };
  let startP: Point2D = { x: 0, y: 0 };

  while ((match = cmdRegex.exec(d)) !== null) {
    const cmd = match[1];
    const rawArgs = match[2].trim();
    const args = rawArgs
      .replace(/,/g, ' ')
      .replace(/([0-9])-(\d)/g, '$1 -$2')
      .split(/\s+/)
      .filter(Boolean)
      .map(parseFloat);

    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();

    if (type === 'M') {
      let idx = 0;
      while (idx + 1 < args.length) {
        const x = isRel ? curr.x + args[idx] : args[idx];
        const y = isRel ? curr.y + args[idx + 1] : args[idx + 1];
        if (idx === 0) {
          curr = { x, y };
          startP = { x, y };
        } else {
          segments.push({ p1: { ...curr }, p2: { x, y } });
          curr = { x, y };
        }
        idx += 2;
      }
    } else if (type === 'L') {
      let idx = 0;
      while (idx + 1 < args.length) {
        const x = isRel ? curr.x + args[idx] : args[idx];
        const y = isRel ? curr.y + args[idx + 1] : args[idx + 1];
        segments.push({ p1: { ...curr }, p2: { x, y } });
        curr = { x, y };
        idx += 2;
      }
    } else if (type === 'H') {
      for (const arg of args) {
        const x = isRel ? curr.x + arg : arg;
        segments.push({ p1: { ...curr }, p2: { x, y: curr.y } });
        curr = { x, y: curr.y };
      }
    } else if (type === 'V') {
      for (const arg of args) {
        const y = isRel ? curr.y + arg : arg;
        segments.push({ p1: { ...curr }, p2: { x: curr.x, y } });
        curr = { x, y: curr.x };
      }
    } else if (type === 'C') {
      let idx = 0;
      while (idx + 5 < args.length) {
        const cp1x = isRel ? curr.x + args[idx] : args[idx];
        const cp1y = isRel ? curr.y + args[idx + 1] : args[idx + 1];
        const cp2x = isRel ? curr.x + args[idx + 2] : args[idx + 2];
        const cp2y = isRel ? curr.y + args[idx + 3] : args[idx + 3];
        const endX = isRel ? curr.x + args[idx + 4] : args[idx + 4];
        const endY = isRel ? curr.y + args[idx + 5] : args[idx + 5];

        const p0 = { ...curr };
        const p1 = { x: cp1x, y: cp1y };
        const p2 = { x: cp2x, y: cp2y };
        const p3 = { x: endX, y: endY };

        const steps = 12;
        let prev = p0;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const invT = 1 - t;
          const bx =
            invT * invT * invT * p0.x +
            3 * invT * invT * t * p1.x +
            3 * invT * t * t * p2.x +
            t * t * t * p3.x;
          const by =
            invT * invT * invT * p0.y +
            3 * invT * invT * t * p1.y +
            3 * invT * t * t * p2.y +
            t * t * t * p3.y;
          const next = { x: bx, y: by };
          segments.push({ p1: prev, p2: next });
          prev = next;
        }

        curr = { x: endX, y: endY };
        idx += 6;
      }
    } else if (type === 'Q') {
      let idx = 0;
      while (idx + 3 < args.length) {
        const cp1x = isRel ? curr.x + args[idx] : args[idx];
        const cp1y = isRel ? curr.y + args[idx + 1] : args[idx + 1];
        const endX = isRel ? curr.x + args[idx + 2] : args[idx + 2];
        const endY = isRel ? curr.y + args[idx + 3] : args[idx + 3];

        const p0 = { ...curr };
        const p1 = { x: cp1x, y: cp1y };
        const p2 = { x: endX, y: endY };

        const steps = 12;
        let prev = p0;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const invT = 1 - t;
          const bx = invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x;
          const by = invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y;
          const next = { x: bx, y: by };
          segments.push({ p1: prev, p2: next });
          prev = next;
        }

        curr = { x: endX, y: endY };
        idx += 4;
      }
    } else if (type === 'Z') {
      if (curr.x !== startP.x || curr.y !== startP.y) {
        segments.push({ p1: { ...curr }, p2: { ...startP } });
        curr = { ...startP };
      }
    }
  }

  return segments;
}

/**
 * Parses SVG polygon points string ("x1,y1 x2,y2 ...").
 */
export function parsePolygonPoints(pointsStr: string): Point2D[] {
  const points: Point2D[] = [];
  if (!pointsStr || !pointsStr.trim()) return points;

  const raw = pointsStr.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const x = parseFloat(raw[i]);
    const y = parseFloat(raw[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Calculates horizontal left and right boundaries of a polygon at scanline Y.
 */
export function getPolygonHorizontalBoundsAtY(points: Point2D[], y: number): { xLeft: number; xRight: number } | null {
  if (points.length < 3) return null;
  const xIntersections: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
      const t = (y - p1.y) / (p2.y - p1.y);
      const x = p1.x + t * (p2.x - p1.x);
      xIntersections.push(x);
    }
  }

  if (xIntersections.length < 2) return null;
  xIntersections.sort((a, b) => a - b);
  return {
    xLeft: xIntersections[0],
    xRight: xIntersections[xIntersections.length - 1],
  };
}

/**
 * Parses SVG transform string: translate(tx, ty), scale(s).
 */
export function parseTransformString(str: string): { tx: number; ty: number; scale: number; isDynamic: boolean } {
  let tx = 0;
  let ty = 0;
  let scale = 1.0;
  let isDynamic = false;

  const translateMatch = /translate\(\s*([-0-9.]+)(?:[\s,]+([-0-9.]+))?\s*\)/i.exec(str);
  if (translateMatch) {
    tx = parseFloat(translateMatch[1]) || 0;
    ty = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
  } else if (/translate\(/i.test(str)) {
    isDynamic = true;
  }

  const scaleMatch = /scale\(\s*([-0-9.]+)(?:[\s,]+([-0-9.]+))?\s*\)/i.exec(str);
  if (scaleMatch) {
    scale = parseFloat(scaleMatch[1]) || 1.0;
  }

  return { tx, ty, scale, isDynamic };
}

// -----------------------------------------------------------------------------
// 2. AST Extraction Helpers
// -----------------------------------------------------------------------------

function extractNumericValue(attrNode: any, scope: any): number | null {
  if (!attrNode) return null;

  if (attrNode.type === 'NumericLiteral') {
    return attrNode.value;
  }

  if (attrNode.type === 'StringLiteral') {
    const match = attrNode.value.trim().match(/^([-0-9.]+)(?:px)?$/);
    return match ? parseFloat(match[1]) : null;
  }

  if (attrNode.type === 'UnaryExpression' && attrNode.operator === '-') {
    const val = extractNumericValue(attrNode.argument, scope);
    return val !== null ? -val : null;
  }

  if (attrNode.type === 'BinaryExpression') {
    const left = extractNumericValue(attrNode.left, scope);
    const right = extractNumericValue(attrNode.right, scope);
    if (left !== null && right !== null) {
      if (attrNode.operator === '+') return left + right;
      if (attrNode.operator === '-') return left - right;
      if (attrNode.operator === '*') return left * right;
      if (attrNode.operator === '/') return left / right;
    }
  }

  if (attrNode.type === 'Identifier') {
    const binding = scope?.getBinding(attrNode.name);
    if (binding && binding.path?.node?.init) {
      return extractNumericValue(binding.path.node.init, binding.scope);
    }
  }

  return null;
}

function extractStringValue(attrNode: any, scope: any): string | null {
  if (!attrNode) return null;
  if (attrNode.type === 'StringLiteral') return attrNode.value;
  if (attrNode.type === 'TemplateLiteral') {
    return attrNode.quasis.map((q: any) => q.value.raw).join(' ');
  }
  if (attrNode.type === 'Identifier') {
    const binding = scope?.getBinding(attrNode.name);
    if (binding && binding.path?.node?.init) {
      return extractStringValue(binding.path.node.init, binding.scope);
    }
  }
  return null;
}

function getPropValue(attributes: any[], name: string, scope: any): any {
  if (!attributes) return null;
  for (const a of attributes) {
    if (a.type !== 'JSXAttribute') continue;
    if (a.name?.name === name || a.name?.name?.toLowerCase() === name.toLowerCase()) {
      if (!a.value) return true;
      if (a.value.type === 'JSXExpressionContainer') {
        return a.value.expression;
      }
      return a.value;
    }
  }
  return null;
}

function extractTextStringFromChildren(children: any[], scope: any): string {
  let text = '';
  for (const c of children) {
    if (c.type === 'JSXText') {
      text += c.value;
    } else if (c.type === 'StringLiteral') {
      text += c.value;
    } else if (c.type === 'JSXElement') {
      const childText = extractTextStringFromChildren(c.children || [], scope);
      if (childText) {
        text += (text ? ' ' : '') + childText;
      }
    } else if (c.type === 'JSXExpressionContainer') {
      const expr = c.expression;
      if (expr.type === 'StringLiteral') {
        text += expr.value;
      } else if (expr.type === 'TemplateLiteral') {
        text += expr.quasis.map((q: any) => q.value.raw).join(' ');
      } else if (expr.type === 'BinaryExpression') {
        const leftStr = extractStringValue(expr.left, scope) || '';
        const rightStr = extractStringValue(expr.right, scope) || '';
        text += leftStr + rightStr;
      } else if (expr.type === 'CallExpression') {
        if (expr.callee?.property?.name === 'slice' && expr.arguments?.length >= 2) {
          const count = extractNumericValue(expr.arguments[1], scope) || 7;
          text += 'x'.repeat(count);
        }
      } else if (expr.type === 'ConditionalExpression') {
        const cText = extractStringValue(expr.consequent, scope) || '';
        const aText = extractStringValue(expr.alternate, scope) || '';
        text += cText.length >= aText.length ? cText : aText;
      } else if (expr.type === 'Identifier') {
        const str = extractStringValue(expr, scope);
        if (str) text += str;
        else if (expr.name?.toLowerCase().includes('hash')) text += 'abcdef1';
        else if (expr.name?.toLowerCase().includes('name')) text += 'Representative Title';
      }
    }
  }
  return text.trim().replace(/\s+/g, ' ');
}

// -----------------------------------------------------------------------------
// 3. Core AST Visitor & Layout Geometry Linter
// -----------------------------------------------------------------------------

export function lintLayoutGeometryCode(
  content: string,
  filePath: string = 'inline.tsx',
  options: GeometryValidatorOptions = {}
): GeometryViolation[] {
  if (!content || !content.trim()) return [];

  let ast: any;
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch (err: any) {
    return [
      {
        file: filePath,
        line: err.loc?.line || 1,
        column: err.loc?.column || 1,
        rule: 'syntax-error',
        ruleId: 'syntax-error',
        severity: 'CRITICAL',
        message: `Failed to parse AST: ${err.message}`,
      },
    ];
  }

  const violations: GeometryViolation[] = [];
  const reportedKeys = new Set<string>();

  function addViolation(v: GeometryViolation) {
    const key = `${v.file}:${v.line}:${v.column}:${v.rule}:${v.ruleId || ''}`;
    if (reportedKeys.has(key)) return;
    reportedKeys.add(key);
    violations.push(v);
  }

  // Traverse JSX Elements
  traverse(ast, {
    JSXElement(astPath: any) {
      const opening = astPath.node.openingElement;
      const tagName = opening.name?.name || '';
      const lowerTag = tagName.toLowerCase();

      // Check containers: <g>, <svg>, <div>, <section>
      if (['g', 'svg', 'div', 'section'].includes(lowerTag)) {
        inspectContainerScope(astPath, filePath, content, addViolation);
      }

      // Check Check 4: Stage Zone Boundaries for scene mechanisms
      checkStageZoneBoundaries(astPath, filePath, content, addViolation);
    },
  });

  return violations;
}

/**
 * Inspects immediate elements within a container (<g>, <div>, <svg>) for Checks 1, 2, and 3.
 */
function inspectContainerScope(
  containerPath: any,
  filePath: string,
  content: string,
  addViolation: (v: GeometryViolation) => void
): void {
  const containerOpening = containerPath.node.openingElement;
  const containerAttrs = containerOpening.attributes || [];
  const scope = containerPath.scope;

  const shapes: ContainerShape[] = [];
  const textElements: Array<{
    bounds: TextBounds;
    loc: { line: number; column: number };
    rawTag: string;
    hasBadgeAttr?: boolean;
  }> = [];
  const vectorPaths: VectorPathElement[] = [];
  const siblingContainers: Array<{ box: Box2D; loc: { line: number; column: number }; conditionKey?: string; tag: string }> = [];

  const children = containerPath.node.children || [];

  for (const child of children) {
    if (child.type !== 'JSXElement') continue;
    const opening = child.openingElement;
    const childTag = opening.name?.name || '';
    const lowerChildTag = childTag.toLowerCase();
    const attrs = opening.attributes || [];

    // Check local transform
    const transformExpr = getPropValue(attrs, 'transform', scope);
    let localTransform = { tx: 0, ty: 0, scale: 1.0 };
    if (transformExpr) {
      const transformStr = extractStringValue(transformExpr, scope);
      if (transformStr) {
        localTransform = parseTransformString(transformStr);
      }
    }

    // 1. Shapes (<rect>, <polygon>, <circle>)
    if (lowerChildTag === 'rect') {
      const rx = (extractNumericValue(getPropValue(attrs, 'x', scope), scope) || 0) + localTransform.tx;
      const ry = (extractNumericValue(getPropValue(attrs, 'y', scope), scope) || 0) + localTransform.ty;
      const rw = extractNumericValue(getPropValue(attrs, 'width', scope), scope);
      const rh = extractNumericValue(getPropValue(attrs, 'height', scope), scope);
      const fillVal = getPropValue(attrs, 'fill', scope);
      const fillStr = extractStringValue(fillVal, scope);
      const isOpaque =
        Boolean(fillStr) &&
        fillStr !== 'none' &&
        fillStr !== 'transparent' &&
        !fillStr!.includes('rgba(0,0,0,0)') &&
        !fillStr!.includes('rgba(0, 0, 0, 0)');

      if (rw !== null && rh !== null && rw > 0 && rh > 0 && rw < 1000) {
        shapes.push({
          type: 'rect',
          box: { xMin: rx, xMax: rx + rw, yMin: ry, yMax: ry + rh, width: rw, height: rh },
          loc: opening.loc?.start || { line: 1, column: 1 },
          rawTag: childTag,
          fill: fillStr || undefined,
          isOpaque,
        });
      }
    } else if (lowerChildTag === 'polygon') {
      const pointsVal = getPropValue(attrs, 'points', scope);
      const pointsStr = extractStringValue(pointsVal, scope);
      if (pointsStr) {
        const rawPoints = parsePolygonPoints(pointsStr);
        const transformedPoints = rawPoints.map((p) => ({
          x: p.x + localTransform.tx,
          y: p.y + localTransform.ty,
        }));
        if (transformedPoints.length >= 3) {
          const xs = transformedPoints.map((p) => p.x);
          const ys = transformedPoints.map((p) => p.y);
          const xMin = Math.min(...xs);
          const xMax = Math.max(...xs);
          const yMin = Math.min(...ys);
          const yMax = Math.max(...ys);
          shapes.push({
            type: 'polygon',
            polygonPoints: transformedPoints,
            box: { xMin, xMax, yMin, yMax, width: xMax - xMin, height: yMax - yMin },
            loc: opening.loc?.start || { line: 1, column: 1 },
            rawTag: childTag,
          });
        }
      }
    } else if (lowerChildTag === 'circle') {
      const cx = (extractNumericValue(getPropValue(attrs, 'cx', scope), scope) || 0) + localTransform.tx;
      const cy = (extractNumericValue(getPropValue(attrs, 'cy', scope), scope) || 0) + localTransform.ty;
      const r = extractNumericValue(getPropValue(attrs, 'r', scope), scope);
      if (r !== null && r > 0) {
        shapes.push({
          type: 'circle',
          circleCenter: { x: cx, y: cy },
          circleRadius: r,
          box: { xMin: cx - r, xMax: cx + r, yMin: cy - r, yMax: cy + r, width: 2 * r, height: 2 * r },
          loc: opening.loc?.start || { line: 1, column: 1 },
          rawTag: childTag,
        });
      }
    }

    // 2. Text (<text>)
    if (lowerChildTag === 'text') {
      const tx = (extractNumericValue(getPropValue(attrs, 'x', scope), scope) || 0) + localTransform.tx;
      const ty = (extractNumericValue(getPropValue(attrs, 'y', scope), scope) || 0) + localTransform.ty;
      const fontSize = extractNumericValue(getPropValue(attrs, 'fontSize', scope), scope) || 30;
      const anchorVal = extractStringValue(getPropValue(attrs, 'textAnchor', scope), scope) || 'start';
      const fontFamVal = extractStringValue(getPropValue(attrs, 'fontFamily', scope), scope) || 'sans-serif';
      const isMono = fontFamVal.toLowerCase().includes('mono');
      const fwVal = extractNumericValue(getPropValue(attrs, 'fontWeight', scope), scope) || 400;

      const rawText = extractTextStringFromChildren(child.children || [], scope);
      const badgeAttr = getPropValue(attrs, 'data-badge', scope);
      const opaqueBackingAttr = getPropValue(attrs, 'data-opaque-backing', scope);
      const hasBadgeAttr =
        badgeAttr === true ||
        extractStringValue(badgeAttr, scope) === 'true' ||
        opaqueBackingAttr === true ||
        extractStringValue(opaqueBackingAttr, scope) === 'true';

      if (rawText) {
        const bounds = estimateTextBounds(rawText, fontSize, tx, ty, anchorVal, isMono, fwVal);
        textElements.push({
          bounds,
          loc: opening.loc?.start || { line: 1, column: 1 },
          rawTag: childTag,
          hasBadgeAttr,
        });
      }
    }

    // 3. Vector Paths (<path>, <line>)
    if (lowerChildTag === 'path') {
      const dExpr = getPropValue(attrs, 'd', scope);
      const dStr = extractStringValue(dExpr, scope);
      const strokeW = extractNumericValue(getPropValue(attrs, 'strokeWidth', scope), scope) || 2;
      if (dStr) {
        const rawSegments = parseSvgPathSegments(dStr);
        const transformedSegments = rawSegments.map((s) => ({
          p1: { x: s.p1.x + localTransform.tx, y: s.p1.y + localTransform.ty },
          p2: { x: s.p2.x + localTransform.tx, y: s.p2.y + localTransform.ty },
        }));
        if (transformedSegments.length > 0) {
          vectorPaths.push({
            segments: transformedSegments,
            loc: opening.loc?.start || { line: 1, column: 1 },
            rawD: dStr,
            strokeWidth: strokeW,
          });
        }
      }
    } else if (lowerChildTag === 'line') {
      const x1 = (extractNumericValue(getPropValue(attrs, 'x1', scope), scope) || 0) + localTransform.tx;
      const y1 = (extractNumericValue(getPropValue(attrs, 'y1', scope), scope) || 0) + localTransform.ty;
      const x2 = (extractNumericValue(getPropValue(attrs, 'x2', scope), scope) || 0) + localTransform.tx;
      const y2 = (extractNumericValue(getPropValue(attrs, 'y2', scope), scope) || 0) + localTransform.ty;
      const strokeW = extractNumericValue(getPropValue(attrs, 'strokeWidth', scope), scope) || 2;
      vectorPaths.push({
        segments: [{ p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } }],
        loc: opening.loc?.start || { line: 1, column: 1 },
        rawD: `line(${x1},${y1}->${x2},${y2})`,
        strokeWidth: strokeW,
      });
    }

    // 4. Sibling Containers for Check 3
    if (['g', 'div', 'section'].includes(lowerChildTag)) {
      const condKey = getElementConditionKey(child, containerPath);
      const box = computeElementSubTreeBox(child, { tx: 0, ty: 0, scale: 1.0 }, scope);
      if (box) {
        siblingContainers.push({
          box,
          loc: opening.loc?.start || { line: 1, column: 1 },
          conditionKey: condKey,
          tag: childTag,
        });
      }
    }
  }

  // ===========================================================================
  // CHECK 1: Text-in-Box Clearance (Margin >= 30px, Container >= Text + 60px)
  // ===========================================================================
  for (const shape of shapes) {
    for (const textItem of textElements) {
      const tb = textItem.bounds;
      const textCenter = { x: (tb.xMin + tb.xMax) / 2, y: (tb.yMin + tb.yMax) / 2 };

      if (shape.type === 'rect') {
        const box = shape.box;
        // Text is associated with rect if text center is near/inside OR text starts inside OR boxes overlap
        const textCenterNear =
          textCenter.x >= box.xMin - 30 &&
          textCenter.x <= box.xMax + 30 &&
          textCenter.y >= box.yMin - 30 &&
          textCenter.y <= box.yMax + 30;

        const textOriginInside =
          tb.xMin >= box.xMin - 30 &&
          tb.xMin <= box.xMax + 30 &&
          tb.yMin >= box.yMin - 30 &&
          tb.yMin <= box.yMax + 30;

        const boxesOverlap =
          Math.min(tb.xMax, box.xMax) > Math.max(tb.xMin, box.xMin) &&
          Math.min(tb.yMax, box.yMax) > Math.max(tb.yMin, box.yMin);

        const isAssociated = textCenterNear || textOriginInside || boxesOverlap;

        if (isAssociated) {
          const dLeft = tb.xMin - box.xMin;
          const dRight = box.xMax - tb.xMax;
          const dTop = tb.yMin - box.yMin;
          const dBottom = box.yMax - tb.yMax;

          if (tb.xMax > box.xMax) {
            const overflow = tb.xMax - box.xMax;
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-overflow-right',
              severity: 'CRITICAL',
              message: `Text "${tb.text.slice(0, 35)}" overflows right container border by ${overflow.toFixed(1)}px (margin: -${overflow.toFixed(1)}px < 30px). Container width (${box.width}px) is insufficient for text width (${tb.width.toFixed(1)}px).`,
              shortfallPx: 30 + overflow,
              snippet: tb.text,
            });
          } else if (tb.xMin < box.xMin) {
            const overflow = box.xMin - tb.xMin;
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-overflow-left',
              severity: 'CRITICAL',
              message: `Text "${tb.text.slice(0, 35)}" overflows left container border by ${overflow.toFixed(1)}px.`,
              shortfallPx: 30 + overflow,
              snippet: tb.text,
            });
          } else if (dLeft < 30 || dRight < 30) {
            const minM = Math.min(dLeft, dRight);
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-margin-insufficient',
              severity: 'MAJOR',
              message: `Text "${tb.text.slice(0, 35)}" horizontal container margin (${minM.toFixed(1)}px) violates minimum clearance threshold (>= 30px).`,
              shortfallPx: 30 - minM,
              snippet: tb.text,
            });
          }

          if (tb.yMax > box.yMax) {
            const overflow = tb.yMax - box.yMax;
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-overflow-bottom',
              severity: 'CRITICAL',
              message: `Text "${tb.text.slice(0, 35)}" overflows bottom container boundary by ${overflow.toFixed(1)}px (margin: -${overflow.toFixed(1)}px < 30px).`,
              shortfallPx: 30 + overflow,
              snippet: tb.text,
            });
          } else if (tb.yMin < box.yMin) {
            const overflow = box.yMin - tb.yMin;
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-overflow-top',
              severity: 'CRITICAL',
              message: `Text "${tb.text.slice(0, 35)}" overflows top container boundary by ${overflow.toFixed(1)}px.`,
              shortfallPx: 30 + overflow,
              snippet: tb.text,
            });
          } else if (dTop < 30 && dTop >= 0) {
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-top-margin',
              severity: 'MAJOR',
              message: `Text "${tb.text.slice(0, 35)}" top margin (${dTop.toFixed(1)}px) violates minimum clearance threshold (>= 30px).`,
              shortfallPx: 30 - dTop,
              snippet: tb.text,
            });
          } else if (dBottom < 30 && dBottom >= 0) {
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-container-bottom-margin',
              severity: 'MAJOR',
              message: `Text "${tb.text.slice(0, 35)}" bottom margin (${dBottom.toFixed(1)}px) violates minimum clearance threshold (>= 30px).`,
              shortfallPx: 30 - dBottom,
              snippet: tb.text,
            });
          }
        }
      } else if (shape.type === 'polygon' && shape.polygonPoints) {
        // Tapered polygon / funnel clearance: evaluate across vertical extent (yMin, yMid, yMax)
        const isVertInPoly = tb.yMax >= shape.box.yMin - 10 && tb.yMin <= shape.box.yMax + 10;
        if (isVertInPoly) {
          const sampleYs = [tb.yMin, (tb.yMin + tb.yMax) / 2, tb.yMax];
          let maxOverflow = 0;
          let minMargin = Infinity;
          let worstAvailWidth = 0;
          let sampledValid = false;

          for (const ySample of sampleYs) {
            const boundsAtY = getPolygonHorizontalBoundsAtY(shape.polygonPoints, ySample);
            if (boundsAtY) {
              sampledValid = true;
              const dLeft = tb.xMin - boundsAtY.xLeft;
              const dRight = boundsAtY.xRight - tb.xMax;
              const availWidth = boundsAtY.xRight - boundsAtY.xLeft;

              if (tb.xMin < boundsAtY.xLeft || tb.xMax > boundsAtY.xRight) {
                const overflow = Math.max(boundsAtY.xLeft - tb.xMin, tb.xMax - boundsAtY.xRight);
                if (overflow > maxOverflow) {
                  maxOverflow = overflow;
                  worstAvailWidth = availWidth;
                }
              } else {
                const m = Math.min(dLeft, dRight);
                if (m < minMargin) {
                  minMargin = m;
                  worstAvailWidth = availWidth;
                }
              }
            }
          }

          if (sampledValid) {
            if (maxOverflow > 0) {
              addViolation({
                file: filePath,
                line: textItem.loc.line,
                column: textItem.loc.column,
                rule: 'text-container-overflow',
                ruleId: 'text-polygon-overflow',
                severity: 'CRITICAL',
                message: `Text "${tb.text.slice(0, 35)}" protrudes past polygon vector boundary by ${maxOverflow.toFixed(1)}px (text width: ${tb.width.toFixed(1)}px, available width at sample y: ${worstAvailWidth.toFixed(1)}px). Margin is negative.`,
                shortfallPx: 30 + maxOverflow,
                snippet: tb.text,
              });
            } else if (minMargin < 30) {
              addViolation({
                file: filePath,
                line: textItem.loc.line,
                column: textItem.loc.column,
                rule: 'text-container-overflow',
                ruleId: 'text-polygon-margin-insufficient',
                severity: 'MAJOR',
                message: `Text "${tb.text.slice(0, 35)}" polygon margin (${minMargin.toFixed(1)}px) violates minimum clearance threshold (>= 30px).`,
                shortfallPx: 30 - minMargin,
                snippet: tb.text,
              });
            }
          }
        }
      } else if (shape.type === 'circle' && shape.circleRadius && shape.circleCenter) {
        // Text is associated with circle if text center or text start is near/inside circle
        const distCenter = Math.hypot(textCenter.x - shape.circleCenter.x, textCenter.y - shape.circleCenter.y);
        const distStart = Math.hypot(tb.xMin - shape.circleCenter.x, textCenter.y - shape.circleCenter.y);
        if (distCenter <= shape.circleRadius + 15 || distStart <= shape.circleRadius + 15) {
          const r = shape.circleRadius;
          const c = shape.circleCenter;
          const corners: Point2D[] = [
            { x: tb.xMin, y: tb.yMin },
            { x: tb.xMax, y: tb.yMin },
            { x: tb.xMin, y: tb.yMax },
            { x: tb.xMax, y: tb.yMax },
          ];
          let maxCornerDist = 0;
          for (const pt of corners) {
            maxCornerDist = Math.max(maxCornerDist, Math.hypot(pt.x - c.x, pt.y - c.y));
          }

          if (maxCornerDist > r) {
            const overflow = maxCornerDist - r;
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-circle-node-overflow',
              severity: 'CRITICAL',
              message: `Text "${tb.text.slice(0, 35)}" exceeds circular node vector boundary (radius: ${r}px, corner extent: ${maxCornerDist.toFixed(1)}px, overflow: ${overflow.toFixed(1)}px). When node radius R < 95px, label must be exterior.`,
              shortfallPx: 30 + overflow,
              snippet: tb.text,
            });
          } else if (r - maxCornerDist < 30) {
            const margin = r - maxCornerDist;
            addViolation({
              file: filePath,
              line: textItem.loc.line,
              column: textItem.loc.column,
              rule: 'text-container-overflow',
              ruleId: 'text-circle-margin-insufficient',
              severity: 'MAJOR',
              message: `Text "${tb.text.slice(0, 35)}" inside circle node has only ${margin.toFixed(1)}px margin (< 30px required clearance).`,
              shortfallPx: 30 - margin,
              snippet: tb.text,
            });
          }
        }
      }
    }
  }

  // ===========================================================================
  // CHECK 2: Text-Vector Separation (Euclidean distance >= 30px)
  // ===========================================================================
  for (const vPath of vectorPaths) {
    for (const textItem of textElements) {
      const tb = textItem.bounds;

      // Exception: text explicitly backed by an opaque badge or container
      if (textItem.hasBadgeAttr) {
        continue;
      }

      const isBackedByOpaqueBadge = shapes.some((s) => {
        if (s.isOpaque) {
          // Check if shape encloses text box
          return (
            s.box.xMin <= tb.xMin + 5 &&
            s.box.xMax >= tb.xMax - 5 &&
            s.box.yMin <= tb.yMin + 5 &&
            s.box.yMax >= tb.yMax - 5
          );
        }
        return false;
      });

      if (isBackedByOpaqueBadge) {
        continue;
      }

      let minDistance = Infinity;
      for (const seg of vPath.segments) {
        const dist = distanceBoxToSegment(tb, seg.p1, seg.p2);
        minDistance = Math.min(minDistance, dist);
      }

      if (minDistance < 10) {
        addViolation({
          file: filePath,
          line: textItem.loc.line,
          column: textItem.loc.column,
          rule: 'text-vector-collision',
          ruleId: 'text-vector-superimposition',
          severity: 'CRITICAL',
          message: `Direct collision/superimposition: Text "${tb.text.slice(0, 35)}" rendered directly over vector stroke (distance: ${minDistance.toFixed(1)}px, required >= 30px). Text glyphs collide with path coordinates.`,
          shortfallPx: 30 - minDistance,
          snippet: tb.text,
        });
      } else if (minDistance < 30) {
        addViolation({
          file: filePath,
          line: textItem.loc.line,
          column: textItem.loc.column,
          rule: 'text-vector-collision',
          ruleId: 'text-vector-clearance-deficit',
          severity: 'MAJOR',
          message: `Text-vector separation deficit: Text "${tb.text.slice(0, 35)}" is ${minDistance.toFixed(1)}px from vector stroke (< 30px minimum safe clearance).`,
          shortfallPx: 30 - minDistance,
          snippet: tb.text,
        });
      }
    }
  }

  // ===========================================================================
  // CHECK 3: Sibling Box Clearance (Box_A ∩ Box_B != ∅ without gating)
  // ===========================================================================
  for (let i = 0; i < siblingContainers.length; i++) {
    for (let j = i + 1; j < siblingContainers.length; j++) {
      const a = siblingContainers[i];
      const b = siblingContainers[j];

      // If either container is conditionally gated by mutually exclusive keys, they don't collide
      if (areConditionsMutuallyExclusive(a.conditionKey, b.conditionKey)) {
        continue;
      }

      const overlapW = Math.min(a.box.xMax, b.box.xMax) - Math.max(a.box.xMin, b.box.xMin);
      const overlapH = Math.min(a.box.yMax, b.box.yMax) - Math.max(a.box.yMin, b.box.yMin);

      if (overlapW > 0 && overlapH > 0) {
        addViolation({
          file: filePath,
          line: b.loc.line,
          column: b.loc.column,
          rule: 'bounding-box-overlap',
          ruleId: 'sibling-container-overlap',
          severity: 'CRITICAL',
          message: `Sibling container overlap: <${b.tag}> collides with <${a.tag}> (${overlapW.toFixed(1)}px x ${overlapH.toFixed(1)}px intersection) without phase or opacity gating. Multi-element layouts must maintain disjoint bounding boxes.`,
          shortfallPx: Math.min(overlapW, overlapH),
        });
      }
    }
  }
}

/**
 * Computes bounding box of children inside a container subtree.
 */
function computeElementSubTreeBox(
  element: any,
  parentTransform: { tx: number; ty: number; scale: number },
  scope: any
): Box2D | null {
  const opening = element.openingElement;
  const attrs = opening.attributes || [];

  const transformExpr = getPropValue(attrs, 'transform', scope);
  let localTransform = { tx: parentTransform.tx, ty: parentTransform.ty, scale: parentTransform.scale };
  if (transformExpr) {
    const str = extractStringValue(transformExpr, scope);
    if (str) {
      const t = parseTransformString(str);
      localTransform = {
        tx: localTransform.tx + t.tx,
        ty: localTransform.ty + t.ty,
        scale: localTransform.scale * t.scale,
      };
    }
  }

  // Check explicit style positioning (e.g. absolute top, left, width, height)
  let styleLeft = 0;
  let styleTop = 0;
  let styleWidth = 0;
  let styleHeight = 0;
  for (const a of attrs) {
    if (a.type === 'JSXAttribute' && a.name?.name === 'style') {
      const expr = a.value?.expression;
      if (expr?.type === 'ObjectExpression') {
        for (const prop of expr.properties) {
          if (prop.type === 'ObjectProperty') {
            const key = prop.key?.name || prop.key?.value;
            if (key === 'left') styleLeft = extractNumericValue(prop.value, scope) || 0;
            if (key === 'top') styleTop = extractNumericValue(prop.value, scope) || 0;
            if (key === 'width') styleWidth = extractNumericValue(prop.value, scope) || 0;
            if (key === 'height') styleHeight = extractNumericValue(prop.value, scope) || 0;
          }
        }
      }
    }
  }

  if (styleWidth > 0 && styleHeight > 0) {
    return {
      xMin: styleLeft,
      xMax: styleLeft + styleWidth,
      yMin: styleTop,
      yMax: styleTop + styleHeight,
      width: styleWidth,
      height: styleHeight,
    };
  }

  // Collect bounding box of immediate SVG children
  const childBoxes: Box2D[] = [];
  const children = element.children || [];
  for (const c of children) {
    if (c.type !== 'JSXElement') continue;
    const cTag = c.openingElement.name?.name?.toLowerCase();
    const cAttrs = c.openingElement.attributes || [];

    if (cTag === 'rect') {
      const rx = (extractNumericValue(getPropValue(cAttrs, 'x', scope), scope) || 0) + localTransform.tx;
      const ry = (extractNumericValue(getPropValue(cAttrs, 'y', scope), scope) || 0) + localTransform.ty;
      const rw = extractNumericValue(getPropValue(cAttrs, 'width', scope), scope);
      const rh = extractNumericValue(getPropValue(cAttrs, 'height', scope), scope);
      if (rw && rh && rw > 0 && rh > 0 && rw < 1000) {
        childBoxes.push({ xMin: rx, xMax: rx + rw, yMin: ry, yMax: ry + rh, width: rw, height: rh });
      }
    } else if (cTag === 'circle') {
      const cx = (extractNumericValue(getPropValue(cAttrs, 'cx', scope), scope) || 0) + localTransform.tx;
      const cy = (extractNumericValue(getPropValue(cAttrs, 'cy', scope), scope) || 0) + localTransform.ty;
      const r = extractNumericValue(getPropValue(cAttrs, 'r', scope), scope) || 20;
      childBoxes.push({ xMin: cx - r, xMax: cx + r, yMin: cy - r, yMax: cy + r, width: 2 * r, height: 2 * r });
    }
  }

  if (childBoxes.length > 0) {
    const xMin = Math.min(...childBoxes.map((b) => b.xMin));
    const xMax = Math.max(...childBoxes.map((b) => b.xMax));
    const yMin = Math.min(...childBoxes.map((b) => b.yMin));
    const yMax = Math.max(...childBoxes.map((b) => b.yMax));
    return { xMin, xMax, yMin, yMax, width: xMax - xMin, height: yMax - yMin };
  }

  return null;
}

function getElementConditionKey(elementPath: any, rootContainerPath: any): string | undefined {
  let curr = elementPath;
  while (curr && curr !== rootContainerPath) {
    if (curr.parent?.type === 'LogicalExpression' && curr.parent.operator === '&&') {
      const cond = curr.parent.left;
      if (cond.type === 'Identifier') return cond.name;
      if (cond.type === 'UnaryExpression' && cond.operator === '!' && cond.argument.type === 'Identifier') {
        return `!${cond.argument.name}`;
      }
      if (cond.type === 'BinaryExpression') {
        const left = cond.left.name || 'left';
        const right = cond.right.value !== undefined ? cond.right.value : 'right';
        return `${left}==${right}`;
      }
    }
    if (curr.parent?.type === 'ConditionalExpression') {
      const cond = curr.parent.test;
      const isConsequent = curr.parent.consequent === curr;
      const base = cond.type === 'Identifier' ? cond.name : 'cond';
      return isConsequent ? base : `!${base}`;
    }
    curr = curr.parentPath;
  }
  return undefined;
}

function areConditionsMutuallyExclusive(keyA?: string, keyB?: string): boolean {
  if (!keyA || !keyB) return false;
  if (keyA === `!${keyB}` || keyB === `!${keyA}`) return true;
  if (keyA.includes('==') && keyB.includes('==')) {
    const [leftA, valA] = keyA.split('==');
    const [leftB, valB] = keyB.split('==');
    if (leftA === leftB && valA !== valB) return true;
  }
  return false;
}

function getCumulativeTransformY(astPath: any): { totalTy: number; isDynamic: boolean } {
  let curr = astPath;
  let totalTy = 0;
  let hasDynamic = false;

  while (curr) {
    if (curr.node?.type === 'JSXElement') {
      const attrs = curr.node.openingElement?.attributes || [];
      const transformVal = getPropValue(attrs, 'transform', curr.scope);
      if (transformVal) {
        const transformStr = extractStringValue(transformVal, curr.scope);
        if (transformStr) {
          const parsed = parseTransformString(transformStr);
          totalTy += parsed.ty;
          if (parsed.isDynamic) {
            hasDynamic = true;
          }
        } else {
          hasDynamic = true;
        }
      }
    }
    curr = curr.parentPath;
  }
  return { totalTy, isDynamic: hasDynamic };
}

/**
 * CHECK 4: Stage Zone Boundaries
 * Explanatory Stage Zone 2: y in [220, 1420].
 * Subtitle Safe Zone: y in [1420, 1720].
 * Status Bar / Notch: y in [0, 80].
 */
function checkStageZoneBoundaries(
  astPath: any,
  filePath: string,
  content: string,
  addViolation: (v: GeometryViolation) => void
): void {
  const opening = astPath.node.openingElement;
  const tagName = opening.name?.name || '';

  // Exclude non-mechanism containers
  if (
    [
      'composition',
      'sequence',
      'series',
      'absoluteFill',
      'karaokecaptions',
      'karaokegroup',
      'karaokeline',
      'svg',
    ].includes(tagName.toLowerCase())
  ) {
    return;
  }

  const attrs = opening.attributes || [];
  const isSubtitleRole = attrs.some(
    (a: any) =>
      a.type === 'JSXAttribute' &&
      (a.name?.name === 'data-role' || a.name?.name === 'className') &&
      String(a.value?.value).toLowerCase().includes('subtitle')
  );
  if (isSubtitleRole) return;

  const scope = astPath.scope;
  const transformVal = getPropValue(attrs, 'transform', scope);
  if (transformVal) {
    const { totalTy, isDynamic } = getCumulativeTransformY(astPath);

    if (!isDynamic && totalTy >= 0 && totalTy < 80) {
      if (!tagName.toLowerCase().includes('notch') && !tagName.toLowerCase().includes('status')) {
        const trespass = 80 - totalTy;
        addViolation({
          file: filePath,
          line: opening.loc?.start.line || 1,
          column: opening.loc?.start.column || 1,
          rule: 'stage-zone-violation',
          ruleId: 'notch-margin-trespass',
          severity: 'CRITICAL',
          message: `Primary mechanism <${tagName}> mounted at y=${totalTy}px, trespassing ${trespass.toFixed(1)}px into Mobile Notch & Status Bar margin (y in [0, 80]).`,
          shortfallPx: trespass,
        });
      }
    } else if (!isDynamic && totalTy > 1420 && totalTy < 1720) {
      if (!tagName.toLowerCase().includes('subtitle') && !tagName.toLowerCase().includes('caption')) {
        const trespass = totalTy - 1420;
        addViolation({
          file: filePath,
          line: opening.loc?.start.line || 1,
          column: opening.loc?.start.column || 1,
          rule: 'stage-zone-violation',
          ruleId: 'subtitle-zone-trespass',
          severity: 'CRITICAL',
          message: `Primary mechanism <${tagName}> mounted at y=${totalTy}px, trespassing ${trespass.toFixed(1)}px into Subtitle Safe Zone (y in [1420, 1720]). Stage mechanisms must remain within Explanatory Stage Zone 2 (y in [220, 1420]).`,
          shortfallPx: trespass,
        });
      }
    } else if (!isDynamic && totalTy >= 1720) {
      const trespass = totalTy - 1720;
      addViolation({
        file: filePath,
        line: opening.loc?.start.line || 1,
        column: opening.loc?.start.column || 1,
        rule: 'stage-zone-violation',
        ruleId: 'os-margin-trespass',
        severity: 'CRITICAL',
        message: `Primary mechanism <${tagName}> mounted at y=${totalTy}px, trespassing ${trespass.toFixed(1)}px into Mobile OS Navigation Bar margin (y > 1720).`,
        shortfallPx: trespass,
      });
    }
  }

  // Check style positioning
  for (const a of attrs) {
    if (a.type === 'JSXAttribute' && a.name?.name === 'style') {
      const expr = a.value?.expression;
      if (expr?.type === 'ObjectExpression') {
        let isFullBleedCanvas = false;
        let topVal: number | null = null;
        for (const prop of expr.properties) {
          if (prop.type === 'ObjectProperty') {
            const propKey = prop.key?.name || prop.key?.value;
            if (propKey === 'top') {
              topVal = extractNumericValue(prop.value, scope);
            }
            if (propKey === 'height') {
              const hVal = extractNumericValue(prop.value, scope);
              if (hVal === 1920) isFullBleedCanvas = true;
            }
          }
        }
        if (isFullBleedCanvas) continue;
        if (topVal !== null) {
          if (topVal < 80) {
            if (!tagName.toLowerCase().includes('notch') && !tagName.toLowerCase().includes('status')) {
              const trespass = 80 - topVal;
              addViolation({
                file: filePath,
                line: opening.loc?.start.line || 1,
                column: opening.loc?.start.column || 1,
                rule: 'stage-zone-violation',
                ruleId: 'css-notch-margin-trespass',
                severity: 'CRITICAL',
                message: `Element <${tagName}> positioned at top: ${topVal}px, trespassing ${trespass.toFixed(1)}px into Mobile Notch & Status Bar margin (y in [0, 80]).`,
                shortfallPx: trespass,
              });
            }
          } else if (topVal > 1420 && topVal < 1720) {
            addViolation({
              file: filePath,
              line: opening.loc?.start.line || 1,
              column: opening.loc?.start.column || 1,
              rule: 'stage-zone-violation',
              ruleId: 'css-subtitle-zone-trespass',
              severity: 'CRITICAL',
              message: `Element <${tagName}> positioned at top: ${topVal}px, trespassing ${(topVal - 1420).toFixed(1)}px into Subtitle Safe Zone (y in [1420, 1720]).`,
              shortfallPx: topVal - 1420,
            });
          } else if (topVal >= 1720) {
            const trespass = topVal - 1720;
            addViolation({
              file: filePath,
              line: opening.loc?.start.line || 1,
              column: opening.loc?.start.column || 1,
              rule: 'stage-zone-violation',
              ruleId: 'css-os-margin-trespass',
              severity: 'CRITICAL',
              message: `Element <${tagName}> positioned at top: ${topVal}px, trespassing ${trespass.toFixed(1)}px into Mobile OS Navigation Bar margin (y >= 1720).`,
              shortfallPx: trespass,
            });
          }
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 4. File and Target Directory Traversal
// -----------------------------------------------------------------------------

export function lintLayoutGeometryFile(
  filePath: string,
  options: GeometryValidatorOptions = {}
): GeometryViolation[] {
  if (!fs.existsSync(filePath)) {
    return [
      {
        file: filePath,
        line: 1,
        column: 1,
        rule: 'target-path-not-found',
        ruleId: 'target-path-not-found',
        severity: 'CRITICAL',
        message: `File does not exist: ${filePath}`,
      },
    ];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return lintLayoutGeometryCode(content, filePath, options);
}

export function validateLayoutGeometry(
  targets: string[],
  options: GeometryValidatorOptions = {}
): GeometryValidationResult {
  const allViolations: GeometryViolation[] = [];
  const visitedFiles = new Set<string>();

  function walk(itemPath: string) {
    if (!fs.existsSync(itemPath)) return;
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(itemPath);
      for (const entry of entries) {
        if (['node_modules', '.git', 'out', 'dist', '.agents', '.gemini'].includes(entry)) continue;
        walk(path.join(itemPath, entry));
      }
    } else if (stat.isFile()) {
      if (/\.(tsx|jsx)$/.test(itemPath) && !itemPath.endsWith('.d.ts')) {
        const full = path.resolve(itemPath);
        if (!visitedFiles.has(full)) {
          visitedFiles.add(full);
          const fileViolations = lintLayoutGeometryFile(full, options);
          allViolations.push(...fileViolations);
        }
      }
    }
  }

  for (const t of targets) {
    if (!fs.existsSync(t)) {
      allViolations.push({
        file: t,
        line: 1,
        column: 1,
        rule: 'target-path-not-found',
        ruleId: 'target-path-not-found',
        severity: 'CRITICAL',
        message: `Target path does not exist: ${t}. Gate must fail closed.`,
      });
      continue;
    }
    walk(t);
  }

  if (visitedFiles.size === 0 && allViolations.length === 0) {
    allViolations.push({
      file: targets.join(', '),
      line: 1,
      column: 1,
      rule: 'zero-files-analyzed',
      ruleId: 'zero-files-analyzed',
      severity: 'CRITICAL',
      message: `No candidate files (.tsx/.jsx) found to analyze in targets: ${targets.join(', ')}. Gate must fail closed.`,
    });
  }

  const criticalCount = allViolations.filter((v) => v.severity === 'CRITICAL').length;
  const majorCount = allViolations.filter((v) => v.severity === 'MAJOR').length;
  const minorCount = allViolations.filter((v) => v.severity === 'MINOR').length;

  const passed = options.strict
    ? allViolations.length === 0
    : criticalCount === 0 && majorCount === 0;

  return {
    filesAnalyzed: visitedFiles.size,
    violations: allViolations,
    passed,
    criticalCount,
    majorCount,
    minorCount,
  };
}

// -----------------------------------------------------------------------------
// 5. CLI Execution
// -----------------------------------------------------------------------------

export function runCli(args: string[] = process.argv.slice(2)): void {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📐 [LAYOUT GEOMETRY VALIDATOR] Tier 2 Zero-Collision & Clearance Gate

Usage:
  npx tsx validators/validate-layout-geometry.ts <targetDirOrFile> [options]

Rules Enforced:
  1. text-container-overflow (CRITICAL/MAJOR): Text inside <rect>, <polygon>, or <circle> must have margin >= 30px
  2. text-vector-collision (CRITICAL/MAJOR): Text must maintain >= 30px distance from vector paths/strokes
  3. bounding-box-overlap (CRITICAL): Sibling containers must not collide without phase/opacity gating
  4. stage-zone-violation (CRITICAL): Explanatory mechanisms must stay in Zone 2 (y in [220, 1420])

Options:
  --json          Output results in JSON format
  --strict        Fail on any violation (including MINOR)
  --verbose, -v   Verbose logging
  --help, -h      Display this guide
`);
    process.exit(0);
  }

  const options: GeometryValidatorOptions = {
    json: args.includes('--json'),
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  const targets = args.filter((a) => !a.startsWith('-'));
  const effectiveTargets = targets.length > 0 ? targets : ['connection-film/src/projects/sodium-potassium-pump/scenes'];

  if (!options.json) {
    console.log(`\n==================================================================`);
    console.log(` VALIDATOR: Layout Geometry & Zero-Collision Clearance (Layer 2)`);
    console.log(` Target Path: ${effectiveTargets.join(', ')}`);
    console.log(` Clearance Standard: Margin >= 30px | Box_A ∩ Box_B = ∅ | Stage Zone 2`);
    console.log(`==================================================================\n`);
  }

  const result = validateLayoutGeometry(effectiveTargets, options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Analyzed ${result.filesAnalyzed} file(s).`);

    if (result.violations.length === 0) {
      console.log(`✅ [PASSED] 0 Layout geometry violations detected! All elements meet >= 30px clearance.\n`);
    } else {
      console.log(`\n⚠️ Found ${result.violations.length} violation(s):\n`);
      for (const v of result.violations) {
        const color = v.severity === 'CRITICAL' ? '\x1b[31m' : v.severity === 'MAJOR' ? '\x1b[33m' : '\x1b[36m';
        const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'MAJOR' ? '🟠' : '🟡';
        console.log(`${icon} ${color}[${v.severity}]\x1b[0m ${v.file}:${v.line}:${v.column} (${v.rule})`);
        console.log(`  ${v.message}`);
        if (v.shortfallPx !== undefined) {
          console.log(`  Clearance Shortfall: ${v.shortfallPx.toFixed(1)}px`);
        }
        console.log('');
      }

      if (result.passed) {
        console.log(`✅ Passed (no CRITICAL or MAJOR violations).`);
      } else {
        console.log(`❌ FAILED layout geometry clearance gate (${result.criticalCount} Critical, ${result.majorCount} Major).`);
      }
    }
  }

  process.exit(result.passed ? 0 : 1);
}

const isDirectCli =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? path.resolve(process.argv[1]).replace(/\.ts$/, '') === path.resolve(__filename).replace(/\.ts$/, '')
    : false;

if (isDirectCli) {
  runCli();
}
