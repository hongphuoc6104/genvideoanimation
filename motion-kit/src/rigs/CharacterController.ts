/**
 * CHARACTER CONTROLLER
 * High-level state machine, action queue coordinator, and continuous pose blending.
 * Connects physical PerformanceProfiles to character rigs.
 */

import React from 'react';
import {
  CharacterPose,
  RigComponent,
  RigProps,
} from './RigInterface';
import {
  PerformanceProfile,
  PERFORMANCE_PROFILES,
  resolveProfile,
} from '../physics/PerformanceProfile';
import {
  evaluateAnticipation,
  evaluateOvershoot,
  evaluateSettle,
  squashStretch,
} from '../physics/actions';

export interface QueuedAction {
  name: string;
  startFrame: number;
  endFrame: number;
  profile?: string | PerformanceProfile;
  overrides?: Record<string, any>;
}

export interface CharacterControllerProps extends RigProps<CharacterPose> {
  rig?: RigComponent<CharacterPose> | any;
  controller?: CharacterController;
}

export const IDLE_CHARACTER_POSE: CharacterPose = {
  bodyX: 0,
  bodyY: 0,
  bodyTilt: 0,
  squash: 1.0,
  headAngle: 0,
  headY: 0,
  eyeGazeX: 0,
  eyeGazeY: 0,
  eyeScale: 1.0,
  blink: false,
  mouthOpen: 0,
  mouthSmile: 0.3,
  eyebrowRaise: 0,
  hairSway: 0,
  root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
  rootOffset: { x: 0, y: 0 },
  torsoOffset: { x: 0, y: 0 },
  torsoAngle: 0,
  head: { rotation: 0, x: 0, y: 0 },
  limbs: {},
  expression: { gazeX: 0, gazeY: 0, mouthOpen: 0, eyeScale: 1.0 },
};

export class CharacterController extends React.Component<CharacterControllerProps> {
  private queue: QueuedAction[] = [];

  constructor(props: CharacterControllerProps = {}) {
    super(props);
  }

  /**
   * Enqueues an action along the timeline.
   */
  public queueAction(action: QueuedAction): void {
    this.queue.push(action);
    this.queue.sort((a, b) => a.startFrame - b.startFrame);
  }

  /**
   * Evaluates the character's pose at a given frame across the action queue.
   */
  public evaluate(frame: number): CharacterPose {
    if (this.queue.length === 0) {
      return IDLE_CHARACTER_POSE;
    }

    // Find the active action for this frame
    const active = this.queue.find((a) => frame >= a.startFrame && frame <= a.endFrame);
    if (active) {
      const duration = active.endFrame - active.startFrame;
      return this.evaluateAction(
        active.name,
        frame,
        active.startFrame,
        duration,
        active.profile,
        active.overrides
      );
    }

    // If frame is before first action
    if (frame < this.queue[0].startFrame) {
      const first = this.queue[0];
      return this.evaluateAction(first.name, first.startFrame, first.startFrame, first.endFrame - first.startFrame, first.profile, first.overrides);
    }

    // If frame is after last action
    const last = this.queue[this.queue.length - 1];
    if (frame > last.endFrame) {
      return this.evaluateAction(last.name, last.endFrame, last.startFrame, last.endFrame - last.startFrame, last.profile, last.overrides);
    }

    // Between actions: find surrounding actions and blend
    for (let i = 0; i < this.queue.length - 1; i++) {
      const prev = this.queue[i];
      const next = this.queue[i + 1];
      if (frame > prev.endFrame && frame < next.startFrame) {
        const gap = next.startFrame - prev.endFrame;
        const progress = (frame - prev.endFrame) / gap;
        const poseA = this.evaluateAction(prev.name, prev.endFrame, prev.startFrame, prev.endFrame - prev.startFrame, prev.profile, prev.overrides);
        const poseB = this.evaluateAction(next.name, next.startFrame, next.startFrame, next.endFrame - next.startFrame, next.profile, next.overrides);
        return this.blend(poseA, poseB, progress);
      }
    }

    return IDLE_CHARACTER_POSE;
  }

  /**
   * Evaluates an atomic character action (anticipate, overshoot, settle, react, gesture, recoil).
   */
  public evaluateAction(
    actionName: string,
    currentFrame: number,
    startFrame: number,
    duration: number,
    profileInput?: PerformanceProfile | string,
    overrides?: Record<string, any>
  ): CharacterPose {
    const knownActions = ['anticipate', 'overshoot', 'settle', 'react', 'gesture', 'recoil', 'idle'];
    if (!knownActions.includes(actionName)) {
      return IDLE_CHARACTER_POSE;
    }

    const profile = profileInput ? resolveProfile(profileInput) : PERFORMANCE_PROFILES.calm;
    const timingScale = profileInput ? (profile.timingScale ?? 1.0) : 1.0;

    // Zero-duration defense: clamp immediately to completion state
    if (duration <= 0) {
      const endPose: CharacterPose = {
        ...IDLE_CHARACTER_POSE,
        root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
        rootOffset: { x: 0, y: 0 },
        torsoOffset: { x: 0, y: 0 },
      };
      return this.applyOverrides(endPose, overrides);
    }

    const effectiveDuration = Math.max(1, Math.round(duration / timingScale));

    // Pre-start frame guard (t < 0): return start pose at t = 0
    if (currentFrame < startFrame) {
      return this.evaluateActionAtNormalizedTime(actionName, 0.0, profile, overrides);
    }

    // Post-duration frame guard (t >= 1): clamp to end pose at t = 1.0
    if (currentFrame >= startFrame + effectiveDuration) {
      return this.evaluateActionAtNormalizedTime(actionName, 1.0, profile, overrides);
    }

    const progress = (currentFrame - startFrame) / effectiveDuration;
    const tClamped = Math.max(0, Math.min(1, progress));

    return this.evaluateActionAtNormalizedTime(actionName, tClamped, profile, overrides);
  }

  private evaluateActionAtNormalizedTime(
    actionName: string,
    t: number,
    profile: PerformanceProfile,
    overrides?: Record<string, any>
  ): CharacterPose {
    let basePose: CharacterPose = {
      ...IDLE_CHARACTER_POSE,
      root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
      rootOffset: { x: 0, y: 0 },
      torsoOffset: { x: 0, y: 0 },
      head: { rotation: 0, x: 0, y: 0 },
      expression: { gazeX: 0, gazeY: 0, mouthOpen: 0, eyeScale: 1.0 },
    };

    switch (actionName) {
      case 'anticipate': {
        const pullBack = profile.anticipation?.pullBack ?? profile.anticipationRatio ?? 0.1;
        const disp = evaluateAnticipation(t, profile) * 40.0;
        const squashFactor = profile.anticipation?.squashRatio ?? profile.squashFactor ?? 0.85;
        const currentSquash = 1.0 - (1.0 - squashFactor) * Math.sin(Math.PI * t);
        const { scaleX, scaleY } = squashStretch(currentSquash);

        basePose = {
          ...basePose,
          squash: currentSquash,
          root: { x: 0, y: disp * 0.5, rotation: -disp * 0.2, scaleX, scaleY, squash: currentSquash },
          rootOffset: { x: disp, y: disp * 0.5 },
          torsoOffset: { x: disp, y: disp * 0.5 },
          head: { rotation: -disp * 0.15, x: 0, y: -disp * 0.2 },
          expression: { gazeX: 0, gazeY: -0.2, mouthOpen: 0.1 * (1 - t), eyeScale: 1.1 },
        };
        break;
      }

      case 'overshoot': {
        const p = evaluateOvershoot(t, profile);
        const amp = profile.overshoot?.amplitude ?? profile.overshootAmplitude ?? 0.1;
        const stretchY = 1.0 + amp * 0.5 * (1.0 - t);
        const { scaleX, scaleY } = squashStretch(stretchY);
        const yOffset = p * 20.0;
        const xOffset = p * 10.0;

        basePose = {
          ...basePose,
          squash: stretchY,
          root: { x: xOffset, y: yOffset, rotation: Math.sin(Math.PI * t) * 8.0, scaleX, scaleY, squash: stretchY },
          rootOffset: { x: xOffset, y: yOffset },
          torsoOffset: { x: xOffset, y: yOffset },
          head: { rotation: Math.sin(Math.PI * t) * 5.0, x: 0, y: yOffset * 0.5 },
          expression: { gazeX: 0, gazeY: 0, mouthOpen: Math.max(0, (p - 1.0) * 2.0), eyeScale: 1.0 },
        };
        break;
      }

      case 'settle': {
        const s = evaluateSettle(t, profile);
        const yOffset = (1.0 - s) * 8.0;
        const xOffset = (1.0 - s) * 4.0;
        const { scaleX, scaleY } = squashStretch(1.0);

        basePose = {
          ...basePose,
          squash: 1.0,
          root: { x: xOffset, y: yOffset, rotation: (1.0 - s) * 3.0, scaleX, scaleY, squash: 1.0 },
          rootOffset: { x: xOffset, y: yOffset },
          torsoOffset: { x: xOffset, y: yOffset },
          head: { rotation: (1.0 - s) * 2.0, x: 0, y: yOffset * 0.5 },
          expression: { gazeX: 0, gazeY: 0, mouthOpen: 0.0, eyeScale: 1.0 },
        };
        break;
      }

      case 'react':
      case 'recoil': {
        // Multi-phase dynamic reaction: Anticipation recoil -> Pop overshoot -> Settle
        let disp = 0;
        let sq = 1.0;
        if (t < 0.3) {
          const subT = t / 0.3;
          disp = evaluateAnticipation(subT, profile) * 30.0;
          sq = 1.0 - (1.0 - profile.squashFactor) * Math.sin(Math.PI * subT);
        } else if (t < 0.7) {
          const subT = (t - 0.3) / 0.4;
          const p = evaluateOvershoot(subT, profile);
          disp = (p - 1.0) * 25.0;
          sq = 1.0 + profile.overshootAmplitude * 0.4 * (1.0 - subT);
        } else {
          const subT = (t - 0.7) / 0.3;
          const s = evaluateSettle(subT, profile);
          disp = (1.0 - s) * 10.0;
          sq = 1.0;
        }

        const { scaleX, scaleY } = squashStretch(sq);
        basePose = {
          ...basePose,
          squash: sq,
          root: { x: disp, y: disp * 0.4, rotation: disp * 0.3, scaleX, scaleY, squash: sq },
          rootOffset: { x: disp, y: disp * 0.4 },
          torsoOffset: { x: disp, y: disp * 0.4 },
          head: { rotation: disp * 0.2, x: 0, y: disp * 0.2 },
          expression: { gazeX: disp > 0 ? 0.4 : -0.4, gazeY: 0, mouthOpen: 0.3 * (1 - t), eyeScale: 1.2 },
        };
        break;
      }

      case 'gesture': {
        const ease = profile.primaryEasing ? profile.primaryEasing(t) : evaluateOvershoot(t, profile);
        basePose = {
          ...basePose,
          root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
          head: { rotation: Math.sin(Math.PI * t) * 10, x: 0, y: 0 },
          expression: { gazeX: Math.sin(Math.PI * t) * 0.5, gazeY: 0, mouthOpen: 0.2, eyeScale: 1.0 },
        };
        break;
      }

      default:
        break;
    }

    return this.applyOverrides(basePose, overrides);
  }

  private applyOverrides(pose: CharacterPose, overrides?: Record<string, any>): CharacterPose {
    if (!overrides || typeof overrides !== 'object') {
      return pose;
    }

    const merged = { ...pose };
    for (const [key, val] of Object.entries(overrides)) {
      if (val && typeof val === 'object' && !Array.isArray(val) && (merged as any)[key]) {
        (merged as any)[key] = { ...(merged as any)[key], ...val };
      } else {
        (merged as any)[key] = val;
      }
    }
    return merged;
  }

  /**
   * Computes linear and rotational interpolation between two poses.
   * Clamps non-finite progress (NaN, Infinity) safely to [0, 1].
   */
  public blend(poseA: CharacterPose, poseB: CharacterPose, progress: number): CharacterPose {
    const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;

    const lerpNum = (a?: number, b?: number, def = 0) => {
      const vA = a !== undefined && Number.isFinite(a) ? a : def;
      const vB = b !== undefined && Number.isFinite(b) ? b : def;
      return vA + (vB - vA) * p;
    };

    const rootA = poseA.root || {};
    const rootB = poseB.root || {};
    const blendedRoot = {
      x: lerpNum(rootA.x, rootB.x, 0),
      y: lerpNum(rootA.y, rootB.y, 0),
      rotation: lerpNum(rootA.rotation, rootB.rotation, 0),
      scaleX: lerpNum(rootA.scaleX, rootB.scaleX, 1),
      scaleY: lerpNum(rootA.scaleY, rootB.scaleY, 1),
      squash: lerpNum(rootA.squash, rootB.squash, 1),
    };

    const offA = poseA.rootOffset || {};
    const offB = poseB.rootOffset || {};
    const blendedOffset = {
      x: lerpNum(offA.x, offB.x, 0),
      y: lerpNum(offA.y, offB.y, 0),
    };

    const torsoA = poseA.torsoOffset || {};
    const torsoB = poseB.torsoOffset || {};
    const blendedTorso = {
      x: lerpNum(torsoA.x, torsoB.x, 0),
      y: lerpNum(torsoA.y, torsoB.y, 0),
    };

    const headA = poseA.head || {};
    const headB = poseB.head || {};
    const blendedHead = {
      ...headA,
      ...headB,
      rotation: lerpNum(headA.rotation, headB.rotation, 0),
      x: lerpNum(headA.x, headB.x, 0),
      y: lerpNum(headA.y, headB.y, 0),
    };

    const exprA = poseA.expression || {};
    const exprB = poseB.expression || {};
    const blendedExpr = {
      ...exprA,
      ...exprB,
      gazeX: lerpNum(exprA.gazeX, exprB.gazeX, 0),
      gazeY: lerpNum(exprA.gazeY, exprB.gazeY, 0),
      mouthOpen: lerpNum(exprA.mouthOpen, exprB.mouthOpen, 0),
      eyeScale: lerpNum(exprA.eyeScale, exprB.eyeScale, 1),
    };

    // Deep blend of limbs dictionary
    const limbsA = poseA.limbs || {};
    const limbsB = poseB.limbs || {};
    const allLimbKeys = Array.from(new Set([...Object.keys(limbsA), ...Object.keys(limbsB)]));
    const blendedLimbs: Record<string, any> = {};

    for (const key of allLimbKeys) {
      const limbA = limbsA[key] || {};
      const limbB = limbsB[key] || {};
      blendedLimbs[key] = {
        ...limbA,
        ...limbB,
        x: lerpNum(limbA.x, limbB.x, 0),
        y: lerpNum(limbA.y, limbB.y, 0),
        rotation: lerpNum(limbA.rotation, limbB.rotation, 0),
      };
    }

    return {
      ...poseA,
      ...poseB,
      bodyX: lerpNum(poseA.bodyX, poseB.bodyX, 0),
      bodyY: lerpNum(poseA.bodyY, poseB.bodyY, 0),
      bodyTilt: lerpNum(poseA.bodyTilt, poseB.bodyTilt, 0),
      squash: lerpNum(poseA.squash, poseB.squash, 1),
      root: blendedRoot,
      rootOffset: blendedOffset,
      torsoOffset: blendedTorso,
      head: blendedHead,
      limbs: blendedLimbs,
      expression: blendedExpr,
    };
  }

  public render(): React.ReactNode {
    const { rig: Rig, pose = IDLE_CHARACTER_POSE, x = 0, y = 0, scale = 1, flip = false, color, accent, secondaryColor, children } = this.props;
    if (!Rig) {
      return null;
    }
    if (typeof Rig === 'function') {
      return React.createElement(Rig, {
        pose,
        x,
        y,
        scale,
        flip,
        color,
        accent,
        secondaryColor,
      }, children);
    }
    if (typeof Rig.render === 'function') {
      return Rig.render(pose, { x, y, scale, flip, color, accent, secondaryColor });
    }
    return null;
  }
}
