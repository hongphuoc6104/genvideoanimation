/**
 * HUMAN RIG IMPLEMENTATION
 * Articulated humanoid character adhering to RigInterface with >= 19 anatomical joints.
 * Supports dual-mode instantiation (class and JSX component).
 */

import React from 'react';
import {
  CharacterPose,
  RigGeometryLayer,
  RigInterface,
  RigJoint,
  RigProps,
  RigRenderOptions,
} from './RigInterface';

const INK = '#111333';
const DEFAULT_SKIN = '#ffd1a4';
const DEFAULT_HAIR = '#3d261a';
const DEFAULT_SHIRT = '#3b82f6';
const DEFAULT_ACCENT = '#ffd16c';
const DEFAULT_PANTS = '#1e293b';
const DEFAULT_SHOES = '#0f172a';

const inkStroke = {
  stroke: INK,
  strokeWidth: 5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DEFAULT_HUMAN_POSE: CharacterPose = {
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
  armLeftAngle: 15,
  armRightAngle: -15,
  elbowLeftAngle: 20,
  elbowRightAngle: -20,
  handLeftPose: 'open',
  handRightPose: 'open',
  legLeftAngle: 0,
  legRightAngle: 0,
  kneeLeftBend: 0,
  kneeRightBend: 0,
  root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
  rootOffset: { x: 0, y: 0 },
  torsoOffset: { x: 0, y: 0 },
  head: { rotation: 0, x: 0, y: 0 },
  limbs: {
    shoulderL: { rotation: 15 },
    elbowL: { rotation: 20 },
    wristL: { rotation: 0 },
    shoulderR: { rotation: -15 },
    elbowR: { rotation: -20 },
    wristR: { rotation: 0 },
    hipL: { rotation: 0 },
    kneeL: { rotation: 0 },
    footL: { rotation: 0 },
    hipR: { rotation: 0 },
    kneeR: { rotation: 0 },
    footR: { rotation: 0 },
  },
  expression: { gazeX: 0, gazeY: 0, mouthOpen: 0, mouthShape: 'neutral', eyeScale: 1.0 },
};

export class HumanRig extends React.Component<RigProps> implements RigInterface {
  public readonly id = 'human-rig';
  public readonly type = 'human' as const;
  public defaultPose: CharacterPose = DEFAULT_HUMAN_POSE;

  constructor(props: RigProps = {}) {
    super(props);
  }

  /**
   * Returns registered pivots for all 25 anatomical humanoid joints.
   */
  public getJointPivots(): Record<string, [number, number]> {
    return {
      root: [0, 70],
      pelvis: [0, 70],
      spine: [0, 30],
      torso: [0, 0],
      chest: [0, 0],
      neck: [0, -35],
      head: [0, -52],

      // Left arm chain
      shoulderLeft: [-38, -25],
      armLeftUpper: [-38, -25],
      upperArmLeft: [-38, -25],
      shoulderL: [-38, -25],
      elbowLeft: [-38, 17],
      armLeftLower: [-38, 17],
      forearmLeft: [-38, 17],
      elbowL: [-38, 17],
      wristLeft: [-38, 61],
      handLeft: [-38, 61],
      wristL: [-38, 61],

      // Right arm chain
      shoulderRight: [38, -25],
      armRightUpper: [38, -25],
      upperArmRight: [38, -25],
      shoulderR: [38, -25],
      elbowRight: [38, 17],
      armRightLower: [38, 17],
      forearmRight: [38, 17],
      elbowR: [38, 17],
      wristRight: [38, 61],
      handRight: [38, 61],
      wristR: [38, 61],

      // Left leg chain
      hipLeft: [-18, 70],
      legLeftUpper: [-18, 70],
      thighLeft: [-18, 70],
      hipL: [-18, 70],
      kneeLeft: [-18, 125],
      legLeftLower: [-18, 125],
      calfLeft: [-18, 125],
      kneeL: [-18, 125],
      footLeft: [-18, 180],
      footL: [-18, 180],

      // Right leg chain
      hipRight: [18, 70],
      legRightUpper: [18, 70],
      thighRight: [18, 70],
      hipR: [18, 70],
      kneeRight: [18, 125],
      legRightLower: [18, 125],
      calfRight: [18, 125],
      kneeR: [18, 125],
      footRight: [18, 180],
      footR: [18, 180],
    };
  }

  /**
   * Returns joint hierarchy according to RigJoint interface.
   */
  public getJoints(pose: CharacterPose = this.defaultPose): Record<string, RigJoint> {
    const pivots = this.getJointPivots();
    const joints: Record<string, RigJoint> = {};

    for (const [id, [px, py]] of Object.entries(pivots)) {
      const limbRot = pose.limbs?.[id]?.rotation ?? 0;
      joints[id] = {
        id,
        name: id,
        position: { x: px, y: py },
        rotation: limbRot,
      };
    }
    return joints;
  }

  public getLayers(): RigGeometryLayer[] {
    return [
      {
        id: 'lower-body',
        zIndex: 1,
        render: (transforms) => {
          return <g data-part="lower-body" />;
        },
      },
      {
        id: 'torso-group',
        zIndex: 2,
        render: (transforms) => {
          return <g data-part="torso-group" />;
        },
      },
    ];
  }

  /**
   * Returns distinct SVG path geometries for facial phoneme mouth shapes.
   * Falls back cleanly to 'neutral' for unrecognized phoneme shapes.
   */
  public getMouthPath(shape: string): string {
    switch (shape) {
      case 'smile':
        return 'M 35 78 Q 50 92 65 78';
      case 'round':
        return 'M 45 75 A 5 5 0 1 0 55 75 A 5 5 0 1 0 45 75';
      case 'wide':
        return 'M 30 80 Q 50 85 70 80 Q 50 75 30 80';
      case 'neutral':
      default:
        return 'M 40 80 Q 50 80 60 80';
    }
  }

  /**
   * Knee joint hinge limit [0.0, 150.0] deg to prevent reverse anatomical bending.
   */
  public clampKneeAngle(angle: number): number {
    return Math.max(0.0, Math.min(150.0, angle));
  }

  /**
   * Physiological eyebrow tilt limit [-30.0, +30.0] deg.
   */
  public clampEyebrowTilt(tilt: number): number {
    return Math.max(-30.0, Math.min(30.0, tilt));
  }

  /**
   * Physiological eye scale limit >= 0.0.
   */
  public clampEyeScale(scale: number): number {
    return Math.max(0.0, scale);
  }

  /**
   * Renders articulated humanoid character into JSX.
   */
  public render(
    poseInput?: CharacterPose,
    options: RigRenderOptions = {}
  ): React.ReactNode {
    const pose = poseInput || this.props?.pose || this.defaultPose;
    const opts = { ...this.props, ...options };

    const skinColor = opts.palette?.skin || DEFAULT_SKIN;
    const shirtColor = opts.palette?.body || opts.color || DEFAULT_SHIRT;
    const pantsColor = opts.secondaryColor || DEFAULT_PANTS;
    const accentColor = opts.palette?.accent || opts.accent || DEFAULT_ACCENT;

    const x = opts.x ?? 0;
    const y = opts.y ?? 0;
    const scale = opts.scale ?? 1;
    const flip = opts.flip ?? false;
    const flipSign = flip ? -1 : 1;

    const limbs = pose.limbs || {};
    const root = pose.root || {};
    const expression = pose.expression || {};

    const rawSquash = root.squash ?? pose.squash ?? 1.0;
    const safeSquash = Math.max(0.04, rawSquash);
    const scaleY = safeSquash;
    const scaleX = Math.min(5.0, 1.0 / Math.sqrt(safeSquash));

    const bodyX = root.x ?? pose.bodyX ?? 0;
    const bodyY = root.y ?? pose.bodyY ?? 0;
    const bodyTilt = root.rotation ?? pose.bodyTilt ?? 0;

    // Head
    const headAngle = pose.head?.rotation ?? pose.headAngle ?? 0;
    const headY = pose.head?.y ?? pose.headY ?? 0;

    // Arms (present unless limbs specifically omits it while defining other limbs)
    const hasLimbsSpecified = Object.keys(limbs).length > 0;
    const hasLeftArm = !hasLimbsSpecified || Boolean(limbs.shoulderLeft || limbs.shoulderL || limbs.armLeft || pose.armLeftAngle !== undefined);
    const hasRightArm = !hasLimbsSpecified || Boolean(limbs.shoulderRight || limbs.shoulderR || limbs.armRight || pose.armRightAngle !== undefined);

    const armLeftRot = limbs.shoulderLeft?.rotation ?? limbs.shoulderL?.rotation ?? (limbs.armLeft as any)?.rotation ?? (limbs.armLeft as any)?.shoulderAngle ?? pose.armLeftAngle ?? 15;
    const elbowLeftRot = limbs.elbowLeft?.rotation ?? limbs.elbowL?.rotation ?? (limbs.armLeft as any)?.elbowRotation ?? (limbs.armLeft as any)?.elbowAngle ?? pose.elbowLeftAngle ?? 20;

    const armRightRot = limbs.shoulderRight?.rotation ?? limbs.shoulderR?.rotation ?? (limbs.armRight as any)?.rotation ?? (limbs.armRight as any)?.shoulderAngle ?? pose.armRightAngle ?? -15;
    const elbowRightRot = limbs.elbowRight?.rotation ?? limbs.elbowR?.rotation ?? (limbs.armRight as any)?.elbowRotation ?? (limbs.armRight as any)?.elbowAngle ?? pose.elbowRightAngle ?? -20;

    // Legs
    const rawKneeL = limbs.kneeLeft?.rotation ?? limbs.kneeL?.rotation ?? pose.kneeLeftBend ?? 0;
    const rawKneeR = limbs.kneeRight?.rotation ?? limbs.kneeR?.rotation ?? pose.kneeRightBend ?? 0;
    const kneeLeftBend = this.clampKneeAngle(rawKneeL);
    const kneeRightBend = this.clampKneeAngle(rawKneeR);

    const legLeftRot = limbs.hipLeft?.rotation ?? limbs.hipL?.rotation ?? pose.legLeftAngle ?? 0;
    const legRightRot = limbs.hipRight?.rotation ?? limbs.hipR?.rotation ?? pose.legRightAngle ?? 0;

    // Eyes and Face
    const rawEyeScale = expression.eyeScale ?? pose.eyeScale ?? 1.0;
    const eyeScale = this.clampEyeScale(rawEyeScale);
    const rawEyebrowTilt = expression.eyebrowTilt ?? 0;
    const eyebrowTilt = this.clampEyebrowTilt(rawEyebrowTilt);
    const eyebrowRaise = expression.eyebrowRaise ?? pose.eyebrowRaise ?? 0;

    const gazeX = Math.max(-1, Math.min(1, expression.gazeX ?? pose.eyeGazeX ?? 0));
    const gazeY = Math.max(-1, Math.min(1, expression.gazeY ?? pose.eyeGazeY ?? 0));
    const pupilX = gazeX * 4;
    const pupilY = gazeY * 3;

    const mouthShape = expression.mouthShape || 'neutral';
    const mouthPath = this.getMouthPath(mouthShape);

    return (
      <g
        data-character-rig="human"
        transform={`translate(${x}, ${y}) scale(${scale * flipSign}, ${scale})`}
      >
        {/* 1. LOWER BODY: LEGS & FEET */}
        <g data-part="lower-body" transform={`translate(${bodyX}, ${bodyY + 70})`}>
          {/* Left Leg */}
          <g data-part="leg-left" transform={`translate(-18, 0) rotate(${legLeftRot})`}>
            <rect x={-9} y={0} width={18} height={55} rx={8} fill={pantsColor} {...inkStroke} />
            <g transform={`translate(0, 50) rotate(${kneeLeftBend})`}>
              <rect x={-8} y={0} width={16} height={55} rx={7} fill={pantsColor} {...inkStroke} />
              <path d="M -9 50 L 14 50 C 18 50, 18 64, 12 64 L -9 64 Z" fill={DEFAULT_SHOES} {...inkStroke} strokeWidth={4} />
            </g>
          </g>

          {/* Right Leg */}
          <g data-part="leg-right" transform={`translate(18, 0) rotate(${legRightRot})`}>
            <rect x={-9} y={0} width={18} height={55} rx={8} fill={pantsColor} {...inkStroke} />
            <g transform={`translate(0, 50) rotate(${kneeRightBend})`}>
              <rect x={-8} y={0} width={16} height={55} rx={7} fill={pantsColor} {...inkStroke} />
              <path d="M -9 50 L 14 50 C 18 50, 18 64, 12 64 L -9 64 Z" fill={DEFAULT_SHOES} {...inkStroke} strokeWidth={4} />
            </g>
          </g>
        </g>

        {/* 2. TORSO & UPPER BODY */}
        <g
          data-part="torso-group"
          transform={`translate(${bodyX}, ${bodyY}) rotate(${bodyTilt}) scale(${scaleX}, ${scaleY})`}
        >
          {/* Left Arm (only rendered if limb exists / amputation tolerance) */}
          {hasLeftArm && (
            <g data-part="arm-left" transform={`translate(-38, -25) rotate(${armLeftRot})`}>
              <rect x={-8} y={0} width={16} height={48} rx={8} fill={shirtColor} {...inkStroke} />
              <g transform={`translate(0, 42) rotate(${elbowLeftRot})`}>
                <rect x={-7} y={0} width={14} height={46} rx={7} fill={shirtColor} {...inkStroke} />
                <circle cx={0} cy={52} r={9} fill={skinColor} {...inkStroke} strokeWidth={4} />
              </g>
            </g>
          )}

          {/* Torso Shirt */}
          <rect x={-32} y={50} width={64} height={25} rx={6} fill={pantsColor} {...inkStroke} />
          <path d="M -36 -30 L 36 -30 L 32 52 L -32 52 Z" fill={shirtColor} {...inkStroke} />

          {/* Head & Neck */}
          <g data-part="head-group" transform={`translate(0, ${-40 + headY}) rotate(${headAngle})`}>
            <rect x={-10} y={-10} width={20} height={20} fill={skinColor} {...inkStroke} strokeWidth={4} />
            <ellipse cx={0} cy={-38} rx={32} ry={36} fill={skinColor} {...inkStroke} />

            {/* Eyebrows with tilt */}
            <g data-part="eyebrows" transform={`translate(0, ${-eyebrowRaise * 5}) rotate(${eyebrowTilt})`}>
              <line x1={-20} y1={-48} x2={-8} y2={-48} {...inkStroke} strokeWidth={4} />
              <line x1={8} y1={-48} x2={20} y2={-48} {...inkStroke} strokeWidth={4} />
            </g>

            {/* Eyes */}
            <g data-part="eyes">
              <g transform={`translate(-14, -38) scale(${eyeScale})`}>
                <ellipse cx={0} cy={0} rx={8} ry={9} fill="#ffffff" {...inkStroke} strokeWidth={3} />
                <circle cx={pupilX} cy={pupilY} r={4.5} fill={INK} />
              </g>
              <g transform={`translate(14, -38) scale(${eyeScale})`}>
                <ellipse cx={0} cy={0} rx={8} ry={9} fill="#ffffff" {...inkStroke} strokeWidth={3} />
                <circle cx={pupilX} cy={pupilY} r={4.5} fill={INK} />
              </g>
            </g>

            {/* Mouth */}
            <g data-part="mouth" transform="translate(-50, -65)">
              <path d={mouthPath} fill="none" {...inkStroke} strokeWidth={3.5} />
            </g>
          </g>

          {/* Right Arm (only rendered if limb exists / amputation tolerance) */}
          {hasRightArm && (
            <g data-part="arm-right" transform={`translate(38, -25) rotate(${armRightRot})`}>
              <rect x={-8} y={0} width={16} height={48} rx={8} fill={shirtColor} {...inkStroke} />
              <g transform={`translate(0, 42) rotate(${elbowRightRot})`}>
                <rect x={-7} y={0} width={14} height={46} rx={7} fill={shirtColor} {...inkStroke} />
                <circle cx={0} cy={52} r={9} fill={skinColor} {...inkStroke} strokeWidth={4} />
              </g>
            </g>
          )}
        </g>

        {opts.children}
      </g>
    );
  }
}
