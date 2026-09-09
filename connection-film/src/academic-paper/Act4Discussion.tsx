import React from 'react';
import {
  clamp,
  overshoot,
  settle,
  squashStretch,
  IDLE_POSE,
} from '../../../.agents/skills/educational-flat-motion/kit';
import { ScientistRig } from './ScientistRig';

export interface Act4Props {
  frame: number;
}

const INK = '#111333';
const MINT = '#6fe0c2';
const GOLD = '#ffd16c';
const CORAL = '#ff6b78';
const CYAN = '#4ecdc4';

export const Act4Discussion: React.FC<Act4Props> = ({ frame }) => {
  const rel = frame - 1020; // Relative to Act 4 start

  // Morph from Discussion cards (0 - 100) into Published Academic Paper (100 - 330)
  const isPaperPhase = rel > 90;
  const paperScale = isPaperPhase ? overshoot(clamp((rel - 90) / 25), 0.15) : 0;

  // Rubber Stamp Slam (rel > 170)
  const stampT = clamp((rel - 170) / 14);
  let stampSquashY = 1.0;
  let stampY = -400;

  if (rel >= 170) {
    if (stampT < 0.7) {
      stampY = -300 + stampT * 850;
    } else {
      stampY = 320;
      stampSquashY = 0.76 + Math.sin((stampT - 0.7) / 0.3 * Math.PI) * 0.24;
    }
  }
  const { scaleX: stampSquashX, scaleY: sqY } = squashStretch(stampSquashY);

  // Scientist celebrating
  const scientistPose = {
    ...IDLE_POSE,
    bodyY: isPaperPhase ? -8 : 0,
    headAngle: isPaperPhase ? 8 : -4,
    eyeGazeX: isPaperPhase ? -0.7 : 0.6,
    eyeGazeY: -0.2,
    beakOpen: isPaperPhase ? 0.35 : 0.1,
    wingLeftAngle: isPaperPhase ? -35 : 0,
    wingRightAngle: isPaperPhase ? 20 : 0,
  };

  return (
    <g data-act="act-4">
      {/* Header Banner */}
      <g>
        <rect x={400} y={60} width={1120} height={70} rx={16} fill="#1d1542" stroke={INK} strokeWidth={6} />
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
          {isPaperPhase ? 'XUẤT BẢN THÀNH CÔNG: BÀI BÁO HOÀN CHỈNH' : 'PHẦN 4: DISCUSSION — Ý NGHĨA & HẠN CHẾ'}
        </text>
      </g>

      {/* STAGE 1: DISCUSSION ESSENTIALS CARD (Frames 0 - 90) */}
      {!isPaperPhase ? (
        <g transform={`translate(960, 540) scale(${overshoot(clamp(rel / 20), 0.12)}) translate(-960, -540)`}>
          <rect
            x={420}
            y={180}
            width={1080}
            height={720}
            rx={28}
            fill="#182836"
            stroke={MINT}
            strokeWidth={10}
          />

          <text
            x={960}
            y={245}
            textAnchor="middle"
            fill={MINT}
            fontSize={30}
            fontWeight="900"
            fontFamily="sans-serif"
          >
            3 CÂU HỎI BẮT BUỘC TRONG PHẦN THẢO LUẬN
          </text>

          <g transform="translate(480, 310)">
            {/* Box 1: Ý nghĩa & Đóng góp */}
            <g>
              <rect width={960} height={120} rx={16} fill="#233a4d" stroke={CYAN} strokeWidth={4} />
              <text x={35} y={45} fill={CYAN} fontSize={22} fontWeight="900">1. Ý nghĩa khoa học & thực tiễn:</text>
              <text x={35} y={80} fill="#ffffff" fontSize={19}>
                Chứng minh giấc ngủ ngắn 20 phút kích hoạt sóng Theta, cải thiện trực tiếp hiệu suất làm việc.
              </text>
            </g>

            {/* Box 2: Giới hạn nghiên cứu */}
            <g transform="translate(0, 150)">
              <rect width={960} height={120} rx={16} fill="#233a4d" stroke={GOLD} strokeWidth={4} />
              <text x={35} y={45} fill={GOLD} fontSize={22} fontWeight="900">2. Giới hạn nghiên cứu (Limitations):</text>
              <text x={35} y={80} fill="#ffffff" fontSize={19}>
                Nghiên cứu tập trung vào nhóm 18–25 tuổi; chưa khảo sát tác động lâu dài qua nhiều tuần.
              </text>
            </g>

            {/* Box 3: Hướng phát triển */}
            <g transform="translate(0, 300)">
              <rect width={960} height={120} rx={16} fill="#233a4d" stroke={CORAL} strokeWidth={4} />
              <text x={35} y={45} fill={CORAL} fontSize={22} fontWeight="900">3. Hướng nghiên cứu tương lai:</text>
              <text x={35} y={80} fill="#ffffff" fontSize={19}>
                Mở rộng so sánh giữa giấc ngủ 10 phút, 20 phút và 30 phút trên các lĩnh vực sáng tạo.
              </text>
            </g>
          </g>
        </g>
      ) : (
        /* STAGE 2: PUBLISHED ACADEMIC PAPER & ACCEPTED STAMP (Frames 90 - 330) */
        <g transform={`translate(960, 540) scale(${paperScale}) translate(-960, -540)`}>
          {/* Paper Document Container */}
          <rect
            x={560}
            y={160}
            width={800}
            height={740}
            rx={16}
            fill="#f7f9fd"
            stroke="#111333"
            strokeWidth={8}
            filter="drop-shadow(0px 20px 40px rgba(0,0,0,0.5))"
          />

          {/* Academic Journal Header */}
          <rect x={600} y={190} width={720} height={40} rx={6} fill="#1d1542" />
          <text x={620} y={216} fill="#ffffff" fontSize={16} fontWeight="800" fontFamily="sans-serif">
            JOURNAL OF COGNITIVE NEUROSCIENCE & PROBLEM SOLVING • VOL. 42
          </text>

          {/* Paper Title */}
          <text
            x={600}
            y={280}
            fill="#111333"
            fontSize={26}
            fontWeight="900"
            fontFamily="sans-serif"
          >
            The 20-Minute Power Nap Enhances Cognitive
          </text>
          <text
            x={600}
            y={315}
            fill="#111333"
            fontSize={26}
            fontWeight="900"
            fontFamily="sans-serif"
          >
            Efficiency and Theta Wave Coherence
          </text>

          {/* Authors */}
          <text x={600} y={355} fill="#5d6b82" fontSize={18} fontWeight="700">
            Dr. Owl Scientist, Prof. Cognitive Research • Published 2026
          </text>

          {/* Abstract Block */}
          <rect x={600} y={380} width={720} height={140} rx={10} fill="#eaf0fa" />
          <text x={620} y={410} fill="#111333" fontSize={18} fontWeight="800">ABSTRACT</text>
          <text x={620} y={440} fill="#334155" fontSize={16}>
            In this randomized controlled trial (N=100), a standardized 20-min midday power nap
          </text>
          <text x={620} y={465} fill="#334155" fontSize={16}>
            resulted in a +35% improvement in complex logic problem-solving speed (p &lt; 0.01).
          </text>
          <text x={620} y={490} fill="#334155" fontSize={16}>
            Continuous 64-channel EEG confirmed elevated frontal theta coherence.
          </text>

          {/* Mini Two-column text layout simulation */}
          <g transform="translate(600, 545)">
            <rect width={345} height={180} rx={8} fill="#f1f5f9" />
            <text x={20} y={30} fill="#111333" fontSize={15} fontWeight="800">1. INTRODUCTION</text>
            <line x1={20} y1={50} x2={325} y2={50} stroke="#cbd5e1" strokeWidth={5} />
            <line x1={20} y1={70} x2={305} y2={70} stroke="#cbd5e1" strokeWidth={5} />
            <text x={20} y={110} fill="#111333" fontSize={15} fontWeight="800">2. METHODS</text>
            <line x1={20} y1={130} x2={325} y2={130} stroke="#cbd5e1" strokeWidth={5} />
            <line x1={20} y1={150} x2={280} y2={150} stroke="#cbd5e1" strokeWidth={5} />
          </g>

          <g transform="translate(975, 545)">
            <rect width={345} height={180} rx={8} fill="#f1f5f9" />
            <text x={20} y={30} fill="#111333" fontSize={15} fontWeight="800">3. RESULTS</text>
            <line x1={20} y1={50} x2={325} y2={50} stroke="#cbd5e1" strokeWidth={5} />
            <line x1={20} y1={70} x2={310} y2={70} stroke="#cbd5e1" strokeWidth={5} />
            <text x={20} y={110} fill="#111333" fontSize={15} fontWeight="800">4. DISCUSSION</text>
            <line x1={20} y1={130} x2={325} y2={130} stroke="#cbd5e1" strokeWidth={5} />
            <line x1={20} y1={150} x2={290} y2={150} stroke="#cbd5e1" strokeWidth={5} />
          </g>

          {/* RED RUBBER STAMP: PEER-REVIEWED & ACCEPTED */}
          {rel >= 170 && (
            <g
              transform={`translate(960, ${stampY}) rotate(-12) scale(${stampSquashX}, ${sqY})`}
              filter="drop-shadow(0px 8px 16px rgba(220, 38, 38, 0.4))"
            >
              <rect
                x={-240}
                y={-65}
                width={480}
                height={130}
                rx={18}
                fill="#ffffff"
                stroke="#dc2626"
                strokeWidth={10}
                strokeDasharray="18 10"
              />
              <text
                x={0}
                y={-10}
                textAnchor="middle"
                fill="#dc2626"
                fontSize={32}
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing={3}
              >
                PEER-REVIEWED
              </text>
              <text
                x={0}
                y={38}
                textAnchor="middle"
                fill="#dc2626"
                fontSize={42}
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing={5}
              >
                &amp; ACCEPTED
              </text>
            </g>
          )}

          {/* Golden Bottom Advice Ribbon */}
          <g transform="translate(600, 755)">
            <rect width={720} height={70} rx={14} fill="#ffd16c" stroke={INK} strokeWidth={4} />
            <text
              x={360}
              y={44}
              textAnchor="middle"
              fill={INK}
              fontSize={21}
              fontWeight="900"
              fontFamily="sans-serif"
            >
              CÔNG THỨC: CÂU HỎI SÂU SẮC + CẤU TRÚC CHẶT CHẼ
            </text>
          </g>
        </g>
      )}

      {/* Scientist on Left Cheering & Waving */}
      <ScientistRig
        x={260}
        y={740}
        scale={1.05}
        flip={false}
        pose={scientistPose}
        hasGlasses={true}
        hasMagnifier={true}
      />
    </g>
  );
};
