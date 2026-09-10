/**
 * packages/caption-kit/src/types.ts
 * Type definitions for Remotion Karaoke Caption Kit components, props, and themes.
 */

import React from 'react';

export interface CaptionWord {
  id: string;
  word: string;
  start: number;       // Start time in seconds
  end: number;         // End time in seconds
  startFrame?: number; // Pre-calculated start frame
  endFrame?: number;   // Pre-calculated end frame
  cleanWord?: string;
  confidence?: number;
  punctuation?: string;
}

export interface CaptionLine {
  text: string;
  words: CaptionWord[];
}

export interface CaptionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CaptionPositionPreset = 'bottom' | 'top' | 'lower-left' | 'lower-right' | 'auto';

export interface CaptionGroup {
  id: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  position: CaptionPositionPreset;
  box: CaptionBox;
  lines: CaptionLine[];
}

export interface CaptionsData {
  version: string;
  fps: number;
  groups: CaptionGroup[];
}

export interface CaptionThemeState {
  color: string;
  opacity: number;
  fontWeight: string;
  transform: string;
}

export interface CaptionTheme {
  upcoming: CaptionThemeState;
  active: CaptionThemeState;
  spoken: CaptionThemeState;
  backgroundColor?: string;
  borderRadius?: number | string;
  padding?: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number | string;
  letterSpacing?: string;

  // Flat property aliases for direct access
  upcomingColor?: string;
  activeColor?: string;
  spokenColor?: string;
  activeTransform?: string;
  activeScale?: number;
}

export interface KaraokeThemeProps {
  fontSize?: number;
  accentColor?: string;
  upcomingColor?: string;
  spokenColor?: string;
  safeMargin?: number;
  backgroundColor?: string;
  fontFamily?: string;
}

export interface KaraokeWordProps {
  id?: string;
  word: CaptionWord | string;
  startFrame?: number;
  endFrame?: number;
  currentFrame?: number;
  fps?: number;
  activeColor?: string;
  upcomingColor?: string;
  spokenColor?: string;
  style?: React.CSSProperties;
}

export interface KaraokeLineProps {
  line: CaptionLine;
  lineIndex?: number;
  currentFrame?: number;
  fps?: number;
  theme?: CaptionTheme;
  themeProps?: KaraokeThemeProps;
  style?: React.CSSProperties;
}

export interface KaraokeGroupProps {
  group: CaptionGroup;
  currentFrame?: number;
  fps?: number;
  theme?: CaptionTheme;
  themeProps?: KaraokeThemeProps;
  style?: React.CSSProperties;
}

export interface KaraokeCaptionsProps {
  captions: CaptionsData | CaptionGroup[];
  currentFrame?: number;
  fps?: number;
  theme?: CaptionTheme;
  themeProps?: KaraokeThemeProps;
  style?: React.CSSProperties;
}
