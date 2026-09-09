import React from 'react';
import { motivatedIris } from '../motivated-transitions';

export interface MotivatedIrisTransitionProps {
  frame: number;
  startFrame: number;
  duration?: number;
  focalPoint?: [number, number];
  clipId?: string;
  children: React.ReactNode;
}

/**
 * MOTIVATED IRIS TRANSITION COMPONENT
 * Clips children to an expanding or contracting circular wipe centered on a narrative focal point.
 */
export const MotivatedIrisTransition: React.FC<MotivatedIrisTransitionProps> = ({
  frame,
  startFrame,
  duration = 24,
  focalPoint = [960, 540],
  clipId = 'motivated-iris-clip',
  children,
}) => {
  const iris = motivatedIris(frame, startFrame, duration, { focalPoint, direction: 'out' });

  return (
    <g data-transition="motivated-iris">
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <circle cx={iris.cx} cy={iris.cy} r={iris.radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} opacity={iris.opacity}>
        {children}
      </g>
    </g>
  );
};
