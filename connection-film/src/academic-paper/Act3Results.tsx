import React from 'react';
import {
  clamp,
  overshoot,
  settle,
  reactionSequence,
  bouncy,
} from '../../../.agents/skills/educational-flat-motion/kit';
import { ScientistRig } from './ScientistRig';

export interface Act3Props {
  frame: number;
}

const INK = '#111333';
const CORAL = '#ff6b78';
const MINT = '#6fe0c2';
const GOLD = '#ffd16c';
const CYAN = '#4ecdc4';

export const Act3Results: React.FC<Act3Props> = ({ frame }) => {
  const rel = frame - 660; // Relative to Act 3 start

  // Chart Growth (Frames 20 - 70)
  const barProgress = clamp((rel - 20) / 45);

  // Height of bars with overshoot (calibrated to fit dashboard cleanly)
  const controlHeight = overshoot(barProgress, 0.1) * 190;
  const napHeight = overshoot(barProgress, 0.18) * 310; // Surges higher cleanly!

  // Delta percentage badge pop (rel > 65)
  const badgeScale = rel > 65 ? overshoot(clamp((rel - 65) / 20), 0.35) : 0;

  // Gaussian Bell Curve tracing (rel > 120)
  const curveProgress = clamp((rel - 120) / 40);

  // p-value significance stamp pop (rel > 180)
  const pValScale = rel > 180 ? overshoot(clamp((rel - 180) / 18), 0.3) : 0;

  // Scientist reaction
  const scientistPose = reactionSequence(rel, 65, 'delight');

  // Bell curve SVG path centered at (0, 0) baseline
  const bellPoints: string[] = [];
  for (let x = -150; x <= 150; x += 10) {
    const y = -Math.exp(-(x * x) / (2 * 45 * 45)) * 110;
    bellPoints.push(`${x} ${y}`);
  }
  const bellD = `M ${bellPoints.join(' L ')}`;

  return (
    <g data-act="act-3">
      {/* Header Banner */}
      <g>
        <rect x={420} y={60} width={1080} height={70} rx={16} fill="#1d1542" stroke={INK} strokeWidth={6} />
        <text
          x={960}
          y={106}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={32}
          fontWeight="800"
          fontFamily="sans-serif"
          letterSpacing={1.5}
        >
          PHẦN 3: RESULTS — KẾT QUẢ NGHIÊN CỨU & DỮ LIỆU
        </text>
      </g>

      {/* Main Results Dashboard Container */}
      <g transform="translate(420, 180)">
        <rect
          width={1120}
          height={720}
          rx={28}
          fill="#1c1640"
          stroke={CORAL}
          strokeWidth={10}
        />

        <text
          x={560}
          y={65}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={28}
          fontWeight="800"
          fontFamily="sans-serif"
        >
          ĐỘ CHÍNH XÁC GIẢI TOÁN & TỐC ĐỘ XỬ LÝ
        </text>
        <text
          x={560}
          y={98}
          textAnchor="middle"
          fill="#d8cff8"
          fontSize={19}
          fontFamily="sans-serif"
        >
          Quy tắc Results: Trình bày sự thật số liệu khách quan, chưa kèm suy đoán chủ quan
        </text>

        {/* 1. DUAL BAR COMPARISON CHART */}
        <g transform="translate(180, 560)">
          {/* Baseline X-Axis */}
          <line x1={-60} y1={0} x2={460} y2={0} stroke="#4a3b78" strokeWidth={6} strokeLinecap="round" />

          {/* Bar A: Control Group (Without Nap) */}
          <g transform="translate(40, 0)">
            <rect
              x={0}
              y={-controlHeight}
              width={110}
              height={controlHeight}
              rx={12}
              fill={CORAL}
              stroke={INK}
              strokeWidth={5}
            />
            <text x={55} y={-controlHeight + 42} textAnchor="middle" fill="#ffffff" fontSize={26} fontWeight="900">
              58%
            </text>
            <text x={55} y={35} textAnchor="middle" fill="#ffffff" fontSize={20} fontWeight="700">
              Đối Chứng
            </text>
            <text x={55} y={62} textAnchor="middle" fill="#a092c4" fontSize={16}>
              (Thức liên tục)
            </text>
          </g>

          {/* Bar B: Power Nap Group */}
          <g transform="translate(240, 0)">
            <rect
              x={0}
              y={-napHeight}
              width={110}
              height={napHeight}
              rx={12}
              fill={MINT}
              stroke={INK}
              strokeWidth={5}
            />
            <text x={55} y={-napHeight + 45} textAnchor="middle" fill={INK} fontSize={30} fontWeight="900">
              93%
            </text>
            <text x={55} y={35} textAnchor="middle" fill="#ffffff" fontSize={20} fontWeight="700">
              Power Nap
            </text>
            <text x={55} y={62} textAnchor="middle" fill="#a092c4" fontSize={16}>
              (Ngủ 20 phút)
            </text>
          </g>

          {/* Delta Improvement Badge */}
          {badgeScale > 0.01 && (
            <g transform={`translate(295, ${-napHeight - 38}) scale(${badgeScale})`}>
              <rect x={-82} y={-24} width={164} height={48} rx={14} fill={GOLD} stroke={INK} strokeWidth={4} />
              <text x={0} y={9} textAnchor="middle" fill={INK} fontSize={21} fontWeight="900">
                +35% VƯỢT TRỘI
              </text>
            </g>
          )}
        </g>

        {/* 2. STATISTICAL SIGNIFICANCE CARD (GAUSSIAN BELL CURVE) */}
        <g transform="translate(680, 160)">
          <rect width={380} height={340} rx={20} fill="#261e54" stroke="#463684" strokeWidth={4} />
          <text x={190} y={40} textAnchor="middle" fill={GOLD} fontSize={20} fontWeight="800">
            PHÂN PHỐI XÁC SUẤT
          </text>

          {/* Bell curve graphic */}
          <g transform="translate(190, 190)">
            <line x1={-150} y1={0} x2={150} y2={0} stroke="#463684" strokeWidth={3} />
            <path
              d={bellD}
              fill="none"
              stroke={CYAN}
              strokeWidth={6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - curveProgress}
            />
          </g>
        </g>

        {/* Summary takeaway */}
        <g transform="translate(680, 540)">
          <rect width={380} height={130} rx={18} fill="#140f30" stroke={MINT} strokeWidth={4} />
          <text x={25} y={40} fill={MINT} fontSize={20} fontWeight="800">
            ✓ Kết luận số liệu thực:
          </text>
          <text x={25} y={72} fill="#ffffff" fontSize={17}>
            • Cỡ hiệu ứng: Cohen's d = 0.96
          </text>
          <text x={25} y={102} fill="#ffffff" fontSize={17}>
            • Độ tin cậy thống kê: 99%
          </text>

          {/* p-value Gold Seal Badge */}
          {pValScale > 0.01 && (
            <g transform={`translate(315, 65) scale(${pValScale})`}>
              <circle r={42} fill={GOLD} stroke={INK} strokeWidth={4} />
              <text x={0} y={-5} textAnchor="middle" fill={INK} fontSize={12} fontWeight="900">
                SIGNIFICANT
              </text>
              <text x={0} y={18} textAnchor="middle" fill={INK} fontSize={20} fontWeight="900">
                p &lt; 0.01
              </text>
            </g>
          )}
        </g>
      </g>

      {/* Scientist on Left Cheering */}
      <ScientistRig
        x={230}
        y={740}
        scale={1.0}
        flip={false}
        pose={scientistPose}
        hasGlasses={true}
        hasMagnifier={true}
      />
    </g>
  );
};
