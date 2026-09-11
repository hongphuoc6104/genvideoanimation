import React from 'react';
import { solveTwoBoxIntersection } from './boundaryIntersection';
import { OpaqueCard } from './OpaqueCard';
import type {
  BoxDescriptor,
  Point2D,
  RadialItemData,
  RadialLabelGroupProps,
} from './types';

export interface RadialPillLayout {
  index: number;
  item: RadialItemData;
  angleDeg: number;
  normalizedAngle: number;
  radius: number;
  nodePos: Point2D;
  pillX: number;
  pillY: number;
  pillWidth: number;
  pillHeight: number;
  rotationDeg: number;
  isFlipped: boolean;
  rayStart: Point2D;
  rayEnd: Point2D;
}

/**
 * Pure mathematical layout solver for radial label distribution.
 * Calculates polar positions, horizontal clamping ([36, 1044] x [180, 1420]),
 * and tangential flip alignment to prevent inverted upside-down text.
 * Supports Staggered Radii (R_odd != R_even) for angular differences < 45 deg to eliminate collisions.
 */
export function calculateRadialLayout(
  centerX: number,
  centerY: number,
  radius: number,
  items: RadialItemData[],
  startAngleDeg = -90,
  angleRangeDeg = 360,
  layoutMode: 'horizontal-pill' | 'tangential-rotated' = 'horizontal-pill',
  hubBox?: BoxDescriptor,
  staggerRadii?: [number, number],
  staggerOffset?: number
): RadialPillLayout[] {
  const n = items.length;
  if (n === 0) return [];

  const stageMinX = 36;
  const stageMaxX = 1044;
  const stageMinY = 180;
  const stageMaxY = 1420;

  // Determine raw angles for all items
  const rawAngles = items.map((item, index) =>
    item.angleDeg !== undefined
      ? item.angleDeg
      : startAngleDeg + (index / (angleRangeDeg === 360 ? n : Math.max(1, n - 1))) * angleRangeDeg
  );

  // Compute minimum angular separation between items to detect narrow angles (< 45 deg)
  let minAngularDiff = 360;
  if (n > 1) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let diff = Math.abs(rawAngles[i] - rawAngles[j]) % 360;
        if (diff > 180) diff = 360 - diff;
        if (diff < minAngularDiff) minAngularDiff = diff;
      }
    }
  }

  const shouldStagger =
    staggerRadii !== undefined ||
    (staggerOffset !== undefined && staggerOffset !== 0) ||
    minAngularDiff < 45;

  const defaultDeltaR = staggerOffset ?? 100;

  return items.map((item, index) => {
    const rawAngle = rawAngles[index];
    const normalizedAngle = ((rawAngle % 360) + 360) % 360;
    const rad = (normalizedAngle * Math.PI) / 180;

    // Staggered Radii calculation: R_i = R_base + (i % 2) * deltaR
    let itemRadius: number;
    if (item.radius !== undefined) {
      itemRadius = item.radius;
    } else if (staggerRadii) {
      itemRadius = index % 2 === 0 ? staggerRadii[0] : staggerRadii[1];
    } else if (shouldStagger) {
      itemRadius = radius + (index % 2) * defaultDeltaR;
    } else {
      itemRadius = radius;
    }

    if (item.radiusOffset !== undefined) {
      itemRadius += item.radiusOffset;
    }

    const nodeX = centerX + itemRadius * Math.cos(rad);
    const nodeY = centerY + itemRadius * Math.sin(rad);
    const nodePos: Point2D = { x: nodeX, y: nodeY };

    const w = item.width ?? 280;
    const h = item.height ?? 60;

    let rawPillX: number;
    let rawPillY: number;
    let rotationDeg = 0;
    let isFlipped = false;

    if (layoutMode === 'tangential-rotated') {
      // Centered at node
      rawPillX = nodeX - w / 2;
      rawPillY = nodeY - h / 2;

      // Flip alignment: if angle is in (90, 270), flip by 180 to keep text readable
      if (normalizedAngle > 90 && normalizedAngle < 270) {
        rotationDeg = (normalizedAngle + 180) % 360;
        isFlipped = true;
      } else {
        rotationDeg = normalizedAngle;
        isFlipped = false;
      }
    } else {
      // Default: 'horizontal-pill' mode (always 0 deg rotation)
      rotationDeg = 0;
      isFlipped = false;

      const sinVal = Math.sin(rad);
      const cosVal = Math.cos(rad);

      if (sinVal > 0.35) {
        // Lower hemisphere: place pill below node
        rawPillX = nodeX - w / 2;
        rawPillY = nodeY + 12;
      } else if (sinVal < -0.35) {
        // Upper hemisphere: place pill above node
        rawPillX = nodeX - w / 2;
        rawPillY = nodeY - h - 12;
      } else if (cosVal >= 0) {
        // Right side
        rawPillX = nodeX + 12;
        rawPillY = nodeY - h / 2;
      } else {
        // Left side
        rawPillX = nodeX - w - 12;
        rawPillY = nodeY - h / 2;
      }
    }

    // Clamp within Stage Zone 2 bounds
    const pillX = Math.max(stageMinX, Math.min(stageMaxX - w, rawPillX));
    const pillY = Math.max(stageMinY, Math.min(stageMaxY - h, rawPillY));

    // Calculate ray start and end
    let rayStart: Point2D = { x: centerX, y: centerY };
    let rayEnd: Point2D = { x: nodeX, y: nodeY };

    const pillBox: BoxDescriptor = {
      x: pillX,
      y: pillY,
      width: w,
      height: h,
      shape: 'rounded-rect',
      cornerRadius: item.rx ?? 16,
    };

    if (hubBox) {
      const intersection = solveTwoBoxIntersection(hubBox, pillBox, 4, 4);
      rayStart = intersection.start;
      rayEnd = intersection.end;
    }

    return {
      index,
      item,
      angleDeg: rawAngle,
      normalizedAngle,
      radius: itemRadius,
      nodePos,
      pillX,
      pillY,
      pillWidth: w,
      pillHeight: h,
      rotationDeg,
      isFlipped,
      rayStart,
      rayEnd,
    };
  });
}

/**
 * Reusable RadialLabelGroup Component.
 * Coordinates radial layouts with horizontal or flipped tangential text alignment,
 * enforcing horizontal boundary clamping [36, 1044] px and subtitle clearance.
 */
export const RadialLabelGroup: React.FC<RadialLabelGroupProps> = ({
  centerX,
  centerY,
  radius,
  staggerRadii,
  staggerOffset,
  hubBox,
  items,
  startAngleDeg = -90,
  angleRangeDeg = 360,
  activeItemIndex,
  layoutMode = 'horizontal-pill',
  useOpaqueShield = true,
  showRays = true,
  rayColor = '#334155',
  rayWidth = 2,
  className,
  style,
  onItemClick,
}) => {
  const layouts = calculateRadialLayout(
    centerX,
    centerY,
    radius,
    items,
    startAngleDeg,
    angleRangeDeg,
    layoutMode,
    hubBox,
    staggerRadii,
    staggerOffset
  );

  return (
    <g className={`radial-label-group ${className ?? ''}`} style={style}>
      {/* Connector Rays */}
      {showRays && (
        <g className="radial-rays">
          {layouts.map((l) => (
            <line
              key={`ray-${l.item.id}`}
              x1={l.rayStart.x}
              y1={l.rayStart.y}
              x2={l.rayEnd.x}
              y2={l.rayEnd.y}
              stroke={rayColor}
              strokeWidth={rayWidth}
              strokeDasharray="6 4"
            />
          ))}
        </g>
      )}

      {/* Radial Pills */}
      {layouts.map((l) => {
        const isActive =
          activeItemIndex === undefined || activeItemIndex === l.index;
        const isDimmed = activeItemIndex !== undefined && !isActive;

        const pillContent = (
          <g
            style={{ cursor: onItemClick ? 'pointer' : 'default' }}
            onClick={() => onItemClick?.(l.item, l.index)}
          >
            {/* Label */}
            <text
              x={l.pillX + l.pillWidth / 2}
              y={l.pillY + (l.item.sublabel ? l.pillHeight / 2 - 8 : l.pillHeight / 2)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={l.item.color ?? '#F8FAFC'}
              fontSize={18}
              fontWeight={600}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {l.item.label}
            </text>

            {/* Sublabel if present */}
            {l.item.sublabel && (
              <text
                x={l.pillX + l.pillWidth / 2}
                y={l.pillY + l.pillHeight / 2 + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94A3B8"
                fontSize={13}
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {l.item.sublabel}
              </text>
            )}
          </g>
        );

        const cardElement = useOpaqueShield ? (
          <OpaqueCard
            key={`card-${l.item.id}`}
            x={l.pillX}
            y={l.pillY}
            width={l.pillWidth}
            height={l.pillHeight}
            rx={l.item.rx ?? 16}
            isActive={isActive}
            isDimmed={isDimmed}
            activeBorderColor={l.item.color ?? '#38BDF8'}
          >
            {pillContent}
          </OpaqueCard>
        ) : (
          <g key={`pill-${l.item.id}`}>
            <rect
              x={l.pillX}
              y={l.pillY}
              width={l.pillWidth}
              height={l.pillHeight}
              rx={l.item.rx ?? 16}
              fill="#0F172A"
              stroke={isActive ? (l.item.color ?? '#38BDF8') : '#334155'}
              strokeWidth={isActive ? 3 : 2}
            />
            {pillContent}
          </g>
        );

        return (
          <g
            key={`pill-group-${l.item.id}`}
            transform={
              l.rotationDeg !== 0
                ? `rotate(${l.rotationDeg}, ${l.pillX + l.pillWidth / 2}, ${l.pillY + l.pillHeight / 2})`
                : undefined
            }
          >
            {cardElement}
          </g>
        );
      })}
    </g>
  );
};
