import React, { useMemo } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { cubicBezierPoint, Point2D } from 'motion-kit';
import { PALETTE } from '../palette';

export interface NarrowingFunnelProps {
  progress?: number;
  activeStage?: 1 | 2 | 3 | 'all';
  showParticles?: boolean;
  highlightGap?: boolean;
  style?: React.CSSProperties;
}

const PARTICLE_SEEDS: Array<{
  xOffset: number;
  speed: number;
  size: number;
  color: string;
}> = [
  { xOffset: -180, speed: 0.85, size: 7, color: PALETTE.CYAN_PRIMARY },
  { xOffset: -120, speed: 1.10, size: 5, color: PALETTE.CYAN_GLOW },
  { xOffset: -60,  speed: 0.95, size: 8, color: PALETTE.AMBER_ALERT },
  { xOffset: 0,    speed: 1.05, size: 6, color: PALETTE.EMERALD_SUCCESS },
  { xOffset: 70,   speed: 0.90, size: 7, color: PALETTE.CYAN_GLOW },
  { xOffset: 130,  speed: 1.15, size: 5, color: PALETTE.AMBER_ALERT },
  { xOffset: 190,  speed: 0.80, size: 6, color: PALETTE.CYAN_PRIMARY },
  { xOffset: -150, speed: 1.00, size: 6, color: PALETTE.CYAN_GLOW },
  { xOffset: -30,  speed: 1.20, size: 7, color: PALETTE.EMERALD_SUCCESS },
  { xOffset: 40,   speed: 0.88, size: 5, color: PALETTE.CYAN_PRIMARY },
  { xOffset: 100,  speed: 1.08, size: 8, color: PALETTE.AMBER_ALERT },
  { xOffset: -90,  speed: 0.92, size: 6, color: PALETTE.CYAN_GLOW },
];

export const NarrowingFunnel: React.FC<NarrowingFunnelProps> = ({
  progress,
  activeStage = 'all',
  showParticles = true,
  highlightGap = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = progress !== undefined
    ? progress
    : spring({ frame, fps, config: { damping: 14, stiffness: 90 } });

  // Funnel Geometry coordinates
  const pStartLeft: Point2D = { x: 260, y: 400 };
  const pCtrl1Left: Point2D = { x: 280, y: 550 };
  const pCtrl2Left: Point2D = { x: 380, y: 700 };
  const pSpoutLeft: Point2D = { x: 470, y: 880 };

  const pStartRight: Point2D = { x: 820, y: 400 };
  const pCtrl1Right: Point2D = { x: 800, y: 550 };
  const pCtrl2Right: Point2D = { x: 700, y: 700 };
  const pSpoutRight: Point2D = { x: 610, y: 880 };

  // Calculate animated particles along exact cubic Bezier curves
  const particles = useMemo(() => {
    return PARTICLE_SEEDS.map((seed, i) => {
      const cycleFrames = 60 / seed.speed;
      const t = ((frame * seed.speed + i * 7) % cycleFrames) / cycleFrames;
      
      const blend = (seed.xOffset + 200) / 400;
      const p0: Point2D = {
        x: pStartLeft.x * (1 - blend) + pStartRight.x * blend,
        y: pStartLeft.y,
      };
      const p1: Point2D = {
        x: pCtrl1Left.x * (1 - blend) + pCtrl1Right.x * blend,
        y: pCtrl1Left.y,
      };
      const p2: Point2D = {
        x: pCtrl2Left.x * (1 - blend) + pCtrl2Right.x * blend,
        y: pCtrl2Left.y,
      };
      const p3: Point2D = {
        x: 540 + (seed.xOffset * 0.15),
        y: 980,
      };

      const pt = cubicBezierPoint(p0, p1, p2, p3, t);
      const opacity = Math.sin(t * Math.PI);
      return { ...pt, size: seed.size, color: seed.color, opacity };
    });
  }, [frame]);

  const jewelPulse = Math.sin(frame * 0.1) * 0.08 + 1.0;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="funnelGrad" x1="540" y1="400" x2="540" y2="1040" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={PALETTE.NAVY_SURFACE} stopOpacity="0.85" />
            <stop offset="60%" stopColor={PALETTE.CYAN_PRIMARY} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PALETTE.EMERALD_SUCCESS} stopOpacity="0.28" />
          </linearGradient>

          <radialGradient id="jewelGlow" cx="540" cy="1120" r="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={PALETTE.EMERALD_LIGHT} stopOpacity="0.8" />
            <stop offset="50%" stopColor={PALETTE.EMERALD_SUCCESS} stopOpacity="0.3" />
            <stop offset="100%" stopColor={PALETTE.EMERALD_SUCCESS} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Funnel Body */}
        <g data-part="funnel-root" data-joint="funnel-base" opacity={Math.min(1, animProgress * 1.2)}>
          <path
            d="M 260 400 C 280 550, 380 700, 470 880 L 470 1020 L 610 1020 L 610 880 C 700 700, 800 550, 820 400 Z"
            fill="url(#funnelGrad)"
            stroke={PALETTE.CYAN_PRIMARY}
            strokeWidth={4}
          />

          {/* Top Rim Ellipse */}
          <ellipse
            cx={540}
            cy={400}
            rx={280}
            ry={42}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.CYAN_PRIMARY}
            strokeWidth={3}
          />

          {/* Stage 1 Filter: General Topic */}
          <g data-part="stage-1" data-joint="filter-top" opacity={activeStage === 1 || activeStage === 'all' ? 1 : 0.4}>
            <ellipse
              cx={540}
              cy={540}
              rx={210}
              ry={28}
              fill="rgba(15, 23, 42, 0.4)"
              stroke={PALETTE.TEXT_MUTED}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            {/* Stage 1 Badge */}
            <rect x={120} y={510} width={340} height={52} rx={12} fill={PALETTE.NAVY_SURFACE} stroke={PALETTE.TEXT_MUTED} strokeWidth={2} />
            <text x={290} y={542} fill={PALETTE.TEXT_PRIMARY} fontSize={16} fontWeight="bold" textAnchor="middle">
              Chủ đề chung: Chuyển đổi số ngân hàng
            </text>
          </g>

          {/* Stage 2 Filter: Specific Research Stream */}
          <g data-part="stage-2" data-joint="filter-mid" opacity={activeStage === 2 || activeStage === 'all' ? 1 : 0.4}>
            <ellipse
              cx={540}
              cy={720}
              rx={130}
              ry={20}
              fill="rgba(6, 182, 212, 0.15)"
              stroke={PALETTE.CYAN_PRIMARY}
              strokeWidth={3}
            />
            {/* Stage 2 Badge */}
            <rect x={590} y={690} width={450} height={56} rx={12} fill={PALETTE.NAVY_SURFACE} stroke={PALETTE.CYAN_PRIMARY} strokeWidth={2} />
            <text x={815} y={724} fill={PALETTE.CYAN_GLOW} fontSize={15} fontWeight="bold" textAnchor="middle">
              Dòng nghiên cứu: E-service quality & Continuance intention
            </text>
          </g>

          {/* Stage 3 Filter: Testable Gap Diaphragm */}
          <g data-part="stage-3" data-joint="filter-spout" opacity={activeStage === 3 || activeStage === 'all' ? 1 : 0.4}>
            <ellipse
              cx={540}
              cy={880}
              rx={70}
              ry={14}
              fill="rgba(16, 185, 129, 0.25)"
              stroke={PALETTE.EMERALD_SUCCESS}
              strokeWidth={3}
            />
          </g>

          {/* Concentrated Laser / Particle Beam Flowing from Spout (Y: 1020 -> 1080) */}
          <g data-part="laser-spout" data-joint="laser-beam">
            {/* Core Laser Beam */}
            <rect
              x={534}
              y={1020}
              width={12}
              height={60}
              fill={PALETTE.EMERALD_LIGHT}
              opacity={0.85 + Math.sin(frame * 0.2) * 0.15}
            />
            {/* Outer Laser Glow */}
            <rect
              x={525}
              y={1020}
              width={30}
              height={60}
              fill={PALETTE.EMERALD_SUCCESS}
              opacity={0.35 + Math.sin(frame * 0.2) * 0.15}
            />
            {/* Concentrated Laser Flow Packets */}
            {[-10, 15, 40].map((offset, i) => {
              const packetY = 1020 + ((frame * 2.5 + i * 20) % 60);
              return (
                <circle
                  key={i}
                  cx={540}
                  cy={packetY}
                  r={4.5}
                  fill="#FFFFFF"
                  opacity={0.9}
                />
              );
            })}
          </g>

          {/* Particles along exact Bezier curves entering top */}
          {showParticles && particles.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.color}
              opacity={p.opacity}
            />
          ))}

          {/* Bottom Gap Jewel Output */}
          <g data-part="bottom-output" data-joint="jewel" transform={`translate(540, 1120) scale(${highlightGap ? jewelPulse * 1.15 : 1}) translate(-540, -1120)`}>
            {highlightGap && (
              <circle cx={540} cy={1120} r={90} fill="url(#jewelGlow)" />
            )}
            {/* Crystal Diamond Polygon */}
            <polygon
              points="540,1070 585,1120 540,1170 495,1120"
              fill={PALETTE.EMERALD_SUCCESS}
              stroke={PALETTE.EMERALD_LIGHT}
              strokeWidth={4}
            />
            {/* Jewel Facet Lines */}
            <line x1={540} y1={1070} x2={540} y2={1170} stroke={PALETTE.TEXT_PRIMARY} strokeWidth={2} opacity={0.6} />
            <line x1={495} y1={1120} x2={585} y2={1120} stroke={PALETTE.TEXT_PRIMARY} strokeWidth={2} opacity={0.6} />

            {/* Testable Gap Spout Badge */}
            <rect
              x={220}
              y={1200}
              width={640}
              height={68}
              rx={16}
              fill={PALETTE.NAVY_SURFACE}
              stroke={PALETTE.EMERALD_SUCCESS}
              strokeWidth={3}
            />
            <text x={540} y={1242} fill={PALETTE.EMERALD_LIGHT} fontSize={19} fontWeight="bold" textAnchor="middle">
              Research Gap: Rủi ro cảm nhận &amp; Bảo mật điều tiết
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};
