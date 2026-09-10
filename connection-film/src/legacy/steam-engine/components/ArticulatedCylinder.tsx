import React from 'react';
import { THEME } from './DesignTokens';

export interface ArticulatedCylinderProps {
  strokeProgress: number; // 0 (Top Dead Center) to 1 (Bottom Dead Center)
  mode: 'newcomen' | 'watt';
  steamPressure: number; // 0 to 1
  condenserOpen?: boolean;
  waterSprayActive?: boolean;
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const ArticulatedCylinder: React.FC<ArticulatedCylinderProps> = ({
  strokeProgress,
  mode,
  steamPressure,
  condenserOpen = false,
  waterSprayActive = false,
  width = 540,
  height = 680,
  showLabels = true,
}) => {
  // Geometry bounds
  const cylX = 120;
  const cylY = 120;
  const cylWidth = 300;
  const cylHeight = 440;
  const wallThick = 18;
  const jacketThick = 26;

  // Piston stroke travel
  const tdcY = cylY + 40;
  const bdcY = cylY + cylHeight - 90;
  const pistonY = tdcY + strokeProgress * (bdcY - tdcY);
  const pistonHeight = 36;
  const rodWidth = 22;

  // Chamber gas thermal color
  const gasColor =
    mode === 'newcomen' && waterSprayActive
      ? THEME.colors.condenserCold
      : steamPressure > 0.4
      ? THEME.colors.steamHot
      : THEME.colors.steamOrange;

  const gasOpacity = Math.max(0.15, steamPressure * 0.75);

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="pistonMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="35%" stopColor="#CBD5E1" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="steamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gasColor} stopOpacity={gasOpacity} />
            <stop offset="100%" stopColor={gasColor} stopOpacity={gasOpacity * 0.4} />
          </linearGradient>

          <linearGradient id="jacketSteamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
          </linearGradient>

          <filter id="thermalGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. STEAM JACKET (Watt Mode Only: Concentric Isothermal Chamber) */}
        {mode === 'watt' && (
          <g id="steam-jacket" filter="url(#thermalGlow)">
            {/* Outer jacket wall */}
            <rect
              x={cylX - jacketThick - wallThick}
              y={cylY - 10}
              width={cylWidth + (jacketThick + wallThick) * 2}
              height={cylHeight + 20}
              rx={16}
              fill="none"
              stroke="#EA580C"
              strokeWidth={4}
              strokeDasharray="8 4"
            />
            {/* Live steam circulating in jacket space */}
            <rect
              x={cylX - jacketThick}
              y={cylY}
              width={jacketThick}
              height={cylHeight}
              fill="url(#jacketSteamGrad)"
              opacity="0.75"
            />
            <rect
              x={cylX + cylWidth}
              y={cylY}
              width={jacketThick}
              height={cylHeight}
              fill="url(#jacketSteamGrad)"
              opacity="0.75"
            />
          </g>
        )}

        {/* 2. INNER WORKING CYLINDER WALLS */}
        <g id="cylinder-body">
          {/* Working chamber background */}
          <rect
            x={cylX}
            y={cylY}
            width={cylWidth}
            height={cylHeight}
            fill="#0F172A"
            stroke="#334155"
            strokeWidth={3}
          />

          {/* Active Gas/Steam Volume (Above or Below Piston) */}
          <rect
            x={cylX + 2}
            y={cylY + 2}
            width={cylWidth - 4}
            height={Math.max(0, pistonY - cylY)}
            fill="url(#steamGradient)"
          />

          {/* Steam Kinetic Particle Dots */}
          {steamPressure > 0.2 && (
            <g id="steam-particles" opacity={gasOpacity}>
              <circle cx={cylX + 60} cy={cylY + 30 + (strokeProgress * 40) % 80} r={4} fill="#FFF" />
              <circle cx={cylX + 150} cy={cylY + 50 + (strokeProgress * 60) % 90} r={5} fill="#FFF" />
              <circle cx={cylX + 240} cy={cylY + 35 + (strokeProgress * 50) % 85} r={4} fill="#FFF" />
              <circle cx={cylX + 100} cy={cylY + 70 + (strokeProgress * 30) % 70} r={3} fill="#FFF" />
              <circle cx={cylX + 200} cy={cylY + 80 + (strokeProgress * 45) % 80} r={5} fill="#FFF" />
            </g>
          )}

          {/* Left metal wall */}
          <rect
            x={cylX - wallThick}
            y={cylY}
            width={wallThick}
            height={cylHeight}
            fill="#475569"
            stroke="#1E293B"
            strokeWidth={2}
          />
          {/* Right metal wall */}
          <rect
            x={cylX + cylWidth}
            y={cylY}
            width={wallThick}
            height={cylHeight}
            fill="#475569"
            stroke="#1E293B"
            strokeWidth={2}
          />
          {/* Bottom cylinder base */}
          <rect
            x={cylX - wallThick}
            y={cylY + cylHeight}
            width={cylWidth + wallThick * 2}
            height={wallThick + 8}
            rx={4}
            fill="#334155"
            stroke="#1E293B"
            strokeWidth={2}
          />
          {/* Top cylinder head with rod gland opening */}
          <rect
            x={cylX - wallThick}
            y={cylY - 14}
            width={cylWidth + wallThick * 2}
            height={16}
            rx={4}
            fill="#334155"
            stroke="#1E293B"
            strokeWidth={2}
          />
        </g>

        {/* 3. PISTON & VERTICAL ROD ASSEMBLY */}
        <g id="piston-assembly">
          {/* Vertical Piston Rod extending upward */}
          <rect
            x={cylX + cylWidth / 2 - rodWidth / 2}
            y={Math.max(20, pistonY - 200)}
            width={rodWidth}
            height={pistonY - Math.max(20, pistonY - 200) + 10}
            fill="url(#pistonMetalGrad)"
            stroke="#1E293B"
            strokeWidth={2}
          />

          {/* Piston Head with Pressure Packing Rings */}
          <rect
            x={cylX + 4}
            y={pistonY}
            width={cylWidth - 8}
            height={pistonHeight}
            rx={4}
            fill="url(#pistonMetalGrad)"
            stroke="#1E293B"
            strokeWidth={2}
          />
          {/* Piston seal rings */}
          <line
            x1={cylX + 6}
            y1={pistonY + 10}
            x2={cylX + cylWidth - 6}
            y2={pistonY + 10}
            stroke="#D97706"
            strokeWidth={3}
          />
          <line
            x1={cylX + 6}
            y1={pistonY + 24}
            x2={cylX + cylWidth - 6}
            y2={pistonY + 24}
            stroke="#D97706"
            strokeWidth={3}
          />

          {/* Crosshead pivot joint at rod top */}
          <circle
            cx={cylX + cylWidth / 2}
            cy={Math.max(20, pistonY - 200)}
            r={14}
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth={3}
          />
        </g>

        {/* 4. VALVES & PORTS */}
        {/* Steam inlet valve (top-left) */}
        <g id="valve-inlet" transform={`translate(${cylX - wallThick - 30}, ${cylY + 30})`}>
          <path d="M 0 0 L 30 0 L 30 16 L 0 16 Z" fill="#64748B" stroke="#1E293B" strokeWidth={2} />
          <circle
            cx={15}
            cy={8}
            r={8}
            fill={steamPressure > 0.4 ? THEME.colors.steamHot : '#475569'}
            stroke="#1E293B"
            strokeWidth={2}
          />
        </g>

        {/* Exhaust / Condenser Port (bottom-right) */}
        <g id="valve-exhaust" transform={`translate(${cylX + cylWidth + wallThick}, ${cylY + cylHeight - 60})`}>
          <path d="M 0 0 L 36 0 L 36 20 L 0 20 Z" fill="#64748B" stroke="#1E293B" strokeWidth={2} />
          <circle
            cx={18}
            cy={10}
            r={9}
            fill={condenserOpen ? THEME.colors.condenserCold : '#475569'}
            stroke="#1E293B"
            strokeWidth={2}
          />
        </g>

        {/* 5. NEWCOMEN SPRAY NOZZLE (when mode === 'newcomen') */}
        {mode === 'newcomen' && (
          <g id="newcomen-spray" transform={`translate(${cylX + 40}, ${cylY + cylHeight - 30})`}>
            {/* Water pipe injection */}
            <path d="M 0 20 L 20 0 L 28 0 L 10 20 Z" fill="#0284C7" />
            {waterSprayActive && (
              <g id="water-jets">
                <line x1={24} y1={0} x2={60} y2={-120} stroke="#38BDF8" strokeWidth={3} strokeDasharray="6 4" />
                <line x1={24} y1={0} x2={110} y2={-100} stroke="#38BDF8" strokeWidth={4} strokeDasharray="6 4" />
                <line x1={24} y1={0} x2={160} y2={-70} stroke="#38BDF8" strokeWidth={3} strokeDasharray="6 4" />
              </g>
            )}
          </g>
        )}

        {/* 6. LABELS */}
        {showLabels && (
          <g id="diagram-labels">
            <text
              x={cylX + cylWidth / 2}
              y={cylY - 36}
              textAnchor="middle"
              fill={THEME.colors.textPrimary}
              fontSize={THEME.typography.cardTitle}
              fontWeight="bold"
            >
              {mode === 'watt' ? 'XI-LANH CÁCH NHIỆT (WATT)' : 'XI-LANH KHÍ QUYỂN (NEWCOMEN)'}
            </text>

            <text
              data-role="secondary"
              x={cylX + cylWidth / 2}
              y={cylY + cylHeight + 54}
              textAnchor="middle"
              fill={mode === 'watt' ? THEME.colors.steamOrange : THEME.colors.accentRed}
              fontSize={THEME.typography.secondary}
              fontWeight="600"
            >
              {mode === 'watt'
                ? '✦ Luôn giữ 100°C nhờ vỏ áo hơi'
                : '⚠ Bị làm lạnh đột ngột -> Lãng phí 98% nhiệt'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
