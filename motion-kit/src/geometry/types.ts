import type React from 'react';

/**
 * Geometric 2D point representation.
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Axis-Aligned or Rounded Bounding Box Descriptor.
 */
export interface BoxDescriptor {
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  center?: Point2D;
  width: number;
  height: number;
  shape?: 'rect' | 'rounded-rect' | 'circle' | 'ellipse';
  cornerRadius?: number; // default: 16
  rx?: number;           // alias for cornerRadius
  radius?: number;       // for circular nodes (defaults to width / 2)
  padding?: number;      // extra protective boundary padding
}

/**
 * Connector routing algorithms.
 */
export type ConnectorRouting = 'straight' | 'curved' | 'orthogonal';

/**
 * Props for AutoClippingConnector SVG component.
 */
export interface AutoClippingConnectorProps {
  source?: BoxDescriptor;
  target?: BoxDescriptor;
  from?: BoxDescriptor;
  to?: BoxDescriptor;
  sourceBox?: BoxDescriptor;
  targetBox?: BoxDescriptor;
  routing?: ConnectorRouting;
  curvature?: number; // default: 0 (straight), positive bends right, negative bends left
  startGap?: number;  // default: 4px
  endGap?: number;    // default: 4px
  clearanceMargin?: number; // alias for startGap and endGap

  // Styling
  color?: string;           // default: '#38BDF8'
  stroke?: string;          // alias for color
  strokeWidth?: number;     // default: 2
  strokeDasharray?: string; // e.g. "8 6"
  dashArray?: string;       // alias for strokeDasharray
  animated?: boolean;
  progress?: number;        // 0 to 1 reveal progress

  // Arrowheads
  arrowhead?: 'none' | 'end' | 'start' | 'both'; // default: 'end'
  arrowheadSize?: number;   // default: 10

  // Midpoint Label
  label?: string;
  labelOffset?: number;     // default: 20px
  labelStyle?: React.CSSProperties;

  className?: string;
  style?: React.CSSProperties;
}

/**
 * Render state passed to OpaqueCard children function.
 */
export interface OpaqueCardRenderState {
  isActive: boolean;
  isDimmed: boolean;
  opacity: number;
  scale: number;
  filter: string;
}

/**
 * Props for OpaqueCard / OpaqueShield component.
 */
export interface OpaqueCardProps {
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  width: number;
  height: number;
  rx?: number; // corner radius, default: 20

  // Layer 1: Base Shield Invariants (strictly opacity: 1.0)
  baseColor?: string;         // default: '#0F172A' (Academic Navy)
  borderColor?: string;       // default: '#334155'
  borderWidth?: number;       // default: 2
  activeBorderColor?: string; // default: '#38BDF8'
  activeBorderWidth?: number; // default: 3
  activeGlow?: boolean;       // default: true
  activeGlowColor?: string;   // default: '#38BDF8'

  // Layer 2: Salience & Dimming Dynamics
  isActive?: boolean;         // default: true
  isDimmed?: boolean;         // default: false
  salienceIndex?: number;
  inactiveOpacity?: number;   // default: 0.25 (clamped in [0.20, 0.30])
  inactiveDesaturation?: number; // default: 0.75
  activeScale?: number;       // default: 1.05

  // Mode & Children
  as?: 'svg' | 'html';        // default: 'svg'
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode | ((state: OpaqueCardRenderState) => React.ReactNode);
}

/**
 * Bounds object for SafeStageZone.
 */
export interface SafeStageBounds {
  minX: number;   // 36
  maxX: number;   // 1044
  minY: number;   // 180
  maxY: number;   // 1420
  width: number;  // 1008
  height: number; // 1240
  centerX: number;// 540
  centerY: number;// 800
}

/**
 * Context value provided by SafeStageZone.
 */
export interface SafeStageContextValue {
  bounds: SafeStageBounds;
  mapPoint: (u: number, v: number) => Point2D;
  clampBox: (x: number, y: number, width: number, height: number) => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  checkClearance: (bottomY: number) => {
    isSafe: boolean;
    bufferPx: number;
  };
}

/**
 * Props for SafeStageZone container.
 */
export interface SafeStageZoneProps {
  minY?: number;          // default: 180
  maxY?: number;          // default: 1420
  minX?: number;          // default: 36
  maxX?: number;          // default: 1044
  subtitleZoneY?: number; // default: 1470
  showDebugBounds?: boolean;
  as?: 'svg' | 'html';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode | ((context: SafeStageContextValue) => React.ReactNode);
}

/**
 * Data item in a RadialLabelGroup.
 */
export interface RadialItemData {
  id: string | number;
  label: string;
  sublabel?: string;
  angleDeg?: number;      // explicit angle or auto-calculated
  radius?: number;        // explicit radius override for this item
  radiusOffset?: number;  // offset added to base/staggered radius
  color?: string;
  icon?: React.ReactNode;
  width?: number;         // default: 300
  height?: number;        // default: auto (70 or 110)
  rx?: number;
  fontSize?: number;      // default: >= 30 (mobile floor standard)
  sublabelFontSize?: number; // default: >= 30 (mobile floor standard)
  data?: unknown;
}

/**
 * Props for RadialLabelGroup polar coordinator.
 */
export interface RadialLabelGroupProps {
  centerX: number;
  centerY: number;
  radius: number;
  staggerRadii?: [number, number]; // explicit [R_even, R_odd]
  staggerOffset?: number;          // deltaR for odd items (default: 100)
  hubBox?: BoxDescriptor;
  items: RadialItemData[];
  startAngleDeg?: number; // default: -90 (12 o'clock)
  angleRangeDeg?: number; // default: 360
  activeItemIndex?: number;
  layoutMode?: 'horizontal-pill' | 'tangential-rotated';
  useOpaqueShield?: boolean;
  showRays?: boolean;
  rayColor?: string;
  rayWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  onItemClick?: (item: RadialItemData, index: number) => void;
}

/**
 * Result of a single ray-box boundary intersection.
 */
export interface IntersectionResult {
  point: Point2D;
  distance: number;
  normal: Point2D;
  surfaceType: 'horizontal' | 'vertical' | 'corner-arc' | 'radial';
}

/**
 * Result of solving boundary intersection between two boxes.
 */
export interface TwoBoxIntersectionResult {
  start: Point2D;
  end: Point2D;
  sourceIntersection: IntersectionResult;
  targetIntersection: IntersectionResult;
  tangentAngleStart: number; // in degrees
  tangentAngleEnd: number;   // in degrees
  distance: number;          // center-to-center distance
  clippedLength: number;     // length of connector segment between outer boundaries
  isOverlapping: boolean;
}
