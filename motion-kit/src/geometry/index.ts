/**
 * Canonical Geometry Subsystem (Reusable Smart Geometric Primitives)
 *
 * Exports:
 * - Types: Point2D, BoxDescriptor, ConnectorRouting, AutoClippingConnectorProps,
 *   OpaqueCardProps, OpaqueCardRenderState, SafeStageZoneProps, SafeStageContextValue,
 *   RadialItemData, RadialLabelGroupProps, IntersectionResult, TwoBoxIntersectionResult.
 * - Boundary Math: Ray-AABB, RoundedRect, Circle, Ellipse, solveTwoBoxIntersection, isPointInsideBox.
 * - Primitives: AutoClippingConnector, OpaqueCard, SafeStageZone, RadialLabelGroup.
 */

export * from './types';
export * from './boundaryIntersection';
export * from './AutoClippingConnector';
export * from './OpaqueCard';
export * from './SafeStageZone';
export * from './RadialLabelGroup';
export * from './measureTextMetrics';
export * from './AutoPill';
