import React from 'react';
import { useBeatChoreography, SafeStageZone } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { KnowledgeConstellationMechanism } from '../components/KnowledgeConstellation';
import { ThreeQuestionsTriangleMechanism } from '../components/ThreeQuestionsTriangle';
import { CarsFourPillarsMechanism } from '../components/CarsFourPillars';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene1ProblemScopus: React.FC<SceneProps> = ({
  durationInFrames = 618,
  shotBeats = [],
}) => {
  const { currentBeatIndex } = useBeatChoreography(shotBeats);

  // Manuscript state across Beats 0-2 (Zero-Ghosting & Anti-Freeze Progression)
  const manuscriptState =
    currentBeatIndex === 0 ? 'submitting' :
    currentBeatIndex === 1 ? 'rejected' : 'connecting';

  const highlightChasm = currentBeatIndex >= 1;

  // Zero-Ghosting Stage Lifecycle:
  // Beat 0, 1, 2: Constellation (Desk reject paradox & dialog network)
  // Beat 3: 3 Core Questions Triangle (Golden Triangle)
  // Beat 4: 4 Mandatory CARS Pillars (Swales CARS)
  const isConstellationStage = currentBeatIndex <= 2;
  const isTriangleStage = currentBeatIndex === 3;
  const isPillarsStage = currentBeatIndex >= 4;

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
      <ScopusMicroHUD currentSection={1} sectionTitle="ĐỐI THOẠI HỌC THUẬT" />

      {/* Strict Stage Boundary Protection */}
      <SafeStageZone>
        {/* Stage 1: Knowledge Constellation Mechanism (Unmounts completely at Beat 3) */}
        {isConstellationStage && (
          <KnowledgeConstellationMechanism
            manuscriptState={manuscriptState}
            highlightChasm={highlightChasm}
          />
        )}

        {/* Stage 2: 3 Core Questions Triangle Mechanism (Unmounts completely at Beat 4) */}
        {isTriangleStage && (
          <ThreeQuestionsTriangleMechanism />
        )}

        {/* Stage 3: 4 Mandatory CARS Pillars Mechanism (Beat 4+) */}
        {isPillarsStage && (
          <CarsFourPillarsMechanism />
        )}
      </SafeStageZone>
    </div>
  );
};
