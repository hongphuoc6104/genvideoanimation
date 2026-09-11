import React from 'react';

export interface LipidBilayerProps {
  membraneY?: number; // Center y of the membrane (e.g. 700)
  thickness?: number; // Total thickness of bilayer (e.g. 140)
  width?: number; // Canvas width (1080)
  pumpGapWidth?: number; // Gap left for the pump in the center (e.g. 300)
  pumpGapX?: number; // Center x of the pump gap (default 460)
  showLabels?: boolean;
  restingPotential?: number; // e.g. -70
}

export const LipidBilayer: React.FC<LipidBilayerProps> = ({
  membraneY = 700,
  thickness = 130,
  width = 920,
  pumpGapWidth = 280,
  pumpGapX = 460,
  showLabels = true,
  restingPotential = -70,
}) => {
  const halfT = thickness / 2;
  const topY = membraneY - halfT;
  const botY = membraneY + halfT;

  // Generate lipid heads along the bilayer on both sides of the gap
  const headRadius = 14;
  const headSpacing = 32;

  const leftEdge = pumpGapX - pumpGapWidth / 2;
  const rightEdge = pumpGapX + pumpGapWidth / 2;

  const leftHeads: number[] = [];
  for (let x = 16; x < leftEdge - 15; x += headSpacing) {
    leftHeads.push(x);
  }

  const rightHeads: number[] = [];
  for (let x = rightEdge + 25; x < width - 15; x += headSpacing) {
    rightHeads.push(x);
  }

  const allHeads = [...leftHeads, ...rightHeads];

  return (
    <g className="lipid-bilayer-model">
      {/* Extracellular Fluid Background Tint (Top, y < topY) */}
      <rect
        x={0}
        y={0}
        width={width}
        height={topY}
        fill="#0C192E"
        opacity={0.6}
      />

      {/* Intracellular Cytoplasm Background Tint (Bottom, y > botY) */}
      <rect
        x={0}
        y={botY}
        width={width}
        height={Math.max(0, 1920 - botY)}
        fill="#081422"
        opacity={0.6}
      />

      {/* Hydrophobic Membrane Core (Bilayer interior) */}
      <rect
        x={0}
        y={topY}
        width={width}
        height={thickness}
        fill="#0B1322"
        opacity={0.9}
      />

      {/* Phospholipid Tails (Wavy lines inside bilayer) */}
      {allHeads.map((x, i) => (
        <g key={`tail-${i}`}>
          {/* Outer leaflet tails pointing inward */}
          <path
            d={`M ${x - 4} ${topY + 12} Q ${x - 8} ${topY + 35} ${x - 2} ${membraneY - 6}`}
            stroke="#60A5FA"
            strokeWidth={3}
            fill="none"
            opacity={0.6}
          />
          <path
            d={`M ${x + 4} ${topY + 12} Q ${x + 8} ${topY + 35} ${x + 2} ${membraneY - 6}`}
            stroke="#60A5FA"
            strokeWidth={3}
            fill="none"
            opacity={0.6}
          />
          {/* Inner leaflet tails pointing inward */}
          <path
            d={`M ${x - 4} ${botY - 12} Q ${x - 8} ${botY - 35} ${x - 2} ${membraneY + 6}`}
            stroke="#34D399"
            strokeWidth={3}
            fill="none"
            opacity={0.6}
          />
          <path
            d={`M ${x + 4} ${botY - 12} Q ${x + 8} ${botY - 35} ${x + 2} ${membraneY + 6}`}
            stroke="#34D399"
            strokeWidth={3}
            fill="none"
            opacity={0.6}
          />
        </g>
      ))}

      {/* Phospholipid Hydrophilic Heads */}
      {allHeads.map((x, i) => (
        <g key={`head-${i}`}>
          {/* Outer Leaflet Heads (Facing Extracellular) */}
          <circle
            cx={x}
            cy={topY}
            r={headRadius}
            fill="#3B82F6"
            stroke="#93C5FD"
            strokeWidth={2}
          />
          {/* Inner Leaflet Heads (Facing Cytoplasm) */}
          <circle
            cx={x}
            cy={botY}
            r={headRadius}
            fill="#10B981"
            stroke="#6EE7B7"
            strokeWidth={2}
          />
        </g>
      ))}

      {/* Membrane Boundary Separators */}
      <line
        x1={0}
        y1={topY}
        x2={width}
        y2={topY}
        stroke="#3B82F6"
        strokeWidth={2}
        opacity={0.4}
        strokeDasharray="8 8"
      />
      <line
        x1={0}
        y1={botY}
        x2={width}
        y2={botY}
        stroke="#10B981"
        strokeWidth={2}
        opacity={0.4}
        strokeDasharray="8 8"
      />

      {/* Zone Annotations & Ion Concentrations */}
      {showLabels && (
        <>
          {/* Extracellular Fluid Label (Top) */}
          <g transform="translate(60, 70)">
            <rect
              x={-15}
              y={-30}
              width={280}
              height={50}
              rx={16}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              strokeWidth={2}
            />
            <text
              x={125}
              y={6}
              fill="#93C5FD"
              fontSize={32}
              fontWeight={800}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              DỊCH NGOẠI BÀO
            </text>
            <text
              x={125}
              y={55}
              fill="#FCD34D"
              fontSize={32}
              fontWeight={700}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              [Na⁺] cao (145 mM)
            </text>
          </g>

          {/* Cytoplasm Label (Bottom) */}
          <g transform={`translate(60, ${botY + 50})`}>
            <rect
              x={-15}
              y={-30}
              width={280}
              height={50}
              rx={16}
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10B981"
              strokeWidth={2}
            />
            <text
              x={125}
              y={6}
              fill="#A7F3D0"
              fontSize={32}
              fontWeight={800}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              TẾ BÀO CHẤT
            </text>
            <text
              x={125}
              y={55}
              fill="#C4B5FD"
              fontSize={32}
              fontWeight={700}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              [K⁺] cao (140 mM)
            </text>
          </g>

          {/* Resting Membrane Potential Voltmeter Indicator */}
          <g transform="translate(760, 70)">
            <rect
              x={-20}
              y={-30}
              width={220}
              height={90}
              rx={16}
              fill="rgba(239, 68, 68, 0.15)"
              stroke="#EF4444"
              strokeWidth={2}
            />
            <text
              x={90}
              y={10}
              fill="#FCA5A5"
              fontSize={30}
              fontWeight={700}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Điện Thế Nghỉ
            </text>
            <text
              x={90}
              y={48}
              fill="#FFFFFF"
              fontSize={36}
              fontWeight={900}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {restingPotential} mV
            </text>
          </g>
        </>
      )}
    </g>
  );
};
