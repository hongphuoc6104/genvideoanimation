import React from 'react';

export interface IonParticleProps {
  type: 'na' | 'k';
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
  label?: string;
  glow?: boolean;
}

export const IonParticle: React.FC<IonParticleProps> = ({
  type,
  x,
  y,
  scale = 1.0,
  opacity = 1.0,
  label,
  glow = true,
}) => {
  const isNa = type === 'na';
  const color = isNa ? '#F59E0B' : '#8B5CF6';
  const glowColor = isNa ? 'rgba(245, 158, 11, 0.4)' : 'rgba(139, 92, 246, 0.4)';
  const radius = isNa ? 26 : 32; // Potassium ion has larger ionic radius than Sodium
  const displayLabel = label || (isNa ? 'Na⁺' : 'K⁺');

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      opacity={opacity}
      style={{ transition: 'transform 0.1s ease' }}
    >
      {glow && (
        <circle
          cx={0}
          cy={0}
          r={radius + 12}
          fill={glowColor}
          filter="blur(4px)"
        />
      )}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={3}
      />
      <text
        x={0}
        y={isNa ? 10 : 11}
        fill="#FFFFFF"
        fontSize={30}
        fontWeight={800}
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        {displayLabel}
      </text>
    </g>
  );
};
