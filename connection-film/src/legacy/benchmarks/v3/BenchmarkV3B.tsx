import React from 'react';
import { Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsB from './captions-b.json';

export const BENCHMARK_V3_B_DURATION = 758;

export const BenchmarkV3B: React.FC = () => {
  const frame = useCurrentFrame();

  // Animated data bus lines
  const busOffset = (frame * 4) % 40;
  const corePulse = Math.sin(frame * 0.15) * 0.08 + 1.0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0f19', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Background Audio */}
      <Audio src={staticFile('v3/benchmark-b/mixed_audio.wav')} />

      {/* Subtle Cyan/Violet Accent Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(14, 165, 233, 0.12) 0%, transparent 65%)',
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
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            border: '1px solid rgba(14, 165, 233, 0.5)',
            color: '#38bdf8',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '6px 14px',
            borderRadius: 6,
          }}
        >
          High-Performance Computing
        </div>
        <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 500 }}>
          Benchmark B • Modern GPU Accelerators & Memory Bus
        </div>
      </div>

      {/* Center Technical Graphic: GPU Die + HBM3 Memory Stacks */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 650,
          height: 380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="500" height="260" viewBox="0 0 500 260" fill="none">
          {/* Substrate */}
          <rect x="50" y="30" width="400" height="200" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="2" />

          {/* Interconnect Bus Lines */}
          <line x1="120" y1="130" x2="380" y2="130" stroke="#0284c7" strokeWidth="4" strokeDasharray="10 6" strokeDashoffset={-busOffset} />

          {/* Left HBM3 Stack */}
          <rect x="80" y="80" width="60" height="100" rx="6" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
          <text x="110" y="135" fill="#38bdf8" fontSize="13" fontWeight="700" textAnchor="middle">HBM3</text>
          <text x="110" y="152" fill="#94a3b8" fontSize="10" textAnchor="middle">3.2 TB/s</text>

          {/* Main Compute Die (GPU) */}
          <rect
            x={200 - (100 * (corePulse - 1)) / 2}
            y={65 - (130 * (corePulse - 1)) / 2}
            width={100 * corePulse}
            height={130 * corePulse}
            rx="8"
            fill="#1e1b4b"
            stroke="#818cf8"
            strokeWidth="3"
          />
          <text x="250" y="125" fill="#c7d2fe" fontSize="18" fontWeight="800" textAnchor="middle">GPU DIE</text>
          <text x="250" y="148" fill="#a5b4fc" fontSize="12" fontWeight="600" textAnchor="middle">150 TFLOPS</text>

          {/* Right HBM3 Stack */}
          <rect x="360" y="80" width="60" height="100" rx="6" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
          <text x="390" y="135" fill="#38bdf8" fontSize="13" fontWeight="700" textAnchor="middle">HBM3</text>
          <text x="390" y="152" fill="#94a3b8" fontSize="10" textAnchor="middle">3.2 TB/s</text>
        </svg>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Tensor Core Execution Cluster
          </div>
          <div style={{ color: '#64748b', fontSize: 16, marginTop: 4 }}>
            High-Bandwidth Interconnect • Sub-Millisecond Parallel Latency
          </div>
        </div>
      </div>

      {/* Frame-Deterministic Word-Synchronized Karaoke Captions */}
      <KaraokeCaptions captions={captionsB as any} />
    </AbsoluteFill>
  );
};
