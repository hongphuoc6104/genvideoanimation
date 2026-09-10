import React from 'react';
import { TIKTOK_SAFE_ZONES, ACADEMIC_PALETTE, SAFE_ZONE, PALETTE } from '../palette';

export interface SafeZoneOverlayProps {
  visible?: boolean;
}

export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ visible = false }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: TIKTOK_SAFE_ZONES.WIDTH,
        height: TIKTOK_SAFE_ZONES.HEIGHT,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <svg width={TIKTOK_SAFE_ZONES.WIDTH} height={TIKTOK_SAFE_ZONES.HEIGHT} viewBox="0 0 1080 1920" fill="none">
        <g data-part="safe-zone-overlay" data-joint="overlay-root">
        {/* Top Exclusion Zone */}
        <rect x={0} y={0} width={1080} height={SAFE_ZONE.TOP_MARGIN} fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth={2} />
        <text x={540} y={80} fill="#EF4444" fontSize={24} fontWeight="bold" textAnchor="middle">
          [TOP EXCLUSION: Status Bar & TikTok Search]
        </text>

        {/* Bottom Exclusion Zone */}
        <rect x={0} y={SAFE_ZONE.HEIGHT - SAFE_ZONE.BOTTOM_MARGIN} width={1080} height={SAFE_ZONE.BOTTOM_MARGIN} fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth={2} />
        <text x={540} y={1800} fill="#EF4444" fontSize={24} fontWeight="bold" textAnchor="middle">
          [BOTTOM EXCLUSION: Caption & Audio Track]
        </text>

        {/* Right Interaction Rail */}
        <rect x={SAFE_ZONE.WIDTH - SAFE_ZONE.RIGHT_MARGIN} y={SAFE_ZONE.TOP_MARGIN} width={SAFE_ZONE.RIGHT_MARGIN} height={SAFE_ZONE.SAFE_HEIGHT} fill="rgba(245, 158, 11, 0.12)" stroke="#F59E0B" strokeWidth={2} />
        <text x={970} y={960} fill="#F59E0B" fontSize={20} fontWeight="bold" textAnchor="middle" transform="rotate(90, 970, 960)">
          [RIGHT RAIL: Like, Share, Disc]
        </text>

        {/* Active Safe Zone Box */}
        <rect
          x={SAFE_ZONE.LEFT_MARGIN}
          y={SAFE_ZONE.TOP_MARGIN}
          width={SAFE_ZONE.SAFE_WIDTH}
          height={SAFE_ZONE.SAFE_HEIGHT}
          fill="none"
          stroke={PALETTE.CYAN_PRIMARY}
          strokeWidth={3}
          strokeDasharray="12 8"
        />

        {/* Subtitle Zone Box */}
        <rect
          x={190}
          y={SAFE_ZONE.SUBTITLE_Y_START}
          width={700}
          height={SAFE_ZONE.SUBTITLE_Y_END - SAFE_ZONE.SUBTITLE_Y_START}
          fill="rgba(16, 185, 129, 0.15)"
          stroke={PALETTE.EMERALD_SUCCESS}
          strokeWidth={2}
        />
        <text x={540} y={1550} fill={PALETTE.EMERALD_LIGHT} fontSize={20} fontWeight="bold" textAnchor="middle">
          [SAFE SUBTITLE ZONE: Y=1480-1600]
        </text>
        </g>
      </svg>
    </div>
  );
};
