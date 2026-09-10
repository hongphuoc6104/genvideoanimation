import React from 'react';
import { PALETTE } from '../palette';

export interface GapDoorsTaxonomyProps {
  activeGapIndex?: number;
  style?: React.CSSProperties;
}

export const GapDoorsTaxonomy: React.FC<GapDoorsTaxonomyProps> = ({
  activeGapIndex = 0,
  style,
}) => {
  return (
    <div style={{ position: 'relative', width: 1080, height: 1920, pointerEvents: 'none', ...style }}>
      <div style={{ padding: 40 }}>
        <h2 style={{ fontSize: 48, color: PALETTE.CYAN_GLOW }}>PHÂN LOẠI 5 GAP</h2>
      </div>
    </div>
  );
};
