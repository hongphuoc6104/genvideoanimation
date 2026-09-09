import React from 'react';
import { BaseCharacterPose, RigProps } from '../rig-interface';
import { squashStretch } from '../motion-primitives';

export interface CustomRigRenderContext<TPose extends BaseCharacterPose = BaseCharacterPose> {
  pose: TPose;
  scaleX: number;
  scaleY: number;
  flip: boolean;
  color: string;
  accent: string;
  customProps: Record<string, any>;
}

export interface CustomRigAdapterProps<TPose extends BaseCharacterPose = BaseCharacterPose>
  extends RigProps<TPose> {
  renderRig?: (context: CustomRigRenderContext<TPose>) => React.ReactNode;
}

/**
 * ARBITRARY CUSTOM RIG ADAPTER
 * Adapts arbitrary vector artwork, SVGs, or procedural characters to the unified RigInterface.
 * Guarantees root transformation, scale, volume-conserving squash/stretch, and pose access.
 */
export function CustomRigAdapter<TPose extends BaseCharacterPose = BaseCharacterPose>({
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  color = '#4ecdc4',
  accent = '#ffd16c',
  secondaryColor = '#ff6b78',
  pose = { squash: 1.0, bodyTilt: 0, bodyY: 0 } as TPose,
  customProps = {},
  renderRig,
  children,
}: CustomRigAdapterProps<TPose>): React.ReactElement {
  const {
    bodyX = 0,
    bodyY = 0,
    bodyTilt = 0,
    squash = 1.0,
  } = pose;

  const { scaleX, scaleY } = squashStretch(squash);
  const flipSign = flip ? -1 : 1;

  const context: CustomRigRenderContext<TPose> = {
    pose,
    scaleX,
    scaleY,
    flip,
    color,
    accent,
    customProps,
  };

  return (
    <g
      data-character-rig="custom-adapter"
      transform={`translate(${x}, ${y}) scale(${scale * flipSign}, ${scale})`}
    >
      <g
        data-part="adapter-torso"
        transform={`translate(${bodyX}, ${bodyY}) rotate(${bodyTilt}) scale(${scaleX}, ${scaleY})`}
      >
        {renderRig ? renderRig(context) : children}
      </g>
    </g>
  );
}
