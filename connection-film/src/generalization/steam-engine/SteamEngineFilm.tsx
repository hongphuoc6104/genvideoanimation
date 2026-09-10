import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsData from './subtitles/captions.json';
import shotSpecData from './shot-spec.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1PreIndustrial } from './scenes/Scene1PreIndustrial';
import { Scene2WattBreakthrough } from './scenes/Scene2WattBreakthrough';
import { Scene3ThermodynamicCycle } from './scenes/Scene3ThermodynamicCycle';
import { Scene4IndustrialImpact } from './scenes/Scene4IndustrialImpact';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1PreIndustrial,
  shot_02: Scene2WattBreakthrough,
  shot_03: Scene3ThermodynamicCycle,
  shot_04: Scene4IndustrialImpact,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.endFrame - shot.startFrame,
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1PreIndustrial,
}));

export const TOTAL_FRAMES =
  shotSpecData.shots.length > 0
    ? shotSpecData.shots[shotSpecData.shots.length - 1].endFrame
    : 3000;

export const SteamEngineFilm: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#0B111E',
        overflow: 'hidden',
      }}
    >
      {/* Synchronized Master Narration Voiceover (Normalized to -15.0 LUFS, TP <= -1.8 dBTP) */}
      <Audio
        src={staticFile('audio/steam_engine_master_audio.wav')}
        volume={1.0}
      />

      {/* 4 Sequential Scenes covering the Content-Driven Timeline */}
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

      {/* TikTok Vertical Karaoke Captions Mounted in Safe Zone */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};
