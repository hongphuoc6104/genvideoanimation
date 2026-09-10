import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CRISPR_THEME, BasePair } from '../types';

interface DnaDoubleHelixProps {
  basePairs?: BasePair[];
  unwindProgress?: number; // 0 (fully wound) to 1 (unwound at target)
  cleavageProgress?: number; // 0 (intact) to 1 (double-strand break separated)
  repairProgress?: number; // 0 (broken) to 1 (repaired)
  repairType?: 'none' | 'nhej' | 'hdr';
  highlightPam?: boolean;
  highlightTarget?: boolean;
  showLabels?: boolean;
  scale?: number;
  yOffset?: number;
}

const DEFAULT_BASE_PAIRS: BasePair[] = [
  { index: 0, base1: 'A', base2: 'T' },
  { index: 1, base1: 'G', base2: 'C' },
  { index: 2, base1: 'C', base2: 'G' },
  { index: 3, base1: 'T', base2: 'A' },
  { index: 4, base1: 'A', base2: 'T', isTarget: true },
  { index: 5, base1: 'G', base2: 'C', isTarget: true },
  { index: 6, base1: 'G', base2: 'C', isTarget: true, isCut: true },
  { index: 7, base1: 'C', base2: 'G', isTarget: true },
  { index: 8, base1: 'T', base2: 'A', isTarget: true },
  { index: 9, base1: 'G', base2: 'C', isPam: true },
  { index: 10, base1: 'G', base2: 'C', isPam: true },
  { index: 11, base1: 'A', base2: 'T' },
  { index: 12, base1: 'C', base2: 'G' },
  { index: 13, base1: 'T', base2: 'A' },
];

export const DnaDoubleHelix: React.FC<DnaDoubleHelixProps> = ({
  basePairs = DEFAULT_BASE_PAIRS,
  unwindProgress = 0,
  cleavageProgress = 0,
  repairProgress = 0,
  repairType = 'none',
  highlightPam = false,
  highlightTarget = false,
  showLabels = true,
  scale = 1.0,
  yOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle natural continuous rotation / breathing
  const rotationPhase = (frame * 0.04) % (Math.PI * 2);

  const strandWidth = 840;
  const numPairs = basePairs.length;
  const stepX = strandWidth / (numPairs - 1);
  const startX = 120;
  const centerY = 500 + yOffset;
  const amplitude = 95;

  // Compute strand coordinate paths
  const strand1Points: Array<{ x: number; y: number }> = [];
  const strand2Points: Array<{ x: number; y: number }> = [];

  basePairs.forEach((bp, i) => {
    const x = startX + i * stepX;
    const angle = (i * 0.55) + rotationPhase;
    
    // Normal vertical oscillation
    let dy1 = Math.sin(angle) * amplitude;
    let dy2 = -Math.sin(angle) * amplitude;

    // Unwinding effect at target region (indices 4 to 8)
    if (unwindProgress > 0 && i >= 4 && i <= 8) {
      const unwindFactor = unwindProgress * Math.sin(((i - 4) / 4) * Math.PI);
      dy1 = dy1 - unwindFactor * 80;
      dy2 = dy2 + unwindFactor * 95;
    }

    // Cleavage separation: split at cut point (between index 6 and 7)
    if (cleavageProgress > 0 && i >= 7) {
      const shiftX = cleavageProgress * 65;
      const shiftY = (i % 2 === 0 ? 1 : -1) * cleavageProgress * 25;
      strand1Points.push({ x: x + shiftX, y: centerY + dy1 + shiftY });
      strand2Points.push({ x: x + shiftX, y: centerY + dy2 - shiftY });
    } else {
      strand1Points.push({ x, y: centerY + dy1 });
      strand2Points.push({ x, y: centerY + dy2 });
    }
  });

  const getBaseColor = (base: string) => {
    switch (base) {
      case 'A': return CRISPR_THEME.colors.adenine;
      case 'T': return CRISPR_THEME.colors.thymine;
      case 'G': return CRISPR_THEME.colors.guanine;
      case 'C': return CRISPR_THEME.colors.cytosine;
      default: return '#94A3B8';
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <svg
        width="1080"
        height="1000"
        viewBox="0 0 1080 1000"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="strand1-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="strand2-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#A5B4FC" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>

        {/* Base-pair Rungs (Hydrogen Bonds) */}
        {basePairs.map((bp, i) => {
          const p1 = strand1Points[i];
          const p2 = strand2Points[i];
          if (!p1 || !p2) return null;

          const isCutPoint = bp.isCut && cleavageProgress > 0.4;
          const isTargetBeat = bp.isTarget && highlightTarget;
          const isPamBeat = bp.isPam && highlightPam;

          return (
            <g key={`rung-${i}`}>
              {/* Hydrogen bond rung line */}
              {!isCutPoint && (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={
                    isPamBeat
                      ? '#F59E0B'
                      : isTargetBeat
                      ? '#22C55E'
                      : 'rgba(255, 255, 255, 0.28)'
                  }
                  strokeWidth={isPamBeat || isTargetBeat ? 6 : 3}
                  strokeDasharray={unwindProgress > 0.5 && bp.isTarget ? '4 4' : 'none'}
                />
              )}

              {/* Base 1 Node (Strand 1) */}
              <circle
                cx={p1.x}
                cy={p1.y}
                r={isPamBeat || isTargetBeat ? 16 : 12}
                fill={getBaseColor(bp.base1)}
                stroke="#0F172A"
                strokeWidth={3}
                filter={isPamBeat || isTargetBeat ? 'url(#glow-filter)' : undefined}
              />

              {/* Base 2 Node (Strand 2) */}
              <circle
                cx={p2.x}
                cy={p2.y}
                r={isPamBeat || isTargetBeat ? 16 : 12}
                fill={getBaseColor(bp.base2)}
                stroke="#0F172A"
                strokeWidth={3}
                filter={isPamBeat || isTargetBeat ? 'url(#glow-filter)' : undefined}
              />

              {/* Base letters if highlighted or zoomed */}
              {(isPamBeat || isTargetBeat || showLabels) && (
                <>
                  <text
                    x={p1.x}
                    y={p1.y - 22}
                    textAnchor="middle"
                    fill={isPamBeat ? '#F59E0B' : '#FFFFFF'}
                    fontSize={30}
                    fontWeight="bold"
                    style={{ fontSize: 30 }}
                  >
                    {bp.base1}
                  </text>
                  <text
                    x={p2.x}
                    y={p2.y + 36}
                    textAnchor="middle"
                    fill={isPamBeat ? '#F59E0B' : '#FFFFFF'}
                    fontSize={30}
                    fontWeight="bold"
                    style={{ fontSize: 30 }}
                  >
                    {bp.base2}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Strand 1 Backbone Path */}
        <path
          d={strand1Points.reduce((acc, p, idx) => {
            if (idx === 0) return `M ${p.x} ${p.y}`;
            const prev = strand1Points[idx - 1];
            const mx = (prev.x + p.x) / 2;
            const my = (prev.y + p.y) / 2;
            return `${acc} Q ${prev.x} ${prev.y}, ${mx} ${my}`;
          }, '')}
          fill="none"
          stroke="url(#strand1-grad)"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {/* Strand 2 Backbone Path */}
        <path
          d={strand2Points.reduce((acc, p, idx) => {
            if (idx === 0) return `M ${p.x} ${p.y}`;
            const prev = strand2Points[idx - 1];
            const mx = (prev.x + p.x) / 2;
            const my = (prev.y + p.y) / 2;
            return `${acc} Q ${prev.x} ${prev.y}, ${mx} ${my}`;
          }, '')}
          fill="none"
          stroke="url(#strand2-grad)"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {/* PAM Callout Badge */}
        {highlightPam && (
          <g transform={`translate(${strand1Points[9]?.x || 600}, ${centerY - 170})`}>
            <rect
              x="-80"
              y="-40"
              width="160"
              height="60"
              rx="14"
              fill="rgba(245, 158, 11, 0.92)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              fill="#0F172A"
              fontSize={32}
              fontWeight="900"
              style={{ fontSize: 32 }}
            >
              5'-NGG-3'
            </text>
            <path d="M 0 20 L -10 32 L 10 32 Z" fill="rgba(245, 158, 11, 0.92)" />
          </g>
        )}

        {/* Target 20-bp Guide Hybridization Box */}
        {highlightTarget && (
          <g transform={`translate(${strand1Points[6]?.x || 450}, ${centerY + 160})`}>
            <rect
              x="-180"
              y="-20"
              width="360"
              height="64"
              rx="16"
              fill="rgba(34, 197, 94, 0.92)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text
              x="0"
              y="22"
              textAnchor="middle"
              fill="#0F172A"
              fontSize={32}
              fontWeight="900"
              style={{ fontSize: 32 }}
            >
              20-nt Target DNA
            </text>
            <path d="M 0 -20 L -10 -32 L 10 -32 Z" fill="rgba(34, 197, 94, 0.92)" />
          </g>
        )}

        {/* Cleavage Double Strand Break Spark Effect */}
        {cleavageProgress > 0.1 && (
          <g transform={`translate(${strand1Points[6]?.x || 450}, ${centerY})`}>
            <circle
              cx="0"
              cy="0"
              r={cleavageProgress * 45}
              fill="none"
              stroke={CRISPR_THEME.colors.cleavageSpark}
              strokeWidth={5}
              opacity={1 - cleavageProgress}
            />
            <line
              x1="-30"
              y1="-30"
              x2="30"
              y2="30"
              stroke="#EF4444"
              strokeWidth={6}
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="-30"
              x2="-30"
              y2="30"
              stroke="#EF4444"
              strokeWidth={6}
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
