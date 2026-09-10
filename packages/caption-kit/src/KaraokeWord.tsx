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
  const isActive = progress > 0.0 && progress < 1.0;

  // Base layer: relative inline-block establishing dimensions (CLS = 0)
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    marginRight: '0.28em',
    whiteSpace: 'nowrap',
    fontWeight: isSpoken ? EDUCATIONAL_THEME.spoken.fontWeight : EDUCATIONAL_THEME.upcoming.fontWeight,
    color: isSpoken ? spokenColor : upcomingColor,
    opacity: isSpoken ? EDUCATIONAL_THEME.spoken.opacity : EDUCATIONAL_THEME.upcoming.opacity,
    transform: 'none',
    ...props.style,
  };

  const clipInset = computeClipPathInset(progress);

  // Overlay highlight layer: absolute positioned directly over base layer with clip-path
  const highlightOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    color: activeColor,
    fontWeight: EDUCATIONAL_THEME.active.fontWeight,
    opacity: EDUCATIONAL_THEME.active.opacity,
    transform: 'none',
    clipPath: clipInset,
    WebkitClipPath: clipInset,
    whiteSpace: 'nowrap',
  };

  return (
    <span style={baseStyle}>
      {text}
      {isActive && (
        <span style={highlightOverlayStyle} aria-hidden="true">
          {text}
        </span>
      )}
    </span>
  );
};
