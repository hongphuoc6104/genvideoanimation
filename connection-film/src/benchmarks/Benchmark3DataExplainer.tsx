import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  CameraRig,
  cameraPush,
  clamp,
  morphTransition,
  overshoot,
  settle,
  stagger,
} from '../../../.agents/skills/educational-flat-motion/kit';

export const BENCHMARK3_DURATION = 120;
const WIDTH = 1920;
const HEIGHT = 1080;

const PURPLE = '#1a103c';
const CYAN = '#4ecdc4';
const GOLD = '#ffd16c';
const CORAL = '#ff6b78';
const MINT = '#6fe0c2';

interface NodeData {
  angle: number;
  distance: number;
  label: string;
  delay: number;
}

const NODES: NodeData[] = [
  { angle: 0, distance: 340, label: 'Tokyo', delay: 0 },
  { angle: 45, distance: 380, label: 'Seoul', delay: 2 },
  { angle: 90, distance: 320, label: 'Sydney', delay: 4 },
  { angle: 135, distance: 390, label: 'London', delay: 6 },
  { angle: 180, distance: 350, label: 'Frankfurt', delay: 8 },
  { angle: 225, distance: 410, label: 'New York', delay: 10 },
  { angle: 270, distance: 330, label: 'Sao Paulo', delay: 12 },
  { angle: 315, distance: 370, label: 'Singapore', delay: 14 },
];

/**
 * BENCHMARK 3: ABSTRACT / DATA EXPLAINER
 * Features:
 * - Anticipation wind-up -> Radial branching network burst
 * - Particle packet transfer along animated Bezier conduits
 * - Camera tracking motivated by data flow
 * - Motivated geometric morph: Network cluster curls into a circular KPI metric chart
 */
export const Benchmark3DataExplainer: React.FC = () => {
  const frame = useCurrentFrame();

  // --- 1. CORE NODE & RADIAL EXPANSION ---
  // Frames 0-20: Pulse & Anticipation contraction
  let centerScale = 1.0;
  if (frame < 14) {
    centerScale = 1.0 + Math.sin(frame * 0.4) * 0.08;
  } else if (frame < 24) {
    const antT = (frame - 14) / 10;
    centerScale = 1.0 - Math.sin(antT * Math.PI) * 0.28; // Contraction before burst
  } else {
    const burstT = clamp((frame - 24) / 20);
    centerScale = 0.72 + overshoot(burstT, 0.25) * 0.38;
  }

  // --- 2. MOTIVATED TRANSITION (Cluster -> KPI Donut Ring) ---
  // Frames 85-120: morph network nodes into a clean metric ring
  const morph = morphTransition(frame, 85, 25);
  const ringProgress = clamp((frame - 88) / 24);

  // --- 3. CAMERA CHOREOGRAPHY ---
  // Pushes in slightly during explosion, pans right to follow data packet, centers for KPI
  let camState = { x: 0, y: 0, zoom: 1.0 };
  if (frame < 24) {
    camState = { x: 0, y: 0, zoom: 1.0 };
  } else if (frame < 80) {
    camState = cameraPush(frame, 24, 60, { x: 80, y: -40, zoom: 1.12 });
  } else {
    camState = cameraPush(frame, 80, 110, { x: 0, y: 0, zoom: 1.0 }, { x: 80, y: -40, zoom: 1.12 });
  }

  // Numeric throughput counter
  const throughput = Math.floor(clamp((frame - 24) / 60) * 998) / 10;

  return (
    <div style={{ width: WIDTH, height: HEIGHT, backgroundColor: PURPLE, overflow: 'hidden' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <CameraRig
          camera={camState}
          farBackground={
            <g opacity={0.25}>
              {/* Geometric background grid */}
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`gx-${i}`} x1={i * 200} y1={0} x2={i * 200} y2={1080} stroke="#46317b" strokeWidth={1.5} />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`gy-${i}`} x1={0} y1={i * 180} x2={1920} y2={i * 180} stroke="#46317b" strokeWidth={1.5} />
              ))}
            </g>
          }
          subjectPlane={
            <g transform="translate(960, 540)">
              {/* Conduit Paths to Satellite Nodes */}
              {NODES.map((node, i) => {
                const nodeStart = stagger(node.delay, 24, 1.5);
                const progress = clamp((frame - nodeStart) / 22);
                if (progress <= 0) return null;

                const rad = (node.angle * Math.PI) / 180;
                const curDist = overshoot(progress, 0.22) * node.distance * (1 - morph.progress * 0.4);
                const nx = Math.cos(rad) * curDist;
                const ny = Math.sin(rad) * curDist;

                // Control point for arc
                const cx = Math.cos(rad + 0.3) * (curDist * 0.55);
                const cy = Math.sin(rad + 0.3) * (curDist * 0.55);

                const dashOffset = (1 - progress) * 400;

                return (
                  <g key={`node-${i}`} opacity={1 - morph.progress * 0.8}>
                    {/* Glowing Conduit */}
                    <path
                      d={`M 0 0 Q ${cx} ${cy} ${nx} ${ny}`}
                      fill="none"
                      stroke={CYAN}
                      strokeWidth={4}
                      strokeDasharray="8 6"
                      opacity={0.7}
                    />

                    {/* Satellite Node Ring & Core */}
                    <circle cx={nx} cy={ny} r={16} fill={PURPLE} stroke={GOLD} strokeWidth={5} />
                    <circle cx={nx} cy={ny} r={7} fill={CORAL} />

                    {/* Node Data Packet */}
                    {progress > 0.4 && (
                      <circle
                        cx={nx * ((frame % 25) / 25)}
                        cy={ny * ((frame % 25) / 25)}
                        r={4}
                        fill="#ffffff"
                        filter="url(#glow-filter)"
                      />
                    )}
                  </g>
                );
              })}

              {/* Center Node / Transitioning Metric Donut */}
              <g transform={`scale(${centerScale})`}>
                {morph.progress < 0.6 ? (
                  // Pulse Core Node
                  <>
                    <circle r={65} fill={CYAN} opacity={0.35} filter="url(#glow-filter)" />
                    <circle r={50} fill="#27195c" stroke={CYAN} strokeWidth={8} />
                    <circle r={24} fill={GOLD} />
                  </>
                ) : (
                  // Morphed KPI Donut Chart
                  <g>
                    {/* Background Ring */}
                    <circle r={140} fill="none" stroke="#2c1f63" strokeWidth={28} />
                    {/* Foreground Animated Metric Arc (99.8%) */}
                    <circle
                      r={140}
                      fill="none"
                      stroke={MINT}
                      strokeWidth={28}
                      strokeDasharray={2 * Math.PI * 140}
                      strokeDashoffset={2 * Math.PI * 140 * (1 - 0.998 * ringProgress)}
                      strokeLinecap="round"
                      transform="rotate(-90)"
                      filter="url(#glow-filter)"
                    />
                    <text
                      textAnchor="middle"
                      y={18}
                      fill="#ffffff"
                      fontSize={48}
                      fontWeight="800"
                      fontFamily="sans-serif"
                    >
                      {throughput.toFixed(1)}%
                    </text>
                    <text
                      textAnchor="middle"
                      y={54}
                      fill={GOLD}
                      fontSize={18}
                      fontWeight="600"
                      fontFamily="sans-serif"
                      letterSpacing={1.5}
                    >
                      GLOBAL SYNC
                    </text>
                  </g>
                )}
              </g>
            </g>
          }
          overlay={
            <g pointerEvents="none">
              <text
                x={960}
                y={90}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={32}
                fontWeight="700"
                fontFamily="sans-serif"
                letterSpacing={2}
                opacity={0.9}
              >
                BENCHMARK 3: DATA EXPLAINER & GEOMETRIC MORPH
              </text>
            </g>
          }
        />
      </svg>
    </div>
  );
};
