import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { BankingCaseStudy } from '../components/BankingCaseStudy';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene4TemplateCaseStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });

  // Researcher rig dynamic pose and gaze
  const researcherPose = frame < 240 ? 'presenting' : 'discovering';
  const rigY = Math.sin(frame * 0.08) * 6;

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
          <pattern id="scene4GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene4GridPattern)" />
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
            PHẦN 4: TEMPLATE 4 CÂU & CASE STUDY NGÂN HÀNG SỐ
          </span>
        </div>
      </div>

      {/* Banking Case Study & Template Component */}
      <BankingCaseStudy showModel={true} />

      {/* Floating Researcher Rig on the Side */}
      <div
        style={{
          position: 'absolute',
          top: 960 + rigY,
          right: 28,
          width: 270,
          height: 420,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <ResearcherRig
          pose={researcherPose}
          frame={frame}
          showGlasses
          showTablet={frame < 240}
          showIdeaBulb={frame >= 240}
          scale={0.74}
        />
      </div>
    </div>
  );
};

export const Scene4CaseStudyTemplate = Scene4TemplateCaseStudy;
