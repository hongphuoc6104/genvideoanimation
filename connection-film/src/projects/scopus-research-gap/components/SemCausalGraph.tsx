import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { computeItemSalienceState } from 'motion-kit';

export interface SemCausalGraphProps {
  currentBeatIndex: number; // 0: Constructs focus, 1: Causal paths, 2: Context gap, 3: Synthesis
}

const CONSTRUCTS = [
  { id: 'c1', name: 'E-Service Quality', vnName: '(Chất lượng DV số)', color: '#38BDF8', y: 520 },
  { id: 'c2', name: 'Perceived Trust', vnName: '(Niềm tin khách hàng)', color: '#10B981', y: 760 },
  { id: 'c3', name: 'Perceived Risk', vnName: '(Rủi ro cảm nhận)', color: '#F43F5E', y: 1000 },
];

export const SemCausalGraph: React.FC<SemCausalGraphProps> = ({ currentBeatIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // In beat 0: rotate focus among the 3 independent constructs (~45 frames each)
  const activeConstructIdx = currentBeatIndex === 0 ? Math.min(2, Math.floor(frame / 45)) : -1;
  const showPaths = currentBeatIndex >= 1;
  const isSynthesisStage = currentBeatIndex >= 2;

  // Pulse effect on causal paths
  const particleOffset = (frame * 6) % 300;

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

      {/* Domain Title HUD Badge (y = 280) */}
      <g transform="translate(540, 280)">
        <rect
          x={-430}
          y={-55}
          width={860}
          height={110}
          rx={24}
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth={2}
          filter="drop-shadow(0 0 16px rgba(56, 189, 248, 0.3))"
          data-badge="true"
        />
        <text x={0} y={10} textAnchor="middle" fill="#38BDF8" fontSize={30} fontWeight={900}>
          CASE STUDY: MÔ HÌNH SEM NGÂN HÀNG SỐ
        </text>
      </g>

      {/* Latent Construct Nodes (y in [440, 1200]) */}
      <g transform="translate(0, 100)">
        {/* 3 Independent Constructs with Salience Standard */}
        {CONSTRUCTS.map((c, idx) => {
          const isSelected = activeConstructIdx === -1 ? true : idx === activeConstructIdx;
          const state = computeItemSalienceState(
            idx,
            activeConstructIdx === -1 ? idx : activeConstructIdx,
            isSelected ? 1.0 : 0.0,
            {
              mode: 'spotlight-dim',
              inactiveOpacity: 0.22,
              inactiveDesaturation: 0.75,
              activeScale: 1.05,
              activeBrightness: 1.25,
            }
          );

          return (
            <g
              key={c.id}
              transform={`translate(230, ${c.y})`}
              opacity={state.opacity}
              style={{
                filter: state.filter,
              }}
            >
              <rect
                x={-160}
                y={-55}
                width={320}
                height={110}
                rx={22}
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
          );
        })}

        {/* Dependent Variable: Customer Satisfaction */}
        <g
          transform="translate(860, 760)"
          opacity={activeConstructIdx === -1 ? 1.0 : 0.85}
        >
          <rect
            x={-160}
            y={-55}
            width={320}
            height={110}
            rx={20}
            fill="#0F172A"
            stroke="#10B981"
            strokeWidth={4}
            filter="drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))"
            data-badge="true"
          />
          <text x={0} y={10} textAnchor="middle" fill="#10B981" fontSize={32} fontWeight={900}>
            SỰ HÀI LÒNG
          </text>
        </g>

        {/* Causal Directed Path Vectors - Only rendered when showPaths is true */}
        {showPaths && (
          <g opacity={1.0}>
            {/* Path 1: Quality -> Beta 1 -> Satisfaction */}
            <line
              x1={390}
              y1={540}
              x2={400}
              y2={550}
              stroke="#38BDF8"
              strokeWidth={5}
            />
            <line
              x1={680}
              y1={630}
              x2={700}
              y2={720}
              stroke="#38BDF8"
              strokeWidth={5}
              markerEnd="url(#semArrow)"
            />
            <g transform="translate(540, 590)">
              <rect
                x={-140}
                y={-55}
                width={280}
                height={110}
                rx={18}
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth={2}
                data-badge="true"
              />
              <text x={0} y={10} textAnchor="middle" fill="#38BDF8" fontSize={30} fontWeight={800}>
                β = 0.42***
              </text>
            </g>

            {/* Path 2: Trust -> Beta 2 -> Satisfaction */}
            <line
              x1={390}
              y1={760}
              x2={400}
              y2={760}
              stroke="#10B981"
              strokeWidth={5}
            />
            <line
              x1={680}
              y1={760}
              x2={700}
              y2={760}
              stroke="#10B981"
              strokeWidth={5}
              markerEnd="url(#semArrow)"
            />
            <g transform="translate(540, 760)">
              <rect
                x={-140}
                y={-55}
                width={280}
                height={110}
                rx={18}
                fill="#0F172A"
                stroke="#10B981"
                strokeWidth={2}
                data-badge="true"
              />
              <text x={0} y={10} textAnchor="middle" fill="#10B981" fontSize={30} fontWeight={800}>
                β = 0.38***
              </text>
            </g>

            {/* Path 3: Risk -> Beta 3 -> Satisfaction (Negative Impact) */}
            <line
              x1={390}
              y1={980}
              x2={400}
              y2={970}
              stroke="#F43F5E"
              strokeWidth={5}
              strokeDasharray="8 6"
            />
            <line
              x1={680}
              y1={890}
              x2={700}
              y2={800}
              stroke="#F43F5E"
              strokeWidth={5}
              strokeDasharray="8 6"
              markerEnd="url(#riskArrow)"
            />
            <g transform="translate(540, 930)">
              <rect
                x={-140}
                y={-55}
                width={280}
                height={110}
                rx={18}
                fill="#0F172A"
                stroke="#F43F5E"
                strokeWidth={2}
                data-badge="true"
              />
              <text x={0} y={10} textAnchor="middle" fill="#F43F5E" fontSize={30} fontWeight={800}>
                β = -0.25**
              </text>
            </g>
          </g>
        )}

        {/* Beat 2 (Beat 18): Contextual Conflict & Market Gap */}
        {currentBeatIndex === 2 && (
          <g transform="translate(540, 1180)">
            <rect
              x={-440}
              y={-55}
              width={880}
              height={110}
              rx={24}
              fill="#0F172A"
              stroke="#F59E0B"
              strokeWidth={4}
              filter="drop-shadow(0 0 24px rgba(245, 158, 11, 0.8))"
              data-badge="true"
            />
            <text x={0} y={10} textAnchor="middle" fill="#F59E0B" fontSize={32} fontWeight={900}>
              GAP BỐI CẢNH: THỊ TRƯỜNG MỚI NỔI
            </text>
          </g>
        )}

        {/* Beat 3 (Beat 19): Full Resolution Synthesis (Mediator & Moderator) */}
        {currentBeatIndex >= 3 && (
          <g transform="translate(540, 1180)">
            <rect
              x={-460}
              y={-90}
              width={920}
              height={180}
              rx={24}
              fill="#0F172A"
              stroke="#10B981"
              strokeWidth={4}
              filter="drop-shadow(0 0 28px rgba(16, 185, 129, 0.9))"
              data-badge="true"
            />
            <text x={0} y={-20} textAnchor="middle" fill="#10B981" fontSize={32} fontWeight={900}>
              LẤP ĐẦY GAP: BIẾN TRUNG GIAN & ĐIỀU TIẾT
            </text>
            <text x={0} y={45} textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight={700}>
              Mô hình SEM hoàn thiện đạt chuẩn Q1
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};
