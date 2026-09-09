/**
 * RIG INTERFACE & KINEMATICS CONTRACTS
 * Core types, interface contracts, and forward kinematics utilities
 * for articulated 2D vector characters.
 */

import React from 'react';

export type RigType = 'bird' | 'human' | 'custom';

export interface RigJoint {
  id: string;
  name: string;
  parent?: string;
  position: { x: number; y: number };
  rotation: number;
  scaleX?: number;
  scaleY?: number;
}

export interface RigGeometryLayer {
  id: string;
  zIndex: number;
  render: (
    jointTransforms: Record<string, { x: number; y: number; rotation: number }>,
    expressiveParams: Record<string, number>
  ) => React.ReactNode;
}

export interface CharacterPose {
  // Flat kinematics (backward compatibility & direct bindings)
  bodyX?: number;
  bodyY?: number;
  bodyTilt?: number;
  squash?: number; // scaleY (scaleX = 1 / sqrt(scaleY))
  headAngle?: number;
  headY?: number;
  eyeGazeX?: number;
  eyeGazeY?: number;
  eyeScale?: number;
  blink?: boolean;
  mouthOpen?: number;
  mouthSmile?: number;
  eyebrowRaise?: number;
  hairSway?: number;

  // Avian flat properties
  wingLeftAngle?: number;
  wingRightAngle?: number;
  wingLeftFold?: number;
  wingRightFold?: number;
  legBend?: number;
  legLeftAngle?: number;
  legRightAngle?: number;
  beakOpen?: number;
  beakTilt?: number;
  tailAngle?: number;

  // Human flat properties
  armLeftAngle?: number;
  armRightAngle?: number;
  elbowLeftAngle?: number;
  elbowRightAngle?: number;
  handLeftPose?: 'open' | 'fist' | 'point' | 'hold' | 'wave';
  handRightPose?: 'open' | 'fist' | 'point' | 'hold' | 'wave';
  kneeLeftBend?: number;
  kneeRightBend?: number;

  // Hierarchical Structures
  root?: {
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    squash?: number;
  };
  rootOffset?: { x?: number; y?: number };
  torsoOffset?: { x?: number; y?: number };
  torsoAngle?: number;
  head?: { rotation?: number; x?: number; y?: number; [key: string]: any };
  limbs?: Record<string, { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number; [key: string]: any }>;
  expression?: {
    gazeX?: number;
    gazeY?: number;
    mouthOpen?: number;
    mouthShape?: string;
    eyebrowTilt?: number;
    eyebrowRaise?: number;
    eyeScale?: number;
    expression?: string;
    [key: string]: any;
  };
  customChannels?: Record<string, number>;
  [key: string]: any;
}

export type BaseCharacterPose = CharacterPose;
export type BirdPose = CharacterPose;
export type HumanPose = CharacterPose;
export type HumanRigProps = RigProps<CharacterPose>;
export type BirdRigProps = RigProps<CharacterPose>;
export type CharacterRigProps = RigProps<CharacterPose>;

export interface RigRenderOptions {
  palette?: Record<string, string>;
  width?: number;
  height?: number;
  scale?: number;
  x?: number;
  y?: number;
  flip?: boolean;
  color?: string;
  accent?: string;
  secondaryColor?: string;
  pose?: CharacterPose;
  customProps?: Record<string, any>;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface RigInterface {
  readonly id: string;
  readonly type: RigType;
  defaultPose: CharacterPose;
  getJoints(pose?: CharacterPose): Record<string, RigJoint>;
  getJointPivots(): Record<string, [number, number] | { x: number; y: number }>;
  getLayers(): RigGeometryLayer[];
  render(pose?: CharacterPose, options?: RigRenderOptions): React.ReactNode;
}

export const RigInterface = {
  id: 'RigInterface',
  version: '2.0.0',
};

export interface RigProps<TPose extends CharacterPose = CharacterPose> extends RigRenderOptions {
  pose?: TPose;
}

export type RigComponent<TPose extends CharacterPose = CharacterPose> = React.FC<RigProps<TPose>>;

// ---------------------------------------------------------------------------
// Kinematic & Mathematical Helper Functions
// ---------------------------------------------------------------------------

/**
 * Calculates world-space joint position by applying parent position and orientation.
 * θ = parentPos.rotation * π / 180
 * x_world = x_parent + x_child * cos(θ) - y_child * sin(θ)
 * y_world = y_parent + x_child * sin(θ) + y_child * cos(θ)
 */
export function computeWorldJointPosition(
  parentPos: { x: number; y: number; rotation: number },
  childOffset: { x: number; y: number }
): { x: number; y: number } {
  const rad = ((parentPos.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: parentPos.x + childOffset.x * cos - childOffset.y * sin,
    y: parentPos.y + childOffset.x * sin + childOffset.y * cos,
  };
}

/**
 * Safely clamps expressive facial parameters into valid physiological domains.
 */
export function clampExpressionParams(params: any): Record<string, number> {
  if (!params || typeof params !== 'object') {
    return { gazeX: 0, gazeY: 0, mouthOpen: 0, eyebrowRaise: 0, mouthSmile: 0, eyeScale: 1 };
  }

  const gazeX = params.gazeX !== undefined ? Math.max(-1.0, Math.min(1.0, params.gazeX)) : 0;
  const gazeY = params.gazeY !== undefined ? Math.max(-1.0, Math.min(1.0, params.gazeY)) : 0;
  const mouthOpen = params.mouthOpen !== undefined ? Math.max(0.0, Math.min(1.0, params.mouthOpen)) : 0;
  const eyebrowRaise = params.eyebrowRaise !== undefined ? Math.max(-1.0, Math.min(1.0, params.eyebrowRaise)) : 0;
  const mouthSmile = params.mouthSmile !== undefined ? Math.max(-1.0, Math.min(1.0, params.mouthSmile)) : 0;
  const eyeScale = params.eyeScale !== undefined ? Math.max(0.0, Math.min(5.0, params.eyeScale)) : 1.0;

  return {
    ...params,
    gazeX,
    gazeY,
    mouthOpen,
    eyebrowRaise,
    mouthSmile,
    eyeScale,
  };
}

export interface JointMatrixResult {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

/**
 * Calculates 2D affine transformation matrix for SVG rendering:
 * [a  c tx]   [scaleX*cos(θ) -scaleY*sin(θ) tx]
 * [b  d ty] = [scaleX*sin(θ)  scaleY*cos(θ) ty]
 * [0  0  1]   [     0               0       1 ]
 *
 * Guarantees finite coefficients even under extreme scale and massive rotations.
 */
export function computeJointMatrix(params: {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}): JointMatrixResult {
  const rotDeg = (params.rotation ?? 0) % 360;
  const rad = (rotDeg * Math.PI) / 180;
  const scaleX = params.scaleX !== undefined && Number.isFinite(params.scaleX) ? params.scaleX : 1.0;
  const scaleY = params.scaleY !== undefined && Number.isFinite(params.scaleY) ? params.scaleY : 1.0;

  const a = scaleX * Math.cos(rad);
  const b = scaleX * Math.sin(rad);
  const c = -scaleY * Math.sin(rad);
  const d = scaleY * Math.cos(rad);
  const tx = params.x !== undefined && Number.isFinite(params.x) ? params.x : 0;
  const ty = params.y !== undefined && Number.isFinite(params.y) ? params.y : 0;

  return {
    a: Number.isFinite(a) ? a : 1.0,
    b: Number.isFinite(b) ? b : 0.0,
    c: Number.isFinite(c) ? c : 0.0,
    d: Number.isFinite(d) ? d : 1.0,
    tx: Number.isFinite(tx) ? tx : 0.0,
    ty: Number.isFinite(ty) ? ty : 0.0,
  };
}

/**
 * Resolves topological order of joint kinematic chain, verifying no circular dependencies.
 * If a cycle is detected, throws descriptive error matching /cyclic joint hierarchy/i.
 */
export function solveKinematicChain(
  hierarchy: Record<string, { id: string; parent?: string }>
): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const inPath = new Set<string>();

  function visit(id: string) {
    if (inPath.has(id)) {
      throw new Error(`Cyclic joint hierarchy detected: joint "${id}" references an ancestor in its hierarchy chain.`);
    }
    if (visited.has(id)) {
      return;
    }
    inPath.add(id);
    const node = hierarchy[id];
    if (node && node.parent && hierarchy[node.parent]) {
      visit(node.parent);
    }
    inPath.delete(id);
    visited.add(id);
    order.push(id);
  }

  for (const id of Object.keys(hierarchy)) {
    if (!visited.has(id)) {
      visit(id);
    }
  }

  return order;
}
