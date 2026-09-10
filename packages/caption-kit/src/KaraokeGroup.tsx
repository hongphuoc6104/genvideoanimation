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

  // Fixed container dimensions guarantee zero layout shift (CLS = 0)
  const groupStyle: React.CSSProperties = {
    width: box ? `${box.width}px` : '100%',
    height: box ? `${box.height}px` : 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: `${fontSize}px`,
    fontFamily,
    backgroundColor: themeProps?.backgroundColor || theme.backgroundColor,
    borderRadius: theme.borderRadius,
    padding: theme.padding,
    boxSizing: 'border-box',
    transform: 'none',
    ...style,
  };

  return (
    <div style={groupStyle}>
      {group.lines.map((line, idx) => (
        <KaraokeLine
          key={`line-${idx}`}
          line={line}
          lineIndex={idx}
          currentFrame={currentFrame}
          fps={fps}
          theme={theme}
          themeProps={themeProps}
        />
      ))}
    </div>
  );
};
