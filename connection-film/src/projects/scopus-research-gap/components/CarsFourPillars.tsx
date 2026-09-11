import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SalienceContainer, SalienceItem } from 'motion-kit';

export interface CarsFourPillarsProps {
  currentFrame?: number;
}

const PILLARS = [
  { id: 'p1', title: '1. ĐỊNH VỊ', desc: 'Xác lập địa bàn & độ quan trọng', color: '#38BDF8', move: 'Move 1: Territory' },
  { id: 'p2', title: '2. CHỨNG CỨ', desc: 'Trích dẫn dữ liệu & nghiên cứu trước', color: '#10B981', move: 'Move 2: Evidence' },
  { id: 'p3', title: '3. GIẢI THÍCH', desc: 'Lý giải cơ chế vì sao có mâu thuẫn', color: '#F59E0B', move: 'Move 3: Mechanism' },
  { id: 'p4', title: '4. KHẢ THI', desc: 'Khả thi kiểm định & đo lường', color: '#A855F7', move: 'Move 4: Occupying' },
];

export const CarsFourPillarsMechanism: React.FC<CarsFourPillarsProps> = ({ currentFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active pillar cycles smoothly across the beat duration (137 frames total: 476..613)
  // ~34 frames per pillar
  const pillarIdx = Math.min(3, Math.floor(frame / 34));

  const entryProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const scale = interpolate(entryProgress, [0, 1], [0.85, 1.0]);
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: 'none',
      }}
    >
      {/* Header Badge */}
      <div
        style={{
          marginBottom: 30,
          padding: '30px 40px',
          borderRadius: 24,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #38BDF8',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
        }}
      >
        <span style={{ fontSize: 32, fontWeight: 900, color: '#38BDF8' }}>
          4 THUỘC TÍNH MÔ HÌNH SWALES CARS
        </span>
      </div>

      {/* 4 Pillars Grid with Salience Spotlight & Dim */}
      <SalienceContainer
        mode="spotlight-dim"
        activeItemIndex={pillarIdx}
        currentFrameOverride={frame}
        inactiveOpacity={0.25}
        inactiveDesaturation={0.75}
        activeScale={1.04}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            width: 900,
          }}
        >
          {PILLARS.map((p, idx) => {
            return (
              <SalienceItem key={p.id} index={idx} as="html">
                <div
                  style={{
                    width: 900,
                    padding: '30px 36px',
                    borderRadius: 20,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: `3px solid ${p.color}`,
                    boxShadow: idx === pillarIdx ? `0 0 24px ${p.color}80` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 34, fontWeight: 900, color: p.color }}>
                      {p.title}
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: 700,
                        color: idx === pillarIdx ? '#FFFFFF' : p.color,
                        padding: '4px 16px',
                        borderRadius: 12,
                        backgroundColor: `${p.color}33`,
                      }}
                    >
                      {p.move}
                    </span>
                  </div>
                  <span style={{ fontSize: 30, fontWeight: 600, color: '#E2E8F0' }}>
                    {p.desc}
                  </span>
                </div>
              </SalienceItem>
            );
          })}
        </div>
      </SalienceContainer>
    </div>
  );
};

export const CarsFourPillars = CarsFourPillarsMechanism;
