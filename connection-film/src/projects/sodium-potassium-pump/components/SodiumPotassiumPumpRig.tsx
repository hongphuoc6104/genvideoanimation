import React from 'react';
import { interpolate } from 'remotion';

export interface SodiumPotassiumPumpRigProps {
  frame?: number;
  cx?: number; // Center X of pump (default 460)
  cy?: number; // Center Y of membrane level (default 700)
  e1ToE2Progress?: number; // 0.0 = pure E1 (inward open), 1.0 = pure E2 (outward open)
  isPhosphorylated?: boolean; // True when high-energy phosphate is docked at Aspartate
  boundNaCount?: number; // 0 to 3
  boundKCount?: number; // 0 to 2
  scale?: number;
  showStateBadge?: boolean;
}

export const SodiumPotassiumPumpRig: React.FC<SodiumPotassiumPumpRigProps> = ({
  frame = 0,
  cx = 460,
  cy = 700,
  e1ToE2Progress = 0,
  isPhosphorylated = false,
  boundNaCount = 0,
  boundKCount = 0,
  scale = 1.0,
  showStateBadge = false,
}) => {
  // Interpolate aperture widths
  // E1: Top aperture narrow (closed gate, width ~ 30px), Bottom aperture wide open (width ~ 170px)
  // E2: Top aperture wide open (width ~ 170px), Bottom aperture narrow (closed gate, width ~ 30px)
  const topAperture = interpolate(e1ToE2Progress, [0, 0.45, 0.55, 1], [30, 24, 60, 180]);
  const bottomAperture = interpolate(e1ToE2Progress, [0, 0.45, 0.55, 1], [180, 60, 24, 30]);

  // Hinge offset for left and right protein domains
  const halfTop = topAperture / 2;
  const halfBot = bottomAperture / 2;

  // Subunit coloring
  const alphaColor = '#1E3A8A'; // Deep marine blue for Alpha subunit
  const alphaStroke = '#60A5FA';
  const betaColor = '#1E293B';  // Slate blue for regulatory Beta subunit
  const betaStroke = '#94A3B8';

  // State label
  const stateLabel =
    e1ToE2Progress < 0.35
      ? 'Cấu hình E1 (Mở trong)'
      : e1ToE2Progress > 0.65
      ? 'Cấu hình E2 (Mở ngoài)'
      : 'Trạng thái khóa trung gian';

  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${scale})`}
      className="sodium-potassium-pump-rig"
    >
      {/* 1. Left Protein Domain (Alpha Subunit Lobe) */}
      <path
        d={`
          M ${-halfTop - 15} -130
          C ${-halfTop - 80} -100, ${-halfTop - 110} -40, ${-halfTop - 100} 0
          C ${-halfTop - 90} 50, ${-halfBot - 80} 100, ${-halfBot - 20} 130
          L ${-halfBot} 125
          C ${-halfBot - 20} 80, ${-halfTop - 20} -20, ${-halfTop} -125
          Z
        `}
        fill={alphaColor}
        stroke={alphaStroke}
        strokeWidth={4}
      />

      {/* 2. Right Protein Domain (Alpha Subunit Lobe) */}
      <path
        d={`
          M ${halfTop + 15} -130
          C ${halfTop + 80} -100, ${halfTop + 110} -40, ${halfTop + 100} 0
          C ${halfTop + 90} 50, ${halfBot + 80} 100, ${halfBot + 20} 130
          L ${halfBot} 125
          C ${halfBot + 20} 80, ${halfTop + 20} -20, ${halfTop} -125
          Z
        `}
        fill={alphaColor}
        stroke={alphaStroke}
        strokeWidth={4}
      />

      {/* 3. Beta Regulatory Glycoprotein Subunit (Anchored on outer surface) */}
      <path
        d={`
          M ${halfTop + 50} -120
          Q ${halfTop + 90} -160, ${halfTop + 110} -110
          T ${halfTop + 70} -60
        `}
        fill="none"
        stroke={betaStroke}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle
        cx={halfTop + 110}
        cy={-110}
        r={14}
        fill="#38BDF8"
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* 4. Central Gating Channel / Ion Binding Pockets */}
      {/* 3 Sodium Binding Sites (Prominent in E1) */}
      {e1ToE2Progress < 0.7 && (
        <g opacity={1.0 - e1ToE2Progress * 0.8}>
          {/* Site 1 */}
          <circle
            cx={-35}
            cy={25}
            r={24}
            fill={boundNaCount >= 1 ? '#F59E0B' : 'rgba(245, 158, 11, 0.2)'}
            stroke="#F59E0B"
            strokeWidth={3}
            strokeDasharray={boundNaCount >= 1 ? 'none' : '4 3'}
          />
          {boundNaCount >= 1 && (
            <text x={-35} y={34} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              Na⁺
            </text>
          )}

          {/* Site 2 */}
          <circle
            cx={0}
            cy={-10}
            r={24}
            fill={boundNaCount >= 2 ? '#F59E0B' : 'rgba(245, 158, 11, 0.2)'}
            stroke="#F59E0B"
            strokeWidth={3}
            strokeDasharray={boundNaCount >= 2 ? 'none' : '4 3'}
          />
          {boundNaCount >= 2 && (
            <text x={0} y={-1} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              Na⁺
            </text>
          )}

          {/* Site 3 */}
          <circle
            cx={35}
            cy={25}
            r={24}
            fill={boundNaCount >= 3 ? '#F59E0B' : 'rgba(245, 158, 11, 0.2)'}
            stroke="#F59E0B"
            strokeWidth={3}
            strokeDasharray={boundNaCount >= 3 ? 'none' : '4 3'}
          />
          {boundNaCount >= 3 && (
            <text x={35} y={34} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              Na⁺
            </text>
          )}
        </g>
      )}

      {/* 2 Potassium Binding Sites (Prominent in E2) */}
      {e1ToE2Progress > 0.3 && (
        <g opacity={(e1ToE2Progress - 0.3) / 0.7}>
          {/* Site 1 */}
          <circle
            cx={-30}
            cy={-20}
            r={28}
            fill={boundKCount >= 1 ? '#8B5CF6' : 'rgba(139, 92, 246, 0.2)'}
            stroke="#8B5CF6"
            strokeWidth={3}
            strokeDasharray={boundKCount >= 1 ? 'none' : '4 3'}
          />
          {boundKCount >= 1 && (
            <text x={-30} y={-10} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              K⁺
            </text>
          )}

          {/* Site 2 */}
          <circle
            cx={30}
            cy={-20}
            r={28}
            fill={boundKCount >= 2 ? '#8B5CF6' : 'rgba(139, 92, 246, 0.2)'}
            stroke="#8B5CF6"
            strokeWidth={3}
            strokeDasharray={boundKCount >= 2 ? 'none' : '4 3'}
          />
          {boundKCount >= 2 && (
            <text x={30} y={-10} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
              K⁺
            </text>
          )}
        </g>
      )}

      {/* 5. Intracellular Phosphorylation Domain & Aspartate Residue (Asp369) */}
      <g transform={`translate(${halfBot + 40}, 110)`}>
        {/* Aspartate Docking Pocket */}
        <path
          d="M -20 -15 L 20 -15 L 25 20 L -25 20 Z"
          fill="#334155"
          stroke="#64748B"
          strokeWidth={2}
        />
        <text
          x={0}
          y={6}
          fill="#CBD5E1"
          fontSize={30}
          fontWeight={800}
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Asp369
        </text>

        {/* Covalent Phosphate Bond when Phosphorylated */}
        {isPhosphorylated && (
          <g transform="translate(0, 45)">
            <line
              x1={0}
              y1={-25}
              x2={0}
              y2={-5}
              stroke="#EF4444"
              strokeWidth={5}
            />
            <circle
              cx={0}
              cy={0}
              r={22}
              fill="#EF4444"
              stroke="#FCA5A5"
              strokeWidth={3}
            />
            <text
              x={0}
              y={9}
              fill="#FFFFFF"
              fontSize={30}
              fontWeight={900}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              ~P
            </text>
            <text
              x={45}
              y={7}
              fill="#EF4444"
              fontSize={30}
              fontWeight={800}
              fontFamily="sans-serif"
            >
              (Phosphoryl hóa)
            </text>
          </g>
        )}
      </g>

      {/* 6. Active State Indicator Badge below Pump (Disabled by default to prevent collisions) */}
      {showStateBadge && (
        <g transform="translate(0, 190)">
          <rect
            x={-220}
            y={-28}
            width={440}
            height={54}
            rx={20}
            fill="rgba(30, 58, 138, 0.4)"
            stroke="#60A5FA"
            strokeWidth={2}
          />
          <text
            x={0}
            y={9}
            fill="#93C5FD"
            fontSize={30}
            fontWeight={800}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            {stateLabel}
          </text>
        </g>
      )}
    </g>
  );
};
