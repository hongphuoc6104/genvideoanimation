/**
 * motion-kit/src/salience/SalienceItem.tsx
 *
 * Declarative item component supporting both SVG (<g>) and HTML (<div>).
 * Supports both standard children and render-prop (state: ItemSalienceState) => ReactNode.
 */

import React from 'react';
import { SalienceItemProps } from './types';
import { useSalienceContext } from './SalienceContainer';
import { MicroPin } from './MicroPin';

export const SalienceItem: React.FC<SalienceItemProps> = ({
  index,
  as = 'svg',
  cx,
  cy,
  x,
  y,
  style,
  className,
  opaqueShield = false,
  children,
}) => {
  const salience = useSalienceContext();
  const state = salience.getItemState(index);

  const posX = cx ?? x ?? 0;
  const posY = cy ?? y ?? 0;

  let renderedContent: React.ReactNode;
  if (typeof children === 'function') {
    renderedContent = children(state);
  } else if (state.showMicroPinOnly) {
    renderedContent = <MicroPin label={state.pinLabel} />;
  } else if (!state.isFullDetailVisible && salience.mode === 'progressive-unveil') {
    renderedContent = null;
  } else {
    renderedContent = children;
  }

  if (as === 'html') {
    const isExplicitPos = cx !== undefined || cy !== undefined || x !== undefined || y !== undefined;
    const htmlStyle: React.CSSProperties = {
      ...(isExplicitPos
        ? { position: 'absolute', left: posX, top: posY }
        : { position: 'relative' }),
      transform: state.transform,
      transformOrigin: 'center center',
      ...(opaqueShield ? { opacity: 1.0 } : { opacity: state.opacity, filter: state.filter }),
      ...style,
    };

    return (
      <div
        className={`salience-item ${opaqueShield ? 'salience-opaque-shield' : ''} ${className || ''}`.trim()}
        style={htmlStyle}
      >
        {renderedContent}
      </div>
    );
  }

  // SVG representation (<g>)
  const svgTransform = (posX !== 0 || posY !== 0)
    ? `translate(${posX}, ${posY}) ${state.transform}`
    : state.transform;

  const svgStyle: React.CSSProperties = {
    ...(opaqueShield ? { opacity: 1.0 } : { opacity: state.opacity, filter: state.filter }),
    ...style,
  };

  return (
    <g
      className={`salience-item ${opaqueShield ? 'salience-opaque-shield' : ''} ${className || ''}`.trim()}
      transform={svgTransform}
      style={svgStyle}
    >
      {renderedContent}
    </g>
  );
};
