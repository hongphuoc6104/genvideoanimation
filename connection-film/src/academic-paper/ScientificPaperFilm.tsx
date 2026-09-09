import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  CameraRig,
  cameraPush,
  motivatedIris,
  clamp,
  CameraState,
} from 'motion-kit';
import { Act1Structure } from './Act1Structure';
import { Act2Methods } from './Act2Methods';
import { Act3Results } from './Act3Results';
import { Act4Discussion } from './Act4Discussion';

export const TOTAL_FRAMES = 1350; // 45 seconds @ 30 fps
const WIDTH = 1920;
const HEIGHT = 1080;

/**
 * SCIENTIFIC PAPER 45-SECOND EDUCATIONAL EXPLAINER FILM
 * Master composition following the IMRaD framework through a concrete case study:
 * Act 1 (0 - 300): The 4 Pillars of IMRaD
 * Act 2 (300 - 660): Introduction (Hypothesis) & Methods (N=100 Trial + EEG)
 * Act 3 (660 - 1020): Results (+35% improvement, Normal distribution, p < 0.01)
 * Act 4 (1020 - 1350): Discussion, Published Academic Paper & Peer-Reviewed Stamp
 */
export const ScientificPaperFilm: React.FC = () => {
  const frame = useCurrentFrame();

  // --- MOTIVATED CAMERA CHOREOGRAPHY ---
  let camState: CameraState = { x: 0, y: 0, zoom: 1.0, rotation: 0 };

  if (frame < 300) {
    // Act 1: Slight push into pillar "I" near end
    camState = cameraPush(frame, 230, 295, { x: -80, y: 20, zoom: 1.08 });
  } else if (frame < 660) {
    // Act 2: Pan slightly across Methods setup
    camState = cameraPush(frame, 430, 520, { x: 30, y: -20, zoom: 1.0 }, { x: -80, y: 20, zoom: 1.08 });
  } else if (frame < 1020) {
    // Act 3: Frame centered on Results dashboard
    camState = cameraPush(frame, 680, 760, { x: 0, y: 0, zoom: 1.04 }, { x: 30, y: -20, zoom: 1.0 });
  } else {
    // Act 4: Stamp impact micro-shake (frame 1190) and settle
    let stampShake = 0;
    if (frame >= 1190 && frame <= 1205) {
      stampShake = Math.sin((frame - 1190) * 1.5) * Math.exp(-(frame - 1190) * 0.3) * 6;
    }
    const pullOut = cameraPush(frame, 1220, 1300, { x: 0, y: 0, zoom: 1.0 }, { x: 0, y: 0, zoom: 1.04 });
    camState = {
      ...pullOut,
      y: pullOut.y + stampShake,
    };
  }

  // Final Ending Iris Wipe (Frames 1315 - 1350)
  const iris = motivatedIris(frame, 1315, 35, {
    focalPoint: [960, 540],
    direction: 'in', // contracts inward to close
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0b24', overflow: 'hidden' }}>
      {/* Background Audio */}
      <Audio src={staticFile('soundtrack.wav')} />

      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="sci-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#171138" />
            <stop offset="50%" stopColor="#100b28" />
            <stop offset="100%" stopColor="#0a071c" />
          </linearGradient>

          <clipPath id="end-iris-clip" clipPathUnits="userSpaceOnUse">
            <circle cx={iris.cx} cy={iris.cy} r={frame >= 1315 ? iris.radius : 2000} />
          </clipPath>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#sci-bg)" />

        {/* Multi-depth Parallax Camera Stage */}
        <g clipPath="url(#end-iris-clip)">
          <CameraRig
            camera={camState}
            farBackground={
              <g opacity={0.35}>
                {/* Floating academic formula & coordinate glyphs */}
                <circle cx={300} cy={160} r={4} fill="#4ecdc4" />
                <circle cx={800} cy={120} r={5} fill="#ffd16c" />
                <circle cx={1400} cy={180} r={4} fill="#ff6b78" />
                <circle cx={1700} cy={130} r={6} fill="#6fe0c2" />
                <circle cx={960} cy={540} r={550} fill="#23194a" opacity={0.25} />
              </g>
            }
            subjectPlane={
              <g>
                {/* ACT 1: 0 - 300 */}
                {frame < 300 && <Act1Structure frame={frame} />}

                {/* ACT 2: 300 - 660 */}
                {frame >= 300 && frame < 660 && <Act2Methods frame={frame} />}

                {/* ACT 3: 660 - 1020 */}
                {frame >= 660 && frame < 1020 && <Act3Results frame={frame} />}

                {/* ACT 4: 1020 - 1350 */}
                {frame >= 1020 && <Act4Discussion frame={frame} />}
              </g>
            }
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
