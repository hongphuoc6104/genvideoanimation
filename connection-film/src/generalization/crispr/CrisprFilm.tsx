import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import shotSpecData from './shot-spec.json';
import captionsData from './subtitles/captions.json';
import { Scene1MutationProblem } from './scenes/Scene1MutationProblem';
import { Scene2SurveillancePam } from './scenes/Scene2SurveillancePam';
import { Scene3DualCleavage } from './scenes/Scene3DualCleavage';
import { Scene4RepairPathways } from './scenes/Scene4RepairPathways';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 2972;

const SCENE_COMPONENTS: Record<string, React.FC<{ durationInFrames?: number }>> = {
  shot_01: Scene1MutationProblem,
  shot_02: Scene2SurveillancePam,
  shot_03: Scene3DualCleavage,
  shot_04: Scene4RepairPathways,
};

export const SHOTS = shotSpecData.shots.map((shot: any) => ({
  id: shot.id,
  startFrame: shot.startFrame,
  durationInFrames: shot.endFrame - shot.startFrame,
  component: SCENE_COMPONENTS[shot.id] || Scene1MutationProblem,
}));

/**
 * Mobile Karaoke Caption Banner Component (Font size: 54px >= 52px)
 */
const CrisprKaraokeBanner: React.FC = () => {
  const frame = useCurrentFrame();

  const activeCaption = captionsData.find(
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
        backgroundColor: 'rgba(11, 17, 32, 0.88)',
        borderRadius: 24,
        padding: '24px 36px',
        border: '2px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px 14px',
          lineHeight: 1.35,
        }}
      >
        {activeCaption.words.map((w: any, idx: number) => {
          const isSpoken = frame >= w.startFrame;
          const isActive = frame >= w.startFrame && frame < w.endFrame;

          return (
            <span
              key={`w-${idx}`}
              data-role="caption"
              style={{
                fontSize: 54,
                fontWeight: 800,
                color: isActive
                  ? '#38BDF8'
                  : isSpoken
                  ? '#F8FAFC'
                  : 'rgba(148, 163, 184, 0.55)',
                textShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.8)' : 'none',
                transform: isActive ? 'scale(1.04)' : 'scale(1.0)',
                transition: 'all 0.1s ease',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

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
            <Component durationInFrames={shot.durationInFrames} />
          </Sequence>
        );
      })}

      {/* Synchronized Mobile Karaoke Subtitles (Safe Region Y: [1480px, 1780px]) */}
      <CrisprKaraokeBanner />
    </div>
  );
};
