/**
 * packages/narration-kit/src/captions/types.ts
 * Authoritative type definitions for Caption Segmentation and Placement.
 */

import { WordTiming } from '../alignment/AlignmentProvider';

export interface CaptionWord {
  id: string;
  word: string;
  start: number;      // seconds
  end: number;        // seconds
  startFrame: number; // Math.round(start * fps)
  endFrame: number;   // Math.round(end * fps)
  cleanWord?: string;
  confidence?: number;
  punctuation?: string;
}

export interface CaptionLine {
  text: string;
  words: CaptionWord[];
}

export interface CaptionBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Alias for CaptionBoundingBox
export type CaptionBox = CaptionBoundingBox;

export interface SubjectRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type CaptionPosition = 'bottom' | 'top' | 'lower-left' | 'lower-right' | 'auto';
export type PlacementPreset = CaptionPosition;
export type ResolvedPlacement = 'bottom' | 'top' | 'lower-left' | 'lower-right';

export interface CaptionGroup {
  id: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  position: CaptionPosition;
  box: CaptionBoundingBox;
  lines: CaptionLine[];
}

export interface CaptionsManifest {
  version: '1.0.0';
  fps: number;
  groups: CaptionGroup[];
}

export type CaptionsData = CaptionsManifest;

export interface ShotSpecPlacementInput {
  shot_id?: string;
  duration_frames?: number;
  fps?: number;
  viewport?: { width: number; height: number };
  safe_margin?: number;
  subject_region?: { x: number; y: number; width: number; height: number };
  caption_position?: CaptionPosition;
}

export interface SegmentOptions {
  fps?: number;                        // default: 30
  maxLinesPerGroup?: number;           // default: 2
  maxCharsPerLine?: number;            // default: 42
  maxCps?: number;                     // default: 21.0
  minDurationSec?: number;             // default: 0.8
  maxDurationSec?: number;             // default: 7.0
  acousticPauseThresholdSec?: number;  // default: 0.3
  position?: CaptionPosition;          // default: 'bottom'
  shotSpec?: ShotSpecPlacementInput;   // ShotSpec for safe placement and collision avoidance
  viewport?: { width: number; height: number }; // default: { width: 1920, height: 1080 }
  safeMargin?: number;                 // default: 96
}

export interface PlacementOptions {
  viewport?: { width: number; height: number };
  safeMargin?: number;
  safe_margin?: number;
  position?: CaptionPosition;
  caption_position?: CaptionPosition;
  subjectRegion?: { x: number; y: number; width: number; height: number };
  subject_region?: { x: number; y: number; width: number; height: number };
  lineCount?: number;
  boxWidth?: number;
  boxHeight?: number;
}

export interface PlannedPlacement {
  box: CaptionBoundingBox;
  preset: CaptionPosition;
  resolvedPosition: ResolvedPlacement;
  collidesWithSubject: boolean;
  collisionArea: number;
}

export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
  reason?: string;
  collisionArea?: number;
}
