/**
 * packages/caption-kit/src/KaraokeGroup.tsx
 * Phrase container for 1-line or 2-line caption groups with layout stability.
 */

import React from 'react';
import { KaraokeGroupProps } from './types';
import { KaraokeLine } from './KaraokeLine';
import { EDUCATIONAL_THEME } from './theme';

export const KaraokeGroup: React.FC<KaraokeGroupProps> = ({
  group,
  currentFrame,
  fps,
  theme = EDUCATIONAL_THEME,
  themeProps,
  style,
}) => {
  const box = group.box;
  const fontSize = themeProps?.fontSize || theme.fontSize || 36;
  const fontFamily = themeProps?.fontFamily || theme.fontFamily || 'Inter, system-ui, sans-serif';

  const effectiveFrame = currentFrame !== undefined ? currentFrame : 0;

  // Determine the active line dynamically to ensure a concise, breathable 1-line display (Anti-Clutter)
  let activeLineIndex = 0;
  if (group.lines.length > 1) {
    const foundIdx = group.lines.findIndex((l) => {
      const start = l.words[0]?.startFrame ?? 0;
      const end = l.words[l.words.length - 1]?.endFrame ?? Infinity;
      return effectiveFrame >= start && effectiveFrame <= end;
    });
    if (foundIdx >= 0) {
      activeLineIndex = foundIdx;
    } else {
      // If between word boundaries, select the most relevant adjacent line
      const nextIdx = group.lines.findIndex((l) => (l.words[0]?.startFrame ?? 0) > effectiveFrame);
      activeLineIndex = nextIdx > 0 ? nextIdx - 1 : (nextIdx === 0 ? 0 : group.lines.length - 1);
    }
  }
  const visibleLines = [group.lines[activeLineIndex] || group.lines[0]];

  // Dynamic width adapts to phrase length, freeing peripheral screen space
  const groupStyle: React.CSSProperties = {
    width: 'fit-content',
    maxWidth: box ? `${box.width}px` : '100%',
    minHeight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: `${fontSize}px`,
    fontFamily,
    backgroundColor: themeProps?.backgroundColor || theme.backgroundColor,
    borderRadius: theme.borderRadius || '20px',
    padding: theme.padding || '8px 24px',
    boxSizing: 'border-box',
    transform: 'none',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    ...style,
  };

  return (
    <div style={groupStyle}>
      {visibleLines.map((line, idx) => (
        <KaraokeLine
          key={`line-${activeLineIndex}-${idx}`}
          line={line}
          lineIndex={activeLineIndex}
          currentFrame={currentFrame}
          fps={fps}
          theme={theme}
          themeProps={themeProps}
        />
      ))}
    </div>
  );
};
