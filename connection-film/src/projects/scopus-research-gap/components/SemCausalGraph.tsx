import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SemCausalGraphProps {
  currentBeatIndex: number; // 0: Constructs, 1: Causal paths, 2: Context moderation barrier, 3: Synthesis
  relativeBeatFrame?: number;
  beatProgress?: number;
}

interface ConstructNode {
  id: string;
  name: string;
  sub: string;
  color: string;
  x: number;
  y: number;
  beta: string;
}

const INDEPENDENT_NODES: ConstructNode[] = [
  { id: 'c1', name: 'DỊCH VỤ SỐ', sub: 'E-SERVICE', color: '#38BDF8', x: 240, y: 560, beta: 'β = 0.42' },
  { id: 'c2', name: 'NIỀM TIN', sub: 'TRUST', color: '#10B981', x: 240, y: 800, beta: 'β = 0.38' },
  { id: 'c3', name: 'RỦI RO', sub: 'RISK', color: '#F43F5E', x: 240, y: 1040, beta: 'β = -0.29' },
];

const TARGET_NODE = {
  name: 'HÀI LÒNG',
  sub: 'SATISFACTION',
  color: '#10B981',
  x: 840,
  y: 800,
};

export const SemCausalGraph: React.FC<SemCausalGraphProps> = ({
  currentBeatIndex,
  relativeBeatFrame,
  beatProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeFrame = relativeBeatFrame !== undefined ? relativeBeatFrame : frame;

  // Entrance spring
  const enterSpring = spring({
    frame: currentBeatIndex === 0 ? activeFrame : 30,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const showPaths = currentBeatIndex >= 1;
  const isContextGap = currentBeatIndex === 2;
  const isSynthesis = currentBeatIndex >= 3;

  // Moderation barrier drop spring for Beat 2 (Context Gap)
  const barrierDrop = spring({
    frame: isContextGap ? activeFrame : isSynthesis ? 60 : 0,
    fps,
    config: { damping: 12, stiffness: 110 },
  });
  const barrierY = interpolate(barrierDrop, [0, 1], [400, 800]);

  // Pulse animation for energy packet travel (0..1 along Bezier)
  const pulseT1 = (frame * 0.025) % 1;
  const pulseT2 = ((frame * 0.025) + 0.33) % 1;
  const pulseT3 = ((frame * 0.025) + 0.66) % 1;

  // Quadratic Bezier coordinate helper: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const getQuadBezierPoint = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
    const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
    const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
    return { x, y };
  };

  const pathControls = [
    { p0: { x: 240, y: 560 }, p1: { x: 540, y: 640 }, p2: { x: 840, y: 800 } },
    { p0: { x: 240, y: 800 }, p1: { x: 540, y: 800 }, p2: { x: 840, y: 800 } },
    { p0: { x: 240, y: 1040 }, p1: { x: 540, y: 960 }, p2: { x: 840, y: 800 } },
  ];

  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <defs>
        <filter id="circuitGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="barrierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Kinetic Header (Minimal Anchor Tag <= 3 words) */}
      <g transform="translate(540, 320)" opacity={enterSpring}>
        <text
          x={0}
          y={0}
          fill="#38BDF8"
          fontSize={44}
          fontWeight={900}
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          MẠCH DỮ LIỆU SEM
        </text>
        <line
          x1={-180}
          y1={24}
          x2={180}
          y2={24}
          stroke="#38BDF8"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* Kinetic Circuit Bezier Traces connecting Nodes to Target Outcome */}
      {showPaths && (
        <g>
          {pathControls.map((ctrl, i) => {
            const node = INDEPENDENT_NODES[i];
            const isBlockedPath = i === 1 && (isContextGap || isSynthesis);

            return (
              <g key={`trace-${node.id}`}>
                {/* Smooth Bezier Cable Curve */}
                <path
                  d={`M ${ctrl.p0.x} ${ctrl.p0.y} Q ${ctrl.p1.x} ${ctrl.p1.y} ${ctrl.p2.x} ${ctrl.p2.y}`}
                  fill="none"
                  stroke={isBlockedPath ? '#F59E0B' : node.color}
                  strokeWidth={isBlockedPath ? 5 : 4}
                  strokeDasharray={isBlockedPath ? '8 6' : undefined}
                  opacity={isBlockedPath ? 0.75 : 0.85}
                />

                {/* Traveling Energy Pulses */}
                {!isBlockedPath ? (
                  <>
                    {[pulseT1, pulseT2, pulseT3].map((t, pIdx) => {
                      const pt = getQuadBezierPoint(ctrl.p0, ctrl.p1, ctrl.p2, t);
                      return (
                        <circle
                          key={pIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r={7}
                          fill="#FFFFFF"
                          filter="url(#circuitGlow)"
                        />
                      );
                    })}
                  </>
                ) : (
                  // Blocked path: energy scatters at the barrier (x = 540)
                  <>
                    {[pulseT1, pulseT2].map((t, pIdx) => {
                      const effectiveT = Math.min(0.48, t);
                      const pt = getQuadBezierPoint(ctrl.p0, ctrl.p1, ctrl.p2, effectiveT);
                      return (
                        <circle
                          key={pIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r={8}
                          fill="#F59E0B"
                          filter="url(#circuitGlow)"
                        />
                      );
                    })}
                  </>
                )}

                {/* Beta Weight Anchor Tag <= 3 words on curve */}
                <g transform={`translate(${ctrl.p1.x}, ${i === 1 ? ctrl.p1.y - 45 : ctrl.p1.y})`}>
                  <rect
                    x={-80}
                    y={-22}
                    width={160}
                    height={44}
                    rx={22}
                    fill="#0F172A"
                    stroke={isBlockedPath ? '#F59E0B' : node.color}
                    strokeWidth={2}
                  />
                  <text
                    x={0}
                    y={8}
                    fill={isBlockedPath ? '#F59E0B' : node.color}
                    fontSize={30}
                    fontWeight={900}
                    textAnchor="middle"
                  >
                    {node.beta}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      )}

      {/* Moderation Context Barrier dropping down in Beat 18 (Context Gap) */}
      {(isContextGap || isSynthesis) && (
        <g transform={`translate(540, ${barrierY})`}>
          {/* Barrier Shockwave Aura */}
          <ellipse
            cx={0}
            cy={0}
            rx={90}
            ry={90}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={3}
            strokeDasharray="6 6"
            opacity={0.7}
          />
          {/* Physical Barrier Block */}
          <rect
            x={-35}
            y={-65}
            width={70}
            height={130}
            rx={14}
            fill="url(#barrierGrad)"
            stroke="#FFFFFF"
            strokeWidth={3.5}
            filter="drop-shadow(0 0 24px rgba(245, 158, 11, 0.8))"
          />
          {/* Barrier Shield Icon */}
          <path
            d="M 0 -25 L 18 -15 L 18 10 Q 0 28 0 28 Q 0 28 -18 10 L -18 -15 Z"
            fill="#0F172A"
            stroke="#FFFFFF"
            strokeWidth={2}
          />

          {/* Barrier Anchor Label <= 3 words */}
          <g transform="translate(0, 95)">
            <rect
              x={-140}
              y={-22}
              width={280}
              height={44}
              rx={22}
              fill="#0F172A"
              stroke="#F59E0B"
              strokeWidth={2.5}
            />
            <text
              x={0}
              y={7}
              fill="#F59E0B"
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
              letterSpacing="0.04em"
            >
              RÀO CẢN BỐI CẢNH
            </text>
          </g>
        </g>
      )}

      {/* 3 Independent Predictor Nodes on Left */}
      {INDEPENDENT_NODES.map((node, idx) => {
        const isActive = currentBeatIndex === 0 ? Math.min(2, Math.floor(frame / 45)) === idx : true;

        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            opacity={isActive ? 1.0 : 0.5}
          >
            {/* Active Aura */}
            {isActive && (
              <circle
                cx={0}
                cy={0}
                r={68}
                fill={node.color}
                opacity={0.2}
                filter="url(#circuitGlow)"
              />
            )}

            {/* Circular Base Node */}
            <circle
              cx={0}
              cy={0}
              r={46}
              fill="#0F172A"
              stroke={node.color}
              strokeWidth={isActive ? 4 : 2.5}
              filter={isActive ? `drop-shadow(0 0 16px ${node.color})` : 'none'}
            />
            <circle cx={0} cy={0} r={14} fill={node.color} />

            {/* Anchor Label <= 3 words, Font >= 30px */}
            <g transform="translate(0, 78)">
              <text
                x={0}
                y={0}
                fill={isActive ? '#FFFFFF' : node.color}
                fontSize={32}
                fontWeight={900}
                letterSpacing="0.04em"
                textAnchor="middle"
              >
                {node.name}
              </text>
              <text
                x={0}
                y={32}
                fill={node.color}
                fontSize={30}
                fontWeight={700}
                letterSpacing="0.06em"
                textAnchor="middle"
              >
                {node.sub}
              </text>
            </g>
          </g>
        );
      })}

      {/* Target Outcome Node on Right ("HÀI LÒNG") */}
      <g
        transform={`translate(${TARGET_NODE.x}, ${TARGET_NODE.y})`}
        opacity={showPaths ? 1.0 : 0.5}
      >
        {/* Active Aura */}
        <circle
          cx={0}
          cy={0}
          r={78}
          fill={TARGET_NODE.color}
          opacity={0.25}
          filter="url(#circuitGlow)"
        />

        {/* Circular Target Core Node */}
        <circle
          cx={0}
          cy={0}
          r={56}
          fill="#0F172A"
          stroke={TARGET_NODE.color}
          strokeWidth={5}
          filter={`drop-shadow(0 0 24px ${TARGET_NODE.color})`}
        />
        <circle cx={0} cy={0} r={20} fill={TARGET_NODE.color} />

        {/* Outcome Anchor Label <= 3 words */}
        <g transform="translate(0, 90)">
          <text
            x={0}
            y={0}
            fill="#FFFFFF"
            fontSize={34}
            fontWeight={900}
            letterSpacing="0.04em"
            textAnchor="middle"
          >
            {TARGET_NODE.name}
          </text>
          <text
            x={0}
            y={34}
            fill={TARGET_NODE.color}
            fontSize={30}
            fontWeight={700}
            letterSpacing="0.06em"
            textAnchor="middle"
          >
            {TARGET_NODE.sub}
          </text>
        </g>
      </g>
    </svg>
  );
};

export default SemCausalGraph;
