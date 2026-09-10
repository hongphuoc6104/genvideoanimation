import React from 'react';
import { Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import { CaptionsManifest } from 'narration-kit';

export const BENCHMARK_V31_A_DURATION = 540; // 18.0s at 30fps

interface Props {
  captions?: CaptionsManifest;
}

export const BenchmarkV31A: React.FC<Props> = ({ captions }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  // Visual Motion Rig: Educational Flat Vector Academic Manuscript & Journal Acceptance Seal
  const enterScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const floatY = Math.sin(frame * 0.05) * 12;
  const pulseScale = 1.0 + Math.sin(frame * 0.08) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0F1D', // Deep scholarly navy
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Background Audio */}
      <Audio src={staticFile('v3_1/benchmark-a/narration.wav')} />

      {/* Decorative Blueprint Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.8,
        }}
      />

      {/* Radial Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Mobile Top Safe Area Header (Y = 120px) */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 72,
          right: 180,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            color: '#10B981',
            fontSize: 24,
            fontWeight: 800,
            padding: '8px 20px',
            borderRadius: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Benchmark A
        </div>
        <div style={{ color: '#94A3B8', fontSize: 26, fontWeight: 600 }}>
          Học thuật Scopus • Springer
        </div>
      </div>

      {/* Central Visual Metaphor: Manuscript & Research Space Geometry (9:16 Center) */}
      <div
        style={{
          position: 'absolute',
          top: '44%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${enterScale}) translateY(${floatY}px)`,
          width: 680,
          height: 760,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Manuscript Vector Card */}
        <div
          style={{
            width: 580,
            height: 640,
            backgroundColor: 'rgba(30, 41, 59, 0.75)',
            border: '2px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 28,
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(16px)',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            position: 'relative',
          }}
        >
          {/* Card Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 22,
              }}
            >
              RG
            </div>
            <div>
              <div style={{ color: '#F8FAFC', fontSize: 28, fontWeight: 800 }}>
                RESEARCH GAP IDENTIFICATION
              </div>
              <div style={{ color: '#38BDF8', fontSize: 20, fontWeight: 600 }}>
                Chuẩn công bố quốc tế Scopus
              </div>
            </div>
          </div>

          {/* Abstract Mock Line Strips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div style={{ width: '100%', height: 12, borderRadius: 6, backgroundColor: 'rgba(148, 163, 184, 0.25)' }} />
            <div style={{ width: '88%', height: 12, borderRadius: 6, backgroundColor: 'rgba(148, 163, 184, 0.25)' }} />
            <div style={{ width: '94%', height: 12, borderRadius: 6, backgroundColor: 'rgba(148, 163, 184, 0.25)' }} />
            <div style={{ width: '70%', height: 12, borderRadius: 6, backgroundColor: 'rgba(56, 189, 248, 0.4)' }} />
          </div>

          {/* Academic Badges Row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 'auto' }}>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 16,
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                border: '1px solid #0284C7',
                color: '#38BDF8',
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              Scopus Q1
            </div>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 16,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              Springer Nature
            </div>
          </div>
        </div>

        {/* Gold Acceptance Floating Seal */}
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            right: 20,
            transform: `scale(${pulseScale}) rotate(-12deg)`,
            backgroundColor: '#F59E0B',
            borderRadius: '50%',
            width: 130,
            height: 130,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)',
            border: '4px solid #FEF3C7',
            zIndex: 5,
          }}
        >
          <div style={{ color: '#78350F', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>
            ACCEPTED
          </div>
          <div style={{ color: '#451A03', fontSize: 12, fontWeight: 700 }}>
            SCOPUS
          </div>
        </div>
      </div>

      {/* Mobile Safe Area Karaoke Subtitles (Bottom Anchor: Y = 1410px, X = 72px, W = 828px) */}
      {captions && (
        <KaraokeCaptions
          captions={captions}
          themeProps={{
            fontSize: 56,
            accentColor: '#38BDF8',
            spokenColor: '#F1F5F9',
            upcomingColor: 'rgba(148, 163, 184, 0.8)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
