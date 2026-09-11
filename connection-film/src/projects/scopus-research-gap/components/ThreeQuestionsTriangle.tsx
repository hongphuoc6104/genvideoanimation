import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SalienceContainer, SalienceItem } from 'motion-kit';

export interface ThreeQuestionsTriangleProps {
  currentFrame?: number;
}

const QUESTIONS = [
  { id: 'q1', title: '1. ĐÃ BIẾT GÌ?', desc: 'Nền tảng tri thức đã đồng thuận', color: '#38BDF8', cx: 540, cy: 720 },
  { id: 'q2', title: '2. THIẾU GÌ?', desc: 'Điểm mâu thuẫn / khoảng nứt chưa rõ', color: '#F59E0B', cx: 300, cy: 1160 },
  { id: 'q3', title: '3. ĐÓNG GÓP GÌ MỚI?', desc: 'Giá trị giải quyết & tính khả thi', color: '#10B981', cx: 780, cy: 1160 },
];

export const ThreeQuestionsTriangleMechanism: React.FC<ThreeQuestionsTriangleProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active question cycles across the beat (frames 358..471 = 113 frames total: ~38 frames per question)
  const activeIdx = Math.min(2, Math.floor(frame / 38));

  const entry = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const scale = interpolate(entry, [0, 1], [0.8, 1.0]);
  const opacity = interpolate(entry, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: '540px 960px',
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {/* Central Title Badge */}
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: 540,
          transform: 'translateX(-50%)',
          padding: '30px 40px',
          borderRadius: 24,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #38BDF8',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 900, color: '#38BDF8' }}>
          3 CÂU HỎI CỐT LÕI CỦA RESEARCH GAP
        </span>
      </div>

      {/* SVG Connecting Boundary-Clipped Connector Rays (Zero-Crossing Invariant) */}
      <svg
        width={1080}
        height={1920}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 5 }}
      >
        {/* Core Heartbeat Label inside Triangle with Opaque Shield */}
        <rect
          x={400}
          y={935}
          width={280}
          height={160}
          rx={20}
          fill="#0F172A"
          stroke="#334155"
          strokeWidth={1.5}
          data-badge="true"
        />
        <text
          x={540}
          y={995}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={30}
          fontWeight={800}
          letterSpacing="0.05em"
        >
          TAM GIÁC
        </text>
        <text
          x={540}
          y={1045}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={30}
          fontWeight={800}
          letterSpacing="0.05em"
        >
          VÀNG
        </text>
      </svg>

      {/* 3 Vertices with SalienceContainer & SalienceItem with Opaque Shield */}
      <SalienceContainer
        mode="spotlight-dim"
        activeItemIndex={activeIdx}
        currentFrameOverride={frame}
        inactiveOpacity={0.25}
        inactiveDesaturation={0.75}
        activeScale={1.05}
      >
        {QUESTIONS.map((q, idx) => {
          return (
            <SalienceItem
              key={q.id}
              index={idx}
              as="html"
              x={q.cx - 220}
              y={q.cy - 80}
              opaqueShield={true}
            >
              {(state) => (
                <div
                  style={{
                    width: 440,
                    padding: '30px 34px',
                    borderRadius: 20,
                    backgroundColor: '#0F172A',
                    border: `3px solid ${state.isActive ? q.color : '#334155'}`,
                    boxShadow: state.isActive ? `0 0 24px ${q.color}90` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    boxSizing: 'border-box',
                    zIndex: 20,
                  }}
                >
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: state.isActive ? q.color : '#64748B',
                      textAlign: 'center',
                    }}
                  >
                    {q.title}
                  </span>
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 600,
                      color: state.isActive ? '#E2E8F0' : '#475569',
                      textAlign: 'center',
                    }}
                  >
                    {q.desc}
                  </span>
                </div>
              )}
            </SalienceItem>
          );
        })}
      </SalienceContainer>
    </div>
  );
};

export const ThreeQuestionsTriangle = ThreeQuestionsTriangleMechanism;
