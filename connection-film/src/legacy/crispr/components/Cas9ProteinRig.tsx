import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CRISPR_THEME } from '../types';

interface Cas9ProteinRigProps {
  frame?: number;
  x?: number;
  y?: number;
  clampProgress?: number; // 0 (open/floating) to 1 (tightly clamped around DNA)
  showCatalyticDomains?: boolean;
  activeDomain?: 'none' | 'hnh' | 'ruvc' | 'both';
  opacity?: number;
  scale?: number;
}

export const Cas9ProteinRig: React.FC<Cas9ProteinRigProps> = ({
  x = 540,
  y = 500,
  clampProgress = 0,
  showCatalyticDomains = true,
  activeDomain = 'both',
  opacity = 1.0,
  scale = 1.0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gentle floating oscillation
  const floatOffset = Math.sin(frame * 0.06) * 8;

  // Lobe clamping displacement
  const clampGap = interpolate(clampProgress, [0, 1], [45, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hnhActive = activeDomain === 'hnh' || activeDomain === 'both';
  const ruvcActive = activeDomain === 'ruvc' || activeDomain === 'both';

  return (
    <g
      transform={`translate(${x}, ${y + floatOffset}) scale(${scale})`}
      opacity={opacity}
      data-part="cas9_complex"
    >
      <defs>
        <filter id="cas9-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="rec-lobe-grad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="60%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </radialGradient>
        <radialGradient id="nuc-lobe-grad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="70%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </radialGradient>
      </defs>

      {/* REC Lobe (Recognition Lobe - Top) */}
      <g transform={`translate(0, ${-clampGap})`}>
        <path
          d="M -180 -80 C -180 -180, -60 -210, 0 -210 C 80 -210, 180 -170, 190 -70 C 200 20, 130 50, 60 40 C 0 30, -80 30, -130 10 C -170 -10, -180 -40, -180 -80 Z"
          fill="url(#rec-lobe-grad)"
          stroke="#4338CA"
          strokeWidth="6"
          opacity="0.94"
          filter="url(#cas9-glow)"
        />
        <text
          x="0"
          y="-110"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={34}
          fontWeight="900"
          style={{ fontSize: 34 }}
        >
          REC Lobe
        </text>
      </g>

      {/* NUC Lobe (Nuclease Lobe - Bottom) */}
      <g transform={`translate(0, ${clampGap})`}>
        <path
          d="M -170 60 C -170 -10, -90 10, 0 10 C 90 10, 170 -10, 180 70 C 190 150, 120 210, 0 210 C -110 210, -170 150, -170 60 Z"
          fill="url(#nuc-lobe-grad)"
          stroke="#3730A3"
          strokeWidth="6"
          opacity="0.94"
          filter="url(#cas9-glow)"
        />

        {/* Catalytic Domains: HNH (Cuts target strand) */}
        {showCatalyticDomains && (
          <g transform="translate(-75, 95)">
            <rect
              x="-55"
              y="-35"
              width="110"
              height="70"
              rx="18"
              fill={hnhActive ? '#A855F7' : 'rgba(168, 85, 247, 0.4)'}
              stroke="#FFFFFF"
              strokeWidth="4"
            />
            <text
              x="0"
              y="10"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={32}
              fontWeight="900"
              style={{ fontSize: 32 }}
            >
              HNH
            </text>
          </g>
        )}

        {/* Catalytic Domains: RuvC (Cuts non-target strand) */}
        {showCatalyticDomains && (
          <g transform="translate(75, 95)">
            <rect
              x="-55"
              y="-35"
              width="110"
              height="70"
              rx="18"
              fill={ruvcActive ? '#EC4899' : 'rgba(236, 72, 153, 0.4)'}
              stroke="#FFFFFF"
              strokeWidth="4"
            />
            <text
              x="0"
              y="10"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={32}
              fontWeight="900"
              style={{ fontSize: 32 }}
            >
              RuvC
            </text>
          </g>
        )}
      </g>

      {/* Center Label */}
      <g transform="translate(0, 0)">
        <rect
          x="-100"
          y="-24"
          width="200"
          height="48"
          rx="12"
          fill="rgba(15, 23, 42, 0.85)"
          stroke="#6366F1"
          strokeWidth="2"
        />
        <text
          x="0"
          y="10"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={30}
          fontWeight="bold"
          style={{ fontSize: 30 }}
        >
          Cas9 Enzyme
        </text>
      </g>
    </g>
  );
};
