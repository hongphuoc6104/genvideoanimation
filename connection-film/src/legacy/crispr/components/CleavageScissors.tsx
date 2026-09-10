import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CRISPR_THEME } from '../types';

interface CleavageScissorsProps {
  x?: number;
  y?: number;
  cutProgress?: number; // 0 (open/above) to 1 (closed/snipped)
  opacity?: number;
}

export const CleavageScissors: React.FC<CleavageScissorsProps> = ({
  x = 510,
  y = 480,
  cutProgress = 0,
  opacity = 1.0,
}) => {
  // Scissors blade rotation angle
  const angle = interpolate(cutProgress, [0, 0.7, 1], [35, 0, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sparkScale = interpolate(cutProgress, [0.6, 0.85, 1], [0, 1.4, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity} data-part="cleavage_scissors">
      <defs>
        <filter id="scissors-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Top Blade (HNH Domain) */}
      <g transform={`rotate(${angle})`}>
        <path
          d="M -70 -12 L 50 -3 L 90 -22 L 50 -8 L -70 -4 Z"
          fill="#EC4899"
          stroke="#F472B6"
          strokeWidth="3"
          filter="url(#scissors-glow)"
        />
        {/* Handle loop */}
        <circle cx="-85" cy="-14" r="16" fill="none" stroke="#EC4899" strokeWidth="6" />
      </g>

      {/* Bottom Blade (RuvC Domain) */}
      <g transform={`rotate(${-angle})`}>
        <path
          d="M -70 12 L 50 3 L 90 22 L 50 8 L -70 4 Z"
          fill="#8B5CF6"
          stroke="#A78BFA"
          strokeWidth="3"
          filter="url(#scissors-glow)"
        />
        {/* Handle loop */}
        <circle cx="-85" cy="14" r="16" fill="none" stroke="#8B5CF6" strokeWidth="6" />
      </g>

      {/* Center Pivot Screw */}
      <circle cx="0" cy="0" r="8" fill="#F8FAFC" stroke="#0F172A" strokeWidth="3" />

      {/* Cleavage Spark Energy burst */}
      {cutProgress > 0.6 && (
        <g transform={`scale(${sparkScale})`}>
          <circle cx="55" cy="0" r="28" fill="#EF4444" opacity="0.6" />
          <path
            d="M 55 -35 L 60 -10 L 85 0 L 60 10 L 55 35 L 50 10 L 25 0 L 50 -10 Z"
            fill="#FBBF24"
          />
        </g>
      )}

      {/* 3bp upstream badge */}
      <g transform="translate(0, -90)">
        <rect
          x="-95"
          y="-20"
          width="190"
          height="40"
          rx="10"
          fill="rgba(239, 68, 68, 0.92)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={30}
          fontWeight="bold"
          style={{ fontSize: 30 }}
        >
          Cut: 3-bp Upstream
        </text>
      </g>
    </g>
  );
};
