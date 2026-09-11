import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoPill, AutoClippingConnector, type BoxDescriptor } from 'motion-kit';

export interface SemCausalGraphProps {
  currentBeatIndex: number; // 0: Constructs focus, 1: Causal paths, 2: Context gap, 3: Synthesis
}

const CONSTRUCTS = [
  { id: 'c1', name: 'Chất lượng DV số', color: '#38BDF8', y: 540, w: 320, h: 100 },
  { id: 'c2', name: 'Niềm tin KH', color: '#10B981', y: 760, w: 320, h: 100 },
  { id: 'c3', name: 'Rủi ro cảm nhận', color: '#F43F5E', y: 980, w: 320, h: 100 },
];

const BETAS = [
  { id: 'b1', text: 'β = 0.42***', color: '#38BDF8', y: 610, w: 240, h: 96 },
  { id: 'b2', text: 'β = 0.38***', color: '#10B981', y: 760, w: 240, h: 96 },
  { id: 'b3', text: 'β = -0.29**', color: '#F43F5E', y: 910, w: 240, h: 96 },
];

const TARGET_VAR = { name: 'SỰ HÀI LÒNG', color: '#10B981', cx: 860, cy: 760, w: 320, h: 120 };

export const SemCausalGraph: React.FC<SemCausalGraphProps> = ({ currentBeatIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active construct in beat 0 cycles (~45 frames each)
  const activeConstructIdx = currentBeatIndex === 0 ? Math.min(2, Math.floor(frame / 45)) : -1;
  const showPaths = currentBeatIndex >= 1;
  const isConflictStage = currentBeatIndex === 2;
  const isSynthesisStage = currentBeatIndex >= 3;

  // Box descriptors for dependent variable
  const targetBox: BoxDescriptor = {
    cx: TARGET_VAR.cx,
    cy: TARGET_VAR.cy,
    width: TARGET_VAR.w,
    height: TARGET_VAR.h,
    rx: 20,
  };

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
        <marker
          id="semArrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M 0 1 L 10 6 L 0 11 z" fill="#38BDF8" />
        </marker>
        <marker
          id="trustArrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M 0 1 L 10 6 L 0 11 z" fill="#10B981" />
        </marker>
        <marker
          id="riskArrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
        >
          <path d="M 0 1 L 10 6 L 0 11 z" fill="#F43F5E" />
        </marker>
      </defs>

      {/* Domain Title Header Pill at y = 300 */}
      <AutoPill
        text="CASE STUDY: MÔ HÌNH SEM NGÂN HÀNG SỐ"
        x={540}
        y={300}
        fontSize={30}
        fontWeight={900}
        color="#38BDF8"
        stroke="#38BDF8"
        strokeWidth={2}
        fill="#0F172A"
        paddingHorizontal={36}
      />

      {/* 3 Independent Constructs on Left (x = 220) */}
      {CONSTRUCTS.map((c, idx) => {
        const isSelected =
          isConflictStage ? idx === 2 :
          isSynthesisStage ? true :
          activeConstructIdx === -1 || idx === activeConstructIdx;

        const box: BoxDescriptor = { cx: 220, cy: c.y, width: c.w, height: c.h, rx: 20 };
        const betaBox: BoxDescriptor = { cx: 540, cy: BETAS[idx].y, width: BETAS[idx].w, height: BETAS[idx].h, rx: 16 };

        return (
          <g key={c.id}>
            {/* Connecting vectors when showPaths is active */}
            {showPaths && (
              <>
                <AutoClippingConnector
                  from={box}
                  to={betaBox}
                  stroke={c.color}
                  strokeWidth={isConflictStage && idx === 2 ? 6 : 4}
                  strokeDasharray={idx === 2 ? '8 6' : undefined}
                />
                <AutoClippingConnector
                  from={betaBox}
                  to={targetBox}
                  stroke={c.color}
                  strokeWidth={isConflictStage && idx === 2 ? 6 : 4}
                  strokeDasharray={idx === 2 ? '8 6' : undefined}
                />
              </>
            )}

            {/* Construct Box */}
            <g
              transform={`translate(220, ${c.y})`}
              opacity={isSelected ? 1.0 : 0.4}
              style={{ transition: 'opacity 0.25s ease' }}
            >
              <rect
                x={-c.w / 2}
                y={-c.h / 2}
                width={c.w}
                height={c.h}
                rx={20}
                fill="#0F172A"
                stroke={c.color}
                strokeWidth={isSelected ? 4 : 2}
                filter={isSelected ? `drop-shadow(0 0 16px ${c.color}80)` : 'none'}
                data-badge="true"
              />
              <text
                x={0}
                y={10}
                textAnchor="middle"
                fill={isSelected ? '#FFFFFF' : c.color}
                fontSize={30}
                fontWeight={800}
              >
                {c.name}
              </text>
            </g>

            {/* Intermediate Beta Value Badge */}
            {showPaths && (
              <g transform={`translate(540, ${BETAS[idx].y})`}>
                <rect
                  x={-BETAS[idx].w / 2}
                  y={-BETAS[idx].h / 2}
                  width={BETAS[idx].w}
                  height={BETAS[idx].h}
                  rx={16}
                  fill="#0F172A"
                  stroke={c.color}
                  strokeWidth={2}
                  data-badge="true"
                />
                <text
                  x={0}
                  y={8}
                  textAnchor="middle"
                  fill={c.color}
                  fontSize={30}
                  fontWeight={800}
                >
                  {BETAS[idx].text}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Dependent Variable Box on Right (x = 860, y = 760) */}
      <g transform={`translate(${TARGET_VAR.cx}, ${TARGET_VAR.cy})`}>
        <rect
          x={-TARGET_VAR.w / 2}
          y={-TARGET_VAR.h / 2}
          width={TARGET_VAR.w}
          height={TARGET_VAR.h}
          rx={20}
          fill="#0F172A"
          stroke={TARGET_VAR.color}
          strokeWidth={isSynthesisStage ? 5 : 4}
          filter={isSynthesisStage ? 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.8))' : 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))'}
          data-badge="true"
        />
        <text
          x={0}
          y={10}
          textAnchor="middle"
          fill={TARGET_VAR.color}
          fontSize={32}
          fontWeight={900}
        >
          {TARGET_VAR.name}
        </text>
      </g>

      {/* Dynamic Stage Insight Pill in Safe Zone at y = 1150 */}
      {isConflictStage && (
        <AutoPill
          text="BIẾN ĐIỀU TIẾT: RỦI RO LÀM ĐẢO CHIỀU TÁC ĐỘNG"
          x={540}
          y={1150}
          fontSize={30}
          fontWeight={800}
          color="#F43F5E"
          stroke="#F43F5E"
          strokeWidth={3}
          fill="#0F172A"
          paddingHorizontal={36}
        />
      )}

      {isSynthesisStage && (
        <AutoPill
          text="MÔ HÌNH TOÀN DIỆN: CÂN BẰNG HỆ THỐNG TRI THỨC"
          x={540}
          y={1150}
          fontSize={30}
          fontWeight={800}
          color="#10B981"
          stroke="#10B981"
          strokeWidth={3}
          fill="#0F172A"
          paddingHorizontal={36}
        />
      )}
    </svg>
  );
};
