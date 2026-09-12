import React from 'react';
import { useBeatChoreography, SafeStageZone } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { OpticalPrismsRefractionMechanism } from '../components/OpticalPrismsRefraction';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene2GapTaxonomy: React.FC<SceneProps> = ({
  durationInFrames = 972,
  shotBeats = [],
}) => {
  const { currentBeatIndex, beatProgress, relativeFrame, beatStartRelFrame } = useBeatChoreography(shotBeats);
  const relativeBeatFrame = Math.max(0, relativeFrame - beatStartRelFrame);

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

      {/* Stage Boundary Protection */}
      <SafeStageZone>
        {/* Primary Kinetic Mechanism: Optical Crystal Refraction Laser Beams */}
        <OpticalPrismsRefractionMechanism
          activeGapIndex={activeGapIndex}
          relativeBeatFrame={relativeBeatFrame}
          beatProgress={beatProgress}
        />
      </SafeStageZone>
    </div>
  );
};
