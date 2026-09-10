import React from 'react';
import { useCurrentFrame } from 'remotion';

const GAPS = ['Theoretical', 'Empirical', 'Contextual', 'Methodological', 'Practical'];

export const ProgressiveTaxonomyBeats: React.FC = () => {
  const frame = useCurrentFrame();
  // COMPLIANT: Progressive disclosure reveals exactly 1 active card per 120-frame beat
  const activeIdx = Math.min(4, Math.floor(frame / 120));

  return (
    <div style={{ width: 1080, height: 1920 }}>
      <div data-role="info-card" style={{ opacity: 1 }}>
        <h3 style={{ fontSize: 48 }}>{GAPS[activeIdx]} Gap</h3>
        <p style={{ fontSize: 36 }}>Chi tiết cơ chế giải thích của nghiên cứu trước...</p>
      </div>
    </div>
  );
};
