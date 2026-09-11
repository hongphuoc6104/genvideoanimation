import React from 'react';
import { computePillDimensions } from './measureTextMetrics';

export interface AutoPillProps {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  paddingHorizontal?: number;
  minWidth?: number;
  maxWidth?: number;
  height?: number;
  anchor?: 'center' | 'top-left';
  opacity?: number;
  filter?: string;
  style?: React.CSSProperties;
  dataBadge?: boolean;
}

/**
 * AutoPill: Content-Driven SVG Pill Container
 *
 * Dynamically computes container width to ensure that text is safely contained
 * with a strictly enforced horizontal margin (default >= 34px, satisfying the >= 30px gate).
 * Uses an opaque solid background (#0F172A) to prevent background visual penetration.
 */
export const AutoPill: React.FC<AutoPillProps> = ({
  x,
  y,
  text,
  fontSize = 30,
  fontWeight = 800,
  color = '#FFFFFF',
  fill = '#0F172A',
  stroke = '#38BDF8',
  strokeWidth = 2,
  rx = 16,
  paddingHorizontal = 34,
  minWidth = 140,
  maxWidth = 980,
  height = 54,
  anchor = 'center',
  opacity = 1.0,
  filter,
  style,
  dataBadge = true,
}) => {
  const dims = computePillDimensions(text, fontSize, {
    paddingHorizontal,
    minWidth,
    maxWidth,
    height,
    fontWeight,
  });

  const rectX = anchor === 'center' ? x - dims.width / 2 : x;
  const rectY = anchor === 'center' ? y - dims.height / 2 : y;
  const textX = rectX + dims.width / 2;
  const textY = rectY + dims.height / 2 + Math.round(fontSize * 0.35);

  return (
    <g
      opacity={opacity}
      style={{
        filter,
        ...style,
      }}
      data-badge={dataBadge ? 'true' : undefined}
      data-autopill="true"
    >
      <rect
        x={rectX}
        y={rectY}
        width={dims.width}
        height={dims.height}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontWeight={fontWeight}
      >
        {text}
      </text>
    </g>
  );
};
