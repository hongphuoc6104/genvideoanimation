import React from 'react';
import type { OpaqueCardProps, OpaqueCardRenderState } from './types';

/**
 * Reusable OpaqueCard / OpaqueShield component.
 *
 * Implements the 2-Layer Decoupled Architecture:
 * - Layer 1 (Base Shield): Physical solid backdrop strictly maintaining opacity: 1.0 (#0F172A),
 *   guaranteeing background vectors and grid lines NEVER bleed through.
 * - Layer 2 (Content Layer): Independent foreground container receiving salience/dimming
 *   effects (opacity: 0.20 - 0.30, desaturation) without compromising base shield opacity.
 *
 * Strictly prevents the CSS Opacity Inheritance Trap.
 */
export const OpaqueCard: React.FC<OpaqueCardProps> = ({
  x,
  y,
  cx,
  cy,
  width,
  height,
  rx = 20,
  baseColor = '#0F172A',
  borderColor = '#334155',
  borderWidth = 2,
  activeBorderColor = '#38BDF8',
  activeBorderWidth = 3,
  activeGlow = true,
  activeGlowColor = '#38BDF8',
  isActive = true,
  isDimmed = false,
  inactiveOpacity = 0.25,
  inactiveDesaturation = 0.75,
  activeScale = 1.05,
  as = 'svg',
  className,
  style,
  children,
}) => {
  // Resolve card top-left coordinates and center
  let cardX: number;
  let cardY: number;
  let cardCx: number;
  let cardCy: number;

  if (cx !== undefined && cy !== undefined) {
    cardCx = cx;
    cardCy = cy;
    cardX = cx - width / 2;
    cardY = cy - height / 2;
  } else if (x !== undefined && y !== undefined) {
    cardX = x;
    cardY = y;
    cardCx = x + width / 2;
    cardCy = y + height / 2;
  } else if (cx !== undefined) {
    cardCx = cx;
    cardX = cx - width / 2;
    cardY = y ?? 0;
    cardCy = cardY + height / 2;
  } else if (cy !== undefined) {
    cardCy = cy;
    cardY = cy - height / 2;
    cardX = x ?? 0;
    cardCx = cardX + width / 2;
  } else {
    cardX = x ?? 0;
    cardY = y ?? 0;
    cardCx = cardX + width / 2;
    cardCy = cardY + height / 2;
  }

  // Determine salience state
  const effectiveActive = isActive && !isDimmed;
  const currentScale = effectiveActive ? activeScale : 1.0;
  const currentBorderColor = effectiveActive ? activeBorderColor : borderColor;
  const currentBorderWidth = effectiveActive ? activeBorderWidth : borderWidth;

  // Content opacity is clamped strictly within [0.20, 0.30] when dimmed/inactive
  const clampedInactiveOpacity = Math.max(0.2, Math.min(0.3, inactiveOpacity));
  const contentOpacity = effectiveActive ? 1.0 : clampedInactiveOpacity;

  // Content desaturation filter
  const contentFilter = effectiveActive
    ? 'none'
    : `grayscale(${Math.max(0, Math.min(1, inactiveDesaturation))})`;

  // Base shield glow filter
  const glowFilter =
    effectiveActive && activeGlow
      ? `drop-shadow(0 0 14px ${activeGlowColor})`
      : 'none';

  const glowBoxShadow =
    effectiveActive && activeGlow ? `0 0 16px ${activeGlowColor}` : 'none';

  const renderState: OpaqueCardRenderState = {
    isActive: effectiveActive,
    isDimmed: !effectiveActive,
    opacity: contentOpacity,
    scale: currentScale,
    filter: contentFilter,
  };

  const renderedContent =
    typeof children === 'function' ? children(renderState) : children;

  if (as === 'html') {
    return (
      <div
        className={`opaque-card-root ${className ?? ''}`}
        style={{
          position: 'absolute',
          left: cardX,
          top: cardY,
          width,
          height,
          transformOrigin: 'center center',
          transform: currentScale !== 1.0 ? `scale(${currentScale})` : undefined,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
      >
        {/* LAYER 1: BASE SHIELD (STRICT OPACITY 1.0 - NEVER TRANSLUCENT) */}
        <div
          className="opaque-card-base-shield"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: rx,
            backgroundColor: baseColor,
            border: `${currentBorderWidth}px solid ${currentBorderColor}`,
            boxShadow: glowBoxShadow,
            opacity: 1.0, // HARD INVARIANT: MUST NEVER BE MODIFIED BY DIMMING
            pointerEvents: 'none',
          }}
        />

        {/* LAYER 2: FOREGROUND CONTENT (EXPRESSIVE SALIENCE LAYER) */}
        <div
          className="opaque-card-content-layer"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            opacity: contentOpacity,
            filter: contentFilter,
            transition: 'opacity 0.25s ease, filter 0.25s ease',
          }}
        >
          {renderedContent}
        </div>
      </div>
    );
  }

  // Default: SVG mode
  const scaleTransform =
    currentScale !== 1.0
      ? `translate(${cardCx}, ${cardCy}) scale(${currentScale}) translate(${-cardCx}, ${-cardCy})`
      : undefined;

  return (
    <g
      className={`opaque-card-root ${className ?? ''}`}
      transform={scaleTransform}
      style={{
        transformOrigin: `${cardCx}px ${cardCy}px`,
        ...style,
      }}
    >
      {/* LAYER 1: BASE SHIELD (STRICT OPACITY 1.0 - SOLID PHYSICAL SHIELD) */}
      <rect
        className="opaque-card-base-shield"
        x={cardX}
        y={cardY}
        width={width}
        height={height}
        rx={rx}
        fill={baseColor}
        stroke={currentBorderColor}
        strokeWidth={currentBorderWidth}
        opacity={1.0} // HARD INVARIANT: STRICT 1.0, NEVER DIMMED
        style={{
          filter: glowFilter !== 'none' ? glowFilter : undefined,
        }}
      />

      {/* LAYER 2: FOREGROUND CONTENT (EXPRESSIVE SALIENCE LAYER) */}
      <g
        className="opaque-card-content-layer"
        opacity={contentOpacity}
        style={{
          filter: contentFilter !== 'none' ? contentFilter : undefined,
        }}
      >
        {renderedContent}
      </g>
    </g>
  );
};
