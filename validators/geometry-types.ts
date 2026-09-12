/**
 * GEOMETRY VERIFICATION TYPES & INVARIANT DEFINITIONS (TIER 2 QA GATE: G04D)
 *
 * Provides shared data structures, DOM measurement interfaces, and geometric math helpers
 * for the generic Headless DOM Runtime Geometry Gate.
 */

export interface Point {
  x: number;
  y: number;
}

export interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DOMTextElement {
  id: string;
  tag: string;
  text: string;
  rect: BoxRect;
  effectiveOpacity: number;
  fontSize: number;
  isSubtitle: boolean;
  isHud: boolean;
  parentCardId?: string;
  domIndex?: number;
  zIndex?: number;
}

export interface DOMCardElement {
  id: string;
  tag: string;
  rect: BoxRect;
  backgroundColor: string;
  effectiveOpacity: number;
  isOpaque: boolean;
  zIndex: number;
  domIndex: number;
}

export interface DOMVectorElement {
  id: string;
  type: 'line' | 'path';
  p1: Point;
  p2: Point;
  strokeWidth: number;
  rect: BoxRect;
  domIndex: number;
  zIndex: number;
}

export interface DOMFrameSnapshot {
  frame: number;
  beatId: string;
  texts: DOMTextElement[];
  cards: DOMCardElement[];
  vectors: DOMVectorElement[];
  stageElements: { tag: string; text?: string; rect: BoxRect; isSubtitle: boolean; isHud: boolean }[];
}

export type InvariantRule =
  | 'TEXT_COLLISION'
  | 'CARD_COLLISION'
  | 'CONTAINER_OVERFLOW'
  | 'CONTAINER_PADDING_DEFICIT'
  | 'CARD_TEXT_OCCLUSION'
  | 'UNSHIELDED_VECTOR_PIERCE'
  | 'SUBTITLE_INTRUSION'
  | 'VIEWPORT_OVERFLOW';

export interface RuntimeGeometryViolation {
  beatId: string;
  frame: number;
  invariant: InvariantRule;
  severity: 'CRITICAL' | 'MAJOR';
  component?: string;
  message: string;
  offendingElements: string[];
  coordinates: Record<string, any>;
  shortfallPx?: number;
}

export interface RuntimeGeometryResult {
  passed: boolean;
  projectDir: string;
  compositionId: string;
  totalBeats: number;
  beatsEvaluated: number;
  framesEvaluated: number;
  violations: RuntimeGeometryViolation[];
  durationMs: number;
}

// =========================================================================
// GEOMETRIC MATH & INTERSECTION HELPERS
// =========================================================================

/**
 * Computes the axis-aligned overlap rectangle between two boxes.
 */
export function getBoxOverlap(a: BoxRect, b: BoxRect): { overlapX: number; overlapY: number; intersects: boolean } {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  const intersects = overlapX > 0 && overlapY > 0;
  return { overlapX: Math.max(0, overlapX), overlapY: Math.max(0, overlapY), intersects };
}

/**
 * Checks if a 2D point is strictly inside an axis-aligned box (with optional margin).
 */
export function isPointInsideBox(p: Point, box: BoxRect, margin: number = 0): boolean {
  return (
    p.x >= box.x + margin &&
    p.x <= box.x + box.width - margin &&
    p.y >= box.y + margin &&
    p.y <= box.y + box.height - margin
  );
}

/**
 * Checks if two 2D line segments [p1, p2] and [q1, q2] intersect.
 */
export function doSegmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const d = (p2.x - p1.x) * (q2.y - q1.y) - (p2.y - p1.y) * (q2.x - q1.x);
  if (Math.abs(d) < 1e-7) {
    return false; // Parallel or collinear
  }
  const t = ((q1.x - p1.x) * (q2.y - q1.y) - (q1.y - p1.y) * (q2.x - q1.x)) / d;
  const u = ((q1.x - p1.x) * (p2.y - p1.y) - (q1.y - p1.y) * (p2.x - p1.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Checks if a line segment [p1, p2] penetrates or intersects an axis-aligned box.
 */
export function segmentIntersectsBox(p1: Point, p2: Point, box: BoxRect): boolean {
  // If either endpoint is strictly inside the box (with 2px inner margin)
  if (isPointInsideBox(p1, box, 2) || isPointInsideBox(p2, box, 2)) {
    return true;
  }

  // Check intersection with all 4 bounding edges of the box
  const topLeft: Point = { x: box.x, y: box.y };
  const topRight: Point = { x: box.x + box.width, y: box.y };
  const bottomLeft: Point = { x: box.x, y: box.y + box.height };
  const bottomRight: Point = { x: box.x + box.width, y: box.y + box.height };

  return (
    doSegmentsIntersect(p1, p2, topLeft, topRight) ||
    doSegmentsIntersect(p1, p2, topRight, bottomRight) ||
    doSegmentsIntersect(p1, p2, bottomRight, bottomLeft) ||
    doSegmentsIntersect(p1, p2, bottomLeft, topLeft)
  );
}
