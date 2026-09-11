import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { FiveGapPrismsMechanism } from '../components/FiveGapPrismsMechanism';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene2GapTaxonomy: React.FC<SceneProps> = ({
  durationInFrames = 691,
  shotBeats = [],
}) => {
  const { currentBeatIndex } = useBeatChoreography(shotBeats);

  // Map 5 beats of shot 2 to the 5 gap prisms (0: Theory, 1: Empirical, 2: Context, 3: Method, 4: Practice)
  const activeGapIndex = Math.min(Math.max(0, currentBeatIndex), 4);

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        backgroundColor: '#0B1120',
        overflow: 'hidden',
      }}
    >
      {/* Semantic Micro HUD */}
      <ScopusMicroHUD currentSection={2} sectionTitle="5 CÁNH CỬA RESEARCH GAP" />

      {/* Primary Kinetic Mechanism: 5 Directional Refractive Gap Prisms */}
      <FiveGapPrismsMechanism activeGapIndex={activeGapIndex} />
    </div>
  );
};
