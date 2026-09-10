import React from 'react';
import { Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import { CaptionsManifest } from 'narration-kit';

export const BENCHMARK_V31_B_DURATION = 540; // 18.0s at 30fps

interface Props {
  captions?: CaptionsManifest;
}

export const BenchmarkV31B: React.FC<Props> = ({ captions }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  // Neural Network Packet Pulses
  const packetProgress = (frame * 0.04) % 1;
  const pulse = Math.sin(frame * 0.1) * 0.05 + 1.0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050B14', // Deep cybernetic obsidian
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Background Audio */}
      <Audio src={staticFile('v3_1/benchmark-b/narration.wav')} />

      {/* Cybernetic Conduits Background Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.9,
        }}
      />

      {/* Ambient Neural Glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Mobile Top Header (Y = 130px) */}
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
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            border: '2px solid rgba(139, 92, 246, 0.6)',
            color: '#A78BFA',
            fontSize: 24,
            fontWeight: 800,
            padding: '8px 20px',
            borderRadius: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Benchmark B
        </div>
        <div style={{ color: '#94A3B8', fontSize: 26, fontWeight: 600 }}>
          Công nghệ AI • GPU • GPT • BERT
        </div>
      </div>

      {/* Central Visual Metaphor: Neural GPU Cluster Core (9:16 Center) */}
      <div
        style={{
          position: 'absolute',
          top: '44%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 720,
          height: 720,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Central GPU Chip Matrix */}
        <div
          style={{
            width: 440,
            height: 440,
            backgroundColor: 'rgba(17, 24, 39, 0.85)',
            border: '3px solid #8B5CF6',
            borderRadius: 36,
            boxShadow: '0 0 50px rgba(139, 92, 246, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${pulse})`,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '2px solid #C4B5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EDE9FE',
              fontSize: 38,
              fontWeight: 900,
              boxShadow: '0 0 30px rgba(167, 139, 250, 0.5)',
            }}
          >
            GPU
          </div>
          <div style={{ color: '#F3F4F6', fontSize: 28, fontWeight: 800, marginTop: 24 }}>
            NEURAL ACCELERATOR
          </div>
          <div style={{ color: '#A78BFA', fontSize: 20, fontWeight: 600, marginTop: 6 }}>
            GPT & BERT Pipeline
          </div>
        </div>

        {/* Orbiting Architecture Nodes: AI, API, BERT, GPT */}
        {[
          { label: 'AI CORE', color: '#06B6D4', angle: 0 },
          { label: 'GPT-5', color: '#10B981', angle: 90 },
          { label: 'BERT', color: '#F59E0B', angle: 180 },
          { label: 'API ENDPOINT', color: '#EC4899', angle: 270 },
        ].map((node, i) => {
          const currentAngle = ((node.angle + frame * 0.6) * Math.PI) / 180;
          const radius = 280;
          const nx = Math.cos(currentAngle) * radius;
          const ny = Math.sin(currentAngle) * radius;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                transform: `translate(${nx}px, ${ny}px)`,
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: `2px solid ${node.color}`,
                borderRadius: 16,
                padding: '10px 22px',
                color: node.color,
                fontWeight: 800,
                fontSize: 20,
                boxShadow: `0 4px 20px ${node.color}40`,
              }}
            >
              {node.label}
            </div>
          );
        })}
      </div>

      {/* Mobile Safe Area Karaoke Subtitles */}
      {captions && (
        <KaraokeCaptions
          captions={captions}
          themeProps={{
            fontSize: 56,
            accentColor: '#A78BFA',
            spokenColor: '#FFFFFF',
            upcomingColor: 'rgba(148, 163, 184, 0.8)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
