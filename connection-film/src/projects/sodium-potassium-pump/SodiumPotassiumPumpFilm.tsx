import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import shotSpecData from './shot-spec.json';
import captionsData from './subtitles/captions.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1ElectrochemicalGradient } from './scenes/Scene1ElectrochemicalGradient';
import { Scene2ConformationalCycle } from './scenes/Scene2ConformationalCycle';
import { Scene3ElectrogenicSynthesis } from './scenes/Scene3ElectrogenicSynthesis';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = shotSpecData.totalFrames;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1ElectrochemicalGradient,
  shot_02: Scene2ConformationalCycle,
  shot_03: Scene3ElectrogenicSynthesis,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.durationInFrames,
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1ElectrochemicalGradient,
}));

export interface FilmProps {
  enableMicroHUD?: boolean;
}

export const SodiumPotassiumPumpFilm: React.FC<FilmProps> = ({ enableMicroHUD = true }) => {
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
        src={staticFile('projects/sodium-potassium-pump/audio/master_audio.wav')}
        volume={1.0}
      />

      {/* Motivated Shots Sequence Map */}
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
              {...(shot.id === 'shot_02' ? { enableMicroHUD } : {})}
            />
          </Sequence>
        );
      })}

      {/* Synchronized Mobile Karaoke Subtitles (Safe Region Y: [1420px, 1750px]) */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};

export default SodiumPotassiumPumpFilm;
