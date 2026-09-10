import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DnaDoubleHelix } from '../components/DnaDoubleHelix';
import { RepairMechanism } from '../components/RepairMechanism';
import { HeaderAnchor } from '../components/HeaderAnchor';
import { CRISPR_THEME } from '../types';

interface Scene4RepairPathwaysProps {
  durationInFrames?: number;
}

export const Scene4RepairPathways: React.FC<Scene4RepairPathwaysProps> = ({
  durationInFrames = 750,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (frames 0 - 270): NHEJ pathway (Indels & Gene Knockout)
  // Phase 2 (frames 270 - 540): HDR pathway (Exogenous Donor Template & Precise Editing)
  // Phase 3 (frames 540 - 750): Biomedical synthesis & future therapeutic era

  const phase = frame < 270 ? 1 : frame < 540 ? 2 : 3;

  const nhejProgress = interpolate(frame, [40, 220], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hdrProgress = interpolate(frame, [290, 480], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardSpring = spring({
    frame: frame % 270,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const victoryGlow = Math.sin(frame * 0.12) * 0.4 + 0.6;

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
      {/* Background Atmosphere */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.16 }}
      >
        <circle
          cx="540"
          cy="850"
          r="600"
          fill={phase === 1 ? '#3B82F6' : phase === 2 ? '#EAB308' : '#10B981'}
        />
      </svg>

      {/* Header Anchor */}
      <HeaderAnchor
        actNumber={4}
        actTitle="Sửa Chữa & Ứng Dụng"
        topicTitle={
          phase === 1
            ? 'Con Đường NHEJ (Bất Hoạt Gen)'
            : phase === 2
            ? 'Con Đường HDR (Chèn Gen Chuẩn)'
            : 'Kỷ Nguyên Y Học Chính Xác'
        }
        badgeColor={phase === 1 ? '#3B82F6' : phase === 2 ? '#EAB308' : '#10B981'}
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
        {phase === 3 ? (
          /* Phase 3: Restored Healthy DNA Helix */
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DnaDoubleHelix
              unwindProgress={0}
              cleavageProgress={0}
              showLabels={true}
              scale={1.1}
              yOffset={40}
            />
            {/* Medical Shield Stamp */}
            <svg
              width="1080"
              height="900"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              <g
                transform="translate(540, 540)"
                filter="drop-shadow(0 0 25px rgba(16, 185, 129, 0.7))"
              >
                <circle cx="0" cy="0" r="110" fill="rgba(16, 185, 129, 0.92)" stroke="#FFFFFF" strokeWidth="6" />
                <path
                  d="M -40 0 L -10 32 L 45 -28"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
        ) : (
          /* Phase 1 & 2: Active Repair Mechanism */
          <svg
            width="1080"
            height="900"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <RepairMechanism
              pathway={phase === 1 ? 'nhej' : 'hdr'}
              progress={phase === 1 ? nhejProgress : hdrProgress}
              opacity={1.0}
            />
          </svg>
        )}
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
            color: phase === 1 ? '#60A5FA' : phase === 2 ? '#FBBF24' : '#34D399',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 38 }}>
            {phase === 1 ? '🚫' : phase === 2 ? '✨' : '🏥'}
          </span>
          {phase === 1
            ? 'NHEJ: Tắt Hoàn Toàn Gen Xấu'
            : phase === 2
            ? 'HDR: Thay Thế & Chèn Đoạn Mới'
            : 'Cách Mạng Y Sinh & Chữa Bệnh'}
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
            ? 'Cơ chế hàn gắn nhanh nối hai đầu đứt nhưng hay gây mất đoạn (Indel), phá vỡ khung đọc mã gen gây bệnh.'
            : phase === 2
            ? 'Cung cấp đoạn DNA khuôn mẫu lành lặn để tế bào sao chép, tích hợp chính xác trình tự mong muốn.'
            : 'Ứng dụng điều trị tận gốc bệnh thiếu máu hồng cầu liềm, ung thư miễn dịch và tái thiết kế sinh học.'}
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
            ? '➤ Mục tiêu: Knockout các gen thúc đẩy ung thư hoặc virus xâm nhập tế bào'
            : phase === 2
            ? '➤ Mục tiêu: Sửa chữa chính xác từng nucleotide bị sai hỏng bẩm sinh'
            : '➤ Tầm nhìn: Kỷ nguyên mới trao cho nhân loại chìa khóa mã nguồn sự sống'}
        </div>
      </div>
    </div>
  );
};
