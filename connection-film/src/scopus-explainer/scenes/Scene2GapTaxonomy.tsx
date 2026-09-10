import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { GapDoorsTaxonomy } from '../components/GapDoorsTaxonomy';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene2GapTaxonomy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });

  // Active gap cycling across the 450 frames:
  // 0-90: Door 1 (Theoretical Gap)
  // 90-180: Door 2 (Empirical Gap)
  // 180-270: Door 3 (Contextual Gap)
  // 270-360: Door 4 (Methodological Gap)
  // 360-450: Door 5 (Practical/Application Gap)
  const activeGapIndex = Math.min(4, Math.floor(frame / 90));

  // Subtle floating motion for presenting researcher
  const rigY = Math.sin(frame * 0.08) * 8;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: PALETTE.NAVY_DEEP,
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Academic Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="scene2GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene2GridPattern)" />
      </svg>

      {/* TOP HEADER */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 96,
          right: 96,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: introSpring,
          zIndex: 30,
        }}
      >
        <div
          style={{
            backgroundColor: PALETTE.CYAN_SOFT,
            border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
            borderRadius: 30,
            padding: '8px 24px',
            marginBottom: 10,
          }}
        >
          <span style={{ color: PALETTE.CYAN_GLOW, fontSize: 17, fontWeight: 'bold', letterSpacing: 1.5 }}>
            PHẦN 2: PHÂN LOẠI 5 LOẠI RESEARCH GAP (TAXONOMY)
          </span>
        </div>
      </div>

      {/* 5 GAP DOORS TAXONOMY COMPONENT */}
      <GapDoorsTaxonomy activeGapIndex={activeGapIndex} />

      {/* Presenting Researcher Rig on the Side */}
      <div
        style={{
          position: 'absolute',
          top: 1040 + rigY,
          right: 36,
          width: 270,
          height: 420,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <ResearcherRig
          pose={frame % 180 < 90 ? 'presenting' : 'discovering'}
          frame={frame}
          showGlasses
          showMagnifier
          scale={0.76}
        />
      </div>
    </div>
  );
};

export const Scene2Taxonomy5Gaps = Scene2GapTaxonomy;
