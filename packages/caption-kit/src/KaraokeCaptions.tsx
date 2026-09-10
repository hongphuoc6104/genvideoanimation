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
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    zIndex: 100,
    pointerEvents: 'none',
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
