import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { IndustrialMap } from '../components/IndustrialMap';
import { THEME } from '../components/DesignTokens';

export const Scene4IndustrialImpact: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 sub-phases (Beats 10, 11, 12), duration ~750 frames (25 seconds)
  // Phase 1 (0 - 250): Urbanization & Lancashire textile mechanization
  // Phase 2 (250 - 500): Subterranean mining & locomotive expansion
  // Phase 3 (500 - 750): Thermodynamic synthesis & Carnot cycle heritage

  const isPhase1 = frame < 250;
  const isPhase2 = frame >= 250 && frame < 500;
  const isPhase3 = frame >= 500;

  const mapProgress = spring({
    frame: frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const synthesisScale = spring({
    frame: frame - 500,
    fps,
    config: { damping: 12, stiffness: 90 },
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
          PHẦN 4: CÁCH MẠNG CÔNG NGHIỆP & DI SẢN NHIỆT ĐỘNG
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
          {isPhase1 && 'Đại Đô Thị Công Nghiệp Lancashire'}
          {isPhase2 && 'Mỏ Than Tầng Sâu & Đường Sắt'}
          {isPhase3 && 'Di Sản Khoa Học Nhiệt Động Học'}
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
        {/* BEAT 10 & 11: INDUSTRIAL URBANIZATION & LOCOMOTIVE INFRASTRUCTURE */}
        {(isPhase1 || isPhase2) && (
          <IndustrialMap
            revealProgress={isPhase2 ? 1.0 : mapProgress}
            width={720}
            height={740}
            showLabels={true}
          />
        )}

        {/* BEAT 12: SCIENTIFIC THERMODYNAMIC SYNTHESIS */}
        {isPhase3 && (
          <svg width={740} height={820} viewBox="0 0 740 820">
            {/* Carnot Cycle Abstraction Formula Card */}
            <g transform="translate(120, 80)">
              <rect
                x={0}
                y={0}
                width={500}
                height={260}
                rx={20}
                fill="#151F32"
                stroke="#3B82F6"
                strokeWidth={4}
              />
              <text x={250} y={64} textAnchor="middle" fill="#93C5FD" fontSize={THEME.typography.cardTitle} fontWeight="bold">
                HIỆU SUẤT NHIỆT CARNOT (1824)
              </text>
              <text x={250} y={150} textAnchor="middle" fill="#FFF" fontSize={THEME.typography.hero} fontWeight="900">
                η = 1 - (T_c / T_h)
              </text>
              <text data-role="secondary" x={250} y={210} textAnchor="middle" fill="#94A3B8" fontSize={THEME.typography.secondary}>
                T_h = 373K (Xi-lanh) • T_c = 293K (Bình ngưng)
              </text>
            </g>

            {/* Victory Seal: Modern Energy Paradigm */}
            <g transform="translate(370, 520)">
              <circle cx={0} cy={0} r={140 * Math.min(1, synthesisScale)} fill="#064E3B" stroke="#10B981" strokeWidth={6} />
              <circle cx={0} cy={0} r={115 * Math.min(1, synthesisScale)} fill="none" stroke="#34D399" strokeWidth={3} strokeDasharray="10 6" />

              <text x={0} y={-24} textAnchor="middle" fill="#FFF" fontSize={THEME.typography.section} fontWeight="900">
                KỶ NGUYÊN
              </text>
              <text x={0} y={32} textAnchor="middle" fill="#A7F3D0" fontSize={THEME.typography.section} fontWeight="900">
                HƠI NƯỚC
              </text>
              <text data-role="secondary" x={0} y={76} textAnchor="middle" fill="#FDE68A" fontSize={THEME.typography.secondary} fontWeight="bold">
                1765 - Hiện đại
              </text>
            </g>
          </svg>
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
          {isPhase1 && '🏭 Nhà Máy Rời Rừng Núi Về Trung Tâm Cảng Biển'}
          {isPhase2 && '🚂 Khai Thác Mỏ Than Sâu & Tuyến Đường Sắt Hơi Nước'}
          {isPhase3 && '🌡️ Nền Móng Cho Định Luật Nhiệt Động Lực Học'}
        </span>
      </div>
    </div>
  );
};
