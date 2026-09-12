import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface OpticalPrismsRefractionProps {
  activeGapIndex: number; // 0: Lý thuyết, 1: Thực nghiệm, 2: Bối cảnh, 3: Phương pháp, 4: Ứng dụng
  relativeBeatFrame?: number;
  beatProgress?: number;
}

interface GapDef {
  id: string;
  name: string;
  shortName: string;
  sub: string;
  color: string;
  targetX: number;
  targetY: number;
}

const GAPS: GapDef[] = [
  { id: 'g1', name: 'GAP LÝ THUYẾT', shortName: 'LÝ THUYẾT', sub: 'THIẾU CƠ CHẾ', color: '#38BDF8', targetX: 210, targetY: 770 },
  { id: 'g2', name: 'GAP THỰC NGHIỆM', shortName: 'THỰC NGHIỆM', sub: 'MÂU THUẪN DỮ LIỆU', color: '#F59E0B', targetX: 385, targetY: 930 },
  { id: 'g3', name: 'GAP BỐI CẢNH', shortName: 'BỐI CẢNH', sub: 'ĐẶC THÙ THỂ CHẾ', color: '#10B981', targetX: 540, targetY: 770 },
  { id: 'g4', name: 'GAP PHƯƠNG PHÁP', shortName: 'PHƯƠNG PHÁP', sub: 'SAI LỆCH ĐO LƯỜNG', color: '#A855F7', targetX: 695, targetY: 930 },
  { id: 'g5', name: 'GAP ỨNG DỤNG', shortName: 'ỨNG DỤNG', sub: 'KHOẢNG CÁCH THỰC TIỄN', color: '#EC4899', targetX: 870, targetY: 770 },
];

export const OpticalPrismsRefractionMechanism: React.FC<OpticalPrismsRefractionProps> = ({
  activeGapIndex,
  relativeBeatFrame,
  beatProgress = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clampedIdx = Math.min(Math.max(0, activeGapIndex), GAPS.length - 1);
  const activeGap = GAPS[clampedIdx];

  // Dynamic spring entrance for whole scene
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Dynamic intra-beat spring for active gap transition
  const activeFrame = relativeBeatFrame !== undefined ? relativeBeatFrame : frame;
  const beatSpring = spring({
    frame: activeFrame,
    fps,
    config: { damping: 12, stiffness: 110 },
  });

  // Pulse animation
  const pulse = Math.sin((frame * 0.15)) * 0.2 + 0.8;
  const beamLaserTravel = (frame * 8) % 120;

  // Prism center
  const prismApexX = 540;
  const prismApexY = 480;
  const prismBaseY = 600;
  const prismLeftX = 450;
  const prismRightX = 630;
  const prismCenterX = 540;
  const prismCenterY = 540;

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
        opacity: enterSpring,
      }}
    >
      <defs>
        <filter id="prismGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="crystalFacetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#818CF8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Upright Optical Crystal Prism Apex */}
      <g>
        <polygon
          points={`${prismApexX},${prismApexY} ${prismLeftX},${prismBaseY} ${prismRightX},${prismBaseY}`}
          fill="url(#crystalFacetGrad)"
          stroke="#38BDF8"
          strokeWidth={4}
          filter="url(#prismGlow)"
        />
        {/* Crystal Core Glow Node */}
        <circle
          cx={prismCenterX}
          cy={prismCenterY}
          r={16}
          fill="#FFFFFF"
          opacity={pulse}
          filter="url(#prismGlow)"
        />
      </g>

      {/* 5 Refracted Spectral Laser Beams */}
      <g>
        {GAPS.map((gap, idx) => {
          const isSelected = idx === clampedIdx;
          const beamStartPointX = prismLeftX + ((idx + 0.5) / 5) * (prismRightX - prismLeftX);
          const beamStartPointY = prismBaseY;

          return (
            <g key={`beam-${gap.id}`}>
              {/* Refracted Laser Ray */}
              <line
                x1={beamStartPointX}
                y1={beamStartPointY}
                x2={gap.targetX}
                y2={gap.targetY}
                stroke={gap.color}
                strokeWidth={isSelected ? 6 : 2.5}
                strokeDasharray={isSelected ? undefined : '6 4'}
                opacity={isSelected ? 1.0 : 0.25}
                filter={isSelected ? 'url(#prismGlow)' : 'none'}
              />

              {/* Laser energy pulse for selected beam */}
              {isSelected && (
                <circle
                  cx={interpolate(
                    (frame * 0.04) % 1,
                    [0, 1],
                    [beamStartPointX, gap.targetX]
                  )}
                  cy={interpolate(
                    (frame * 0.04) % 1,
                    [0, 1],
                    [beamStartPointY, gap.targetY]
                  )}
                  r={8}
                  fill="#FFFFFF"
                  filter="url(#prismGlow)"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* 5 Destination Kinetic Gap Nodes & Physical Mechanisms */}
      {GAPS.map((gap, idx) => {
        const isSelected = idx === clampedIdx;
        const nodeRadius = isSelected ? 48 : 36;

        return (
          <g
            key={gap.id}
            transform={`translate(${gap.targetX}, ${gap.targetY})`}
            opacity={isSelected ? 1.0 : 0.45}
            style={{ transition: 'opacity 0.25s ease' }}
          >
            {/* Active Aura */}
            {isSelected && (
              <circle
                cx={0}
                cy={0}
                r={nodeRadius * 1.6}
                fill={gap.color}
                opacity={0.25}
                filter="url(#prismGlow)"
              />
            )}

            {/* Core Circular Node */}
            <circle
              cx={0}
              cy={0}
              r={nodeRadius}
              fill="#0F172A"
              stroke={gap.color}
              strokeWidth={isSelected ? 4 : 2.5}
              filter={isSelected ? `drop-shadow(0 0 16px ${gap.color})` : 'none'}
            />

            {/* Gap Number */}
            <text
              x={0}
              y={isSelected ? -8 : -4}
              fill={isSelected ? '#FFFFFF' : gap.color}
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
            >
              {idx + 1}
            </text>

            {/* Icon representation inside node */}
            <circle
              cx={0}
              cy={isSelected ? 16 : 12}
              r={isSelected ? 6 : 4}
              fill={gap.color}
            />

            {/* Anchor Label (<= 3 words, font size >= 30px, Zero Collisions) */}
            {isSelected ? (
              <g transform="translate(0, 78)">
                <rect
                  x={-145}
                  y={-28}
                  width={290}
                  height={88}
                  rx={20}
                  fill="#0F172A"
                  stroke={gap.color}
                  strokeWidth={3}
                  filter={`drop-shadow(0 0 16px ${gap.color}80)`}
                />
                <text
                  x={0}
                  y={6}
                  fill="#FFFFFF"
                  fontSize={30}
                  fontWeight={900}
                  letterSpacing="0.04em"
                  textAnchor="middle"
                >
                  {gap.name}
                </text>
                <text
                  x={0}
                  y={40}
                  fill={gap.color}
                  fontSize={30}
                  fontWeight={700}
                  letterSpacing="0.04em"
                  textAnchor="middle"
                >
                  {gap.sub}
                </text>
              </g>
            ) : (
              <g transform="translate(0, 60)">
                <text
                  x={0}
                  y={0}
                  fill={gap.color}
                  fontSize={30}
                  fontWeight={800}
                  letterSpacing="0.03em"
                  textAnchor="middle"
                >
                  {gap.shortName}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Active Gap Kinetic Mechanism Showcase Stage (y in [1160, 1380]) */}
      <g
        transform={`translate(540, 1260) scale(${interpolate(beatSpring, [0, 1], [0.9, 1.0])})`}
        opacity={Math.min(1, beatSpring * 1.5)}
      >
        {/* Kinetic Focus Orbit */}
        <circle
          cx={0}
          cy={0}
          r={110}
          fill="#0F172A"
          stroke={activeGap.color}
          strokeWidth={3}
          filter={`drop-shadow(0 0 24px ${activeGap.color}60)`}
        />
        <circle
          cx={0}
          cy={0}
          r={125}
          fill="none"
          stroke={activeGap.color}
          strokeWidth={1.5}
          strokeDasharray="6 6"
          opacity={0.6}
        />

        {/* Specific Kinetic Mechanism Demonstration Per Gap */}
        {clampedIdx === 0 && (
          // Gap 1 (Theory): Missing mediator bridge (Node A -> [Gap Void] -> Node B)
          <g>
            <circle cx={-60} cy={0} r={18} fill="#38BDF8" />
            <circle cx={60} cy={0} r={18} fill="#38BDF8" />
            {/* Missing broken connector */}
            <line x1={-42} y1={0} x2={-15} y2={0} stroke="#38BDF8" strokeWidth={3} />
            <line x1={15} y1={0} x2={42} y2={0} stroke="#38BDF8" strokeWidth={3} />
            {/* Pulsing void question mark icon path */}
            <circle cx={0} cy={0} r={16} fill="#EF4444" opacity={pulse} />
            <path
              d="M -4 -5 Q 0 -10 4 -5 Q 4 0 0 2 M 0 6 L 0 8"
              stroke="#FFFFFF"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
            <text x={0} y={60} fill="#38BDF8" fontSize={30} fontWeight={800} textAnchor="middle">BIẾN TRUNG GIAN</text>
          </g>
        )}

        {clampedIdx === 1 && (
          // Gap 2 (Empirical): Unbalanced Scale of conflicting evidence
          <g>
            <line x1={0} y1={-40} x2={0} y2={30} stroke="#F59E0B" strokeWidth={4} />
            {/* Tilting beam */}
            <g transform={`rotate(${Math.sin(frame * 0.1) * 12})`}>
              <line x1={-60} y1={-30} x2={60} y2={-30} stroke="#FFFFFF" strokeWidth={4} />
              {/* Left pan (+) */}
              <circle cx={-60} cy={-10} r={16} fill="#10B981" />
              <path d="M -66 -10 L -54 -10 M -60 -16 L -60 -4" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
              {/* Right pan (-) */}
              <circle cx={60} cy={-10} r={16} fill="#EF4444" />
              <path d="M 54 -10 L 66 -10" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
            </g>
            <text x={0} y={60} fill="#F59E0B" fontSize={30} fontWeight={800} textAnchor="middle">KẾT QUẢ XUNG ĐỘT</text>
          </g>
        )}

        {clampedIdx === 2 && (
          // Gap 3 (Context): Boundary wall deflecting standard relationship
          <g>
            <line x1={-70} y1={0} x2={-20} y2={0} stroke="#10B981" strokeWidth={4} />
            {/* Thick Context Boundary Barrier */}
            <rect x={-15} y={-45} width={30} height={90} rx={6} fill="#1E293B" stroke="#10B981" strokeWidth={3} />
            {/* Deflected line */}
            <path d="M 15 0 Q 40 -35 70 -35" fill="none" stroke="#F59E0B" strokeWidth={4} strokeDasharray="6 4" />
            <text x={0} y={65} fill="#10B981" fontSize={30} fontWeight={800} textAnchor="middle">RÀO CẢN THỂ CHẾ</text>
          </g>
        )}

        {clampedIdx === 3 && (
          // Gap 4 (Method): Caliper / Measurement alignment gauge
          <g>
            <circle cx={0} cy={-10} r={40} fill="none" stroke="#A855F7" strokeWidth={3} strokeDasharray="4 4" />
            {/* Gauge Needle */}
            <line
              x1={0}
              y1={-10}
              x2={Math.cos(frame * 0.15) * 32}
              y2={-10 + Math.sin(frame * 0.15) * 32}
              stroke="#A855F7"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={0} cy={-10} r={6} fill="#FFFFFF" />
            <text x={0} y={60} fill="#A855F7" fontSize={30} fontWeight={800} textAnchor="middle">CHUẨN ĐO LƯỜNG</text>
          </g>
        )}

        {clampedIdx === 4 && (
          // Gap 5 (Application): Rotating gear transforming theory into practical policy
          <g>
            <g transform={`rotate(${frame * 2})`}>
              <circle cx={0} cy={-10} r={32} fill="none" stroke="#EC4899" strokeWidth={6} strokeDasharray="8 6" />
              <circle cx={0} cy={-10} r={10} fill="#EC4899" />
            </g>
            <text x={0} y={60} fill="#EC4899" fontSize={30} fontWeight={800} textAnchor="middle">HÀM Ý QUẢN TRỊ</text>
          </g>
        )}
      </g>
    </svg>
  );
};

export const OpticalPrismsRefraction = OpticalPrismsRefractionMechanism;
