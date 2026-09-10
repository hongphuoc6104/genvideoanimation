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
  // Beat 1: Activation of catalytic domains (RuvC & HNH)
  // Beat 2: Dual strand scission 3bp upstream of PAM (DSB)
  // Beat 3: Separation of blunt ends & cellular alarm activation
  const choreography = useBeatChoreography(shotBeats, frame, durationInFrames);
  const phase = choreography.phase;

  const cutProgress = phase === 1
    ? 0
    : phase === 2
    ? choreography.getEventProgress(0.05, 0.85)
    : 1;

  const separationProgress = phase < 3
    ? 0
    : choreography.getEventProgress(0.05, 0.85);

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
      {/* Background Pulse during cut */}
      {phase >= 2 && (
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
            ? 'Kích Hoạt Hai Miền Xúc Tác'
            : phase === 2
            ? 'Vết Cắt Sợi Đôi (DSB)'
            : 'Tín Hiệu Báo Động Tế Bào'
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
          unwindProgress={1}
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
            showCatalyticDomains={true}
            activeDomain={phase === 1 ? 'both' : 'none'}
            opacity={phase === 3 ? 0.45 : 0.85}
            scale={1.1}
          />

          {/* Cleavage Scissors Snip */}
          {phase >= 1 && phase <= 2 && (
            <CleavageScissors
              x={510}
              y={560}
              cutProgress={cutProgress}
              opacity={1.0}
            />
          )}

          {/* Alarm waves for Phase 3 */}
          {phase === 3 && (
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
          {phase === 1 ? '✂️' : phase === 2 ? '⚡' : '🚨'}
        </span>
        <span
          data-role="card"
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: phase === 1 ? '#EC4899' : phase === 2 ? '#EF4444' : '#F59E0B',
            letterSpacing: '0.02em',
          }}
        >
          {phase === 1
            ? 'Hai Lưỡi Kéo Phân Tử: HNH & RuvC'
            : phase === 2
            ? 'Vết Đứt Gãy Sợi Đôi (DSB) Tại -3 PAM'
            : 'Tín Hiệu Báo Động Khẩn Cấp'}
        </span>
      </div>
    </div>
  );
};
