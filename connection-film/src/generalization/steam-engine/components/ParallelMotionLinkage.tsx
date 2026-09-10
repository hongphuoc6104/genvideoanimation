import React from 'react';
import { THEME } from './DesignTokens';

export interface ParallelMotionLinkageProps {
  beamAngleDeg: number; // -15° to +15°
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const ParallelMotionLinkage: React.FC<ParallelMotionLinkageProps> = ({
  beamAngleDeg,
  width = 540,
  height = 460,
  showLabels = true,
}) => {
  const pivotX = 270;
  const pivotY = 140;
  const beamHalfLen = 180;

  // Beam endpoints
  const rad = (beamAngleDeg * Math.PI) / 180;
  const leftX = pivotX - Math.cos(rad) * beamHalfLen;
  const leftY = pivotY - Math.sin(rad) * beamHalfLen;
  const rightX = pivotX + Math.cos(rad) * beamHalfLen;
  const rightY = pivotY + Math.sin(rad) * beamHalfLen;

  // Watt's Parallel Motion Linkage (Pantograph joints on left side)
  // Joint A (Left beam tip)
  const jAx = leftX;
  const jAy = leftY;

  // Joint B (Intermediate beam point)
  const jBx = pivotX - Math.cos(rad) * (beamHalfLen * 0.5);
  const jBy = pivotY - Math.sin(rad) * (beamHalfLen * 0.5);

  // Link lengths
  const linkLen = 90;
  // Joint C (Parallel lower link joint)
  const jCx = jBx;
  const jCy = jBy + linkLen;

  // Joint D (Piston rod top pivot - perfectly vertical line X = 90)
  const pRodX = 90;
  // Vertical stroke formula approximation
  const pRodY = leftY + linkLen;

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="beamMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* 1. CENTRAL FULCRUM PILLAR */}
        <g id="fulcrum-support">
          <polygon
            points={`${pivotX - 35},${height - 40} ${pivotX + 35},${height - 40} ${pivotX + 16},${pivotY} ${pivotX - 16},${pivotY}`}
            fill="#1E293B"
            stroke="#475569"
            strokeWidth={3}
          />
          <circle cx={pivotX} cy={pivotY} r={18} fill="#F59E0B" stroke="#B45309" strokeWidth={4} />
        </g>

        {/* 2. MAIN WALKING BEAM */}
        <g id="walking-beam">
          <line
            x1={leftX}
            y1={leftY}
            x2={rightX}
            y2={rightY}
            stroke="url(#beamMetal)"
            strokeWidth={22}
            strokeLinecap="round"
          />
          <circle cx={leftX} cy={leftY} r={12} fill="#EF4444" stroke="#7F1D1D" strokeWidth={3} />
          <circle cx={rightX} cy={rightY} r={12} fill="#3B82F6" stroke="#1D4ED8" strokeWidth={3} />
          <circle cx={jBx} cy={jBy} r={8} fill="#F59E0B" />
        </g>

        {/* 3. PARALLEL MOTION LINKAGE BARS (Watt's Pantograph) */}
        <g id="pantograph-bars" stroke="#F8FAFC" strokeWidth={6} strokeLinecap="round">
          {/* Vertical link A -> D */}
          <line x1={jAx} y1={jAy} x2={pRodX} y2={pRodY} stroke="#F59E0B" strokeWidth={8} />
          {/* Vertical link B -> C */}
          <line x1={jBx} y1={jBy} x2={jCx} y2={jCy} stroke="#CBD5E1" />
          {/* Horizontal link C -> D */}
          <line x1={jCx} y1={jCy} x2={pRodX} y2={pRodY} stroke="#CBD5E1" />
        </g>

        {/* Pantograph joints */}
        <g id="pantograph-joints">
          <circle cx={jCx} cy={jCy} r={9} fill="#D97706" />
          <circle cx={pRodX} cy={pRodY} r={12} fill="#10B981" stroke="#065F46" strokeWidth={3} />
        </g>

        {/* 4. VERTICAL PISTON ROD (Strictly Straight Vertical Guide) */}
        <g id="piston-rod-guide">
          {/* Virtual vertical trajectory guideline */}
          <line
            x1={pRodX}
            y1={leftY - 40}
            x2={pRodX}
            y2={height - 50}
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.6}
          />
          {/* Piston Rod */}
          <line
            x1={pRodX}
            y1={pRodY}
            x2={pRodX}
            y2={height - 50}
            stroke="#E2E8F0"
            strokeWidth={14}
            strokeLinecap="round"
          />
        </g>

        {/* 5. RIGHT SIDE CONNECTING ROD (To Flywheel) */}
        <g id="connecting-rod">
          <line
            x1={rightX}
            y1={rightY}
            x2={rightX + 20}
            y2={height - 50}
            stroke="#94A3B8"
            strokeWidth={12}
            strokeLinecap="round"
          />
        </g>

        {/* 6. LABELS */}
        {showLabels && (
          <g id="parallel-labels">
            <text
              x={pivotX}
              y={40}
              textAnchor="middle"
              fill={THEME.colors.textPrimary}
              fontSize={THEME.typography.cardTitle}
              fontWeight="bold"
            >
              CƠ CẤU CHUYỂN ĐỘNG SONG SONG
            </text>
            <text
              data-role="secondary"
              x={pivotX}
              y={height - 12}
              textAnchor="middle"
              fill={THEME.colors.accentGreen}
              fontSize={THEME.typography.secondary}
              fontWeight="600"
            >
              ✦ Dẫn hướng thẳng đứng tuyệt đối, không kẹt xi-lanh
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
