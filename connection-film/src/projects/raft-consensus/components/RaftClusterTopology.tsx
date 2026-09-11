import React from 'react';
import {
  RadialLabelGroup,
  calculateRadialLayout,
  type BoxDescriptor,
  type RadialItemData,
} from 'motion-kit';

export type NodeRole = 'FOLLOWER' | 'CANDIDATE' | 'LEADER' | 'ISOLATED';

export interface NodeState {
  id: string;
  label: string;
  role: NodeRole;
  term: number;
  votesReceived?: number;
  active?: boolean;
}

export interface RaftClusterTopologyProps {
  nodes: NodeState[];
  activeNodeId?: string;
  centerX?: number;
  centerY?: number;
  radius?: number;
  staggerRadii?: [number, number];
}

const DEFAULT_CENTER_X = 540;
const DEFAULT_CENTER_Y = 640;
const DEFAULT_RADIUS = 240;
const DEFAULT_STAGGER_RADII: [number, number] = [230, 270];

// Specific polar angles with |sin| > 0.35 ensuring horizontal centering and safe bounds in [210, 905]px
const POLAR_ANGLES: Record<string, number> = {
  s1: -90,
  s2: -25,
  s3: 45,
  s4: 135,
  s5: 205,
};

export const ROLE_COLORS: Record<NodeRole, string> = {
  LEADER: '#10B981',
  CANDIDATE: '#F59E0B',
  FOLLOWER: '#94A3B8',
  ISOLATED: '#EF4444',
};

/**
 * Returns exact BoxDescriptor for each node in the polar layout.
 * Used by AutoClippingConnector to calculate boundary intersections.
 */
export function getClusterNodeBoxes(
  nodes: NodeState[],
  centerX = DEFAULT_CENTER_X,
  centerY = DEFAULT_CENTER_Y,
  radius = DEFAULT_RADIUS,
  staggerRadii: [number, number] = DEFAULT_STAGGER_RADII
): Record<string, BoxDescriptor> {
  const items: RadialItemData[] = nodes.map((n) => ({
    id: n.id,
    label: `${n.label}: ${n.role}`,
    color: ROLE_COLORS[n.role],
    width: 240,
    height: 110,
    rx: 18,
    angleDeg: POLAR_ANGLES[n.id] ?? -90,
  }));

  const layouts = calculateRadialLayout(
    centerX,
    centerY,
    radius,
    items,
    -90,
    360,
    'horizontal-pill',
    undefined,
    staggerRadii
  );

  const boxes: Record<string, BoxDescriptor> = {};
  layouts.forEach((l) => {
    boxes[l.item.id as string] = {
      x: l.pillX,
      y: l.pillY,
      cx: l.pillX + l.pillWidth / 2,
      cy: l.pillY + l.pillHeight / 2,
      width: l.pillWidth,
      height: l.pillHeight,
      cornerRadius: 18,
    };
  });
  return boxes;
}

/**
 * RaftClusterTopology: 5-server node cluster polar layout.
 * Uses RadialLabelGroup with Staggered Radii (R_odd != R_even) and OpaqueCard (Layer 1 solid #0F172A).
 */
export const RaftClusterTopology: React.FC<RaftClusterTopologyProps> = ({
  nodes,
  activeNodeId,
  centerX = DEFAULT_CENTER_X,
  centerY = DEFAULT_CENTER_Y,
  radius = DEFAULT_RADIUS,
  staggerRadii = DEFAULT_STAGGER_RADII,
}) => {
  const items: RadialItemData[] = nodes.map((n) => ({
    id: n.id,
    label: `${n.label}: ${n.role}`,
    color: ROLE_COLORS[n.role],
    width: 240,
    height: 110,
    rx: 18,
    angleDeg: POLAR_ANGLES[n.id] ?? -90,
  }));

  const activeIndex = activeNodeId
    ? nodes.findIndex((n) => n.id === activeNodeId)
    : undefined;

  return (
    <g className="raft-cluster-topology">
      {/* Polar layout coordinator with staggered radii and opaque shields */}
      <RadialLabelGroup
        centerX={centerX}
        centerY={centerY}
        radius={radius}
        staggerRadii={staggerRadii}
        items={items}
        activeItemIndex={activeIndex}
        useOpaqueShield={true}
        showRays={true}
        rayColor="#334155"
        rayWidth={2}
      />
    </g>
  );
};
