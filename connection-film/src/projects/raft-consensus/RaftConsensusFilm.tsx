import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import { SafeStageZone } from 'motion-kit';
import shotSpecData from './shot-spec.json';
import captionsData from './subtitles/captions.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1LeaderElection } from './scenes/Scene1LeaderElection';
import { Scene2LogReplication } from './scenes/Scene2LogReplication';
import { Scene3SafetyPartition } from './scenes/Scene3SafetyPartition';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = shotSpecData.totalFrames;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1LeaderElection,
  shot_02: Scene2LogReplication,
  shot_03: Scene3SafetyPartition,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.durationInFrames || (shot.endFrame - shot.startFrame),
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1LeaderElection,
}));

export const RaftConsensusFilm: React.FC = () => {
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
        src={staticFile('projects/raft-consensus/audio/master_audio.wav')}
        volume={1.0}
      />

      {/* SafeStageZone wrapper guaranteeing stage bounds [36, 1044] x [180, 1420] */}
      <SafeStageZone minY={180} maxY={1420} minX={36} maxX={1044}>
        {/* 3 Motivated Sequence Shots */}
        {SHOTS.map((shot) => {
          const Component = shot.component;
          return (
            <Sequence
              key={shot.id}
              from={shot.startFrame}
              durationInFrames={shot.durationInFrames}
            >
              <Component
                durationInFrames={shot.durationInFrames}
                shotBeats={shot.beats}
              />
            </Sequence>
          );
        })}
      </SafeStageZone>

      {/* Synchronized Mobile Karaoke Subtitles (Safe Region Y: [1470px, 1650px]) */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};

export default RaftConsensusFilm;
