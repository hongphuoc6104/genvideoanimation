import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene2GapTaxonomy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const cardScale = interpolate(introSpring, [0, 1], [0.92, 1.0]);

  // Content-driven progressive beats for Shot 2 (691 frames total):
  // Beat 6: frames 0 - 138 (Door 1: Theoretical Gap)
  // Beat 7: frames 138 - 261 (Door 2: Empirical Gap)
  // Beat 8: frames 261 - 415 (Door 3: Contextual Gap)
  // Beat 9: frames 415 - 555 (Door 4: Methodological Gap)
  // Beat 10: frames 555 - 691 (Door 5: Practical Gap + Wipe transition out at 676-691)
  const activeDoor =
    frame < 138 ? 1 :
    frame < 261 ? 2 :
    frame < 415 ? 3 :
    frame < 555 ? 4 : 5;

  // Motivated door crossfades & horizontal slide (8-frame transition window)
  const d1Exit = interpolate(frame, [130, 138], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d1Slide = interpolate(frame, [130, 138], [0, -30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const d2Enter = interpolate(frame, [130, 138], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d2Exit = interpolate(frame, [253, 261], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d2Opacity = Math.min(d2Enter, d2Exit);
  const d2Slide = frame < 200
    ? interpolate(frame, [130, 138], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [253, 261], [0, -30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const d3Enter = interpolate(frame, [253, 261], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d3Exit = interpolate(frame, [407, 415], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d3Opacity = Math.min(d3Enter, d3Exit);
  const d3Slide = frame < 330
    ? interpolate(frame, [253, 261], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [407, 415], [0, -30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const d4Enter = interpolate(frame, [407, 415], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d4Exit = interpolate(frame, [547, 555], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d4Opacity = Math.min(d4Enter, d4Exit);
  const d4Slide = frame < 480
    ? interpolate(frame, [407, 415], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [547, 555], [0, -30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const d5Enter = interpolate(frame, [547, 555], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d5Slide = interpolate(frame, [547, 555], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Foreground wipe transition out (frames 676 - 691 -> global 1294 - 1324)
  const wipeProgress = interpolate(frame, [676, 691], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wipeOffset = interpolate(wipeProgress, [0, 1], [0, -1080]);

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: PALETTE.NAVY_DEEP,
        overflow: 'hidden',
        transform: `translateX(${wipeOffset}px)`,
      }}
    >
      {/* Background Decorative Academic Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="scene2GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#scene2GridPattern)" />
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
            PHẦN 2: PHÂN LOẠI 5 LOẠI RESEARCH GAP
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
          5 CÁNH CỬA RESEARCH GAP
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* DOOR 1: THEORETICAL GAP (Frames 0 - 138) */}
      {/* ========================================================================= */}
      {frame < 138 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: d1Exit,
            transform: `translateX(${d1Slide}px)`,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                data-role="secondary"
                style={{ color: PALETTE.CYAN_PRIMARY, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
              >
                CÁNH CỬA THỨ NHẤT
              </span>
              <span data-role="secondary" style={{ color: PALETTE.TEXT_MUTED, fontSize: 30, fontStyle: 'italic' }}>
                Theoretical Gap
              </span>
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW }}>
              1. GAP LÝ THUYẾT
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Lý thuyết hiện hành chưa giải thích đủ <strong>cơ chế trung gian (Mediator)</strong> hay <strong>điều tiết (Moderator)</strong>.
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
                💡 DẤU HIỆU NHẬN BIẾT
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Mô hình có sẵn quan hệ trực tiếp X ➔ Y, nhưng "hộp đen" cơ chế tâm lý hoặc điều kiện biên chưa được làm sáng tỏ.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOOR 2: EMPIRICAL GAP (Frames 138 - 261) */}
      {/* ========================================================================= */}
      {frame >= 130 && frame < 261 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: d2Opacity,
            transform: `translateX(${d2Slide}px)`,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                data-role="secondary"
                style={{ color: PALETTE.AMBER_LIGHT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
              >
                CÁNH CỬA THỨ HAI
              </span>
              <span data-role="secondary" style={{ color: PALETTE.TEXT_MUTED, fontSize: 30, fontStyle: 'italic' }}>
                Empirical Gap
              </span>
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.AMBER_LIGHT }}>
              2. GAP THỰC NGHIỆM
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Các nghiên cứu thực nghiệm trước cho <strong>kết quả mâu thuẫn</strong>, phân tán và chưa nhất quán.
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
                border: `2px solid ${PALETTE.CORAL_ALERT}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.CORAL_ALERT, fontSize: 38, fontWeight: 900 }}>
                ⚖️ BẰNG CHỨNG XUNG ĐỘT
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Bài báo A cho kết quả dương (+), bài báo B kết quả âm (-). Cần kiểm định lại với mẫu lớn hơn hoặc biến phân loại.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOOR 3: CONTEXTUAL GAP (Frames 261 - 415) */}
      {/* ========================================================================= */}
      {frame >= 253 && frame < 415 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: d3Opacity,
            transform: `translateX(${d3Slide}px)`,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                data-role="secondary"
                style={{ color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
              >
                CÁNH CỬA THỨ BA
              </span>
              <span data-role="secondary" style={{ color: PALETTE.TEXT_MUTED, fontSize: 30, fontStyle: 'italic' }}>
                Contextual Gap
              </span>
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW }}>
              3. GAP BỐI CẢNH
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Đặc thù <strong>văn hóa, thể chế</strong> làm thay đổi cơ chế tác động, không chỉ đơn thuần là đổi tên địa bàn.
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
                ⚠️ LƯU Ý SỐNG CÒN
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Phải lý giải tại sao thể chế mới làm thay đổi bản chất quan hệ, tránh rơi vào bẫy "đổi địa bàn đơn thuần".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOOR 4: METHODOLOGICAL GAP (Frames 415 - 555) */}
      {/* ========================================================================= */}
      {frame >= 407 && frame < 555 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: d4Opacity,
            transform: `translateX(${d4Slide}px)`,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                data-role="secondary"
                style={{ color: PALETTE.CORAL_LIGHT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
              >
                CÁNH CỬA THỨ TƯ
              </span>
              <span data-role="secondary" style={{ color: PALETTE.TEXT_MUTED, fontSize: 30, fontStyle: 'italic' }}>
                Methodological Gap
              </span>
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.CORAL_LIGHT }}>
              4. GAP PHƯƠNG PHÁP
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Hạn chế về <strong>đo lường</strong>, thiết kế mẫu, thiếu <strong>dữ liệu dọc</strong> hoặc sai lệch CMV.
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
                border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 10px', color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                📊 NÂNG CẤP PHƯƠNG PHÁP
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Khắc phục thiết kế cắt ngang đơn thời điểm bằng dữ liệu đa thời đoạn, kiểm soát sai lệch phương sai chung.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOOR 5: PRACTICAL GAP (Frames 555 - 691) */}
      {/* ========================================================================= */}
      {frame >= 547 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: d5Enter,
            transform: `translateX(${d5Slide}px)`,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                data-role="secondary"
                style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 32, fontWeight: 900, letterSpacing: 1.5 }}
              >
                CÁNH CỬA THỨ NĂM
              </span>
              <span data-role="secondary" style={{ color: PALETTE.TEXT_MUTED, fontSize: 30, fontStyle: 'italic' }}>
                Practical Gap
              </span>
            </div>
            <h2 style={{ margin: '14px 0 0', fontSize: 48, fontWeight: 900, color: PALETTE.EMERALD_LIGHT }}>
              5. GAP ỨNG DỤNG
            </h2>
            <p style={{ margin: '16px 0 0', fontSize: 34, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.45 }}>
              Hàm ý <strong>chính sách và quản trị</strong> thực tiễn gắn liền với đóng góp tri thức học thuật sâu sắc.
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
                🎯 GIẢI PHÁP THỰC TIỄN
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Cung cấp chỉ dẫn hành động rõ ràng cho nhà hoạch định và lãnh đạo doanh nghiệp.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Scene2Taxonomy5Gaps = Scene2GapTaxonomy;
