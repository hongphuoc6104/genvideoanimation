import React from 'react';
import { Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsA from './captions-a.json';

export const BENCHMARK_V3_A_DURATION = 688;

export const BenchmarkV3A: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle pulsing animation for central chloroplast cell
  const pulse = Math.sin(frame * 0.08) * 0.05 + 1.0;
  const rotation = frame * 0.4;

  return (
    <AbsoluteFill style={{ backgroundColor: '#09131f', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Background Audio */}
      <Audio src={staticFile('v3/benchmark-a/mixed_audio.wav')} />

      {/* Decorative Grid & Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Topic Banner */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: 96,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#34d399',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '6px 14px',
            borderRadius: 6,
          }}
        >
          Biology & Energy
        </div>
        <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 500 }}>
          Benchmark A • Photosynthesis & Cellular Respiration
        </div>
      </div>

      {/* Center Scientific Diagram Illustration */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none">
          {/* Sunlight Rays */}
          <g transform={`rotate(${rotation}, 80, 80)`}>
            <circle cx="80" cy="80" r="28" fill="#fbbf24" opacity="0.9" />
            <circle cx="80" cy="80" r="42" stroke="#fef08a" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
          </g>

          {/* Plant Cell Envelope / Chloroplast */}
          <ellipse
            cx="240"
            cy="160"
            rx={110 * pulse}
            ry={75 * pulse}
            fill="#064e3b"
            stroke="#10b981"
            strokeWidth="3"
          />

          {/* Thylakoid Stacks */}
          <rect x="190" y="130" width="45" height="12" rx="4" fill="#059669" />
          <rect x="190" y="146" width="45" height="12" rx="4" fill="#10b981" />
          <rect x="190" y="162" width="45" height="12" rx="4" fill="#34d399" />

          <rect x="245" y="135" width="45" height="12" rx="4" fill="#059669" />
          <rect x="245" y="151" width="45" height="12" rx="4" fill="#10b981" />
          <rect x="245" y="167" width="45" height="12" rx="4" fill="#34d399" />

          {/* Photon energy stream beam */}
          <line
            x1="110"
            y1="100"
            x2="190"
            y2="145"
            stroke="#facc15"
            strokeWidth="2.5"
            strokeDasharray="4 6"
          />
        </svg>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ color: '#e2e8f0', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Cellular Chloroplast Engine
          </div>
          <div style={{ color: '#64748b', fontSize: 16, marginTop: 4 }}>
            Photons + H₂O → Glucose + O₂
          </div>
        </div>
      </div>

      {/* Frame-Deterministic Word-Synchronized Karaoke Captions */}
      <KaraokeCaptions captions={captionsA as any} />
    </AbsoluteFill>
  );
};
