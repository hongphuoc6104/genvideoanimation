import React from 'react';
import {
  CharacterRig,
  CharacterPose,
  IDLE_POSE,
} from '../../../.agents/skills/educational-flat-motion/kit';

export interface ScientistRigProps {
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  pose?: CharacterPose;
  hasGlasses?: boolean;
  hasMagnifier?: boolean;
}

const INK = '#111333';
const GOLD = '#ffd16c';
const CYAN = '#4ecdc4';

/**
 * SCIENTIST RIG COMPONENT
 * Enhanced academic character with spectacles, lab coat, and magnifying glass.
 * Powered by CharacterRig from motion-kit.
 */
export const ScientistRig: React.FC<ScientistRigProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  pose = IDLE_POSE,
  hasGlasses = true,
  hasMagnifier = false,
}) => {
  const { headAngle = 0, headY = 0 } = pose;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base Character Rig */}
      <CharacterRig
        scale={scale}
        flip={flip}
        color="#7bc8e8" // Scholarly cyan/blue feather tone
        accent={GOLD}
        pose={pose}
      />

      {/* Academic Glasses Attached to Head Coordinates */}
      {hasGlasses && (
        <g
          transform={`scale(${flip ? -scale : scale}, ${scale}) translate(0, ${headY}) translate(0, -42) rotate(${headAngle}) translate(0, 42)`}
          pointerEvents="none"
        >
          {/* Left Lens */}
          <circle cx={-30} cy={-48} r={22} fill="none" stroke={GOLD} strokeWidth={6} />
          {/* Right Lens */}
          <circle cx={30} cy={-48} r={22} fill="none" stroke={GOLD} strokeWidth={6} />
          {/* Bridge */}
          <line x1={-8} y1={-48} x2={8} y2={-48} stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
        </g>
      )}

      {/* Magnifying Glass Prop in Hand/Wing */}
      {hasMagnifier && (
        <g transform={`scale(${flip ? -scale : scale}, ${scale}) translate(65, 30) rotate(-25)`}>
          <circle cx={0} cy={0} r={28} fill="#ffffff" fillOpacity={0.25} stroke={INK} strokeWidth={7} />
          <line x1={20} y1={20} x2={50} y2={50} stroke={GOLD} strokeWidth={9} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
