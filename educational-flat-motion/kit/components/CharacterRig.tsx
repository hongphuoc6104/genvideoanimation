import React from 'react';
import { CharacterPose, IDLE_POSE } from '../pose-blending';
import { squashStretch } from '../motion-primitives';

export interface CharacterRigProps {
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  color?: string;
  accent?: string;
  pose?: CharacterPose;
}

const INK = '#111333';
const GOLD = '#ffd16c';
const CORAL = '#ff6b78';
const MINT = '#6fe0c2';

const inkStroke = {
  stroke: INK,
  strokeWidth: 6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * GENERIC ARTICULATED CHARACTER RIG
 * True hierarchical character rig with independent pivot points:
 * Root -> Torso (volume squash) -> Head (lag & tilt) -> Eyes (gaze tracking) -> Wings -> Legs.
 */
export const CharacterRig: React.FC<CharacterRigProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  color = '#f6ae4f',
  accent = GOLD,
  pose = IDLE_POSE,
}) => {
  const {
    bodyY = 0,
    bodyTilt = 0,
    squash = 1.0,
    headAngle = 0,
    headY = 0,
    eyeGazeX = 0,
    eyeGazeY = 0,
    eyeScale = 1.0,
    blink = false,
    wingLeftAngle = 0,
    wingRightAngle = 0,
    wingLeftFold = 0.8,
    wingRightFold = 0.8,
    legBend = 0,
    legLeftAngle = 0,
    legRightAngle = 0,
    beakOpen = 0,
    beakTilt = 0,
    tailAngle = 0,
  } = pose;

  // Volume-conserving squash calculation
  const { scaleX: squashX, scaleY: squashY } = squashStretch(squash);

  // Pupil offsets (clamped inside eye)
  const pupilOffsetX = eyeGazeX * 6;
  const pupilOffsetY = eyeGazeY * 5;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}
      data-character-rig="true"
    >
      {/* Ground Contact Shadow - squashes horizontally as character crouches */}
      <ellipse
        cx="0"
        cy="128"
        rx={65 * (1 + (1 - squash) * 1.2)}
        ry={10 * (1 + (1 - squash) * 0.8)}
        fill={INK}
        opacity={0.22}
      />

      {/* 1. TORSO HIERARCHY (Pivots at base hips: 0, 70) */}
      <g
        transform={`translate(0, ${bodyY}) translate(0, 70) scale(${squashX}, ${squashY}) rotate(${bodyTilt}) translate(0, -70)`}
        data-part="torso"
      >
        {/* Tail (Pivot at 45, 40) */}
        <g transform={`translate(45, 40) rotate(${tailAngle}) translate(-45, -40)`} data-part="tail">
          <path
            d="M50 35 C85 40 102 58 96 76 C88 88 68 82 50 65 Z"
            fill={CORAL}
            {...inkStroke}
          />
          <path d="M58 42 C78 48 85 58 80 66" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Torso Body Base */}
        <ellipse cx="0" cy="20" rx="72" ry="84" fill={color} {...inkStroke} />
        <ellipse cx="0" cy="36" rx="46" ry="58" fill={accent} opacity={0.75} />

        {/* Left Wing (Back wing, Pivot at -38, -10) */}
        <g
          transform={`translate(-38, -10) rotate(${wingLeftAngle}) scale(${1 - wingLeftFold * 0.4}, ${1 - wingLeftFold * 0.2}) translate(38, 10)`}
          data-part="wing-left"
        >
          <path
            d="M-40 -12 C-80 -25 -100 -55 -80 -75 C-60 -92 -35 -70 -20 -40 Z"
            fill={color}
            {...inkStroke}
          />
          <path d="M-55 -22 C-70 -40 -75 -58 -65 -65" fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* 2. HEAD HIERARCHY (Pivot at neck root: 0, -42) */}
        <g
          transform={`translate(0, ${headY}) translate(0, -42) rotate(${headAngle}) translate(0, 42)`}
          data-part="head"
        >
          {/* Head Base Silhouette */}
          <path
            d="M-34 -85 C-28 -108 -10 -108 -2 -92 C8 -114 26 -106 26 -85 C44 -95 58 -76 46 -62 C62 -54 58 -32 40 -24 C22 -15 -22 -15 -40 -27 C-58 -38 -58 -62 -42 -70 C-50 -80 -42 -92 -34 -85 Z"
            fill={color}
            {...inkStroke}
          />
          {/* Crest Highlight */}
          <path d="M-36 -78 C-25 -85 -18 -88 -8 -86" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" opacity="0.7" />

          {/* Cheeks */}
          <ellipse cx="-40" cy="-26" rx="11" ry="7" fill={CORAL} opacity={0.65} />
          <ellipse cx="40" cy="-26" rx="11" ry="7" fill={CORAL} opacity={0.65} />

          {/* 3. FACE & EYES (Independent gaze tracking) */}
          <g transform={`scale(${eyeScale})`} data-part="eyes">
            {blink ? (
              <>
                {/* Closed Eye Arcs */}
                <path d="M-42 -48 Q-30 -42 -18 -48" fill="none" {...inkStroke} />
                <path d="M18 -48 Q30 -42 42 -48" fill="none" {...inkStroke} />
              </>
            ) : (
              <>
                {/* Eye Sockets */}
                <circle cx="-30" cy="-48" r="16" fill="#fff7ef" {...inkStroke} />
                <circle cx="30" cy="-48" r="16" fill="#fff7ef" {...inkStroke} />

                {/* Pupils with Gaze Target Translation */}
                <circle cx={-30 + pupilOffsetX} cy={-48 + pupilOffsetY} r="8" fill={INK} />
                <circle cx={30 + pupilOffsetX} cy={-48 + pupilOffsetY} r="8" fill={INK} />

                {/* Catchlight */}
                <circle cx={-27 + pupilOffsetX} cy={-51 + pupilOffsetY} r="3" fill="#fff7ef" />
                <circle cx={33 + pupilOffsetX} cy={-51 + pupilOffsetY} r="3" fill="#fff7ef" />
              </>
            )}
          </g>

          {/* Beak with Open/Tilt transform (Pivot at 0, -22) */}
          <g transform={`translate(0, -22) rotate(${beakTilt}) translate(0, 22)`} data-part="beak">
            <path
              d={`M-12 -24 L12 -24 L0 ${-6 + beakOpen * 14} Z`}
              fill={CORAL}
              {...inkStroke}
            />
          </g>
        </g>

        {/* Right Wing (Fore wing, Pivot at 42, 10) */}
        <g
          transform={`translate(42, 10) rotate(${wingRightAngle}) scale(${1 - wingRightFold * 0.4}, ${1 - wingRightFold * 0.2}) translate(-42, -10)`}
          data-part="wing-right"
        >
          <path
            d="M45 10 C80 16 94 48 76 68 C62 82 42 66 32 46 Z"
            fill={color}
            {...inkStroke}
          />
          <path d="M54 22 C68 32 72 44 65 52" fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round" />
        </g>
      </g>

      {/* 4. LEGS HIERARCHY (Pivots at hips: -24, 75 and 24, 75) */}
      <g data-part="legs">
        {/* Left Leg */}
        <g transform={`translate(-24, 75) rotate(${legLeftAngle}) translate(24, -75)`}>
          <path
            d={`M-24 75 L-26 ${98 - legBend * 18} L-28 ${118 - legBend * 24}`}
            fill="none"
            {...inkStroke}
          />
          {/* Foot Claws */}
          <path
            d={`M-40 ${122 - legBend * 24} L-28 ${118 - legBend * 24} L-16 ${122 - legBend * 24}`}
            fill="none"
            stroke={accent}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* Right Leg */}
        <g transform={`translate(24, 75) rotate(${legRightAngle}) translate(-24, -75)`}>
          <path
            d={`M24 75 L26 ${98 - legBend * 18} L28 ${118 - legBend * 24}`}
            fill="none"
            {...inkStroke}
          />
          {/* Foot Claws */}
          <path
            d={`M16 ${122 - legBend * 24} L28 ${118 - legBend * 24} L40 ${122 - legBend * 24}`}
            fill="none"
            stroke={accent}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  );
};
