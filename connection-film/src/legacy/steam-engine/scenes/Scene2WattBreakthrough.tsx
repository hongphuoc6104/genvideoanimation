import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArticulatedCylinder } from '../components/ArticulatedCylinder';
import { SeparateCondenser } from '../components/SeparateCondenser';
import { THEME } from '../components/DesignTokens';

export const Scene2WattBreakthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 sub-phases (Beats 4, 5, 6), duration ~750 frames (25 seconds)
  // Phase 1 (0 - 240): Watt's Isothermal Insight (keep cylinder at 100°C)
  // Phase 2 (240 - 500): Separate Condenser invention (coupled twin chambers)
  // Phase 3 (500 - 750): Steam jacket insulation & vacuum air pump

  const isPhase1 = frame < 240;
  const isPhase2 = frame >= 240 && frame < 500;
  const isPhase3 = frame >= 500;

  // Kinetic oscillations
  const strokeProgress = interpolate(
    (frame % 75),
    [0, 35, 75],
    [0.15, 0.85, 0.15]
  );
  const pumpStroke = (frame % 50) / 50;

  // Temperature gauge stabilization spring
  const tempGauge = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: THEME.colors.bgDark,
        padding: '140px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 1. SECTION HEADER */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p
          data-role="section"
          style={{
            fontSize: THEME.typography.section,
            color: THEME.colors.brass,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: '0 0 16px 0',
          }}
        >
          PHẦN 2: BÌNH NGƯNG TỤ TÁCH RỜI CỦA JAMES WATT
        </p>

        <h1
          data-role="hero"
          style={{
            fontSize: THEME.typography.hero,
            color: THEME.colors.textPrimary,
            fontWeight: 900,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {isPhase1 && 'Trực Giác Nhiệt Động Học 1765'}
          {isPhase2 && 'Buồng Ngưng Tụ Biệt Lập'}
          {isPhase3 && 'Vỏ Áo Hơi & Bơm Chân Không'}
        </h1>
      </div>

      {/* 2. CENTRAL RELATIONAL VISUAL CANVAS */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 980,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* BEAT 4: ISOTHERMAL TEMPERATURE BALANCE (100°C vs 20°C) */}
        {isPhase1 && (
          <svg width={740} height={820} viewBox="0 0 740 820">
            {/* Thermometer 1: Cylinder maintained at 100°C */}
            <g transform="translate(120, 100)">
              {/* Outer tube */}
              <rect x={40} y={40} width={40} height={380} rx={20} fill="#1E293B" stroke="#EF4444" strokeWidth={4} />
              <circle cx={60} cy={440} r={48} fill="#EF4444" stroke="#991B1B" strokeWidth={4} />
              {/* Mercury column */}
              <rect
                x={48}
                y={420 - tempGauge * 340}
                width={24}
                height={tempGauge * 340 + 20}
                rx={12}
                fill="#F87171"
              />
              <text x={60} y={540} textAnchor="middle" fill="#EF4444" fontSize={THEME.typography.section} fontWeight="bold">
                100°C
              </text>
              <text x={60} y={590} textAnchor="middle" fill="#FFF" fontSize={THEME.typography.body} fontWeight="600">
                XI-LANH
              </text>
              <text data-role="secondary" x={60} y={630} textAnchor="middle" fill="#94A3B8" fontSize={THEME.typography.secondary}>
                Luôn giữ nóng
              </text>
            </g>

            {/* Differential Flow Pipe */}
            <path
              d="M 280 320 L 460 320"
              fill="none"
              stroke="#F59E0B"
              strokeWidth={14}
              strokeDasharray="16 8"
            />
            <text data-role="secondary" x={370} y={300} textAnchor="middle" fill="#F59E0B" fontSize={THEME.typography.secondary} fontWeight="bold">
              Hơi nước di chuyển
            </text>

            {/* Thermometer 2: Condenser at 20°C */}
            <g transform="translate(460, 100)">
              <rect x={40} y={40} width={40} height={380} rx={20} fill="#1E293B" stroke="#06B6D4" strokeWidth={4} />
              <circle cx={60} cy={440} r={48} fill="#06B6D4" stroke="#0E7490" strokeWidth={4} />
              <rect
                x={48}
                y={420 - 68}
                width={24}
                height={78}
                rx={12}
                fill="#38BDF8"
              />
              <text x={60} y={540} textAnchor="middle" fill="#06B6D4" fontSize={THEME.typography.section} fontWeight="bold">
                20°C
              </text>
              <text x={60} y={590} textAnchor="middle" fill="#FFF" fontSize={THEME.typography.body} fontWeight="600">
                BÌNH NGƯNG
              </text>
              <text data-role="secondary" x={60} y={630} textAnchor="middle" fill="#94A3B8" fontSize={THEME.typography.secondary}>
                Luôn làm lạnh
              </text>
            </g>
          </svg>
        )}

        {/* BEAT 5 & 6: COUPLED TWIN CHAMBER ARCHITECTURE */}
        {(isPhase2 || isPhase3) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {/* Hot Main Cylinder on Left */}
            <ArticulatedCylinder
              strokeProgress={strokeProgress}
              mode="watt"
              steamPressure={0.9}
              condenserOpen={true}
              width={500}
              height={860}
              showLabels={false}
            />

            {/* Connecting Exhaust Pipe with Valve */}
            <svg width={80} height={400} viewBox="0 0 80 400" style={{ margin: '0 -20px' }}>
              <path d="M 0 260 L 80 260 L 80 290 L 0 290 Z" fill="#D97706" stroke="#92400E" strokeWidth={3} />
              <circle cx={40} cy={275} r={14} fill="#10B981" stroke="#064E3B" strokeWidth={3} />
              <text data-role="secondary" x={40} y={235} textAnchor="middle" fill="#10B981" fontSize={THEME.typography.secondary} fontWeight="bold">
                VAN
              </text>
            </svg>

            {/* Cold Separate Condenser on Right */}
            <SeparateCondenser
              condensingActive={true}
              pumpStrokeProgress={pumpStroke}
              width={420}
              height={760}
              showLabels={false}
            />
          </div>
        )}
      </div>

      {/* 3. DYNAMIC STATUS BADGE (Safe Zone: y = 1200 - 1280, clear of subtitles at y >= 1450) */}
      <div
        style={{
          position: 'absolute',
          top: 1200,
          left: 80,
          right: 80,
          height: 80,
          backgroundColor: THEME.colors.bgCard,
          border: '2px solid #D97706',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span
          data-role="card"
          style={{
            fontSize: 38,
            color: THEME.colors.brass,
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          {isPhase1 && '💡 Nguyên Lý Watt: Xi-Lanh Luôn Giữ Ở Điểm Sôi 100°C'}
          {isPhase2 && '❄️ Bình Ngưng Riêng Biệt: Làm Lạnh Ở Không Gian Khác'}
          {isPhase3 && '🛡️ Áo Hơi Bảo Ôn & Bơm Chân Không Tiết Kiệm 75% Than'}
        </span>
      </div>
    </div>
  );
};
