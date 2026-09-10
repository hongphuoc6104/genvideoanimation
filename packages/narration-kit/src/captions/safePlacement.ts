/**
 * packages/narration-kit/src/captions/safePlacement.ts
 *
 * Feature F16: Safe Area Placement Planner & Collision Avoidance.
 * Implements SMPTE/EBU 96px title-safe margins, canonical placement presets
 * ('bottom', 'top', 'lower-left', 'lower-right', 'auto'), 2D AABB intersection
 * calculations, and dynamic subject region avoidance.
 */

import {
  CaptionBoundingBox,
  CaptionPosition,
  PlacementOptions,
  PlannedPlacement,
  LayoutValidationResult,
  ResolvedPlacement,
  SubjectRegion,
  Viewport,
} from './types';

export const DEFAULT_VIEWPORT: Viewport = { width: 1920, height: 1080 };
export const DEFAULT_SAFE_MARGIN = 96;
export const DEFAULT_BOX_WIDTH = 1536;
export const DEFAULT_BOX_HEIGHT = 120;
export const DEFAULT_CORNER_BOX_WIDTH = 800;

export interface SafeMargins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const VERTICAL_9_16_VIEWPORT: Viewport = { width: 1080, height: 1920 };
export const VERTICAL_9_16_SAFE_MARGINS: SafeMargins = {
  left: 72,
  right: 180,
  top: 120,
  bottom: 320,
};

/**
 * Calculates 2D Axis-Aligned Bounding Box (AABB) intersection area in square pixels.
 * Returns 0 if boxes are disjoint or touch only at boundary edges/vertices.
 */
export function computeAabbIntersection(
  a: CaptionBoundingBox,
  b: CaptionBoundingBox | SubjectRegion
): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

/**
 * Checks whether two AABB bounding boxes overlap with area > 0.
 */
export function checkAabbCollision(
  box1: CaptionBoundingBox,
  box2: CaptionBoundingBox | SubjectRegion
): boolean {
  return computeAabbIntersection(box1, box2) > 0;
}

/**
 * Checks whether a caption box strictly respects safe margins on all 4 canvas boundaries.
 */
export function isWithinSafeArea(
  box: CaptionBoundingBox,
  viewport: Viewport = DEFAULT_VIEWPORT,
  safeMargin: number | SafeMargins = DEFAULT_SAFE_MARGIN
): boolean {
  if (box.width <= 0 || box.height <= 0) return false;

  let margins: SafeMargins;
  if (typeof safeMargin === 'number') {
    if (viewport.width === 1080 && viewport.height === 1920) {
      margins = VERTICAL_9_16_SAFE_MARGINS;
    } else {
      margins = { left: safeMargin, right: safeMargin, top: safeMargin, bottom: safeMargin };
    }
  } else {
    margins = safeMargin;
  }

  if (box.x < margins.left) return false;
  if (box.y < margins.top) return false;
  if (box.x + box.width > viewport.width - margins.right) return false;
  if (box.y + box.height > viewport.height - margins.bottom) return false;
  return true;
}

/**
 * Clamps caption box coordinates and dimensions strictly within safe margins.
 */
export function clampToSafeArea(
  box: CaptionBoundingBox,
  viewport: Viewport = DEFAULT_VIEWPORT,
  safeMargin: number | SafeMargins = DEFAULT_SAFE_MARGIN
): CaptionBoundingBox {
  let margins: SafeMargins;
  if (typeof safeMargin === 'number') {
    if (viewport.width === 1080 && viewport.height === 1920) {
      margins = VERTICAL_9_16_SAFE_MARGINS;
    } else {
      margins = { left: safeMargin, right: safeMargin, top: safeMargin, bottom: safeMargin };
    }
  } else {
    margins = safeMargin;
  }

  const maxSafeWidth = Math.max(1, viewport.width - margins.left - margins.right);
  const maxSafeHeight = Math.max(1, viewport.height - margins.top - margins.bottom);
  const width = Math.max(1, Math.min(box.width, maxSafeWidth));
  const height = Math.max(1, Math.min(box.height, maxSafeHeight));
  const minX = margins.left;
  const maxX = viewport.width - margins.right - width;
  const minY = margins.top;
  const maxY = viewport.height - margins.bottom - height;
  const x = Math.max(minX, Math.min(box.x, maxX));
  const y = Math.max(minY, Math.min(box.y, maxY));
  return { x, y, width, height };
}

/**
 * Computes coordinate bounding box for a specific resolved preset.
 */
export function computePresetBox(
  preset: ResolvedPlacement,
  options: {
    viewport?: Viewport;
    safeMargin?: number | SafeMargins;
    boxWidth?: number;
    boxHeight?: number;
  } = {}
): CaptionBoundingBox {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  const isPortrait = viewport.height > viewport.width;
  const isSquare = viewport.width === viewport.height;

  // Dedicated 1080x1920 9:16 mobile handler (Requirement R8)
  if (isPortrait && viewport.width === 1080 && viewport.height === 1920) {
    const margins = VERTICAL_9_16_SAFE_MARGINS;
    const boxWidth = 1080 - margins.left - margins.right; // 828px
    const boxHeight = options.boxHeight ?? 190;
    const x = margins.left; // 72px
    let y = 1920 - margins.bottom - boxHeight; // 1410px (bottom anchor)
    if (preset === 'top') {
      y = margins.top; // 120px
    }
    return { x, y, width: boxWidth, height: boxHeight };
  }

  const safeMargin = typeof options.safeMargin === 'number' ? options.safeMargin : DEFAULT_SAFE_MARGIN;
  const maxSafeWidth = viewport.width - 2 * safeMargin;
  let defaultWidth: number;
  let defaultHeight: number;

  if (isPortrait) {
    defaultWidth = maxSafeWidth;
    defaultHeight = DEFAULT_BOX_HEIGHT;
  } else if (isSquare) {
    defaultWidth = maxSafeWidth;
    defaultHeight = 100;
  } else {
    defaultWidth = viewport.width === 1920 ? DEFAULT_BOX_WIDTH : maxSafeWidth;
    defaultHeight = DEFAULT_BOX_HEIGHT;
  }

  const boxWidth = Math.min(options.boxWidth ?? defaultWidth, maxSafeWidth);
  const boxHeight = options.boxHeight ?? defaultHeight;

  let x = 0;
  let y = 0;

  switch (preset) {
    case 'bottom':
      x = Math.round((viewport.width - boxWidth) / 2);
      y = viewport.height - safeMargin - boxHeight;
      break;
    case 'top':
      x = Math.round((viewport.width - boxWidth) / 2);
      y = safeMargin;
      break;
    case 'lower-left': {
      const cornerWidth = options.boxWidth ?? Math.min(boxWidth, DEFAULT_CORNER_BOX_WIDTH, maxSafeWidth);
      x = safeMargin;
      y = viewport.height - safeMargin - boxHeight;
      return clampToSafeArea({ x, y, width: cornerWidth, height: boxHeight }, viewport, safeMargin);
    }
    case 'lower-right': {
      const cornerWidth = options.boxWidth ?? Math.min(boxWidth, DEFAULT_CORNER_BOX_WIDTH, maxSafeWidth);
      x = viewport.width - safeMargin - cornerWidth;
      y = viewport.height - safeMargin - boxHeight;
      return clampToSafeArea({ x, y, width: cornerWidth, height: boxHeight }, viewport, safeMargin);
    }
  }

  return clampToSafeArea({ x, y, width: boxWidth, height: boxHeight }, viewport, safeMargin);
}

/**
 * Plans safe area placement and dynamically resolves collisions with subject_region.
 */
export function planSafeAreaPlacement(options: PlacementOptions = {}): PlannedPlacement {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  const safeMargin = options.safe_margin ?? options.safeMargin ?? DEFAULT_SAFE_MARGIN;
  const rawPreset = options.caption_position ?? options.position ?? 'bottom';
  const subject = options.subject_region ?? options.subjectRegion ?? null;

  const candidatePresets: ResolvedPlacement[] = ['top', 'lower-left', 'lower-right'];

  if (rawPreset !== 'auto') {
    const candidateBox = computePresetBox(rawPreset, {
      viewport,
      safeMargin,
      boxWidth: options.boxWidth,
      boxHeight: options.boxHeight,
    });

    const collisionArea = subject ? computeAabbIntersection(candidateBox, subject) : 0;
    const collides = collisionArea > 0;

    if (!collides || !subject) {
      return {
        box: candidateBox,
        preset: rawPreset,
        resolvedPosition: rawPreset,
        collidesWithSubject: false,
        collisionArea: 0,
      };
    }

    // Explicit preset collides with subject: dynamically relocate to safe alternative
    for (const alt of candidatePresets) {
      if (alt === rawPreset) continue;
      const altBox = computePresetBox(alt, {
        viewport,
        safeMargin,
        boxWidth: options.boxWidth,
        boxHeight: options.boxHeight,
      });
      const altCollision = computeAabbIntersection(altBox, subject);
      if (altCollision === 0) {
        return {
          box: altBox,
          preset: rawPreset,
          resolvedPosition: alt,
          collidesWithSubject: false,
          collisionArea: 0,
        };
      }
    }

    return {
      box: candidateBox,
      preset: rawPreset,
      resolvedPosition: rawPreset,
      collidesWithSubject: true,
      collisionArea,
    };
  }

  // 'auto' preset resolution:
  const bottomBox = computePresetBox('bottom', {
    viewport,
    safeMargin,
    boxWidth: options.boxWidth,
    boxHeight: options.boxHeight,
  });

  if (!subject) {
    return {
      box: bottomBox,
      preset: 'auto',
      resolvedPosition: 'bottom',
      collidesWithSubject: false,
      collisionArea: 0,
    };
  }

  const bottomCollision = computeAabbIntersection(bottomBox, subject);
  if (bottomCollision === 0) {
    return {
      box: bottomBox,
      preset: 'auto',
      resolvedPosition: 'bottom',
      collidesWithSubject: false,
      collisionArea: 0,
    };
  }

  let bestCandidate: { preset: ResolvedPlacement; box: CaptionBoundingBox; collisionArea: number } = {
    preset: 'bottom',
    box: bottomBox,
    collisionArea: bottomCollision,
  };

  for (const alt of candidatePresets) {
    const altBox = computePresetBox(alt, {
      viewport,
      safeMargin,
      boxWidth: options.boxWidth,
      boxHeight: options.boxHeight,
    });
    const altCollision = computeAabbIntersection(altBox, subject);

    if (altCollision === 0) {
      return {
        box: altBox,
        preset: 'auto',
        resolvedPosition: alt,
        collidesWithSubject: false,
        collisionArea: 0,
      };
    }

    if (altCollision < bestCandidate.collisionArea) {
      bestCandidate = { preset: alt, box: altBox, collisionArea: altCollision };
    }
  }

  return {
    box: bestCandidate.box,
    preset: 'auto',
    resolvedPosition: bestCandidate.preset,
    collidesWithSubject: true,
    collisionArea: bestCandidate.collisionArea,
  };
}

/**
 * Resolves caption placement returning { box, position }.
 * Standard entry point used by CaptionSegmenter and Remotion layout.
 */
export function resolveCaptionPlacement(options: PlacementOptions = {}): {
  box: CaptionBoundingBox;
  position: CaptionPosition;
} {
  const planned = planSafeAreaPlacement(options);
  return {
    box: planned.box,
    position: planned.resolvedPosition,
  };
}

/**
 * Validates a caption box layout against safe margin boundaries and subject collisions.
 */
export function validateCaptionBoxLayout(
  box: CaptionBoundingBox,
  subject?: SubjectRegion | null,
  viewport: Viewport = DEFAULT_VIEWPORT,
  safeMargin: number = DEFAULT_SAFE_MARGIN
): LayoutValidationResult {
  const errors: string[] = [];

  if (box.width <= 0 || box.height <= 0) {
    return { valid: false, errors: ['Invalid box dimensions'], reason: 'Invalid box dimensions' };
  }

  if (box.x < safeMargin) {
    errors.push(`Box left edge ${box.x} < safe margin ${safeMargin}`);
  }
  if (box.y < safeMargin) {
    errors.push(`Box top edge ${box.y} < safe margin ${safeMargin}`);
  }
  if (box.x + box.width > viewport.width - safeMargin) {
    errors.push('Box right edge exceeds safe margin');
  }
  if (box.y + box.height > viewport.height - safeMargin) {
    errors.push('Box bottom edge exceeds safe margin');
  }

  let collisionArea = 0;
  if (subject) {
    collisionArea = computeAabbIntersection(box, subject);
    if (collisionArea > 0) {
      errors.push(`Collision with subject_region detected (overlap area: ${collisionArea}px²)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    reason: errors.length > 0 ? errors[0] : undefined,
    collisionArea,
  };
}
