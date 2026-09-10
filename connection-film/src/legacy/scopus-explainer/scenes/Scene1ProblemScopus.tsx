import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene1ProblemScopus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const cardScale = interpolate(introSpring, [0, 1], [0.92, 1.0]);

  // Content-driven progressive beats for Shot 1 (0 - 618 frames):
  // Beat 1: frames 0 - 122 (Desk Reject Paradox)
  // Beat 2: frames 122 - 228 (Defensible Gap Reveal)
  // Beat 3: frames 228 - 358 (Scopus Dialogue Standard)
  // Beat 4: frames 358 - 476 (3 Core Questions Triangle)
  // Beat 5: frames 476 - 618 (Swales CARS & 4 Attributes + Transition out at 603-618)
  const currentBeat =
    frame < 122 ? 1 :
    frame < 228 ? 2 :
    frame < 358 ? 3 :
    frame < 476 ? 4 : 5;

  // Motivated beat crossfades & vertical sliding (8-frame transition windows)
  const b1Exit = interpolate(frame, [114, 122], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b1Slide = interpolate(frame, [114, 122], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b2Enter = interpolate(frame, [114, 122], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b2Exit = interpolate(frame, [220, 228], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b2Opacity = Math.min(b2Enter, b2Exit);
  const b2Slide = frame < 180
    ? interpolate(frame, [114, 122], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [220, 228], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b3Enter = interpolate(frame, [220, 228], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b3Exit = interpolate(frame, [350, 358], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b3Opacity = Math.min(b3Enter, b3Exit);
  const b3Slide = frame < 300
    ? interpolate(frame, [220, 228], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [350, 358], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b4Enter = interpolate(frame, [350, 358], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b4Exit = interpolate(frame, [468, 476], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b4Opacity = Math.min(b4Enter, b4Exit);
  const b4Slide = frame < 420
    ? interpolate(frame, [350, 358], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [468, 476], [0, -25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const b5Enter = interpolate(frame, [468, 476], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b5Slide = interpolate(frame, [468, 476], [25, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Stamp animation for Beat 1
  const stampProgress = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 8, stiffness: 190 } });
  const stampScale = interpolate(stampProgress, [0, 1], [3.2, 1.0]);
  const stampOpacity = Math.min(1, stampProgress * 1.5);
  const shakeOffset = stampProgress > 0.8 && stampProgress < 1.1 ? Math.sin((frame - 25) * 2.2) * 6 : 0;

  // Camera carry transition out (frames 603 - 618)
  const transitionCarry = interpolate(frame, [603, 618], [0, 40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const transitionScale = interpolate(frame, [603, 618], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Dynamic researcher pose determination
  const researcherPose =
    currentBeat === 1 ? 'puzzled' :
    currentBeat === 2 ? 'analyzing' :
    currentBeat === 3 ? 'presenting' :
    currentBeat === 4 ? 'analyzing' : 'discovering';

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: PALETTE.NAVY_DEEP,
        overflow: 'hidden',
        transform: `scale(${transitionScale}) translateY(${-transitionCarry}px)`,
      }}
    >
      {/* Background Decorative Academic Grid */}
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.1 }}>
        <defs>
          <pattern id="scene1GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#scene1GridPattern)" />
      </svg>

      {/* TOP HEADER: CONSTANT VISUAL ANCHOR */}
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
            PHẦN 1: ĐẶT VẤN ĐỀ & BẢN CHẤT SCOPUS
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
          XÁC ĐỊNH RESEARCH GAP
          <br />
          <span style={{ color: PALETTE.CYAN_GLOW }}>CHUẨN CÔNG BỐ QUỐC TẾ</span>
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 1 (0 - 122): DESK REJECT PARADOX */}
      {/* ========================================================================= */}
      {frame < 122 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: b1Exit,
            transform: `translateY(${shakeOffset + b1Slide}px)`,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CORAL_ALERT}`,
              padding: 36,
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 32,
            }}
          >
            <div
              data-role="secondary"
              style={{ fontSize: 30, color: PALETTE.TEXT_SECONDARY, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              BẢN THẢO QUỐC TẾ (MANUSCRIPT)
            </div>
            <h2
              style={{ marginTop: 14, fontSize: 48, fontWeight: 900, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.3 }}
            >
              "Số liệu tốt & Phương pháp mạnh"
            </h2>
            <div
              style={{
                marginTop: 24,
                padding: '18px 24px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderRadius: 16,
                borderLeft: `6px solid ${PALETTE.CORAL_ALERT}`,
              }}
            >
              <div data-role="secondary" style={{ fontSize: 30, color: PALETTE.CORAL_LIGHT, fontWeight: 'bold' }}>
                Phản hồi của Tổng biên tập:
              </div>
              <p
                style={{ marginTop: 8, fontSize: 34, color: PALETTE.TEXT_PRIMARY, fontStyle: 'italic', lineHeight: 1.4 }}
              >
                "Bài báo thiếu khoảng trống nghiên cứu rõ ràng và thuyết phục."
              </p>
            </div>

            {/* Red DESK REJECT Stamp Hit */}
            <div
              style={{
                position: 'absolute',
                top: 140,
                right: 32,
                border: `6px solid ${PALETTE.CORAL_ALERT}`,
                borderRadius: 20,
                padding: '14px 32px',
                transform: `scale(${stampScale}) rotate(-13deg)`,
                opacity: stampOpacity,
                backgroundColor: 'rgba(239, 68, 68, 0.28)',
                boxShadow: '0 0 35px rgba(239, 68, 68, 0.5)',
              }}
            >
              <h2 style={{ margin: 0, color: PALETTE.CORAL_ALERT, fontSize: 52, fontWeight: 900, letterSpacing: 3 }}>
                DESK REJECT
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 340, height: 480 }}>
              <ResearcherRig pose={researcherPose} frame={frame} showPaper showGlasses scale={0.92} />
            </div>
            <div
              style={{
                flex: 1,
                marginLeft: 28,
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 24,
                border: `2px solid ${PALETTE.AMBER_ALERT}`,
                padding: '28px 32px',
              }}
            >
              <h3 style={{ margin: '0 0 12px', color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ⚡ NGHỊCH LÝ CÔNG BỐ
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.45 }}>
                Phương pháp mạnh vẫn bị loại ngay từ vòng đầu nếu thiếu Research Gap rõ ràng!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 2 (122 - 228): THE DEFENSIBLE GAP */}
      {/* ========================================================================= */}
      {frame >= 114 && frame < 228 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: b2Opacity,
            transform: `translateY(${b2Slide}px)`,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CYAN_PRIMARY}`,
              padding: 40,
              boxSizing: 'border-box',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 36,
            }}
          >
            <div
              data-role="secondary"
              style={{ fontSize: 30, color: PALETTE.CYAN_PRIMARY, fontWeight: 'bold', letterSpacing: 1.5 }}
            >
              PHÁT HIỆN CỐT LÕI
            </div>
            <h2
              style={{ marginTop: 12, fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW, lineHeight: 1.3 }}
            >
              NGUYÊN NHÂN GỐC RỄ
            </h2>
            <p
              style={{ marginTop: 18, color: PALETTE.TEXT_PRIMARY, fontSize: 36, lineHeight: 1.5, fontWeight: 500 }}
            >
              Phần mở đầu không chứng minh được <strong>khoảng trống nghiên cứu</strong> một cách thuyết phục!
            </p>
          </div>

          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 340, height: 480 }}>
              <ResearcherRig pose={researcherPose} frame={frame} showGlasses scale={0.92} />
            </div>
            <div
              style={{
                flex: 1,
                marginLeft: 28,
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 24,
                border: `2px solid ${PALETTE.CYAN_GLOW}`,
                padding: '30px 34px',
              }}
            >
              <h3 style={{ margin: '0 0 12px', color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                🔍 RESEARCH GAP
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.45 }}>
                Khoảng trống là mắt xích còn thiếu giữa kho tàng tri thức đã có và đề tài mới.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 3 (228 - 358): SCOPUS ACADEMIC DIALOGUE */}
      {/* ========================================================================= */}
      {frame >= 220 && frame < 358 && (
        <div
          style={{
            position: 'absolute',
            top: 440,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: b3Opacity,
            transform: `translateY(${b3Slide}px)`,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CYAN_GLOW}`,
              padding: 40,
              boxSizing: 'border-box',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              marginBottom: 36,
            }}
          >
            <div
              data-role="secondary"
              style={{ fontSize: 30, color: PALETTE.CYAN_GLOW, fontWeight: 'bold', letterSpacing: 1.5 }}
            >
              BẢN CHẤT CÔNG BỐ
            </div>
            <h2
              style={{ marginTop: 12, fontSize: 48, fontWeight: 900, color: PALETTE.TEXT_PRIMARY, lineHeight: 1.3 }}
            >
              CHUẨN ĐỐI THOẠI HỌC THUẬT
            </h2>
            <p
              style={{ marginTop: 16, color: PALETTE.TEXT_PRIMARY, fontSize: 36, lineHeight: 1.5 }}
            >
              Scopus đòi hỏi: Vấn đề rõ, tổng quan chọn lọc, và lập luận có căn cứ khoa học.
            </p>
          </div>

          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 340, height: 480 }}>
              <ResearcherRig pose={researcherPose} frame={frame} showGlasses scale={0.92} />
            </div>
            <div
              style={{
                flex: 1,
                marginLeft: 28,
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 24,
                border: `2px solid ${PALETTE.EMERALD_SUCCESS}`,
                padding: '30px 34px',
              }}
            >
              <h3 style={{ margin: '0 0 12px', color: PALETTE.EMERALD_LIGHT, fontSize: 38, fontWeight: 900 }}>
                🌐 ĐỐI THOẠI TOÀN CẦU
              </h3>
              <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.45 }}>
                Không phải báo cáo độc thoại, mà là tham gia vào chuỗi thảo luận chuyên sâu quốc tế.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 4 (358 - 476): 3 CORE QUESTIONS TRIANGLE */}
      {/* ========================================================================= */}
      {frame >= 350 && frame < 476 && (
        <div
          style={{
            position: 'absolute',
            top: 430,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: b4Opacity,
            transform: `translateY(${b4Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.AMBER_ALERT}`,
              padding: '28px 36px',
              marginBottom: 28,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: PALETTE.AMBER_LIGHT, textAlign: 'center' }}>
              TAM GIÁC 3 CÂU HỎI CỐT LÕI
            </h2>
          </div>

          {/* 3 Prominent Question Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 22,
                border: `2.5px solid ${PALETTE.CYAN_PRIMARY}`,
                padding: '24px 32px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                1. ĐÃ BIẾT GÌ?
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Tổng quan chọn lọc những tri thức nền tảng đã được kiểm chứng.
              </p>
            </div>

            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 22,
                border: `2.5px solid ${PALETTE.AMBER_ALERT}`,
                padding: '24px 32px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                2. CHƯA THỎA ĐÁNG ĐIỂM NÀO?
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Chỉ ra điểm nghẽn lý thuyết, mâu thuẫn thực nghiệm hoặc giới hạn phương pháp.
              </p>
            </div>

            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 22,
                border: `2.5px solid ${PALETTE.EMERALD_SUCCESS}`,
                padding: '24px 32px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.EMERALD_LIGHT, fontSize: 38, fontWeight: 900 }}>
                3. ĐÓNG GÓP GÌ MỚI?
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Định vị giá trị gia tăng cụ thể của nghiên cứu mới vào bức tranh tri thức.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BEAT 5 (476 - 618): 4 ATTRIBUTES & SWALES CARS */}
      {/* ========================================================================= */}
      {frame >= 468 && (
        <div
          style={{
            position: 'absolute',
            top: 430,
            left: 72,
            right: 72,
            display: 'flex',
            flexDirection: 'column',
            opacity: b5Enter,
            transform: `translateY(${b5Slide}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 28,
              border: `3px solid ${PALETTE.CYAN_PRIMARY}`,
              padding: '28px 36px',
              marginBottom: 28,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 48, fontWeight: 900, color: PALETTE.CYAN_GLOW, textAlign: 'center' }}>
              4 THUỘC TÍNH & SWALES CARS
            </h2>
            <div
              data-role="citation"
              style={{ textAlign: 'center', color: PALETTE.TEXT_SECONDARY, fontSize: 30, marginTop: 6 }}
            >
              Mô hình chuẩn mực quốc tế (Swales, 1990)
            </div>
          </div>

          {/* 4 Attributes Grid - 2x2 with clear large typography */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 20,
                border: `2px solid ${PALETTE.CYAN_GLOW}`,
                padding: '22px 26px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 38, fontWeight: 900 }}>
                ① ĐỊNH VỊ
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Thuộc dòng nghiên cứu cụ thể.
              </p>
            </div>

            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 20,
                border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
                padding: '22px 26px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.CYAN_PRIMARY, fontSize: 38, fontWeight: 900 }}>
                ② CHỨNG CỨ
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Có dẫn chứng Scopus uy tín.
              </p>
            </div>

            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 20,
                border: `2px solid ${PALETTE.AMBER_ALERT}`,
                padding: '22px 26px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ③ GIẢI THÍCH
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Lý giải vì sao bị nghẽn.
              </p>
            </div>

            <div
              style={{
                backgroundColor: PALETTE.NAVY_SURFACE,
                borderRadius: 20,
                border: `2px solid ${PALETTE.EMERALD_SUCCESS}`,
                padding: '22px 26px',
              }}
            >
              <h3 style={{ margin: 0, color: PALETTE.EMERALD_LIGHT, fontSize: 38, fontWeight: 900 }}>
                ④ KHẢ THI
              </h3>
              <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.4 }}>
                Có thể kiểm định mô hình.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: 26,
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 22,
              border: `2px solid ${PALETTE.PURPLE_ACCENT}`,
              padding: '22px 30px',
            }}
          >
            <div data-role="secondary" style={{ color: PALETTE.PURPLE_ACCENT, fontSize: 30, fontWeight: 'bold' }}>
              BA BƯỚC SWALES CARS:
            </div>
            <p style={{ margin: '8px 0 0', color: PALETTE.TEXT_PRIMARY, fontSize: 34, lineHeight: 1.45 }}>
              Move 1: Xác lập lãnh thổ ➔ Move 2: Tạo khoảng trống ➔ Move 3: Chiếm lĩnh vị thế.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
