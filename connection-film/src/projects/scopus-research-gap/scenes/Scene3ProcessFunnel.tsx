import React from 'react';
import { useCurrentFrame } from 'remotion';
import { useBeatChoreography, SafeStageZone } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { ResearchFunnelMechanism } from '../components/ResearchFunnelMechanism';
import { KnowledgeMatrixRadar } from '../components/KnowledgeMatrixRadar';
import { CantileverBridge } from '../components/CantileverBridge';
import { ResearcherRig } from '../components/ResearcherRig';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3ProcessFunnel: React.FC<SceneProps> = ({
  durationInFrames = 981,
  shotBeats = [],
}) => {
  const frame = useCurrentFrame();
  const { currentBeatIndex } = useBeatChoreography(shotBeats);

  // Clean Stage Separation:
  // Beat 0 (overall beat 11): Step 1 Research Funnel Narrowing
  // Beat 1 (overall beat 12): Step 2 4-Axis Orthogonal Knowledge Matrix Radar
  // Beat 2 (overall beat 13): Step 3 3-Condition Rigorous Filter (Niche)
  // Beat 3, 4 (overall beat 14, 15): Step 4 3-Tier Cantilever Bridge & Keystone Lock
  const isFunnelStep1 = currentBeatIndex === 0;
  const isRadarStep2 = currentBeatIndex === 1;
  const isFilterStep3 = currentBeatIndex === 2;
  const isBridgeStage = currentBeatIndex >= 3;

  // Progressive tier assembly for bridge:
  // beat 3 = tier 2 (tension gap & assembly), beat 4 = tier 3 (keystone locked)
  const activeTier: 1 | 2 | 3 = currentBeatIndex === 3 ? 2 : 3;

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
      <ScopusMicroHUD currentSection={3} sectionTitle="PHỄU & CẦU 3 TẦNG SWALES" />

      {/* Stage Boundary Protection */}
      <SafeStageZone>
        {/* Beat 11: Step 1 Funnel Narrowing */}
        {isFunnelStep1 && (
          <ResearchFunnelMechanism activeLevelIndex={0} />
        )}

        {/* Beat 12: Step 2 True 2D Orthogonal Knowledge Radar Matrix */}
        {isRadarStep2 && (
          <KnowledgeMatrixRadar showResearcher />
        )}

        {/* Beat 13: Step 3 Niche Gap Filter */}
        {isFilterStep3 && (
          <ResearchFunnelMechanism activeLevelIndex={2} />
        )}

        {/* Beat 14 & 15: 3-Tier Cantilever Bridge with Presenting Researcher */}
        {isBridgeStage && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 60,
                top: 500,
                width: 320,
                height: 440,
                zIndex: 25,
                pointerEvents: 'none',
              }}
            >
              <ResearcherRig
                pose="presenting"
                frame={frame}
                showGlasses
                scale={0.88}
              />
            </div>

            <CantileverBridge activeTier={activeTier} />
          </>
        )}
      </SafeStageZone>
    </div>
  );
};
