import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArticulatedCylinder } from '../components/ArticulatedCylinder';
import { THEME } from '../components/DesignTokens';

export interface Scene1Props {
  // Optional local frame override or props
}

export const Scene1PreIndustrial: React.FC<Scene1Props> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 1 has 3 sub-phases (corresponding to Beats 1, 2, 3)
  // Total frames ~ 750 (approx 25 seconds)
  // Phase 1 (frames 0 - 240): Energy bottleneck & Water wheel dependence
  // Phase 2 (frames 240 - 500): Newcomen atmospheric engine with direct spray
  // Phase 3 (frames 500 - 750): Thermal waste breakdown (98% loss vs 2% work)

  const isPhase1 = frame < 240;
  const isPhase2 = frame >= 240 && frame < 500;
  const isPhase3 = frame >= 500;

  // Kinetic animations
  const waterWheelRotation = (frame * 2.5) % 360;

  // Newcomen piston stroke: periodic down (spray condense) and up (steam fill)
  const cyclePeriod = 90;
  const cycleFrame = (frame - 240) % cyclePeriod;
  const isSpraying = cycleFrame > 35 && cycleFrame < 65;
  const strokeProgress = interpolate(
    cycleFrame,
    [0, 35, 65, 90],
    [0.1, 0.9, 0.9, 0.1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Heat loss dissipation graph spring
  const lossProgress = spring({
    frame: frame - 500,
    fps,
    config: { damping: 15, stiffness: 90 },
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
      {/* 1. SECTION HEADER (Anchor) */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 50,
            color: THEME.colors.brass,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: '0 0 16px 0',
          }}
        >
          PHẦN 1: NÚT THẮT NĂNG LƯỢNG TIỀN CÔNG NGHIỆP
        </h2>

        <h1
          style={{
            fontSize: 68,
            color: THEME.colors.textPrimary,
            fontWeight: 900,
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {isPhase1 && 'Giới Hạn Năng Lượng Tự Nhiên'}
          {isPhase2 && 'Động Cơ Khí Quyển Newcomen 1712'}
          {isPhase3 && 'Nghịch Lý Lãng Phí 98% Nhiệt'}
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
        {/* BEAT 1: WATERWHEEL CONSTRAINT & RIVER NETWORK */}
        {isPhase1 && (
          <svg width={720} height={800} viewBox="0 0 720 800">
            {/* Mountain and River Channel */}
            <path
              d="M 60 120 Q 240 220, 200 460 T 140 740"
              fill="none"
              stroke="#0284C7"
              strokeWidth={32}
              strokeLinecap="round"
            />
            {/* Water Flow Particles */}
            <circle cx={140} cy={200 + ((frame * 4) % 400)} r={8} fill="#38BDF8" />
            <circle cx={180} cy={250 + ((frame * 4) % 380)} r={10} fill="#67E8F9" />

            {/* Rotating Waterwheel */}
            <g transform={`translate(380, 360) rotate(${waterWheelRotation})`}>
              <circle cx={0} cy={0} r={160} fill="none" stroke="#64748B" strokeWidth={24} />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => {
                const r = (ang * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={0}
                    y1={0}
                    x2={Math.cos(r) * 160}
                    y2={Math.sin(r) * 160}
                    stroke="#CBD5E1"
                    strokeWidth={10}
                  />
                );
              })}
              <circle cx={0} cy={0} r={32} fill="#D97706" />
            </g>

            {/* Geological Drought / Freeze Warning Badge */}
            <g transform="translate(380, 600)">
              <rect x={-200} y={0} width={400} height={90} rx={16} fill="#1E293B" stroke="#EF4444" strokeWidth={3} />
              <text x={0} y={56} textAnchor="middle" fill="#FCA5A5" fontSize={40} fontWeight="bold">
                ⚠ Ngừng trệ khi sông đóng băng / cạn nước
              </text>
            </g>
          </svg>
        )}

        {/* BEAT 2: NEWCOMEN ATMOSPHERIC ENGINE */}
        {isPhase2 && (
          <ArticulatedCylinder
            strokeProgress={strokeProgress}
            mode="newcomen"
            steamPressure={isSpraying ? 0.2 : 0.8}
            waterSprayActive={isSpraying}
            width={640}
            height={880}
            showLabels={false}
          />
        )}

        {/* BEAT 3: 98% THERMAL WASTE SANKEY DISSIPATION */}
        {isPhase3 && (
          <svg width={740} height={800} viewBox="0 0 740 800">
            {/* Input Coal Heat (100%) */}
            <g transform="translate(60, 140)">
              <rect x={0} y={0} width={200} height={140} rx={16} fill="#EF4444" stroke="#991B1B" strokeWidth={4} />
              <text x={100} y={60} textAnchor="middle" fill="#FFF" fontSize={40} fontWeight="bold">
                NHIỆT TỪ THAN
              </text>
              <text x={100} y={105} textAnchor="middle" fill="#FEE2E2" fontSize={50} fontWeight="900">
                100%
              </text>
            </g>

            {/* Massive Divergence Path: 98% Lost Reheating Cold Cylinder */}
            <path
              d={`M 260 210 C 380 210, 420 320, ${440 + lossProgress * 40} 340`}
              fill="none"
              stroke="#F97316"
              strokeWidth={Math.max(10, lossProgress * 64)}
              strokeLinecap="round"
            />
            <g transform="translate(420, 360)">
              <rect x={0} y={0} width={280} height={150} rx={16} fill="#1E293B" stroke="#EF4444" strokeWidth={4} />
              <text x={140} y={55} textAnchor="middle" fill="#EF4444" fontSize={68} fontWeight="900">
                98%
              </text>
              <text x={140} y={100} textAnchor="middle" fill="#F8FAFC" fontSize={36} fontWeight="bold">
                LÃNG PHÍ NHIỆT
              </text>
              <text data-role="secondary" x={140} y={132} textAnchor="middle" fill="#94A3B8" fontSize={34}>
                Hâm nóng lại kim loại xi-lanh
              </text>
            </g>

            {/* Tiny Path: Only 2% Useful Work */}
            <path
              d="M 260 210 C 340 210, 380 140, 440 120"
              fill="none"
              stroke="#10B981"
              strokeWidth={14}
              strokeLinecap="round"
            />
            <g transform="translate(440, 60)">
              <rect x={0} y={0} width={240} height={100} rx={12} fill="#064E3B" stroke="#10B981" strokeWidth={3} />
              <text x={120} y={48} textAnchor="middle" fill="#A7F3D0" fontSize={50} fontWeight="900">
                CHỈ 2%
              </text>
              <text data-role="secondary" x={120} y={82} textAnchor="middle" fill="#FFF" fontSize={34} fontWeight="600">
                Công cơ học bơm nước
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
          {isPhase1 && '⚠️ Năng Lượng Thủy Lực Phụ Thuộc Dòng Chảy Tự Nhiên'}
          {isPhase2 && '⚙️ Máy Newcomen: Phun Nước Lạnh Trực Tiếp Vào Xi-Lanh'}
          {isPhase3 && '🔥 98% Nhiệt Thất Thoát Nung Nóng Lại Khối Kim Loại'}
        </span>
      </div>
    </div>
  );
};
