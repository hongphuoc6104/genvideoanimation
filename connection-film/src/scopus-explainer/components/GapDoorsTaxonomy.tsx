import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';

export interface GapDoorsTaxonomyProps {
  progress?: number;
  activeGap?: number | string; // 0..4 or 'theoretical' | 'empirical' etc.
  activeGapIndex?: number; // 0..4 or -1 for overview
  style?: React.CSSProperties;
}

interface GapItem {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  desc: string;
  sign: string;
  example: string;
  doorNumber: number;
}

const GAPS: GapItem[] = [
  {
    id: 'g1',
    doorNumber: 1,
    name: '1. GAP LÝ THUYẾT',
    nameEn: 'Theoretical Gap',
    color: PALETTE.CYAN_PRIMARY,
    desc: 'Lý thuyết chưa giải thích trọn vẹn cơ chế nội tại hoặc cấu trúc quan hệ.',
    sign: 'Thiếu biến trung gian (mediator) hoặc biến điều tiết (moderator).',
    example: 'VD: TAM chưa giải thích cơ chế tâm lý cảm xúc trong tài chính số.',
  },
  {
    id: 'g2',
    doorNumber: 2,
    name: '2. GAP THỰC NGHIỆM',
    nameEn: 'Empirical Gap',
    color: PALETTE.AMBER_ALERT,
    desc: 'Kết quả nghiên cứu trước mâu thuẫn, phân tán, chưa nhất quán.',
    sign: 'Bằng chứng đối nghịch giữa các bài báo uy tín trong cùng lĩnh vực.',
    example: 'VD: Nghiên cứu A thấy tác động dương (+), nghiên cứu B thấy tác động âm (-).',
  },
  {
    id: 'g3',
    doorNumber: 3,
    name: '3. GAP BỐI CẢNH',
    nameEn: 'Contextual Gap',
    color: PALETTE.CYAN_GLOW,
    desc: 'Mô hình chưa kiểm định trong bối cảnh có đặc thù làm thay đổi cơ chế.',
    sign: 'Thể chế, văn hóa, công nghệ làm biến đổi bản chất quan hệ.',
    example: 'LƯU Ý: Phải chứng minh bối cảnh thay đổi cơ chế, không chỉ đổi tên địa phương!',
  },
  {
    id: 'g4',
    doorNumber: 4,
    name: '4. GAP PHƯƠNG PHÁP',
    nameEn: 'Methodological Gap',
    color: PALETTE.CORAL_ALERT,
    desc: 'Hạn chế về đo lường, thiết kế mẫu hoặc kỹ thuật phân tích trước đó.',
    sign: 'Thiếu dữ liệu dọc (longitudinal), chưa kiểm soát sai lệch CMV.',
    example: 'VD: Các nghiên cứu trước chỉ dùng khảo sát cắt ngang đơn thời điểm.',
  },
  {
    id: 'g5',
    doorNumber: 5,
    name: '5. GAP ỨNG DỤNG',
    nameEn: 'Practical / Application Gap',
    color: PALETTE.EMERALD_SUCCESS,
    desc: 'Hàm ý quản trị, chính sách chưa được kiểm chứng trong thực tiễn.',
    sign: 'Khoảng cách giữa mô hình lý thuyết và quyết định vận hành cụ thể.',
    example: 'VD: Chính sách chuyển đổi số ngành ngân hàng chưa có căn cứ hành vi.',
  },
];

export const GapDoorsTaxonomy: React.FC<GapDoorsTaxonomyProps> = ({
  progress,
  activeGap,
  activeGapIndex,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = progress !== undefined
    ? progress
    : spring({ frame, fps, config: { damping: 14, stiffness: 85 } });

  // Resolve active index flexibly from either activeGap or activeGapIndex
  let resolvedIndex = -1;
  if (activeGapIndex !== undefined) {
    resolvedIndex = activeGapIndex;
  } else if (activeGap !== undefined) {
    if (typeof activeGap === 'number') {
      resolvedIndex = activeGap >= 1 && activeGap <= 5 ? activeGap - 1 : activeGap;
    } else if (typeof activeGap === 'string') {
      const lower = activeGap.toLowerCase();
      if (lower.includes('theor') || lower === '1') resolvedIndex = 0;
      else if (lower.includes('empir') || lower === '2') resolvedIndex = 1;
      else if (lower.includes('context') || lower === '3') resolvedIndex = 2;
      else if (lower.includes('method') || lower === '4') resolvedIndex = 3;
      else if (lower.includes('practic') || lower.includes('appl') || lower === '5') resolvedIndex = 4;
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g data-part="taxonomy-root" data-joint="taxonomy-frame" opacity={Math.min(1, animProgress * 1.2)}>
          {/* Section Header */}
          <rect
            x={140}
            y={240}
            width={800}
            height={90}
            rx={18}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.CYAN_PRIMARY}
            strokeWidth={2}
          />
          <text x={540} y={276} fill={PALETTE.CYAN_GLOW} fontSize={22} fontWeight="bold" textAnchor="middle">
            PHÂN LOẠI 5 LOẠI RESEARCH GAP (TAXONOMY)
          </text>
          <text x={540} y={308} fill={PALETTE.TEXT_SECONDARY} fontSize={16} textAnchor="middle">
            Xác định đúng 1 loại gap chủ đạo để duy trì tính nhất quán cho toàn bài báo
          </text>

          {/* 5 Gap Door Cards stacked vertically */}
          {GAPS.map((gap, idx) => {
            const cardY = 360 + idx * 175;
            const isActive = resolvedIndex === -1 || resolvedIndex === idx;
            const isHighlighted = resolvedIndex === idx;
            const cardScale = isHighlighted ? 1.025 : 1.0;

            return (
              <g
                key={gap.id}
                data-part={`door-${gap.doorNumber}`}
                data-joint={`joint-door-${gap.doorNumber}`}
                transform={`translate(140, ${cardY}) scale(${cardScale})`}
                opacity={isActive ? 1 : 0.35}
              >
                {/* Card Background */}
                <rect
                  width={800}
                  height={155}
                  rx={16}
                  fill={PALETTE.NAVY_SURFACE}
                  stroke={gap.color}
                  strokeWidth={isHighlighted ? 3.5 : 2}
                />

                {/* Left Accent Color Strip */}
                <rect width={12} height={155} rx={6} fill={gap.color} />

                {/* Title & English Sub */}
                <text x={35} y={36} fill={gap.color} fontSize={20} fontWeight="bold">
                  {gap.name}
                </text>
                <text x={300} y={36} fill={PALETTE.TEXT_MUTED} fontSize={16} fontStyle="italic">
                  ({gap.nameEn})
                </text>

                {/* Description */}
                <text x={35} y={68} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="500">
                  {gap.desc}
                </text>

                {/* Sign / Indicator */}
                <text x={35} y={98} fill={PALETTE.AMBER_LIGHT} fontSize={14}>
                  ➤ Dấu hiệu: {gap.sign}
                </text>

                {/* Example */}
                <text x={35} y={126} fill={PALETTE.TEXT_SECONDARY} fontSize={13}>
                  {gap.example}
                </text>

                {/* Right-hand Vector Door Portal Badge */}
                <g transform="translate(710, 16)">
                  {/* Door frame */}
                  <rect
                    width={64}
                    height={122}
                    rx={10}
                    fill={PALETTE.NAVY_DEEP}
                    stroke={gap.color}
                    strokeWidth={isHighlighted ? 3 : 2}
                  />
                  {/* Door panel recessed arch */}
                  <path
                    d="M 12 110 L 12 36 Q 32 14 52 36 L 52 110 Z"
                    fill={isHighlighted ? gap.color : PALETTE.NAVY_SURFACE}
                    fillOpacity={isHighlighted ? 0.25 : 0.6}
                    stroke={gap.color}
                    strokeWidth={1.5}
                  />
                  {/* Door handle */}
                  <circle cx={46} cy={68} r={3} fill={isHighlighted ? PALETTE.AMBER_LIGHT : gap.color} />

                  {/* Door Emblem / Badge Icon */}
                  {idx === 0 && (
                    <g transform="translate(32, 54)">
                      {/* Theoretical: 3 connected nodes (Mediator/Moderator) */}
                      <circle cx={-10} cy={6} r={3.5} fill={gap.color} />
                      <circle cx={10} cy={6} r={3.5} fill={gap.color} />
                      <circle cx={0} cy={-10} r={4.5} fill={PALETTE.AMBER_LIGHT} />
                      <line x1={-10} y1={6} x2={0} y2={-10} stroke={gap.color} strokeWidth={1.5} />
                      <line x1={10} y1={6} x2={0} y2={-10} stroke={gap.color} strokeWidth={1.5} />
                    </g>
                  )}
                  {idx === 1 && (
                    <g transform="translate(32, 54)">
                      {/* Empirical: Conflicting (+) and (-) signs */}
                      <text x={-6} y={-2} fill={PALETTE.EMERALD_SUCCESS} fontSize={15} fontWeight="bold" textAnchor="middle">+</text>
                      <text x={6} y={12} fill={PALETTE.CORAL_ALERT} fontSize={17} fontWeight="bold" textAnchor="middle">-</text>
                      <line x1={-8} y1={10} x2={8} y2={-6} stroke={PALETTE.AMBER_ALERT} strokeWidth={1.5} />
                    </g>
                  )}
                  {idx === 2 && (
                    <g transform="translate(32, 54)">
                      {/* Contextual: Institutional Globe grid */}
                      <circle cx={0} cy={0} r={12} fill="none" stroke={gap.color} strokeWidth={1.5} />
                      <ellipse cx={0} cy={0} rx={6} ry={12} fill="none" stroke={gap.color} strokeWidth={1} />
                      <line x1={-12} y1={0} x2={12} y2={0} stroke={gap.color} strokeWidth={1} />
                    </g>
                  )}
                  {idx === 3 && (
                    <g transform="translate(32, 54)">
                      {/* Methodological: Wave timeline & measurement ruler */}
                      <path d="M -12 4 Q -6 -8 0 4 Q 6 16 12 4" fill="none" stroke={gap.color} strokeWidth={2} />
                      <line x1={-12} y1={10} x2={12} y2={10} stroke={PALETTE.TEXT_SECONDARY} strokeWidth={1.5} />
                      <line x1={-8} y1={10} x2={-8} y2={14} stroke={PALETTE.TEXT_SECONDARY} strokeWidth={1} />
                      <line x1={0} y1={10} x2={0} y2={15} stroke={PALETTE.TEXT_SECONDARY} strokeWidth={1} />
                      <line x1={8} y1={10} x2={8} y2={14} stroke={PALETTE.TEXT_SECONDARY} strokeWidth={1} />
                    </g>
                  )}
                  {idx === 4 && (
                    <g transform="translate(32, 54)">
                      {/* Practical: Bridge / gear icon */}
                      <path d="M -12 6 Q 0 -6 12 6" fill="none" stroke={gap.color} strokeWidth={2} />
                      <line x1={-12} y1={6} x2={12} y2={6} stroke={gap.color} strokeWidth={1.5} />
                      <circle cx={0} cy={-4} r={3} fill={PALETTE.EMERALD_LIGHT} />
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* Bottom Advice Banner */}
          <rect
            x={140}
            y={1260}
            width={800}
            height={70}
            rx={16}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.EMERALD_SUCCESS}
            strokeWidth={2}
          />
          <text x={540} y={1292} fill={PALETTE.EMERALD_LIGHT} fontSize={17} fontWeight="bold" textAnchor="middle">
            Mẹo Scopus: Chọn 1 loại Gap chủ đạo để kết nối mạch lạc Mở đầu ➔ Phương pháp
          </text>
          <text x={540} y={1316} fill={PALETTE.TEXT_SECONDARY} fontSize={14} textAnchor="middle">
            Không ôm đồm quá nhiều gap dẫn đến mô hình bị loãng và khó bảo vệ
          </text>
        </g>
      </svg>
    </div>
  );
};
