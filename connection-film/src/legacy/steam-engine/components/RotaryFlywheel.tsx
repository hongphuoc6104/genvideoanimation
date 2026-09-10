import React from 'react';
import { THEME } from './DesignTokens';

export interface RotaryFlywheelProps {
  rotationAngleDeg: number;
  width?: number;
  height?: number;
  showBelt?: boolean;
  showLabels?: boolean;
}

export const RotaryFlywheel: React.FC<RotaryFlywheelProps> = ({
  rotationAngleDeg,
  width = 460,
  height = 500,
  showBelt = true,
  showLabels = true,
}) => {
  const centerX = width / 2;
  const centerY = 240;
  const outerRadius = 170;
  const rimThick = 24;
  const hubRadius = 38;

  // Crank pin location (radius 85)
  const crankRad = (rotationAngleDeg * Math.PI) / 180;
  const crankPinX = centerX + Math.cos(crankRad) * 85;
  const crankPinY = centerY + Math.sin(crankRad) * 85;

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="flywheelMetal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          <filter id="metalShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 1. TRANSMISSION BELT (To Factory Loom Shaft) */}
        {showBelt && (
          <g id="transmission-belt" opacity={0.85}>
            <path
              d={`M ${centerX} ${centerY - outerRadius} L ${width + 40} ${centerY - outerRadius + 30} L ${width + 40} ${centerY + outerRadius - 30} L ${centerX} ${centerY + outerRadius} Z`}
              fill="none"
              stroke="#D97706"
              strokeWidth={8}
              strokeDasharray="16 8"
            />
          </g>
        )}

        {/* 2. ROTATING FLYWHEEL GROUP */}
        <g
          id="flywheel-body"
          transform={`rotate(${rotationAngleDeg}, ${centerX}, ${centerY})`}
          filter="url(#metalShadow)"
        >
          {/* Outer Rim (Cast Iron) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke="url(#flywheelMetal)"
            strokeWidth={rimThick}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius + rimThick / 2}
            fill="none"
            stroke="#1E293B"
            strokeWidth={2}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius - rimThick / 2}
            fill="none"
            stroke="#1E293B"
            strokeWidth={2}
          />

          {/* 6 Curved Spokes */}
          {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = centerX + Math.cos(rad) * hubRadius;
            const y1 = centerY + Math.sin(rad) * hubRadius;
            const x2 = centerX + Math.cos(rad) * (outerRadius - rimThick / 2);
            const y2 = centerY + Math.sin(rad) * (outerRadius - rimThick / 2);

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748B"
                strokeWidth={14}
                strokeLinecap="round"
              />
            );
          })}

          {/* Central Axle Hub */}
          <circle cx={centerX} cy={centerY} r={hubRadius} fill="#1E293B" stroke="#F59E0B" strokeWidth={5} />
          <circle cx={centerX} cy={centerY} r={14} fill="#F8FAFC" />
        </g>

        {/* 3. CRANK PIN & CONNECTING LINKAGE */}
        <g id="crank-linkage">
          {/* Crank Arm */}
          <line
            x1={centerX}
            y1={centerY}
            x2={crankPinX}
            y2={crankPinY}
            stroke="#F59E0B"
            strokeWidth={12}
            strokeLinecap="round"
          />
          {/* Crank Pin Joint */}
          <circle cx={crankPinX} cy={crankPinY} r={14} fill="#EF4444" stroke="#7F1D1D" strokeWidth={3} />

          {/* Connecting Rod going up toward Walking Beam */}
          <line
            x1={crankPinX}
            y1={crankPinY}
            x2={centerX - 50}
            y2={10}
            stroke="#94A3B8"
            strokeWidth={12}
            strokeLinecap="round"
          />
        </g>

        {/* 4. LABELS */}
        {showLabels && (
          <g id="flywheel-labels">
            <text
              x={centerX}
              y={height - 40}
              textAnchor="middle"
              fill={THEME.colors.textPrimary}
              fontSize={THEME.typography.cardTitle}
              fontWeight="bold"
            >
              BÁNH ĐÀ QUÁN TÍNH
            </text>
            <text
              data-role="secondary"
              x={centerX}
              y={height - 6}
              textAnchor="middle"
              fill={THEME.colors.brass}
              fontSize={THEME.typography.secondary}
              fontWeight="600"
            >
              ✦ Biến đổi mô-men quay tròn liên tục
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
