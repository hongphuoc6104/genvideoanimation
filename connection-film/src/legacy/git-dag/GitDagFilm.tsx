import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsData from './subtitles/captions.json';
import shotSpecData from './shot-spec.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1CentralizedVsDistributed } from './scenes/Scene1CentralizedVsDistributed';
import { Scene2ObjectTriadDag } from './scenes/Scene2ObjectTriadDag';
import { Scene3BranchHeadMerge } from './scenes/Scene3BranchHeadMerge';
import { Scene4DistributedSync } from './scenes/Scene4DistributedSync';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 3084; // 102.784s content-driven duration

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1CentralizedVsDistributed,
  shot_02: Scene2ObjectTriadDag,
  shot_03: Scene3BranchHeadMerge,
  shot_04: Scene4DistributedSync,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.endFrame - shot.startFrame,
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1CentralizedVsDistributed,
}));

export const GitDagFilm: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#0F172A',
        overflow: 'hidden',
      }}
    >
      {/* Single Authoritative Master Voiceover Track (-15.0 LUFS, <= -1.8 dBTP, 48kHz Stereo) */}
      <Audio
        src={staticFile('audio/git_dag_master_audio.wav')}
        volume={1.0}
      />

      {/* 4 Sequential Scenes covering the 102.8s Content-Driven Timeline */}
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

      {/* Unified 9:16 Karaoke Captions Mounted in Dedicated Safe Zone */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};


