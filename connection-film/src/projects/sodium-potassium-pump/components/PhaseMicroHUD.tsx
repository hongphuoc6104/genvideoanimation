import React from 'react';

export interface PhaseMicroHUDProps {
  currentPhaseIndex: number; // 0 to 3
}

export const PhaseMicroHUD: React.FC<PhaseMicroHUDProps> = ({ currentPhaseIndex }) => {
  const phases = [
    { id: 0, label: '3 Na⁺ Gắn' },
    { id: 1, label: 'E2: Na⁺ Ra' },
    { id: 2, label: '2 K⁺ Gắn' },
    { id: 3, label: 'E1: K⁺ Vào' },
  ];

  return (
    <g transform="translate(540, 140)" className="phase-micro-hud">
      {/* Subtle track background */}
      <rect
        x={-480}
        y={-30}
        width={960}
        height={60}
        rx={30}
        fill="rgba(15, 23, 42, 0.65)"
        stroke="rgba(148, 163, 184, 0.25)"
        strokeWidth={2}
      />
      {phases.map((phase, idx) => {
        const isActive = idx === currentPhaseIndex;
        const isPast = idx < currentPhaseIndex;
        const xOffset = -360 + idx * 240;

        return (
          <g key={phase.id} transform={`translate(${xOffset}, 0)`}>
            {/* Dot indicator */}
            <circle
              cx={-60}
              cy={0}
              r={isActive ? 8 : 5}
              fill={isActive ? '#38BDF8' : isPast ? '#10B981' : '#475569'}
              stroke={isActive ? '#E0F2FE' : 'none'}
              strokeWidth={isActive ? 2.5 : 0}
            />
            {/* Label */}
            <text
              x={-42}
              y={8}
              fill={isActive ? '#FFFFFF' : isPast ? '#94A3B8' : '#64748B'}
              fontSize={30}
              fontWeight={isActive ? 800 : 600}
              fontFamily="sans-serif"
            >
              {phase.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};
