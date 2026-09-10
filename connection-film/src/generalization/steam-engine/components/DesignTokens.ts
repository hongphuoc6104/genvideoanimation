/**
 * Academic & Industrial Design Tokens for Watt Steam Engine Film
 * Strictly adhering to V3.3 Mobile Typography Standards (1080x1920, 9:16)
 */

export const THEME = {
  colors: {
    // Deep industrial charcoal/navy backgrounds
    bgDark: '#0B111E',
    bgCard: '#151F32',
    bgOverlay: 'rgba(15, 23, 42, 0.92)',

    // Steam & High Thermal Energy (100°C)
    steamHot: '#EF4444',
    steamOrange: '#F97316',
    steamGlow: 'rgba(239, 68, 68, 0.45)',

    // Condensation & Cold Thermal Sink (20°C - Vacuum)
    condenserCold: '#06B6D4',
    condenserBlue: '#3B82F6',
    condenserGlow: 'rgba(6, 182, 212, 0.4)',

    // Machine Metal & Construction Materials
    castIron: '#334155',
    steel: '#64748B',
    brightSteel: '#CBD5E1',
    brass: '#F59E0B',
    bronze: '#D97706',

    // Text & Information
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Status Accents
    accentGreen: '#10B981',
    accentAmber: '#F59E0B',
    accentRed: '#EF4444',
  },

  // Standard numeric typography minimums
  typography: {
    hero: 68,        // >= 64px
    section: 50,     // >= 48px
    card: 40,        // >= 38px
    cardTitle: 40,   // >= 38px
    body: 36,        // >= 34px
    secondary: 34,   // >= 30px
    caption: 54,     // >= 52px
  },

  // Mobile Safe Areas for 1080x1920
  layout: {
    width: 1080,
    height: 1920,
    safeMarginX: 80,
    safeMarginY: 140,
    captionZoneTop: 1540,
    captionZoneBottom: 1780,
  },
};
