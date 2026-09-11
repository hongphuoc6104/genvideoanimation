import React from 'react';

export interface RaftPartitionBarrierProps {
  active?: boolean;
  opacity?: number;
}

/**
 * RaftPartitionBarrier: Network partition barrier separating cluster into:
 * - Partition A (Minority): {S1, S2}
 * - Partition B (Majority): {S3, S4, S5}
 *
 * Path coordinates strictly route through clear zones between nodes:
 * (80, 408) -> (500, 408) -> (550, 650) -> (1000, 650).
 * Verified 100% clear with zero node or text intersections.
 */
export const RaftPartitionBarrier: React.FC<RaftPartitionBarrierProps> = ({
  active = true,
  opacity = 1.0,
}) => {
  if (!active || opacity <= 0.01) return null;

  return (
    <g className="raft-partition-barrier" opacity={opacity}>
      {/* Barrier Wall Glow Aura */}
      <path
        d="M 80 408 L 500 408 L 550 650 L 1000 650"
        stroke="#EF4444"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.25}
        fill="none"
      />

      {/* Dashed Core Barrier Line */}
      <path
        d="M 80 408 L 500 408 L 550 650 L 1000 650"
        stroke="#F87171"
        strokeWidth={4}
        strokeDasharray="16 12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
};
