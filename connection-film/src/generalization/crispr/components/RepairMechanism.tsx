import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CRISPR_THEME } from '../types';

interface RepairMechanismProps {
  pathway?: 'nhej' | 'hdr';
  progress?: number; // 0 (cut open) to 1 (repaired/integrated)
  opacity?: number;
}

export const RepairMechanism: React.FC<RepairMechanismProps> = ({
  pathway = 'hdr',
  progress = 0,
  opacity = 1.0,
}) => {
  const isHdr = pathway === 'hdr';

  // Template entry for HDR
  const templateY = interpolate(progress, [0, 0.7, 1], [300, 500, 500], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const templateOpacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gap closure for NHEJ
  const gapWidth = interpolate(progress, [0, 0.8, 1], [140, 10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <g transform="translate(540, 500)" opacity={opacity} data-part="repair_mechanism">
      <defs>
        <filter id="donor-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {isHdr ? (
        /* HDR: Donor Template Insertion Pathway */
        <g>
          {/* Donor Template Strand Sliding In */}
          <g
            transform={`translate(0, ${templateY - 500})`}
            opacity={templateOpacity}
            filter="url(#donor-glow)"
          >
            <rect
              x="-240"
              y="-28"
              width="480"
              height="56"
              rx="16"
              fill={CRISPR_THEME.colors.donorTemplate}
              stroke="#FFFFFF"
              strokeWidth="4"
            />
            <text
              x="0"
              y="12"
              textAnchor="middle"
              fill="#0F172A"
              fontSize={32}
              fontWeight="900"
              style={{ fontSize: 32 }}
            >
              Exogenous Donor DNA Template
            </text>
          </g>

          {/* Homology Arms Indicators */}
          <g transform="translate(0, 80)">
            <rect
              x="-210"
              y="-22"
              width="420"
              height="44"
              rx="12"
              fill="rgba(59, 130, 246, 0.9)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x="0"
              y="9"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={30}
              fontWeight="bold"
              style={{ fontSize: 30 }}
            >
              Homology-Directed Repair (HDR)
            </text>
          </g>
        </g>
      ) : (
        /* NHEJ: Non-Homologous End Joining Pathway */
        <g>
          {/* Left Fragment */}
          <g transform={`translate(${-gapWidth / 2 - 120}, 0)`}>
            <rect
              x="-160"
              y="-24"
              width="160"
              height="48"
              rx="12"
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth="3"
            />
            <text
              x="-80"
              y="10"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={30}
              fontWeight="bold"
              style={{ fontSize: 30 }}
            >
              5' Arm
            </text>
          </g>

          {/* Right Fragment */}
          <g transform={`translate(${gapWidth / 2 + 120}, 0)`}>
            <rect
              x="0"
              y="-24"
              width="160"
              height="48"
              rx="12"
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth="3"
            />
            <text
              x="80"
              y="10"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={30}
              fontWeight="bold"
              style={{ fontSize: 30 }}
            >
              3' Arm
            </text>
          </g>

          {/* Indel Mutation Scar in the center */}
          {progress > 0.6 && (
            <g transform="translate(0, 0)">
              <rect
                x="-45"
                y="-26"
                width="90"
                height="52"
                rx="14"
                fill="#EF4444"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              <text
                x="0"
                y="10"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={30}
                fontWeight="900"
                style={{ fontSize: 30 }}
              >
                INDEL
              </text>
            </g>
          )}

          {/* NHEJ Pathway Label */}
          <g transform="translate(0, 90)">
            <rect
              x="-210"
              y="-22"
              width="420"
              height="44"
              rx="12"
              fill="rgba(239, 68, 68, 0.9)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x="0"
              y="9"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={30}
              fontWeight="bold"
              style={{ fontSize: 30 }}
            >
              NHEJ (Gene Knockout / Mất đoạn)
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
