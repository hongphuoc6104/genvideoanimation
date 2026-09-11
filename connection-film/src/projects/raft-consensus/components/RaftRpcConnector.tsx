import React from 'react';
import {
  AutoClippingConnector,
  solveTwoBoxIntersection,
  type BoxDescriptor,
} from 'motion-kit';

export type RpcType = 'RequestVote' | 'VoteGranted' | 'AppendEntries' | 'Heartbeat' | 'Ack';

export interface RaftRpcConnectorProps {
  sourceBox: BoxDescriptor;
  targetBox: BoxDescriptor;
  rpcType: RpcType;
  progress?: number; // 0 to 1 travel progress
  active?: boolean;
}

export const RPC_COLORS: Record<RpcType, string> = {
  RequestVote: '#F59E0B',   // Amber
  VoteGranted: '#10B981',   // Emerald
  AppendEntries: '#38BDF8', // Cyan
  Heartbeat: '#60A5FA',     // Blue
  Ack: '#34D399',           // Mint green
};

/**
 * RaftRpcConnector: Visualizes RPC message propagation between server nodes.
 * Uses AutoClippingConnector to solve boundary intersections and ensure
 * zero penetration of server node cards.
 */
export const RaftRpcConnector: React.FC<RaftRpcConnectorProps> = ({
  sourceBox,
  targetBox,
  rpcType,
  progress = 1.0,
  active = true,
}) => {
  if (!active) return null;

  const color = RPC_COLORS[rpcType];
  const isHeartbeat = rpcType === 'Heartbeat';
  const dashArray = isHeartbeat ? '6 4' : undefined;

  // Solve exact boundary coordinates for the traveling message packet
  const solved = solveTwoBoxIntersection(sourceBox, targetBox, 6, 6);

  const packetX =
    solved.start.x + (solved.end.x - solved.start.x) * Math.min(1, Math.max(0, progress));
  const packetY =
    solved.start.y + (solved.end.y - solved.start.y) * Math.min(1, Math.max(0, progress));

  return (
    <g className={`raft-rpc-connector raft-rpc-${rpcType.toLowerCase()}`}>
      {/* Clipped Connector Line with Arrowhead */}
      <AutoClippingConnector
        source={sourceBox}
        target={targetBox}
        color={color}
        strokeWidth={isHeartbeat ? 2 : 3}
        strokeDasharray={dashArray}
        startGap={6}
        endGap={6}
        arrowhead="end"
        arrowheadSize={12}
        progress={progress}
      />

      {/* Animated Packet Token moving along clipped path */}
      {progress > 0.05 && progress < 0.95 && (
        <g transform={`translate(${packetX}, ${packetY})`}>
          {/* Outer glow aura */}
          <circle r={12} fill={color} opacity={0.3} />
          {/* Solid core packet */}
          <circle r={6} fill={color} />
        </g>
      )}
    </g>
  );
};
