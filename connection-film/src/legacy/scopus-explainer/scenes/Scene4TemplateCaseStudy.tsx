import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene4TemplateCaseStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const cardScale = interpolate(introSpring, [0, 1], [0.92, 1.0]);

  // Content-driven progressive beats for Shot 4 (555 frames total):
  // Beat 16: frames 0 - 135 (Template 4 câu chuẩn quốc tế)
  // Beat 17: frames 135 - 264 (Case Study Ngân hàng số - TAM Nền tảng)
  // Beat 18: frames 264 - 421 (Mâu thuẫn cơ chế E-service quality)
  // Beat 19: frames 421 - 555 (Mô hình hoàn chỉnh: Mediator & Moderator + Match cut out at 540-555)
  const activeBeat =
    frame < 135 ? 1 :
    frame < 264 ? 2 :
    frame < 421 ? 3 : 4;

  // Motivated case stage crossfades & vertical slide (sequential transition at frame 135)
  const b1Exit = interpolate(frame, [127, 135], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b1Slide = interpolate(frame, [127, 135], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b2Enter = interpolate(frame, [135, 143], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b2Exit = interpolate(frame, [256, 264], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b2Opacity = Math.min(b2Enter, b2Exit);
  const b2Slide = frame < 200
    ? interpolate(frame, [135, 143], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [256, 264], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b3Enter = interpolate(frame, [256, 264], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b3Exit = interpolate(frame, [413, 421], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b3Opacity = Math.min(b3Enter, b3Exit);
  const b3Slide = frame < 340
    ? interpolate(frame, [256, 264], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [413, 421], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b4Enter = interpolate(frame, [413, 421], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b4Slide = interpolate(frame, [413, 421], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Match cut transition out (frames 540 - 555 -> global 2516 - 2546)
  const matchCutFade = interpolate(frame, [540, 555], [1, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: PALETTE.NAVY_DEEP,
        overflow: 'hidden',
        opacity: matchCutFade,
      }}
    >
      {/* Background Decorative Academic Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="scene4GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#scene4GridPattern)" />
      </svg>

      {/* TOP HEADER */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 72,
          right: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${cardScale})`,
          opacity: introSpring,
          zIndex: 30,
        }}
      >
        <div
          style={{
            backgroundColor: PALETTE.CYAN_SOFT,
            border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
            borderRadius: 30,
            padding: '12px 28px',
            marginBottom: 16,
          }}
        >
          <span
            data-role="secondary"
            style={{ color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 'bold', letterSpacing: 1.5 }}
          >
            PHẦN 4: TEMPLATE 4 CÂU & CASE STUDY NGÂN HÀNG SỐ
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            color: PALETTE.TEXT_PRIMARY,
            fontSize: 64,
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          CÔNG THỨC & VÍ DỤ THỰC CHIẾN
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 16: TEMPLATE 4 CÂU (Frames 0 - 135) */}
      {/* ========================================================================= */}
      {frame < 135 && (
        <div
          style={{
            position: 'absolute',
            top: 430,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: b1Exit,
            transform: `translateY(${b1Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CYAN_PRIMARY}`,
              padding: '28px 36px',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW, textAlign: 'center' }}>
              TEMPLATE 4 CÂU CHUẨN QUỐC TẾ
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 20, border: `2px solid ${PALETTE.CYAN_PRIMARY}`, padding: '20px 26px' }}>
              <h3 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                1. CÂU NỀN TẢNG
              </h3>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Các nghiên cứu trước đã xem xét [Khái niệm A] và ghi nhận [Kết quả chính].
              </p>
            </div>

            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 20, border: `2px solid ${PALETTE.AMBER_ALERT}`, padding: '20px 26px' }}>
              <h3 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                2. CÂU ĐIỂM CHƯA RÕ
              </h3>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Dẫu vậy, bằng chứng hiện có vẫn chưa giải thích đầy đủ [Cơ chế / Bối cảnh].
              </p>
            </div>

            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 20, border: `2px solid ${PALETTE.EMERALD_SUCCESS}`, padding: '20px 26px' }}>
              <h3 style={{ margin: 0, color: PALETTE.EMERALD_LIGHT, fontSize: 38, fontWeight: 900 }}>
                3. CÂU Ý NGHĨA & 4. CÂU ĐỊNH VỊ
              </h3>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Sự thiếu hụt này làm hạn chế lý thuyết; do đó bài báo bổ sung giải pháp thực nghiệm mới.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 17: CASE STUDY TAM BASELINE (Frames 143 - 264) */}
      {/* ========================================================================= */}
      {frame >= 135 && frame < 264 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: b2Opacity,
            transform: `translateY(${b2Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CYAN_PRIMARY}`,
              padding: '36px 40px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.CYAN_PRIMARY, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
            >
              CASE STUDY THỰC CHIẾN
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW }}>
              MÔ HÌNH TAM NỀN TẢNG
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Mô hình TAM đã xác nhận vai trò quan trọng của <strong>Tính hữu ích (PU)</strong> và <strong>Tính dễ sử dụng (PEU)</strong>.
            </p>
            <div
              data-role="citation"
              style={{ marginTop: 12, color: PALETTE.TEXT_MUTED, fontSize: 30 }}
            >
              Lý thuyết chấp nhận công nghệ (Davis, 1989)
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 320, height: 440 }}>
              <ResearcherRig pose="presenting" frame={frame} showGlasses scale={0.9} />
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 24,
                border: `2px solid ${PALETTE.CYAN_GLOW}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                📱 NGÂN HÀNG SỐ
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Trong dịch vụ tài chính di động, người dùng không chỉ quan tâm đến tính năng kỹ thuật mà còn đòi hỏi trải nghiệm an toàn.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 18: CONFLICT & CONTEXT (Frames 264 - 421) */}
      {/* ========================================================================= */}
      {frame >= 256 && frame < 421 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: b3Opacity,
            transform: `translateY(${b3Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CORAL_ALERT}`,
              padding: '36px 40px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.CORAL_LIGHT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
            >
              ĐIỂM NGHẼN HỌC THUẬT
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CORAL_ALERT }}>
              MÂU THUẪN CƠ CHẾ E-SERVICE
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Dẫu vậy, cơ chế từ <strong>chất lượng dịch vụ điện tử</strong> sang <strong>ý định tiếp tục dùng</strong> vẫn chưa nhất quán tại các thị trường mới nổi.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 320, height: 440 }}>
              <ResearcherRig pose="analyzing" frame={frame} showGlasses scale={0.9} />
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 24,
                border: `2px solid ${PALETTE.AMBER_ALERT}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ⚠️ KẾT QUẢ PHÂN TÁN
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Nhiều nghiên cứu mâu thuẫn: Có bài báo khẳng định tác động mạnh, có bài báo cho thấy tác động mờ nhạt do yếu tố rủi ro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 19: FULL RESOLUTION (Frames 421 - 555) */}
      {/* ========================================================================= */}
      {frame >= 413 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: b4Enter,
            transform: `translateY(${b4Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.EMERALD_SUCCESS}`,
              padding: '36px 40px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
            >
              LỜI GIẢI MÔ HÌNH HOÀN CHỈNH
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.EMERALD_LIGHT }}>
              LẤP ĐẦY TRỌN VẸN GAP
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Nghiên cứu mới kiểm định trung gian <strong>Hài lòng</strong> và điều tiết <strong>Rủi ro cảm nhận</strong> lấp đầy trọn vẹn khoảng trống!
            </p>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 320, height: 440 }}>
              <ResearcherRig pose="discovering" frame={frame} showIdeaBulb showGlasses scale={0.9} />
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 24,
                border: `2px solid ${PALETTE.EMERALD_SUCCESS}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.EMERALD_LIGHT, fontSize: 38, fontWeight: 900 }}>
                🏆 ĐÓNG GÓP HỌC THUẬT
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Mở rộng lý thuyết TAM, giải quyết mâu thuẫn thực nghiệm và tạo hàm ý quản trị chiến lược cho ngân hàng số.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Scene4CaseStudyTemplate = Scene4TemplateCaseStudy;
