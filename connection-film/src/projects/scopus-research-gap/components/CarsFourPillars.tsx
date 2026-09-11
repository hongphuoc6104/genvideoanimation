import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoPill } from 'motion-kit';

export interface CarsFourPillarsProps {
  currentFrame?: number;
}

const PILLARS = [
  { id: 'p1', title: '1. ĐỊNH VỊ', desc: 'Xác lập địa bàn & độ quan trọng', color: '#38BDF8', move: 'Move 1: Territory' },
  { id: 'p2', title: '2. CHỨNG CỨ', desc: 'Trích dẫn dữ liệu & nghiên cứu trước', color: '#10B981', move: 'Move 2: Evidence' },
  { id: 'p3', title: '3. GIẢI THÍCH', desc: 'Lý giải cơ chế vì sao có mâu thuẫn', color: '#F59E0B', move: 'Move 3: Mechanism' },
  { id: 'p4', title: '4. KHẢ THI', desc: 'Khả thi kiểm định & đo lường', color: '#A855F7', move: 'Move 4: Occupying' },
];

export const CarsFourPillarsMechanism: React.FC<CarsFourPillarsProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active pillar cycles smoothly across the beat duration (~34 frames per pillar)
  const pillarIdx = Math.min(3, Math.floor(frame / 34));

  const entryProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const scale = interpolate(entryProgress, [0, 1], [0.9, 1.0]);
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

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
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: '540px 800px',
      }}
    >
      {/* Header Pill using AutoPill at y = 440 */}
      <AutoPill
        text="4 THUỘC TÍNH MÔ HÌNH SWALES CARS"
        x={540}
        y={440}
        fontSize={32}
        fontWeight={900}
        color="#38BDF8"
        stroke="#38BDF8"
        strokeWidth={3}
        fill="#0F172A"
        paddingHorizontal={36}
      />

      {/* 4 CARS Pillars vertically arranged within Safe Zone [540, 1260] */}
      <g transform="translate(540, 540)">
        {PILLARS.map((p, idx) => {
          const isActive = idx === pillarIdx;
          const yOffset = idx * 180;

          return (
            <g
              key={p.id}
              transform={`translate(0, ${yOffset})`}
              opacity={isActive ? 1.0 : 0.35}
              style={{ transition: 'opacity 0.25s ease' }}
            >
              {/* Outer Card Shield: 920px wide, 165px height, leaves >=30px padding on all sides */}
              <rect
                x={-460}
                y={0}
                width={920}
                height={165}
                rx={24}
                fill="#0F172A"
                stroke={isActive ? p.color : '#334155'}
                strokeWidth={isActive ? 4 : 2}
                filter={isActive ? `drop-shadow(0 0 20px ${p.color}80)` : 'none'}
                data-badge="true"
              />

              {/* Title on left (top margin >= 32px) */}
              <text
                x={-410}
                y={62}
                textAnchor="start"
                fill={isActive ? '#FFFFFF' : p.color}
                fontSize={32}
                fontWeight={900}
              >
                {p.title}
              </text>

              {/* Move Tag on right (top margin >= 32px) */}
              <text
                x={410}
                y={62}
                textAnchor="end"
                fill={isActive ? p.color : '#94A3B8'}
                fontSize={30}
                fontWeight={800}
              >
                {p.move}
              </text>

              {/* Description text (bottom margin >= 34px) */}
              <text
                x={0}
                y={122}
                textAnchor="middle"
                fill="#E2E8F0"
                fontSize={30}
                fontWeight={600}
              >
                {p.desc}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export const CarsFourPillars = CarsFourPillarsMechanism;
