import React from 'react';

export interface ATPMechanismProps {
  x: number;
  y: number;
  hydrolysisProgress?: number; // 0.0 = intact ATP, 1.0 = ADP detached + Pi transferred
  opacity?: number;
  scale?: number;
}

export const ATPMechanism: React.FC<ATPMechanismProps> = ({
  x,
  y,
  hydrolysisProgress = 0,
  opacity = 1.0,
  scale = 1.0,
}) => {
  // Phosphates: P1, P2, P3
  // P3 is the terminal high-energy phosphate transferred to Aspartate
  // ADP (Adenosine + P1 + P2) moves away as hydrolysisProgress approaches 1.0
  const adpOffsetX = -hydrolysisProgress * 120;
  const adpOffsetY = hydrolysisProgress * 80;
  const adpOpacity = 1.0 - hydrolysisProgress * 0.7;

  // P3 moves towards the phosphorylation binding site
  const p3OffsetY = -hydrolysisProgress * 40;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      opacity={opacity}
      className="atp-mechanism-model"
    >
      {/* ADP Part (Adenosine core + 2 Phosphates) */}
      <g
        transform={`translate(${adpOffsetX}, ${adpOffsetY})`}
        opacity={adpOpacity}
      >
        {/* Adenosine Nucleotide Base Ring */}
        <rect
          x={-140}
          y={-25}
          width={70}
          height={50}
          rx={12}
          fill="#3B82F6"
          stroke="#93C5FD"
          strokeWidth={2.5}
        />
        <text
          x={-105}
          y={8}
          fill="#FFFFFF"
          fontSize={30}
          fontWeight={800}
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Ado
        </text>

        {/* Ribose Connector */}
        <line
          x1={-70}
          y1={0}
          x2={-50}
          y2={0}
          stroke="#60A5FA"
          strokeWidth={4}
        />

        {/* Phosphate 1 (Alpha) */}
        <circle
          cx={-30}
          cy={0}
          r={18}
          fill="#F59E0B"
          stroke="#FDE68A"
          strokeWidth={2.5}
        />
        <text
          x={-30}
          y={8}
          fill="#FFFFFF"
          fontSize={30}
          fontWeight={800}
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          P
        </text>

        {/* High-energy Bond ~ */}
        <line
          x1={-12}
          y1={0}
          x2={8}
          y2={0}
          stroke="#F59E0B"
          strokeWidth={4}
          strokeDasharray="4 2"
        />

        {/* Phosphate 2 (Beta) */}
        <circle
          cx={28}
          cy={0}
          r={18}
          fill="#F59E0B"
          stroke="#FDE68A"
          strokeWidth={2.5}
        />
        <text
          x={28}
          y={8}
          fill="#FFFFFF"
          fontSize={30}
          fontWeight={800}
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          P
        </text>

        {/* Label: ATP or ADP */}
        <text
          x={-50}
          y={45}
          fill={hydrolysisProgress > 0.5 ? '#9CA3AF' : '#FCD34D'}
          fontSize={30}
          fontWeight={800}
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          {hydrolysisProgress > 0.5 ? 'ADP (Thoát ra)' : 'ATP (Gắn kết)'}
        </text>
      </g>

      {/* High-energy terminal bond to Gamma Phosphate */}
      {hydrolysisProgress < 0.6 && (
        <line
          x1={46}
          y1={0}
          x2={70}
          y2={0}
          stroke="#EF4444"
          strokeWidth={4}
          strokeDasharray="3 3"
        />
      )}

      {/* Terminal High-Energy Phosphate 3 (Gamma) transferred to Pump Aspartate */}
      <g transform={`translate(${88}, ${p3OffsetY})`}>
        {/* Glow */}
        <circle
          cx={0}
          cy={0}
          r={28}
          fill="rgba(239, 68, 68, 0.4)"
          filter="blur(4px)"
        />
        <circle
          cx={0}
          cy={0}
          r={20}
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
          P
        </text>
        <text
          x={0}
          y={44}
          fill="#FCA5A5"
          fontSize={30}
          fontWeight={800}
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          Pi (Nhóm P)
        </text>
      </g>
    </g>
  );
};
