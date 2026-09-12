/**
 * motion-kit/src/cues/beatChoreography.ts
 * Pure timeline choreography helper and React hook for Remotion scenes.
 * Eliminates hardcoded frame thresholds (e.g. 270, 540) by deriving
 * phases, beat progression, and intra-beat events from passed-in shot beats.
 */

import { useCurrentFrame } from 'remotion';

export interface TimelineBeat {
  id: string;
  shotId?: string;
  conceptId?: string;
  startFrame?: number;
  endFrame?: number;
  startSec?: number;
  endSec?: number;
  visualIntent?: string;
  primaryObject?: string;
  visualExplanationContract?: Record<string, any>;
  [key: string]: any;
}

export interface BeatChoreographyState<T extends TimelineBeat = TimelineBeat> {
  currentBeat: T;
  currentBeatIndex: number;
  totalBeats: number;
  beatProgress: number; // 0..1 within current beat
  intraBeatProgress: number; // Alias for beatProgress (0..1)
  phase: number; // 1-indexed (currentBeatIndex + 1)
  phaseProgress: number; // Alias for beatProgress
  isLastBeat: boolean;
  relativeFrame: number;
  beatStartRelFrame: number;
  beatEndRelFrame: number;
  beatDurationFrames: number;
  getEventProgress: (startFrac: number, endFrac: number) => number;
}

/**
 * Pure function computing beat choreography state from relative frame.
 */
export function calculateBeatChoreography<T extends TimelineBeat = TimelineBeat>(
  shotBeats?: T[],
  relativeFrame: number = 0,
  fallbackDuration: number = 300
): BeatChoreographyState<T> {
  if (!shotBeats || shotBeats.length === 0) {
    const defaultBeat = {
      id: 'fallback_beat',
      startFrame: 0,
      endFrame: fallbackDuration,
    } as unknown as T;
    const progress = Math.max(0, Math.min(1, relativeFrame / Math.max(1, fallbackDuration)));
    return {
      currentBeat: defaultBeat,
      currentBeatIndex: 0,
      totalBeats: 1,
      beatProgress: progress,
      intraBeatProgress: progress,
      phase: 1,
      phaseProgress: progress,
      isLastBeat: true,
      relativeFrame,
      beatStartRelFrame: 0,
      beatEndRelFrame: fallbackDuration,
      beatDurationFrames: fallbackDuration,
      getEventProgress: (startFrac: number, endFrac: number) => {
        if (endFrac <= startFrac) return progress >= startFrac ? 1 : 0;
        return Math.max(0, Math.min(1, (progress - startFrac) / (endFrac - startFrac)));
      },
    };
  }

  // Determine base offset if beats contain absolute timeline frames
  const baseOffset = shotBeats[0].startFrame ?? 0;

  // Compute relative bounds for each beat
  const relativeBeats = shotBeats.map((b, idx) => {
    let relStart: number;
    let relEnd: number;

    if (b.startFrame !== undefined && b.endFrame !== undefined) {
      relStart = b.startFrame - baseOffset;
      relEnd = b.endFrame - baseOffset;
    } else if (b.startSec !== undefined && b.endSec !== undefined) {
      relStart = Math.round(b.startSec * 30);
      relEnd = Math.round(b.endSec * 30);
    } else {
      relStart = idx * 100;
      relEnd = (idx + 1) * 100;
    }

    return {
      beat: b,
      relStart: Math.max(0, relStart),
      relEnd: Math.max(relStart + 1, relEnd),
    };
  });

  // Find active beat
  let activeIndex = 0;
  for (let i = 0; i < relativeBeats.length; i++) {
    const rb = relativeBeats[i];
    if (relativeFrame >= rb.relStart && relativeFrame < rb.relEnd) {
      activeIndex = i;
      break;
    }
    if (relativeFrame >= rb.relEnd) {
      activeIndex = i;
    }
  }

  const active = relativeBeats[activeIndex];
  const beatDuration = active.relEnd - active.relStart;
  const rawProgress = (relativeFrame - active.relStart) / Math.max(1, beatDuration);
  const beatProgress = Math.max(0, Math.min(1, rawProgress));

  return {
    currentBeat: active.beat,
    currentBeatIndex: activeIndex,
    totalBeats: shotBeats.length,
    beatProgress,
    intraBeatProgress: beatProgress,
    phase: activeIndex + 1,
    phaseProgress: beatProgress,
    isLastBeat: activeIndex === shotBeats.length - 1,
    relativeFrame,
    beatStartRelFrame: active.relStart,
    beatEndRelFrame: active.relEnd,
    beatDurationFrames: beatDuration,
    getEventProgress: (startFrac: number, endFrac: number) => {
      if (endFrac <= startFrac) return beatProgress >= startFrac ? 1 : 0;
      return Math.max(0, Math.min(1, (beatProgress - startFrac) / (endFrac - startFrac)));
    },
  };
}

/**
 * Remotion React hook to calculate beat choreography for a scene.
 */
export function useBeatChoreography<T extends TimelineBeat = TimelineBeat>(
  shotBeats?: T[],
  currentFrameOverride?: number,
  fallbackDuration?: number
): BeatChoreographyState<T> {
  let frame = 0;
  try {
    frame = useCurrentFrame();
  } catch {
    frame = 0;
  }
  const effectiveFrame = currentFrameOverride !== undefined ? currentFrameOverride : frame;
  return calculateBeatChoreography(shotBeats || [], effectiveFrame, fallbackDuration);
}
