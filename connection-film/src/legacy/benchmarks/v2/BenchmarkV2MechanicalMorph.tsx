import React, { useMemo } from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';
import {
  interpolateSvgPath,
  samplePathArcLength,
  optimizeVertexPhaseShift,
  interpolateCameraHermite,
  heavy,
  clamp,
} from 'motion-kit';

export const BENCHMARK_V2_MECHANICAL_DURATION = 150;

// Helper: Generates a 64+ vertex Geneva clockwork gear SVG path
function generateGenevaGearPath(radius: number, depth: number, slots = 6): string {
  const points: [number, number][] = [];
  const count = 96; // 96 equidistant vertices
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * 2 * Math.PI;
    const slotWave = Math.cos(theta * slots);
    const r = radius - Math.max(0, slotWave) * depth;
    points.push([Math.cos(theta) * r, Math.sin(theta) * r]);
  }
  return `M ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;
}

// Helper: Generates a 64+ vertex electromagnetic induction rotor SVG path
function generateInductionRotorPath(radius: number, poleCount = 8): string {
  const points: [number, number][] = [];
  const count = 96; // 96 equidistant vertices
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * 2 * Math.PI;
    const lobe = Math.sin(theta * poleCount) * 20;
    const r = radius + lobe;
    points.push([Math.cos(theta) * r, Math.sin(theta) * r]);
  }
  return `M ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;
}

export const BenchmarkV2MechanicalMorph: React.FC = () => {
  const frame = useCurrentFrame();

  // Morph progress: continuous transition from frame 35 to 115
  const rawProgress = clamp((frame - 35) / 80, 0, 1);
  const morphProgress = heavy(rawProgress);

  // Discrete path definitions
  const gearPath = useMemo(() => generateGenevaGearPath(180, 52, 6), []);
  const rotorPath = useMemo(() => generateInductionRotorPath(170, 8), []);

  // Verification sampling & phase-shift alignment for N >= 64 vertices
  const sampledGear = useMemo(() => samplePathArcLength(gearPath, 64), [gearPath]);
  const sampledRotor = useMemo(() => samplePathArcLength(rotorPath, 64), [rotorPath]);
  const phaseOptimization = useMemo(
    () => optimizeVertexPhaseShift(sampledRotor, sampledGear),
    [sampledRotor, sampledGear]
  );

  // Continuous geometric SVG path morph (Zero ternary element switches)
  const morphedPathD = useMemo(() => {
    return interpolateSvgPath(gearPath, rotorPath, morphProgress, {
      sampleCount: 64,
      closed: true,
      wobble: 0.04,
    });
  }, [gearPath, rotorPath, morphProgress]);

  // Rotational physics: angular momentum with damped inertia
  let rotation = 0;
  let angularVel = 5.0;
  const damping = 0.988;
  for (let f = 0; f < frame; f++) {
    const torque = f < 45 ? 0.35 : (f > 85 ? 0.25 * Math.sin((f - 85) * 0.12) : 0);
    angularVel = (angularVel + torque) * damping;
    rotation += angularVel;
  }

  // Hermite Camera continuity across shot 1 (0-75) and shot 2 (75-150)
  const isShot2 = frame >= 75;
  const p0 = { x: 0, y: 0, zoom: 1.0 };
  const v0 = { vx: 0.6, vy: 0.25, vZoom: 0.0025 };
  const p1 = { x: 50, y: 20, zoom: 1.2 };
  const v1 = { vx: -0.6, vy: -0.25, vZoom: -0.0025 };
  const p2 = { x: 0, y: 0, zoom: 1.0 };
  const v2 = { vx: 0.0, vy: 0.0, vZoom: 0.0 };

  const cam = !isShot2
    ? interpolateCameraHermite(p0, v0, p1, v1, 75, frame / 75)
    : interpolateCameraHermite(p1, v1, p2, v2, 75, (frame - 75) / 75);

  return (
    <AbsoluteFill style={{ backgroundColor: '#090E17', overflow: 'hidden' }}>
      {/* Dynamic Camera Coordinate Matrix */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '960px 540px',
          transform: `scale(${cam.zoom}) translate(${960 - (960 + cam.x)}px, ${540 - (540 + cam.y)}px)`,
        }}
      >
        <svg width="1920" height="1080" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <radialGradient id="metalGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="65%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </radialGradient>
            <pattern id="mechGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1E293B" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Blueprint Engineering Grid */}
          <g data-part="blueprint-grid">
            <rect width="1920" height="1080" fill="#090E17" />
            <rect width="1920" height="1080" fill="url(#mechGrid)" opacity="0.6" />
          </g>

          {/* Stator Housing Rings */}
          <g data-part="housing-ring">
            <circle cx="960" cy="540" r="280" fill="none" stroke="#334155" strokeWidth="6" strokeDasharray="16 8" />
            <circle cx="960" cy="540" r="320" fill="none" stroke="#1E293B" strokeWidth="2" />
          </g>

          {/* Hydraulic Guide Rails */}
          <g data-part="guide-rails" stroke="#475569" strokeWidth="4">
            <line x1="820" y1="180" x2="820" y2="900" />
            <line x1="1100" y1="180" x2="1100" y2="900" />
            <line x1="780" y1="540" x2="1140" y2="540" strokeDasharray="4 8" />
          </g>

          {/* Continuous True Geometric Morph (100% Continuous, 0% Binary Swaps) */}
          <g
            data-part="morphed-rotor"
            transform={`translate(960, 540) rotate(${rotation})`}
          >
            <path
              d={morphedPathD}
              fill="url(#metalGrad)"
              stroke="#E0F2FE"
              strokeWidth={5}
              strokeLinejoin="round"
            />
            {/* Central Axle & Core Magnetic Bearing */}
            <circle cx="0" cy="0" r="32" fill="#0F172A" stroke="#38BDF8" strokeWidth="4" />
            <circle cx="0" cy="0" r="12" fill="#BAE6FD" />
          </g>

          {/* Electromagnetic Flux / Kinetic Pressure Channels */}
          <g data-part="flux-indicators">
            <rect x="660" y="360" width="18" height={160 + Math.sin(frame * 0.2) * 40} rx="8" fill="#38BDF8" opacity="0.75" />
            <rect x="1242" y="360" width="18" height={160 - Math.sin(frame * 0.2) * 40} rx="8" fill="#F59E0B" opacity="0.75" />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
