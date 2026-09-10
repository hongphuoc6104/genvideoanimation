import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  CameraRig,
  cameraPush,
  clamp,
  overshoot,
  settle,
  squashStretch,
} from 'motion-kit';

export const BENCHMARK2_DURATION = 120;
const WIDTH = 1920;
const HEIGHT = 1080;

const INK = '#111333';
const MINT = '#6fe0c2';
const CORAL = '#ff6b78';
const GOLD = '#ffd16c';
const CYAN = '#4ecdc4';

/**
 * BENCHMARK 2: SCIENTIFIC / OBJECT TRANSFORMATION (NO CHARACTERS)
 * Physical transformation: Cellular Mitosis & Membrane Cleavage.
 * Features:
 * - Volume-conserving elongation & cleavage furrow constriction
 * - Elastic snap separation with overshoot & membrane wobble
 * - Organelle segregation and chromatic alignment
 * - Motivated camera push-in during pinch-off and pull-out upon separation
 */
export const Benchmark2Scientific: React.FC = () => {
  const frame = useCurrentFrame();

  // --- 1. CELL DYNAMICS (0 to 120 frames) ---
  let cellX1 = 960;
  let cellX2 = 960;
  let furrowDepth = 0; // 0 = circular, 1 = fully pinched
  let isSeparated = false;
  let daughterWobble = 0;

  // Phase 1: Resting & Pre-cleavage elongation (Frames 0 - 60)
  // Phase 2: Rapid cleavage furrow pinch-off (Frames 60 - 82)
  // Phase 3: Elastic separation & wobble settle (Frames 82 - 120)

  let stretchX = 1.0;
  let pinchProgress = 0;

  if (frame < 55) {
    const t = clamp(frame / 55);
    stretchX = 1.0 + t * 0.45; // Stretches horizontally to 1.45
    cellX1 = 960;
    cellX2 = 960;
    furrowDepth = t * 0.35;
  } else if (frame < 84) {
    const t = clamp((frame - 55) / 29);
    stretchX = 1.45 + t * 0.25;
    pinchProgress = Math.pow(t, 2.5); // Accelerated pinch
    furrowDepth = 0.35 + pinchProgress * 0.65;
    cellX1 = 960 - t * 140;
    cellX2 = 960 + t * 140;
  } else {
    isSeparated = true;
    const t = clamp((frame - 84) / 36);
    // Elastic rebound of daughter cell membranes
    daughterWobble = (1 - t) * Math.sin(t * Math.PI * 5) * 0.18;
    const sepT = overshoot(t, 0.2, 3, 5);
    cellX1 = 820 - sepT * 120;
    cellX2 = 1100 + sepT * 120;
    stretchX = 1.0 + daughterWobble;
  }

  // Calculate volume-conserving vertical squash
  const { scaleY: cellScaleY } = squashStretch(stretchX);

  // --- 2. CAMERA CHOREOGRAPHY ---
  // Push in on the furrow from frame 40 to 80, then pull back to frame the two cells
  const camState =
    frame < 80
      ? cameraPush(frame, 35, 75, { x: 0, y: 0, zoom: 1.25 })
      : cameraPush(frame, 80, 115, { x: 0, y: 0, zoom: 0.95 }, { x: 0, y: 0, zoom: 1.25 });

  // Floating background ribosomes & nutrients
  const particles = Array.from({ length: 28 }, (_, i) => {
    const seed = (i * 97.3) % 1;
    const px = (seed * 1800 + frame * (0.2 + (i % 3) * 0.1)) % 1920;
    const py = (seed * 900 + Math.sin(frame * 0.05 + i) * 15) % 1080;
    const r = 3 + (i % 4) * 2.5;
    return { x: px, y: py, r, color: i % 2 ? MINT : GOLD };
  });

  return (
    <div style={{ width: WIDTH, height: HEIGHT, backgroundColor: '#0c1b29', overflow: 'hidden' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <radialGradient id="cytoplasm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e4d58" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#153640" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0c1b29" stopOpacity="0" />
          </radialGradient>
        </defs>

        <CameraRig
          camera={camState}
          farBackground={
            <g opacity={0.4}>
              <circle cx={960} cy={540} r={650} fill="url(#cytoplasm-glow)" />
              {particles.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} opacity={0.35} />
              ))}
            </g>
          }
          subjectPlane={
            <g transform="translate(0, 0)">
              {!isSeparated ? (
                // Single dividing cell with dynamic cleavage furrow path
                <g transform={`translate(960 540) scale(${stretchX} ${cellScaleY}) translate(-960 -540)`}>
                  {/* Outer membrane */}
                  <path
                    d={`
                      M ${960 - 240} 540
                      C ${960 - 240} 380, ${960 - 100} ${380 + furrowDepth * 140}, 960 ${380 + furrowDepth * 155}
                      C ${960 + 100} ${380 + furrowDepth * 140}, ${960 + 240} 380, ${960 + 240} 540
                      C ${960 + 240} 700, ${960 + 100} ${700 - furrowDepth * 140}, 960 ${700 - furrowDepth * 155}
                      C ${960 - 100} ${700 - furrowDepth * 140}, ${960 - 240} 700, ${960 - 240} 540
                      Z
                    `}
                    fill="#1b4d57"
                    stroke={CYAN}
                    strokeWidth={12}
                    strokeLinejoin="round"
                  />

                  {/* Daughter Nuclei forming */}
                  <circle cx={850} cy={540} r={55} fill={CORAL} opacity={0.85} stroke={INK} strokeWidth={6} />
                  <circle cx={1070} cy={540} r={55} fill={CORAL} opacity={0.85} stroke={INK} strokeWidth={6} />

                  {/* Chromatin strands */}
                  <path d="M 830 525 Q 850 540 870 525 M 830 555 Q 850 540 870 555" stroke={GOLD} strokeWidth={5} fill="none" />
                  <path d="M 1050 525 Q 1070 540 1090 525 M 1050 555 Q 1070 540 1090 555" stroke={GOLD} strokeWidth={5} fill="none" />

                  {/* Spindle fibers */}
                  <line x1={850} y1={540} x2={1070} y2={540} stroke={MINT} strokeWidth={3} strokeDasharray="6 8" opacity={1 - furrowDepth} />
                </g>
              ) : (
                // Two separated daughter cells with elastic wobble
                <>
                  {/* Left Daughter Cell */}
                  <g transform={`translate(${cellX1} 540) scale(${1 + daughterWobble} ${1 - daughterWobble})`}>
                    <circle r={175} fill="#1b4d57" stroke={CYAN} strokeWidth={12} />
                    <circle cx={0} cy={0} r={52} fill={CORAL} opacity={0.85} stroke={INK} strokeWidth={6} />
                    <path d="M -20 -15 Q 0 0 20 -15 M -20 15 Q 0 0 20 15" stroke={GOLD} strokeWidth={5} fill="none" />
                  </g>

                  {/* Right Daughter Cell */}
                  <g transform={`translate(${cellX2} 540) scale(${1 + daughterWobble} ${1 - daughterWobble})`}>
                    <circle r={175} fill="#1b4d57" stroke={CYAN} strokeWidth={12} />
                    <circle cx={0} cy={0} r={52} fill={CORAL} opacity={0.85} stroke={INK} strokeWidth={6} />
                    <path d="M -20 -15 Q 0 0 20 -15 M -20 15 Q 0 0 20 15" stroke={GOLD} strokeWidth={5} fill="none" />
                  </g>
                </>
              )}
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
                BENCHMARK 2: SCIENTIFIC TRANSFORMATION (CELL MITOSIS)
              </text>
            </g>
          }
        />
      </svg>
    </div>
  );
};
