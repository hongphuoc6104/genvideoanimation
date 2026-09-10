/**
 * packages/caption-kit/src/KaraokeLine.tsx
 * Layout container for words within a single caption line.
 */

import React from 'react';
import { KaraokeLineProps } from './types';
import { KaraokeWord } from './KaraokeWord';
import { EDUCATIONAL_THEME } from './theme';

export const KaraokeLine: React.FC<KaraokeLineProps> = ({
  line,
  lineIndex = 0,
  currentFrame,
  fps,
  theme = EDUCATIONAL_THEME,
  themeProps,
  style,
}) => {
  const lineStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    minHeight: '48px',
    lineHeight: '1.3',
    ...style,
  };

  const upcomingColor = themeProps?.upcomingColor || theme.upcoming.color;
  const activeColor = themeProps?.accentColor || theme.active.color;
  const spokenColor = themeProps?.spokenColor || theme.spoken.color;

  return (
    <div style={lineStyle}>
      {line.words.map((word, idx) => (
        <KaraokeWord
          key={word.id || `line-${lineIndex}-w-${idx}`}
          word={word}
          currentFrame={currentFrame}
          fps={fps}
          upcomingColor={upcomingColor}
          activeColor={activeColor}
          spokenColor={spokenColor}
        />
      ))}
    </div>
  );
};
