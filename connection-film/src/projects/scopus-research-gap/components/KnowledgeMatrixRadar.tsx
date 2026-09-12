import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ResearcherRig } from './ResearcherRig';

export interface KnowledgeMatrixRadarProps {
  progress?: number;
  showResearcher?: boolean;
}

export const KnowledgeMatrixRadar: React.FC<KnowledgeMatrixRadarProps> = ({
  showResearcher = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const entryProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const radarAngle = (frame * 3.5) % 360;

  // Pulse effect for the gap area
  const gapPulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.8, 1.05]
  );

  const cx = 540;
  const cy = 760;
  const maxRadius = 360;

  // 14 Literature Published Paper Nodes populated ONLY in Quadrants I, II, and IV
  const clusters = [
    // Quadrant I (+X, +Y: Đông Bắc - Khái niệm & Bối cảnh)
    { x: cx + 90, y: cy - 160, r: 16, color: '#38BDF8', label: 'Paper 1' },
    { x: cx + 180, y: cy - 220, r: 22, color: '#38BDF8', label: 'Paper 2' },
    { x: cx + 220, y: cy - 90, r: 15, color: '#10B981', label: 'Paper 3' },
    { x: cx + 290, y: cy - 150, r: 18, color: '#10B981', label: 'Paper 4' },
    { x: cx + 140, y: cy - 70, r: 14, color: '#38BDF8', label: 'Paper 5' },

    // Quadrant II (-X, +Y: Tây Bắc - Khái niệm & Mâu thuẫn)
    { x: cx - 120, y: cy - 180, r: 20, color: '#38BDF8', label: 'Paper 6' },
    { x: cx - 220, y: cy - 240, r: 24, color: '#F59E0B', label: 'Paper 7' },
    { x: cx - 260, y: cy - 110, r: 16, color: '#F59E0B', label: 'Paper 8' },
    { x: cx - 170, y: cy - 70, r: 14, color: '#38BDF8', label: 'Paper 9' },

    // Quadrant IV (+X, -Y: Đông Nam - Bối cảnh & Phương pháp)
    { x: cx + 110, y: cy + 170, r: 18, color: '#A855F7', label: 'Paper 10' },
    { x: cx + 220, y: cy + 120, r: 22, color: '#10B981', label: 'Paper 11' },
    { x: cx + 270, y: cy + 220, r: 16, color: '#A855F7', label: 'Paper 12' },
    { x: cx + 170, y: cy + 260, r: 20, color: '#A855F7', label: 'Paper 13' },
    { x: cx + 90, y: cy + 90, r: 14, color: '#10B981', label: 'Paper 14' },

    // Quadrant III (-X, -Y: Tây Nam - Mâu thuẫn & Phương pháp) -> EXACTLY 0 NODES (THE VOID)!
  ];

  // The Void / Gap Target (Quadrant III: South-West Void Chasm)
  const gapCenter = { x: cx - 170, y: cy + 170 };
  const gapRadius = 90 * gapPulse;

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
      }}
    >
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
          <radialGradient id="matrixRadarSweepGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="matrixGapGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#EF4444" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>

          <filter id="matrixRadarGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Title Kinetic Header (Minimal Anchor Tag <= 3 words) */}
        <g transform="translate(540, 310)" opacity={entryProgress}>
          <text
            x={0}
            y={0}
            fill="#38BDF8"
            fontSize={44}
            fontWeight={900}
            letterSpacing="0.08em"
            textAnchor="middle"
          >
            MA TRẬN TRI THỨC 4 TRỤC
          </text>
          <line
            x1={-220}
            y1={24}
            x2={220}
            y2={24}
            stroke="#38BDF8"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>

        {/* Main Radar Container with Spring Entry */}
        <g
          transform={`scale(${entryProgress})`}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Radar Concentric Rings */}
          {[100, 190, 280, maxRadius].map((r, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#1E293B"
              strokeWidth={1.5}
              strokeDasharray={i === 3 ? '6 6' : 'none'}
              opacity={0.85}
            />
          ))}

          {/* 4 Orthogonal Axes */}
          {/* Horizontal Axis (-X to +X) */}
          <line
            x1={cx - maxRadius - 20}
            y1={cy}
            x2={cx + maxRadius + 20}
            y2={cy}
            stroke="#334155"
            strokeWidth={2.5}
          />
          {/* Vertical Axis (-Y to +Y) */}
          <line
            x1={cx}
            y1={cy - maxRadius - 20}
            x2={cx}
            y2={cy + maxRadius + 20}
            stroke="#334155"
            strokeWidth={2.5}
          />

          {/* Axis Labels (Minimal Kinetic Anchors <= 3 words, Font >= 30px) */}
          {/* +Y (Bắc / Top): KHÁI NIỆM & LÝ THUYẾT (Cyan #38BDF8) */}
          <g transform={`translate(${cx}, ${cy - maxRadius - 45})`}>
            <rect
              x={-110}
              y={-24}
              width={220}
              height={48}
              rx={24}
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth={2.5}
            />
            <text
              x={0}
              y={6}
              fill="#38BDF8"
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              KHÁI NIỆM
            </text>
          </g>

          {/* +X (Đông / Right): BỐI CẢNH & THỂ CHẾ (Emerald #10B981) */}
          <g transform={`translate(${cx + maxRadius + 75}, ${cy})`}>
            <rect
              x={-95}
              y={-24}
              width={190}
              height={48}
              rx={24}
              fill="#0F172A"
              stroke="#10B981"
              strokeWidth={2.5}
            />
            <text
              x={0}
              y={6}
              fill="#10B981"
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              BỐI CẢNH
            </text>
          </g>

          {/* -Y (Nam / Bottom): PHƯƠNG PHÁP & ĐO LƯỜNG (Purple #A855F7) */}
          <g transform={`translate(${cx}, ${cy + maxRadius + 45})`}>
            <rect
              x={-125}
              y={-24}
              width={250}
              height={48}
              rx={24}
              fill="#0F172A"
              stroke="#A855F7"
              strokeWidth={2.5}
            />
            <text
              x={0}
              y={6}
              fill="#A855F7"
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              PHƯƠNG PHÁP
            </text>
          </g>

          {/* -X (Tây / Left): MÂU THUẪN KẾT QUẢ (Amber #F59E0B) */}
          <g transform={`translate(${cx - maxRadius - 75}, ${cy})`}>
            <rect
              x={-105}
              y={-24}
              width={210}
              height={48}
              rx={24}
              fill="#0F172A"
              stroke="#F59E0B"
              strokeWidth={2.5}
            />
            <text
              x={0}
              y={6}
              fill="#F59E0B"
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              MÂU THUẪN
            </text>
          </g>

          {/* 360-Degree Rotating Radar Sweep Cone */}
          <g transform={`rotate(${radarAngle}, ${cx}, ${cy})`}>
            <path
              d={`M ${cx} ${cy} L ${cx + maxRadius} ${cy - 120} A ${maxRadius} ${maxRadius} 0 0 1 ${cx + maxRadius} ${cy} Z`}
              fill="url(#matrixRadarSweepGrad)"
            />
            <line
              x1={cx}
              y1={cy}
              x2={cx + maxRadius}
              y2={cy}
              stroke="#38BDF8"
              strokeWidth={3}
              filter="url(#matrixRadarGlow)"
            />
          </g>

          {/* Published Research Node Clusters in Quadrants I, II, IV */}
          {clusters.map((node, idx) => (
            <g key={idx}>
              {/* Subtle connecting lines */}
              <line
                x1={cx}
                y1={cy}
                x2={node.x}
                y2={node.y}
                stroke={node.color}
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.3}
              />
              {/* Outer halo */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r * 1.3}
                fill={node.color}
                opacity={0.18}
              />
              {/* Core node */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={node.color}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                filter="url(#matrixRadarGlow)"
              />
            </g>
          ))}

          {/* The Unoccupied Gap Void (Quadrant III) with Pulsing Reticle Target */}
          <g transform={`translate(${gapCenter.x}, ${gapCenter.y})`}>
            {/* Glowing aura */}
            <circle cx={0} cy={0} r={gapRadius} fill="url(#matrixGapGlowGrad)" />
            {/* Pulsing reticle dashed ring */}
            <circle
              cx={0}
              cy={0}
              r={gapRadius * 0.85}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={3.5}
              strokeDasharray="8 6"
            />
            {/* Crosshair lines */}
            <line x1={-35} y1={0} x2={35} y2={0} stroke="#EF4444" strokeWidth={3} />
            <line x1={0} y1={-35} x2={0} y2={35} stroke="#EF4444" strokeWidth={3} />
            {/* Corner Reticle Brackets */}
            <path
              d="M -50 -30 L -50 -50 L -30 -50 M 30 -50 L 50 -50 L 50 -30 M 50 30 L 50 50 L 30 50 M -30 50 L -50 50 L -50 30"
              fill="none"
              stroke="#F59E0B"
              strokeWidth={3}
            />

            {/* Kinetic Void Anchor Tag (<= 3 words, font size >= 30px) */}
            <g transform="translate(0, 75)">
              <rect
                x={-170}
                y={-24}
                width={340}
                height={48}
                rx={24}
                fill="#0F172A"
                stroke="#EF4444"
                strokeWidth={3}
                filter="drop-shadow(0 0 16px rgba(239, 68, 68, 0.8))"
              />
              <text
                x={0}
                y={8}
                fill="#FFFFFF"
                fontSize={30}
                fontWeight={900}
                textAnchor="middle"
                letterSpacing="0.04em"
              >
                KHOẢNG TRỐNG NGHIÊN CỨU
              </text>
            </g>
          </g>
        </g>
      </svg>

      {/* Academic Researcher in 'analyzing' pose observing the matrix radar */}
      {showResearcher && (
        <div
          style={{
            position: 'absolute',
            right: 40,
            bottom: 480,
            width: 320,
            height: 440,
            zIndex: 25,
            pointerEvents: 'none',
          }}
        >
          <ResearcherRig
            pose="analyzing"
            frame={frame}
            showGlasses
            showMagnifier
            scale={0.88}
            flip
          />
        </div>
      )}
    </div>
  );
};
