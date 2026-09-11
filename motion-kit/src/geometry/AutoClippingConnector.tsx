import React from 'react';
import { solveTwoBoxIntersection } from './boundaryIntersection';
import type {
  AutoClippingConnectorProps,
  BoxDescriptor,
  ConnectorRouting,
  Point2D,
  TwoBoxIntersectionResult,
} from './types';

/**
 * Computes arrowhead triangle points oriented along tangent angle in degrees.
 */
export function computeArrowheadPoints(
  tip: Point2D,
  angleDeg: number,
  size: number
): { pointsString: string; tip: Point2D; leftWing: Point2D; rightWing: Point2D } {
  const rad = (angleDeg * Math.PI) / 180;
  const spread = Math.PI / 6; // 30 degrees

  const leftWing: Point2D = {
    x: tip.x - size * Math.cos(rad - spread),
    y: tip.y - size * Math.sin(rad - spread),
  };

  const rightWing: Point2D = {
    x: tip.x - size * Math.cos(rad + spread),
    y: tip.y - size * Math.sin(rad + spread),
  };

  const pointsString = `${tip.x},${tip.y} ${leftWing.x},${leftWing.y} ${rightWing.x},${rightWing.y}`;

  return { pointsString, tip, leftWing, rightWing };
}

/**
 * Generates the SVG path command and tangents for a connector between two points.
 */
export function generateConnectorPath(
  intersection: TwoBoxIntersectionResult,
  routing: ConnectorRouting = 'straight',
  curvature = 0.2
): {
  d: string;
  tangentStart: number;
  tangentEnd: number;
  midpoint: Point2D;
  controlPoint?: Point2D;
} {
  const { start, end } = intersection;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (routing === 'curved' && length > 1e-6) {
    // Quadratic Bezier with perpendicular control point offset
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const nx = -dy / length;
    const ny = dx / length;
    const offset = curvature * length;

    const ctrlX = midX + offset * nx;
    const ctrlY = midY + offset * ny;
    const controlPoint: Point2D = { x: ctrlX, y: ctrlY };

    // Bezier point at t = 0.5: B(0.5) = 0.25*start + 0.5*ctrl + 0.25*end
    const midpoint: Point2D = {
      x: 0.25 * start.x + 0.5 * ctrlX + 0.25 * end.x,
      y: 0.25 * start.y + 0.5 * ctrlY + 0.25 * end.y,
    };

    // Tangents: B'(0) = 2*(ctrl - start), B'(1) = 2*(end - ctrl)
    const tangentStart = (Math.atan2(ctrlY - start.y, ctrlX - start.x) * 180) / Math.PI;
    const tangentEnd = (Math.atan2(end.y - ctrlY, end.x - ctrlX) * 180) / Math.PI;

    const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;

    return { d, tangentStart, tangentEnd, midpoint, controlPoint };
  }

  if (routing === 'orthogonal' && length > 1e-6) {
    // Manhattan routing with fillets
    const midX = (start.x + end.x) / 2;
    const rf = Math.min(16, Math.abs(dx) / 2, Math.abs(dy) / 2);

    if (rf < 2) {
      // Degenerate orthogonal into straight segments
      const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${midX.toFixed(2)} ${start.y.toFixed(2)} L ${midX.toFixed(2)} ${end.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
      const isVertical = Math.abs(dx) < 1e-4;
      const tangentStart = isVertical ? (dy >= 0 ? 90 : -90) : (dx >= 0 ? 0 : 180);
      const tangentEnd = isVertical ? (dy >= 0 ? 90 : -90) : (dx >= 0 ? 0 : 180);
      const midpoint: Point2D = { x: midX, y: (start.y + end.y) / 2 };
      return { d, tangentStart, tangentEnd, midpoint };
    }

    const s1x = dx >= 0 ? 1 : -1;
    const s2y = dy >= 0 ? 1 : -1;
    const s3x = dx >= 0 ? 1 : -1;

    const c1StartX = midX - s1x * rf;
    const c1StartY = start.y;
    const c1EndX = midX;
    const c1EndY = start.y + s2y * rf;

    const c2StartX = midX;
    const c2StartY = end.y - s2y * rf;
    const c2EndX = midX + s3x * rf;
    const c2EndY = end.y;

    const d = [
      `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
      `L ${c1StartX.toFixed(2)} ${c1StartY.toFixed(2)}`,
      `Q ${midX.toFixed(2)} ${start.y.toFixed(2)} ${c1EndX.toFixed(2)} ${c1EndY.toFixed(2)}`,
      `L ${c2StartX.toFixed(2)} ${c2StartY.toFixed(2)}`,
      `Q ${midX.toFixed(2)} ${end.y.toFixed(2)} ${c2EndX.toFixed(2)} ${c2EndY.toFixed(2)}`,
      `L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    ].join(' ');

    const tangentStart = s1x > 0 ? 0 : 180;
    const tangentEnd = s3x > 0 ? 0 : 180;
    const midpoint: Point2D = { x: midX, y: (start.y + end.y) / 2 };

    return { d, tangentStart, tangentEnd, midpoint };
  }

  // Default: straight line
  const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  const tangent = length > 1e-6 ? (Math.atan2(dy, dx) * 180) / Math.PI : 0;
  const midpoint: Point2D = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  return { d, tangentStart: tangent, tangentEnd: tangent, midpoint };
}

function normalizeBox(box: BoxDescriptor): BoxDescriptor {
  let cx = box.cx;
  let cy = box.cy;
  if (box.center) {
    cx = box.center.x;
    cy = box.center.y;
  }
  const cornerRadius = box.cornerRadius ?? box.rx ?? 16;
  const shape =
    box.shape ?? (box.cornerRadius !== undefined || box.rx !== undefined ? 'rounded-rect' : undefined);
  return {
    ...box,
    cx,
    cy,
    cornerRadius,
    shape,
  };
}

/**
 * Reusable AutoClippingConnector SVG Component.
 * Automatically computes ray-box boundary intersections, preventing any
 * interior penetration into card text or content containers.
 */
export const AutoClippingConnector: React.FC<AutoClippingConnectorProps> = ({
  source: sourceProp,
  target: targetProp,
  from,
  to,
  sourceBox,
  targetBox,
  routing = 'straight',
  curvature = 0.2,
  startGap: startGapProp,
  endGap: endGapProp,
  clearanceMargin,
  color: colorProp,
  stroke,
  strokeWidth = 2,
  strokeDasharray,
  dashArray: dashArrayProp,
  progress,
  arrowhead = 'end',
  arrowheadSize = 10,
  label,
  labelOffset = 20,
  labelStyle,
  className,
  style,
}) => {
  const rawSource = sourceProp ?? from ?? sourceBox;
  const rawTarget = targetProp ?? to ?? targetBox;

  if (!rawSource || !rawTarget) {
    return null;
  }

  const source = normalizeBox(rawSource);
  const target = normalizeBox(rawTarget);

  const startGap = startGapProp ?? clearanceMargin ?? 4;
  const endGap = endGapProp ?? clearanceMargin ?? 4;
  const color = stroke ?? colorProp ?? '#38BDF8';
  const effectiveDashArray = strokeDasharray ?? dashArrayProp;

  const intersection = solveTwoBoxIntersection(source, target, startGap, endGap);

  // If boxes overlap or connector is collapsed, suppress rendering to prevent visual glitches
  if (intersection.isOverlapping || intersection.clippedLength <= 0) {
    return null;
  }

  const { d, tangentStart, tangentEnd, midpoint } = generateConnectorPath(
    intersection,
    routing,
    curvature
  );

  // Progress reveal calculation
  let dashArray = effectiveDashArray;
  let dashOffset: number | undefined;
  let pathLengthAttr: number | undefined;

  if (progress !== undefined) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    pathLengthAttr = 100;
    dashArray = '100';
    dashOffset = (1 - clampedProgress) * 100;
  }

  // Arrowhead visibility
  const showEndArrow =
    (arrowhead === 'end' || arrowhead === 'both') &&
    (progress === undefined || progress > 0);

  const showStartArrow =
    (arrowhead === 'start' || arrowhead === 'both') &&
    (progress === undefined || progress > 0);

  const endArrow = showEndArrow
    ? computeArrowheadPoints(intersection.end, tangentEnd, arrowheadSize)
    : null;

  const startArrow = showStartArrow
    ? computeArrowheadPoints(intersection.start, tangentStart + 180, arrowheadSize)
    : null;

  // Midpoint label position
  let labelPos = midpoint;
  if (label && labelOffset !== 0) {
    const dx = intersection.end.x - intersection.start.x;
    const dy = intersection.end.y - intersection.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    labelPos = {
      x: midpoint.x + labelOffset * nx,
      y: midpoint.y + labelOffset * ny,
    };
  }

  return (
    <g
      className={`auto-clipping-connector ${className ?? ''}`}
      style={{ pointerEvents: 'none', ...style }}
    >
      {/* Main connector path */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        pathLength={pathLengthAttr}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start Arrowhead */}
      {startArrow && (
        <polygon
          points={startArrow.pointsString}
          fill={color}
        />
      )}

      {/* End Arrowhead */}
      {endArrow && (
        <polygon
          points={endArrow.pointsString}
          fill={color}
        />
      )}

      {/* Midpoint Label */}
      {label && (
        <g transform={`translate(${labelPos.x.toFixed(2)}, ${labelPos.y.toFixed(2)})`}>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={14}
            fontWeight={600}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              ...labelStyle,
            }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
};
