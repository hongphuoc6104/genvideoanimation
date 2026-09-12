import React from 'react';
import { Composition } from 'remotion';
import { RemotionRootLegacy } from './RootLegacy';
import { SodiumPotassiumPumpFilm, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from './projects/sodium-potassium-pump';
import {
  ScopusResearchGapFilm,
  TOTAL_FRAMES as SCOPUS_TOTAL_FRAMES,
  FPS as SCOPUS_FPS,
  WIDTH as SCOPUS_WIDTH,
  HEIGHT as SCOPUS_HEIGHT
} from './projects/scopus-research-gap';
import {
  RaftConsensusFilm,
  TOTAL_FRAMES as RAFT_TOTAL_FRAMES,
  FPS as RAFT_FPS,
  WIDTH as RAFT_WIDTH,
  HEIGHT as RAFT_HEIGHT
} from './projects/raft-consensus';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Canonical Production Project: Sodium-Potassium Pump (Option 2: Minimalist Semantic HUD - Chosen Canonical Standard) */}
      <Composition
        id="SodiumPotassiumPump-TikTok916"
        component={SodiumPotassiumPumpFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ enableMicroHUD: true }}
      />

      {/* Standalone Variant: Option 1 (The Pure Immersive Kinetic Standard) */}
      <Composition
        id="SodiumPotassiumPump-Immersive"
        component={SodiumPotassiumPumpFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ enableMicroHUD: false }}
      />

      {/* Production V3.4 Project: Scopus Research Gap Explainer */}
      <Composition
        id="ScopusResearchGap-TikTok916"
        component={ScopusResearchGapFilm}
        durationInFrames={4503}
        fps={SCOPUS_FPS}
        width={SCOPUS_WIDTH}
        height={SCOPUS_HEIGHT}
      />

      {/* Production V3.4 Generalization Benchmark: Raft Distributed Consensus Protocol */}
      <Composition
        id="RaftConsensus-TikTok916"
        component={RaftConsensusFilm}
        durationInFrames={RAFT_TOTAL_FRAMES}
        fps={RAFT_FPS}
        width={RAFT_WIDTH}
        height={RAFT_HEIGHT}
      />

      {/* =================================================================== */}
      {/* CANONICAL V3.3 TARGET FILMS (M4 / R4 PRESERVATION)                  */}
      {/* - CrisprCas9-TikTok916 (mounted via RemotionRootLegacy)             */}
      {/* - SteamEngineCycle (mounted via RemotionRootLegacy)                 */}
      {/* - GitDagModel-TikTok916 (mounted via RemotionRootLegacy)            */}
      {/* - ScopusResearchGap-TikTok916 (mounted above)                       */}
      {/* =================================================================== */}
      <RemotionRootLegacy />
    </>
  );
};
