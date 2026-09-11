/**
 * motion-kit/src/salience/useVisualSalience.ts
 *
 * Remotion React hook providing dynamic per-item visual focus and salience states.
 * Connects directly with `useBeatChoreography` or accepts frame + activeItemIndex overrides.
 */

import { useCurrentFrame } from 'remotion';
import {
  UseVisualSalienceOptions,
  VisualSalienceResult,
  ItemSalienceState,
  TimelineBeat,
} from './types';
import {
  calculateItemSalienceProgress,
  computeItemSalienceState,
  resolveSalienceConfig,
} from './salienceMath';

export function useVisualSalience<T extends TimelineBeat = TimelineBeat>(
  options: UseVisualSalienceOptions<T>
): VisualSalienceResult {
  let frame = 0;
  try {
    frame = useCurrentFrame();
  } catch {
    frame = 0;
  }

  const effectiveFrame = options.currentFrameOverride !== undefined
    ? options.currentFrameOverride
    : (options.choreography?.relativeFrame ?? frame);

  const activeItemIndex = options.activeItemIndex !== undefined
    ? options.activeItemIndex
    : (options.choreography?.currentBeatIndex ?? 0);

  const transitionStartFrame = options.transitionStartFrame !== undefined
    ? options.transitionStartFrame
    : (options.choreography?.beatStartRelFrame ?? 0);

  const resolvedConfig = resolveSalienceConfig(options);
  const transitionDuration = resolvedConfig.transitionFrames;
  const prevActiveIndex = activeItemIndex > 0 ? activeItemIndex - 1 : undefined;

  const getItemState = (itemIndex: number): ItemSalienceState => {
    const progress = calculateItemSalienceProgress(
      itemIndex,
      activeItemIndex,
      effectiveFrame,
      transitionStartFrame,
      transitionDuration,
      prevActiveIndex
    );
    return computeItemSalienceState(itemIndex, activeItemIndex, progress, resolvedConfig);
  };

  const isItemActive = (itemIndex: number): boolean => itemIndex === activeItemIndex;

  return {
    mode: resolvedConfig.mode,
    activeItemIndex,
    getItemState,
    isItemActive,
    config: resolvedConfig,
  };
}
