/**
 * packages/caption-kit/src/theme.ts
 * Educational Art Direction theme definitions for Remotion Karaoke Caption Kit.
 * Strictly avoids TikTok bouncy/shaky transforms; satisfies WCAG AA contrast.
 */

import { CaptionTheme } from './types';

export const EDUCATIONAL_THEME: CaptionTheme = {
  upcoming: {
    color: '#94a3b8', // slate-400
    opacity: 0.85,
    fontWeight: '500',
    transform: 'none',
  },
  active: {
    color: '#38bdf8', // sky-400 (WCAG AA >= 4.5:1 against dark slate-900 #0f172a)
    opacity: 1.0,
    fontWeight: '700',
    transform: 'none',
  },
  spoken: {
    color: '#cbd5e1', // slate-300
    opacity: 0.95,
    fontWeight: '600',
    transform: 'none',
  },
  // Flat property aliases alongside nested structure
  upcomingColor: '#94a3b8',
  activeColor: '#38bdf8',
  spokenColor: '#cbd5e1',
  activeTransform: 'none',
  activeScale: 1.0,
  backgroundColor: 'rgba(15, 23, 42, 0.85)', // dark slate translucent pill
  borderRadius: '16px',
  padding: '16px 24px',
  fontSize: 56, // V3.1 9:16 mobile invariant
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
};
