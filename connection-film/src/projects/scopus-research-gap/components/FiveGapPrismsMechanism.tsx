import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { computeItemSalienceState, AutoPill, AutoClippingConnector } from 'motion-kit';

export interface FiveGapPrismsProps {
  activeGapIndex: number; // 0: Lý thuyết, 1: Thực nghiệm, 2: Bối cảnh, 3: Phương pháp, 4: Ứng dụng
}

const GAPS = [
  {
    id: 'theo',
    name: '1. GAP LÝ THUYẾT',
    desc1: 'Mâu thuẫn học thuyết nền tảng',
    desc2: 'Cơ chế trung gian chưa được sáng tỏ',
    color: '#38BDF8',
    targetX: 250,
    targetY: 620,
  },
  {
    id: 'emp',
    name: '2. GAP THỰC NGHIỆM',
    desc1: 'Dữ liệu thực nghiệm xung đột',
    desc2: 'Kết quả chưa nhất quán giữa các nghiên cứu',
    color: '#F59E0B',
    targetX: 380,
    targetY: 760,
  },
  {
    id: 'ctx',
    name: '3. GAP BỐI CẢNH',
    desc1: 'Đặc thù thể chế và văn hóa',
    desc2: 'Làm đảo chiều mối quan hệ lý thuyết',
    color: '#10B981',
    targetX: 540,
    targetY: 850,
  },
  {
    id: 'met',
    name: '4. GAP PHƯƠNG PHÁP',
    desc1: 'Hạn chế đo lường & mẫu dữ liệu dọc',
    desc2: 'Cần ứng dụng kỹ thuật SEM tiên tiến',
    color: '#A855F7',
    targetX: 700,
    targetY: 760,
  },
  {
    id: 'pra',
    name: '5. GAP ỨNG DỤNG',
    desc1: 'Khoảng cách mô hình học thuật',
    desc2: 'Thiếu hàm ý quản trị cho thực tiễn',
    color: '#EC4899',
    targetX: 830,
    targetY: 620,
  },
];

export const FiveGapPrismsMechanism: React.FC<FiveGapPrismsProps> = ({ activeGapIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clampedActiveIndex = Math.min(Math.max(0, activeGapIndex), GAPS.length - 1);
  const active = GAPS[clampedActiveIndex];

  const CORE_CENTER = { x: 540, y: 450 };
  const CORE_BOX = { cx: 540, cy: 450, width: 180, height: 100, cornerRadius: 28 };

  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <defs>
        <radialGradient id="prismRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={active.color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={active.color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Layer 1: Connectors rendered first so cards always have domIndex > vec.domIndex */}
      <g id="gap-connectors-layer">
        {GAPS.map((gap, idx) => {
          const isSelected = idx === clampedActiveIndex;
          const targetBox = {
            cx: gap.targetX,
            cy: gap.targetY + (isSelected ? 56 : 50),
            width: isSelected ? 360 : 140,
            height: 96,
            cornerRadius: 20,
          };

          return (
            <g key={`conn-${gap.id}`} opacity={isSelected ? 1.0 : 0.25}>
              <AutoClippingConnector
                source={CORE_BOX}
                target={targetBox}
                color={gap.color}
                strokeWidth={isSelected ? 5 : 2}
                strokeDasharray={isSelected ? undefined : '5 5'}
                startGap={4}
                endGap={4}
              />
            </g>
          );
        })}
      </g>

      {/* Layer 2: 5 Radiating Directional Anchor Nodes & AutoPill Labels */}
      {GAPS.map((gap, idx) => {
        const isSelected = idx === clampedActiveIndex;
        const state = computeItemSalienceState(idx, clampedActiveIndex, isSelected ? 1.0 : 0.0, {
          mode: 'spotlight-dim',
          inactiveOpacity: 0.22,
          inactiveDesaturation: 0.75,
          activeScale: 1.05,
          activeBrightness: 1.25,
        });

        return (
          <g
            key={gap.id}
            opacity={state.opacity}
            style={{
              filter: state.filter,
              transition: 'all 0.3s ease',
            }}
          >
            {/* Prism Anchor Node */}
            <circle
              cx={gap.targetX}
              cy={gap.targetY}
              r={isSelected ? 16 : 12}
              fill={gap.color}
              stroke="#0F172A"
              strokeWidth={3}
            />

            {/* Content-Driven AutoPill Label for Gap */}
            {isSelected ? (
              <AutoPill
                x={gap.targetX}
                y={gap.targetY + 56}
                text={gap.name}
                fontSize={30}
                fontWeight={900}
                color={gap.color}
                fill="#0F172A"
                stroke={gap.color}
                strokeWidth={2}
                paddingHorizontal={36}
                height={96}
                minWidth={360}
              />
            ) : (
              <AutoPill
                x={gap.targetX}
                y={gap.targetY + 50}
                text={`#${idx + 1}`}
                fontSize={30}
                fontWeight={700}
                color="#64748B"
                fill="#0F172A"
                stroke="#334155"
                strokeWidth={1.5}
                paddingHorizontal={34}
                height={96}
                minWidth={140}
              />
            )}
          </g>
        );
      })}

      {/* Central Prism Origin Core (Rendered on top of rays to prevent ray penetration) */}
      <g transform={`translate(${CORE_CENTER.x}, ${CORE_CENTER.y})`}>
        <rect
          x={-CORE_BOX.width / 2}
          y={-CORE_BOX.height / 2}
          width={CORE_BOX.width}
          height={CORE_BOX.height}
          rx={CORE_BOX.cornerRadius}
          fill="#0F172A"
          stroke={active.color}
          strokeWidth={4}
          filter={`drop-shadow(0 0 16px ${active.color}80)`}
          data-badge="true"
        />
        <text
          x={0}
          y={10}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={30}
          fontWeight={900}
        >
          GAP
        </text>
      </g>

      {/* Active Gap Spotlight Inspection Zone (Central-Lower Canvas: y in [960, 1340]) */}
      <g transform="translate(540, 1140)">
        {/* Focusing Ring Card (920px width, leaves 80px safe horizontal margins) */}
        <rect
          x={-460}
          y={-140}
          width={920}
          height={270}
          rx={24}
          fill="#0F172A"
          stroke={active.color}
          strokeWidth={4}
          filter={`drop-shadow(0 0 24px ${active.color}60)`}
          data-badge="true"
        />

        {/* Dynamic Focus Mechanism Label */}
        <text
          x={0}
          y={-75}
          textAnchor="middle"
          fill={active.color}
          fontSize={36}
          fontWeight={900}
          letterSpacing="0.04em"
        >
          {active.name}
        </text>

        <text
          x={0}
          y={-15}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={30}
          fontWeight={700}
        >
          {active.desc1}
        </text>

        <text
          x={0}
          y={35}
          textAnchor="middle"
          fill="#E2E8F0"
          fontSize={30}
          fontWeight={600}
        >
          {active.desc2}
        </text>

        <text
          x={0}
          y={85}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={30}
          fontWeight={600}
        >
          Chuẩn lập luận bắt buộc trong Scopus Q1/Q2
        </text>
      </g>
    </svg>
  );
};
