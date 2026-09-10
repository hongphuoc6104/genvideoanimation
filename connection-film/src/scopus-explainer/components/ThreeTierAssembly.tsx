import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { squashStretch } from 'motion-kit';
import { PALETTE } from '../palette';

export interface ThreeTierAssemblyProps {
  progress?: number;
  snapped?: boolean;
  style?: React.CSSProperties;
}

export const ThreeTierAssembly: React.FC<ThreeTierAssemblyProps> = ({
  progress,
  snapped = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = progress !== undefined
    ? progress
    : spring({ frame, fps, config: { damping: 12, stiffness: 90 } });

  // Tier 3 Drop-in Snap animation
  const dropProgress = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const tier3Y = interpolate(dropProgress, [0, 1], [300, 740]);
  const impactSquash = dropProgress >= 0.95
    ? squashStretch(1 + Math.sin((dropProgress - 0.95) * 20 * Math.PI) * 0.08)
    : { scaleX: 1, scaleY: 1 };

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
        <g opacity={Math.min(1, animProgress * 1.2)}>
          {/* Header Title: Swales CARS Model 1990 */}
          <rect
            x={140}
            y={340}
            width={800}
            height={90}
            rx={18}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.CYAN_PRIMARY}
            strokeWidth={2}
          />
          <text x={540} y={376} fill={PALETTE.CYAN_GLOW} fontSize={22} fontWeight="bold" textAnchor="middle">
            CẤU TRÚC 3 TẦNG THÔNG TIN (GAP STATEMENT)
          </text>
          <text x={540} y={408} fill={PALETTE.TEXT_SECONDARY} fontSize={16} textAnchor="middle">
            Mô hình Swales CARS (1990) — Không phủ định tri thức cũ, kế thừa có chọn lọc
          </text>

          {/* TIER 1: FOUNDATION BLOCK (TẦNG NỀN TẢNG) */}
          <g data-part="tier-1-foundation" data-joint="joint-tier-1" transform="translate(190, 950)">
            <rect
              width={700}
              height={160}
              rx={16}
              fill={PALETTE.NAVY_SURFACE}
              stroke={PALETTE.CYAN_PRIMARY}
              strokeWidth={3.5}
            />
            {/* Tier 1 Label Badge */}
            <rect x={20} y={18} width={290} height={38} rx={8} fill={PALETTE.CYAN_PRIMARY} />
            <text x={165} y={43} fill={PALETTE.NAVY_DARK} fontSize={16} fontWeight="900" textAnchor="middle">
              Tầng 1: Tri thức nền tảng
            </text>
            <text x={24} y={90} fill={PALETTE.TEXT_PRIMARY} fontSize={18} fontWeight="bold">
              • Move 1 (Swales): Tri thức hiện có đã giải thích được điều gì?
            </text>
            <text x={24} y={120} fill={PALETTE.TEXT_SECONDARY} fontSize={15}>
              (VD: Đã xác nhận vai trò của chất lượng dịch vụ điện tử đến lòng trung thành)
            </text>
          </g>

          {/* TIER 2: RECESSED / MISSING VOID SLOT (TẦNG VẤN ĐỀ) */}
          <g data-part="tier-2-void" data-joint="joint-tier-2" transform="translate(190, 740)">
            {/* Dashed Void Slot with Interlocking Notch */}
            <rect
              width={700}
              height={175}
              rx={16}
              fill={PALETTE.AMBER_SOFT}
              stroke={PALETTE.AMBER_ALERT}
              strokeWidth={3}
              strokeDasharray="8 6"
            />
            {/* Precision alignment guide notch in void */}
            <polygon points="320,175 350,155 380,175" fill={PALETTE.AMBER_ALERT} opacity={0.4} />

            {/* Tier 2 Label Badge */}
            <rect x={20} y={18} width={430} height={38} rx={8} fill={PALETTE.AMBER_ALERT} />
            <text x={235} y={43} fill={PALETTE.NAVY_DARK} fontSize={16} fontWeight="900" textAnchor="middle">
              Tầng 2: Điểm chưa rõ / Khoảng trống học thuật
            </text>
            <text x={24} y={90} fill={PALETTE.AMBER_LIGHT} fontSize={18} fontWeight="bold">
              • Move 2 (Swales): Điểm nào vẫn chưa được giải thích thỏa đáng?
            </text>
            <text x={24} y={120} fill={PALETTE.TEXT_PRIMARY} fontSize={15}>
              (VD: Cơ chế tâm lý trung gian chưa nhất quán tại thị trường mới nổi)
            </text>
          </g>

          {/* TIER 3: POSITIONING BLOCK (TẦNG ĐỊNH VỊ - SNAPS INTO TIER 2 VOID) */}
          <g
            data-part="tier-3-snapping"
            data-joint="joint-tier-3"
            transform={`translate(190, ${tier3Y}) scale(${impactSquash.scaleX}, ${impactSquash.scaleY})`}
            opacity={dropProgress > 0 ? 1 : 0}
          >
            <rect
              width={700}
              height={175}
              rx={16}
              fill={PALETTE.NAVY_SURFACE}
              stroke={PALETTE.EMERALD_SUCCESS}
              strokeWidth={3.5}
            />
            {/* Interlocking key tab that fits perfectly into the slot */}
            <polygon points="320,175 350,195 380,175" fill={PALETTE.EMERALD_SUCCESS} opacity={0.6} />

            {/* Tier 3 Label Badge */}
            <rect x={20} y={18} width={400} height={38} rx={8} fill={PALETTE.EMERALD_SUCCESS} />
            <text x={220} y={43} fill={PALETTE.NAVY_DARK} fontSize={16} fontWeight="900" textAnchor="middle">
              Tầng 3: Định vị đóng góp nghiên cứu mới
            </text>
            <text x={24} y={90} fill={PALETTE.EMERALD_LIGHT} fontSize={18} fontWeight="bold">
              • Move 3 (Swales): Nghiên cứu này đóng góp bổ sung gì mới?
            </text>
            <text x={24} y={120} fill={PALETTE.TEXT_PRIMARY} fontSize={15}>
              (VD: Kiểm định vai trò trung gian Sự hài lòng &amp; điều tiết Rủi ro cảm nhận)
            </text>
            {/* Snapped Checkmark & Radiance Burst */}
            {dropProgress >= 0.95 && (
              <g transform="translate(635, 25)">
                <circle cx={22} cy={22} r={22} fill={PALETTE.EMERALD_SUCCESS} />
                <path d="M 13 22 L 20 29 L 31 15" stroke={PALETTE.NAVY_DARK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
            )}
          </g>

          {/* Bottom Summary Callout */}
          <rect
            x={190}
            y={1180}
            width={700}
            height={74}
            rx={16}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.EMERALD_SUCCESS}
            strokeWidth={2}
          />
          <text x={540} y={1212} fill={PALETTE.EMERALD_LIGHT} fontSize={18} fontWeight="bold" textAnchor="middle">
            KẾ THỪA CÓ CHỌN LỌC — KHÔNG PHỦ NHẬN TOÀN BỘ CÔNG TRÌNH CŨ
          </text>
          <text x={540} y={1238} fill={PALETTE.TEXT_SECONDARY} fontSize={15} textAnchor="middle">
            Chuẩn Scopus đòi hỏi lập luận logic có căn cứ vững chắc (Defensible Gap)
          </text>
        </g>
      </svg>
    </div>
  );
};
