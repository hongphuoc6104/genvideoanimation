import React from 'react';
import {
  clamp,
  overshoot,
  settle,
  IDLE_POSE,
} from 'motion-kit';
import { ScientistRig } from './ScientistRig';

export interface Act2Props {
  frame: number;
}

const INK = '#111333';
const CYAN = '#4ecdc4';
const GOLD = '#ffd16c';
const CORAL = '#ff6b78';
const MINT = '#6fe0c2';

export const Act2Methods: React.FC<Act2Props> = ({ frame }) => {
  const rel = frame - 300; // Relative to Act 2 start

  // Transition from Introduction Card (0-160) to Methods Setup (160-360)
  const isMethodsPhase = rel > 140;
  const methodsProgress = clamp((rel - 140) / 25);

  // Scientist inspecting
  const scientistPose = {
    ...IDLE_POSE,
    bodyTilt: isMethodsPhase ? 4 : -2,
    headAngle: isMethodsPhase ? 12 : -6,
    eyeGazeX: isMethodsPhase ? 0.8 : -0.4,
    eyeGazeY: 0.1,
  };

  // EEG Brainwave Path calculations
  const eegPoints: string[] = [];
  const waveLength = 480;
  for (let x = 0; x <= waveLength; x += 10) {
    const freq = isMethodsPhase ? 0.08 : 0.04;
    const amp = isMethodsPhase ? 24 : 14;
    const y = Math.sin((x + rel * 8) * freq) * amp;
    eegPoints.push(`${x} ${y}`);
  }
  const eegD = `M ${eegPoints.join(' L ')}`;

  return (
    <g data-act="act-2">
      {/* Header Banner */}
      <g>
        <rect x={460} y={60} width={1000} height={70} rx={16} fill="#1d1542" stroke={INK} strokeWidth={6} />
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
          {isMethodsPhase ? 'PHẦN 2: METHODS — PHƯƠNG PHÁP NGHIÊN CỨU' : 'PHẦN 1: INTRODUCTION — ĐẶT VẤN ĐỀ'}
        </text>
      </g>

      {/* SECTION 1: INTRODUCTION CARD (Frames 0 - 150) */}
      {!isMethodsPhase ? (
        <g transform={`translate(960, 540) scale(${overshoot(clamp(rel / 20), 0.15)}) translate(-960, -540)`}>
          <rect
            x={440}
            y={200}
            width={1040}
            height={680}
            rx={28}
            fill="#18233c"
            stroke={CYAN}
            strokeWidth={10}
          />

          {/* Research Topic Header */}
          <rect x={480} y={240} width={960} height={100} rx={18} fill="#233559" />
          <text
            x={960}
            y={285}
            textAnchor="middle"
            fill={GOLD}
            fontSize={24}
            fontWeight="700"
            fontFamily="sans-serif"
          >
            VÍ DỤ NGHIÊN CỨU THỰC NGHIỆM:
          </text>
          <text
            x={960}
            y={320}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={28}
            fontWeight="800"
            fontFamily="sans-serif"
          >
            "Hiệu ứng Giấc ngủ ngắn 20 phút lên Năng lực Giải toán"
          </text>

          {/* 3 Core Rules of a Great Introduction */}
          <g transform="translate(520, 390)">
            {/* Bullet 1: Bối cảnh */}
            <g transform="translate(0, 0)">
              <circle cx={40} cy={40} r={28} fill={CYAN} stroke={INK} strokeWidth={5} />
              <text x={40} y={48} textAnchor="middle" fill="#ffffff" fontSize={24} fontWeight="900">1</text>
              <text x={90} y={35} fill="#ffffff" fontSize={26} fontWeight="800" fontFamily="sans-serif">
                Bối cảnh (Context):
              </text>
              <text x={90} y={65} fill="#a8c0e8" fontSize={20} fontFamily="sans-serif">
                Tình trạng mệt mỏi nhận thức vào buổi chiều làm giảm 40% hiệu suất tư duy.
              </text>
            </g>

            {/* Bullet 2: Khoảng trống tri thức (Research Gap) */}
            <g transform="translate(0, 110)">
              <circle cx={40} cy={40} r={28} fill={GOLD} stroke={INK} strokeWidth={5} />
              <text x={40} y={48} textAnchor="middle" fill="#ffffff" fontSize={24} fontWeight="900">2</text>
              <text x={90} y={35} fill="#ffffff" fontSize={26} fontWeight="800" fontFamily="sans-serif">
                Khoảng trống nghiên cứu (Research Gap):
              </text>
              <text x={90} y={65} fill="#a8c0e8" fontSize={20} fontFamily="sans-serif">
                Chưa có đối chứng thực nghiệm với đo sóng não EEG liên tục trong ca giải toán.
              </text>
            </g>

            {/* Bullet 3: Giả thuyết & Mục tiêu */}
            <g transform="translate(0, 220)">
              <circle cx={40} cy={40} r={28} fill={CORAL} stroke={INK} strokeWidth={5} />
              <text x={40} y={48} textAnchor="middle" fill="#ffffff" fontSize={24} fontWeight="900">3</text>
              <text x={90} y={35} fill="#ffffff" fontSize={26} fontWeight="800" fontFamily="sans-serif">
                Giả thuyết nghiên cứu (Hypothesis):
              </text>
              <text x={90} y={65} fill="#a8c0e8" fontSize={20} fontFamily="sans-serif">
                20 phút ngủ ngắn giúp tái tạo sóng Theta, tăng tốc độ giải đề chính xác.
              </text>
            </g>
          </g>
        </g>
      ) : (
        /* SECTION 2: METHODS CARD (Frames 150 - 360) */
        <g transform={`translate(960, 540) scale(${overshoot(methodsProgress, 0.12)}) translate(-960, -540)`}>
          <rect
            x={400}
            y={180}
            width={1120}
            height={720}
            rx={28}
            fill="#1e1842"
            stroke={GOLD}
            strokeWidth={10}
          />

          {/* Randomized Trial Setup Banner */}
          <text
            x={960}
            y={240}
            textAnchor="middle"
            fill={GOLD}
            fontSize={30}
            fontWeight="900"
            fontFamily="sans-serif"
          >
            THIẾT KẾ THỰC NGHIỆM ĐỐI CHỨNG NGẪU NHIÊN (N = 100)
          </text>
          <text
            x={960}
            y={275}
            textAnchor="middle"
            fill="#d2c8f8"
            fontSize={20}
            fontFamily="sans-serif"
          >
            Quy tắc Methods: Đủ chi tiết để một nhà khoa học khác có thể tái lập 100%
          </text>

          {/* Group 1 vs Group 2 Cards */}
          <g transform="translate(450, 320)">
            {/* Control Group */}
            <g>
              <rect width={480} height={200} rx={18} fill="#271f54" stroke={CORAL} strokeWidth={6} />
              <circle cx={45} cy={45} r={24} fill={CORAL} />
              <text x={45} y={53} textAnchor="middle" fill="#ffffff" fontSize={20} fontWeight="900">A</text>
              <text x={85} y={52} fill="#ffffff" fontSize={24} fontWeight="800">Nhóm Đối Chứng (n = 50)</text>
              <text x={35} y={105} fill="#d2c8f8" fontSize={19}>• Hoạt động tĩnh thức (đọc báo 20p)</text>
              <text x={35} y={135} fill="#d2c8f8" fontSize={19}>• Giải đề toán logic chuẩn hóa</text>
              <text x={35} y={165} fill="#ff6b78" fontSize={19} fontWeight="700">• Đo điện não đồ EEG 64 kênh</text>
            </g>

            {/* Power Nap Group */}
            <g transform="translate(530, 0)">
              <rect width={480} height={200} rx={18} fill="#271f54" stroke={MINT} strokeWidth={6} />
              <circle cx={45} cy={45} r={24} fill={MINT} />
              <text x={45} y={53} textAnchor="middle" fill={INK} fontSize={20} fontWeight="900">B</text>
              <text x={85} y={52} fill="#ffffff" fontSize={24} fontWeight="800">Nhóm Ngủ Ngắn (n = 50)</text>
              <text x={35} y={105} fill="#d2c8f8" fontSize={19}>• Ngủ ngắn đúng 20 phút (13:00 - 13:20)</text>
              <text x={35} y={135} fill="#d2c8f8" fontSize={19}>• Giải đề toán cùng độ khó</text>
              <text x={35} y={165} fill="#6fe0c2" fontSize={19} fontWeight="700">• Đo điện não đồ EEG 64 kênh</text>
            </g>
          </g>

          {/* Live EEG Waveform Display */}
          <g transform="translate(500, 570)">
            <rect width={920} height={140} rx={16} fill="#14102e" stroke="#3b2d75" strokeWidth={4} />
            <text x={30} y={38} fill={CYAN} fontSize={18} fontWeight="800" fontFamily="sans-serif">
              TÍN HIỆU ĐIỆN NÃO ĐỒ (EEG THETA WAVE 4-8Hz)
            </text>
            <g transform="translate(220, 75)">
              <path d={eegD} fill="none" stroke={CYAN} strokeWidth={5} strokeLinecap="round" />
            </g>
          </g>
        </g>
      )}

      {/* Scientist on Left observing */}
      <ScientistRig
        x={220}
        y={740}
        scale={0.95}
        flip={false}
        pose={scientistPose}
        hasGlasses={true}
        hasMagnifier={true}
      />
    </g>
  );
};
