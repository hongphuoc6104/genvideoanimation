import React from 'react';
import { useBeatChoreography, SafeStageZone } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { SemCausalGraph } from '../components/SemCausalGraph';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene4TemplateCaseStudy: React.FC<SceneProps> = ({
  durationInFrames = 773,
  shotBeats = [],
}) => {
  const { currentBeatIndex, beatProgress, relativeFrame, beatStartRelFrame } = useBeatChoreography(shotBeats);
  const relativeBeatFrame = Math.max(0, relativeFrame - beatStartRelFrame);

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
      <ScopusMicroHUD currentSection={4} sectionTitle="MÔ HÌNH THỰC THI SEM" />

      {/* Stage Boundary Protection */}
      <SafeStageZone>
        {/* Primary Kinetic Mechanism: Structural Equation Model DAG with Salience */}
        <SemCausalGraph
          currentBeatIndex={currentBeatIndex}
          relativeBeatFrame={relativeBeatFrame}
          beatProgress={beatProgress}
        />
      </SafeStageZone>
    </div>
  );
};
