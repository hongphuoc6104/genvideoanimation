/**
 * BIRD RIG IMPLEMENTATION
 * Articulated avian character adhering to RigInterface.
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
const GOLD = '#ffd16c';
const CORAL = '#ff6b78';

const inkStroke = {
  stroke: INK,
  strokeWidth: 6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DEFAULT_BIRD_POSE: CharacterPose = {
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
  wingLeftAngle: 0,
  wingRightAngle: 0,
  wingLeftFold: 0.8,
  wingRightFold: 0.8,
  legBend: 0,
  legLeftAngle: 0,
  legRightAngle: 0,
  beakOpen: 0,
  beakTilt: 0,
  tailAngle: 0,
  root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
  rootOffset: { x: 0, y: 0 },
  torsoOffset: { x: 0, y: 0 },
  head: { rotation: 0, x: 0, y: 0 },
  limbs: {
    wingLeft: { rotation: 0 },
    wingRight: { rotation: 0 },
    legLeft: { rotation: 0 },
    legRight: { rotation: 0 },
    tail: { rotation: 0 },
    beak: { rotation: 0 },
  },
  expression: { gazeX: 0, gazeY: 0, mouthOpen: 0, eyeScale: 1.0 },
};

export class BirdRig extends React.Component<RigProps> implements RigInterface {
  public readonly id = 'bird-rig';
  public readonly type = 'bird' as const;
  public defaultPose: CharacterPose = DEFAULT_BIRD_POSE;

  constructor(props: RigProps = {}) {
    super(props);
  }

  /**
   * Aerodynamic flight banking simulation.
   */
  public static simulateFlight(options: {
    duration: number;
    velocity: number;
    radius: number;
    g?: number;
  }): { bankAngleDeg: number; duration: number } {
    const g = options.g ?? 9.8;
    const bankAngleRad = Math.atan((options.velocity ** 2) / (Math.max(0.1, options.radius) * g));
    return {
      bankAngleDeg: (bankAngleRad * 180) / Math.PI,
      duration: options.duration,
    };
  }

  /**
   * Returns registered pivots for all articulated avian joints.
   */
  public getJointPivots(): Record<string, [number, number]> {
    return {
      wingLeft: [-25, -10],
      wingRight: [5, -5],
      legLeft: [-18, 60],
      legRight: [18, 60],
      tail: [-48, 15],
      beak: [38, 2],
      root: [0, 0],
      torso: [0, 0],
      head: [15, -52],
      eye: [18, -6],
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
        parent: id === 'root' ? undefined : (id === 'head' || id === 'tail' || id === 'wingLeft' || id === 'wingRight' ? 'torso' : 'root'),
        position: { x: px, y: py },
        rotation: limbRot,
      };
    }
    return joints;
  }

  /**
   * Returns decoupled geometry layers.
   */
  public getLayers(): RigGeometryLayer[] {
    return [
      {
        id: 'tail-layer',
        zIndex: 1,
        render: (transforms) => {
          const t = transforms['tail'] || { x: -48, y: 15, rotation: 0 };
          return (
            <g transform={`translate(${t.x}, ${t.y}) rotate(${t.rotation})`}>
              <path d="M 0 0 C -25 -10, -40 5, -50 0 C -38 18, -20 18, 0 10 Z" fill={GOLD} {...inkStroke} />
            </g>
          );
        },
      },
      {
        id: 'wing-left-layer',
        zIndex: 2,
        render: (transforms) => {
          const t = transforms['wingLeft'] || { x: -25, y: -10, rotation: 0 };
          return (
            <g transform={`translate(${t.x}, ${t.y}) rotate(${t.rotation})`}>
              <path d="M 0 0 C -40 -35, -75 -10, -85 20 C -60 30, -30 20, 0 8 Z" fill={GOLD} {...inkStroke} />
            </g>
          );
        },
      },
    ];
  }

  /**
   * Displaces lower beak proportionally to mouthOpen [0, 1] up to MAX_BEAK_GAP = 24.0.
   */
  public computeBeakGap(pose: any): number {
    const raw = pose?.expression?.mouthOpen ?? pose?.mouthOpen ?? 0;
    const mouthOpen = Math.max(0.0, Math.min(1.0, raw));
    return mouthOpen * 24.0;
  }

  /**
   * Saccadic pupil offset bounded by MAX_SACCADE = 6.0.
   */
  public getPupilOffset(pose: any): { dx: number; dy: number } {
    const rawX = pose?.expression?.gazeX ?? pose?.eyeGazeX ?? 0;
    const rawY = pose?.expression?.gazeY ?? pose?.eyeGazeY ?? 0;
    const gazeX = Math.max(-1.0, Math.min(1.0, rawX));
    const gazeY = Math.max(-1.0, Math.min(1.0, rawY));
    return {
      dx: gazeX * 6.0,
      dy: gazeY * 6.0,
    };
  }

  /**
   * Anatomical wing angle clamping to [-90, +90] degrees.
   */
  public getClampedWingAngle(angle: number): number {
    return Math.max(-90.0, Math.min(90.0, angle));
  }

  /**
   * Volume preservation scale floor: scaleX <= 5.0, finite.
   */
  public computeSquashScales(squash: number): { scaleX: number; scaleY: number } {
    const safeSquash = Math.max(0.04, squash);
    const scaleY = safeSquash;
    const scaleX = Math.min(5.0, 1.0 / Math.sqrt(safeSquash));
    return { scaleX, scaleY };
  }

  /**
   * Renders articulated avian character into JSX.
   */
  public render(
    poseInput?: CharacterPose,
    options: RigRenderOptions = {}
  ): React.ReactNode {
    const pose = poseInput || this.props?.pose || this.defaultPose;
    const opts = { ...this.props, ...options };

    const bodyColor = opts.palette?.body || opts.color || '#f6ae4f';
    const accentColor = opts.palette?.accent || opts.accent || GOLD;
    const skinColor = opts.palette?.skin || bodyColor;

    const x = opts.x ?? 0;
    const y = opts.y ?? 0;
    const scale = opts.scale ?? 1;
    const flip = opts.flip ?? false;
    const flipSign = flip ? -1 : 1;

    const limbs = pose.limbs || {};
    const root = pose.root || {};
    const expression = pose.expression || {};

    const rawSquash = root.squash ?? pose.squash ?? 1.0;
    const { scaleX, scaleY } = this.computeSquashScales(rawSquash);

    const bodyY = root.y ?? pose.bodyY ?? 0;
    const bodyTilt = root.rotation ?? pose.bodyTilt ?? 0;

    const rawWingLeft = limbs.wingLeft?.rotation ?? pose.wingLeftAngle ?? 0;
    const rawWingRight = limbs.wingRight?.rotation ?? pose.wingRightAngle ?? 0;
    const wingLeftAngle = this.getClampedWingAngle(rawWingLeft);
    const wingRightAngle = this.getClampedWingAngle(rawWingRight);

    const tailAngle = limbs.tail?.rotation ?? pose.tailAngle ?? 0;
    const beakRot = limbs.beak?.rotation ?? pose.beakTilt ?? 0;
    const beakGap = this.computeBeakGap(pose);
    const pupil = this.getPupilOffset(pose);

    const legLeftAngle = limbs.legLeft?.rotation ?? pose.legLeftAngle ?? 0;
    const legRightAngle = limbs.legRight?.rotation ?? pose.legRightAngle ?? 0;
    const legBend = pose.legBend ?? 0;

    const headAngle = pose.head?.rotation ?? pose.headAngle ?? 0;
    const headY = pose.head?.y ?? pose.headY ?? 0;

    return (
      <g
        data-character-rig="bird"
        transform={`translate(${x}, ${y}) scale(${scale * flipSign}, ${scale})`}
      >
        {/* Torso Group */}
        <g
          data-part="torso-group"
          transform={`translate(0, ${bodyY}) rotate(${bodyTilt}) scale(${scaleX}, ${scaleY})`}
        >
          {/* Tail */}
          <g
            data-part="tail"
            transform={`translate(-48, 15) rotate(${tailAngle})`}
          >
            <path
              d="M 0 0 C -25 -10, -40 5, -50 0 C -38 18, -20 18, 0 10 Z"
              fill={accentColor}
              {...inkStroke}
            />
          </g>

          {/* Torso Ellipse */}
          <ellipse
            cx={0}
            cy={0}
            rx={55}
            ry={68}
            fill={bodyColor}
            {...inkStroke}
          />

          {/* Belly Patch */}
          <ellipse
            cx={12}
            cy={12}
            rx={34}
            ry={46}
            fill={skinColor !== bodyColor ? skinColor : '#ffffff'}
            opacity={0.88}
          />

          {/* Wing Left */}
          <g
            data-part="wing-left"
            transform={`translate(-25, -10) rotate(${wingLeftAngle})`}
          >
            <path
              d="M 0 0 C -40 -35, -75 -10, -85 20 C -60 30, -30 20, 0 8 Z"
              fill={accentColor}
              {...inkStroke}
            />
          </g>

          {/* Articulated Head */}
          <g
            data-part="head-group"
            transform={`translate(15, ${-52 + headY}) rotate(${headAngle})`}
          >
            <circle
              cx={0}
              cy={0}
              r={44}
              fill={bodyColor}
              {...inkStroke}
            />

            {/* Eye */}
            <g data-part="eye" transform="translate(18, -6)">
              <circle cx={0} cy={0} r={18} fill="#ffffff" {...inkStroke} strokeWidth={5} />
              <circle cx={pupil.dx} cy={pupil.dy} r={9} fill={INK} />
              <circle cx={pupil.dx + 3} cy={pupil.dy - 3} r={3} fill="#ffffff" />
            </g>

            {/* Beak */}
            <g data-part="beak" transform={`translate(38, 2) rotate(${beakRot})`}>
              <path d="M 0 -8 L 30 2 L 0 5 Z" fill={GOLD} {...inkStroke} strokeWidth={5} />
              <g transform={`translate(0, ${beakGap})`}>
                <path d="M 0 3 L 24 5 L 0 12 Z" fill="#f59e0b" {...inkStroke} strokeWidth={4} />
              </g>
            </g>
          </g>

          {/* Wing Right */}
          <g
            data-part="wing-right"
            transform={`translate(5, -5) rotate(${wingRightAngle})`}
          >
            <path
              d="M 0 0 C 35 -30, 70 -5, 80 25 C 55 35, 25 22, 0 10 Z"
              fill={bodyColor}
              {...inkStroke}
            />
          </g>
        </g>

        {/* Legs Group */}
        <g data-part="legs-group" transform={`translate(0, ${bodyY + 60})`}>
          <g data-part="leg-left" transform={`translate(-18, 0) rotate(${legLeftAngle})`}>
            <line x1={0} y1={0} x2={-legBend * 6} y2={22 - legBend * 8} {...inkStroke} strokeWidth={5} />
          </g>
          <g data-part="leg-right" transform={`translate(18, 0) rotate(${legRightAngle})`}>
            <line x1={0} y1={0} x2={-legBend * 6} y2={22 - legBend * 8} {...inkStroke} strokeWidth={5} />
          </g>
        </g>

        {opts.children}
      </g>
    );
  }
}
