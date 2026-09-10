import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsData from './subtitles/captions.json';
import cuesData from './cues.json';
import { Scene1ProblemScopus } from './scenes/Scene1ProblemScopus';
import { Scene2GapTaxonomy } from './scenes/Scene2GapTaxonomy';
import { Scene3ProcessFunnel } from './scenes/Scene3ProcessFunnel';
import { Scene4TemplateCaseStudy } from './scenes/Scene4TemplateCaseStudy';
import { Scene5PitfallsConclusion } from './scenes/Scene5PitfallsConclusion';

export const TOTAL_FRAMES = 2400; // 80 seconds at 30 FPS
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SHOTS = [
  { id: 'shot_01', startFrame: 0, durationInFrames: 450, component: Scene1ProblemScopus },
  { id: 'shot_02', startFrame: 450, durationInFrames: 450, component: Scene2GapTaxonomy },
  { id: 'shot_03', startFrame: 900, durationInFrames: 540, component: Scene3ProcessFunnel },
  { id: 'shot_04', startFrame: 1440, durationInFrames: 510, component: Scene4TemplateCaseStudy },
  { id: 'shot_05', startFrame: 1950, durationInFrames: 450, component: Scene5PitfallsConclusion },
] as const;

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
      {/* Background Soundtrack Audio */}
      <Audio
        src={staticFile('audio/background_soundtrack.wav')}
        volume={0.35}
      />

      {/* Synchronized Master Narration Voiceover */}
      <Audio
        src={staticFile('audio/scopus_master_audio.wav')}
        volume={1.0}
      />

      {/* Dynamic SFX Audio Hits Triggered at Declared Cue Frames */}
      {cuesData.cues.map((cue) => {
        if (!cue.soundFx) return null;
        return (
          <Sequence
            key={cue.id}
            from={cue.frame}
            durationInFrames={60}
          >
            <Audio
              src={staticFile(`audio/${cue.soundFx}`)}
              volume={cue.volume ?? 0.75}
            />
          </Sequence>
        );
      })}

      {/* 5 Sequential Scenes covering the 2400 Frames Timeline */}
      {SHOTS.map((shot) => {
        const Component = shot.component;
        return (
          <Sequence
            key={shot.id}
            from={shot.startFrame}
            durationInFrames={shot.durationInFrames}
          >
            <Component />
          </Sequence>
        );
      })}

      {/* TikTok Vertical Karaoke Captions Mounted in Safe Zone ($Y \in [1480px, 1600px]$) */}
      <KaraokeCaptions captions={captionsData as any} />
    </div>
  );
};
