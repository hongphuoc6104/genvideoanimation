import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CRISPR_THEME } from '../types';

interface GuideRnaStrandProps {
  startX?: number;
  startY?: number;
  hybridizeProgress?: number; // 0 (unbound/above) to 1 (hybridized with target DNA)
  opacity?: number;
}

const GUIDE_BASES = ['U', 'C', 'C', 'G', 'U', 'A', 'U', 'G', 'G', 'C'];

export const GuideRnaStrand: React.FC<GuideRnaStrandProps> = ({
  startX = 320,
  startY = 430,
  hybridizeProgress = 0,
  opacity = 1.0,
}) => {
  const frame = useCurrentFrame();

  // Floating bounce before hybridization
  const floatY = Math.sin(frame * 0.08) * 6;

  // Hybridization target position
  const currentY = interpolate(hybridizeProgress, [0, 1], [startY - 90 + floatY, startY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stepX = 48;

  return (
    <g transform={`translate(${startX}, ${currentY})`} opacity={opacity} data-part="sgrna_strand">
      <defs>
        <filter id="sgrna-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Guide RNA Phosphate Backbone */}
      <path
        d={`M 0 0 Q 240 -35 480 0 Q 530 15 560 -40 Q 580 -70 560 -100 Q 530 -120 510 -90 Q 500 -50 530 -20`}
        fill="none"
        stroke={CRISPR_THEME.colors.sgrna}
        strokeWidth="8"
        strokeLinecap="round"
        filter="url(#sgrna-glow)"
      />

      {/* Guide RNA Base Nodes */}
      {GUIDE_BASES.map((base, idx) => {
        const x = idx * stepX + 24;
        const y = Math.sin(idx * 0.4) * 8;
        return (
          <g key={`rna-base-${idx}`} transform={`translate(${x}, ${y})`}>
            <circle
              cx="0"
              cy="0"
              r="14"
              fill={CRISPR_THEME.colors.sgrna}
              stroke="#0F172A"
              strokeWidth="2.5"
            />
            <text
              x="0"
              y="-20"
              textAnchor="middle"
              fill="#22C55E"
              fontSize={30}
              fontWeight="bold"
              style={{ fontSize: 30 }}
            >
              {base}
            </text>

            {/* Hybridization matching teeth connecting downward if hybridizing */}
            {hybridizeProgress > 0.3 && (
              <line
                x1="0"
                y1="14"
                x2="0"
                y2={14 + hybridizeProgress * 30}
                stroke="#22C55E"
                strokeWidth="3"
                strokeDasharray="3 3"
              />
            )}
          </g>
        );
      })}

      {/* Hairpin Scaffold Tag */}
      <g transform="translate(560, -110)">
        <rect
          x="-90"
          y="-22"
          width="180"
          height="44"
          rx="12"
          fill="rgba(34, 197, 94, 0.9)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fill="#0F172A"
          fontSize={30}
          fontWeight="900"
          style={{ fontSize: 30 }}
        >
          sgRNA Scaffold
        </text>
      </g>
    </g>
  );
};
