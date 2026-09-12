import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CantileverBridgeProps {
  activeTier: 1 | 2 | 3; // 1: Foundation Cliffs, 2: Cantilever Tension Arms, 3: Keystone Locked
  showResearcher?: boolean;
}

export const CantileverBridge: React.FC<CantileverBridgeProps> = ({
  activeTier,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Keystone drop spring animation when activeTier === 3
  const keystoneDrop = spring({
    frame: activeTier === 3 ? frame : 0,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const isLocked = activeTier === 3 && keystoneDrop > 0.85;
  const keystoneY = interpolate(keystoneDrop, [0, 1], [460, 840]);
  const shockwaveScale = interpolate(keystoneDrop, [0.85, 1], [0.5, 2.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shockwaveOpacity = interpolate(keystoneDrop, [0.85, 1], [0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulse animation for energy flow across bridge
  const energyFlow = (frame * 12) % 920;

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
        <filter id="bridgeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="cliffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="keystoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Kinetic Header (Minimal Anchor Tag <= 3 words) */}
      <g transform="translate(540, 320)">
        <text
          x={0}
          y={0}
          fill="#10B981"
          fontSize={44}
          fontWeight={900}
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          CẦU TRI THỨC 3 TẦNG
        </text>
        <line
          x1={-180}
          y1={24}
          x2={180}
          y2={24}
          stroke="#10B981"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* Main Bridge Assembly (Stage zone y in [600, 1380]) */}
      <g>
        {/* The Abyssal Chasm Void (Gradient Abyss) */}
        <path
          d="M 320 860 L 440 1280 L 640 1280 L 760 860 Z"
          fill="#0B1120"
          stroke="#334155"
          strokeWidth={3}
          strokeDasharray="8 6"
        />

        {/* Chasm Void Label (disappears when locked) */}
        {!isLocked && (
          <g transform="translate(540, 1140)">
            <text
              x={0}
              y={0}
              fill="#94A3B8"
              fontSize={30}
              fontWeight={800}
              letterSpacing="0.06em"
              textAnchor="middle"
            >
              VỰC THẲM TRI THỨC
            </text>
            <line x1={-110} y1={18} x2={110} y2={18} stroke="#475569" strokeWidth={2} />
          </g>
        )}

        {/* LEFT CLIFF FOUNDATION ("ĐÃ BIẾT") */}
        <g>
          {/* Rock Cliff Mass */}
          <path
            d="M 40 860 L 340 860 L 310 1340 L 40 1340 Z"
            fill="url(#cliffGrad)"
            stroke="#10B981"
            strokeWidth={4}
          />
          {/* Cliff Road Surface */}
          <line x1={40} y1={860} x2={340} y2={860} stroke="#10B981" strokeWidth={6} strokeLinecap="round" />
          {/* Strut Supports */}
          <line x1={140} y1={860} x2={260} y2={1100} stroke="#334155" strokeWidth={3} />
          <line x1={240} y1={860} x2={310} y2={1200} stroke="#334155" strokeWidth={3} />

          {/* Anchor Tag <= 3 words */}
          <g transform="translate(190, 940)">
            <rect x={-90} y={-24} width={180} height={48} rx={24} fill="#0F172A" stroke="#10B981" strokeWidth={2.5} />
            <text x={0} y={8} fill="#10B981" fontSize={30} fontWeight={900} textAnchor="middle">
              ĐÃ BIẾT
            </text>
          </g>
        </g>

        {/* RIGHT CLIFF FOUNDATION ("MỤC TIÊU") */}
        <g>
          {/* Rock Cliff Mass */}
          <path
            d="M 740 860 L 1040 860 L 1040 1340 L 770 1340 Z"
            fill="url(#cliffGrad)"
            stroke="#10B981"
            strokeWidth={4}
          />
          {/* Cliff Road Surface */}
          <line x1={740} y1={860} x2={1040} y2={860} stroke="#10B981" strokeWidth={6} strokeLinecap="round" />
          {/* Strut Supports */}
          <line x1={940} y1={860} x2={820} y2={1100} stroke="#334155" strokeWidth={3} />
          <line x1={840} y1={860} x2={770} y2={1200} stroke="#334155" strokeWidth={3} />

          {/* Anchor Tag <= 3 words */}
          <g transform="translate(890, 940)">
            <rect x={-90} y={-24} width={180} height={48} rx={24} fill="#0F172A" stroke="#10B981" strokeWidth={2.5} />
            <text x={0} y={8} fill="#10B981" fontSize={30} fontWeight={900} textAnchor="middle">
              MỤC TIÊU
            </text>
          </g>
        </g>

        {/* TIER 2: CANTILEVER TRUSS ARMS EXTENDING ACROSS THE VOID */}
        <g>
          {/* Left Cantilever Arm (extends to x = 470) */}
          <polygon
            points="340,860 480,860 460,940 330,940"
            fill="#1E293B"
            stroke={isLocked ? '#10B981' : '#38BDF8'}
            strokeWidth={3}
          />
          {/* Truss Cross Bracing */}
          <line x1={340} y1={860} x2={460} y2={940} stroke="#38BDF8" strokeWidth={2} opacity={0.6} />
          <line x1={330} y1={940} x2={480} y2={860} stroke="#38BDF8" strokeWidth={2} opacity={0.6} />

          {/* Right Cantilever Arm (extends from x = 600) */}
          <polygon
            points="600,860 740,860 750,940 620,940"
            fill="#1E293B"
            stroke={isLocked ? '#10B981' : '#38BDF8'}
            strokeWidth={3}
          />
          {/* Truss Cross Bracing */}
          <line x1={600} y1={860} x2={750} y2={940} stroke="#38BDF8" strokeWidth={2} opacity={0.6} />
          <line x1={620} y1={940} x2={740} y2={860} stroke="#38BDF8" strokeWidth={2} opacity={0.6} />

          {/* Tension vectors across the gap when unlocked */}
          {!isLocked && (
            <g>
              <line
                x1={480}
                y1={860}
                x2={600}
                y2={860}
                stroke="#F59E0B"
                strokeWidth={4}
                strokeDasharray="8 6"
              />
              <circle cx={480} cy={860} r={6} fill="#F59E0B" />
              <circle cx={600} cy={860} r={6} fill="#F59E0B" />
              <text
                x={540}
                y={840}
                fill="#F59E0B"
                fontSize={30}
                fontWeight={800}
                textAnchor="middle"
              >
                KHOẢNG HỞ LỰC CĂNG
              </text>
            </g>
          )}
        </g>

        {/* TIER 3: THE KEYSTONE ("ĐỊNH VỊ") DROPPING AND LOCKING */}
        <g transform={`translate(540, ${keystoneY})`}>
          {/* Keystone Trapezoidal Locking Geometry */}
          <polygon
            points="-65,-40 65,-40 45,50 -45,50"
            fill="url(#keystoneGrad)"
            stroke={isLocked ? '#FFFFFF' : '#38BDF8'}
            strokeWidth={4}
            filter="drop-shadow(0 0 20px rgba(56, 189, 248, 0.8))"
          />
          {/* Keystone Label <= 3 words */}
          <text
            x={0}
            y={12}
            fill="#FFFFFF"
            fontSize={30}
            fontWeight={900}
            letterSpacing="0.04em"
            textAnchor="middle"
          >
            ĐỊNH VỊ
          </text>
        </g>

        {/* Locking Shockwave Impact Effect */}
        {activeTier === 3 && keystoneDrop > 0.85 && (
          <g transform="translate(540, 860)">
            <ellipse
              cx={0}
              cy={0}
              rx={120 * shockwaveScale}
              ry={35 * shockwaveScale}
              fill="none"
              stroke="#10B981"
              strokeWidth={5}
              opacity={shockwaveOpacity}
            />
          </g>
        )}

        {/* Full Green Energy Continuous Deck Stream when Bridge is Locked */}
        {isLocked && (
          <g>
            <line
              x1={40}
              y1={860}
              x2={1040}
              y2={860}
              stroke="#10B981"
              strokeWidth={8}
              strokeLinecap="round"
              filter="url(#bridgeGlow)"
            />
            {/* Animated Energy Pulses crossing the entire span */}
            <circle
              cx={40 + energyFlow}
              cy={860}
              r={9}
              fill="#FFFFFF"
              filter="url(#bridgeGlow)"
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export const ThreeTierBridgeMechanism = CantileverBridge;
export default CantileverBridge;
