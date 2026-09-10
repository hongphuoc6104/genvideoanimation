import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DnaDoubleHelix } from '../components/DnaDoubleHelix';
import { HeaderAnchor } from '../components/HeaderAnchor';
import { CRISPR_THEME } from '../types';

interface Scene1MutationProblemProps {
  durationInFrames?: number;
}

export const Scene1MutationProblem: React.FC<Scene1MutationProblemProps> = ({
  durationInFrames = 660,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (frames 0 - 240): Single nucleotide mutation pathology
  // Phase 2 (frames 240 - 450): Legacy tools (ZFN/TALEN) limitation & off-target risk
  // Phase 3 (frames 450 - 660): Bacterial CRISPR adaptive defense insight

  const phase = frame < 240 ? 1 : frame < 450 ? 2 : 3;

  // Spring animations for cards
  const cardSpring = spring({
    frame: frame % 240,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const mutationGlow = Math.sin(frame * 0.15) * 0.5 + 0.5;

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
      {/* Dynamic Background Grid Pattern */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.12 }}
      >
        <defs>
          <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#64748B" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#grid-pattern)" />
      </svg>

      {/* Header Anchor */}
      <HeaderAnchor
        actNumber={1}
        actTitle="Bối Cảnh & Thách Thức"
        topicTitle={
          phase === 1
            ? 'Đột Biến Chuỗi Xoắn DNA'
            : phase === 2
            ? 'Giới Hạn Của Công Cụ Cũ'
            : 'Hệ Thống Miễn Dịch Vi Khuẩn'
        }
        badgeColor={phase === 1 ? '#EF4444' : phase === 2 ? '#F59E0B' : '#06B6D4'}
      />

      {/* Core Relational Visualization: DNA Double Helix with Mutation Marker */}
      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 0,
          width: 1080,
          height: 850,
        }}
      >
        <DnaDoubleHelix
          highlightTarget={phase === 2}
          showLabels={true}
          scale={1.05}
          yOffset={0}
        />

        {/* Phase 1 Overlay: Mutation Callout */}
        {phase === 1 && (
          <div
            style={{
              position: 'absolute',
              top: 320,
              left: 360,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 30,
              opacity: cardSpring,
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.92)',
                padding: '16px 28px',
                borderRadius: 20,
                border: '3px solid #FFFFFF',
                boxShadow: `0 0 ${20 + mutationGlow * 15}px rgba(239, 68, 68, 0.8)`,
              }}
            >
              <span
                data-role="card"
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                Đột Biến Điểm (Point Mutation)
              </span>
            </div>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '16px solid rgba(239, 68, 68, 0.92)',
              }}
            />
          </div>
        )}

        {/* Phase 2 Overlay: Off-Target Risk Indicator */}
        {phase === 2 && (
          <div
            style={{
              position: 'absolute',
              top: 260,
              left: 200,
              width: 680,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '3px dashed #F59E0B',
              borderRadius: 24,
              padding: '20px 30px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              opacity: cardSpring,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A',
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              !
            </div>
            <span
              data-role="body"
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: '#FEF08A',
                lineHeight: 1.35,
              }}
            >
              Nguy cơ cắt chệch mục tiêu (Off-Target Effects) & chi phí chế tạo protein quá lớn
            </span>
          </div>
        )}
      </div>

      {/* Explanatory Pedagogical Context Card (Bottom Active Zone) */}
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
            color: phase === 1 ? '#EF4444' : phase === 2 ? '#F59E0B' : '#06B6D4',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 38 }}>
            {phase === 1 ? '🧬' : phase === 2 ? '⚠️' : '🛡️'}
          </span>
          {phase === 1
            ? 'Bệnh Lý Di Truyền Phân Tử'
            : phase === 2
            ? 'Rào Cản Kỹ Thuật Truyền Thống'
            : 'Cơ Chế Miễn Dịch Vi Khuẩn'}
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
            ? 'Chỉ cần sai khác một cặp base trong 3.2 tỷ nucleotide đã gây bệnh thiếu máu hồng cầu liềm.'
            : phase === 2
            ? 'Công cụ ZFN và TALEN yêu cầu tổng hợp protein mới cho từng chuỗi DNA, rất khó lập trình linh hoạt.'
            : 'Vi khuẩn dùng mảng CRISPR lưu trữ mẫu DNA virus, tạo ra RNA dẫn đường để Cas9 cắt virus tái nhiễm.'}
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
            ? '➤ Hậu quả: Chuỗi xoắn kép tạo ra protein hemoglobin biến dạng'
            : phase === 2
            ? '➤ Thách thức: Cần một công cụ cắt DNA đa năng, tái sử dụng dễ dàng'
            : '➤ Đột phá: Tận dụng cơ chế phòng thủ tự nhiên thành công cụ chỉnh sửa gen'}
        </div>
      </div>
    </div>
  );
};
