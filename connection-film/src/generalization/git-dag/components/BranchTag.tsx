import React from 'react';
import { spring, useCurrentFrame } from 'remotion';

export interface BranchTagProps {
  x: number;
  y: number;
  name: string;
  color?: string;
  isHead?: boolean;
  appearFrame?: number;
}

export const BranchTag: React.FC<BranchTagProps> = ({
  x,
  y,
  name,
  color = '#10B981',
  isHead = false,
  appearFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - appearFrame);

  const scale = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 14, stiffness: 85 },
  });

  const tagWidth = Math.max(160, name.length * 18 + 40);
  const tagHeight = 54;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Pointer triangle pointing down to the commit node */}
      <polygon
        points={`0,0 -12,-16 12,-16`}
        fill={color}
      />

      {/* Tag Rectangle */}
      <rect
        x={-tagWidth / 2}
        y={-16 - tagHeight}
        width={tagWidth}
        height={tagHeight}
        rx={10}
        ry={10}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Head / Branch Label */}
      <text
        x={0}
        y={-16 - tagHeight / 2 + 10}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={30}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {isHead ? `HEAD -> ${name}` : name}
      </text>
    </g>
  );
};
