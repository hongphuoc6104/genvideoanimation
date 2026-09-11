import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoPill, AutoClippingConnector, type BoxDescriptor } from 'motion-kit';

export interface ThreeQuestionsTriangleProps {
  currentFrame?: number;
}

const QUESTIONS = [
  { id: 'q1', title: '1. ĐÃ BIẾT GÌ?', desc: 'Nền tảng tri thức đã đồng thuận', color: '#38BDF8', cx: 540, cy: 680, w: 480, h: 160 },
  { id: 'q2', title: '2. THIẾU GÌ?', desc: 'Điểm mâu thuẫn / khoảng nứt', color: '#F59E0B', cx: 320, cy: 1140, w: 480, h: 160 },
  { id: 'q3', title: '3. ĐÓNG GÓP GÌ MỚI?', desc: 'Giá trị giải quyết thực tiễn', color: '#10B981', cx: 760, cy: 1140, w: 480, h: 160 },
];

export const ThreeQuestionsTriangleMechanism: React.FC<ThreeQuestionsTriangleProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active question cycles across the beat (~38 frames per question)
  const activeIdx = Math.min(2, Math.floor(frame / 38));

  const entry = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const scale = interpolate(entry, [0, 1], [0.85, 1.0]);
  const opacity = interpolate(entry, [0, 1], [0, 1]);

  // Box descriptors for boundary-clipped connectors
  const box1: BoxDescriptor = { cx: QUESTIONS[0].cx, cy: QUESTIONS[0].cy, width: QUESTIONS[0].w, height: QUESTIONS[0].h, rx: 20 };
  const box2: BoxDescriptor = { cx: QUESTIONS[1].cx, cy: QUESTIONS[1].cy, width: QUESTIONS[1].w, height: QUESTIONS[1].h, rx: 20 };
  const box3: BoxDescriptor = { cx: QUESTIONS[2].cx, cy: QUESTIONS[2].cy, width: QUESTIONS[2].w, height: QUESTIONS[2].h, rx: 20 };

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
        transformOrigin: '540px 960px',
      }}
    >
      {/* Title Badge AutoPill at y = 460 */}
      <AutoPill
        text="3 CÂU HỎI CỐT LÕI CỦA RESEARCH GAP"
        x={540}
        y={460}
        fontSize={32}
        fontWeight={900}
        color="#38BDF8"
        stroke="#38BDF8"
        strokeWidth={3}
        fill="#0F172A"
        paddingHorizontal={36}
      />

      {/* Boundary-Clipped Connector Edges between the 3 Vertices */}
      <AutoClippingConnector
        from={box1}
        to={box2}
        stroke="#38BDF8"
        strokeWidth={4}
        strokeDasharray="8 6"
      />
      <AutoClippingConnector
        from={box2}
        to={box3}
        stroke="#10B981"
        strokeWidth={4}
        strokeDasharray="8 6"
      />
      <AutoClippingConnector
        from={box3}
        to={box1}
        stroke="#F59E0B"
        strokeWidth={4}
        strokeDasharray="8 6"
      />

      {/* Central Golden Triangle Label */}
      <AutoPill
        text="TAM GIÁC VÀNG"
        x={540}
        y={940}
        fontSize={30}
        fontWeight={900}
        color="#94A3B8"
        stroke="#334155"
        strokeWidth={2}
        fill="#0F172A"
        paddingHorizontal={32}
      />

      {/* 3 Vertices with AutoPill and solid #0F172A background */}
      {QUESTIONS.map((q, idx) => {
        const isActive = idx === activeIdx;

        return (
          <g
            key={q.id}
            transform={`translate(${q.cx}, ${q.cy})`}
            opacity={isActive ? 1.0 : 0.4}
            style={{ transition: 'opacity 0.25s ease' }}
          >
            {/* Box card */}
            <rect
              x={-q.w / 2}
              y={-q.h / 2}
              width={q.w}
              height={q.h}
              rx={20}
              fill="#0F172A"
              stroke={isActive ? q.color : '#334155'}
              strokeWidth={isActive ? 4 : 2}
              filter={isActive ? `drop-shadow(0 0 20px ${q.color}80)` : 'none'}
              data-badge="true"
            />

            {/* Question Title */}
            <text
              x={0}
              y={-15}
              textAnchor="middle"
              fill={isActive ? q.color : '#94A3B8'}
              fontSize={32}
              fontWeight={900}
            >
              {q.title}
            </text>

            {/* Question Description */}
            <text
              x={0}
              y={35}
              textAnchor="middle"
              fill={isActive ? '#FFFFFF' : '#64748B'}
              fontSize={30}
              fontWeight={700}
            >
              {q.desc}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const ThreeQuestionsTriangle = ThreeQuestionsTriangleMechanism;
