import React from 'react';
import { Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsC from './captions-c.json';

export const BENCHMARK_V3_C_DURATION = 499;

export const BenchmarkV3C: React.FC = () => {
  const frame = useCurrentFrame();

  // Dynamic reactive waveform / spike animation
  const spikeTrigger = (frame >= 250 && frame <= 330);
  const spikeHeight = spikeTrigger ? Math.sin((frame - 250) * 0.15) * 45 : 0;
  const sweep = (frame * 6) % 400;

  return (
    <AbsoluteFill style={{ backgroundColor: '#130e1c', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Background Audio */}
      <Audio src={staticFile('v3/benchmark-c/mixed_audio.wav')} />

      {/* Subtle Amber/Fuchsia Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(217, 70, 239, 0.12) 0%, transparent 65%)',
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
            backgroundColor: 'rgba(217, 70, 239, 0.2)',
            border: '1px solid rgba(217, 70, 239, 0.5)',
            color: '#e879f9',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '6px 14px',
            borderRadius: 6,
          }}
        >
          Reactive Systems
        </div>
        <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 500 }}>
          Benchmark C • Rapid Distributed Telemetry & Spike Response
        </div>
      </div>

      {/* Center Technical Graphic: Live Event Stream & Latency Graph */}
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
        <svg width="500" height="240" viewBox="0 0 500 240" fill="none">
          {/* Card Border */}
          <rect x="20" y="20" width="460" height="200" rx="10" fill="#181326" stroke="#3b2d54" strokeWidth="2" />

          {/* Grid lines */}
          <line x1="40" y1="70" x2="460" y2="70" stroke="#2e2246" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="40" y1="120" x2="460" y2="120" stroke="#2e2246" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="40" y1="170" x2="460" y2="170" stroke="#2e2246" strokeWidth="1" strokeDasharray="4 4" />

          {/* Live Waveform Path with dynamic spike */}
          <path
            d={`M 40 140 Q 100 135 150 142 T 250 ${140 - spikeHeight} T 350 138 T 460 140`}
            fill="none"
            stroke="#d946ef"
            strokeWidth="3.5"
          />

          {/* Sweep scanning cursor */}
          <line x1={40 + sweep} y1="30" x2={40 + sweep} y2="210" stroke="#f43f5e" strokeWidth="2" opacity="0.6" />

          {/* Spike alert callout when triggered */}
          {spikeTrigger && (
            <g transform="translate(250, 60)">
              <rect x="-45" y="-18" width="90" height="24" rx="4" fill="#f43f5e" />
              <text x="0" y="-2" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">BREAKTHROUGH</text>
            </g>
          )}
        </svg>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ color: '#f5d0fe', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Reactive Distributed Architecture
          </div>
          <div style={{ color: '#a855f7', fontSize: 16, marginTop: 4 }}>
            Instant In-Memory Consensus • Zero-Hesitation Throughput
          </div>
        </div>
      </div>

      {/* Frame-Deterministic Word-Synchronized Karaoke Captions */}
      <KaraokeCaptions captions={captionsC as any} />
    </AbsoluteFill>
  );
};
