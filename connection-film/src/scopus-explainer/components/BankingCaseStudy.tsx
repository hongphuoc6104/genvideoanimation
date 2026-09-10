import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { quadraticBezierPoint, Point2D } from 'motion-kit';
import { PALETTE } from '../palette';

export interface BankingCaseStudyProps {
  progress?: number;
  showModel?: boolean;
  style?: React.CSSProperties;
}

export const BankingCaseStudy: React.FC<BankingCaseStudyProps> = ({
  progress,
  showModel = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = progress !== undefined
    ? progress
    : spring({ frame, fps, config: { damping: 14, stiffness: 85 } });

  // Flow pulse along research path
  const pulseT = (frame % 50) / 50;
  const pStart: Point2D = { x: 300, y: 1040 };
  const pMid: Point2D = { x: 540, y: 960 };
  const pEnd: Point2D = { x: 780, y: 1040 };
  const packet = quadraticBezierPoint(pStart, pMid, pEnd, pulseT);

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
          {/* Header */}
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
            TEMPLATE 4 CÂU & VÍ DỤ THỰC CHIẾN (CASE STUDY)
          </text>
          <text x={540} y={308} fill={PALETTE.TEXT_SECONDARY} fontSize={16} textAnchor="middle">
            Công thức chuẩn hóa bản thảo hướng đến Scopus Q1-Q4
          </text>

          {/* TEMPLATE BOX: 4 CHUẨN CÂU */}
          <g transform="translate(140, 360)">
            <rect
              width={800}
              height={440}
              rx={18}
              fill={PALETTE.NAVY_SURFACE}
              stroke={PALETTE.NAVY_BORDER}
              strokeWidth={2}
            />

            {/* Câu 1 */}
            <rect x={24} y={24} width={130} height={30} rx={6} fill={PALETTE.CYAN_PRIMARY} />
            <text x={89} y={44} fill={PALETTE.NAVY_DARK} fontSize={14} fontWeight="bold" textAnchor="middle">
              1. CÂU NỀN
            </text>
            <text x={170} y={45} fill={PALETTE.TEXT_PRIMARY} fontSize={16} fontWeight="bold">
              Các nghiên cứu trước đã xem xét [Khái niệm A] và ghi nhận [Kết quả chính].
            </text>

            {/* Câu 2 */}
            <rect x={24} y={120} width={150} height={30} rx={6} fill={PALETTE.AMBER_ALERT} />
            <text x={99} y={140} fill={PALETTE.NAVY_DARK} fontSize={14} fontWeight="bold" textAnchor="middle">
              2. ĐIỂM CHƯA RÕ
            </text>
            <text x={190} y={141} fill={PALETTE.AMBER_LIGHT} fontSize={16} fontWeight="bold">
              Dẫu vậy, bằng chứng hiện có vẫn chưa giải thích đầy đủ [Cơ chế / Bối cảnh].
            </text>

            {/* Câu 3 */}
            <rect x={24} y={216} width={150} height={30} rx={6} fill={PALETTE.PURPLE_ACCENT} />
            <text x={99} y={236} fill={PALETTE.NAVY_DARK} fontSize={14} fontWeight="bold" textAnchor="middle">
              3. Ý NGHĨA GAP
            </text>
            <text x={190} y={237} fill={PALETTE.TEXT_PRIMARY} fontSize={16} fontWeight="bold">
              Khoảng trống này quan trọng vì [Lý do học thuật hoặc quản trị thực tiễn].
            </text>

            {/* Câu 4 */}
            <rect x={24} y={312} width={150} height={30} rx={6} fill={PALETTE.EMERALD_SUCCESS} />
            <text x={99} y={332} fill={PALETTE.NAVY_DARK} fontSize={14} fontWeight="bold" textAnchor="middle">
              4. ĐỊNH VỊ NAY
            </text>
            <text x={190} y={333} fill={PALETTE.EMERALD_LIGHT} fontSize={16} fontWeight="bold">
              Nghiên cứu hiện tại kiểm định [Mô hình / Biến M] nhằm bổ sung bằng chứng.
            </text>
          </g>

          {/* VÍ DỤ MINH HỌA: MÔ HÌNH NGÂN HÀNG SỐ (DIGITAL BANKING CASE STUDY) */}
          {showModel && (
            <g data-part="case-study-model" data-joint="model-root" transform="translate(140, 810)">
              <rect
                width={800}
                height={460}
                rx={18}
                fill={PALETTE.NAVY_SURFACE}
                stroke={PALETTE.CYAN_PRIMARY}
                strokeWidth={2}
              />
              <text x={400} y={36} fill={PALETTE.CYAN_GLOW} fontSize={20} fontWeight="bold" textAnchor="middle">
                MÔ HÌNH VÍ DỤ: DỊCH VỤ NGÂN HÀNG SỐ (DIGITAL BANKING)
              </text>
              <text x={400} y={58} fill={PALETTE.TEXT_SECONDARY} fontSize={13} textAnchor="middle">
                Khung lý thuyết TAM mở rộng kết hợp Chất lượng Dịch vụ, Sự Hài lòng &amp; Rủi ro Cảm nhận
              </text>

              {/* 1. TAM Theoretical Foundation Box (PU & PEOU) */}
              <g data-part="construct-tam" data-joint="joint-tam" transform="translate(30, 75)">
                <rect width={220} height={80} rx={10} fill={PALETTE.NAVY_DEEP} stroke={PALETTE.NAVY_BORDER} strokeWidth={2} strokeDasharray="5 3" />
                <text x={110} y={24} fill={PALETTE.TEXT_SECONDARY} fontSize={13} fontWeight="bold" textAnchor="middle">
                  Nền tảng TAM (Davis 1989)
                </text>
                <rect x={12} y={34} width={92} height={32} rx={6} fill={PALETTE.NAVY_SURFACE} stroke={PALETTE.CYAN_PRIMARY} strokeWidth={1.5} />
                <text x={58} y={54} fill={PALETTE.CYAN_GLOW} fontSize={12} fontWeight="bold" textAnchor="middle">
                  Hữu ích (PU)
                </text>
                <rect x={116} y={34} width={92} height={32} rx={6} fill={PALETTE.NAVY_SURFACE} stroke={PALETTE.CYAN_PRIMARY} strokeWidth={1.5} />
                <text x={162} y={54} fill={PALETTE.CYAN_GLOW} fontSize={12} fontWeight="bold" textAnchor="middle">
                  Dễ dùng (PEOU)
                </text>
              </g>

              {/* 2. Independent Variable: E-Service Quality */}
              <g data-part="construct-esq" data-joint="joint-esq" transform="translate(30, 185)">
                <rect width={220} height={90} rx={12} fill={PALETTE.NAVY_DEEP} stroke={PALETTE.CYAN_PRIMARY} strokeWidth={2.5} />
                <text x={110} y={36} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="bold" textAnchor="middle">
                  Chất lượng Dịch vụ số
                </text>
                <text x={110} y={58} fill={PALETTE.TEXT_SECONDARY} fontSize={13} textAnchor="middle">
                  (E-Service Quality)
                </text>
                <rect x={70} y={66} width={80} height={16} rx={4} fill={PALETTE.NAVY_SURFACE} />
                <text x={110} y={78} fill={PALETTE.CYAN_GLOW} fontSize={11} textAnchor="middle">
                  β = 0.42***
                </text>
              </g>

              {/* 3. Mediator: Customer Satisfaction (TRUNG GIAN M) */}
              <g data-part="construct-mediator" data-joint="joint-mediator" transform="translate(290, 130)">
                <rect width={220} height={90} rx={12} fill={PALETTE.NAVY_DEEP} stroke={PALETTE.EMERALD_SUCCESS} strokeWidth={3} />
                <text x={110} y={32} fill={PALETTE.EMERALD_LIGHT} fontSize={14} fontWeight="bold" textAnchor="middle">
                  Biến Trung Gian (M)
                </text>
                <text x={110} y={54} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="bold" textAnchor="middle">
                  Sự Hài Lòng Khách Hàng
                </text>
                <rect x={70} y={64} width={80} height={18} rx={4} fill={PALETTE.NAVY_SURFACE} />
                <text x={110} y={77} fill={PALETTE.EMERALD_LIGHT} fontSize={11} textAnchor="middle">
                  β = 0.38***
                </text>
              </g>

              {/* 4. Moderator: Perceived Risk (ĐIỀU TIẾT W - HIGHLIGHTED RESEARCH GAP) */}
              <g data-part="construct-moderator" data-joint="joint-moderator" transform="translate(290, 290)">
                <rect
                  width={220}
                  height={95}
                  rx={12}
                  fill={PALETTE.AMBER_SOFT}
                  stroke={PALETTE.AMBER_ALERT}
                  strokeWidth={3}
                  strokeDasharray="6 4"
                />
                <text x={110} y={30} fill={PALETTE.AMBER_LIGHT} fontSize={14} fontWeight="900" textAnchor="middle">
                  ⚡ BIẾN ĐIỀU TIẾT (W)
                </text>
                <text x={110} y={52} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="bold" textAnchor="middle">
                  Rủi Ro Cảm Nhận
                </text>
                <text x={110} y={72} fill={PALETTE.CORAL_LIGHT} fontSize={11} fontWeight="bold" textAnchor="middle">
                  [CƠ CHẾ ĐIỀU TIẾT CHƯA RÕ]
                </text>
                <rect x={70} y={76} width={80} height={15} rx={3} fill={PALETTE.NAVY_DEEP} />
                <text x={110} y={87} fill={PALETTE.AMBER_LIGHT} fontSize={10} textAnchor="middle">
                  β = -0.24**
                </text>
              </g>

              {/* 5. Dependent Variable: Continuance Intention */}
              <g data-part="construct-dv" data-joint="joint-dv" transform="translate(550, 185)">
                <rect width={220} height={90} rx={12} fill={PALETTE.NAVY_DEEP} stroke={PALETTE.CYAN_PRIMARY} strokeWidth={2.5} />
                <text x={110} y={36} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="bold" textAnchor="middle">
                  Ý Định Tiếp Tục Dùng
                </text>
                <text x={110} y={58} fill={PALETTE.EMERALD_LIGHT} fontSize={13} textAnchor="middle">
                  (Continuance Intention)
                </text>
                <rect x={65} y={66} width={90} height={16} rx={4} fill={PALETTE.NAVY_SURFACE} />
                <text x={110} y={78} fill={PALETTE.TEXT_SECONDARY} fontSize={11} textAnchor="middle">
                  R² = 0.58
                </text>
              </g>

              {/* Statistical Path Arrows */}
              {/* TAM -> Continuance Intention */}
              <path d="M 250 115 Q 400 95 550 195" stroke={PALETTE.TEXT_MUTED} strokeWidth={2} strokeDasharray="4 4" fill="none" />

              {/* E-SQ -> Satisfaction */}
              <path d="M 250 225 Q 270 175 290 175" stroke={PALETTE.CYAN_PRIMARY} strokeWidth={3} fill="none" />
              <polygon points="290,175 282,171 282,179" fill={PALETTE.CYAN_PRIMARY} />

              {/* Satisfaction -> Continuance Intention */}
              <path d="M 510 175 Q 530 175 550 225" stroke={PALETTE.EMERALD_SUCCESS} strokeWidth={3} fill="none" />
              <polygon points="550,225 544,218 548,226" fill={PALETTE.EMERALD_SUCCESS} />

              {/* Direct Path: E-SQ -> Continuance Intention */}
              <path d="M 250 230 L 550 230" stroke={PALETTE.CYAN_PRIMARY} strokeWidth={2.5} fill="none" strokeDasharray="5 3" />

              {/* Moderation Path: Perceived Risk pointing to Satisfaction -> Continuance Path */}
              <path d="M 400 290 L 400 230" stroke={PALETTE.AMBER_ALERT} strokeWidth={3.5} fill="none" strokeDasharray="6 4" />
              {/* Moderation interaction ring / arrow */}
              <circle cx={400} cy={230} r={8} fill={PALETTE.NAVY_DEEP} stroke={PALETTE.AMBER_ALERT} strokeWidth={3} />
              <text x={400} y={234} fill={PALETTE.AMBER_LIGHT} fontSize={10} fontWeight="900" textAnchor="middle">×</text>

              {/* Traveling Pulse packet on mediation conduit */}
              <circle cx={packet.x} cy={packet.y - 810 + 750} r={7} fill={PALETTE.AMBER_LIGHT} />

              {/* Moderation Mechanism Callout Badge */}
              <rect x={180} y={405} width={440} height={36} rx={8} fill={PALETTE.NAVY_DEEP} stroke={PALETTE.AMBER_ALERT} strokeWidth={1.5} />
              <text x={400} y={428} fill={PALETTE.AMBER_LIGHT} fontSize={13} fontWeight="bold" textAnchor="middle">
                ✦ Điểm mới: Kiểm định cơ chế điều tiết của Rủi ro cảm nhận
              </text>
            </g>
          )}

          {/* Bottom Gap Statement Citation */}
          <rect
            x={140}
            y={1280}
            width={800}
            height={84}
            rx={16}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.EMERALD_SUCCESS}
            strokeWidth={2}
          />
          <text x={540} y={1314} fill={PALETTE.EMERALD_LIGHT} fontSize={16} fontWeight="bold" textAnchor="middle">
            "Không chỉ tuyên bố thiếu nghiên cứu — mà chỉ rõ cơ chế tâm lý chưa nhất quán"
          </text>
          <text x={540} y={1342} fill={PALETTE.TEXT_SECONDARY} fontSize={14} textAnchor="middle">
            Đó là cấu trúc lập luận chuẩn mực giúp bản thảo vượt qua vòng Desk Review!
          </text>
        </g>
      </svg>
    </div>
  );
};
