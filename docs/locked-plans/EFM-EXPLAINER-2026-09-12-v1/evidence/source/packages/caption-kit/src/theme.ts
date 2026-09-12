/**
 * packages/caption-kit/src/theme.ts
 * Educational Art Direction theme definitions for Remotion Karaoke Caption Kit.
 * Strictly avoids TikTok bouncy/shaky transforms; satisfies WCAG AA contrast.
 */

import { CaptionTheme } from './types';

export const EDUCATIONAL_THEME: CaptionTheme = {
  upcoming: {
    color: '#94a3b8', // slate-400 (WCAG AAA >= 7.0:1 against dark slate #0b1120)
    opacity: 1.0,
    fontWeight: '700',
    transform: 'none',
  },
  active: {
    color: '#38bdf8', // sky-400 (WCAG AAA >= 7.0:1 against dark slate #0b1120; >= 4.5:1 over white composite)
    opacity: 1.0,
    fontWeight: '700',
    transform: 'none',
  },
  spoken: {
    color: '#cbd5e1', // slate-300 (WCAG AAA >= 7.0:1 against dark slate #0b1120)
    opacity: 1.0,
    fontWeight: '700',
    transform: 'none',
  },
  // Flat property aliases alongside nested structure
  upcomingColor: '#94a3b8',
  activeColor: '#38bdf8',
  spokenColor: '#cbd5e1',
  activeTransform: 'none',
  activeScale: 1.0,
  backgroundColor: 'rgba(11, 17, 32, 0.92)', // dark slate translucent compact pill (shields against white backdrops >= 4.5:1)
  borderRadius: '14px',
  padding: '10px 22px',
  fontSize: 44, // Compact mobile typography (42-46px range, >= 30px mobile floor)
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
};

/**
 * Crisp theme variant with explicit rgba(255, 255, 255, 0.40) unread color.
 */
export const CRISP_THEME: CaptionTheme = {
  ...EDUCATIONAL_THEME,
  upcoming: {
    ...EDUCATIONAL_THEME.upcoming,
    color: 'rgba(255, 255, 255, 0.40)',
  },
  upcomingColor: 'rgba(255, 255, 255, 0.40)',
};
