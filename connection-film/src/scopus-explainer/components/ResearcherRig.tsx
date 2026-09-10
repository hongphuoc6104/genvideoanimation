import React, { useMemo } from 'react';
import {
  CharacterPose,
  CharacterController,
  DEFAULT_HUMAN_POSE,
  RigProps,
} from 'motion-kit';

export type ResearcherPoseType =
  | 'puzzled'
  | 'analyzing'
  | 'discovering'
  | 'presenting'
  | 'celebrating'
  | 'idle';

export interface ResearcherPalette {
  skin?: string;
  hair?: string;
  labCoat?: string;
  coatShadow?: string;
  innerShirt?: string;
  tieOrLapel?: string;
  trousers?: string;
  shoes?: string;
  glasses?: string;
  accent?: string;
}

export interface ResearcherRigProps extends Omit<RigProps, 'palette'> {
  pose?: ResearcherPoseType | CharacterPose;
  blendProgress?: number;
  targetPose?: ResearcherPoseType | CharacterPose;
  frame?: number;
  palette?: ResearcherPalette;
  showGlasses?: boolean;
  showMagnifier?: boolean;
  showTablet?: boolean;
  showPaper?: boolean;
  showIdeaBulb?: boolean;
  showCertificate?: boolean;
  overrides?: Partial<CharacterPose>;
  children?: React.ReactNode;
}

const INK = '#0F172A';
const DEFAULT_SKIN = '#FCD34D';
const DEFAULT_HAIR = '#1E293B';
const DEFAULT_COAT = '#F8FAFC';
const DEFAULT_COAT_SHADOW = '#E2E8F0';
const DEFAULT_SHIRT = '#0EA5E9';
const DEFAULT_LAPEL = '#0284C7';
const DEFAULT_TROUSERS = '#1E293B';
const DEFAULT_SHOES = '#0F172A';
const DEFAULT_GLASSES = '#F59E0B';
const DEFAULT_ACCENT = '#06B6D4';

const inkStroke = {
  stroke: INK,
  strokeWidth: 4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * 5 Canonical Researcher Poses with Exact Kinematic Joint Angles
 */
export const RESEARCHER_PRESET_POSES: Record<ResearcherPoseType, CharacterPose> = {
  idle: {
    ...DEFAULT_HUMAN_POSE,
    bodyX: 0,
    bodyY: 0,
    bodyTilt: 0,
    squash: 1.0,
    headAngle: 0,
    headY: 0,
    eyeGazeX: 0,
    eyeGazeY: 0,
    eyeScale: 1.0,
    mouthOpen: 0,
    mouthSmile: 0.3,
    eyebrowRaise: 0,
    hairSway: 0,
    armLeftAngle: 15,
    armRightAngle: -15,
    elbowLeftAngle: 20,
    elbowRightAngle: -20,
    legLeftAngle: 0,
    legRightAngle: 0,
    kneeLeftBend: 0,
    kneeRightBend: 0,
    root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
    head: { rotation: 0, x: 0, y: 0 },
    limbs: {
      shoulderL: { rotation: 15 },
      elbowL: { rotation: 20 },
      shoulderR: { rotation: -15 },
      elbowR: { rotation: -20 },
      hipL: { rotation: 0 },
      kneeL: { rotation: 0 },
      hipR: { rotation: 0 },
      kneeR: { rotation: 0 },
    },
    expression: { gazeX: 0, gazeY: 0, mouthOpen: 0, mouthShape: 'neutral', eyeScale: 1.0, eyebrowRaise: 0, eyebrowTilt: 0 },
  },

  puzzled: {
    ...DEFAULT_HUMAN_POSE,
    bodyX: -6,
    bodyY: 4,
    bodyTilt: 4,
    squash: 0.96,
    headAngle: -14,
    headY: 3,
    eyeGazeX: -0.6,
    eyeGazeY: -0.4,
    eyeScale: 0.9,
    mouthOpen: 0.15,
    mouthSmile: -0.3,
    eyebrowRaise: 0.4,
    hairSway: -2,
    armLeftAngle: -35,
    armRightAngle: 25,
    elbowLeftAngle: 105,
    elbowRightAngle: 35,
    legLeftAngle: -4,
    legRightAngle: 6,
    kneeLeftBend: 8,
    kneeRightBend: 2,
    root: { x: -6, y: 4, rotation: 4, scaleX: 1.02, scaleY: 0.96, squash: 0.96 },
    head: { rotation: -14, x: -3, y: 3 },
    limbs: {
      shoulderL: { rotation: -35 },
      elbowL: { rotation: 105 },
      shoulderR: { rotation: 25 },
      elbowR: { rotation: 35 },
      hipL: { rotation: -4 },
      kneeL: { rotation: 8 },
      hipR: { rotation: 6 },
      kneeR: { rotation: 2 },
    },
    expression: { gazeX: -0.6, gazeY: -0.4, mouthOpen: 0.15, mouthShape: 'puzzled', eyeScale: 0.9, eyebrowRaise: 0.4, eyebrowTilt: -18 },
  },

  analyzing: {
    ...DEFAULT_HUMAN_POSE,
    bodyX: 8,
    bodyY: 6,
    bodyTilt: -7,
    squash: 0.97,
    headAngle: 16,
    headY: 8,
    eyeGazeX: 0.65,
    eyeGazeY: 0.4,
    eyeScale: 1.05,
    mouthOpen: 0.0,
    mouthSmile: 0.0,
    eyebrowRaise: -0.5,
    hairSway: 3,
    armLeftAngle: 25,
    armRightAngle: -50,
    elbowLeftAngle: 85,
    elbowRightAngle: 100,
    legLeftAngle: -8,
    legRightAngle: 8,
    kneeLeftBend: 6,
    kneeRightBend: 4,
    root: { x: 8, y: 6, rotation: -7, scaleX: 1.01, scaleY: 0.97, squash: 0.97 },
    head: { rotation: 16, x: 6, y: 8 },
    limbs: {
      shoulderL: { rotation: 25 },
      elbowL: { rotation: 85 },
      shoulderR: { rotation: -50 },
      elbowR: { rotation: 100 },
      hipL: { rotation: -8 },
      kneeL: { rotation: 6 },
      hipR: { rotation: 8 },
      kneeR: { rotation: 4 },
    },
    expression: { gazeX: 0.65, gazeY: 0.4, mouthOpen: 0.0, mouthShape: 'neutral', eyeScale: 1.05, eyebrowRaise: -0.5, eyebrowTilt: 14 },
  },

  discovering: {
    ...DEFAULT_HUMAN_POSE,
    bodyX: 0,
    bodyY: -10,
    bodyTilt: -3,
    squash: 1.08,
    headAngle: 8,
    headY: -8,
    eyeGazeX: 0.25,
    eyeGazeY: -0.7,
    eyeScale: 1.35,
    mouthOpen: 0.6,
    mouthSmile: 0.6,
    eyebrowRaise: 0.85,
    hairSway: 5,
    armLeftAngle: 15,
    armRightAngle: -105,
    elbowLeftAngle: 45,
    elbowRightAngle: 15,
    legLeftAngle: -3,
    legRightAngle: 5,
    kneeLeftBend: 3,
    kneeRightBend: 7,
    root: { x: 0, y: -10, rotation: -3, scaleX: 0.96, scaleY: 1.08, squash: 1.08 },
    head: { rotation: 8, x: 1, y: -8 },
    limbs: {
      shoulderL: { rotation: 15 },
      elbowL: { rotation: 45 },
      shoulderR: { rotation: -105 },
      elbowR: { rotation: 15 },
      hipL: { rotation: -3 },
      kneeL: { rotation: 3 },
      hipR: { rotation: 5 },
      kneeR: { rotation: 7 },
    },
    expression: { gazeX: 0.25, gazeY: -0.7, mouthOpen: 0.6, mouthShape: 'round', eyeScale: 1.35, eyebrowRaise: 0.85, eyebrowTilt: -8 },
  },

  presenting: {
    ...DEFAULT_HUMAN_POSE,
    bodyX: 0,
    bodyY: 0,
    bodyTilt: 0,
    squash: 1.0,
    headAngle: 3,
    headY: -2,
    eyeGazeX: 0.0,
    eyeGazeY: -0.1,
    eyeScale: 1.05,
    mouthOpen: 0.35,
    mouthSmile: 0.7,
    eyebrowRaise: 0.3,
    hairSway: 0,
    armLeftAngle: 18,
    armRightAngle: -45,
    elbowLeftAngle: 30,
    elbowRightAngle: 38,
    legLeftAngle: -6,
    legRightAngle: 6,
    kneeLeftBend: 0,
    kneeRightBend: 0,
    root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, squash: 1 },
    head: { rotation: 3, x: 0, y: -2 },
    limbs: {
      shoulderL: { rotation: 18 },
      elbowL: { rotation: 30 },
      shoulderR: { rotation: -45 },
      elbowR: { rotation: 38 },
      hipL: { rotation: -6 },
      kneeL: { rotation: 0 },
      hipR: { rotation: 6 },
      kneeR: { rotation: 0 },
    },
    expression: { gazeX: 0.0, gazeY: -0.1, mouthOpen: 0.35, mouthShape: 'smile', eyeScale: 1.05, eyebrowRaise: 0.3, eyebrowTilt: 0 },
  },

  celebrating: {
    ...DEFAULT_HUMAN_POSE,
    bodyX: 0,
    bodyY: -16,
    bodyTilt: 2,
    squash: 1.12,
    headAngle: -6,
    headY: -10,
    eyeGazeX: 0.0,
    eyeGazeY: -0.4,
    eyeScale: 1.25,
    mouthOpen: 0.75,
    mouthSmile: 1.0,
    eyebrowRaise: 0.9,
    hairSway: -4,
    armLeftAngle: -125,
    armRightAngle: -130,
    elbowLeftAngle: 35,
    elbowRightAngle: 30,
    legLeftAngle: -10,
    legRightAngle: 9,
    kneeLeftBend: 16,
    kneeRightBend: 12,
    root: { x: 0, y: -16, rotation: 2, scaleX: 0.94, scaleY: 1.12, squash: 1.12 },
    head: { rotation: -6, x: 0, y: -10 },
    limbs: {
      shoulderL: { rotation: -125 },
      elbowL: { rotation: 35 },
      shoulderR: { rotation: -130 },
      elbowR: { rotation: 30 },
      hipL: { rotation: -10 },
      kneeL: { rotation: 16 },
      hipR: { rotation: 9 },
      kneeR: { rotation: 12 },
    },
    expression: { gazeX: 0.0, gazeY: -0.4, mouthOpen: 0.75, mouthShape: 'wide', eyeScale: 1.25, eyebrowRaise: 0.9, eyebrowTilt: -15 },
  },
};

/**
 * Returns distinct SVG path geometries for facial phoneme mouth shapes.
 */
function getResearcherMouthPath(shape: string): string {
  switch (shape) {
    case 'smile':
      return 'M 35 78 Q 50 92 65 78';
    case 'round':
      return 'M 45 74 A 6 7 0 1 0 55 74 A 6 7 0 1 0 45 74';
    case 'wide':
      return 'M 30 78 Q 50 90 70 78 Q 50 72 30 78';
    case 'puzzled':
      return 'M 36 82 Q 44 76 52 82 Q 60 88 66 80';
    case 'neutral':
    default:
      return 'M 40 80 Q 50 80 60 80';
  }
}

/**
 * RESEARCHER RIG COMPONENT
 * Articulated Academic Researcher Character adapting HumanRig.
 * Adheres strictly to motion-lint AST rules (Rule 4: no-monolithic-character)
 * with dedicated data-joint and data-part articulated hierarchy.
 */
export const ResearcherRig: React.FC<ResearcherRigProps> = ({
  pose = 'idle',
  blendProgress,
  targetPose,
  frame = 0,
  palette = {},
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  showGlasses = true,
  showMagnifier,
  showTablet,
  showPaper,
  showIdeaBulb,
  showCertificate,
  overrides,
  children,
}) => {
  const controller = useMemo(() => new CharacterController(), []);

  // Resolve base pose
  const resolvedBasePose = typeof pose === 'string'
    ? RESEARCHER_PRESET_POSES[pose] || RESEARCHER_PRESET_POSES.idle
    : pose;

  // Resolve blended pose if blending is active
  let currentPose: CharacterPose = resolvedBasePose;
  if (targetPose && blendProgress !== undefined) {
    const resolvedTargetPose = typeof targetPose === 'string'
      ? RESEARCHER_PRESET_POSES[targetPose] || RESEARCHER_PRESET_POSES.idle
      : targetPose;
    currentPose = controller.blend(resolvedBasePose, resolvedTargetPose, blendProgress);
  }

  // Apply explicit overrides if provided
  if (overrides) {
    currentPose = {
      ...currentPose,
      ...overrides,
      root: { ...(currentPose.root || {}), ...(overrides.root || {}) },
      head: { ...(currentPose.head || {}), ...(overrides.head || {}) },
      limbs: { ...(currentPose.limbs || {}), ...(overrides.limbs || {}) },
      expression: { ...(currentPose.expression || {}), ...(overrides.expression || {}) },
    };
  }

  // Color tokens
  const skinColor = palette.skin || DEFAULT_SKIN;
  const hairColor = palette.hair || DEFAULT_HAIR;
  const coatColor = palette.labCoat || DEFAULT_COAT;
  const coatShadow = palette.coatShadow || DEFAULT_COAT_SHADOW;
  const shirtColor = palette.innerShirt || DEFAULT_SHIRT;
  const lapelColor = palette.tieOrLapel || DEFAULT_LAPEL;
  const pantsColor = palette.trousers || DEFAULT_TROUSERS;
  const shoesColor = palette.shoes || DEFAULT_SHOES;
  const glassesColor = palette.glasses || DEFAULT_GLASSES;
  const accentColor = palette.accent || DEFAULT_ACCENT;

  // Kinematic parameters
  const flipSign = flip ? -1 : 1;
  const limbs = currentPose.limbs || {};
  const root = currentPose.root || {};
  const expression = currentPose.expression || {};

  const rawSquash = root.squash ?? currentPose.squash ?? 1.0;
  const safeSquash = Math.max(0.04, rawSquash);
  const scaleY = safeSquash;
  const scaleX = Math.min(5.0, 1.0 / Math.sqrt(safeSquash));

  // Subtle procedural breathing idle sway if frame is supplied
  const breathY = frame > 0 ? Math.sin((frame * Math.PI) / 30) * 1.5 : 0;

  const bodyX = (root.x ?? currentPose.bodyX ?? 0);
  const bodyY = (root.y ?? currentPose.bodyY ?? 0) + breathY;
  const bodyTilt = root.rotation ?? currentPose.bodyTilt ?? 0;

  // Head kinematics
  const headAngle = currentPose.head?.rotation ?? currentPose.headAngle ?? 0;
  const headY = currentPose.head?.y ?? currentPose.headY ?? 0;

  // Limb kinematics
  const armLeftRot = limbs.shoulderL?.rotation ?? limbs.shoulderLeft?.rotation ?? currentPose.armLeftAngle ?? 15;
  const elbowLeftRot = limbs.elbowL?.rotation ?? limbs.elbowLeft?.rotation ?? currentPose.elbowLeftAngle ?? 20;

  const armRightRot = limbs.shoulderR?.rotation ?? limbs.shoulderRight?.rotation ?? currentPose.armRightAngle ?? -15;
  const elbowRightRot = limbs.elbowR?.rotation ?? limbs.elbowRight?.rotation ?? currentPose.elbowRightAngle ?? -20;

  const legLeftRot = limbs.hipL?.rotation ?? limbs.hipLeft?.rotation ?? currentPose.legLeftAngle ?? 0;
  const legRightRot = limbs.hipR?.rotation ?? limbs.hipRight?.rotation ?? currentPose.legRightAngle ?? 0;
  const kneeLeftBend = Math.max(0, Math.min(150, limbs.kneeL?.rotation ?? limbs.kneeLeft?.rotation ?? currentPose.kneeLeftBend ?? 0));
  const kneeRightBend = Math.max(0, Math.min(150, limbs.kneeR?.rotation ?? limbs.kneeRight?.rotation ?? currentPose.kneeRightBend ?? 0));

  // Facial kinematics
  const eyeScale = Math.max(0, expression.eyeScale ?? currentPose.eyeScale ?? 1.0);
  const rawEyebrowTilt = expression.eyebrowTilt ?? 0;
  const eyebrowTilt = Math.max(-30, Math.min(30, rawEyebrowTilt));
  const eyebrowRaise = expression.eyebrowRaise ?? currentPose.eyebrowRaise ?? 0;

  const gazeX = Math.max(-1, Math.min(1, expression.gazeX ?? currentPose.eyeGazeX ?? 0));
  const gazeY = Math.max(-1, Math.min(1, expression.gazeY ?? currentPose.eyeGazeY ?? 0));
  const pupilX = gazeX * 4;
  const pupilY = gazeY * 3;

  const mouthShape = expression.mouthShape || 'neutral';
  const mouthPath = getResearcherMouthPath(mouthShape);

  // Contextual prop auto-detection if not explicitly passed
  const isPuzzled = pose === 'puzzled';
  const isAnalyzing = pose === 'analyzing';
  const isDiscovering = pose === 'discovering';
  const isPresenting = pose === 'presenting';
  const isCelebrating = pose === 'celebrating';

  const renderTablet = showTablet ?? false;
  const renderMagnifier = showMagnifier ?? (isAnalyzing && !renderTablet);
  const renderPaper = showPaper ?? (isPuzzled || isPresenting);
  const renderIdeaBulb = showIdeaBulb ?? isDiscovering;
  const renderCertificate = showCertificate ?? isCelebrating;

  return (
    <svg
      viewBox="-140 -160 280 380"
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      <g
        data-character-rig="researcher"
        data-joint="root"
        data-part="root"
        transform={`translate(${x}, ${y}) scale(${scale * flipSign}, ${scale})`}
      >
      {/* 1. LOWER BODY: LEGS, TROUSERS, SHOES */}
      <g
        data-joint="lower-body"
        data-part="lower-body"
        transform={`translate(${bodyX}, ${bodyY + 70})`}
      >
        {/* Left Leg */}
        <g
          data-joint="leg-left"
          data-part="leg-left"
          transform={`translate(-18, 0) rotate(${legLeftRot})`}
        >
          <rect x={-9} y={0} width={18} height={55} rx={7} fill={pantsColor} {...inkStroke} />
          <g
            data-joint="shin-left"
            data-part="shin-left"
            transform={`translate(0, 50) rotate(${kneeLeftBend})`}
          >
            <rect x={-8} y={0} width={16} height={55} rx={6} fill={pantsColor} {...inkStroke} />
            <path d="M -9 50 L 15 50 C 19 50, 19 64, 13 64 L -9 64 Z" fill={shoesColor} {...inkStroke} strokeWidth={3.5} />
          </g>
        </g>

        {/* Right Leg */}
        <g
          data-joint="leg-right"
          data-part="leg-right"
          transform={`translate(18, 0) rotate(${legRightRot})`}
        >
          <rect x={-9} y={0} width={18} height={55} rx={7} fill={pantsColor} {...inkStroke} />
          <g
            data-joint="shin-right"
            data-part="shin-right"
            transform={`translate(0, 50) rotate(${kneeRightBend})`}
          >
            <rect x={-8} y={0} width={16} height={55} rx={6} fill={pantsColor} {...inkStroke} />
            <path d="M -9 50 L 15 50 C 19 50, 19 64, 13 64 L -9 64 Z" fill={shoesColor} {...inkStroke} strokeWidth={3.5} />
          </g>
        </g>
      </g>

      {/* 2. TORSO & UPPER BODY (SCHOLARLY ATTIRE) */}
      <g
        data-joint="torso"
        data-part="torso-group"
        transform={`translate(${bodyX}, ${bodyY}) rotate(${bodyTilt}) scale(${scaleX}, ${scaleY})`}
      >
        {/* Left Arm (Lab Coat Sleeve + Forearm + Hand) */}
        <g
          data-joint="arm-left"
          data-part="arm-left"
          transform={`translate(-38, -25) rotate(${armLeftRot})`}
        >
          <rect x={-8} y={0} width={17} height={48} rx={8} fill={coatColor} {...inkStroke} />
          <g
            data-joint="forearm-left"
            data-part="forearm-left"
            transform={`translate(0, 42) rotate(${elbowLeftRot})`}
          >
            <rect x={-7} y={0} width={15} height={46} rx={7} fill={coatColor} {...inkStroke} />
            <circle cx={0} cy={52} r={9} fill={skinColor} {...inkStroke} strokeWidth={3.5} />

            {/* Held Paper / Manuscript Prop on Left Hand */}
            {renderPaper && (
              <g data-joint="prop-paper" data-part="prop-paper" transform="translate(-16, 44) rotate(-15)">
                <rect x={-16} y={-22} width={32} height={44} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={2.5} />
                <line x1={-10} y1={-14} x2={10} y2={-14} stroke="#94A3B8" strokeWidth={2} />
                <line x1={-10} y1={-6} x2={10} y2={-6} stroke="#94A3B8" strokeWidth={2} />
                <line x1={-10} y1={2} x2={6} y2={2} stroke="#94A3B8" strokeWidth={2} />
                {isPuzzled && (
                  <text x={-6} y={16} fill="#EF4444" fontSize={9} fontWeight="bold" fontFamily="sans-serif">
                    ?
                  </text>
                )}
              </g>
            )}
          </g>
        </g>

        {/* Torso Base & Lab Coat Tails */}
        <path d="M -34 50 L 34 50 L 30 74 L -30 74 Z" fill={coatColor} stroke={coatShadow} strokeWidth={2} />
        <path d="M -34 50 L 34 50 L 30 74 L -30 74 Z" fill="none" {...inkStroke} />

        {/* Inner Scholarly Shirt & Tie / Collar */}
        <path d="M -24 -28 L 24 -28 L 18 50 L -18 50 Z" fill={shirtColor} {...inkStroke} />
        {/* Tie */}
        <path d="M -4 -25 L 4 -25 L 6 25 L 0 35 L -6 25 Z" fill={lapelColor} {...inkStroke} strokeWidth={2} />

        {/* Lab Coat / Blazer Outer Wings (White Scholarly Lab Coat) */}
        {/* Left Lapel Wing */}
        <path d="M -38 -28 L -14 -28 L -6 52 L -34 52 Z" fill={coatColor} {...inkStroke} />
        {/* Right Lapel Wing */}
        <path d="M 38 -28 L 14 -28 L 6 52 L 34 52 Z" fill={coatColor} {...inkStroke} />

        {/* Breast Pocket & Academic Pen */}
        <rect x={16} y={6} width={14} height={16} rx={2} fill={coatShadow} stroke={INK} strokeWidth={2} />
        <line x1={23} y1={1} x2={23} y2={8} stroke={accentColor} strokeWidth={3} strokeLinecap="round" />

        {/* Lab Coat Buttons */}
        <circle cx={0} cy={12} r={2.5} fill={INK} />
        <circle cx={0} cy={30} r={2.5} fill={INK} />

        {/* Head & Neck & Face */}
        <g
          data-joint="head"
          data-part="head-group"
          transform={`translate(0, ${-40 + headY}) rotate(${headAngle})`}
        >
          {/* Neck */}
          <g data-joint="neck" data-part="neck">
            <rect x={-9} y={-10} width={18} height={20} fill={skinColor} {...inkStroke} strokeWidth={3.5} />
          </g>

          {/* Head Cranium */}
          <ellipse cx={0} cy={-38} rx={32} ry={36} fill={skinColor} {...inkStroke} />

          {/* Academic Haircut */}
          <path
            d="M -34 -40 C -34 -68, 34 -68, 34 -40 C 36 -32, 34 -20, 31 -24 C 28 -50, -28 -50, -31 -24 C -34 -20, -36 -32, -34 -40 Z"
            fill={hairColor}
            {...inkStroke}
          />
          {/* Hair Sideburns */}
          <path d="M -32 -38 L -30 -22 L -25 -30 Z" fill={hairColor} />
          <path d="M 32 -38 L 30 -22 L 25 -30 Z" fill={hairColor} />

          {/* Eyebrows */}
          <g
            data-joint="eyebrows"
            data-part="eyebrows"
            transform={`translate(0, ${-eyebrowRaise * 5}) rotate(${eyebrowTilt})`}
          >
            <line x1={-22} y1={-49} x2={-8} y2={-49} {...inkStroke} strokeWidth={3.5} />
            <line x1={8} y1={-49} x2={22} y2={-49} {...inkStroke} strokeWidth={3.5} />
          </g>

          {/* Eyes with Pupil Tracking */}
          <g data-joint="eyes" data-part="eyes">
            {/* Left Eye */}
            <g transform={`translate(-14, -38) scale(${eyeScale})`}>
              <ellipse cx={0} cy={0} rx={8} ry={9} fill="#FFFFFF" {...inkStroke} strokeWidth={2.5} />
              <circle cx={pupilX} cy={pupilY} r={4} fill={INK} />
              <circle cx={pupilX - 1.5} cy={pupilY - 1.5} r={1.2} fill="#FFFFFF" />
            </g>
            {/* Right Eye */}
            <g transform={`translate(14, -38) scale(${eyeScale})`}>
              <ellipse cx={0} cy={0} rx={8} ry={9} fill="#FFFFFF" {...inkStroke} strokeWidth={2.5} />
              <circle cx={pupilX} cy={pupilY} r={4} fill={INK} />
              <circle cx={pupilX - 1.5} cy={pupilY - 1.5} r={1.2} fill="#FFFFFF" />
            </g>
          </g>

          {/* Academic Spectacles / Glasses */}
          {showGlasses && (
            <g data-joint="glasses" data-part="glasses" pointerEvents="none">
              {/* Left Rim */}
              <circle cx={-14} cy={-38} r={13} fill="none" stroke={glassesColor} strokeWidth={3.5} />
              <circle cx={-14} cy={-38} r={12.5} fill={accentColor} fillOpacity={0.12} />
              <line x1={-20} y1={-44} x2={-10} y2={-32} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />

              {/* Right Rim */}
              <circle cx={14} cy={-38} r={13} fill="none" stroke={glassesColor} strokeWidth={3.5} />
              <circle cx={14} cy={-38} r={12.5} fill={accentColor} fillOpacity={0.12} />
              <line x1={8} y1={-44} x2={18} y2={-32} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />

              {/* Nose Bridge */}
              <line x1={-2} y1={-38} x2={2} y2={-38} stroke={glassesColor} strokeWidth={3.5} strokeLinecap="round" />
              {/* Temples */}
              <line x1={-27} y1={-39} x2={-32} y2={-37} stroke={glassesColor} strokeWidth={2.5} strokeLinecap="round" />
              <line x1={27} y1={-39} x2={32} y2={-37} stroke={glassesColor} strokeWidth={2.5} strokeLinecap="round" />
            </g>
          )}

          {/* Mouth */}
          <g data-joint="mouth" data-part="mouth" transform="translate(-50, -65)">
            <path d={mouthPath} fill={mouthShape === 'round' || mouthShape === 'wide' ? '#EF4444' : 'none'} {...inkStroke} strokeWidth={3} />
          </g>

          {/* Eureka Lightbulb / Floating Insight Prop */}
          {renderIdeaBulb && (
            <g data-joint="prop-idea" data-part="prop-idea" transform="translate(0, -96)">
              <circle cx={0} cy={0} r={16} fill="#FDE047" stroke={INK} strokeWidth={3} />
              <path d="M -6 12 L 6 12 L 4 18 L -4 18 Z" fill="#94A3B8" stroke={INK} strokeWidth={2} />
              {/* Radiating Spark Rays */}
              <line x1={0} y1={-22} x2={0} y2={-28} stroke="#F59E0B" strokeWidth={3} strokeLinecap="round" />
              <line x1={18} y1={-10} x2={24} y2={-14} stroke="#F59E0B" strokeWidth={3} strokeLinecap="round" />
              <line x1={-18} y1={-10} x2={-24} y2={-14} stroke="#F59E0B" strokeWidth={3} strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* Right Arm (Lab Coat Sleeve + Forearm + Hand + Props) */}
        <g
          data-joint="arm-right"
          data-part="arm-right"
          transform={`translate(38, -25) rotate(${armRightRot})`}
        >
          <rect x={-8} y={0} width={17} height={48} rx={8} fill={coatColor} {...inkStroke} />
          <g
            data-joint="forearm-right"
            data-part="forearm-right"
            transform={`translate(0, 42) rotate(${elbowRightRot})`}
          >
            <rect x={-7} y={0} width={15} height={46} rx={7} fill={coatColor} {...inkStroke} />
            <circle cx={0} cy={52} r={9} fill={skinColor} {...inkStroke} strokeWidth={3.5} />

            {/* Magnifying Glass Prop in Hand */}
            {renderMagnifier && (
              <g data-joint="prop-magnifier" data-part="prop-magnifier" transform="translate(10, 52) rotate(25)">
                <line x1={0} y1={0} x2={22} y2={28} stroke={INK} strokeWidth={6} strokeLinecap="round" />
                <circle cx={-12} cy={-16} r={18} fill="#38BDF8" fillOpacity={0.25} stroke={glassesColor} strokeWidth={4} />
                <circle cx={-12} cy={-16} r={15} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
              </g>
            )}

            {/* Tablet Prop in Hand */}
            {renderTablet && (
              <g data-joint="prop-tablet" data-part="prop-tablet" transform="translate(14, 46) rotate(20)">
                <rect x={-18} y={-26} width={36} height={52} rx={4} fill="#1E293B" stroke={INK} strokeWidth={2.5} />
                <rect x={-15} y={-22} width={30} height={42} rx={2} fill="#0F172A" />
                {/* Academic data analytics graph on tablet */}
                <line x1={-11} y1={12} x2={11} y2={12} stroke="#334155" strokeWidth={1} />
                <rect x={-9} y={2} width={4} height={10} fill="#06B6D4" />
                <rect x={-3} y={-6} width={4} height={18} fill="#10B981" />
                <rect x={3} y={-14} width={4} height={26} fill="#38BDF8" />
                <circle cx={0} cy={-18} r={1.5} fill="#F59E0B" />
              </g>
            )}

            {/* Certificate / Diploma Prop in Hand */}
            {renderCertificate && (
              <g data-joint="prop-certificate" data-part="prop-certificate" transform="translate(12, 42) rotate(15)">
                <rect x={-14} y={-24} width={28} height={48} rx={4} fill="#FEF08A" stroke={INK} strokeWidth={2.5} />
                <circle cx={0} cy={6} r={7} fill="#10B981" stroke={INK} strokeWidth={2} />
                <path d="M -3 13 L -6 24 L 0 20 L 6 24 L 3 13 Z" fill="#F59E0B" stroke={INK} strokeWidth={1.5} />
              </g>
            )}
          </g>
        </g>
      </g>

      {children}
      </g>
    </svg>
  );
};
