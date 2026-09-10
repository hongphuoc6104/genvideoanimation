/**
 * RepairMechanism.tsx
 * Visual representation of DNA double-strand break repair pathways:
 * 1. NHEJ (Non-Homologous End Joining): Physical gap closure with zero void at progress=1,
 *    indel mutation scar seamlessly fusing the free ends.
 * 2. HDR (Homology-Directed Repair): Exogenous donor template descending and precisely
 *    integrating into the host DNA double-strand break between homologous flanking arms.
 */

import React from 'react';
import { interpolate } from 'remotion';
import { CRISPR_THEME } from '../types';

interface RepairMechanismProps {
  pathway: 'nhej' | 'hdr';
  progress: number; // 0 to 1
  opacity?: number;
}

export interface RepairState {
  gapWidth: number;
  scarWidth: number;
  halfScar: number;
  templateY: number;
  templateOpacity: number;
  ligationGlow: number;
  leftArmRight: number;
  rightArmLeft: number;
}

export function calculateRepairState(progress: number, pathway: 'nhej' | 'hdr'): RepairState {
  const gapWidth = interpolate(progress, [0, 0.7, 1], [180, 20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scarWidth = interpolate(progress, [0.5, 0.85, 1], [0, 60, 80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const halfScar = scarWidth / 2;

  const templateY = interpolate(progress, [0, 0.75, 1], [-180, 0, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const templateOpacity = interpolate(progress, [0, 0.25, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ligationGlow = interpolate(progress, [0.75, 0.9, 1], [0, 1, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leftArmRight = -(halfScar + gapWidth / 2);
  const rightArmLeft = halfScar + gapWidth / 2;

  return {
    gapWidth,
    scarWidth,
    halfScar,
    templateY,
    templateOpacity,
    ligationGlow,
    leftArmRight,
    rightArmLeft,
  };
}

export const RepairMechanism: React.FC<RepairMechanismProps> = ({
  pathway,
  progress,
  opacity = 1,
}) => {
  const isHdr = pathway === 'hdr';
  const {
    gapWidth,
    scarWidth,
    halfScar,
    templateY,
    templateOpacity,
    ligationGlow,
    leftArmRight,
    rightArmLeft,
  } = calculateRepairState(progress, pathway);

  // Render decorative base pair rungs inside DNA arms
  const renderDnaRungs = (startX: number, endX: number, step: number = 32) => {
    const rungs = [];
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    for (let x = minX + 16; x < maxX - 8; x += step) {
      rungs.push(
        <line
          key={`rung-${x}`}
          x1={x}
          y1={-18}
          x2={x}
          y2={18}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth={3}
          strokeDasharray="3 3"
        />
      );
    }
    return rungs;
  };

  return (
    <g transform="translate(540, 500)" opacity={opacity} data-part="repair_mechanism">
      <defs>
        <filter id="repair-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="hostDnaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="donorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {isHdr ? (
        /* ==================== HDR PATHWAY ==================== */
        <g id="hdr-repair">
          {/* Host Genomic DNA Strands Flanking DSB */}
          {/* Left Genomic Arm: [-380, -120] */}
          <g id="host-left-arm">
            <rect
              x="-380"
              y="-28"
              width={260}
              height={56}
              rx="12"
              fill="url(#hostDnaGrad)"
              stroke="#60A5FA"
              strokeWidth="3"
            />
            {renderDnaRungs(-380, -120)}
            <text x="-250" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
              5' Homology Arm
            </text>
          </g>

          {/* Right Genomic Arm: [+120, +380] */}
          <g id="host-right-arm">
            <rect
              x="120"
              y="-28"
              width={260}
              height={56}
              rx="12"
              fill="url(#hostDnaGrad)"
              stroke="#60A5FA"
              strokeWidth="3"
            />
            {renderDnaRungs(120, 380)}
            <text x="250" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
              3' Homology Arm
            </text>
          </g>

          {/* Genomic Break Opening Indicator */}
          {progress < 0.7 && (
            <g id="break-void">
              <line x1="-120" y1="-30" x2="-120" y2="30" stroke="#EF4444" strokeWidth="4" strokeDasharray="6 4" />
              <line x1="120" y1="-30" x2="120" y2="30" stroke="#EF4444" strokeWidth="4" strokeDasharray="6 4" />
              <text x="0" y="8" textAnchor="middle" fill="#F87171" fontSize={30} fontWeight="bold">
                Vị trí cắt DSB
              </text>
            </g>
          )}

          {/* Exogenous Donor Template Descending and Integrating */}
          <g transform={`translate(0, ${templateY})`} opacity={templateOpacity} filter="url(#repair-glow)">
            {/* Donor Template Body: width 240, exactly filling [-120, 120] at integration */}
            <rect
              x="-120"
              y="-28"
              width="240"
              height="56"
              rx="12"
              fill="url(#donorGrad)"
              stroke="#A7F3D0"
              strokeWidth="4"
            />
            {renderDnaRungs(-120, 120)}
            <text x="0" y="8" textAnchor="middle" fill="#064E3B" fontSize={30} fontWeight="900">
              Đoạn mẫu Donor (HDR)
            </text>
          </g>

          {/* Ligation Seams at x = -120 and x = +120 when integrated */}
          {progress > 0.7 && (
            <g id="hdr-ligation-seams" opacity={ligationGlow}>
              <circle cx="-120" cy="0" r="16" fill="#F59E0B" />
              <circle cx="120" cy="0" r="16" fill="#F59E0B" />
              <line x1="-120" y1="-35" x2="-120" y2="35" stroke="#FDE68A" strokeWidth="6" />
              <line x1="120" y1="-35" x2="120" y2="35" stroke="#FDE68A" strokeWidth="6" />
            </g>
          )}

          {/* HDR Descriptive Label */}
          <g transform="translate(0, 100)">
            <rect
              x="-270"
              y="-26"
              width="540"
              height="52"
              rx="12"
              fill="rgba(5, 150, 105, 0.9)"
              stroke="#A7F3D0"
              strokeWidth="2"
            />
            <text x="0" y="9" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
              {progress >= 1
                ? 'HDR: Tái tổ hợp chính xác theo mẫu donor'
                : 'HDR: Chèn đoạn mẫu ngoại sinh vào DSB'}
            </text>
          </g>
        </g>
      ) : (
        /* ==================== NHEJ PATHWAY ==================== */
        <g id="nhej-repair">
          {/*
            Strict Geometric Invariant:
            Left Arm right edge = -(halfScar + gapWidth / 2)
            Right Arm left edge = +(halfScar + gapWidth / 2)
            At progress = 1: gapWidth = 0, so:
            Left Arm ends at -halfScar, Right Arm starts at +halfScar.
            Indel Scar spans [-halfScar, +halfScar].
            TOTAL CONTINUITY WITH ZERO VOID / ZERO GAP!
          */}

          {/* Left Fragment */}
          {(() => {
            const leftArmRight = -(halfScar + gapWidth / 2);
            const leftArmLeft = -380;
            const width = Math.max(10, leftArmRight - leftArmLeft);
            return (
              <g id="nhej-left-fragment">
                <rect
                  x={leftArmLeft}
                  y="-26"
                  width={width}
                  height="52"
                  rx="10"
                  fill="url(#hostDnaGrad)"
                  stroke="#3B82F6"
                  strokeWidth="3"
                />
                {renderDnaRungs(leftArmLeft, leftArmRight)}
                <text x="-260" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
                  Đầu 5' tự do
                </text>
              </g>
            );
          })()}

          {/* Right Fragment */}
          {(() => {
            const rightArmLeft = halfScar + gapWidth / 2;
            const rightArmRight = 380;
            const width = Math.max(10, rightArmRight - rightArmLeft);
            return (
              <g id="nhej-right-fragment">
                <rect
                  x={rightArmLeft}
                  y="-26"
                  width={width}
                  height="52"
                  rx="10"
                  fill="url(#hostDnaGrad)"
                  stroke="#3B82F6"
                  strokeWidth="3"
                />
                {renderDnaRungs(rightArmLeft, rightArmRight)}
                <text x="260" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
                  Đầu 3' tự do
                </text>
              </g>
            );
          })()}

          {/* Indel Mutation Scar in the Center */}
          {scarWidth > 0 && (
            <g id="indel-mutation-scar" filter="url(#repair-glow)">
              <rect
                x={-halfScar}
                y="-28"
                width={scarWidth}
                height="56"
                rx="8"
                fill="#EF4444"
                stroke="#FCA5A5"
                strokeWidth="3"
              />
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="900">
                INDEL
              </text>
            </g>
          )}

          {/* Ligation Seam Glow when gap reaches 0 */}
          {gapWidth < 5 && (
            <g id="nhej-ligation-weld" opacity={ligationGlow}>
              <circle cx={-halfScar} cy="0" r="12" fill="#F59E0B" />
              <circle cx={halfScar} cy="0" r="12" fill="#F59E0B" />
            </g>
          )}

          {/* NHEJ Pathway Label */}
          <g transform="translate(0, 100)">
            <rect
              x="-270"
              y="-26"
              width="540"
              height="52"
              rx="12"
              fill="rgba(220, 38, 38, 0.9)"
              stroke="#FCA5A5"
              strokeWidth="2"
            />
            <text x="0" y="9" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
              {progress >= 1
                ? 'NHEJ: Hai đầu nối khít, thường sinh đột biến Indel'
                : 'NHEJ: Nối trực tiếp hai đầu đứt gãy'}
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
