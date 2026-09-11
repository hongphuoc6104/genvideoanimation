import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import shotSpecData from './shot-spec.json';
import captionsData from './subtitles/captions.json';
import semanticTimelineData from './semantic-timeline.json';
import { Scene1ProblemScopus } from './scenes/Scene1ProblemScopus';
import { Scene2GapTaxonomy } from './scenes/Scene2GapTaxonomy';
import { Scene3ProcessFunnel } from './scenes/Scene3ProcessFunnel';
import { Scene4TemplateCaseStudy } from './scenes/Scene4TemplateCaseStudy';
import { Scene5PitfallsConclusion } from './scenes/Scene5PitfallsConclusion';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = shotSpecData.totalFrames;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number; shotBeats?: any[] }>> = {
  shot_01: Scene1ProblemScopus,
  shot_02: Scene2GapTaxonomy,
  shot_03: Scene3ProcessFunnel,
  shot_04: Scene4TemplateCaseStudy,
  shot_05: Scene5PitfallsConclusion,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.durationInFrames || (shot.endFrame - shot.startFrame),
  beats: (semanticTimelineData.beats || []).filter((b: any) => b.shotId === shot.id),
  component: SCENE_COMPONENTS[shot.id] || Scene1ProblemScopus,
}));

export const ScopusResearchGapFilm: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#0B1120',
        overflow: 'hidden',
      }}
    >
      {/* Root Master Narration Audio (Single Ownership EBU R128 -15 LUFS) */}
      <Audio
        src={staticFile('projects/scopus-research-gap/audio/master_audio.wav')}
        volume={1.0}
      />

      {/* 5 Motivated Kinetic Scenes */}
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

      {/* TikTok Vertical Karaoke Captions Mounted in Safe Zone ($Y \in [1470px, 1650px]$) */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};

export default ScopusResearchGapFilm;
