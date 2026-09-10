import React from 'react';
import { THEME } from './DesignTokens';

export interface IndustrialMapProps {
  revealProgress: number; // 0 to 1
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const IndustrialMap: React.FC<IndustrialMapProps> = ({
  revealProgress,
  width = 540,
  height = 520,
  showLabels = true,
}) => {
  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="millGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <filter id="cityGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. GEOGRAPHICAL RIVER NETWORK (Pre-Industrial Constraint) */}
        <g id="river-network" opacity={0.6}>
          <path
            d="M 30 60 Q 180 140, 120 280 T 60 460"
            fill="none"
            stroke="#0284C7"
            strokeWidth={14}
            strokeLinecap="round"
          />
          <text
            data-role="secondary"
            x={70}
            y={200}
            fill="#38BDF8"
            fontSize={THEME.typography.secondary}
            fontWeight="bold"
            transform="rotate(-50, 70, 200)"
          >
            Dòng sông tự nhiên
          </text>
        </g>

        {/* 2. INDUSTRIAL URBAN CLUSTER (Lancashire Mills) */}
        <g id="urban-cluster" transform="translate(240, 100)" filter="url(#cityGlow)">
          {/* Central Steam Power Plant */}
          <rect x={40} y={40} width={130} height={100} rx={10} fill="#1E293B" stroke="#F59E0B" strokeWidth={3} />
          {/* Smokestack */}
          <rect x={60} y={0} width={24} height={40} fill="#475569" stroke="#1E293B" strokeWidth={2} />
          {/* Smoke puffs */}
          <circle cx={72} cy={-12} r={14} fill="#64748B" opacity={0.7} />
          <circle cx={86} cy={-28} r={18} fill="#94A3B8" opacity={0.5} />

          <text
            x={105}
            y={95}
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize={THEME.typography.cardTitle}
            fontWeight="bold"
          >
            NHÀ MÁY
          </text>
          <text
            data-role="secondary"
            x={105}
            y={125}
            textAnchor="middle"
            fill="#FDE68A"
            fontSize={THEME.typography.secondary}
          >
            Lancashire
          </text>

          {/* Surrounding Textile Looms connected by shafts */}
          {[
            { x: -50, y: 170, label: 'Xưởng Dệt 1' },
            { x: 70, y: 190, label: 'Luyện Kim' },
            { x: 190, y: 170, label: 'Xưởng Dệt 2' },
          ].map((node, idx) => (
            <g key={idx} opacity={Math.min(1, revealProgress * 1.5)}>
              {/* Power transmission line */}
              <line
                x1={105}
                y1={140}
                x2={node.x + 45}
                y2={node.y}
                stroke="#F59E0B"
                strokeWidth={4}
                strokeDasharray="6 4"
              />
              <rect x={node.x} y={node.y} width={90} height={60} rx={6} fill="#334155" stroke="#64748B" strokeWidth={2} />
              <text data-role="secondary" x={node.x + 45} y={node.y + 36} textAnchor="middle" fill="#F8FAFC" fontSize={THEME.typography.secondary} fontWeight="600">
                {node.label}
              </text>
            </g>
          ))}
        </g>

        {/* 3. RAILWAY & STEAM LOCOMOTIVE NETWORK */}
        <g id="railway-network" opacity={Math.min(1, Math.max(0, (revealProgress - 0.4) * 2))}>
          <line x1={40} y1={420} x2={500} y2={420} stroke="#94A3B8" strokeWidth={6} strokeDasharray="16 8" />
          <line x1={40} y1={432} x2={500} y2={432} stroke="#94A3B8" strokeWidth={6} strokeDasharray="16 8" />

          {/* Steam Locomotive Icon */}
          <g transform="translate(180, 360)">
            <rect x={0} y={20} width={90} height={40} rx={6} fill="#EF4444" stroke="#B91C1C" strokeWidth={2} />
            <circle cx={20} cy={64} r={14} fill="#334155" stroke="#F8FAFC" strokeWidth={3} />
            <circle cx={50} cy={64} r={14} fill="#334155" stroke="#F8FAFC" strokeWidth={3} />
            <circle cx={80} cy={64} r={14} fill="#334155" stroke="#F8FAFC" strokeWidth={3} />
            {/* Cab & Chimney */}
            <rect x={10} y={4} width={16} height={18} fill="#1E293B" />
            <rect x={55} y={-4} width={30} height={26} rx={4} fill="#991B1B" />
          </g>

          <text
            data-role="secondary"
            x={270}
            y={480}
            textAnchor="middle"
            fill="#38BDF8"
            fontSize={THEME.typography.secondary}
            fontWeight="bold"
          >
            Đầu máy xe lửa & Đường sắt hơi nước
          </text>
        </g>

        {/* 4. LABELS */}
        {showLabels && (
          <g id="map-labels">
            <text
              x={width / 2}
              y={40}
              textAnchor="middle"
              fill={THEME.colors.textPrimary}
              fontSize={THEME.typography.hero}
              fontWeight="bold"
            >
              GIẢI PHÓNG ĐỊA LÝ
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
