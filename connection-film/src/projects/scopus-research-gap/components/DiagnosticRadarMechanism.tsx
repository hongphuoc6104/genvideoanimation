import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ResearcherRig } from './ResearcherRig';

export interface DiagnosticPitfallRadarProps {
  activeMistakeIndex: number; // 0: Lỗi 1, 1: Lỗi 2, 2: Lỗi 3, 3: Lỗi 4, 4: All cleared / Scopus triumph
}

interface PitfallBlip {
  id: string;
  name: string;
  angle: number; // in degrees on radar scope
  color: string;
}

const PITFALLS: PitfallBlip[] = [
  { id: 'p1', name: 'THIẾU BẰNG CHỨNG', angle: 270, color: '#F43F5E' }, // North
  { id: 'p2', name: 'ĐỒNG NHẤT BỐI CẢNH', angle: 0, color: '#F59E0B' }, // East
  { id: 'p3', name: 'LIỆT KÊ ĐƠN THUẦN', angle: 90, color: '#A855F7' }, // South
  { id: 'p4', name: 'TÁCH RỜI PHƯƠNG PHÁP', angle: 180, color: '#38BDF8' }, // West
];

export const DiagnosticRadarMechanism: React.FC<DiagnosticPitfallRadarProps> = ({
  activeMistakeIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isTriumph = activeMistakeIndex >= 4;
  const radarSweep = (frame * 4.5) % 360;

  const cx = 540;
  const cy = 640;
  const scopeRadius = 260;

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  // Triumph burst spring
  const triumphSpring = spring({
    frame: isTriumph ? frame : 0,
    fps,
    config: { damping: 10, stiffness: 90 },
  });

  // Confetti particles for celebration in Beat 23
  const confetti = [
    { x: -240, color: '#FCD34D', speed: 4, rotSpeed: 5, size: 14 },
    { x: -180, color: '#38BDF8', speed: 6, rotSpeed: -7, size: 12 },
    { x: -110, color: '#10B981', speed: 5, rotSpeed: 4, size: 16 },
    { x: -40, color: '#F43F5E', speed: 7, rotSpeed: -6, size: 15 },
    { x: 30, color: '#A855F7', speed: 5, rotSpeed: 8, size: 12 },
    { x: 100, color: '#FCD34D', speed: 6, rotSpeed: -5, size: 14 },
    { x: 170, color: '#10B981', speed: 4, rotSpeed: 6, size: 16 },
    { x: 230, color: '#38BDF8', speed: 7, rotSpeed: -8, size: 13 },
    { x: -300, color: '#EC4899', speed: 5, rotSpeed: 7, size: 15 },
    { x: 300, color: '#10B981', speed: 6, rotSpeed: -4, size: 14 },
    { x: -70, color: '#FCD34D', speed: 8, rotSpeed: 9, size: 18 },
    { x: 80, color: '#38BDF8', speed: 7, rotSpeed: -7, size: 14 },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={1080}
        height={1920}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        <defs>
          <radialGradient id="diagRadarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          <filter id="radarGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="triumphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Kinetic Header (Minimal Anchor Tag <= 3 words) */}
        <g transform="translate(540, 290)" opacity={enterSpring}>
          <text
            x={0}
            y={0}
            fill={isTriumph ? '#FCD34D' : '#10B981'}
            fontSize={44}
            fontWeight={900}
            letterSpacing="0.08em"
            textAnchor="middle"
          >
            {isTriumph ? 'CÔNG BỐ SCOPUS THÀNH CÔNG' : 'RADAR QUÉT 4 CẠM BẪY'}
          </text>
          <line
            x1={-200}
            y1={24}
            x2={200}
            y2={24}
            stroke={isTriumph ? '#FCD34D' : '#10B981'}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>

        {/* Central 360-Degree Radar Scope */}
        <g
          transform={`translate(${cx}, ${cy}) scale(${enterSpring})`}
          style={{ transformOrigin: '0px 0px' }}
        >
          {/* Radar Background Scope */}
          <circle
            cx={0}
            cy={0}
            r={scopeRadius}
            fill="#0F172A"
            stroke={isTriumph ? '#10B981' : '#334155'}
            strokeWidth={4}
            filter={isTriumph ? 'drop-shadow(0 0 32px rgba(16, 185, 129, 0.6))' : 'none'}
          />
          {/* Concentric Scope Range Rings */}
          <circle cx={0} cy={0} r={scopeRadius * 0.7} fill="none" stroke="#1E293B" strokeWidth={2} strokeDasharray="6 6" />
          <circle cx={0} cy={0} r={scopeRadius * 0.4} fill="none" stroke="#1E293B" strokeWidth={2} strokeDasharray="4 4" />
          {/* Reticle Crosshairs */}
          <line x1={-scopeRadius} y1={0} x2={scopeRadius} y2={0} stroke="#334155" strokeWidth={2} />
          <line x1={0} y1={-scopeRadius} x2={0} y2={scopeRadius} stroke="#334155" strokeWidth={2} />

          {/* 360-Degree Rotating Radar Sweep Beam */}
          {!isTriumph && (
            <g transform={`rotate(${radarSweep})`}>
              <path
                d={`M 0,0 L ${scopeRadius},0 A ${scopeRadius},${scopeRadius} 0 0,0 ${scopeRadius * 0.85},-${scopeRadius * 0.5} Z`}
                fill="url(#diagRadarSweep)"
              />
              <line
                x1={0}
                y1={0}
                x2={scopeRadius}
                y2={0}
                stroke="#10B981"
                strokeWidth={3}
                filter="url(#radarGlow)"
              />
            </g>
          )}

          {/* Central Target Core Badge */}
          {!isTriumph ? (
            <g>
              <circle cx={0} cy={0} r={46} fill="#0F172A" stroke="#38BDF8" strokeWidth={3} />
              <text x={0} y={10} textAnchor="middle" fill="#38BDF8" fontSize={30} fontWeight={900}>
                QC
              </text>
            </g>
          ) : (
            <g>
              {/* Radiating Victory Golden Rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                <line
                  key={ang}
                  x1={0}
                  y1={0}
                  x2={Math.cos((ang * Math.PI) / 180) * (scopeRadius + 30)}
                  y2={Math.sin((ang * Math.PI) / 180) * (scopeRadius + 30)}
                  stroke="#FCD34D"
                  strokeWidth={3}
                  opacity={0.6}
                  strokeDasharray="6 4"
                />
              ))}

              <circle
                cx={0}
                cy={0}
                r={64}
                fill="url(#triumphGrad)"
                stroke="#FFFFFF"
                strokeWidth={4}
                filter="url(#radarGlow)"
              />
              <text x={0} y={10} textAnchor="middle" fill="#FFFFFF" fontSize={32} fontWeight={900}>
                SCOPUS
              </text>
            </g>
          )}

          {/* 4 Pitfall Warning Blips around Radar Perimeter */}
          {PITFALLS.map((p, idx) => {
            const rad = (p.angle * Math.PI) / 180;
            const blipDist = scopeRadius * 0.85;
            const bx = Math.cos(rad) * blipDist;
            const by = Math.sin(rad) * blipDist;

            const isCurrent = idx === activeMistakeIndex;
            const isCleared = isTriumph || idx < activeMistakeIndex;

            return (
              <g key={p.id} transform={`translate(${bx}, ${by})`}>
                {/* Active Reticle Bracket when targeted */}
                {isCurrent && (
                  <g>
                    <circle
                      cx={0}
                      cy={0}
                      r={36}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                    />
                    <path
                      d="M -26 -16 L -26 -26 L -16 -26 M 16 -26 L 26 -26 L 26 -16 M 26 16 L 26 26 L 16 26 M -16 26 L -26 26 L -26 16"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth={3}
                    />
                  </g>
                )}

                {/* Blip Circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={22}
                  fill={isCleared ? '#10B981' : isCurrent ? '#EF4444' : p.color}
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                  filter={isCleared ? 'drop-shadow(0 0 12px #10B981)' : isCurrent ? 'drop-shadow(0 0 16px #EF4444)' : 'none'}
                />

                {/* Checkmark icon if cleared, or exclamation path if pending */}
                {isCleared ? (
                  <path
                    d="M -8 0 L -2 6 L 8 -4"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M 0 -8 L 0 2 M 0 6 L 0 8"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                  />
                )}

                {/* Anchor Label Tag <= 3 words, Font >= 30px */}
                <g
                  transform={
                    p.angle === 270
                      ? 'translate(0, -42)'
                      : p.angle === 90
                      ? 'translate(0, 48)'
                      : p.angle === 0
                      ? 'translate(130, 8)'
                      : 'translate(-130, 8)'
                  }
                >
                  <rect
                    x={-120}
                    y={-22}
                    width={240}
                    height={44}
                    rx={22}
                    fill="#0F172A"
                    stroke={isCleared ? '#10B981' : isCurrent ? '#EF4444' : '#475569'}
                    strokeWidth={2}
                  />
                  <text
                    x={0}
                    y={8}
                    fill={isCleared ? '#10B981' : isCurrent ? '#FFFFFF' : '#CBD5E1'}
                    fontSize={30}
                    fontWeight={900}
                    textAnchor="middle"
                  >
                    {p.name}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Celebratory Confetti Particle Stream in Beat 23 (Triumph) */}
        {isTriumph && (
          <g>
            {confetti.map((c, i) => {
              const currentY = 200 + ((frame * c.speed * 2) % 1200);
              const rot = frame * c.rotSpeed;

              return (
                <g
                  key={i}
                  transform={`translate(${540 + c.x}, ${currentY}) rotate(${rot})`}
                >
                  <rect
                    x={-c.size / 2}
                    y={-c.size / 4}
                    width={c.size}
                    height={c.size / 2}
                    rx={2}
                    fill={c.color}
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Beat 23: Researcher Celebrating with Scopus Certificate */}
      {isTriumph && (
        <div
          style={{
            position: 'absolute',
            left: 380,
            bottom: 490,
            width: 320,
            height: 440,
            zIndex: 25,
            pointerEvents: 'none',
          }}
        >
          <ResearcherRig
            pose="celebrating"
            frame={frame}
            showGlasses
            showCertificate
            scale={0.92}
          />
        </div>
      )}
    </div>
  );
};

export default DiagnosticRadarMechanism;
