import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface KeystonePillarsProps {
  currentFrame?: number;
  relativeBeatFrame?: number;
  beatProgress?: number;
}

interface PillarDef {
  id: string;
  label: string;
  subLabel: string;
  color: string;
  x: number;
}

const PILLARS: PillarDef[] = [
  { id: 'p1', label: 'ĐỊNH VỊ', subLabel: 'TERRITORY', color: '#38BDF8', x: 195 },
  { id: 'p2', label: 'CHỨNG CỨ', subLabel: 'EVIDENCE', color: '#10B981', x: 425 },
  { id: 'p3', label: 'GIẢI THÍCH', subLabel: 'MECHANISM', color: '#F59E0B', x: 655 },
  { id: 'p4', label: 'KHẢ THI', subLabel: 'FEASIBILITY', color: '#A855F7', x: 885 },
];

export const KeystonePillars: React.FC<KeystonePillarsProps> = ({
  relativeBeatFrame,
  beatProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeFrame = relativeBeatFrame !== undefined ? relativeBeatFrame : frame;

  // Entrance spring for pillars rising from ground
  const sceneProgress = spring({
    frame: activeFrame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  // Highlight cycles across the 4 pillars (progressively illuminating them in sync with voice)
  const activeIdx = beatProgress !== undefined
    ? Math.min(3, Math.floor(beatProgress * 4))
    : Math.min(3, Math.floor(activeFrame / 45));

  // The base elevation line where pillars rise from
  const groundY = 1260;
  const targetHeight = 440;

  // Manuscript lift: as pillars rise, manuscript is hoisted up to y = 500
  const manuscriptLift = spring({
    frame: Math.max(0, activeFrame - 10),
    fps,
    config: { damping: 12, stiffness: 70 },
  });
  const manuscriptY = interpolate(manuscriptLift, [0, 1], [880, 500]);
  const manuscriptGlow = interpolate(manuscriptLift, [0, 1], [0, 1]);

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
        <filter id="keystoneGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
        </linearGradient>

        <linearGradient id="manuscriptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Title Kinetic Header (Minimal Anchor Tag <= 3 words) */}
      <g transform="translate(540, 320)" opacity={sceneProgress}>
        <text
          x={0}
          y={0}
          fill="#38BDF8"
          fontSize={44}
          fontWeight={900}
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          4 TRỤ CỘT CARS
        </text>
        <line
          x1={-180}
          y1={24}
          x2={180}
          y2={24}
          stroke="#38BDF8"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* Elevated Scientific Manuscript (Supported by the 4 pillars) */}
      <g
        transform={`translate(540, ${manuscriptY}) scale(${interpolate(manuscriptLift, [0, 1], [0.85, 1])})`}
        style={{ transformOrigin: '0px 0px' }}
      >
        {/* Radiance Aura */}
        <circle
          cx={0}
          cy={0}
          r={180}
          fill="#38BDF8"
          opacity={manuscriptGlow * 0.15}
          filter="url(#keystoneGlow)"
        />

        {/* Golden Base Beam connecting the 4 pillars */}
        <rect
          x={-420}
          y={110}
          width={840}
          height={32}
          rx={8}
          fill="#1E293B"
          stroke="#38BDF8"
          strokeWidth={3}
          opacity={manuscriptLift}
        />

        {/* Manuscript Vector Document */}
        <g transform="translate(-110, -70)">
          {/* Paper Sheet */}
          <rect
            x={0}
            y={0}
            width={220}
            height={160}
            rx={14}
            fill="url(#manuscriptGrad)"
            stroke="#CBD5E1"
            strokeWidth={3}
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.5))"
          />
          {/* Folded Top-Right Corner */}
          <path d="M 180 0 L 220 40 L 180 40 Z" fill="#94A3B8" />
          {/* Decorative Text Lines */}
          <line x1={30} y1={36} x2={160} y2={36} stroke="#0F172A" strokeWidth={5} strokeLinecap="round" />
          <line x1={30} y1={64} x2={190} y2={64} stroke="#64748B" strokeWidth={4} strokeLinecap="round" />
          <line x1={30} y1={92} x2={175} y2={92} stroke="#64748B" strokeWidth={4} strokeLinecap="round" />
          <line x1={30} y1={120} x2={140} y2={120} stroke="#38BDF8" strokeWidth={4} strokeLinecap="round" />

          {/* Golden Approved Ribbon Stamp */}
          <circle cx={170} cy={115} r={24} fill="#10B981" />
          <path
            d="M 160 115 L 167 122 L 182 107"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Foundation Pedestal Base */}
      <rect
        x={80}
        y={groundY}
        width={920}
        height={40}
        rx={10}
        fill="url(#pedestalGrad)"
        stroke="#334155"
        strokeWidth={3}
      />

      {/* 4 Rising Keystone Pillars */}
      {PILLARS.map((pillar, idx) => {
        const pillarDelay = idx * 8;
        const pillarProgress = spring({
          frame: Math.max(0, frame - pillarDelay),
          fps,
          config: { damping: 14, stiffness: 90 },
        });

        const currentPillarH = interpolate(pillarProgress, [0, 1], [0, targetHeight]);
        const pillarTopY = groundY - currentPillarH;
        const isCurrent = idx === activeIdx;
        const isPassed = idx < activeIdx;
        const pillarWidth = 160;

        return (
          <g key={pillar.id} opacity={pillarProgress}>
            {/* Pillar Shaft Body */}
            <rect
              x={pillar.x - pillarWidth / 2}
              y={pillarTopY}
              width={pillarWidth}
              height={currentPillarH}
              rx={12}
              fill="url(#pedestalGrad)"
              stroke={isCurrent ? pillar.color : isPassed ? '#38BDF8' : '#334155'}
              strokeWidth={isCurrent ? 4 : 2}
              filter={isCurrent ? `drop-shadow(0 0 20px ${pillar.color}80)` : 'none'}
            />

            {/* Classical Fluting Groove Lines on Pillar */}
            {[-36, 0, 36].map((dx, i) => (
              <line
                key={i}
                x1={pillar.x + dx}
                y1={pillarTopY + 30}
                x2={pillar.x + dx}
                y2={groundY - 15}
                stroke={isCurrent ? pillar.color : '#334155'}
                strokeWidth={2}
                opacity={isCurrent ? 0.6 : 0.3}
              />
            ))}

            {/* Pillar Capital (Top Pedestal Head) */}
            <rect
              x={pillar.x - pillarWidth / 2 - 12}
              y={pillarTopY}
              width={pillarWidth + 24}
              height={26}
              rx={6}
              fill={isCurrent ? pillar.color : '#1E293B'}
              stroke={isCurrent ? '#FFFFFF' : '#475569'}
              strokeWidth={isCurrent ? 3 : 1.5}
            />

            {/* Kinetic Number Disc */}
            <circle
              cx={pillar.x}
              cy={pillarTopY + 70}
              r={28}
              fill="#0F172A"
              stroke={isCurrent ? pillar.color : '#475569'}
              strokeWidth={isCurrent ? 3 : 2}
            />
            <text
              x={pillar.x}
              y={pillarTopY + 79}
              fill={isCurrent ? pillar.color : '#94A3B8'}
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
            >
              {idx + 1}
            </text>

            {/* Pillar Anchor Label (<= 3 words, Font >= 30px) */}
            <g transform={`translate(${pillar.x}, ${pillarTopY + 160})`}>
              <text
                x={0}
                y={0}
                fill={isCurrent ? '#FFFFFF' : '#CBD5E1'}
                fontSize={32}
                fontWeight={900}
                textAnchor="middle"
                letterSpacing="0.04em"
              >
                {pillar.label}
              </text>
              <text
                x={0}
                y={38}
                fill={isCurrent ? pillar.color : '#64748B'}
                fontSize={30}
                fontWeight={700}
                textAnchor="middle"
                letterSpacing="0.06em"
              >
                {pillar.subLabel}
              </text>
            </g>

            {/* Active Rising Energy Beam */}
            {isCurrent && (
              <line
                x1={pillar.x}
                y1={groundY}
                x2={pillar.x}
                y2={pillarTopY - 60}
                stroke={pillar.color}
                strokeWidth={4}
                strokeDasharray="10 8"
                opacity={0.8}
                filter="url(#keystoneGlow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
