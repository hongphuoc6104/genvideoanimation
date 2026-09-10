import React from 'react';
import { THEME } from './DesignTokens';

export interface SeparateCondenserProps {
  condensingActive: boolean;
  pumpStrokeProgress: number; // 0 to 1
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const SeparateCondenser: React.FC<SeparateCondenserProps> = ({
  condensingActive,
  pumpStrokeProgress,
  width = 440,
  height = 540,
  showLabels = true,
}) => {
  const tankX = 60;
  const tankY = 80;
  const tankWidth = 320;
  const tankHeight = 360;

  // Air pump position
  const pumpX = tankX + 190;
  const pumpY = tankY + 60;
  const pumpWidth = 90;
  const pumpHeight = 240;
  const pumpPistonY = pumpY + 40 + pumpStrokeProgress * (pumpHeight - 90);

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="coldWaterBath" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0891B2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0E7490" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="condenserMetal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <filter id="coldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. OUTER COLD WATER CISTERN (Reservoir) */}
        <g id="cistern">
          <rect
            x={tankX}
            y={tankY}
            width={tankWidth}
            height={tankHeight}
            rx={16}
            fill="url(#coldWaterBath)"
            stroke="#06B6D4"
            strokeWidth={3}
            filter="url(#coldGlow)"
          />
          {/* Wave/water surface lines */}
          <path
            d={`M ${tankX + 10} ${tankY + 24} Q ${tankX + 80} ${tankY + 16}, ${tankX + 160} ${tankY + 24} T ${tankX + 310} ${tankY + 24}`}
            fill="none"
            stroke="#67E8F9"
            strokeWidth={3}
          />
        </g>

        {/* 2. INNER SEPARATE CONDENSING VESSEL */}
        <g id="inner-condenser" transform={`translate(${tankX + 24}, ${tankY + 40})`}>
          {/* Main condensing chamber */}
          <rect
            x={0}
            y={20}
            width={140}
            height={260}
            rx={12}
            fill="#0F172A"
            stroke="url(#condenserMetal)"
            strokeWidth={4}
          />

          {/* Steam inlet pipe from main cylinder */}
          <path
            d="M -36 50 L 0 50 L 0 70 L -36 70 Z"
            fill="#F97316"
            stroke="#C2410C"
            strokeWidth={2}
          />

          {/* Cold injection spray condensing steam */}
          {condensingActive && (
            <g id="condensing-spray">
              {/* Cold spray jet */}
              <line x1={70} y1={40} x2={30} y2={120} stroke="#38BDF8" strokeWidth={3} strokeDasharray="4 4" />
              <line x1={70} y1={40} x2={70} y2={140} stroke="#38BDF8" strokeWidth={4} strokeDasharray="4 4" />
              <line x1={70} y1={40} x2={110} y2={120} stroke="#38BDF8" strokeWidth={3} strokeDasharray="4 4" />

              {/* Condensed liquid water pool at bottom */}
              <rect x={4} y={230} width={132} height={46} rx={8} fill="#0284C7" opacity="0.9" />
              <circle cx={40} cy={180} r={4} fill="#38BDF8" />
              <circle cx={75} cy={200} r={5} fill="#38BDF8" />
              <circle cx={105} cy={185} r={4} fill="#38BDF8" />
            </g>
          )}

          {/* Pipe connection from condenser to air pump */}
          <path
            d="M 140 240 L 166 240 L 166 220 L 140 220 Z"
            fill="#334155"
            stroke="#1E293B"
            strokeWidth={2}
          />
        </g>

        {/* 3. AIR PUMP (Extracts air and condensate to maintain vacuum) */}
        <g id="air-pump">
          {/* Pump cylinder barrel */}
          <rect
            x={pumpX}
            y={pumpY}
            width={pumpWidth}
            height={pumpHeight}
            rx={8}
            fill="#0F172A"
            stroke="url(#condenserMetal)"
            strokeWidth={3}
          />

          {/* Pump Piston Bucket */}
          <rect
            x={pumpX + 4}
            y={pumpPistonY}
            width={pumpWidth - 8}
            height={26}
            rx={4}
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth={2}
          />

          {/* Pump Vertical Rod */}
          <line
            x1={pumpX + pumpWidth / 2}
            y1={tankY - 20}
            x2={pumpX + pumpWidth / 2}
            y2={pumpPistonY}
            stroke="#CBD5E1"
            strokeWidth={8}
          />

          {/* One-way flap valves on piston */}
          <circle cx={pumpX + 26} cy={pumpPistonY + 13} r={5} fill="#334155" />
          <circle cx={pumpX + pumpWidth - 26} cy={pumpPistonY + 13} r={5} fill="#334155" />
        </g>

        {/* 4. LABELS */}
        {showLabels && (
          <g id="condenser-labels">
            <text
              x={tankX + tankWidth / 2}
              y={tankY - 24}
              textAnchor="middle"
              fill={THEME.colors.condenserCold}
              fontSize={THEME.typography.cardTitle}
              fontWeight="bold"
            >
              BÌNH NGƯNG TỤ TÁCH RỜI
            </text>

            <text
              data-role="secondary"
              x={tankX + tankWidth / 2}
              y={tankY + tankHeight + 48}
              textAnchor="middle"
              fill={THEME.colors.textSecondary}
              fontSize={THEME.typography.secondary}
              fontWeight="600"
            >
              ✦ Làm lạnh biệt lập (20°C) • Tạo chân không liên tục
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
