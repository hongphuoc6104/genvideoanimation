import React from 'react';
import { useBeatChoreography } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { ResearchFunnelMechanism } from '../components/ResearchFunnelMechanism';
import { ThreeTierBridgeMechanism } from '../components/ThreeTierBridgeMechanism';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3ProcessFunnel: React.FC<SceneProps> = ({
  durationInFrames = 667,
  shotBeats = [],
}) => {
  const { currentBeatIndex } = useBeatChoreography(shotBeats);

  // Zero-Ghosting Stage Separation:
  // Beat 0, 1, 2: Research Funnel & 3-Condition Filter (Stage 1)
  // Beat 3, 4: 3-Tier Cantilever Bridge & Variable Formula (Stage 2)
  const isFunnelStage = currentBeatIndex <= 2;
  const isBridgeStage = currentBeatIndex >= 3;

  // Progressive tier assembly for bridge:
  // beat 3 = tier 2 (tension gap & assembly), beat 4 = tier 3 (keystone locked + formula)
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

      {/* Stage 1: Research Funnel (Unmounts completely at Beat 3) */}
      {isFunnelStage && (
        <ResearchFunnelMechanism activeLevelIndex={currentBeatIndex} />
      )}

      {/* Stage 2: 3-Tier Cantilever Bridge (Mounted at Beat 3+) */}
      {isBridgeStage && (
        <ThreeTierBridgeMechanism activeTier={activeTier} />
      )}
    </div>
  );
};
