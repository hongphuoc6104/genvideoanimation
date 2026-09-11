/**
 * motion-kit/src/salience/salienceMath.ts
 *
 * Pure mathematical state calculator for Dual Visual Focus & Salience Standard (R2).
 * Operates deterministically on frame numbers and normalized progress values.
 *
 * Standards:
 * - Mode 1 (Spotlight & Dim): activeScale = 1.05, activeOpacity = 1.0, activeBrightness = 1.20,
 *   activeGlowColor = '#38BDF8'. Inactive opacity in [0.20, 0.30] (default 0.25),
 *   inactive desaturation in [0.70, 0.80] (default 0.75).
 * - Mode 2 (Progressive Unveil): Active item has full detail, inactive items show micro-pin (#idx) or hidden.
 * - Interpolation: 12-frame smooth transitions with C0/C1 continuity and monotonic progression.
 */

import { clamp } from '../../motion-primitives';
import { snappy, decelerate, organic } from '../../motion-profiles';
import { SalienceConfig, ItemSalienceState, SalienceMode } from './types';

export const DEFAULT_SALIENCE_CONFIG: Required<SalienceConfig> = {
  mode: 'spotlight-dim',
  transitionFrames: 12,
  inactiveOpacity: 0.25,
  inactiveDesaturation: 0.75,
  activeScale: 1.05,
  activeBrightness: 1.20,
  activeGlowColor: '#38BDF8',
  inactiveDisplay: 'micro-pin',
  microPinFontSize: 30,
  allowZeroExit: false,
};

/**
 * Validates and normalizes user configuration, clamping values to canonical ranges.
 */
export function resolveSalienceConfig(userConfig?: Partial<SalienceConfig>): Required<SalienceConfig> {
  const merged = { ...DEFAULT_SALIENCE_CONFIG, ...userConfig };

  // Enforce mobile typography floor >= 30px
  const microPinFontSize = Math.max(30, merged.microPinFontSize ?? 30);

  // Mode 1 spec constraints: inactiveOpacity in [0.20, 0.30], desaturation in [0.70, 0.80]
  // If allowZeroExit is enabled and inactiveOpacity is set to 0, allow 0.0 for clean unmount/exit transitions
  const inactiveOpacity = (userConfig?.allowZeroExit && userConfig?.inactiveOpacity === 0)
    ? 0.0
    : clamp(merged.inactiveOpacity ?? 0.25, 0.20, 0.30);
  const inactiveDesaturation = clamp(merged.inactiveDesaturation ?? 0.75, 0.70, 0.80);

  return {
    ...merged,
    microPinFontSize,
    inactiveOpacity,
    inactiveDesaturation,
  };
}

/**
 * Calculates smooth salience transition progress (0..1) for a specific item.
 *
 * @param itemIndex Index of the item being queried
 * @param activeItemIndex Currently active item index
 * @param relativeFrame Current scene-relative frame number
 * @param transitionStartFrame Frame at which the active item began transitioning in
 * @param transitionDuration Duration in frames of the transition (default: 12)
 * @param previousActiveIndex Index of the previously active item (defaults to activeItemIndex - 1)
 */
export function calculateItemSalienceProgress(
  itemIndex: number,
  activeItemIndex: number,
  relativeFrame: number,
  transitionStartFrame: number = 0,
  transitionDuration: number = 12,
  previousActiveIndex?: number
): number {
  const duration = Math.max(1, transitionDuration);
  const elapsed = relativeFrame - transitionStartFrame;
  const rawT = clamp(elapsed / duration, 0, 1);

  if (itemIndex === activeItemIndex) {
    if (elapsed <= 0) return 0;
    if (elapsed >= duration) return 1;
    // C0/C1 continuous monotonic transition
    return snappy(rawT);
  }

  const prevIdx = previousActiveIndex !== undefined ? previousActiveIndex : activeItemIndex - 1;
  if (itemIndex === prevIdx && elapsed < duration) {
    // Transitioning out
    return 1 - snappy(rawT);
  }

  // Fully inactive
  return 0;
}

/**
 * Derives full ItemSalienceState for any item at the current frame.
 *
 * @param itemIndex Target item index
 * @param activeItemIndex Active item index
 * @param salienceProgress Normalized salience progress: 0 (inactive) to 1 (active)
 * @param userConfig Configuration options
 */
export function computeItemSalienceState(
  itemIndex: number,
  activeItemIndex: number,
  salienceProgress: number,
  userConfig?: Partial<SalienceConfig>
): ItemSalienceState {
  const config = resolveSalienceConfig(userConfig);
  const isActive = itemIndex === activeItemIndex;
  const isPast = itemIndex < activeItemIndex;
  const isFuture = itemIndex > activeItemIndex;
  const prog = clamp(salienceProgress, 0, 1);

  if (config.mode === 'spotlight-dim') {
    // Mode 1: Spotlight & Dim
    // Active: scale=1.05, opacity=1.0, brightness=1.20, glow active
    // Inactive: opacity=inactiveOpacity (0.20-0.30), grayscale=inactiveDesaturation (0.70-0.80), scale=1.0
    const opacity = config.inactiveOpacity + (1.0 - config.inactiveOpacity) * prog;
    const scale = 1.0 + (config.activeScale - 1.0) * prog;
    const brightness = 0.90 + (config.activeBrightness - 0.90) * prog;
    const grayscale = config.inactiveDesaturation * (1.0 - prog);
    const glowOpacity = prog;

    const filterParts: string[] = [
      `brightness(${brightness.toFixed(2)})`,
      `grayscale(${grayscale.toFixed(2)})`,
    ];

    const glowDropShadow = prog > 0.05
      ? `drop-shadow(0 0 ${Math.round(12 * prog)}px ${config.activeGlowColor})`
      : 'none';

    if (glowDropShadow !== 'none') {
      filterParts.push(glowDropShadow);
    }

    const filterString = filterParts.join(' ');
    const transformString = `scale(${scale.toFixed(4)})`;

    return {
      itemIndex,
      isActive,
      isPast,
      isFuture,
      salienceProgress: prog,
      opacity,
      scale,
      brightness,
      grayscale,
      glowOpacity,
      glowDropShadow,
      filter: filterString,
      isFullDetailVisible: true,
      showMicroPinOnly: false,
      pinLabel: `#${itemIndex + 1}`,
      style: {
        opacity,
        transform: transformString,
        transformOrigin: 'center center',
        filter: filterString,
      },
      transform: transformString,
    };
  }

  // Mode 2: Progressive Unveil / Solo Focus
  // Active: Full detail visible, scale=1.05, glow drop-shadow
  // Inactive: Show micro-pin only (#idx) or hidden (opacity=0)
  const isFullDetailVisible = isActive && prog >= 0.25;
  const showMicroPinOnly = !isFullDetailVisible && config.inactiveDisplay === 'micro-pin';

  let opacity: number;
  if (isActive) {
    opacity = clamp(prog * 1.5, 0, 1);
  } else if (config.inactiveDisplay === 'hidden') {
    opacity = 0;
  } else {
    // Micro-pin visible
    opacity = 0.60;
  }

  const scale = 1.0 + (config.activeScale - 1.0) * prog;
  const brightness = isActive ? 0.90 + (config.activeBrightness - 0.90) * prog : 0.80;
  const grayscale = isActive ? 0 : 0.80;
  const glowOpacity = prog;

  const glowDropShadow = isActive && prog > 0.05
    ? `drop-shadow(0 0 ${Math.round(10 * prog)}px ${config.activeGlowColor})`
    : 'none';

  const filterParts: string[] = [
    `brightness(${brightness.toFixed(2)})`,
    `grayscale(${grayscale.toFixed(2)})`,
  ];
  if (glowDropShadow !== 'none') {
    filterParts.push(glowDropShadow);
  }
  const filterString = filterParts.join(' ');
  const transformString = `scale(${scale.toFixed(4)})`;

  return {
    itemIndex,
    isActive,
    isPast,
    isFuture,
    salienceProgress: prog,
    opacity,
    scale,
    brightness,
    grayscale,
    glowOpacity,
    glowDropShadow,
    filter: filterString,
    isFullDetailVisible,
    showMicroPinOnly,
    pinLabel: `#${itemIndex + 1}`,
    style: {
      opacity,
      transform: transformString,
      transformOrigin: 'center center',
      filter: filterString,
    },
    transform: transformString,
  };
}
