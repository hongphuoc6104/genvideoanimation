import React from 'react';

const GAPS = ['Theoretical', 'Empirical', 'Contextual', 'Methodological', 'Practical'];

export const DenseTaxonomyCardGrid: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1920 }}>
      {/* VIOLATION: All 5 dense cards simultaneously mounted with full opacity */}
      {GAPS.map((gap) => (
        <div key={gap} data-role="info-card" style={{ opacity: 1, marginBottom: 20 }}>
          <h3 style={{ fontSize: 38 }}>{gap} Gap</h3>
          <p style={{ fontSize: 34 }}>Chi tiết cơ chế giải thích của nghiên cứu trước...</p>
        </div>
      ))}
    </div>
  );
};
