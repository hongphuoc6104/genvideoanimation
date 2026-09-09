import type React from 'react';

/**
 * Morph Subsystem Type Definitions
 */

export type Point2D = [number, number];

export interface PhaseShiftResult {
  shiftIndex: number;
  optimalShift: number; // Tier 3 alias
  minDistanceSq: number;
  optimizedCost: number; // Tier 3 alias
  unshiftedCost: number; // Tier 3
  distance: number;
  reversed: boolean;
  alignedVertices?: Point2D[];
}

export interface MorphOptions {
  sampleCount?: number;
  closed?: boolean;
  precision?: number;
  wobble?: number;
}

export interface PathMorphProps extends React.SVGProps<SVGPathElement> {
  from: string;
  to: string;
  progress: number;
  sampleCount?: number;
  precision?: number;
  closed?: boolean;
  wobble?: number;
}
