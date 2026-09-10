import React from 'react';
import { CRISPR_THEME } from '../types';

interface HeaderAnchorProps {
  actNumber: number;
  actTitle: string;
  topicTitle: string;
  badgeColor?: string;
}

export const HeaderAnchor: React.FC<HeaderAnchorProps> = ({
  actNumber,
  actTitle,
  topicTitle,
  badgeColor = '#6366F1',
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 80,
        right: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        zIndex: 50,
      }}
    >
      {/* Act Tag Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          padding: '12px 26px',
          borderRadius: 30,
          border: `2px solid ${badgeColor}`,
          marginBottom: 20,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" fill={badgeColor} />
          <path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          data-role="section"
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          PHẦN {actNumber}: {actTitle}
        </span>
      </div>

      {/* Main Topic Hero Title */}
      <h1
        data-role="hero"
        style={{
          margin: 0,
          fontSize: 64,
          fontWeight: 900,
          color: '#F8FAFC',
          lineHeight: 1.25,
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
        }}
      >
        {topicTitle}
      </h1>
    </div>
  );
};
