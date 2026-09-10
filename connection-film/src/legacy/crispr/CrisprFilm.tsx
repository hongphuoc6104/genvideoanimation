import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import shotSpecData from './shot-spec.json';
import captionsData from './subtitles/captions.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1MutationProblem } from './scenes/Scene1MutationProblem';
import { Scene2SurveillancePam } from './scenes/Scene2SurveillancePam';
import { Scene3DualCleavage } from './scenes/Scene3DualCleavage';
import { Scene4RepairPathways } from './scenes/Scene4RepairPathways';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 2972;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1MutationProblem,
  shot_02: Scene2SurveillancePam,
  shot_03: Scene3DualCleavage,
  shot_04: Scene4RepairPathways,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.endFrame - shot.startFrame,
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1MutationProblem,
}));

export const CrisprFilm: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#0A0F1D',
        overflow: 'hidden',
      }}
    >
      {/* Root Master Audio: Single Ownership PREMIXED Audio Mount */}
      <Audio
        src={staticFile('audio/crispr_master_audio.wav')}
        volume={1.0}
      />

      {/* 4 Motivated Shots covering the 99.07s / 2972 frames timeline */}
      {SHOTS.map((shot) => {
        const Component = shot.component;
        return (
          <Sequence
            key={shot.id}
            from={shot.startFrame}
            durationInFrames={shot.durationInFrames}
          >
            <Component durationInFrames={shot.durationInFrames} shotBeats={shot.beats} />
          </Sequence>
        );
      })}

      {/* Synchronized Mobile Karaoke Subtitles (Safe Region Y: [1410px, 1630px]) */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};

