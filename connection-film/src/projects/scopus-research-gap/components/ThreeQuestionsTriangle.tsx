import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ThreeQuestionsTriangleProps {
  currentFrame?: number;
  relativeBeatFrame?: number;
  beatProgress?: number;
}

interface QuestionVertex {
  id: string;
  label: string;
  sub: string;
  color: string;
  x: number;
  y: number;
}

const VERTICES: QuestionVertex[] = [
  { id: 'v1', label: 'ĐÃ BIẾT', sub: 'TRI THỨC HIỆN CÓ', color: '#38BDF8', x: 540, y: 520 },
  { id: 'v2', label: 'KHOẢNG TRỐNG', sub: 'ĐIỂM CHƯA THỎA ĐÁNG', color: '#F59E0B', x: 280, y: 980 },
  { id: 'v3', label: 'ĐÓNG GÓP', sub: 'TÍNH MỚI SCOPUS', color: '#10B981', x: 800, y: 980 },
];

export const ThreeQuestionsTriangleMechanism: React.FC<ThreeQuestionsTriangleProps> = ({
  relativeBeatFrame,
  beatProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeFrame = relativeBeatFrame !== undefined ? relativeBeatFrame : frame;

  // Active question cycles across the 3 questions in sync with narration (0: Đã biết, 1: Khoảng trống, 2: Đóng góp)
  const activeIdx = beatProgress !== undefined
    ? Math.min(2, Math.floor(beatProgress * 3))
    : Math.min(2, Math.floor(activeFrame / 38));

  const entry = spring({
    frame: activeFrame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const scale = interpolate(entry, [0, 1], [0.85, 1.0]);
  const opacity = interpolate(entry, [0, 1], [0, 1]);

  // Circulating energy particles along the 3 perimeter edges
  // Perimeter length: edge 1 (540,520 to 280,980) ~ 528px
  // edge 2 (280,980 to 800,980) = 520px
  // edge 3 (800,980 to 540,520) ~ 528px
  // Total ~ 1576px
  const rotAngle = (frame * 2.5) % 360;

  // Center coordinate of the triangle
  const centerX = 540;
  const centerY = 826;

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
        transformOrigin: `${centerX}px ${centerY}px`,
      }}
    >
      <defs>
        <filter id="triangleGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="edgeGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <linearGradient id="edgeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        <linearGradient id="edgeGrad3" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Kinetic Header (Minimal Anchor Tag <= 3 words) */}
      <g transform="translate(540, 340)">
        <text
          x={0}
          y={0}
          fill="#38BDF8"
          fontSize={44}
          fontWeight={900}
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          TAM GIÁC VÀNG
        </text>
        <line
          x1={-160}
          y1={24}
          x2={160}
          y2={24}
          stroke="#38BDF8"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* Central Kinetic Rotating Triad Core */}
      <g transform={`translate(${centerX}, ${centerY})`}>
        {/* Revolving Inner Geometric Energy Ring */}
        <circle
          cx={0}
          cy={0}
          r={110}
          fill="none"
          stroke="#1E293B"
          strokeWidth={3}
          strokeDasharray="8 8"
        />
        <g transform={`rotate(${rotAngle})`}>
          <polygon
            points="0,-65 56,32 -56,32"
            fill="none"
            stroke="#F59E0B"
            strokeWidth={3}
            opacity={0.6}
          />
          <circle cx={0} cy={-65} r={8} fill="#38BDF8" filter="url(#triangleGlow)" />
          <circle cx={56} cy={32} r={8} fill="#10B981" filter="url(#triangleGlow)" />
          <circle cx={-56} cy={32} r={8} fill="#F59E0B" filter="url(#triangleGlow)" />
        </g>
        <circle cx={0} cy={0} r={18} fill="#0F172A" stroke="#38BDF8" strokeWidth={3} />
        <circle cx={0} cy={0} r={8} fill="#38BDF8" filter="url(#triangleGlow)" />
      </g>

      {/* Triangle Perimeter Structural Edges */}
      <g>
        {/* Edge 1: Top to Bottom-Left */}
        <line
          x1={VERTICES[0].x}
          y1={VERTICES[0].y}
          x2={VERTICES[1].x}
          y2={VERTICES[1].y}
          stroke="url(#edgeGrad1)"
          strokeWidth={activeIdx === 0 || activeIdx === 1 ? 6 : 3}
          strokeDasharray={activeIdx === 0 || activeIdx === 1 ? undefined : '10 8'}
          opacity={activeIdx === 0 || activeIdx === 1 ? 1 : 0.4}
        />
        {/* Edge 2: Bottom-Left to Bottom-Right */}
        <line
          x1={VERTICES[1].x}
          y1={VERTICES[1].y}
          x2={VERTICES[2].x}
          y2={VERTICES[2].y}
          stroke="url(#edgeGrad2)"
          strokeWidth={activeIdx === 1 || activeIdx === 2 ? 6 : 3}
          strokeDasharray={activeIdx === 1 || activeIdx === 2 ? undefined : '10 8'}
          opacity={activeIdx === 1 || activeIdx === 2 ? 1 : 0.4}
        />
        {/* Edge 3: Bottom-Right to Top */}
        <line
          x1={VERTICES[2].x}
          y1={VERTICES[2].y}
          x2={VERTICES[0].x}
          y2={VERTICES[0].y}
          stroke="url(#edgeGrad3)"
          strokeWidth={activeIdx === 2 || activeIdx === 0 ? 6 : 3}
          strokeDasharray={activeIdx === 2 || activeIdx === 0 ? undefined : '10 8'}
          opacity={activeIdx === 2 || activeIdx === 0 ? 1 : 0.4}
        />
      </g>

      {/* 3 Kinematic Interlocking Nodes at Vertices */}
      {VERTICES.map((v, idx) => {
        const isActive = idx === activeIdx;

        return (
          <g
            key={v.id}
            transform={`translate(${v.x}, ${v.y})`}
            opacity={isActive ? 1.0 : 0.65}
            style={{ transition: 'opacity 0.25s ease' }}
          >
            {/* Outer Radiance Aura for Active Vertex */}
            {isActive && (
              <circle
                cx={0}
                cy={0}
                r={70}
                fill={v.color}
                opacity={0.25}
                filter="url(#triangleGlow)"
              />
            )}

            {/* Circular Base Node */}
            <circle
              cx={0}
              cy={0}
              r={46}
              fill="#0F172A"
              stroke={isActive ? v.color : '#334155'}
              strokeWidth={isActive ? 5 : 3}
              filter={isActive ? `drop-shadow(0 0 20px ${v.color})` : 'none'}
            />

            {/* Number Index */}
            <text
              x={0}
              y={10}
              fill={isActive ? v.color : '#94A3B8'}
              fontSize={32}
              fontWeight={900}
              textAnchor="middle"
            >
              {idx + 1}
            </text>

            {/* Vertex Anchor Label (<= 3 words, Font size >= 30px) */}
            <g
              transform={
                idx === 0
                  ? 'translate(0, -75)'
                  : idx === 1
                  ? 'translate(0, 80)'
                  : 'translate(0, 80)'
              }
            >
              <text
                x={0}
                y={0}
                fill={isActive ? '#FFFFFF' : v.color}
                fontSize={34}
                fontWeight={900}
                letterSpacing="0.04em"
                textAnchor="middle"
              >
                {v.label}
              </text>
              <text
                x={0}
                y={36}
                fill={isActive ? v.color : '#64748B'}
                fontSize={30}
                fontWeight={700}
                letterSpacing="0.06em"
                textAnchor="middle"
              >
                {v.sub}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export const ThreeQuestionsTriangle = ThreeQuestionsTriangleMechanism;
