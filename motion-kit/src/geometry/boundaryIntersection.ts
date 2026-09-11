import type {
  BoxDescriptor,
  IntersectionResult,
  Point2D,
  TwoBoxIntersectionResult,
} from './types';

/**
 * Normalizes a 2D direction vector. If zero, defaults to (1, 0).
 */
export function normalizeDirection(dir: Point2D): { ux: number; uy: number; length: number } {
  const length = Math.hypot(dir.x, dir.y);
  if (length < 1e-9) {
    return { ux: 1, uy: 0, length: 0 };
  }
  return { ux: dir.x / length, uy: dir.y / length, length };
}

/**
 * Resolves a BoxDescriptor into an explicit center and half-dimensions.
 */
export function resolveBoxDimensions(box: BoxDescriptor): {
  cx: number;
  cy: number;
  width: number;
  height: number;
  hw: number;
  hh: number;
} {
  const padding = box.padding ?? 0;
  const width = Math.max(0, box.width + padding * 2);
  const height = Math.max(0, box.height + padding * 2);
  const hw = width / 2;
  const hh = height / 2;

  let cx: number;
  let cy: number;

  if (box.cx !== undefined && box.cy !== undefined) {
    cx = box.cx;
    cy = box.cy;
  } else if (box.x !== undefined && box.y !== undefined) {
    cx = box.x + box.width / 2;
    cy = box.y + box.height / 2;
  } else if (box.cx !== undefined) {
    cx = box.cx;
    cy = (box.y ?? 0) + box.height / 2;
  } else if (box.cy !== undefined) {
    cx = (box.x ?? 0) + box.width / 2;
    cy = box.cy;
  } else {
    cx = (box.x ?? 0) + box.width / 2;
    cy = (box.y ?? 0) + box.height / 2;
  }

  return { cx, cy, width, height, hw, hh };
}

/**
 * Computes exact Ray-AABB intersection originating from box center.
 * Equation: t_x = hw / |u_x|, t_y = hh / |u_y|, t = min(t_x, t_y).
 */
export function intersectRayAABB(
  center: Point2D,
  halfWidth: number,
  halfHeight: number,
  dir: Point2D
): IntersectionResult {
  const hw = Math.max(0, halfWidth);
  const hh = Math.max(0, halfHeight);

  if (hw === 0 && hh === 0) {
    return {
      point: { x: center.x, y: center.y },
      distance: 0,
      normal: { x: 0, y: 0 },
      surfaceType: 'vertical',
    };
  }

  const { ux, uy } = normalizeDirection(dir);

  const tx = Math.abs(ux) > 1e-9 ? hw / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-9 ? hh / Math.abs(uy) : Infinity;

  const t = Math.min(tx, ty);
  const px = center.x + t * ux;
  const py = center.y + t * uy;

  if (Math.abs(tx - ty) < 1e-6) {
    // Corner vertex intersection
    const signX = ux >= 0 ? 1 : -1;
    const signY = uy >= 0 ? 1 : -1;
    const invSqrt2 = Math.SQRT1_2;
    return {
      point: { x: px, y: py },
      distance: t,
      normal: { x: signX * invSqrt2, y: signY * invSqrt2 },
      surfaceType: 'corner-arc',
    };
  }

  if (tx < ty) {
    // Hit vertical boundary (left or right wall)
    const signX = ux >= 0 ? 1 : -1;
    return {
      point: { x: px, y: py },
      distance: t,
      normal: { x: signX, y: 0 },
      surfaceType: 'vertical',
    };
  }

  // Hit horizontal boundary (top or bottom wall)
  const signY = uy >= 0 ? 1 : -1;
  return {
    point: { x: px, y: py },
    distance: t,
    normal: { x: 0, y: signY },
    surfaceType: 'horizontal',
  };
}

/**
 * Computes exact Ray-RoundedRect boundary intersection.
 * Uses analytical quadratic solver for corner arcs:
 * ||(C - C_corner) + t * u||^2 = r^2
 * t = -(V · u) + sqrt((V · u)^2 - (||V||^2 - r^2))
 */
export function intersectRayRoundedRect(
  center: Point2D,
  halfWidth: number,
  halfHeight: number,
  cornerRadius: number,
  dir: Point2D
): IntersectionResult {
  const hw = Math.max(0, halfWidth);
  const hh = Math.max(0, halfHeight);
  const r = Math.max(0, Math.min(cornerRadius, hw, hh));

  if (r < 1e-6) {
    return intersectRayAABB(center, hw, hh, dir);
  }

  const { ux, uy } = normalizeDirection(dir);

  const tx = Math.abs(ux) > 1e-9 ? hw / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-9 ? hh / Math.abs(uy) : Infinity;

  // Check if ray hits the flat section of vertical wall
  if (tx < ty) {
    const candidateYOffset = tx * Math.abs(uy);
    if (candidateYOffset <= hh - r + 1e-9) {
      const signX = ux >= 0 ? 1 : -1;
      return {
        point: { x: center.x + tx * ux, y: center.y + tx * uy },
        distance: tx,
        normal: { x: signX, y: 0 },
        surfaceType: 'vertical',
      };
    }
  }

  // Check if ray hits the flat section of horizontal wall
  if (ty < tx) {
    const candidateXOffset = ty * Math.abs(ux);
    if (candidateXOffset <= hw - r + 1e-9) {
      const signY = uy >= 0 ? 1 : -1;
      return {
        point: { x: center.x + ty * ux, y: center.y + ty * uy },
        distance: ty,
        normal: { x: 0, y: signY },
        surfaceType: 'horizontal',
      };
    }
  }

  // Ray enters corner arc region!
  // Determine which quadrant corner
  const sx = ux >= 0 ? 1 : -1;
  const sy = uy >= 0 ? 1 : -1;

  const cornerCenterX = center.x + sx * (hw - r);
  const cornerCenterY = center.y + sy * (hh - r);

  // V = Center - CornerCenter
  const vx = center.x - cornerCenterX;
  const vy = center.y - cornerCenterY;

  // Solve ||V + t * u||^2 = r^2
  // t^2 + 2(V · u)t + (||V||^2 - r^2) = 0
  const vDotU = vx * ux + vy * uy;
  const vNormSq = vx * vx + vy * vy;
  const cQuad = vNormSq - r * r;

  const discriminant = vDotU * vDotU - cQuad;

  if (discriminant < 0) {
    // Numerical precision safety fallback to AABB
    return intersectRayAABB(center, hw, hh, dir);
  }

  const t = -vDotU + Math.sqrt(Math.max(0, discriminant));
  const px = center.x + t * ux;
  const py = center.y + t * uy;

  // Normal from corner circle center to intersection point
  const nx = px - cornerCenterX;
  const ny = py - cornerCenterY;
  const nLen = Math.hypot(nx, ny) || 1;

  return {
    point: { x: px, y: py },
    distance: t,
    normal: { x: nx / nLen, y: ny / nLen },
    surfaceType: 'corner-arc',
  };
}

/**
 * Computes exact Ray-Circle boundary intersection.
 * Distance is exactly radius.
 */
export function intersectRayCircle(
  center: Point2D,
  radius: number,
  dir: Point2D
): IntersectionResult {
  const r = Math.max(0, radius);
  const { ux, uy } = normalizeDirection(dir);
  return {
    point: { x: center.x + r * ux, y: center.y + r * uy },
    distance: r,
    normal: { x: ux, y: uy },
    surfaceType: 'radial',
  };
}

/**
 * Computes exact Ray-Ellipse boundary intersection.
 * Formula: t = (a * b) / sqrt(b^2 * ux^2 + a^2 * uy^2)
 */
export function intersectRayEllipse(
  center: Point2D,
  semiA: number,
  semiB: number,
  dir: Point2D
): IntersectionResult {
  const a = Math.max(1e-6, semiA);
  const b = Math.max(1e-6, semiB);
  const { ux, uy } = normalizeDirection(dir);

  const denom = Math.sqrt(b * b * ux * ux + a * a * uy * uy);
  const t = denom > 1e-9 ? (a * b) / denom : a;

  const px = center.x + t * ux;
  const py = center.y + t * uy;

  // Gradient normal of (x/a)^2 + (y/b)^2 - 1 = 0
  const relX = px - center.x;
  const relY = py - center.y;
  const gradX = relX / (a * a);
  const gradY = relY / (b * b);
  const gradLen = Math.hypot(gradX, gradY) || 1;

  return {
    point: { x: px, y: py },
    distance: t,
    normal: { x: gradX / gradLen, y: gradY / gradLen },
    surfaceType: 'radial',
  };
}

/**
 * Generic ray-boundary intersection dispatcher based on BoxDescriptor.shape.
 */
export function intersectRayBox(box: BoxDescriptor, dir: Point2D): IntersectionResult {
  const { cx, cy, hw, hh } = resolveBoxDimensions(box);
  const center: Point2D = { x: cx, y: cy };
  const shape = box.shape ?? 'rect';

  switch (shape) {
    case 'circle': {
      const r = box.radius ?? Math.min(hw, hh);
      return intersectRayCircle(center, r, dir);
    }
    case 'ellipse': {
      return intersectRayEllipse(center, hw, hh, dir);
    }
    case 'rounded-rect': {
      const cr = box.cornerRadius ?? 16;
      return intersectRayRoundedRect(center, hw, hh, cr, dir);
    }
    case 'rect':
    default: {
      return intersectRayAABB(center, hw, hh, dir);
    }
  }
}

/**
 * Solves boundary intersection between two boxes.
 * Guarantees connector segment [P_start, P_end] lies strictly on outer boundaries
 * with zero penetration into either box interior.
 */
export function solveTwoBoxIntersection(
  source: BoxDescriptor,
  target: BoxDescriptor,
  startGap = 4,
  endGap = 4
): TwoBoxIntersectionResult {
  const srcDims = resolveBoxDimensions(source);
  const tgtDims = resolveBoxDimensions(target);

  const dx = tgtDims.cx - srcDims.cx;
  const dy = tgtDims.cy - srcDims.cy;
  const distance = Math.hypot(dx, dy);

  const { ux, uy } = normalizeDirection({ x: dx, y: dy });

  // Outward ray from source center towards target center
  const srcRayDir: Point2D = { x: ux, y: uy };
  const sourceIntersection = intersectRayBox(source, srcRayDir);

  // Inward ray from target center towards source center
  const tgtRayDir: Point2D = { x: -ux, y: -uy };
  const targetIntersection = intersectRayBox(target, tgtRayDir);

  const pStartX = srcDims.cx + (sourceIntersection.distance + startGap) * ux;
  const pStartY = srcDims.cy + (sourceIntersection.distance + startGap) * uy;

  const pEndX = tgtDims.cx - (targetIntersection.distance + endGap) * ux;
  const pEndY = tgtDims.cy - (targetIntersection.distance + endGap) * uy;

  const clippedLength =
    distance - sourceIntersection.distance - targetIntersection.distance - startGap - endGap;
  const isOverlapping = clippedLength <= 0;

  const tangentAngle = (Math.atan2(uy, ux) * 180) / Math.PI;

  return {
    start: { x: pStartX, y: pStartY },
    end: { x: pEndX, y: pEndY },
    sourceIntersection,
    targetIntersection,
    tangentAngleStart: tangentAngle,
    tangentAngleEnd: tangentAngle,
    distance,
    clippedLength: Math.max(0, clippedLength),
    isOverlapping,
  };
}

/**
 * Rigorous test helper to determine whether a point lies strictly inside a box interior.
 * Margin > 0 shrinks the tested interior (allowing points near edge to be considered outside).
 */
export function isPointInsideBox(point: Point2D, box: BoxDescriptor, margin = 0): boolean {
  const { cx, cy, hw, hh } = resolveBoxDimensions(box);
  const shape = box.shape ?? 'rect';

  const dx = Math.abs(point.x - cx);
  const dy = Math.abs(point.y - cy);

  switch (shape) {
    case 'circle': {
      const r = (box.radius ?? Math.min(hw, hh)) - margin;
      return Math.hypot(point.x - cx, point.y - cy) < r;
    }
    case 'ellipse': {
      const a = Math.max(1e-6, hw - margin);
      const b = Math.max(1e-6, hh - margin);
      return (dx * dx) / (a * a) + (dy * dy) / (b * b) < 1.0;
    }
    case 'rounded-rect': {
      const r = Math.max(0, Math.min(box.cornerRadius ?? 16, hw, hh));
      if (dx >= hw - margin || dy >= hh - margin) {
        return false;
      }
      if (dx <= hw - r || dy <= hh - r) {
        return true;
      }
      // In corner region
      const cornerDx = dx - (hw - r);
      const cornerDy = dy - (hh - r);
      return Math.hypot(cornerDx, cornerDy) < r - margin;
    }
    case 'rect':
    default: {
      return dx < hw - margin && dy < hh - margin;
    }
  }
}
