import React from 'react';

export const GoodMobileTypography: React.FC = () => {
  return (
    <div style={{ width: 1080, height: 1920, backgroundColor: '#0F172A' }}>
      <h1 style={{ fontSize: 64, color: '#F8FAFC' }}>Tiêu đề đạt chuẩn</h1>
      {/* COMPLIANT: Body text >= 34px */}
      <p style={{ fontSize: 36, color: '#94A3B8' }}>
        Khoảng trống nghiên cứu chưa được chứng minh một cách thuyết phục.
      </p>
      <svg width={1000} height={400}>
        <text x={50} y={100} fontSize={34} fill="#F8FAFC">
          Dữ liệu thứ cấp chưa làm rõ cơ chế biến trung gian
        </text>
      </svg>
    </div>
  );
};
