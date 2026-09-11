/**
 * motion-kit/src/salience/types.ts
 *
 * Type definitions for the Dual Visual Focus & Salience Standard (R2).
 * Supports:
 * 1. Spotlight & Dim (Preserve mental map: active 1.05x, inactive 20%-30% desaturated)
 * 2. Progressive Unveil / Solo Focus (Active full detail, inactive micro-pin or hidden)
 */

import React from 'react';
import { BeatChoreographyState, TimelineBeat } from '../cues/beatChoreography';

export type { BeatChoreographyState, TimelineBeat };

export type SalienceMode = 'spotlight-dim' | 'progressive-unveil';

export interface SalienceConfig {
  /**
   * Mode 1: 'spotlight-dim' (Preserve mental map: active 1.05x, inactive 20%-30% desaturated)
   * Mode 2: 'progressive-unveil' (Solo focus: active full detail, inactive micro-pin or hidden)
   */
  mode: SalienceMode;

  /**
   * Duration in frames for transition between active items.
   * Default: 12 frames (0.4s at 30fps). Set to 0 for instant step.
   */
  transitionFrames?: number;

  /**
   * Opacity for inactive items in 'spotlight-dim' mode.
   * Spec requirement: 0.20 to 0.30. Default: 0.25.
   */
  inactiveOpacity?: number;

  /**
   * Desaturation factor for inactive items in 'spotlight-dim' mode (0 = full color, 1 = fully monochrome).
   * Spec requirement: 0.70 to 0.80. Default: 0.75.
   */
  inactiveDesaturation?: number;

  /**
   * Scale factor applied to the active item.
   * Spec requirement: 1.05x. Default: 1.05.
   */
  activeScale?: number;

  /**
   * Brightness boost for the active item.
   * Default: 1.20 (120% luminance).
   */
  activeBrightness?: number;

  /**
   * Primary glow / illumination color for active item border.
   * Default: '#38BDF8' (Sky blue).
   */
  activeGlowColor?: string;

  /**
   * Inactive item display strategy for 'progressive-unveil' mode.
   * 'micro-pin': renders '#idx' anchor pin.
   * 'hidden': unmounts / sets opacity to 0.
   * Default: 'micro-pin'.
   */
  inactiveDisplay?: 'micro-pin' | 'hidden';

  /**
   * Font size for micro-pin text. Must be >= 30 for mobile typography compliance.
   * Default: 30.
   */
  microPinFontSize?: number;

  /**
   * Allows inactiveOpacity to drop to 0.0 for clean unmount/exit transitions (Zero-Ghosting).
   * When false or omitted, inactiveOpacity in spotlight-dim is clamped to [0.20, 0.30].
   */
  allowZeroExit?: boolean;
}

export interface ItemSalienceState {
  itemIndex: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;

  /** Normalized transition progress: 0 (fully inactive) -> 1 (fully active) */
  salienceProgress: number;

  /** Computed visual properties */
  opacity: number;
  scale: number;
  brightness: number;
  grayscale: number;
  glowOpacity: number;
  glowDropShadow: string;

  /** Ready-to-use CSS filter string (e.g. "brightness(1.2) grayscale(0) drop-shadow(...)") */
  filter: string;

  /** Mode 2 flags */
  isFullDetailVisible: boolean;
  showMicroPinOnly: boolean;
  pinLabel: string; // e.g. "#1", "#2"

  /** React CSS style object */
  style: React.CSSProperties;

  /** SVG transform string e.g. "scale(1.05)" */
  transform: string;
}

export interface UseVisualSalienceOptions<T extends TimelineBeat = TimelineBeat> extends Partial<SalienceConfig> {
  mode: SalienceMode;
  /** Active item index (0-indexed) */
  activeItemIndex?: number;
  /** Optional direct binding to beat choreography state */
  choreography?: BeatChoreographyState<T>;
  /** Optional override of current frame (defaults to useCurrentFrame()) */
  currentFrameOverride?: number;
  /** Optional beat start frame (if not using choreography) */
  transitionStartFrame?: number;
}

export interface VisualSalienceResult {
  mode: SalienceMode;
  activeItemIndex: number;
  getItemState: (itemIndex: number) => ItemSalienceState;
  isItemActive: (itemIndex: number) => boolean;
  config: Required<SalienceConfig>;
}

export type SalienceContextValue = VisualSalienceResult;

export interface MicroPinProps {
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  label: string; // e.g. "#1"
  color?: string;
  pinRadius?: number;
  fontSize?: number; // Enforced to Math.max(30, fontSize)
  badgeBackground?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface SalienceContainerProps<T extends TimelineBeat = TimelineBeat> extends UseVisualSalienceOptions<T> {
  children: React.ReactNode;
}

export interface SalienceItemProps {
  index: number;
  as?: 'svg' | 'html';
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  className?: string;
  /**
   * When true, preserves 100% opacity on the container root element to act as an opaque shield,
   * preventing background vectors from shining through card containers.
   */
  opaqueShield?: boolean;
  children: React.ReactNode | ((state: ItemSalienceState) => React.ReactNode);
}
