import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ResearchFunnelMechanismProps {
  activeLevelIndex: number; // 0: Macro, 1: Stream, 2: Gap Niche
}

interface FunnelLevel {
  id: string;
  title: string;
  sub: string;
  color: string;
  y: number;
}

const LEVELS: FunnelLevel[] = [
  { id: 'macro', title: 'TỔNG QUAN', sub: 'BỐI CẢNH VĨ MÔ', color: '#38BDF8', y: 110 },
  { id: 'stream', title: 'DÒNG NGHIÊN CỨU', sub: 'NHÁNH CỐT LÕI', color: '#10B981', y: 280 },
  { id: 'niche', title: 'KHOẢNG TRỐNG', sub: 'ĐIỂM CHƯA KHAI PHÁ', color: '#F59E0B', y: 450 },
];

export const ResearchFunnelMechanism: React.FC<ResearchFunnelMechanismProps> = ({
  activeLevelIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clampedIdx = Math.min(Math.max(0, activeLevelIndex), LEVELS.length - 1);

  // Dynamic entrance
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Animated multi-tier filtering particles
  const particleTravel = (frame * 6) % 520;

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
        <linearGradient id="funnelHullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.32" />
        </linearGradient>

        <filter id="funnelGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Kinetic Header (Minimal Anchor Tag <= 3 words) */}
      <g transform="translate(540, 320)" opacity={enterSpring}>
        <text
          x={0}
          y={0}
          fill="#38BDF8"
          fontSize={44}
          fontWeight={900}
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          PHỄU THU HẸP TRI THỨC
        </text>
        <line
          x1={-190}
          y1={24}
          x2={190}
          y2={24}
          stroke="#38BDF8"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* Funnel Body centered at (540, 520) */}
      <g transform="translate(540, 520)" opacity={enterSpring}>
        {/* Conical Outer Funnel Hull */}
        <polygon
          points="-460,0 460,0 300,540 -300,540"
          fill="url(#funnelHullGrad)"
          stroke="#38BDF8"
          strokeWidth={4}
          filter="drop-shadow(0 0 24px rgba(56, 189, 248, 0.3))"
        />

        {/* Funnel Top Rim */}
        <ellipse cx={0} cy={0} rx={460} ry={30} fill="#1E293B" stroke="#38BDF8" strokeWidth={3} />
        {/* Funnel Bottom Spout */}
        <ellipse cx={0} cy={540} rx={300} ry={20} fill="#0F172A" stroke="#F59E0B" strokeWidth={3} />

        {/* Filter Mesh Screens */}
        <line x1={-380} y1={180} x2={380} y2={180} stroke="#38BDF8" strokeWidth={2.5} strokeDasharray="6 4" opacity={0.6} />
        <line x1={-340} y1={360} x2={340} y2={360} stroke="#10B981" strokeWidth={2.5} strokeDasharray="6 4" opacity={0.6} />

        {/* Dynamic Filtering Particles flowing downwards */}
        {[
          { x: -280, speedOffset: 0, r: 8, color: '#38BDF8' },
          { x: -140, speedOffset: 120, r: 10, color: '#38BDF8' },
          { x: 0, speedOffset: 240, r: 12, color: '#FFFFFF' },
          { x: 140, speedOffset: 80, r: 9, color: '#10B981' },
          { x: 260, speedOffset: 190, r: 8, color: '#10B981' },
          { x: -60, speedOffset: 340, r: 11, color: '#F59E0B' },
          { x: 80, speedOffset: 410, r: 10, color: '#F59E0B' },
        ].map((p, i) => {
          const currentY = (particleTravel + p.speedOffset) % 520;
          // As particles flow down, funnel narrows horizontally
          const currentSpread = interpolate(currentY, [0, 520], [1.0, 0.65]);
          const currentX = p.x * currentSpread;

          return (
            <circle
              key={i}
              cx={currentX}
              cy={currentY}
              r={p.r}
              fill={p.color}
              filter="url(#funnelGlow)"
              opacity={0.85}
            />
          );
        })}

        {/* Concentrated Filtered Stream Emitting from Funnel Spout */}
        <g transform="translate(0, 540)">
          <line x1={0} y1={0} x2={0} y2={180} stroke="#F59E0B" strokeWidth={10} strokeLinecap="round" filter="url(#funnelGlow)" />
          <circle cx={0} cy={(frame * 8) % 180} r={12} fill="#FFFFFF" filter="url(#funnelGlow)" />
        </g>

        {/* 3 Level Tier Badges (Minimal Anchor Labels <= 3 words, Font >= 30px) */}
        {LEVELS.map((lvl, idx) => {
          const isSelected = idx === clampedIdx;
          const badgeW = idx === 0 ? 540 : idx === 1 ? 480 : 420;

          return (
            <g
              key={lvl.id}
              transform={`translate(0, ${lvl.y})`}
              opacity={isSelected ? 1.0 : 0.45}
              style={{ transition: 'opacity 0.25s ease' }}
            >
              {/* Badge Outline */}
              <rect
                x={-badgeW / 2}
                y={-32}
                width={badgeW}
                height={64}
                rx={32}
                fill="#0F172A"
                stroke={lvl.color}
                strokeWidth={isSelected ? 4 : 2}
                filter={isSelected ? `drop-shadow(0 0 20px ${lvl.color}90)` : 'none'}
              />

              {/* Status Indicator Dot */}
              <circle
                cx={-badgeW / 2 + 36}
                cy={0}
                r={10}
                fill={lvl.color}
                filter={isSelected ? 'url(#funnelGlow)' : 'none'}
              />

              {/* Level Title <= 3 words */}
              <text
                x={15}
                y={9}
                textAnchor="middle"
                fill={isSelected ? '#FFFFFF' : lvl.color}
                fontSize={32}
                fontWeight={900}
                letterSpacing="0.04em"
              >
                {lvl.title}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default ResearchFunnelMechanism;
