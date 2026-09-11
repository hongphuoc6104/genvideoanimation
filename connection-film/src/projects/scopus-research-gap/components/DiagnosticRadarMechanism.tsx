import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { computeItemSalienceState } from 'motion-kit';

export interface DiagnosticPitfallRadarProps {
  activeMistakeIndex: number; // 0: Lỗi 1, 1: Lỗi 2, 2: Lỗi 3, 3: Lỗi 4, 4: All cleared/triumph
}

const MISTAKES = [
  {
    id: 'm1',
    name: 'LỖI 1: THIẾU BẰNG CHỨNG',
    fix: 'Trích dẫn cụ thể tác giả & dữ liệu',
    activeFix: 'Khắc phục: Bổ sung bằng chứng cụ thể',
    clearedFix: 'Đã khắc phục: Dữ liệu & trích dẫn chuẩn',
    color: '#F43F5E',
  },
  {
    id: 'm2',
    name: 'LỖI 2: ĐỒNG NHẤT BỐI CẢNH',
    fix: 'Bối cảnh mới chưa chắc là tính mới',
    activeFix: 'Khắc phục: Không chỉ đổi địa bàn nghiên cứu',
    clearedFix: 'Đã khắc phục: Chứng minh cơ chế mới',
    color: '#F59E0B',
  },
  {
    id: 'm3',
    name: 'LỖI 3: LIỆT KÊ ĐƠN THUẦN',
    fix: 'Phải tổng hợp, đối chiếu và phản biện',
    activeFix: 'Khắc phục: Tránh tóm tắt từng bài riêng rẽ',
    clearedFix: 'Đã khắc phục: Tổng hợp và phản biện sâu',
    color: '#A855F7',
  },
  {
    id: 'm4',
    name: 'LỖI 4: TÁCH RỜI PHƯƠNG PHÁP',
    fix: 'Gap phải ăn khớp phương pháp đo',
    activeFix: 'Khắc phục: Đồng bộ thang đo với câu hỏi',
    clearedFix: 'Đã khắc phục: Phương pháp đo ăn khớp Gap',
    color: '#38BDF8',
  },
];

export const DiagnosticRadarMechanism: React.FC<DiagnosticPitfallRadarProps> = ({
  activeMistakeIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isTriumph = activeMistakeIndex >= 4;
  const radarSweep = (frame * 4) % 360;

  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <defs>
        <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central Radar Diagnostic Scope (y = 480, r = 200) */}
      <g transform="translate(540, 480)">
        {/* Outer Scope Rings */}
        <circle cx={0} cy={0} r={200} fill="#0F172A" stroke="#334155" strokeWidth={3} />
        <circle cx={0} cy={0} r={140} fill="none" stroke="#334155" strokeWidth={2} strokeDasharray="6 6" />
        <circle cx={0} cy={0} r={80} fill="none" stroke="#334155" strokeWidth={2} strokeDasharray="4 4" />
        <line x1={-200} y1={0} x2={200} y2={0} stroke="#334155" strokeWidth={2} />
        <line x1={0} y1={-200} x2={0} y2={200} stroke="#334155" strokeWidth={2} />

        {/* Sweep Beam */}
        <g transform={`rotate(${radarSweep})`}>
          <path d="M 0,0 L 200,0 A 200,200 0 0,0 170,-100 Z" fill="url(#radarSweepGrad)" />
        </g>

        {/* Center Target Indicator Badge: Single Clean Handoff between QC and SCOPUS */}
        {!isTriumph ? (
          <g data-badge="true">
            <rect
              x={-85}
              y={-55}
              width={170}
              height={110}
              rx={24}
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth={4}
              filter="drop-shadow(0 0 16px rgba(56, 189, 248, 0.8))"
            />
            <text
              x={0}
              y={10}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={30}
              fontWeight={900}
            >
              QC
            </text>
          </g>
        ) : (
          <g data-badge="true">
            <rect
              x={-150}
              y={-60}
              width={300}
              height={120}
              rx={32}
              fill="#10B981"
              stroke="#34D399"
              strokeWidth={4}
              filter="drop-shadow(0 0 24px rgba(16, 185, 129, 0.9))"
            />
            <text
              x={0}
              y={12}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={34}
              fontWeight={900}
            >
              SCOPUS
            </text>
          </g>
        )}
      </g>

      {/* 4 Shield Indicators (y in [730, 1340], strictly above Subtitle Safe Floor 1450) */}
      <g transform="translate(540, 730)">
        {MISTAKES.map((m, idx) => {
          const isActive = idx === activeMistakeIndex;
          const isCleared = isTriumph || idx < activeMistakeIndex;
          const yPos = idx * 155;

          const state = computeItemSalienceState(
            idx,
            activeMistakeIndex,
            isTriumph ? 1.0 : isActive ? 1.0 : 0.0,
            {
              mode: 'spotlight-dim',
              inactiveOpacity: 0.22,
              inactiveDesaturation: 0.75,
              activeScale: 1.04,
              activeBrightness: 1.25,
            }
          );

          return (
            <g key={m.id} transform={`translate(0, ${yPos})`}>
              {/* Opaque Shield Background (920px width for safe padding >= 30px) */}
              <rect
                x={-460}
                y={0}
                width={920}
                height={135}
                rx={20}
                fill="#0F172A"
                stroke={isCleared ? '#10B981' : isActive ? m.color : '#334155'}
                strokeWidth={isActive ? 4 : isCleared ? 3 : 1.5}
                filter={isActive ? `drop-shadow(0 0 20px ${m.color}80)` : 'none'}
                data-badge="true"
              />

              {/* Inner Content with Spotlight & Dim Opacity */}
              <g
                opacity={isTriumph ? 0.9 : state.opacity}
                style={{
                  filter: isTriumph ? 'none' : state.filter,
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Status Icon */}
                <g transform="translate(-400, 67)">
                  <circle
                    cx={0}
                    cy={0}
                    r={26}
                    fill={isCleared ? '#10B981' : isActive ? m.color : '#334155'}
                  />
                  {isCleared ? (
                    <path
                      d="M -9 1 L -3 7 L 9 -5"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M 0 -9 L 0 1 M 0 6 L 0 8"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  )}
                </g>

                {/* Line 1: Title */}
                <text
                  x={-350}
                  y={55}
                  fill={isCleared ? '#10B981' : isActive ? '#FFFFFF' : '#94A3B8'}
                  fontSize={30}
                  fontWeight={800}
                >
                  {m.name}
                </text>

                {/* Line 2: Fix Description */}
                <text
                  x={-350}
                  y={101}
                  fill={isCleared ? '#34D399' : isActive ? m.color : '#64748B'}
                  fontSize={30}
                  fontWeight={600}
                >
                  {isCleared ? m.clearedFix : isActive ? m.activeFix : m.fix}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
