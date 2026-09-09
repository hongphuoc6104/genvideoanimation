/**
 * Mock Helpers and Synthetic Fixtures for V2 Motion Animation E2E Test Suite
 */

export { resolveModule, resolveOptionalModule } from './resolve';
export type { ResolvedModule } from './resolve';

// ---------------------------------------------------------------------------
// 1. Synthetic Source Code Fixtures for AST Motion Linter
// ---------------------------------------------------------------------------

export const SYNTHETIC_CODE_CORRECT_RIG = `
import React from 'react';
import { RigInterface } from 'motion-kit';

export const ArticulatedCharacter: React.FC<{ pose: any }> = ({ pose }) => {
  return (
    <svg viewBox="0 0 400 400">
      <g id="root-rig">
        <g id="hips" data-joint="hips" transform="translate(200, 200)">
          <g id="torso" data-joint="torso" transform="rotate(0)">
            <g id="head" data-joint="head" transform="translate(0, -60)">
              <circle r="30" fill="#f5d0a9" />
            </g>
            <g id="arm-left" data-joint="armLeft" transform="translate(-20, -40)">
              <rect width="10" height="40" fill="#3b82f6" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
`;

export const SYNTHETIC_CODE_MONOLITHIC_RIG = `
import React from 'react';

export const MonolithicCharacter: React.FC = () => {
  return (
    <svg viewBox="0 0 400 400">
      <path d="M 100 100 C 120 80, 180 80, 200 100 L 220 250 L 80 250 Z" fill="#ef4444" />
      <circle cx="150" cy="90" r="15" fill="#000" />
    </svg>
  );
};
`;

export const SYNTHETIC_CODE_BINARY_MORPH = `
import React from 'react';

export const BinaryMorphComponent: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <svg viewBox="0 0 200 200">
      {progress < 0.5 ? (
        <circle cx="100" cy="100" r="40" fill="#3b82f6" />
      ) : (
        <rect x="60" y="60" width="80" height="80" fill="#10b981" />
      )}
    </svg>
  );
};
`;

export const SYNTHETIC_CODE_CONTINUOUS_MORPH = `
import React from 'react';
import { interpolateSvgPath } from 'motion-kit';

export const ContinuousMorphComponent: React.FC<{ progress: number }> = ({ progress }) => {
  const pathA = "M 50 0 L 100 50 L 50 100 L 0 50 Z";
  const pathB = "M 10 10 L 90 10 L 90 90 L 10 90 Z";
  const d = interpolateSvgPath(pathA, pathB, progress);
  return (
    <svg viewBox="0 0 100 100">
      <path d={d} fill="#6366f1" />
    </svg>
  );
};
`;

export const SYNTHETIC_CODE_OPACITY_CROSSFADE = `
import React from 'react';
import { HumanRig } from 'motion-kit';

export const CrossfadePoses: React.FC<{ progress: number; poseA: any; poseB: any }> = ({ progress, poseA, poseB }) => {
  return (
    <div className="character-container">
      <div style={{ opacity: 1 - progress }}>
        <HumanRig pose={poseA} />
      </div>
      <div style={{ opacity: progress }}>
        <HumanRig pose={poseB} />
      </div>
    </div>
  );
};
`;

export const SYNTHETIC_CODE_CONTROLLER_BLEND = `
import React from 'react';
import { HumanRig, CharacterController } from 'motion-kit';

export const ControllerBlendedPoses: React.FC<{ progress: number; poseA: any; poseB: any; controller: CharacterController }> = ({
  progress,
  poseA,
  poseB,
  controller
}) => {
  const blendedPose = controller.blend(poseA, poseB, progress);
  return (
    <div className="character-container">
      <HumanRig pose={blendedPose} />
    </div>
  );
};
`;

export const SYNTHETIC_CODE_SLOW_ZOOM = `
import React from 'react';

export const AmbientSlowZoomScene: React.FC<{ frame: number }> = ({ frame }) => {
  // Ambient unmotivated monotonic camera zoom
  const zoom = 1.0 + frame * 0.0005;
  return (
    <div style={{ transform: \`scale(\${zoom})\` }}>
      <h1>Unmotivated Ambient Drift</h1>
    </div>
  );
};
`;

export const SYNTHETIC_CODE_HERMITE_CAMERA = `
import React from 'react';
import { interpolateCameraHermite } from 'motion-kit';

export const MotivatedCameraScene: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = interpolateCameraHermite(
    { x: 0, y: 0, zoom: 1.0 },
    { x: 300, y: 150, zoom: 1.25 },
    { vx: 0, vy: 0, vZoom: 0 },
    { vx: 0, vy: 0, vZoom: 0 },
    frame / 60
  );
  return (
    <div style={{ transform: \`translate(\${-cam.x}px, \${-cam.y}px) scale(\${cam.zoom})\` }}>
      <h1>Hermite Motivated Push</h1>
    </div>
  );
};
`;

// ---------------------------------------------------------------------------
// 2. Synthetic SVG Paths & Third-Party Character
// ---------------------------------------------------------------------------

export const PATH_DIAMOND_4_VERTICES = 'M 50 0 L 100 50 L 50 100 L 0 50 Z';
export const PATH_RECT_4_VERTICES = 'M 10 10 L 90 10 L 90 90 L 10 90 Z';
export const PATH_STAR_12_VERTICES =
  'M 50 0 L 62 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 38 35 Z';

export const SYNTHETIC_SVG_CUSTOM_ROBOT = `
<svg viewBox="0 0 300 400" id="industrial-robot">
  <g id="base" data-joint="base" data-pivot="150,380">
    <rect x="110" y="360" width="80" height="30" rx="6" fill="#475569" />
    <g id="arm1" data-joint="arm1" data-pivot="150,360">
      <rect x="140" y="240" width="20" height="120" rx="4" fill="#3b82f6" />
      <g id="arm2" data-joint="arm2" data-pivot="150,240">
        <rect x="142" y="140" width="16" height="100" rx="3" fill="#60a5fa" />
        <g id="gripper" data-joint="gripper" data-pivot="150,140">
          <circle cx="150" cy="140" r="10" fill="#1e293b" />
          <path d="M 140 140 L 130 110 L 145 110" stroke="#f59e0b" strokeWidth="4" fill="none" />
          <path d="M 160 140 L 170 110 L 155 110" stroke="#f59e0b" strokeWidth="4" fill="none" />
        </g>
      </g>
    </g>
  </g>
</svg>
`;

// ---------------------------------------------------------------------------
// 3. Synthetic ShotSpec Fixtures
// ---------------------------------------------------------------------------

export const VALID_SHOT_SPEC_2_SHOTS = {
  shots: [
    {
      id: 'shot_01',
      startFrame: 0,
      endFrame: 60,
      narrative_purpose: 'Establishing view of central node',
      start_state: { camera: { x: 0, y: 0, zoom: 1.0 }, actors: {} },
      end_state: { camera: { x: 300, y: 150, zoom: 1.2 }, actors: {} },
      impact_frames: []
    },
    {
      id: 'shot_02',
      startFrame: 60,
      endFrame: 120,
      narrative_purpose: 'Zooming into satellite node',
      start_state: { camera: { x: 300, y: 150, zoom: 1.2 }, actors: {} },
      end_state: { camera: { x: 800, y: 200, zoom: 1.0 }, actors: {} },
      impact_frames: [75]
    }
  ]
};

export const VALID_SHOT_SPEC_4_SHOTS = {
  shots: [
    {
      id: 'shot_01',
      startFrame: 0,
      endFrame: 60,
      narrative_purpose: 'Act 1: Problem introduction',
      start_state: { camera: { x: 0, y: 0, zoom: 1.0 }, actors: { maya: { state: 'idle' } } },
      end_state: { camera: { x: 200, y: 100, zoom: 1.15 }, actors: { maya: { state: 'anticipate' } } },
      impact_frames: []
    },
    {
      id: 'shot_02',
      startFrame: 60,
      endFrame: 120,
      narrative_purpose: 'Act 2: Energetic demonstration',
      start_state: { camera: { x: 200, y: 100, zoom: 1.15 }, actors: { maya: { state: 'anticipate' } } },
      end_state: { camera: { x: 450, y: 150, zoom: 1.3 }, actors: { maya: { state: 'gesture' } } },
      impact_frames: [85]
    },
    {
      id: 'shot_03',
      startFrame: 120,
      endFrame: 180,
      narrative_purpose: 'Act 3: Dramatic alert recoil',
      start_state: { camera: { x: 450, y: 150, zoom: 1.3 }, actors: { maya: { state: 'gesture' } } },
      end_state: { camera: { x: 600, y: 180, zoom: 1.2 }, actors: { maya: { state: 'recoil' } } },
      impact_frames: []
    },
    {
      id: 'shot_04',
      startFrame: 180,
      endFrame: 240,
      narrative_purpose: 'Act 4: Playful resolution',
      start_state: { camera: { x: 600, y: 180, zoom: 1.2 }, actors: { maya: { state: 'recoil' } } },
      end_state: { camera: { x: 0, y: 0, zoom: 1.0 }, actors: { maya: { state: 'conclude' } } },
      impact_frames: []
    }
  ]
};

export const INVALID_SHOT_SPEC_CAMERA_JUMP = {
  shots: [
    {
      id: 'shot_01',
      startFrame: 0,
      endFrame: 60,
      narrative_purpose: 'Establishing view',
      start_state: { camera: { x: 0, y: 0, zoom: 1.0 }, actors: {} },
      end_state: { camera: { x: 200, y: 100, zoom: 1.2 }, actors: {} },
      impact_frames: []
    },
    {
      id: 'shot_02',
      startFrame: 60,
      endFrame: 120,
      narrative_purpose: 'Camera abruptly jumps to x=500',
      start_state: { camera: { x: 500, y: 100, zoom: 1.2 }, actors: {} },
      end_state: { camera: { x: 800, y: 200, zoom: 1.0 }, actors: {} },
      impact_frames: []
    }
  ]
};

export const INVALID_SHOT_SPEC_FRAME_GAP = {
  shots: [
    {
      id: 'shot_01',
      startFrame: 0,
      endFrame: 60,
      start_state: { camera: { x: 0, y: 0, zoom: 1.0 } },
      end_state: { camera: { x: 200, y: 100, zoom: 1.2 } },
      impact_frames: []
    },
    {
      id: 'shot_02',
      startFrame: 65, // 5 frame gap!
      endFrame: 120,
      start_state: { camera: { x: 200, y: 100, zoom: 1.2 } },
      end_state: { camera: { x: 400, y: 100, zoom: 1.0 } },
      impact_frames: []
    }
  ]
};

export const INVALID_SHOT_SPEC_ZOOM_MISMATCH = {
  shots: [
    {
      id: 'shot_01',
      startFrame: 0,
      endFrame: 60,
      start_state: { camera: { x: 0, y: 0, zoom: 1.0 } },
      end_state: { camera: { x: 200, y: 100, zoom: 1.25 } },
      impact_frames: []
    },
    {
      id: 'shot_02',
      startFrame: 60,
      endFrame: 120,
      start_state: { camera: { x: 200, y: 100, zoom: 1.0 } }, // Zoom mismatch: 1.0 vs 1.25
      end_state: { camera: { x: 400, y: 100, zoom: 1.0 } },
      impact_frames: []
    }
  ]
};

// ---------------------------------------------------------------------------
// 4. Synthetic Audio Cue Manifest
// ---------------------------------------------------------------------------

export const VALID_CUE_MANIFEST = {
  fps: 30,
  cues: [
    { id: 'handshake_start', frame: 10, category: 'whoosh', timeSec: 10 / 30 },
    { id: 'packet_target_arrive', frame: 45, category: 'impact', timeSec: 45 / 30 },
    { id: 'gateway_ingress', frame: 55, category: 'ui_accent', timeSec: 55 / 30 },
    { id: 'quorum_ack', frame: 98, category: 'chime', timeSec: 98 / 30 },
    { id: 'disk_commit_impact', frame: 145, category: 'impact', timeSec: 145 / 30 }
  ]
};

// ---------------------------------------------------------------------------
// 5. Mathematical Helpers & Signal Generators
// ---------------------------------------------------------------------------

export function quadraticBezierPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const ct = Math.max(0, Math.min(1, t));
  const mt = 1 - ct;
  return [
    mt * mt * p0[0] + 2 * mt * ct * p1[0] + ct * ct * p2[0],
    mt * mt * p0[1] + 2 * mt * ct * p1[1] + ct * ct * p2[1]
  ];
}

export function cubicBezierPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const ct = Math.max(0, Math.min(1, t));
  const mt = 1 - ct;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const ct2 = ct * ct;
  const ct3 = ct2 * ct;

  return [
    mt3 * p0[0] + 3 * mt2 * ct * p1[0] + 3 * mt * ct2 * p2[0] + ct3 * p3[0],
    mt3 * p0[1] + 3 * mt2 * ct * p1[1] + 3 * mt * ct2 * p2[1] + ct3 * p3[1]
  ];
}

export function cubicBezierDerivative(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const ct = Math.max(0, Math.min(1, t));
  const mt = 1 - ct;
  const mt2 = mt * mt;
  const ct2 = ct * ct;

  return [
    3 * mt2 * (p1[0] - p0[0]) + 6 * mt * ct * (p2[0] - p1[0]) + 3 * ct2 * (p3[0] - p2[0]),
    3 * mt2 * (p1[1] - p0[1]) + 6 * mt * ct * (p2[1] - p1[1]) + 3 * ct2 * (p3[1] - p2[1])
  ];
}

export function calculateRollingMedian(series: number[], windowRadius: number = 5): number[] {
  const result: number[] = [];
  const len = series.length;
  for (let i = 0; i < len; i++) {
    const start = Math.max(0, i - windowRadius);
    const end = Math.min(len, i + windowRadius + 1);
    const window = series.slice(start, end).sort((a, b) => a - b);
    const mid = Math.floor(window.length / 2);
    const median = window.length % 2 !== 0 ? window[mid] : (window[mid - 1] + window[mid]) / 2;
    result.push(median);
  }
  return result;
}

export interface TemporalQAAnomaly {
  frame: number;
  mad: number;
  localMedian: number;
  ratio: number;
}

export interface TemporalQAResult {
  valid: boolean;
  anomalies: TemporalQAAnomaly[];
  whitelistedEvents: { frame: number; mad: number; ratio: number }[];
}

export function evaluateMadSpikes(
  madSeries: number[],
  windowRadius: number = 5,
  spikeThreshold: number = 4.0,
  whitelistedFrames: number[] = []
): TemporalQAResult {
  const medians = calculateRollingMedian(madSeries, windowRadius);
  const anomalies: TemporalQAAnomaly[] = [];
  const whitelistedEvents: { frame: number; mad: number; ratio: number }[] = [];
  const whitelistSet = new Set(whitelistedFrames);

  for (let t = 0; t < madSeries.length; t++) {
    const mad = madSeries[t];
    const med = medians[t];
    const denominator = Math.max(med, 0.5);
    const ratio = mad / denominator;

    if (ratio > spikeThreshold) {
      if (whitelistSet.has(t)) {
        whitelistedEvents.push({ frame: t, mad, ratio });
      } else {
        anomalies.push({ frame: t, mad, localMedian: med, ratio });
      }
    }
  }

  return {
    valid: anomalies.length === 0,
    anomalies,
    whitelistedEvents
  };
}
