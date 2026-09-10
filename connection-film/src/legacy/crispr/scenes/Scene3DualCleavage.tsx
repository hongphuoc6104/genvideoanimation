import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { DnaDoubleHelix } from '../components/DnaDoubleHelix';
import { Cas9ProteinRig } from '../components/Cas9ProteinRig';
import { CleavageScissors } from '../components/CleavageScissors';
import { HeaderAnchor } from '../components/HeaderAnchor';
import { CRISPR_THEME } from '../types';

interface Scene3DualCleavageProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3DualCleavage: React.FC<Scene3DualCleavageProps> = ({
  durationInFrames = 750,
  shotBeats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic beat choreography derived from semantic timeline
  // Beat 7 (Phase 1): R-loop Hybrid Formation & 20-nt Target Unwinding
  // Beat 8 (Phase 2): Dual Catalytic Domains Activation & Convergence (HNH & RuvC)
  // Beat 9 (Phase 3): Double-Strand Scission 3bp Upstream of PAM (DSB Cleavage)
  const choreography = useBeatChoreography(shotBeats, frame, durationInFrames);
  const phase = choreography.phase;

  // Kinetic state strictly bound to semantic beat phases:
  const unwindProgress = phase === 1
    ? interpolate(choreography.beatProgress, [0, 1], [0.35, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1.0;

  const cutProgress = phase < 3
    ? 0
    : choreography.getEventProgress(0.05, 0.40);

  const separationProgress = phase < 3
    ? 0
    : choreography.getEventProgress(0.35, 0.85);

  const cardSpring = spring({
    frame: Math.round(choreography.beatProgress * 150),
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const alarmPulse = Math.sin(frame * 0.25) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: CRISPR_THEME.colors.bgDark,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background Pulse only during Phase 3 active cleavage */}
      {phase === 3 && separationProgress > 0.05 && (
        <svg
          width="1080"
          height="1920"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.12 * alarmPulse,
            pointerEvents: 'none',
          }}
        >
          <circle cx="540" cy="850" r="600" fill="#EF4444" />
        </svg>
      )}

      {/* Header Anchor */}
      <HeaderAnchor
        actNumber={3}
        actTitle="Cắt Liên Kết Đôi"
        topicTitle={
          phase === 1
            ? 'Hình Thành Vòng Lai R-Loop'
            : phase === 2
            ? 'Hội Tụ Hai Miền Cắt HNH & RuvC'
            : 'Vết Cắt Kép Sợi Đôi (DSB)'
        }
        badgeColor="#EC4899"
      />

      {/* Core Molecular Mechanics Layer */}
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 0,
          width: 1080,
          height: 900,
        }}
      >
        {/* DNA Helix undergoing cleavage */}
        <DnaDoubleHelix
          unwindProgress={unwindProgress}
          cleavageProgress={separationProgress}
          highlightPam={true}
          highlightTarget={true}
          showLabels={true}
          scale={1.05}
          yOffset={60}
        />

        {/* Cas9 Protein & Cleavage Scissors */}
        <svg
          width="1080"
          height="900"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Cas9 with active RuvC and HNH domains */}
          <Cas9ProteinRig
            frame={frame}
            x={560}
            y={560}
            clampProgress={1}
            showCatalyticDomains={phase >= 2}
            activeDomain={phase >= 2 ? 'both' : 'none'}
            opacity={phase === 3 ? 0.45 : 0.85}
            scale={1.1}
          />

          {/* Cleavage Scissors Snip in Phase 3 */}
          {phase === 3 && (
            <CleavageScissors
              x={510}
              y={560}
              cutProgress={cutProgress}
              opacity={1.0}
            />
          )}

          {/* Alarm waves for Phase 3 */}
          {phase === 3 && separationProgress > 0.1 && (
            <g transform="translate(540, 560)">
              <circle
                cx="0"
                cy="0"
                r={100 + alarmPulse * 50}
                fill="none"
                stroke="#EF4444"
                strokeWidth={5}
                opacity={1 - alarmPulse}
              />
              <circle
                cx="0"
                cy="0"
                r={160 + alarmPulse * 70}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={3}
                opacity={0.8 - alarmPulse * 0.8}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Sleek Status Badge (Safe Zone: y = 1200 - 1280, clear of subtitles at y >= 1450) */}
      <div
        style={{
          position: 'absolute',
          top: 1200,
          left: 100,
          right: 100,
          height: 80,
          backgroundColor: 'rgba(19, 29, 51, 0.94)',
          border: '2px solid #EC4899',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
          opacity: cardSpring,
        }}
      >
        <span style={{ fontSize: 38 }}>
          {phase === 1 ? '🧬' : phase === 2 ? '✂️' : '⚡'}
        </span>
        <span
          data-role="card"
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: phase === 1 ? '#EC4899' : phase === 2 ? '#38BDF8' : '#EF4444',
            letterSpacing: '0.02em',
          }}
        >
          {phase === 1
            ? 'Vòng Lai R-Loop Bắt Cặp 20 Nucleotide'
            : phase === 2
            ? 'Hai Lưỡi Kéo Phân Tử: HNH & RuvC'
            : 'Vết Đứt Gãy Sợi Đôi (DSB) Tại -3 PAM'}
        </span>
      </div>
    </div>
  );
};
