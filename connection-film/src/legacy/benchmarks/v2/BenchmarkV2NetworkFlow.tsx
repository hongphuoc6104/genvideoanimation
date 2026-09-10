import React, { useMemo } from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';
import {
  createBezierLUT,
  evaluatePacketTravel,
  strokeReveal,
  cubicToPathD,
  interpolateCameraHermite,
  ArbitraryCustomRigAdapter,
  snappy,
  clamp,
} from 'motion-kit';

export const BENCHMARK_V2_NETWORK_DURATION = 180;

// Network topology node coordinates
const NODES = {
  client: { x: 320, y: 540, label: 'Client Gateway' },
  router: { x: 780, y: 380, label: 'Raft Consensus' },
  validator: { x: 1240, y: 380, label: 'Quorum Cluster' },
  database: { x: 1540, y: 680, label: 'WAL Storage' },
};

// SVG definition for server node rig mounted via ArbitraryCustomRigAdapter
const SERVER_NODE_SVG = `
<svg viewBox="0 0 160 160">
  <g id="base" data-joint="base" data-pivot="80,80">
    <circle cx="80" cy="80" r="44" fill="#0F172A" stroke="#38BDF8" stroke-width="4" />
    <g id="core" data-joint="core" data-pivot="80,80">
      <circle cx="80" cy="80" r="32" fill="#1E293B" stroke="#64748B" stroke-width="2" />
      <g id="pulse" data-joint="pulse" data-pivot="80,80">
        <circle cx="80" cy="80" r="14" fill="#38BDF8" />
      </g>
    </g>
  </g>
</svg>
`;

export const BenchmarkV2NetworkFlow: React.FC = () => {
  const frame = useCurrentFrame();

  // Shot slicing: Shot 1 (0-60), Shot 2 (60-120), Shot 3 (120-180)
  const shotIndex = frame < 60 ? 0 : frame < 120 ? 1 : 2;

  // Hermite Camera choreography
  const p0 = { x: 0, y: 0, zoom: 1.0 };
  const v0 = { vx: 1.0, vy: -0.5, vZoom: 0.002 };
  const p1 = { x: 60, y: -30, zoom: 1.1 };
  const v1 = { vx: 1.0, vy: 0.8, vZoom: 0.0025 };
  const p2 = { x: 120, y: 20, zoom: 1.25 };
  const v2 = { vx: -2.0, vy: -0.3, vZoom: -0.004 };
  const p3 = { x: 0, y: 0, zoom: 1.0 };
  const v3 = { vx: 0.0, vy: 0.0, vZoom: 0.0 };

  let cam;
  if (shotIndex === 0) {
    cam = interpolateCameraHermite(p0, v0, p1, v1, 60, frame / 60);
  } else if (shotIndex === 1) {
    cam = interpolateCameraHermite(p1, v1, p2, v2, 60, (frame - 60) / 60);
  } else {
    cam = interpolateCameraHermite(p2, v2, p3, v3, 60, (frame - 120) / 60);
  }

  // Mounted Server Node Rig via ArbitraryCustomRigAdapter
  const serverRig = useMemo(
    () =>
      new ArbitraryCustomRigAdapter({
        svgSource: SERVER_NODE_SVG,
        jointMapping: {
          torso: 'base',
          head: 'core',
          armRight: 'pulse',
        },
      }),
    []
  );

  // Curve 1: Client -> Router (frames 10 to 55)
  const c1p0: [number, number] = [NODES.client.x, NODES.client.y];
  const c1p1: [number, number] = [460, 380];
  const c1p2: [number, number] = [620, 380];
  const c1p3: [number, number] = [NODES.router.x, NODES.router.y];
  const lut1 = useMemo(() => createBezierLUT(c1p0, c1p1, c1p2, c1p3, 100), []);
  const c1Progress = snappy(clamp((frame - 10) / 45, 0, 1));
  const packet1 = evaluatePacketTravel(lut1, c1Progress);
  const stroke1 = strokeReveal(lut1.totalLength, clamp((frame - 5) / 40, 0, 1));
  const conduit1D = useMemo(() => cubicToPathD(c1p0, c1p1, c1p2, c1p3), []);

  // Curve 2: Router -> Validator (frames 60 to 110)
  const c2p0: [number, number] = [NODES.router.x, NODES.router.y];
  const c2p1: [number, number] = [920, 240];
  const c2p2: [number, number] = [1080, 240];
  const c2p3: [number, number] = [NODES.validator.x, NODES.validator.y];
  const lut2 = useMemo(() => createBezierLUT(c2p0, c2p1, c2p2, c2p3, 100), []);
  const c2Progress = snappy(clamp((frame - 60) / 50, 0, 1));
  const packet2 = evaluatePacketTravel(lut2, c2Progress);
  const stroke2 = strokeReveal(lut2.totalLength, clamp((frame - 55) / 45, 0, 1));
  const conduit2D = useMemo(() => cubicToPathD(c2p0, c2p1, c2p2, c2p3), []);

  // Curve 3: Validator -> Database (frames 115 to 140)
  const c3p0: [number, number] = [NODES.validator.x, NODES.validator.y];
  const c3p1: [number, number] = [1420, 380];
  const c3p2: [number, number] = [1540, 500];
  const c3p3: [number, number] = [NODES.database.x, NODES.database.y];
  const lut3 = useMemo(() => createBezierLUT(c3p0, c3p1, c3p2, c3p3, 100), []);
  const c3Progress = snappy(clamp((frame - 115) / 25, 0, 1));
  const packet3 = evaluatePacketTravel(lut3, c3Progress);
  const stroke3 = strokeReveal(lut3.totalLength, clamp((frame - 110) / 25, 0, 1));
  const conduit3D = useMemo(() => cubicToPathD(c3p0, c3p1, c3p2, c3p3), []);

  // Return Curve 4: Database -> Client Return ACK (frames 145 to 175)
  const c4p0: [number, number] = [NODES.database.x, NODES.database.y];
  const c4p1: [number, number] = [1200, 840];
  const c4p2: [number, number] = [600, 840];
  const c4p3: [number, number] = [NODES.client.x, NODES.client.y];
  const lut4 = useMemo(() => createBezierLUT(c4p0, c4p1, c4p2, c4p3, 100), []);
  const c4Progress = snappy(clamp((frame - 145) / 30, 0, 1));
  const packet4 = evaluatePacketTravel(lut4, c4Progress);
  const stroke4 = strokeReveal(lut4.totalLength, clamp((frame - 142) / 30, 0, 1));
  const conduit4D = useMemo(() => cubicToPathD(c4p0, c4p1, c4p2, c4p3), []);

  // Database commit impact frame at frame 140 (synchronized with audio cue & shot spec)
  const isImpactActive = frame >= 140;
  const impactProgress = clamp((frame - 140) / 20, 0, 1);
  const impactRadius = 60 + impactProgress * 120;
  const impactOpacity = (1 - impactProgress) * 0.85;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0F1D', overflow: 'hidden' }}>
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
            <linearGradient id="netGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g data-part="net-backdrop">
            <rect width="1920" height="1080" fill="url(#netGrad)" />
          </g>

          {/* Conduit 1: Client -> Router */}
          <g data-part="conduit-1">
            <path d={conduit1D} fill="none" stroke="#1E3A8A" strokeWidth="4" strokeDasharray="8 6" />
            <path
              d={conduit1D}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="4"
              strokeDasharray={stroke1.strokeDasharray}
              strokeDashoffset={stroke1.strokeDashoffset}
            />
          </g>

          {/* Conduit 2: Router -> Validator */}
          <g data-part="conduit-2">
            <path d={conduit2D} fill="none" stroke="#1E3A8A" strokeWidth="4" strokeDasharray="8 6" />
            <path
              d={conduit2D}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="4"
              strokeDasharray={stroke2.strokeDasharray}
              strokeDashoffset={stroke2.strokeDashoffset}
            />
          </g>

          {/* Conduit 3: Validator -> Database */}
          <g data-part="conduit-3">
            <path d={conduit3D} fill="none" stroke="#1E3A8A" strokeWidth="4" strokeDasharray="8 6" />
            <path
              d={conduit3D}
              fill="none"
              stroke="#34D399"
              strokeWidth="4"
              strokeDasharray={stroke3.strokeDasharray}
              strokeDashoffset={stroke3.strokeDashoffset}
            />
          </g>

          {/* Return Conduit 4: Database -> Client ACK */}
          <g data-part="conduit-4">
            <path d={conduit4D} fill="none" stroke="#1E3A8A" strokeWidth="3" strokeDasharray="6 6" />
            <path
              d={conduit4D}
              fill="none"
              stroke="#A78BFA"
              strokeWidth="3"
              strokeDasharray={stroke4.strokeDasharray}
              strokeDashoffset={stroke4.strokeDashoffset}
            />
          </g>

          {/* Traveling Bezier Packets with Tangent Banking Orientation */}
          {frame >= 10 && frame <= 55 && (
            <g transform={packet1.transform} filter="url(#glow)">
              <polygon points="-16,-10 16,0 -16,10 -8,0" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="2" />
            </g>
          )}

          {frame >= 60 && frame <= 110 && (
            <g transform={packet2.transform} filter="url(#glow)">
              <polygon points="-18,-12 18,0 -18,12 -10,0" fill="#60A5FA" stroke="#DBEAFE" strokeWidth="2" />
            </g>
          )}

          {frame >= 115 && frame <= 140 && (
            <g transform={packet3.transform} filter="url(#glow)">
              <polygon points="-20,-14 20,0 -20,14 -12,0" fill="#34D399" stroke="#D1FAE5" strokeWidth="2" />
            </g>
          )}

          {frame >= 145 && frame <= 175 && (
            <g transform={packet4.transform} filter="url(#glow)">
              <polygon points="-16,-10 16,0 -16,10 -8,0" fill="#A78BFA" stroke="#EDE9FE" strokeWidth="2" />
            </g>
          )}

          {/* Database Commit Impact Frame Pulse at frame 140 */}
          {isImpactActive && impactProgress < 1 && (
            <g transform={`translate(${NODES.database.x}, ${NODES.database.y})`}>
              <circle r={impactRadius} fill="none" stroke="#10B981" strokeWidth="8" opacity={impactOpacity} />
              <circle r={impactRadius * 0.6} fill="none" stroke="#6EE7B7" strokeWidth="4" opacity={impactOpacity * 0.7} />
            </g>
          )}

          {/* Distributed Server Nodes Mounted via ArbitraryCustomRigAdapter */}
          {Object.entries(NODES).map(([key, node], idx) => {
            const rotPulse = Math.sin(frame * 0.15 + idx * 1.5) * 20;
            return (
              <g key={key} transform={`translate(${node.x}, ${node.y})`}>
                <g transform="translate(-80, -80)">
                  {serverRig.render({
                    root: { x: 0, y: 0 },
                    limbs: {
                      core: { rotation: rotPulse },
                      pulse: { scaleX: 1 + Math.sin(frame * 0.2) * 0.1, scaleY: 1 + Math.sin(frame * 0.2) * 0.1 },
                    },
                  })}
                </g>
                <text
                  x="0"
                  y="70"
                  fill="#CBD5E1"
                  fontSize="18"
                  fontFamily="sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
