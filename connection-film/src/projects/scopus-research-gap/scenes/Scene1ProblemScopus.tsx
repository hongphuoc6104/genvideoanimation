import React from 'react';
import { useCurrentFrame } from 'remotion';
import { useBeatChoreography, SafeStageZone } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { KnowledgeConstellationMechanism } from '../components/KnowledgeConstellation';
import { ThreeQuestionsTriangleMechanism } from '../components/ThreeQuestionsTriangle';
import { KeystonePillars } from '../components/KeystonePillars';
import { ResearcherRig, type ResearcherPoseType } from '../components/ResearcherRig';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene1ProblemScopus: React.FC<SceneProps> = ({
  durationInFrames = 996,
  shotBeats = [],
}) => {
  const frame = useCurrentFrame();
  const { currentBeatIndex, beatProgress, relativeFrame, beatStartRelFrame } = useBeatChoreography(shotBeats);
  const relativeBeatFrame = Math.max(0, relativeFrame - beatStartRelFrame);

  // Manuscript state across Beats 0-2 (Zero-Ghosting & Anti-Freeze Progression)
  const manuscriptState =
    currentBeatIndex === 0 ? 'rejected' :
    currentBeatIndex === 1 ? 'connecting' : 'integrated';

  const highlightChasm = currentBeatIndex >= 1;

  // Zero-Ghosting Stage Lifecycle:
  // Beat 0, 1, 2: Constellation (Desk reject paradox & dialog network)
  // Beat 3: 3 Core Questions Triangle (Golden Triangle)
  // Beat 4: 4 Mandatory Keystone Pillars (Swales CARS)
  const isConstellationStage = currentBeatIndex <= 2;
  const isTriangleStage = currentBeatIndex === 3;
  const isPillarsStage = currentBeatIndex >= 4;

  // Character Kinematic Pose based on beat
  // Beat 0: Desk reject paradox -> 'puzzled'
  // Beat 1: Searching for gap -> 'analyzing'
  // Beat 2: Scientific dialogue network -> 'discovering'
  const researcherPose: ResearcherPoseType =
    currentBeatIndex === 0 ? 'puzzled' :
    currentBeatIndex === 1 ? 'analyzing' : 'discovering';

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
        {/* Stage 1: Knowledge Constellation Mechanism (Beats 0-2) */}
        {isConstellationStage && (
          <>
            {/* Academic Researcher Rig on left observatory station */}
            <div
              style={{
                position: 'absolute',
                left: 40,
                top: 460,
                width: 260,
                height: 420,
                zIndex: 25,
                pointerEvents: 'none',
              }}
            >
              <ResearcherRig
                pose={researcherPose}
                frame={frame}
                showGlasses
                showPaper={currentBeatIndex === 0}
                showMagnifier={currentBeatIndex === 1}
                showIdeaBulb={currentBeatIndex === 2}
                scale={0.78}
              />
            </div>

            <KnowledgeConstellationMechanism
              manuscriptState={manuscriptState}
              highlightChasm={highlightChasm}
            />
          </>
        )}

        {/* Stage 2: 3 Core Questions Triangle Mechanism (Beat 3) */}
        {isTriangleStage && (
          <ThreeQuestionsTriangleMechanism
            relativeBeatFrame={relativeBeatFrame}
            beatProgress={beatProgress}
          />
        )}

        {/* Stage 3: 4 Architectural Keystone Pillars Mechanism (Beat 4) */}
        {isPillarsStage && (
          <KeystonePillars
            relativeBeatFrame={relativeBeatFrame}
            beatProgress={beatProgress}
          />
        )}
      </SafeStageZone>
    </div>
  );
};
