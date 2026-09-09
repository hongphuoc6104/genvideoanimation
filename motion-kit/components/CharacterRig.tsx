import React from 'react';
import { BirdRig } from '../src/rigs/BirdRig';
import { CharacterPose, RigProps } from '../src/rigs/RigInterface';

const defaultRig = new BirdRig();

export const CharacterRig: React.FC<RigProps<CharacterPose>> = (props) => {
  return defaultRig.render(props.pose, props) as React.ReactElement;
};
