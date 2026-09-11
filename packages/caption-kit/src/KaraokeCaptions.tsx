/**
 * packages/caption-kit/src/KaraokeCaptions.tsx
 * Top-level coordinator mounting the active caption group at its safe bounding box.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { KaraokeCaptionsProps } from './types';
import { KaraokeGroup } from './KaraokeGroup';
import { resolveActiveGroup } from './utils';
import { EDUCATIONAL_THEME } from './theme';

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({
  captions,
  currentFrame,
  fps,
  theme = EDUCATIONAL_THEME,
  themeProps,
  style,
}) => {
  let contextFrame = 0;
  const manifestFps = (captions && !Array.isArray(captions) && 'fps' in captions) ? captions.fps : 30;
  let contextFps = manifestFps;
  try {
    contextFrame = useCurrentFrame();
    contextFps = useVideoConfig().fps;
  } catch {
    // Graceful fallback outside Remotion context
  }

  const frame = currentFrame !== undefined ? currentFrame : contextFrame;
  const activeFps = fps !== undefined ? fps : (!Array.isArray(captions) && captions?.fps ? captions.fps : contextFps);

  const activeGroup = resolveActiveGroup(captions, frame);

  if (!activeGroup) {
    return null;
  }

  const box = activeGroup.box;

  // Determine if activeGroup has an immediate predecessor or successor in captions (tight handoff)
  const groups = Array.isArray(captions) ? captions : (captions?.groups || []);
  const currentIndex = groups.findIndex((g: any) => g.id === activeGroup.id);
  const prevGroup = currentIndex > 0 ? groups[currentIndex - 1] : null;
  const nextGroup = currentIndex >= 0 && currentIndex < groups.length - 1 ? groups[currentIndex + 1] : null;

  const isTightStart = prevGroup ? (activeGroup.startFrame - prevGroup.endFrame <= 2) : false;
  const isTightEnd = nextGroup ? (nextGroup.startFrame - activeGroup.endFrame <= 2) : false;

  // Smooth crossfade only when entering or exiting silence / edge boundaries
  const framesFromStart = frame - activeGroup.startFrame;
  const framesToEnd = activeGroup.endFrame - frame;
  let groupOpacity = 1.0;
  if (!isTightStart && framesFromStart < 3) {
    groupOpacity = Math.min(1.0, (framesFromStart + 1) / 4);
  } else if (!isTightEnd && framesToEnd <= 3) {
    groupOpacity = Math.max(0.1, framesToEnd / 4);
  }

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
    opacity: groupOpacity,
    ...style,
  };

  return (
    <div style={containerStyle}>
      <KaraokeGroup
        group={activeGroup}
        currentFrame={frame}
        fps={activeFps}
        theme={theme}
        themeProps={themeProps}
      />
    </div>
  );
};
