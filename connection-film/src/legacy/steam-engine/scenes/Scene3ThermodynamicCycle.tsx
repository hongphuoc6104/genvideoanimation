import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { PVDiagram } from '../components/PVDiagram';
import { ParallelMotionLinkage } from '../components/ParallelMotionLinkage';
import { RotaryFlywheel } from '../components/RotaryFlywheel';
import { THEME } from '../components/DesignTokens';

export interface Scene3ThermodynamicCycleProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3ThermodynamicCycle: React.FC<Scene3ThermodynamicCycleProps> = ({
  durationInFrames = 750,
  shotBeats,
}) => {
  const frame = useCurrentFrame();

  // Dynamic choreography derived from semantic timeline (Beats 7, 8, 9)
  // Beat 7 (Phase 1): Thermodynamic P-V admission & expansion stroke (0.0 -> 0.5)
  // Beat 8 (Phase 2): Condenser exhaust, vacuum creation & return stroke (0.5 -> 1.0)
  // Beat 9 (Phase 3): Parallel motion linkage & flywheel continuous rotation
  const choreography = useBeatChoreography(shotBeats, frame, durationInFrames);
  const isPVPhase1 = choreography.phase === 1;
  const isPVPhase2 = choreography.phase === 2;
  const isPV = isPVPhase1 || isPVPhase2;
  const isMechanism = choreography.phase >= 3;

  // Kinetic state for PV tracer across Beat 7 and Beat 8
  const pvProgress = isPVPhase1
    ? interpolate(choreography.beatProgress, [0, 1], [0.0, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : isPVPhase2
    ? interpolate(choreography.beatProgress, [0, 1], [0.5, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0.0;

  const beamAngle = Math.sin((frame * 0.12)) * 14; // -14° to +14°
  const flywheelAngle = (frame * 4.5) % 360;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: THEME.colors.bgDark,
        padding: '140px 80px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
          PHẦN 3: CHU TRÌNH P-V & CƠ CẤU QUAY TRÒN
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
          {isPVPhase1 && 'Chu Trình P-V: Nạp Hơi & Giãn Nở'}
          {isPVPhase2 && 'Chu Trình P-V: Ngưng Tụ & Chân Không'}
          {isMechanism && 'Cơ Cấu Chuyển Động Song Song & Bánh Đà'}
        </h1>
      </div>

      {/* 2. CENTRAL RELATIONAL VISUAL CANVAS */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 80,
          right: 80,
          height: 980,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* BEATS 7 & 8: CONTINUOUS THERMODYNAMIC P-V CYCLE DIAGRAM */}
        {isPV && (
          <PVDiagram
            cycleProgress={pvProgress}
            width={720}
            height={760}
            showLabels={true}
          />
        )}

        {/* BEAT 9: WATT'S PARALLEL MOTION LINKAGE & INDUSTRIAL FLYWHEEL */}
        {isMechanism && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
            <ParallelMotionLinkage
              beamAngleDeg={beamAngle}
              width={640}
              height={520}
              showLabels={true}
            />
            <RotaryFlywheel
              rotationAngleDeg={flywheelAngle}
              width={520}
              height={320}
              showBelt={true}
              showLabels={false}
            />
          </div>
        )}
      </div>

      {/* 3. DYNAMIC STATUS BADGE (Safe Zone: y = 1330 - 1410, clear of subtitles at y >= 1450) */}
      <div
        style={{
          position: 'absolute',
          top: 1330,
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
            fontWeight: 800,
            color: THEME.colors.brass,
            letterSpacing: '0.02em',
          }}
        >
          {isPVPhase1 && '🔥 Pha 1 & 2: Nạp Hơi Sớm & Giãn Nở Sinh Công'}
          {isPVPhase2 && '❄️ Pha 3 & 4: Xả Vào Bình Ngưng & Hút Chân Không'}
          {isMechanism && '⚙️ Cơ Cấu Song Song Watt: Dẫn Hướng & Bánh Đà'}
        </span>
      </div>
    </div>
  );
};
