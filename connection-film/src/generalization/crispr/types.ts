/**
 * CRISPR-Cas9 Explainer Film Types & Academic Design Tokens
 * V3.3 Mobile-First 1080x1920 (9:16)
 */

export interface CrisprBeat {
  id: string;
  shotId: string;
  startFrame: number;
  endFrame: number;
  startSec: number;
  endSec: number;
  conceptId: string;
  visualIntent: string;
  primaryObject: string;
  cameraIntent: string;
  sfxIntent?: {
    asset: string;
    frame: number;
    volume: number;
  };
  captionIntent: {
    displayText: string;
    layout: 'bottom' | 'top' | 'center';
    fontSize: number;
  };
  visualExplanationContract: {
    spatialRelationship: string;
    transformationType: string;
  };
}

export interface ShotSpecShot {
  id: string;
  narrative_purpose: string;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  start_state: {
    camera: { x: number; y: number; zoom: number };
    phase: string;
  };
  end_state: {
    camera: { x: number; y: number; zoom: number };
    phase: string;
  };
  impact_frames: number[];
}

export interface ShotSpecTransition {
  from_shot: string;
  to_shot: string;
  transition_type:
    | 'object_match'
    | 'camera_carry'
    | 'shape_morph'
    | 'foreground_wipe'
    | 'continuing_trajectory'
    | 'semantic_zoom'
    | 'motivated_iris'
    | 'match_cut';
  transition_frames: [number, number];
  expected_visual_discontinuity: number;
  description: string;
}

export interface BasePair {
  index: number;
  base1: 'A' | 'T' | 'G' | 'C';
  base2: 'A' | 'T' | 'G' | 'C';
  isPam?: boolean;
  isTarget?: boolean;
  isMutated?: boolean;
  isCut?: boolean;
}

export const CRISPR_THEME = {
  colors: {
    bgDark: '#0A0F1D',
    bgCard: '#131D33',
    bgCardBorder: '#1E2D4A',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    // Nucleotides
    adenine: '#EF4444', // Red (A)
    thymine: '#10B981', // Emerald (T)
    guanine: '#06B6D4', // Cyan (G)
    cytosine: '#F59E0B', // Amber (C)
    // Functional actors
    cas9Primary: '#6366F1', // Indigo
    cas9Secondary: '#818CF8', // Light Indigo
    cas9Glow: 'rgba(99, 102, 241, 0.35)',
    sgrna: '#22C55E', // Neon Green
    sgrnaGlow: 'rgba(34, 197, 94, 0.4)',
    cleavageRuvC: '#EC4899', // Pink
    cleavageHnh: '#8B5CF6', // Purple
    cleavageSpark: '#F43F5E', // Rose spark
    donorTemplate: '#EAB308', // Gold
    donorGlow: 'rgba(234, 179, 8, 0.4)',
    accentBlue: '#3B82F6',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  typography: {
    hero: 64,
    section: 48,
    cardTitle: 38,
    body: 34,
    secondary: 30,
    caption: 54,
  },
} as const;
