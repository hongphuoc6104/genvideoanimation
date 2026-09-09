import React from 'react';
import {
  clamp,
  overshoot,
  squashStretch,
  stagger,
  IDLE_POSE,
  ANTICIPATE_SQUASH_POSE,
  blendPose,
  snappy,
  bouncy,
} from '../../../.agents/skills/educational-flat-motion/kit';
import { ScientistRig } from './ScientistRig';

export interface Act1Props {
  frame: number;
}

const PILLARS = [
  { letter: 'I', title: 'INTRODUCTION', desc: 'Tại sao?', color: '#4ecdc4', x: 540 },
  { letter: 'M', title: 'METHODS', desc: 'Làm thế nào?', color: '#ffd16c', x: 820 },
  { letter: 'R', title: 'RESULTS', desc: 'Tìm thấy gì?', color: '#ff6b78', x: 1100 },
  { letter: 'D', title: 'DISCUSSION', desc: 'Ý nghĩa là gì?', color: '#6fe0c2', x: 1380 },
];

export const Act1Structure: React.FC<Act1Props> = ({ frame }) => {
  // 1. Scientist Acting & Lightbulb
  let scientistPose = IDLE_POSE;
  let scientistX = 260;
  let scientistY = 720;
  let lightbulbScale = 0;

  if (frame < 50) {
    // Scratching head, confused by scattered papers
    scientistPose = {
      ...IDLE_POSE,
      bodyTilt: Math.sin(frame * 0.1) * 4,
      headAngle: -8 + Math.sin(frame * 0.08) * 6,
      eyeGazeX: 0.6,
      eyeGazeY: 0.3,
    };
  } else if (frame < 75) {
    // Anticipation crouch before realization
    const antT = (frame - 50) / 25;
    scientistPose = blendPose(IDLE_POSE, ANTICIPATE_SQUASH_POSE, antT, snappy);
  } else if (frame < 120) {
    // Realization! Lightbulb pops above head
    const popT = (frame - 75) / 20;
    lightbulbScale = overshoot(clamp(popT), 0.35, 4, 6);
    scientistPose = {
      ...IDLE_POSE,
      bodyY: -12,
      squash: 1.08,
      headAngle: 12,
      eyeGazeX: 0.2,
      eyeGazeY: -0.7, // Looks up at lightbulb
      beakOpen: 0.35,
      wingLeftAngle: -25,
      wingRightAngle: 25,
    };
  } else {
    // Stands proudly presenting the 4 IMRaD pillars
    const presT = clamp((frame - 120) / 30);
    scientistPose = {
      ...IDLE_POSE,
      headAngle: 4,
      eyeGazeX: 0.85,
      eyeGazeY: -0.1,
      wingRightAngle: -35 * presT, // Points toward pillars
    };
  }

  // Scattered chaotic paper sheets (fade out as pillars arrive)
  const chaosOpacity = 1 - clamp((frame - 110) / 30);

  return (
    <g data-act="act-1">
      {/* Title Banner */}
      <g opacity={clamp(frame / 20)}>
        <text
          x={960}
          y={130}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={44}
          fontWeight="800"
          fontFamily="sans-serif"
          letterSpacing={2}
        >
          CẤU TRÚC VÀNG: ĐỊNH DẠNG IMRaD
        </text>
        <text
          x={960}
          y={175}
          textAnchor="middle"
          fill="#ffd16c"
          fontSize={24}
          fontWeight="600"
          fontFamily="sans-serif"
          letterSpacing={1.5}
        >
          Chuẩn mực quốc tế cho hơn 85% bài báo khoa học đỉnh cao
        </text>
      </g>

      {/* Scattered Chaotic Data Papers */}
      {chaosOpacity > 0.01 && (
        <g opacity={chaosOpacity}>
          {Array.from({ length: 6 }).map((_, i) => {
            const rot = -20 + i * 14;
            const px = 460 + i * 160 + Math.sin(frame * 0.04 + i) * 15;
            const py = 640 + Math.cos(frame * 0.05 + i) * 20;
            return (
              <g key={`paper-${i}`} transform={`translate(${px}, ${py}) rotate(${rot})`}>
                <rect width={90} height={120} rx={6} fill="#ffffff" stroke="#111333" strokeWidth={4} />
                <line x1={15} y1={25} x2={75} y2={25} stroke="#8c9bb0" strokeWidth={4} strokeLinecap="round" />
                <line x1={15} y1={45} x2={65} y2={45} stroke="#8c9bb0" strokeWidth={4} strokeLinecap="round" />
                <line x1={15} y1={65} x2={70} y2={65} stroke="#ff6b78" strokeWidth={4} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      )}

      {/* Lightbulb Idea Graphic */}
      {lightbulbScale > 0.01 && (
        <g transform={`translate(${scientistX}, ${scientistY - 170}) scale(${lightbulbScale})`}>
          <circle r={32} fill="#ffd16c" filter="drop-shadow(0px 0px 16px #ffd16c)" />
          <path d="M-12 18 L12 18 L8 28 L-8 28 Z" fill="#ffffff" />
          <path d="M-10 -5 Q0 -20 10 -5" fill="none" stroke="#111333" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}

      {/* Scientist Character */}
      <ScientistRig
        x={scientistX}
        y={scientistY}
        scale={1.05}
        flip={false}
        pose={scientistPose}
        hasGlasses={true}
        hasMagnifier={true}
      />

      {/* 4 IMRaD PILLARS: Dropping with Physical Impact & Settle */}
      <g>
        {PILLARS.map((p, idx) => {
          const dropStart = stagger(idx, 100, 16);
          const dropT = clamp((frame - dropStart) / 24);
          if (dropT <= 0) return null;

          // Drop from top (-500) to floor (720) with overshoot & squash
          const startY = -400;
          const targetY = 720;
          const currentY = startY + (targetY - startY) * overshoot(dropT, 0.18, 3, 5);

          // Impact squash on touchdown (scaleY drops then settles)
          let colSquashY = 1.0;
          if (dropT > 0.7 && dropT < 1.0) {
            colSquashY = 0.88 + Math.sin((dropT - 0.7) / 0.3 * Math.PI) * 0.12;
          }
          const { scaleX: colSquashX, scaleY: sqY } = squashStretch(colSquashY);

          // Highlight active pillar "I" near end of Act 1
          const isHighlighted = idx === 0 && frame > 240;
          const pulseGlow = isHighlighted ? 1 + Math.sin(frame * 0.2) * 0.06 : 1;

          return (
            <g
              key={`pillar-${p.letter}`}
              transform={`translate(${p.x}, ${currentY}) scale(${colSquashX * pulseGlow}, ${sqY * pulseGlow}) translate(0, -180)`}
            >
              {/* Floor Shadow */}
              <ellipse cx={0} cy={195} rx={110} ry={16} fill="#0d0a24" opacity={0.35} />

              {/* Pillar Body */}
              <rect
                x={-105}
                y={-180}
                width={210}
                height={360}
                rx={18}
                fill={p.color}
                stroke="#111333"
                strokeWidth={8}
              />

              {/* Giant Capital Letter */}
              <text
                x={0}
                y={-40}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={108}
                fontWeight="900"
                fontFamily="sans-serif"
                stroke="#111333"
                strokeWidth={4}
              >
                {p.letter}
              </text>

              {/* Title & Question */}
              <rect x={-90} y={15} width={180} height={38} rx={10} fill="#111333" opacity={0.25} />
              <text
                x={0}
                y={41}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={20}
                fontWeight="800"
                fontFamily="sans-serif"
                letterSpacing={1.2}
              >
                {p.title}
              </text>
              <text
                x={0}
                y={95}
                textAnchor="middle"
                fill="#111333"
                fontSize={22}
                fontWeight="700"
                fontFamily="sans-serif"
              >
                {p.desc}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
};
