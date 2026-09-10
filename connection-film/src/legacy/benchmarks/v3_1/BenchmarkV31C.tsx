import React from 'react';
import { Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import { CaptionsManifest } from 'narration-kit';

export const BENCHMARK_V31_C_DURATION = 540; // 18.0s at 30fps

interface Props {
  captions?: CaptionsManifest;
}

export const BenchmarkV31C: React.FC<Props> = ({ captions }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  const floatY = Math.sin(frame * 0.06) * 10;
  const pulse = 1.0 + Math.sin(frame * 0.09) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0F172A', // Slate deep academic dark
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Background Audio */}
      <Audio src={staticFile('v3_1/benchmark-c/narration.wav')} />

      {/* Metric Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(245, 158, 11, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header Safe Margin (Y = 130px) */}
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
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            border: '2px solid rgba(245, 158, 11, 0.6)',
            color: '#F59E0B',
            fontSize: 24,
            fontWeight: 800,
            padding: '8px 20px',
            borderRadius: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Benchmark C
        </div>
        <div style={{ color: '#94A3B8', fontSize: 26, fontWeight: 600 }}>
          Dữ liệu học thuật • WoS • Elsevier
        </div>
      </div>

      {/* Central Visual Metaphor: Bibliometric Dashboard (9:16 Center) */}
      <div
        style={{
          position: 'absolute',
          top: '44%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${floatY}px)`,
          width: 700,
          height: 700,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {/* Main Dashboard Card */}
        <div
          style={{
            width: 620,
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 28,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#F8FAFC', fontSize: 28, fontWeight: 800 }}>
              BIBLIOMETRIC METRICS
            </div>
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '6px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              85.5% Q1/Q2
            </div>
          </div>

          {/* Metric Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 16,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#94A3B8', fontSize: 16, fontWeight: 600 }}>Cơ sở dữ liệu</div>
              <div style={{ color: '#38BDF8', fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                Web of Science
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: 16,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#94A3B8', fontSize: 16, fontWeight: 600 }}>Nhà xuất bản</div>
              <div style={{ color: '#FB923C', fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                Elsevier
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 16,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#94A3B8', fontSize: 16, fontWeight: 600 }}>Định danh số</div>
              <div style={{ color: '#C084FC', fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                DOI / ORCID
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 16,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: '#94A3B8', fontSize: 16, fontWeight: 600 }}>Tác động</div>
              <div style={{ color: '#FBBF24', fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                H-index &gt; 40
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Safe Area Karaoke Subtitles */}
      {captions && (
        <KaraokeCaptions
          captions={captions}
          themeProps={{
            fontSize: 56,
            accentColor: '#F59E0B',
            spokenColor: '#FFFFFF',
            upcomingColor: 'rgba(148, 163, 184, 0.8)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
