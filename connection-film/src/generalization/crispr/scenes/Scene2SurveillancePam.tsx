import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { DnaDoubleHelix } from '../components/DnaDoubleHelix';
import { Cas9ProteinRig } from '../components/Cas9ProteinRig';
import { GuideRnaStrand } from '../components/GuideRnaStrand';
import { HeaderAnchor } from '../components/HeaderAnchor';
import { CRISPR_THEME } from '../types';

interface Scene2SurveillancePamProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene2SurveillancePam: React.FC<Scene2SurveillancePamProps> = ({
  durationInFrames = 840,
  shotBeats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic beat choreography derived from semantic timeline
  // Beat 1: Sliding along DNA searching for PAM
  // Beat 2: PAM motif 5'-NGG-3' recognition & anchor clamp
  // Beat 3: Unwinding and 20-nt guide RNA R-loop hybridization
  const choreography = useBeatChoreography(shotBeats, frame, durationInFrames);
  const phase = choreography.phase;

  // Cas9 position tracking
  const cas9X = phase === 1
    ? interpolate(choreography.beatProgress, [0, 1], [260, 560], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 560;

  const clampSpring = spring({
    frame: phase === 1 ? 0 : Math.round(choreography.beatProgress * 60),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const unwindProgress = phase < 3
    ? (phase === 2 ? choreography.getEventProgress(0.7, 1.0) : 0)
    : choreography.getEventProgress(0.0, 0.6);

  const hybridizeProgress = phase < 3
    ? 0
    : choreography.getEventProgress(0.1, 0.85);

  const cardSpring = spring({
    frame: frame % 270,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

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
      {/* Background Radial Atmosphere */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15 }}
      >
        <circle cx="540" cy="800" r="550" fill="url(#surveillance-glow)" />
        <defs>
          <radialGradient id="surveillance-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0B1120" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Header Anchor */}
      <HeaderAnchor
        actNumber={2}
        actTitle="Tuần Tra & Định Vị"
        topicTitle={
          phase === 1
            ? 'Tuần Tra Tìm Kiếm PAM'
            : phase === 2
            ? 'Mỏ Neo Nhận Diện PAM'
            : 'Mở Xoắn & Tạo Vòng R-Loop'
        }
        badgeColor="#6366F1"
      />

      {/* Core Molecular Machinery Layer */}
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 0,
          width: 1080,
          height: 900,
        }}
      >
        {/* DNA Helix */}
        <DnaDoubleHelix
          unwindProgress={unwindProgress}
          highlightPam={phase >= 2}
          highlightTarget={phase === 3}
          showLabels={true}
          scale={1.05}
          yOffset={60}
        />

        {/* Cas9 Protein Clamp Wrapper */}
        <svg
          width="1080"
          height="900"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <Cas9ProteinRig
            x={cas9X}
            y={560}
            clampProgress={clampSpring}
            showCatalyticDomains={false}
            activeDomain="none"
            opacity={0.88}
            scale={1.1}
          />
          {phase === 3 && (
            <GuideRnaStrand
              startX={340}
              startY={480}
              hybridizeProgress={hybridizeProgress}
              opacity={1.0}
            />
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
          border: '2px solid #6366F1',
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
          {phase === 1 ? '🔍' : phase === 2 ? '⚓' : '🔄'}
        </span>
        <span
          data-role="card"
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: phase === 1 ? '#818CF8' : phase === 2 ? '#F59E0B' : '#22C55E',
            letterSpacing: '0.02em',
          }}
        >
          {phase === 1
            ? 'Tuần Tra 1D Dọc Chuỗi Xoắn Kép'
            : phase === 2
            ? 'Khóa Chặt Motif PAM 5\'-NGG-3\''
            : 'Mở Xoắn & Tạo Vòng Lai R-Loop'}
        </span>
      </div>
    </div>
  );
};
