/**
 * packages/caption-kit/src/KaraokeWord.tsx
 * Dual-layer zero-layout-shift (CLS = 0) word highlight component.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CaptionWord, KaraokeWordProps } from './types';
import { calculateProgressiveFill, computeClipPathInset } from './utils';
import { EDUCATIONAL_THEME } from './theme';

export const KaraokeWord: React.FC<KaraokeWordProps> = (props) => {
  let contextFrame = 0;
  let contextFps = 30;
  try {
    contextFrame = useCurrentFrame();
    contextFps = useVideoConfig().fps;
  } catch {
    // Graceful fallback outside Remotion context
  }

  const frame = props.currentFrame !== undefined ? props.currentFrame : contextFrame;
  const fps = props.fps !== undefined ? props.fps : contextFps;

  const wordData: CaptionWord = typeof props.word === 'string'
    ? {
        id: props.id || 'w_auto',
        word: props.word,
        start: 0,
        end: 0,
        startFrame: props.startFrame,
        endFrame: props.endFrame,
      }
    : props.word;

  const text = wordData.word;
  const startFrame = props.startFrame !== undefined
    ? props.startFrame
    : (wordData.startFrame !== undefined ? wordData.startFrame : Math.round(wordData.start * fps));

  const endFrame = props.endFrame !== undefined
    ? props.endFrame
    : (wordData.endFrame !== undefined ? wordData.endFrame : Math.round(wordData.end * fps));

  const upcomingColor = props.upcomingColor || EDUCATIONAL_THEME.upcoming.color;
  const activeColor = props.activeColor || EDUCATIONAL_THEME.active.color;
  const spokenColor = props.spokenColor || EDUCATIONAL_THEME.spoken.color;

  const progress = calculateProgressiveFill(frame, startFrame, endFrame);
  const isSpoken = frame >= endFrame;
  const isActive = frame >= startFrame && frame < endFrame;

  // Pure Luminance Pop highlight:
  // Active word pops with bright activeColor (#38BDF8) and subtle text-shadow
  // Zero dynamic padding, zero background pill, zero layout shift (CLS = 0)
  const wordColor = isActive ? activeColor : isSpoken ? spokenColor : upcomingColor;
  const wordOpacity = isActive ? 1.0 : isSpoken ? 0.85 : 0.45;

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    fontWeight: EDUCATIONAL_THEME.active.fontWeight, // Strictly '700' to guarantee CLS = 0
    color: wordColor,
    opacity: wordOpacity,
    transform: 'none',
    textRendering: 'geometricPrecision',
    WebkitFontSmoothing: 'antialiased',
    textShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none',
    borderRadius: '0px',
    backgroundColor: 'transparent',
    padding: '0px 2px',
    margin: '0px 0.20em',
    transition: 'color 0.04s ease, opacity 0.04s ease',
    ...props.style,
  };

  return (
    <span style={baseStyle}>
      {text}
    </span>
  );
};
