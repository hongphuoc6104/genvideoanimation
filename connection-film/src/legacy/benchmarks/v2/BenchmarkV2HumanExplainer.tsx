import React, { useMemo } from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';
import {
  HumanRig,
  CharacterController,
  PERFORMANCE_PROFILES,
  cameraFollowContinuous,
  interpolateCameraHermite,
} from 'motion-kit';

export const BENCHMARK_V2_HUMAN_DURATION = 150;

export const BenchmarkV2HumanExplainer: React.FC = () => {
  const frame = useCurrentFrame();

  // Character Controller with Performance Profiles across 4 performance beats
  const controller = useMemo(() => new CharacterController(), []);

  let activePose;
  if (frame < 45) {
    // Shot 1 (frames 0-45): calm welcoming gesture and gentle posture
    activePose = controller.evaluateAction('idle', frame, 0, 45, PERFORMANCE_PROFILES.calm, {
      head: { rotation: Math.sin(frame * 0.1) * 2, x: 0, y: 0 },
      expression: { gazeX: 0.1, gazeY: 0, mouthOpen: 0.2 + Math.sin(frame * 0.3) * 0.1, eyeScale: 1.0 },
      limbs: {
        armRight: { shoulderAngle: -20 + Math.sin(frame * 0.15) * 5, elbowAngle: 30, wristAngle: 5 },
        armLeft: { shoulderAngle: 15, elbowAngle: 20, wristAngle: 0 },
      },
    });
  } else if (frame < 90) {
    // Shot 2 (frames 45-90): energetic explanation, enthusiastic hand pointing
    const localF = frame - 45;
    activePose = controller.evaluateAction('gesture', localF, 0, 45, PERFORMANCE_PROFILES.energetic, {
      head: { rotation: 4, x: 2, y: -2 },
      expression: { gazeX: 0.5, gazeY: -0.1, mouthOpen: 0.5 + Math.sin(localF * 0.5) * 0.2, eyeScale: 1.1 },
      limbs: {
        armRight: { shoulderAngle: -55, elbowAngle: 80, wristAngle: 15 },
        armLeft: { shoulderAngle: 10, elbowAngle: 20, wristAngle: 0 },
      },
    });
  } else if (frame < 120) {
    // Shot 3 (frames 90-120): dramatic revelation with deep squash and intense anticipation
    const localF = frame - 90;
    activePose = controller.evaluateAction('anticipate', localF, 0, 30, PERFORMANCE_PROFILES.dramatic, {
      head: { rotation: -3, x: 0, y: -4 },
      expression: { gazeX: 0.0, gazeY: -0.3, mouthOpen: 0.7, eyeScale: 1.25 },
      limbs: {
        armRight: { shoulderAngle: -65, elbowAngle: 45, wristAngle: 20 },
        armLeft: { shoulderAngle: -60, elbowAngle: 40, wristAngle: -20 },
      },
    });
  } else {
    // Shot 4 (frames 120-150): playful wrap-up with bouncy rebound
    const localF = frame - 120;
    activePose = controller.evaluateAction('overshoot', localF, 0, 30, PERFORMANCE_PROFILES.playful, {
      head: { rotation: Math.sin(localF * 0.2) * 3, x: 0, y: 0 },
      expression: { gazeX: 0.2, gazeY: 0.1, mouthOpen: 0.2, eyeScale: 1.0 },
      limbs: {
        armRight: { shoulderAngle: 10, elbowAngle: 15, wristAngle: 0 },
        armLeft: { shoulderAngle: -10, elbowAngle: 20, wristAngle: 0 },
      },
    });
  }

  // Camera: continuous look-ahead tracking using cameraFollowContinuous
  let camState = { x: 960, y: 540, zoom: 1.0, vx: 0, vy: 0 };
  const dt = 1 / 30;
  for (let f = 0; f <= frame; f++) {
    let targetX = 960;
    let targetY = 540;
    let targetVx = 0;
    let targetVy = 0;
    if (f < 45) {
      targetX = 960 + (f / 45) * 40;
      targetY = 540 - (f / 45) * 10;
      targetVx = 40 / 45;
      targetVy = -10 / 45;
    } else if (f < 90) {
      const p = (f - 45) / 45;
      targetX = 1000 + p * 40;
      targetY = 530 - p * 10;
      targetVx = 40 / 45;
      targetVy = -10 / 45;
    } else if (f < 120) {
      const p = (f - 90) / 30;
      targetX = 1040 - p * 35;
      targetY = 520 + p * 10;
      targetVx = -35 / 30;
      targetVy = 10 / 30;
    } else {
      const p = (f - 120) / 30;
      targetX = 1005 - p * 45;
      targetY = 530 + p * 10;
      targetVx = -45 / 30;
      targetVy = 10 / 30;
    }
    camState = cameraFollowContinuous(
      camState,
      { x: targetX, y: targetY, vx: targetVx, vy: targetVy },
      { deadZoneRadius: 5, leadFactor: 1.5, omega: 5.0, zeta: 1.0, dt }
    );
  }

  // Hermite continuous camera zoom across all 4 shots
  let camZoom = 1.0;
  if (frame < 45) {
    const res = interpolateCameraHermite(
      { x: 0, y: 0, zoom: 1.0 },
      { vx: 0, vy: 0, vZoom: 0.001 },
      { x: 40, y: -10, zoom: 1.05 },
      { vx: 0, vy: 0, vZoom: 0.001 },
      45,
      frame / 45
    );
    camZoom = res.zoom;
  } else if (frame < 90) {
    const res = interpolateCameraHermite(
      { x: 40, y: -10, zoom: 1.05 },
      { vx: 0, vy: 0, vZoom: 0.002 },
      { x: 80, y: -20, zoom: 1.15 },
      { vx: 0, vy: 0, vZoom: 0.002 },
      45,
      (frame - 45) / 45
    );
    camZoom = res.zoom;
  } else if (frame < 120) {
    const res = interpolateCameraHermite(
      { x: 80, y: -20, zoom: 1.15 },
      { vx: 0, vy: 0, vZoom: -0.001 },
      { x: 45, y: -10, zoom: 1.10 },
      { vx: 0, vy: 0, vZoom: -0.001 },
      30,
      (frame - 90) / 30
    );
    camZoom = res.zoom;
  } else {
    const res = interpolateCameraHermite(
      { x: 45, y: -10, zoom: 1.10 },
      { vx: 0, vy: 0, vZoom: -0.003 },
      { x: 0, y: 0, zoom: 1.00 },
      { vx: 0, vy: 0, vZoom: 0 },
      30,
      (frame - 120) / 30
    );
    camZoom = res.zoom;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#F8FAFC', overflow: 'hidden' }}>
      {/* Dynamic Camera Transformation Layer */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '960px 540px',
          transform: `scale(${camZoom}) translate(${960 - camState.x}px, ${540 - camState.y}px)`,
        }}
      >
        {/* Background Environment */}
        <svg width="1920" height="1080" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EFF6FF" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#bgGrad)" />

          {/* Presentation Card Graphic */}
          <g data-part="board-container" id="explainer-board" transform="translate(1080, 220)">
            <rect width="640" height="420" rx="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
            <g data-part="board-header" transform="translate(40, 40)">
              <rect width="560" height="40" rx="8" fill="#3B82F6" opacity="0.15" />
              <text x="20" y="28" fill="#1E3A8A" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
                Scientific Hypothesis Validation
              </text>
            </g>
            <g data-part="row-1" transform="translate(40, 110)">
              <circle cx="50" cy="30" r="24" fill="#10B981" opacity="0.2" />
              <path d="M40 30 L48 38 L62 22" stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round" />
              <rect x="90" y="15" width="440" height="30" rx="6" fill="#F1F5F9" />
            </g>
            <g data-part="row-2" transform="translate(40, 180)">
              <circle cx="50" cy="30" r="24" fill="#3B82F6" opacity="0.2" />
              <path d="M40 30 L48 38 L62 22" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
              <rect x="90" y="15" width="440" height="30" rx="6" fill="#F1F5F9" />
            </g>
            <g data-part="row-3" transform="translate(40, 250)">
              <circle cx="50" cy="30" r="24" fill="#F59E0B" opacity="0.2" />
              <path d="M40 30 L48 38 L62 22" stroke="#D97706" strokeWidth="4" fill="none" strokeLinecap="round" />
              <rect x="90" y="15" width="440" height="30" rx="6" fill="#F1F5F9" />
            </g>
          </g>
          {/* Articulated Human Rig (Maya) */}
          <g data-part="character-maya" transform="translate(600, 520) scale(2.2)">
            <HumanRig
              pose={activePose}
              palette={{
                skin: '#FCD34D',
                hair: '#1E293B',
                shirt: '#3B82F6',
                pants: '#1E3A8A',
                shoes: '#0F172A',
              }}
            />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
