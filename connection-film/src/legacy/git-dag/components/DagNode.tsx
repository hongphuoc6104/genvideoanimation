import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';

export interface DagNodeProps {
  cx: number;
  cy: number;
  r?: number;
  hash: string;
  label?: string;
  fill?: string;
  stroke?: string;
  isActive?: boolean;
  appearFrame?: number;
}

export const DagNode: React.FC<DagNodeProps> = ({
  cx,
  cy,
  r = 52,
  hash,
  label,
  fill = '#0284C7',
  stroke = '#38BDF8',
  isActive = false,
  appearFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - appearFrame);

  const scale = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 14, stiffness: 85 },
  });

  const pulse = isActive
    ? 1 + 0.08 * Math.sin((frame / 30) * Math.PI * 2)
    : 1;

  const currentScale = scale * pulse;

  return (
    <g transform={`translate(${cx}, ${cy}) scale(${currentScale})`}>
      {/* Outer Glow for Active Node */}
      {isActive && (
        <circle
          cx={0}
          cy={0}
          r={r + 14}
          fill="none"
          stroke={stroke}
          strokeWidth={4}
          opacity={0.6}
        />
      )}

      {/* Main Node Circle */}
      <circle
        cx={0}
        cy={0}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={5}
      />

      {/* Commit Short SHA Hash */}
      <text
        x={0}
        y={label ? -8 : 10}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={30}
        fontWeight="bold"
        fontFamily="monospace"
        letterSpacing="-1px"
      >
        {hash.slice(0, 7)}
      </text>

      {/* Optional Commit Label */}
      {label && (
        <text
          x={0}
          y={28}
          textAnchor="middle"
          fill="#E0F2FE"
          fontSize={30}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
};
