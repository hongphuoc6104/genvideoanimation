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

  const displayText = isHead ? `HEAD -> ${name}` : name;
  const tagWidth = Math.max(180, displayText.length * 20 + 56);
  const tagHeight = 60;

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
        rx={12}
        ry={12}
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
        {displayText}
      </text>
    </g>
  );
};
