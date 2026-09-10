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
  shotBeats,
}) => {
  const frame = useCurrentFrame();

  // Dynamic choreography derived from semantic timeline (Beats 7, 8, 9)
  // Phase 1: 4-phase thermodynamic P-V expansion cycle
  // Phase 2: Parallel motion pantograph linkage
  // Phase 3: Industrial flywheel rotary torque
  const choreography = useBeatChoreography(shotBeats, frame, 750);
  const isPhase1 = choreography.phase === 1;
  const isPhase2 = choreography.phase === 2;
  const isPhase3 = choreography.phase >= 3;

  // Kinetic state
  const cycleProgress = ((frame * 1.2) % 100) / 100;
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
          {isPhase1 && 'Chu Trình Áp Suất - Thể Tích'}
          {isPhase2 && 'Cơ Cấu Chuyển Động Song Song'}
          {isPhase3 && 'Bánh Đà & Mô-Men Quay Tròn'}
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
        {/* BEAT 7: THERMODYNAMIC P-V CYCLE DIAGRAM */}
        {isPhase1 && (
          <PVDiagram
            cycleProgress={cycleProgress}
            width={680}
            height={720}
            showLabels={true}
          />
        )}

        {/* BEAT 8: WATT'S PARALLEL MOTION LINKAGE PANTOGRAPH */}
        {isPhase2 && (
          <ParallelMotionLinkage
            beamAngleDeg={beamAngle}
            width={680}
            height={680}
            showLabels={true}
          />
        )}

        {/* BEAT 9: CONTINUOUS INDUSTRIAL FLYWHEEL & BELT */}
        {isPhase3 && (
          <RotaryFlywheel
            rotationAngleDeg={flywheelAngle}
            width={640}
            height={720}
            showBelt={true}
            showLabels={true}
          />
        )}
      </div>

      {/* 3. PEDAGOGICAL SUMMARY CARD */}
      <div
        style={{
          width: '100%',
          backgroundColor: THEME.colors.bgCard,
          border: '3px solid #334155',
          borderRadius: 24,
          padding: '28px 36px',
          boxSizing: 'border-box',
        }}
      >
        <p
          data-role="card"
          style={{
            fontSize: THEME.typography.cardTitle,
            color: THEME.colors.brass,
            fontWeight: 800,
            margin: '0 0 12px 0',
          }}
        >
          {isPhase1 && 'ĐỘNG HỌC GIÃN NỞ ĐOẠN NHIỆT'}
          {isPhase2 && 'THIẾT KẾ CƠ HỌC BẤT HỦ CỦA WATT'}
          {isPhase3 && 'NGUỒN ĐỘNG LỰC CÔNG NGHIỆP'}
        </p>

        <p
          data-role="body"
          style={{
            fontSize: THEME.typography.body,
            color: THEME.colors.textPrimary,
            lineHeight: 1.45,
            margin: 0,
            fontWeight: 500,
          }}
        >
          {isPhase1 &&
            'Bằng cách ngắt van hơi sớm ở một phần tư hành trình, lượng hơi nước đã nạp tiếp tục giãn nở đoạn nhiệt sinh công tối đa mà không tốn thêm nhiên liệu than đốt.'}
          {isPhase2 &&
            'Cơ cấu tay đòn song song giữ thanh piston di chuyển hoàn toàn theo đường thẳng đứng tuyệt đối, triệt tiêu mọi lực bẻ ngang làm mòn nát lòng xi-lanh.'}
          {isPhase3 &&
            'Bánh răng hành tinh kết hợp bánh đà tích trữ quán tính biến đổi hành trình thụt thò thẳng đứng thành lực xoay tròn liên tục, cung cấp công suất cho toàn bộ phân xưởng.'}
        </p>
      </div>
    </div>
  );
};
