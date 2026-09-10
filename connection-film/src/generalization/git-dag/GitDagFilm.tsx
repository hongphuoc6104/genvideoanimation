import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { KaraokeCaptions } from 'caption-kit';
import captionsData from './subtitles/captions.json';
import shotSpecData from './shot-spec.json';
import { Scene1CentralizedVsDistributed } from './scenes/Scene1CentralizedVsDistributed';
import { Scene2ObjectTriadDag } from './scenes/Scene2ObjectTriadDag';
import { Scene3BranchHeadMerge } from './scenes/Scene3BranchHeadMerge';
import { Scene4DistributedSync } from './scenes/Scene4DistributedSync';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 3084; // 102.784s content-driven duration

const SCENE_COMPONENTS: Record<string, React.FC> = {
  shot_01: Scene1CentralizedVsDistributed,
  shot_02: Scene2ObjectTriadDag,
  shot_03: Scene3BranchHeadMerge,
  shot_04: Scene4DistributedSync,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.endFrame - shot.startFrame,
  component: SCENE_COMPONENTS[shot.id] || Scene1CentralizedVsDistributed,
}));

const GitDagKaraokeBanner: React.FC = () => {
  const frame = useCurrentFrame();

  const activeCaption = (captionsData as any[]).find(
    (c: any) => frame >= c.startFrame && frame < c.endFrame
  );

  if (!activeCaption) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 140,
        left: 72,
        right: 72,
        minHeight: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.90)',
        borderRadius: 24,
        padding: '24px 36px',
        border: '2px solid rgba(59, 130, 246, 0.4)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: 54,
          fontWeight: 700,
          color: '#F8FAFC',
          lineHeight: 1.35,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {activeCaption.text}
      </div>
    </div>
  );
};

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
            <Component />
          </Sequence>
        );
      })}

      {/* TikTok Vertical 9:16 Karaoke Captions Mounted in Dedicated Safe Zone */}
      <GitDagKaraokeBanner />
    </div>
  );
};

