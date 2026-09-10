import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const SceneTemplate: React.FC<SceneProps> = ({ durationInFrames = 600, shotBeats = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic beat choreography derived strictly from timeline tokens
  const { currentBeatIndex, intraBeatProgress, phase } = useBeatChoreography(shotBeats);

  // Entrance spring for central mechanism
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        backgroundColor: '#0A0F1D',
        overflow: 'hidden',
      }}
    >
      {/* Tầng 1: Title Header [y: 120 - 280px] */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 80,
          right: 80,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1.5px solid #3B82F6',
            borderRadius: 24,
            color: '#60A5FA',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Phần 1: Xác Lập Cơ Chế
        </div>
        <h1
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          Tên Khái Niệm Trực Quan
        </h1>
      </div>

      {/* Tầng 2: Central Visual Canvas [y: 300 - 1320px] */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 80,
          width: 920,
          height: 980,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: entrance,
          transform: `scale(${interpolate(entrance, [0, 1], [0.92, 1.0])})`,
        }}
      >
        <svg width="920" height="980" viewBox="0 0 920 980">
          {/* Active Kinematic Vectors & Relational Nodes */}
          <circle cx="460" cy="490" r="180" fill="none" stroke="#2563EB" strokeWidth="6" />
        </svg>
      </div>

      {/* Tầng 3: Status Ribbon / Dynamic Badge [y: 1330 - 1410px] */}
      <div
        style={{
          position: 'absolute',
          top: 1340,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid #10B981',
            borderRadius: 30,
            padding: '10px 28px',
            color: '#34D399',
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          Trạng Thái: Pha {phase + 1}
        </div>
      </div>

      {/* Tầng 4: Karaoke Subtitles Safe Region [y: 1420 - 1750px] - Rendered by Root */}
      {/* Lề đáy an toàn [y > 1750px] giữ hoàn toàn thông thoáng */}
    </div>
  );
};
