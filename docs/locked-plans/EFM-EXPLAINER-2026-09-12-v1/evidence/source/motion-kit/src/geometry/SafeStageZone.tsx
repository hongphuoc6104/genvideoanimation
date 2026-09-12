import React, { createContext, useContext, useMemo } from 'react';
import type {
  Point2D,
  SafeStageBounds,
  SafeStageContextValue,
  SafeStageZoneProps,
} from './types';

export const DEFAULT_STAGE_BOUNDS: SafeStageBounds = {
  minX: 36,
  maxX: 1044,
  minY: 180,
  maxY: 1420,
  width: 1008,
  height: 1240,
  centerX: 540,
  centerY: 800,
};

export const DEFAULT_SUBTITLE_ZONE_Y = 1470;

export const SafeStageContext = createContext<SafeStageContextValue>({
  bounds: DEFAULT_STAGE_BOUNDS,
  mapPoint: (u: number, v: number) => ({
    x: DEFAULT_STAGE_BOUNDS.minX + u * DEFAULT_STAGE_BOUNDS.width,
    y: DEFAULT_STAGE_BOUNDS.minY + v * DEFAULT_STAGE_BOUNDS.height,
  }),
  clampBox: (x: number, y: number, width: number, height: number) => {
    const clampedW = Math.min(width, DEFAULT_STAGE_BOUNDS.width);
    const clampedH = Math.min(height, DEFAULT_STAGE_BOUNDS.height);
    const clampedX = Math.max(
      DEFAULT_STAGE_BOUNDS.minX,
      Math.min(DEFAULT_STAGE_BOUNDS.maxX - clampedW, x)
    );
    const clampedY = Math.max(
      DEFAULT_STAGE_BOUNDS.minY,
      Math.min(DEFAULT_STAGE_BOUNDS.maxY - clampedH, y)
    );
    return { x: clampedX, y: clampedY, width: clampedW, height: clampedH };
  },
  checkClearance: (bottomY: number) => {
    const bufferPx = DEFAULT_SUBTITLE_ZONE_Y - bottomY;
    return {
      isSafe: bottomY <= DEFAULT_STAGE_BOUNDS.maxY && bufferPx >= 50,
      bufferPx,
    };
  },
});

/**
 * Hook to consume SafeStageZone context.
 */
export function useSafeStage(): SafeStageContextValue {
  return useContext(SafeStageContext);
}

/**
 * Responsive SafeStageZone container.
 * Enforces Zone 2 boundaries: x in [36, 1044] px, y in [180, 1420] px.
 * Enforces subtitle safety clearance >= 50px before subtitles at y = 1470 px.
 */
export const SafeStageZone: React.FC<SafeStageZoneProps> = ({
  minY = 180,
  maxY = 1420,
  minX = 36,
  maxX = 1044,
  subtitleZoneY = 1470,
  showDebugBounds = false,
  as = 'svg',
  className,
  style,
  children,
}) => {
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  const bounds: SafeStageBounds = useMemo(
    () => ({
      minX,
      maxX,
      minY,
      maxY,
      width,
      height,
      centerX,
      centerY,
    }),
    [minX, maxX, minY, maxY, width, height, centerX, centerY]
  );

  const contextValue: SafeStageContextValue = useMemo(() => {
    return {
      bounds,
      mapPoint: (u: number, v: number): Point2D => {
        const clampedU = Math.max(0, Math.min(1, u));
        const clampedV = Math.max(0, Math.min(1, v));
        return {
          x: bounds.minX + clampedU * bounds.width,
          y: bounds.minY + clampedV * bounds.height,
        };
      },
      clampBox: (
        x: number,
        y: number,
        boxW: number,
        boxH: number
      ): { x: number; y: number; width: number; height: number } => {
        const clampedW = Math.min(boxW, bounds.width);
        const clampedH = Math.min(boxH, bounds.height);
        const clampedX = Math.max(
          bounds.minX,
          Math.min(bounds.maxX - clampedW, x)
        );
        const clampedY = Math.max(
          bounds.minY,
          Math.min(bounds.maxY - clampedH, y)
        );
        return {
          x: clampedX,
          y: clampedY,
          width: clampedW,
          height: clampedH,
        };
      },
      checkClearance: (bottomY: number): { isSafe: boolean; bufferPx: number } => {
        const bufferPx = subtitleZoneY - bottomY;
        const isSafe = bottomY <= bounds.maxY && bufferPx >= 50;
        return { isSafe, bufferPx };
      },
    };
  }, [bounds, subtitleZoneY]);

  const renderedChildren =
    typeof children === 'function' ? children(contextValue) : children;

  if (as === 'html') {
    return (
      <SafeStageContext.Provider value={contextValue}>
        <div
          className={`safe-stage-zone ${className ?? ''}`}
          style={{
            position: 'absolute',
            left: minX,
            top: minY,
            width,
            height,
            pointerEvents: 'none',
            ...style,
          }}
        >
          {showDebugBounds && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '2px dashed #10B981',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  fontSize: 12,
                  color: '#10B981',
                  fontFamily: 'monospace',
                }}
              >
                STAGE ZONE 2 [{minX}, {minY}, {maxX}, {maxY}]
              </span>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: maxY - minY,
                  borderTop: '2px dashed #EF4444',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontSize: 12,
                    color: '#EF4444',
                    fontFamily: 'monospace',
                  }}
                >
                  SUBTITLE SAFETY FLOOR ({maxY}px, buffer &gt;= 50px)
                </span>
              </div>
            </div>
          )}
          {renderedChildren}
        </div>
      </SafeStageContext.Provider>
    );
  }

  // Default: SVG mode
  return (
    <SafeStageContext.Provider value={contextValue}>
      <g className={`safe-stage-zone ${className ?? ''}`} style={style}>
        {showDebugBounds && (
          <g className="stage-debug-bounds" pointerEvents="none">
            {/* Stage boundary outline */}
            <rect
              x={minX}
              y={minY}
              width={width}
              height={height}
              fill="none"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="8 6"
            />
            <text
              x={minX + 8}
              y={minY + 20}
              fill="#10B981"
              fontSize={14}
              fontFamily="monospace"
            >
              STAGE ZONE 2 [{minX}, {minY}, {maxX}, {maxY}]
            </text>

            {/* Subtitle safety floor line */}
            <line
              x1={minX}
              y1={maxY}
              x2={maxX}
              y2={maxY}
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <text
              x={minX + 8}
              y={maxY - 8}
              fill="#EF4444"
              fontSize={14}
              fontFamily="monospace"
            >
              SUBTITLE SAFETY FLOOR ({maxY}px, buffer &gt;= 50px)
            </text>
          </g>
        )}
        {renderedChildren}
      </g>
    </SafeStageContext.Provider>
  );
};
