/**
 * ParallelMotionLinkage.tsx
 * Mathematically rigorous Watt's Parallel Motion Linkage (Pantograph).
 * Enforces rigid-bar invariance: all linkage bars (AB, BC, CD, DA, and radius rod EC)
 * maintain exactly constant nominal length (90.00px) with zero stretching (ΔL = 0px).
 */

import React from 'react';
import { THEME } from './DesignTokens';

export interface ParallelMotionLinkageProps {
  beamAngleDeg: number; // -15° to +15°
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export interface WattLinkageState {
  jA: { x: number; y: number };
  jB: { x: number; y: number };
  jC: { x: number; y: number };
  jD: { x: number; y: number };
  rightTip: { x: number; y: number };
  anchorE: { x: number; y: number };
  lenCD: number;
  lenAD: number;
  lenBC: number;
  lenEC: number;
  lenAB: number;
}

export function solveWattLinkage(
  beamAngleDeg: number,
  pivotX: number = 270,
  pivotY: number = 140,
  linkLen: number = 90,
  beamHalfLen: number = 180
): WattLinkageState {
  const rad = (beamAngleDeg * Math.PI) / 180;
  const cosRad = Math.cos(rad);
  const sinRad = Math.sin(rad);

  // Joint A (Left beam tip): R = 180
  const jAx = pivotX - cosRad * beamHalfLen;
  const jAy = pivotY - sinRad * beamHalfLen;

  // Joint B (Intermediate beam point): R = 90
  const jBx = pivotX - cosRad * linkLen;
  const jBy = pivotY - sinRad * linkLen;

  // Right beam tip
  const rightX = pivotX + cosRad * beamHalfLen;
  const rightY = pivotY + sinRad * beamHalfLen;

  // Fixed ground anchor pivot E
  const anchorEx = pivotX;
  const anchorEy = pivotY + linkLen;

  // Circle-circle intersection between Circle(B, linkLen) and Circle(E, linkLen)
  const dx = anchorEx - jBx;
  const dy = anchorEy - jBy;
  const distBE = Math.sqrt(dx * dx + dy * dy);
  const safeDist = Math.min(distBE, 2 * linkLen - 0.001);

  const mx = (jBx + anchorEx) / 2;
  const my = (jBy + anchorEy) / 2;
  const h = Math.sqrt(Math.max(0, linkLen * linkLen - (safeDist / 2) * (safeDist / 2)));

  const nx = -dy / (distBE || 1);
  const ny = dx / (distBE || 1);

  const jCx = mx + h * nx;
  const jCy = my + h * ny;

  // Parallelogram pantograph: D = C + (A - B)
  const pRodX = jCx + (jAx - jBx);
  const pRodY = jCy + (jAy - jBy);

  return {
    jA: { x: jAx, y: jAy },
    jB: { x: jBx, y: jBy },
    jC: { x: jCx, y: jCy },
    jD: { x: pRodX, y: pRodY },
    rightTip: { x: rightX, y: rightY },
    anchorE: { x: anchorEx, y: anchorEy },
    lenCD: Math.hypot(pRodX - jCx, pRodY - jCy),
    lenAD: Math.hypot(pRodX - jAx, pRodY - jAy),
    lenBC: Math.hypot(jCx - jBx, jCy - jBy),
    lenEC: Math.hypot(jCx - anchorEx, jCy - anchorEy),
    lenAB: Math.hypot(jAx - jBx, jAy - jBy),
  };
}

export const ParallelMotionLinkage: React.FC<ParallelMotionLinkageProps> = ({
  beamAngleDeg,
  width = 540,
  height = 460,
  showLabels = true,
}) => {
  const pivotX = 270;
  const pivotY = 140;
  const linkLen = 90;
  const beamHalfLen = 180;

  const state = solveWattLinkage(beamAngleDeg, pivotX, pivotY, linkLen, beamHalfLen);
  const { jA, jB, jC, jD, rightTip, anchorE } = state;
  const jAx = jA.x;
  const jAy = jA.y;
  const jBx = jB.x;
  const jBy = jB.y;
  const jCx = jC.x;
  const jCy = jC.y;
  const pRodX = jD.x;
  const pRodY = jD.y;
  const rightX = rightTip.x;
  const rightY = rightTip.y;
  const anchorEx = anchorE.x;
  const anchorEy = anchorE.y;

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
          {/* Ground anchor pivot E */}
          <circle cx={anchorEx} cy={anchorEy} r={9} fill="#64748B" stroke="#334155" strokeWidth={2} />
        </g>

        {/* 2. MAIN WALKING BEAM */}
        <g id="walking-beam">
          <line
            x1={jAx}
            y1={jAy}
            x2={rightX}
            y2={rightY}
            stroke="url(#beamMetal)"
            strokeWidth={22}
            strokeLinecap="round"
          />
          <circle cx={jAx} cy={jAy} r={12} fill="#EF4444" stroke="#7F1D1D" strokeWidth={3} />
          <circle cx={rightX} cy={rightY} r={12} fill="#3B82F6" stroke="#1D4ED8" strokeWidth={3} />
          <circle cx={jBx} cy={jBy} r={8} fill="#F59E0B" />
        </g>

        {/* 3. PARALLEL MOTION LINKAGE BARS (Watt's Pantograph - Constant 90px Rigid Bars) */}
        <g id="pantograph-bars" stroke="#F8FAFC" strokeWidth={6} strokeLinecap="round">
          {/* Fixed-length link A -> D (Length: 90px) */}
          <line x1={jAx} y1={jAy} x2={pRodX} y2={pRodY} stroke="#F59E0B" strokeWidth={8} />
          {/* Fixed-length link B -> C (Length: 90px) */}
          <line x1={jBx} y1={jBy} x2={jCx} y2={jCy} stroke="#CBD5E1" />
          {/* Fixed-length link C -> D (Length: 90px) */}
          <line x1={jCx} y1={jCy} x2={pRodX} y2={pRodY} stroke="#CBD5E1" />
          {/* Fixed-length Watt radius rod E -> C (Length: 90px) */}
          <line x1={anchorEx} y1={anchorEy} x2={jCx} y2={jCy} stroke="#64748B" strokeWidth={4} strokeDasharray="5 3" />
        </g>

        {/* Pantograph joints */}
        <g id="pantograph-joints">
          <circle cx={jCx} cy={jCy} r={9} fill="#D97706" />
          <circle cx={pRodX} cy={pRodY} r={12} fill="#10B981" stroke="#065F46" strokeWidth={3} />
        </g>

        {/* 4. VERTICAL PISTON ROD */}
        <g id="piston-rod-guide">
          {/* Straight vertical guide path */}
          <line
            x1={90}
            y1={jAy - 40}
            x2={90}
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
              CƠ CẤU CHUYỂN ĐỘNG SONG SONG WATT
            </text>
            <text
              x={pivotX}
              y={72}
              textAnchor="middle"
              fill="#38BDF8"
              fontSize={THEME.typography.secondary}
            >
              Thanh truyền thẳng góc tuyệt đối (Độ dài thanh C-D = 90px cố định)
            </text>
            <text
              x={pRodX - 20}
              y={pRodY + 40}
              textAnchor="end"
              fill="#10B981"
              fontSize={THEME.typography.secondary}
              fontWeight="bold"
            >
              Khớp D (Piston)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
