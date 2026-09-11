import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { computeItemSalienceState, AutoPill, AutoClippingConnector, OpaqueCard } from 'motion-kit';

export interface ResearchFunnelMechanismProps {
  activeLevelIndex: number; // 0: Macro, 1: Stream, 2: Gap Niche
}

const LEVELS = [
  {
    id: 'macro',
    title: '1. TỔNG QUAN RỘNG (MACRO)',
    desc: 'Bao quát bối cảnh ngành & các lý thuyết nền tảng',
    color: '#38BDF8',
    y: 110,
    minPillWidth: 720,
  },
  {
    id: 'stream',
    title: '2. DÒNG NGHIÊN CỨU (STREAM)',
    desc: 'Khu biệt nhánh nghiên cứu cốt lõi & mô hình kế thừa',
    color: '#10B981',
    y: 280,
    minPillWidth: 680,
  },
  {
    id: 'niche',
    title: '3. RESEARCH GAP (NICHE)',
    desc: 'Lọc qua 3 tiêu chuẩn: học thuật, tần suất & tính khả thi',
    color: '#F59E0B',
    y: 450,
    minPillWidth: 620,
  },
];

export const ResearchFunnelMechanism: React.FC<ResearchFunnelMechanismProps> = ({
  activeLevelIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clampedIdx = Math.min(Math.max(0, activeLevelIndex), LEVELS.length - 1);

  // Animated filtering particles
  const particleY = (frame * 5) % 540;

  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      <defs>
        <linearGradient id="funnelMainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {/* Header Badge */}
      <g transform="translate(540, 420)">
        <rect
          x={-430}
          y={-60}
          width={860}
          height={120}
          rx={24}
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth={2}
          filter="drop-shadow(0 0 16px rgba(56, 189, 248, 0.3))"
          data-badge="true"
        />
        <text x={0} y={8} textAnchor="middle" fill="#38BDF8" fontSize={30} fontWeight={900}>
          BƯỚC 1-3: PHỄU THU HẸP TRI THỨC
        </text>
      </g>

      {/* Funnel Body centered at (540, 520) */}
      <g transform="translate(540, 520)">
        {/* Conical Outer Funnel Hull (Wider base: 640px width to comfortably house niche label) */}
        <polygon
          points="-460,0 460,0 320,540 -320,540"
          fill="url(#funnelMainGrad)"
          stroke="#38BDF8"
          strokeWidth={4}
        />

        {/* Dynamic Filtering Particles */}
        <circle cx={0} cy={particleY} r={8} fill="#38BDF8" filter="drop-shadow(0 0 8px #38BDF8)" />
        <circle cx={-80} cy={(particleY + 180) % 540} r={6} fill="#10B981" />
        <circle cx={70} cy={(particleY + 360) % 540} r={7} fill="#F59E0B" />

        {/* 2 Internal Divider Meshes using AutoClippingConnector */}
        <AutoClippingConnector
          source={{ cx: -390, cy: 180, width: 20, height: 20, cornerRadius: 4 }}
          target={{ cx: 390, cy: 180, width: 20, height: 20, cornerRadius: 4 }}
          color="#38BDF8"
          strokeWidth={2}
          strokeDasharray="6 6"
        />
        <AutoClippingConnector
          source={{ cx: -340, cy: 360, width: 20, height: 20, cornerRadius: 4 }}
          target={{ cx: 340, cy: 360, width: 20, height: 20, cornerRadius: 4 }}
          color="#10B981"
          strokeWidth={2}
          strokeDasharray="6 6"
        />

        {/* 3 Levels with Salience Standard */}
        {LEVELS.map((lvl, idx) => {
          const isSelected = idx === clampedIdx;
          const state = computeItemSalienceState(idx, clampedIdx, isSelected ? 1.0 : 0.0, {
            mode: 'spotlight-dim',
            inactiveOpacity: 0.22,
            inactiveDesaturation: 0.75,
            activeScale: 1.05,
            activeBrightness: 1.25,
          });

          return (
            <g
              key={lvl.id}
              opacity={state.opacity}
              style={{
                filter: state.filter,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Level indicator node */}
              <circle
                cx={0}
                cy={lvl.y - 35}
                r={isSelected ? 16 : 10}
                fill={lvl.color}
                filter={isSelected ? `drop-shadow(0 0 16px ${lvl.color})` : 'none'}
              />

              {/* Content-Driven AutoPill Label for Level Title */}
              <AutoPill
                x={0}
                y={lvl.y}
                text={lvl.title}
                fontSize={30}
                fontWeight={900}
                color={isSelected ? '#FFFFFF' : lvl.color}
                fill="#0F172A"
                stroke={lvl.color}
                strokeWidth={isSelected ? 3 : 1.5}
                paddingHorizontal={38}
                height={96}
                minWidth={lvl.minPillWidth}
              />
            </g>
          );
        })}
      </g>

      {/* Active Level Detail Card at (540, 1180) wrapped in OpaqueCard */}
      <g transform="translate(540, 1180)">
        <OpaqueCard
          cx={0}
          cy={100}
          width={960}
          height={200}
          rx={24}
          baseColor="#0F172A"
          borderColor={LEVELS[clampedIdx].color}
          borderWidth={3}
          activeBorderColor={LEVELS[clampedIdx].color}
          activeBorderWidth={3}
          isActive={true}
        >
          <text
            x={0}
            y={62}
            textAnchor="middle"
            fill={LEVELS[clampedIdx].color}
            fontSize={32}
            fontWeight={900}
          >
            {LEVELS[clampedIdx].title}
          </text>
          <text
            x={0}
            y={128}
            textAnchor="middle"
            fill="#E2E8F0"
            fontSize={30}
            fontWeight={600}
          >
            {LEVELS[clampedIdx].desc}
          </text>
        </OpaqueCard>
      </g>
    </svg>
  );
};
