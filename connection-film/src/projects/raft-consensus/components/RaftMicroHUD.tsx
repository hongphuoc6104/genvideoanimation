import React from 'react';

export interface RaftMicroHUDProps {
  term: number;
  shotNumber: number;
  shotTitle: string;
  quorumStatus?: string;
}

const CHAPTER_LABELS = [
  'HỒI 1: BẦU CHỌN LEADER',
  'HỒI 2: SAO CHÉP NHẬT KÝ',
  'HỒI 3: PHÂN VÙNG MẠNG & AN TOÀN',
];

const StatusBar: React.FC<React.HTMLAttributes<HTMLElement>> = (props) => <header {...props} />;

/**
 * RaftMicroHUD: Minimalist top status bar for Raft consensus explainer.
 * Positioned in y in [30, 75] with explicit data-role="hud" and data-hud="true".
 * Text is horizontally centered in [140, 940]px to strictly comply with [36, 1044]px margin.
 */
export const RaftMicroHUD: React.FC<RaftMicroHUDProps> = ({
  term,
  shotNumber,
  shotTitle,
  quorumStatus,
}) => {
  const label = CHAPTER_LABELS[shotNumber - 1] || shotTitle;

  return (
    <StatusBar
      data-role="hud"
      data-hud="true"
      className="hud header-banner"
      style={{
        position: 'absolute',
        top: 40,
        left: 140,
        width: 800,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Chapter Indicator Pill Banner */}
      <div
        data-role="hud"
        data-hud="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {/* Progress indicator dashes */}
        {[1, 2, 3].map((num) => {
          const isActive = num === shotNumber;
          return (
            <div
              key={num}
              data-role="hud"
              data-hud="true"
              style={{
                width: isActive ? 24 : 8,
                height: 6,
                borderRadius: 3,
                backgroundColor: isActive ? '#38BDF8' : '#334155',
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}

        <span
          data-role="hud"
          data-hud="true"
          style={{
            color: '#38BDF8',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {label} • TERM {term}
        </span>
      </div>
    </StatusBar>
  );
};
