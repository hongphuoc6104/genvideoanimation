import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';

export interface FatalPitfallsProps {
  progress?: number;
  style?: React.CSSProperties;
}

const PITFALLS = [
  {
    num: '1',
    title: 'KHẲNG ĐỊNH THIẾU BẰNG CHỨNG',
    bad: 'Nói chung chung: "Chưa có nhiều nghiên cứu về đề tài này..."',
    fix: 'Phải đối chiếu tổng quan tài liệu có tiêu chí minh bạch (PRISMA 2020).',
  },
  {
    num: '2',
    title: 'ĐỒNG NHẤT BỐI CẢNH MỚI VỚI TÍNH MỚI',
    bad: '"Chưa có nghiên cứu nào làm tại thị trường Việt Nam / tỉnh X"',
    fix: 'Bối cảnh chỉ có giá trị khi làm thay đổi cơ chế lý thuyết hoặc hàm ý!',
  },
  {
    num: '3',
    title: 'LIỆT KÊ NGUỒN THAY CHO TỔNG HỢP',
    bad: 'Liệt kê tác giả A làm X, tác giả B làm Y một cách rời rạc, cơ học',
    fix: 'Phải phân nhóm, đối chiếu kết quả mâu thuẫn để lộ ra khoảng trống.',
  },
  {
    num: '4',
    title: 'TÁCH RỜI GAP KHỎI THIẾT KẾ PHƯƠNG PHÁP',
    bad: 'Đặt gap về cơ chế tâm lý trung gian nhưng mô hình không có biến trung gian',
    fix: 'Câu hỏi nghiên cứu và phương pháp phải khớp khít 100% với gap đã nêu.',
  },
];

export const FatalPitfalls: React.FC<FatalPitfallsProps> = ({
  progress,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = progress !== undefined
    ? progress
    : spring({ frame, fps, config: { damping: 14, stiffness: 85 } });

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
        <g data-part="pitfalls-root" data-joint="pitfalls-frame" opacity={Math.min(1, animProgress * 1.2)}>
          {/* Header */}
          <rect
            x={140}
            y={240}
            width={800}
            height={90}
            rx={18}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.CORAL_ALERT}
            strokeWidth={2.5}
          />
          <text x={540} y={276} fill={PALETTE.CORAL_LIGHT} fontSize={22} fontWeight="bold" textAnchor="middle">
            ⚠ 4 LỖI CHẾT NGƯỜI DẪN ĐẾN DESK REJECTION
          </text>
          <text x={540} y={308} fill={PALETTE.TEXT_SECONDARY} fontSize={16} textAnchor="middle">
            Những cạm bẫy phổ biến khiến bản thảo bị từ chối ngay từ vòng đầu
          </text>

          {/* 4 Cards */}
          {PITFALLS.map((item, idx) => {
            const cardY = 360 + idx * 215;
            return (
              <g key={item.num} data-part={`pitfall-card-${item.num}`} data-joint={`joint-pitfall-${item.num}`} transform={`translate(140, ${cardY})`}>
                <rect
                  width={800}
                  height={195}
                  rx={16}
                  fill={PALETTE.NAVY_SURFACE}
                  stroke={PALETTE.NAVY_BORDER}
                  strokeWidth={2}
                />
                {/* Left Alert Badge */}
                <rect x={20} y={20} width={42} height={42} rx={10} fill={PALETTE.CORAL_ALERT} />
                <text x={41} y={48} fill={PALETTE.TEXT_PRIMARY} fontSize={22} fontWeight="900" textAnchor="middle">
                  {item.num}
                </text>

                {/* Title */}
                <text x={78} y={48} fill={PALETTE.CORAL_LIGHT} fontSize={19} fontWeight="bold">
                  {item.title}
                </text>

                {/* Bad Practice */}
                <rect x={78} y={75} width={700} height={45} rx={8} fill="rgba(239, 68, 68, 0.12)" />
                <text x={95} y={104} fill={PALETTE.TEXT_PRIMARY} fontSize={15}>
                  ❌ {item.bad}
                </text>

                {/* Remedy */}
                <rect x={78} y={130} width={700} height={45} rx={8} fill="rgba(16, 185, 129, 0.12)" />
                <text x={95} y={159} fill={PALETTE.EMERALD_LIGHT} fontSize={15} fontWeight="500">
                  ✔ GIẢI PHÁP: {item.fix}
                </text>
              </g>
            );
          })}

          {/* Bottom Concluding Scientific Axiom */}
          <g data-part="concluding-axiom" data-joint="axiom-joint" transform="translate(140, 1235)">
            <rect
              width={800}
              height={105}
              rx={18}
              fill={PALETTE.NAVY_SURFACE}
              stroke={PALETTE.EMERALD_SUCCESS}
              strokeWidth={3}
            />
            <text x={400} y={38} fill={PALETTE.EMERALD_LIGHT} fontSize={18} fontWeight="900" textAnchor="middle">
              NGUYÊN LÝ KHOA HỌC CỐT LÕI (STRATEGIC AXIOM):
            </text>
            <text x={400} y={66} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="bold" textAnchor="middle">
              &quot;Research Gap là nền tảng cốt lõi của tính mới và lập luận khoa học!&quot;
            </text>
            <text x={400} y={88} fill={PALETTE.TEXT_SECONDARY} fontSize={13} textAnchor="middle">
              Nền tảng định vị câu hỏi nghiên cứu, mô hình lý thuyết và thiết kế phương pháp chuẩn Scopus.
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};
