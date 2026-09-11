import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ScopusMicroHUDProps {
  currentSection: number; // 1 to 5
  sectionTitle: string;
}

const SECTIONS = [
  'ĐỐI THOẠI HỌC THUẬT',
  '5 CÁNH CỬA GAP',
  'PHỄU & CẦU 3 TẦNG',
  'MÔ HÌNH SEM',
  'CHUẨN HÓA CÔNG BỐ'
];

export const ScopusMicroHUD: React.FC<ScopusMicroHUDProps> = ({ currentSection, sectionTitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 15, stiffness: 90 } });

  return (
    <header
      data-role="hud"
      data-hud="true"
      className="hud header-banner"
      style={{
        position: 'absolute',
        top: 100,
        left: 0,
        width: 1080,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: entrance,
      }}
    >
      {/* Chapter Progress Dots */}
      <div
        data-role="hud"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 12,
        }}
      >
        {SECTIONS.map((sec, idx) => {
          const secNum = idx + 1;
          const isActive = secNum === currentSection;
          const isPassed = secNum < currentSection;

          return (
            <div
              key={sec}
              data-role="hud"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: isActive ? 36 : 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: isActive ? '#38BDF8' : isPassed ? '#10B981' : '#334155',
                  boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.8)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Semantic Section Tag (Font >= 30px mobile floor, padding >= 30px) */}
      <div
        data-role="hud"
        data-hud="true"
        className="hud"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '30px 36px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 24,
          border: '1px solid rgba(56, 189, 248, 0.4)',
        }}
      >
        <span
          data-role="hud"
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: '#38BDF8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {SECTIONS[currentSection - 1] || sectionTitle}
        </span>
      </div>
    </header>
  );
};
