import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene3ProcessFunnel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const cardScale = interpolate(introSpring, [0, 1], [0.92, 1.0]);

  // Content-driven progressive beats for Shot 3 (667 frames total):
  // Beat 11: frames 0 - 125 (Bước 1: Phễu thu hẹp)
  // Beat 12: frames 125 - 257 (Bước 2: Ma trận tri thức 4 trục)
  // Beat 13: frames 257 - 396 (Bước 3: Bộ lọc 3 điều kiện)
  // Beat 14: frames 396 - 523 (Bước 4: Gap Statement 3 tầng)
  // Beat 15: frames 523 - 667 (Công thức biến số + Semantic Zoom transition out at 652-667)
  const activeStep =
    frame < 125 ? 1 :
    frame < 257 ? 2 :
    frame < 396 ? 3 :
    frame < 523 ? 4 : 5;

  // Motivated funnel step crossfades & vertical slide (8-frame transition window)
  const s1Exit = interpolate(frame, [117, 125], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s1Slide = interpolate(frame, [117, 125], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const s2Enter = interpolate(frame, [117, 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s2Exit = interpolate(frame, [249, 257], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s2Opacity = Math.min(s2Enter, s2Exit);
  const s2Slide = frame < 190
    ? interpolate(frame, [117, 125], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [249, 257], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const s3Enter = interpolate(frame, [249, 257], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s3Exit = interpolate(frame, [388, 396], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s3Opacity = Math.min(s3Enter, s3Exit);
  const s3Slide = frame < 330
    ? interpolate(frame, [249, 257], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [388, 396], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const s4Enter = interpolate(frame, [388, 396], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s4Exit = interpolate(frame, [515, 523], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s4Opacity = Math.min(s4Enter, s4Exit);
  const s4Slide = frame < 450
    ? interpolate(frame, [388, 396], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [515, 523], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const s5Enter = interpolate(frame, [515, 523], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s5Slide = interpolate(frame, [515, 523], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Semantic zoom transition out (frames 652 - 667 -> global 1961 - 1991)
  const zoomProgress = interpolate(frame, [652, 667], [1, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoomFade = interpolate(frame, [652, 667], [1, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: PALETTE.NAVY_DEEP,
        overflow: 'hidden',
        transform: `scale(${zoomProgress})`,
        opacity: zoomFade,
      }}
    >
      {/* Background Decorative Academic Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="scene3GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#scene3GridPattern)" />
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
            PHẦN 3: QUY TRÌNH 4 BƯỚC XÁC ĐỊNH RESEARCH GAP
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
          LỘ TRÌNH 4 BƯỚC THỰC CHIẾN
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: PHỄU THU HẸP (Frames 0 - 125) */}
      {/* ========================================================================= */}
      {frame < 125 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: s1Exit,
            transform: `translateY(${s1Slide}px)`,
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
              BƯỚC 1 TRONG QUY TRÌNH
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW }}>
              PHỄU THU HẸP DÒNG NGHIÊN CỨU
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Dùng phễu lọc thu hẹp từ <strong>chủ đề rộng</strong> sang <strong>dòng nghiên cứu chuyên sâu</strong> có trọng tâm rõ ràng.
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
                border: `2px solid ${PALETTE.CYAN_GLOW}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                🔻 3 CẤP ĐỘ PHỄU
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                1. Topic rộng ➔ 2. Lĩnh vực cụ thể ➔ 3. Niche nghiên cứu chuyên sâu có thể công bố.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: MA TRẬN TRI THỨC 4 TRỤC (Frames 125 - 257) */}
      {/* ========================================================================= */}
      {frame >= 117 && frame < 257 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: s2Opacity,
            transform: `translateY(${s2Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.AMBER_ALERT}`,
              padding: '36px 40px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.AMBER_LIGHT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
            >
              BƯỚC 2 TRONG QUY TRÌNH
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.AMBER_LIGHT }}>
              BẢN ĐỒ MA TRẬN TRI THỨC 4 TRỤC
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Lập ma trận tri thức để nhận diện <strong>điểm mâu thuẫn</strong> và hạn chế lặp lại có hệ thống.
            </p>
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
                border: `2px solid ${PALETTE.AMBER_ALERT}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                🧭 4 TRỤC PHÂN TÍCH
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Tổng hợp theo: Tác giả • Lý thuyết nền • Phương pháp đo lường • Kết quả chính.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: BỘ LỌC 3 ĐIỀU KIỆN (Frames 257 - 396) */}
      {/* ========================================================================= */}
      {frame >= 249 && frame < 396 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: s3Opacity,
            transform: `translateY(${s3Slide}px)`,
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
              BƯỚC 3 TRONG QUY TRÌNH
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.EMERALD_LIGHT }}>
              BỘ LỌC 3 ĐIỀU KIỆN NGHIÊM NGẶT
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Lọc hạn chế qua 3 điều kiện: <strong>Liên hệ học thuật</strong> • <strong>Lặp lại nhiều lần</strong> • <strong>Khả thi kiểm định</strong>.
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
                border: `2px solid ${PALETTE.EMERALD_SUCCESS}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.EMERALD_LIGHT, fontSize: 38, fontWeight: 900 }}>
                🛡️ BẢO VỆ ĐỀ TÀI
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Không chọn hạn chế vu vơ. Phải chọn hạn chế được các bài báo uy tín nhắc lại nhiều lần.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: GAP STATEMENT 3 TẦNG (Frames 396 - 523) */}
      {/* ========================================================================= */}
      {frame >= 388 && frame < 523 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: s4Opacity,
            transform: `translateY(${s4Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CYAN_GLOW}`,
              padding: '36px 40px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
            >
              BƯỚC 4 TRONG QUY TRÌNH
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW }}>
              GAP STATEMENT 3 TẦNG
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Kiến tạo phát biểu Gap: <strong>Tầng Nền móng</strong> ➔ <strong>Tầng Vấn đề</strong> ➔ <strong>Tầng Định vị giải pháp</strong>.
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
                border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.CYAN_PRIMARY, fontSize: 38, fontWeight: 900 }}>
                🏗️ CẤU TRÚC 3 TẦNG
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Tầng 1: Đã biết gì • Tầng 2: Điểm chưa rõ • Tầng 3: Giải pháp bổ sung của nghiên cứu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5 / BEAT 15: CÔNG THỨC BIẾN SỐ (Frames 523 - 667) */}
      {/* ========================================================================= */}
      {frame >= 515 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: s5Enter,
            transform: `translateY(${s5Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.PURPLE_ACCENT}`,
              padding: '36px 40px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 30,
            }}
          >
            <div
              data-role="secondary"
              style={{ color: PALETTE.PURPLE_ACCENT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
            >
              CÔNG THỨC BIẾN SỐ CHUẨN HÓA
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.PURPLE_ACCENT }}>
              KẾ THỪA CÓ CHỌN LỌC
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Áp dụng công thức biến số <strong>A B C D E M F</strong> để thể hiện tính kế thừa học thuật chặt chẽ.
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
                border: `2px solid ${PALETTE.PURPLE_ACCENT}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.PURPLE_ACCENT, fontSize: 38, fontWeight: 900 }}>
                ⚡ KẾT NỐI MÔ HÌNH
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Giữ lại các biến cốt lõi đã được kiểm chứng, thêm biến trung gian hoặc điều tiết mới có cơ sở lý thuyết.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Scene3FourStepProcess = Scene3ProcessFunnel;
