import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  CharacterRig,
  CameraRig,
  arcTrajectory,
  flightCycle,
  landingSequence,
  reactionSequence,
  cameraFollow,
  IDLE_POSE,
  clamp,
} from '../../../.agents/skills/educational-flat-motion/kit';

export const BENCHMARK1_DURATION = 120;
const WIDTH = 1920;
const HEIGHT = 1080;

/**
 * BENCHMARK 1: CHARACTER ACTING
 * Features:
 * - Anticipation crouch -> Explosive arc takeoff -> Flap flight cycle with banking
 * - Landing sequence: air flare -> touchdown impact squash (scaleY ~0.78) -> rebound overshoot -> settle
 * - Eye gaze leads -> head turns with 2-frame lag -> torso follows -> tail follow-through
 * - Motivated camera tracking and multi-plane parallax
 */
export const Benchmark1Character: React.FC = () => {
  const frame = useCurrentFrame();

  // --- 1. BIRD B (ACTOR): Takeoff, Arc Flight, Landing ---
  // Flight Arc Points: Start ledge [280, 720] -> Peak [960, 380] -> Landing ledge [1520, 680]
  const pStart: [number, number] = [280, 720];
  const pPeak: [number, number] = [960, 360];
  const pEnd: [number, number] = [1520, 680];

  let birdPose = IDLE_POSE;
  let birdPos: [number, number] = pStart;
  let birdFlip = false;

  if (frame < 20) {
    // Frames 0-20: Idle breathing & looking around
    const breathOffset = Math.sin(frame * 0.15) * 2;
    birdPose = {
      ...IDLE_POSE,
      bodyY: breathOffset,
      eyeGazeX: Math.sin(frame * 0.08) * 0.4,
      eyeGazeY: 0.1,
    };
    birdPos = pStart;
  } else if (frame < 32) {
    // Frames 20-32: Anticipation crouch (squash down before launching)
    const antT = (frame - 20) / 12;
    const crouchSquash = 1.0 - Math.sin(antT * Math.PI) * 0.22;
    birdPose = {
      ...IDLE_POSE,
      squash: crouchSquash,
      bodyTilt: -6 * antT,
      headAngle: 8 * antT,
      legBend: 0.7 * antT,
      wingLeftAngle: -25 * antT,
      wingRightAngle: 25 * antT,
      eyeGazeX: 0.8, // Eye darts to target first!
      eyeGazeY: -0.3,
    };
    birdPos = pStart;
  } else if (frame < 76) {
    // Frames 32-76: Launch & Curved Flight Arc with Flapping & Banking
    const flightT = (frame - 32) / 44;
    birdPos = arcTrajectory(pStart, pPeak, pEnd, flightT);

    // Banking angle depends on flight trajectory tangent
    const bank = Math.sin(flightT * Math.PI) * 16 - (flightT > 0.6 ? 12 : 0);
    birdPose = flightCycle(frame - 32, 8, { bankAngle: bank });
  } else {
    // Frames 76-120: High-fidelity landing sequence at target ledge
    birdPos = pEnd;
    birdPose = landingSequence(frame, 76, { x: -0.85, y: 0.1 });
    birdFlip = false; // Remains facing left toward Bird A
  }

  // --- 2. BIRD A (SECONDARY ACTOR): Sits at [400, 680], reacts to Bird B ---
  const birdAPos: [number, number] = [400, 680];
  const birdAReaction = reactionSequence(frame, 68, 'delight');

  // --- 3. MOTIVATED CAMERA CHOREOGRAPHY ---
  // Camera leads Bird B during flight, then centers smoothly between Bird A and Bird B
  let camX = 0;
  let camY = 0;
  let camZoom = 1.0;

  if (frame < 30) {
    camX = 0;
    camY = 0;
    camZoom = 1.0;
  } else if (frame < 80) {
    const camFollow = cameraFollow(birdPos[0] - 960, birdPos[1] - 540, { lookAheadX: 80 });
    const camT = clamp((frame - 30) / 45);
    camX = camFollow.x * camT;
    camY = camFollow.y * camT * 0.4;
    camZoom = 1.0 + Math.sin(camT * Math.PI) * 0.08;
  } else {
    // Frame between both birds [400 and 1520] -> Center around 960
    const settleT = clamp((frame - 80) / 25);
    camX = (birdPos[0] - 960) * (1 - settleT * 0.7);
    camY = 0;
    camZoom = 1.05 - settleT * 0.03;
  }

  return (
    <div style={{ width: WIDTH, height: HEIGHT, backgroundColor: '#131032', overflow: 'hidden' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <CameraRig
          camera={{ x: camX, y: camY, zoom: camZoom }}
          farBackground={
            <g opacity={0.6}>
              <circle cx={400} cy={180} r={3} fill="#ffd16c" />
              <circle cx={720} cy={240} r={4} fill="#6fe0c2" />
              <circle cx={1200} cy={140} r={5} fill="#ffd16c" />
              <circle cx={1650} cy={220} r={3} fill="#ffffff" />
              <circle cx={1500} cy={280} r={90} fill="#fdd87a" opacity={0.3} />
            </g>
          }
          background={
            <g opacity={0.5}>
              {/* Distant skyline with parallax */}
              <rect x={100} y={620} width={180} height={460} rx={8} fill="#24194c" />
              <rect x={320} y={560} width={220} height={520} rx={8} fill="#291d57" />
              <rect x={780} y={590} width={240} height={490} rx={8} fill="#24194c" />
              <rect x={1240} y={520} width={200} height={560} rx={8} fill="#2a1e5c" />
              <rect x={1480} y={580} width={260} height={500} rx={8} fill="#221846" />
            </g>
          }
          midground={
            <g>
              {/* Left Rooftop Ledge */}
              <rect x={160} y={720} width={260} height={360} rx={12} fill="#1d1542" stroke="#111333" strokeWidth={6} />
              <rect x={140} y={716} width={300} height={16} rx={8} fill="#ffd16c" />

              {/* Right Rooftop Ledge */}
              <rect x={1380} y={680} width={320} height={400} rx={12} fill="#1d1542" stroke="#111333" strokeWidth={6} />
              <rect x={1360} y={676} width={360} height={16} rx={8} fill="#ff6b78" />
            </g>
          }
          subjectPlane={
            <g>
              {/* Bird A (Host on left) */}
              <CharacterRig
                x={birdAPos[0]}
                y={birdAPos[1]}
                scale={0.9}
                flip={true} // Facing right
                color="#f6ae4f"
                accent="#ffd16c"
                pose={birdAReaction}
              />

              {/* Bird B (Flying/Landing Actor) */}
              <CharacterRig
                x={birdPos[0]}
                y={birdPos[1]}
                scale={0.95}
                flip={birdFlip}
                color="#ff6b78"
                accent="#ffd16c"
                pose={birdPose}
              />
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
                BENCHMARK 1: CHARACTER ACTING & SQUASH-SETTLE
              </text>
            </g>
          }
        />
      </svg>
    </div>
  );
};
