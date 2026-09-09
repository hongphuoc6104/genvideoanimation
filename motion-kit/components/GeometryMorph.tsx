import React, { useMemo } from 'react';
import {
  Point2D,
  interpolateGeometry,
  pointsToSvgPath,
} from '../geometry-morph';
import { EasingFunction, heavy } from '../motion-profiles';

export interface GeometryMorphProps {
  startPoints: Point2D[];
  endPoints: Point2D[];
  progress: number; // 0 to 1
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeDashoffset?: number;
  wobble?: number;
  easing?: EasingFunction;
  vertexCount?: number;
  transform?: string;
  filter?: string;
  opacity?: number;
  children?: React.ReactNode;
}

/**
 * GEOMETRY MORPH COMPONENT
 * Renders a single, continuous SVG path deformed smoothly between two vector shapes.
 * Replaces faux conditional swapping with mathematical vertex interpolation.
 */
export const GeometryMorph: React.FC<GeometryMorphProps> = ({
  startPoints,
  endPoints,
  progress,
  fill = '#ffd16c',
  stroke = '#111333',
  strokeWidth = 4,
  strokeDasharray,
  strokeDashoffset,
  wobble = 0,
  easing = heavy,
  vertexCount = 64,
  transform,
  filter,
  opacity = 1,
  children,
}) => {
  const pathD = useMemo(() => {
    const interpolated = interpolateGeometry(startPoints, endPoints, progress, {
      wobble,
      easing,
      vertexCount,
    });
    return pointsToSvgPath(interpolated, true);
  }, [startPoints, endPoints, progress, wobble, easing, vertexCount]);

  return (
    <g data-morph="geometry" transform={transform} opacity={opacity}>
      <path
        d={pathD}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={filter}
      />
      {children}
    </g>
  );
};
