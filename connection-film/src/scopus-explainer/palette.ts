/**
 * Academic Palette Tokens & Visual Styling Constants
 * Designed for Scopus Research Gap Explainer TikTok 9:16 (1080x1920)
 * High contrast, refined scholarly vector aesthetic.
 */

export const ACADEMIC_PALETTE = {
  // Deep Background & Dark Surfaces
  DeepNavy: '#0F172A',
  DEEP_NAVY: '#0F172A',
  NAVY_DEEP: '#0F172A',      // Slate 900 - Canvas Background

  SlateDark: '#1E293B',
  SLATE_DARK: '#1E293B',
  NAVY_SURFACE: '#1E293B',   // Slate 800 - Cards, Content Panels
  NAVY_BORDER: '#334155',    // Slate 700 - Panel Borders, Axes
  NAVY_DARK: '#020617',      // Slate 950 - Inks, Character Outlines, Deep Shadows

  // Scholar Cyan / Core Accents
  ScholarCyan: '#06B6D4',
  SCHOLAR_CYAN: '#06B6D4',
  CYAN_PRIMARY: '#06B6D4',   // Cyan 500 - Core Concept, CARS Move 1
  CYAN_GLOW: '#38BDF8',      // Sky 400 - Active Glows, Contextual Gap
  CYAN_DEEP: '#0891B2',      // Cyan 600 - Geometry Shading
  CYAN_SOFT: 'rgba(6, 182, 212, 0.15)', // Glassmorphic fills

  // Alert Amber (Gap / Question / Tension)
  AlertAmber: '#F59E0B',
  ALERT_AMBER: '#F59E0B',
  AMBER_ALERT: '#F59E0B',    // Amber 500 - Gap Void, Empirical Gap, Attention
  AMBER_LIGHT: '#FBBF24',    // Amber 400 - Pulsing Halos
  AMBER_SOFT: 'rgba(245, 158, 11, 0.15)',

  // Coral Red (Errors, Rejections, Critical Limits)
  CoralRed: '#EF4444',
  CORAL_RED: '#EF4444',
  CORAL_ALERT: '#EF4444',    // Red 500 - Rejection Stamp, Methodological Gap, Pitfalls
  CORAL_LIGHT: '#F87171',    // Red 400 - Error Text Highlight
  CORAL_SOFT: 'rgba(239, 68, 68, 0.15)',

  // Emerald & Green (Success, Verified Evidence, New Contribution)
  Emerald: '#10B981',
  EMERALD: '#10B981',
  EMERALD_SUCCESS: '#10B981', // Emerald 500 - Acceptance, CARS Move 3, Snapped Contribution
  EMERALD_LIGHT: '#34D399',  // Emerald 400 - Checkmarks, Badges
  EMERALD_SOFT: 'rgba(16, 185, 129, 0.15)',

  // Academic Purple / Methodology
  PurpleAccent: '#8B5CF6',
  PURPLE_ACCENT: '#8B5CF6',
  PURPLE_SOFT: 'rgba(139, 92, 246, 0.15)',

  // High-Contrast Typography & Text Neutrals
  White: '#F8FAFC',
  WHITE: '#F8FAFC',
  Muted: '#94A3B8',
  MUTED: '#94A3B8',
  TEXT_PRIMARY: '#F8FAFC',   // Slate 50 - Titles, Headings, Subtitles
  TEXT_SECONDARY: '#94A3B8', // Slate 400 - Subheadings, Citations
  TEXT_MUTED: '#64748B',     // Slate 500 - Footnotes, Minor Labels
} as const;

/**
 * Backward compatibility alias for ACADEMIC_PALETTE
 */
export const PALETTE = ACADEMIC_PALETTE;

/**
 * TikTok 9:16 Safe Zone Bounds (1080 x 1920)
 */
export const TIKTOK_SAFE_ZONES = {
  // Formal task invariant fields
  Width: 1080,
  Height: 1920,
  WIDTH: 1080,
  HEIGHT: 1920,
  Y_MIN: 140,
  Y_MAX: 1640,
  SAFE_WIDTH: 764,
  SAFE_HEIGHT: 1500,
  X_MIN: 96,
  X_MAX: 860,
  SUBTITLE_Y: 1480,
  SUBTITLE_H: 120,

  // Additional positioning constants
  TOP_MARGIN: 140,     // Avoid status bar, search, top tabs
  BOTTOM_MARGIN: 280,  // Avoid sound marquee, creator handle, captions
  LEFT_MARGIN: 96,     // Bezel and grip buffer
  RIGHT_MARGIN: 220,   // Avoid right-side interaction rail (like, comment, bookmark, share)
  CENTER_X: 540,
  CENTER_Y: 890,
  SUBTITLE_Y_START: 1480,
  SUBTITLE_Y_END: 1600,
} as const;

/**
 * Backward compatibility alias for TIKTOK_SAFE_ZONES
 */
export const SAFE_ZONE = TIKTOK_SAFE_ZONES;

