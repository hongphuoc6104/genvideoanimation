/**
 * motion-kit/src/salience/MicroPin.tsx
 *
 * Standardized SVG Micro-Pin component for Mode 2 (Progressive Unveil / Solo Focus).
 * Renders a compact locator badge with `#idx` anchor pin.
 *
 * INVARIANT: Enforces fontSize >= 30px at all times to strictly comply
 * with the mobile typography floor validator (validators/validate-mobile-typography.ts).
 */

import React from 'react';
import { MicroPinProps } from './types';

export const MicroPin: React.FC<MicroPinProps> = ({
  cx,
  cy,
  x,
  y,
  label,
  color = '#64748B',
  pinRadius = 14,
  fontSize = 30,
  badgeBackground = '#0F172A',
  className,
  style,
}) => {
  const posX = cx ?? x ?? 0;
  const posY = cy ?? y ?? 0;

  // Strict mobile typography floor enforcement (minimum 30px)
  const safeFontSize = Math.max(30, Number.isFinite(fontSize) ? fontSize : 30);

  const isInside = pinRadius >= 28;
  const textY = isInside ? 0 : pinRadius + Math.round(safeFontSize * 0.9);
  const dominantBaseline = isInside ? 'central' : 'auto';

  return (
    <g
      transform={`translate(${posX}, ${posY})`}
      className={`micro-pin ${className || ''}`.trim()}
      style={style}
    >
      <circle
        cx={0}
        cy={0}
        r={pinRadius}
        fill={badgeBackground}
        stroke={color}
        strokeWidth={2.5}
      />
      {!isInside && (
        <circle
          cx={0}
          cy={0}
          r={Math.max(3, pinRadius * 0.4)}
          fill={color}
        />
      )}
      <text
        x={0}
        y={textY}
        textAnchor="middle"
        dominantBaseline={dominantBaseline}
        fill={color}
        fontSize={safeFontSize}
        fontWeight={700}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>
    </g>
  );
};
