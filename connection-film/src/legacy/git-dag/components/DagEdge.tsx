import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';

export interface DagEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number | string;
  appearFrame?: number;
  isDashed?: boolean;
}

export const DagEdge: React.FC<DagEdgeProps> = ({
  x1,
  y1,
  x2,
  y2,
  stroke = '#38BDF8',
  strokeWidth = 5,
  appearFrame = 0,
  isDashed = false,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - appearFrame);

  const progress = spring({
    frame: localFrame,
    fps: 30,
    config: { damping: 14, stiffness: 85 },
  });

  // Calculate current end coordinate based on spring growth
  const curX2 = x1 + (x2 - x1) * progress;
  const curY2 = y1 + (y2 - y1) * progress;

  // Calculate arrow head coordinates at curX2, curY2 pointing from (x1, y1) to (curX2, curY2)
  const angle = Math.atan2(curY2 - y1, curX2 - x1);
  const arrowLength = 18;
  const arrowAngle = Math.PI / 6; // 30 degrees

  const ax1 = curX2 - arrowLength * Math.cos(angle - arrowAngle);
  const ay1 = curY2 - arrowLength * Math.sin(angle - arrowAngle);
  const ax2 = curX2 - arrowLength * Math.cos(angle + arrowAngle);
  const ay2 = curY2 - arrowLength * Math.sin(angle + arrowAngle);

  return (
    <g opacity={interpolate(progress, [0, 0.2], [0, 1], { extrapolateRight: 'clamp' })}>
      {/* Edge Line */}
      <line
        x1={x1}
        y1={y1}
        x2={curX2}
        y2={curY2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={isDashed ? '10 8' : undefined}
        strokeLinecap="round"
      />

      {/* Arrow Head */}
      {progress > 0.4 && (
        <polygon
          points={`${curX2},${curY2} ${ax1},${ay1} ${ax2},${ay2}`}
          fill={stroke}
        />
      )}
    </g>
  );
};
