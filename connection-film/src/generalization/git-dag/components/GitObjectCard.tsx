import React from 'react';
import { spring, useCurrentFrame } from 'remotion';

export interface GitObjectCardProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  type: 'BLOB' | 'TREE' | 'COMMIT';
  hash: string;
  title: string;
  details: string[];
  color?: string;
  appearFrame?: number;
}

export const GitObjectCard: React.FC<GitObjectCardProps> = ({
  x,
  y,
  width = 720,
  height = 240,
  type,
  hash,
  title,
  details,
  color = '#0284C7',
  appearFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - appearFrame);

  const scale = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 14, stiffness: 85 },
  });

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Background Box */}
      <rect
        x={-width / 2}
        y={0}
        width={width}
        height={height}
        rx={18}
        ry={18}
        fill="#1E293B"
        stroke={color}
        strokeWidth={4}
      />

      {/* Header Accent Bar */}
      <rect
        x={-width / 2}
        y={0}
        width={width}
        height={60}
        rx={18}
        ry={18}
        fill={color}
      />
      {/* Flatten bottom corners of header */}
      <rect
        x={-width / 2}
        y={40}
        width={width}
        height={20}
        fill={color}
      />

      {/* Type Badge & Title */}
      <text
        x={-width / 2 + 24}
        y={42}
        fill="#FFFFFF"
        fontSize={38}
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        {type}: {title}
      </text>

      {/* Hash Label */}
      <text
        x={width / 2 - 24}
        y={42}
        textAnchor="end"
        fill="#F8FAFC"
        fontSize={30}
        fontWeight="bold"
        fontFamily="monospace"
      >
        [{hash.slice(0, 7)}]
      </text>

      {/* Details List */}
      {details.map((detail, idx) => (
        <text
          key={idx}
          x={-width / 2 + 28}
          y={105 + idx * 42}
          fill="#E2E8F0"
          fontSize={32}
          fontWeight="500"
          fontFamily="monospace"
        >
          {detail}
        </text>
      ))}
    </g>
  );
};
