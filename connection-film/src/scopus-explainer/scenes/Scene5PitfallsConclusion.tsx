import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene5PitfallsConclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const cardScale = interpolate(introSpring, [0, 1], [0.92, 1.0]);

  // Content-driven progressive beats for Shot 5 (565 frames total):
  // Beat 20: frames 0 - 137 (Lỗi 1 & Lỗi 2)
  // Beat 21: frames 137 - 270 (Lỗi 3 & Lỗi 4)
  // Beat 22: frames 270 - 407 (Tránh 2 cực đoan)
  // Beat 23: frames 407 - 565 (Nguyên lý cốt lõi & Chúc mừng công bố thành công)
  const activeBeat =
    frame < 137 ? 1 :
    frame < 270 ? 2 :
    frame < 407 ? 3 : 4;

  // Motivated pitfall crossfades & vertical slide (8-frame transition window)
  const b1Exit = interpolate(frame, [129, 137], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b1Slide = interpolate(frame, [129, 137], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b2Enter = interpolate(frame, [129, 137], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b2Exit = interpolate(frame, [262, 270], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b2Opacity = Math.min(b2Enter, b2Exit);
  const b2Slide = frame < 200
    ? interpolate(frame, [129, 137], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [262, 270], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b3Enter = interpolate(frame, [262, 270], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b3Exit = interpolate(frame, [399, 407], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b3Opacity = Math.min(b3Enter, b3Exit);
  const b3Slide = frame < 330
    ? interpolate(frame, [262, 270], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [399, 407], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b4Enter = interpolate(frame, [399, 407], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b4Slide = interpolate(frame, [399, 407], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Acceptance stamp animation in Climax Beat 23
  const acceptStampProgress = spring({
    frame: Math.max(0, frame - 430),
    fps,
    config: { damping: 9, stiffness: 160 },
  });
  const stampScale = interpolate(acceptStampProgress, [0, 1], [3.0, 1.0]);
  const stampOpacity = Math.min(1, acceptStampProgress * 1.5);

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: PALETTE.NAVY_DEEP,
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Academic Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="scene5GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#scene5GridPattern)" />
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
            backgroundColor: activeBeat < 4 ? PALETTE.CORAL_SOFT : PALETTE.EMERALD_SOFT,
            border: `2px solid ${activeBeat < 4 ? PALETTE.CORAL_ALERT : PALETTE.EMERALD_SUCCESS}`,
            borderRadius: 30,
            padding: '12px 28px',
            marginBottom: 16,
          }}
        >
          <span
            data-role="secondary"
            style={{
              color: activeBeat < 4 ? PALETTE.CORAL_LIGHT : PALETTE.EMERALD_LIGHT,
              fontSize: 32,
              fontWeight: 'bold',
              letterSpacing: 1.5,
            }}
          >
            {activeBeat < 4 ? 'PHẦN 5: 4 LỖI CHẾT NGƯỜI & 2 CỰC ĐOAN' : 'KẾT LUẬN & THÔNG ĐIỆP CHỐT'}
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
          {activeBeat < 4 ? 'CÁC CẠM BẪY CẦN TRÁNH' : 'CHINH PHỤC CHUẨN SCOPUS'}
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 20: LỖI 1 & LỖI 2 (Frames 0 - 137) */}
      {/* ========================================================================= */}
      {frame < 137 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
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
              border: `3px solid ${PALETTE.CORAL_ALERT}`,
              padding: '28px 36px',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: PALETTE.CORAL_ALERT, textAlign: 'center' }}>
              ⚠️ HAI LỖI ĐẦU TIÊN CẦN TRÁNH
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 22, border: `2px solid ${PALETTE.CORAL_ALERT}`, padding: '24px 30px' }}>
              <h3 style={{ margin: 0, color: PALETTE.CORAL_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ❌ LỖI 1: THIẾU BẰNG CHỨNG
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Tuyên bố "chưa ai nghiên cứu" mà không đưa ra tổng quan tài liệu có hệ thống để chứng minh.
              </p>
            </div>

            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 22, border: `2px solid ${PALETTE.AMBER_ALERT}`, padding: '24px 30px' }}>
              <h3 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ❌ LỖI 2: ĐỒNG NHẤT BỐI CẢNH
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Nhầm lẫn giữa bối cảnh địa phương mới với tính mới học thuật (Novelty) của lý thuyết.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 21: LỖI 3 & LỖI 4 (Frames 137 - 270) */}
      {/* ========================================================================= */}
      {frame >= 129 && frame < 270 && (
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
              border: `3px solid ${PALETTE.CORAL_ALERT}`,
              padding: '28px 36px',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: PALETTE.CORAL_ALERT, textAlign: 'center' }}>
              ⚠️ HAI LỖI KẾ TIẾP CẦN TRÁNH
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 22, border: `2px solid ${PALETTE.AMBER_ALERT}`, padding: '24px 30px' }}>
              <h3 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ❌ LỖI 3: LIỆT KÊ NGUỒN ĐƠN THUẦN
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Chỉ kể tên tác giả A, tác giả B mà thiếu sự tổng hợp so sánh để làm bật điểm thiếu hụt tri thức.
              </p>
            </div>

            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 22, border: `2px solid ${PALETTE.CORAL_ALERT}`, padding: '24px 30px' }}>
              <h3 style={{ margin: 0, color: PALETTE.CORAL_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ❌ LỖI 4: TÁCH RỜI PHƯƠNG PHÁP
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Nêu khoảng trống một đằng nhưng thiết kế mô hình và phương pháp nghiên cứu một nẻo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 22: TRÁNH 2 CỰC ĐOAN (Frames 270 - 407) */}
      {/* ========================================================================= */}
      {frame >= 262 && frame < 407 && (
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
              border: `3px solid ${PALETTE.AMBER_ALERT}`,
              padding: '28px 36px',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: PALETTE.AMBER_LIGHT, textAlign: 'center' }}>
              TRÁNH HAI CỰC ĐOAN HỌC THUẬT
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 22, border: `2px solid ${PALETTE.AMBER_ALERT}`, padding: '24px 30px' }}>
              <h3 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ⚖️ CỰC ĐOAN 1: VĨ MÔ RỖNG TUẾCH
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Tuyên bố giải quyết vấn đề toàn cầu quá lớn nhưng thiếu cơ sở dữ liệu và mô hình cụ thể.
              </p>
            </div>

            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 22, border: `2px solid ${PALETTE.CYAN_PRIMARY}`, padding: '24px 30px' }}>
              <h3 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                ⚖️ CỰC ĐOAN 2: VI MÔ HÓA VỤN VẶT
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Thu hẹp quá mức vào một địa bàn nhỏ mà kết quả không có giá trị đóng góp cho lý thuyết chung.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 23: NGUYÊN LÝ & KẾT LUẬN (Frames 407 - 565) */}
      {/* ========================================================================= */}
      {frame >= 399 && (
        <div
          style={{
            position: 'absolute',
            top: 420,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: b4Enter,
            transform: `translateY(${b4Slide}px)`,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 32,
              border: `4px solid ${PALETTE.EMERALD_SUCCESS}`,
              padding: '40px 44px',
              boxShadow: '0 30px 70px rgba(16, 185, 129, 0.25)',
              position: 'relative',
              textAlign: 'center',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12 }}
            >
              NGUYÊN LÝ BẤT BIẾN
            </div>
            <h2
              style={{
                margin: '12px 0 0',
                fontSize: 56,
                fontWeight: 900,
                color: PALETTE.EMERALD_LIGHT,
                lineHeight: 1.3,
              }}
            >
              RESEARCH GAP LÀ NỀN TẢNG CỦA TÍNH MỚI!
            </h2>
            <p
              style={{ margin: '20px 0 0', fontSize: 36, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.5, fontWeight: 500 }}
            >
              Chúc bạn xây dựng lập luận vững chắc và công bố thành công trên các tạp chí Scopus hàng đầu!
            </p>

            {/* Green SCOPUS ACCEPTED Stamp */}
            <div
              style={{
                marginTop: 28,
                display: 'inline-block',
                border: `6px solid ${PALETTE.EMERALD_SUCCESS}`,
                borderRadius: 22,
                padding: '16px 44px',
                transform: `scale(${stampScale}) rotate(-4deg)`,
                opacity: stampOpacity,
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                boxShadow: '0 0 45px rgba(16, 185, 129, 0.5)',
              }}
            >
              <h2 style={{ margin: 0, color: PALETTE.EMERALD_LIGHT, fontSize: 52, fontWeight: 900, letterSpacing: 3 }}>
                SCOPUS ACCEPTED!
              </h2>
            </div>
          </div>

          <div style={{ width: 340, height: 440 }}>
            <ResearcherRig pose="celebrating" frame={frame} showIdeaBulb showGlasses scale={0.92} />
          </div>
        </div>
      )}
    </div>
  );
};
