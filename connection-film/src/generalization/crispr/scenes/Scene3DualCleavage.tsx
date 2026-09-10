import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DnaDoubleHelix } from '../components/DnaDoubleHelix';
import { Cas9ProteinRig } from '../components/Cas9ProteinRig';
import { CleavageScissors } from '../components/CleavageScissors';
import { HeaderAnchor } from '../components/HeaderAnchor';
import { CRISPR_THEME } from '../types';

interface Scene3DualCleavageProps {
  durationInFrames?: number;
}

export const Scene3DualCleavage: React.FC<Scene3DualCleavageProps> = ({
  durationInFrames = 750,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (frames 0 - 270): Activation of catalytic domains (RuvC & HNH)
  // Phase 2 (frames 270 - 540): Dual strand scission 3bp upstream of PAM (DSB)
  // Phase 3 (frames 540 - 750): Separation of blunt ends & cellular alarm activation

  const phase = frame < 270 ? 1 : frame < 540 ? 2 : 3;

  const cutProgress = interpolate(frame, [250, 420], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const separationProgress = interpolate(frame, [420, 680], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardSpring = spring({
    frame: frame % 270,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const alarmPulse = Math.sin(frame * 0.25) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: CRISPR_THEME.colors.bgDark,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background Pulse during cut */}
      {phase >= 2 && (
        <svg
          width="1080"
          height="1920"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.12 * alarmPulse,
            pointerEvents: 'none',
          }}
        >
          <circle cx="540" cy="850" r="600" fill="#EF4444" />
        </svg>
      )}

      {/* Header Anchor */}
      <HeaderAnchor
        actNumber={3}
        actTitle="Cắt Liên Kết Đôi"
        topicTitle={
          phase === 1
            ? 'Kích Hoạt Hai Miền Xúc Tác'
            : phase === 2
            ? 'Vết Cắt Sợi Đôi (DSB)'
            : 'Tín Hiệu Báo Động Tế Bào'
        }
        badgeColor="#EC4899"
      />

      {/* Core Molecular Mechanics Layer */}
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 0,
          width: 1080,
          height: 900,
        }}
      >
        {/* DNA Helix undergoing cleavage */}
        <DnaDoubleHelix
          unwindProgress={1}
          cleavageProgress={separationProgress}
          highlightPam={true}
          highlightTarget={true}
          showLabels={true}
          scale={1.05}
          yOffset={60}
        />

        {/* Cas9 Protein & Cleavage Scissors */}
        <svg
          width="1080"
          height="900"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Cas9 with active RuvC and HNH domains */}
          <Cas9ProteinRig
            frame={frame}
            x={560}
            y={560}
            clampProgress={1}
            showCatalyticDomains={true}
            activeDomain={phase === 1 ? 'both' : 'none'}
            opacity={phase === 3 ? 0.45 : 0.85}
            scale={1.1}
          />

          {/* Cleavage Scissors Snip */}
          {phase >= 1 && phase <= 2 && (
            <CleavageScissors
              x={510}
              y={560}
              cutProgress={cutProgress}
              opacity={1.0}
            />
          )}

          {/* Alarm waves for Phase 3 */}
          {phase === 3 && (
            <g transform="translate(540, 560)">
              <circle
                cx="0"
                cy="0"
                r={100 + alarmPulse * 50}
                fill="none"
                stroke="#EF4444"
                strokeWidth={5}
                opacity={1 - alarmPulse}
              />
              <circle
                cx="0"
                cy="0"
                r={160 + alarmPulse * 70}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={3}
                opacity={0.8 - alarmPulse * 0.8}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Pedagogical Explanation Card */}
      <div
        style={{
          position: 'absolute',
          bottom: 360,
          left: 80,
          right: 80,
          backgroundColor: 'rgba(19, 29, 51, 0.92)',
          border: '2px solid #1E2D4A',
          borderRadius: 32,
          padding: '36px 40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          opacity: cardSpring,
          transform: `translateY(${(1 - cardSpring) * 25}px)`,
        }}
      >
        <h3
          data-role="card"
          style={{
            margin: '0 0 16px 0',
            fontSize: 38,
            fontWeight: 800,
            color: phase === 1 ? '#EC4899' : phase === 2 ? '#EF4444' : '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 38 }}>
            {phase === 1 ? '✂️' : phase === 2 ? '⚡' : '🚨'}
          </span>
          {phase === 1
            ? 'Hai Lưỡi Kéo Phân Tử: HNH & RuvC'
            : phase === 2
            ? 'Vết Đứt Gãy Sợi Đôi (DSB)'
            : 'Tế Bào Kích Hoạt Hàn Gắn Khẩn Cấp'}
        </h3>
        <p
          data-role="body"
          style={{
            margin: '0 0 14px 0',
            fontSize: 34,
            fontWeight: 500,
            color: '#F8FAFC',
            lineHeight: 1.45,
          }}
        >
          {phase === 1
            ? 'Miền HNH cắt sợi DNA bổ sung gắn với RNA, trong khi miền RuvC cắt sợi DNA tự do đối diện.'
            : phase === 2
            ? 'Vết cắt diễn ra chuẩn xác 3 cặp base trước motif PAM, tạo thành hai đầu bằng (Blunt Ends).'
            : 'Sự đứt lìa sợi đôi đe dọa trực tiếp sự sống còn của tế bào, kích hoạt tức thì các cơ chế sửa chữa gen.'}
        </p>
        <div
          data-role="secondary"
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: '#94A3B8',
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
            paddingTop: 12,
          }}
        >
          {phase === 1
            ? '➤ Phối hợp: Hai miền nuclease hoạt động đồng bộ dưới sự hỗ trợ của ion Magie (Mg2+)'
            : phase === 2
            ? '➤ Vị trí: Chính xác tuyệt đối ở nucleotide thứ 17 của chuỗi nhận diện 20-bp'
            : '➤ Chuyển tiếp: Cas9 hoàn thành nhiệm vụ và nhả khỏi vị trí cắt để tế bào sửa chữa'}
        </div>
      </div>
    </div>
  );
};
