import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { IonParticle } from '../components/IonParticle';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3ElectrogenicSynthesis: React.FC<SceneProps> = ({
  durationInFrames = 159,
  shotBeats = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { beatProgress: intraBeatProgress } = useBeatChoreography(shotBeats);

  // Entrance spring for summary board
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  // Kinetic pulse for the -70mV potential
  const pulse = 1.0 + 0.05 * Math.sin(frame * 0.15);

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
          top: 130,
          left: 80,
          right: 80,
          textAlign: 'center',
        }}
      >
        <div
          data-role="section"
          style={{
            display: 'inline-block',
            padding: '10px 28px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10B981',
            borderRadius: 24,
            color: '#34D399',
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Cân Bằng Điện Sinh Học
        </div>
        <h1
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          Bản Chất Bơm Sinh Điện
        </h1>
      </div>

      {/* Tầng 2: Central Visual Canvas [y: 300 - 1320px] */}
      <div
        style={{
          position: 'absolute',
          top: 310,
          left: 80,
          width: 920,
          height: 980,
          opacity: entrance,
          transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1.0])})`,
        }}
      >
        <svg width="920" height="980" viewBox="0 0 920 980">
          {/* Main Kinetic Balance Dashboard Container */}
          <rect
            x={40}
            y={20}
            width={840}
            height={940}
            rx={32}
            fill="#0F172A"
            stroke="#334155"
            strokeWidth={3}
          />

          {/* Row 1: 3 Na+ Out */}
          <g transform="translate(80, 70)">
            <rect
              x={0}
              y={0}
              width={760}
              height={140}
              rx={24}
              fill="rgba(245, 158, 11, 0.1)"
              stroke="#F59E0B"
              strokeWidth={2.5}
            />
            <IonParticle type="na" x={70} y={70} scale={1.0} />
            <IonParticle type="na" x={140} y={70} scale={1.0} />
            <IonParticle type="na" x={210} y={70} scale={1.0} />

            <text
              x={290}
              y={65}
              fill="#FCD34D"
              fontSize={40}
              fontWeight={900}
              fontFamily="sans-serif"
            >
              3 Na⁺ ĐẨY RA NGOÀI
            </text>
            <text
              x={290}
              y={105}
              fill="#FDE68A"
              fontSize={32}
              fontWeight={700}
              fontFamily="sans-serif"
            >
              +3 Điện tích dương chuyển đi
            </text>
            <path
              d="M 670 70 L 710 70 M 695 55 L 715 70 L 695 85"
              stroke="#F59E0B"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Row 2: 2 K+ In */}
          <g transform="translate(80, 240)">
            <rect
              x={0}
              y={0}
              width={760}
              height={140}
              rx={24}
              fill="rgba(139, 92, 246, 0.1)"
              stroke="#8B5CF6"
              strokeWidth={2.5}
            />
            <IonParticle type="k" x={80} y={70} scale={1.0} />
            <IonParticle type="k" x={165} y={70} scale={1.0} />

            <text
              x={290}
              y={65}
              fill="#C4B5FD"
              fontSize={40}
              fontWeight={900}
              fontFamily="sans-serif"
            >
              2 K⁺ HÚT VÀO TRONG
            </text>
            <text
              x={290}
              y={105}
              fill="#DDD6FE"
              fontSize={32}
              fontWeight={700}
              fontFamily="sans-serif"
            >
              +2 Điện tích dương nhận lại
            </text>
            <path
              d="M 710 70 L 670 70 M 685 55 L 665 70 L 685 85"
              stroke="#8B5CF6"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Row 3: 1 ATP Consumed */}
          <g transform="translate(80, 410)">
            <rect
              x={0}
              y={0}
              width={760}
              height={140}
              rx={24}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3B82F6"
              strokeWidth={2.5}
            />
            {/* ATP Symbol */}
            <circle cx={70} cy={70} r={28} fill="#3B82F6" stroke="#93C5FD" strokeWidth={3} />
            <text x={70} y={80} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              ATP
            </text>
            <text x={125} y={78} fill="#60A5FA" fontSize={34} fontWeight={900}>
              ➔
            </text>
            <circle cx={180} cy={70} r={24} fill="#EF4444" stroke="#FCA5A5" strokeWidth={3} />
            <text x={180} y={80} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              Pi
            </text>

            <text
              x={290}
              y={65}
              fill="#93C5FD"
              fontSize={40}
              fontWeight={900}
              fontFamily="sans-serif"
            >
              TIÊU THỤ 1 ATP
            </text>
            <text
              x={290}
              y={105}
              fill="#BFDBFE"
              fontSize={32}
              fontWeight={700}
              fontFamily="sans-serif"
            >
              Thủy phân cung cấp cơ năng lật van
            </text>
          </g>

          {/* Central Net Result Separator Line */}
          <line
            x1={80}
            y1={580}
            x2={840}
            y2={580}
            stroke="#475569"
            strokeWidth={3}
            strokeDasharray="12 8"
          />

          {/* Row 4: Net Impact Ledger */}
          <g transform="translate(80, 610)">
            <rect
              x={0}
              y={0}
              width={760}
              height={300}
              rx={28}
              fill="rgba(16, 185, 129, 0.12)"
              stroke="#10B981"
              strokeWidth={3}
            />

            <text
              x={380}
              y={55}
              fill="#34D399"
              fontSize={42}
              fontWeight={900}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              KẾT QUẢ SINH HỌC RÒNG
            </text>

            <text
              x={380}
              y={110}
              fill="#FFFFFF"
              fontSize={36}
              fontWeight={700}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Mất ròng -1 điện tích dương mỗi chu trình
            </text>

            {/* Glowing Voltmeter Target */}
            <g
              transform={`translate(380, 210) scale(${pulse})`}
              style={{ transformOrigin: '380px 210px' }}
            >
              <rect
                x={-200}
                y={-45}
                width={400}
                height={80}
                rx={24}
                fill="#064E3B"
                stroke="#34D399"
                strokeWidth={3}
              />
              <text
                x={0}
                y={12}
                fill="#A7F3D0"
                fontSize={44}
                fontWeight={900}
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                ĐIỆN THẾ: -70 mV
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Tầng 3: Status Ribbon [y: 1330 - 1410px] */}
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
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10B981',
            borderRadius: 30,
            padding: '12px 32px',
            color: '#6EE7B7',
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          Ý Nghĩa: Nền Tảng Dẫn Truyền Xung Thần Kinh & Co Cơ
        </div>
      </div>

      {/* Tầng 4: Karaoke Subtitles [y: 1420 - 1750px] - Rendered by Root Composition */}
    </div>
  );
};
