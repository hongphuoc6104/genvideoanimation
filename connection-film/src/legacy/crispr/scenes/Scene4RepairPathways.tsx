import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { DnaDoubleHelix } from '../components/DnaDoubleHelix';
import { RepairMechanism } from '../components/RepairMechanism';
import { HeaderAnchor } from '../components/HeaderAnchor';
import { CRISPR_THEME } from '../types';

interface Scene4RepairPathwaysProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene4RepairPathways: React.FC<Scene4RepairPathwaysProps> = ({
  durationInFrames = 750,
  shotBeats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic beat choreography derived from semantic timeline
  // Beat 1: NHEJ pathway (Indels & Gene Knockout)
  // Beat 2: HDR pathway (Exogenous Donor Template & Precise Editing)
  // Beat 3: Biomedical synthesis & future therapeutic era
  const choreography = useBeatChoreography(shotBeats, frame, durationInFrames);
  const phase = choreography.phase;

  const nhejProgress = phase === 1
    ? choreography.getEventProgress(0.1, 0.85)
    : 1;

  const hdrProgress = phase < 2
    ? 0
    : phase === 2
    ? choreography.getEventProgress(0.1, 0.85)
    : 1;

  const cardSpring = spring({
    frame: Math.round(choreography.beatProgress * 150),
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const victoryGlow = Math.sin(frame * 0.12) * 0.4 + 0.6;

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
      {/* Background Atmosphere */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.16 }}
      >
        <circle
          cx="540"
          cy="850"
          r="600"
          fill={phase === 1 ? '#3B82F6' : phase === 2 ? '#EAB308' : '#10B981'}
        />
      </svg>

      {/* Header Anchor */}
      <HeaderAnchor
        actNumber={4}
        actTitle="Sửa Chữa & Ứng Dụng"
        topicTitle={
          phase === 1
            ? 'Con Đường NHEJ (Khóa Gen Mục Tiêu)'
            : phase === 2
            ? 'Con Đường HDR (Chèn Mẫu Chuẩn Xác)'
            : 'Kỷ Nguyên Y Học Chính Xác'
        }
        badgeColor={phase === 1 ? '#3B82F6' : phase === 2 ? '#EAB308' : '#10B981'}
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
        {phase === 3 ? (
          /* Phase 3: Restored Healthy DNA Helix */
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DnaDoubleHelix
              unwindProgress={0}
              cleavageProgress={0}
              showLabels={true}
              scale={1.1}
              yOffset={40}
            />
            {/* Medical Shield Stamp */}
            <svg
              width="1080"
              height="900"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              <g
                transform="translate(540, 540)"
                filter="drop-shadow(0 0 25px rgba(16, 185, 129, 0.7))"
              >
                <circle cx="0" cy="0" r="110" fill="rgba(16, 185, 129, 0.92)" stroke="#FFFFFF" strokeWidth="6" />
                <path
                  d="M -40 0 L -10 32 L 45 -28"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
        ) : (
          /* Phase 1 & 2: Active Repair Mechanism */
          <svg
            width="1080"
            height="900"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <RepairMechanism
              pathway={phase === 1 ? 'nhej' : 'hdr'}
              progress={phase === 1 ? nhejProgress : hdrProgress}
              opacity={1.0}
            />
          </svg>
        )}
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
          border: '2px solid #10B981',
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
          {phase === 1 ? '🚫' : phase === 2 ? '✨' : '🏥'}
        </span>
        <span
          data-role="card"
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: phase === 1 ? '#60A5FA' : phase === 2 ? '#FBBF24' : '#34D399',
            letterSpacing: '0.02em',
          }}
        >
          {phase === 1
            ? 'NHEJ: Đột Biến Indel Khóa Gen Đích'
            : phase === 2
            ? 'HDR: Chèn Mẫu Thiết Kế Chuẩn Xác'
            : 'Ứng Dụng Y Sinh & Trị Liệu Gen'}
        </span>
      </div>
    </div>
  );
};
