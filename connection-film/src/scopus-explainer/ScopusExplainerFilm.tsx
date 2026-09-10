import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsData from './subtitles/captions.json';
import shotSpecData from './shot-spec.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1ProblemScopus } from './scenes/Scene1ProblemScopus';
import { Scene2GapTaxonomy } from './scenes/Scene2GapTaxonomy';
import { Scene3ProcessFunnel } from './scenes/Scene3ProcessFunnel';
import { Scene4TemplateCaseStudy } from './scenes/Scene4TemplateCaseStudy';
import { Scene5PitfallsConclusion } from './scenes/Scene5PitfallsConclusion';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1ProblemScopus,
  shot_02: Scene2GapTaxonomy,
  shot_03: Scene3ProcessFunnel,
  shot_04: Scene4TemplateCaseStudy,
  shot_05: Scene5PitfallsConclusion,
};

// Content-driven shot boundaries derived from shot-spec.json
export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.endFrame - shot.startFrame,
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1ProblemScopus,
}));

// Content-driven total duration in frames
export const TOTAL_FRAMES =
  shotSpecData.shots.length > 0
    ? shotSpecData.shots[shotSpecData.shots.length - 1].endFrame
    : 2400;

export const ScopusExplainerFilm: React.FC = () => {
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
      {/* Synchronized Master Narration Voiceover (Normalized to -15.0 LUFS, TP <= -1.8 dBTP) */}
      <Audio
        src={staticFile('audio/scopus_master_audio.wav')}
        volume={1.0}
      />


      {/* 5 Sequential Scenes covering the Content-Driven Timeline */}
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

      {/* TikTok Vertical Karaoke Captions Mounted in Safe Zone ($Y \in [1480px, 1600px]$) */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};
