import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { FatalPitfalls } from '../components/FatalPitfalls';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene5PitfallsConclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 Phases across 450 frames (15s @ 30fps):
  // Phase 1: 4 Fatal Pitfalls (0 - 200)
  // Phase 2: Avoiding 2 Extremes (200 - 320)
  // Phase 3: Concluding Axiom & Victorious Q1 Acceptance (320 - 450)

  const phase2Spring = spring({
    frame: Math.max(0, frame - 195),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const phase3Spring = spring({
    frame: Math.max(0, frame - 315),
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // Acceptance stamp animation in Phase 3
  const acceptStampProgress = spring({
    frame: Math.max(0, frame - 340),
    fps,
    config: { damping: 9, stiffness: 160 },
  });
  const stampScale = interpolate(acceptStampProgress, [0, 1], [3.0, 1.0]);

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
        <rect width="1080" height="1920" fill="url(#scene5GridPattern)" />
      </svg>

      {/* TOP HEADER: GLOBAL TO SCENE 5 */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 96,
          right: 96,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 30,
        }}
      >
        <div
          style={{
            backgroundColor: frame < 320 ? PALETTE.CORAL_SOFT : PALETTE.EMERALD_SOFT,
            border: `2px solid ${frame < 320 ? PALETTE.CORAL_ALERT : PALETTE.EMERALD_SUCCESS}`,
            borderRadius: 30,
            padding: '8px 24px',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              color: frame < 320 ? PALETTE.CORAL_LIGHT : PALETTE.EMERALD_LIGHT,
              fontSize: 17,
              fontWeight: 'bold',
              letterSpacing: 1.5,
            }}
          >
            {frame < 320 ? 'PHẦN 5: 4 LỖI CHẾT NGƯỜI & TRÁNH 2 CỰC ĐOAN' : 'KẾT LUẬN & THÔNG ĐIỆP CHỐT'}
          </span>
        </div>
      </div>

      {/* PHASE 1: 4 FATAL PITFALLS (Frames 0 - 200) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${-phase2Spring * 1200}px)`,
          pointerEvents: 'none',
        }}
      >
        <FatalPitfalls />
      </div>

      {/* PHASE 2: AVOIDING 2 EXTREMES (Frames 200 - 320) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${interpolate(phase2Spring, [0, 1], [1200, 0]) - phase3Spring * 1200}px)`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 220, left: 96, right: 96, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: PALETTE.AMBER_LIGHT, fontSize: 32, fontWeight: 900 }}>
            TRÁNH 2 CỰC ĐOAN HỌC THUẬT KHI XÁC LẬP GAP
          </h2>
          <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 16 }}>
            Bản thảo hướng đến Scopus cần giữ vững điểm cân bằng học thuật
          </p>
        </div>

        {/* Two Extremes Comparison Panels */}
        <div
          style={{
            position: 'absolute',
            top: 340,
            left: 140,
            width: 800,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Extreme 1: Too Broad */}
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 20,
              border: `2px solid ${PALETTE.CORAL_ALERT}`,
              padding: '24px 28px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <span style={{ color: PALETTE.CORAL_ALERT, fontSize: 24, fontWeight: 900 }}>✕</span>
              <span style={{ color: PALETTE.CORAL_LIGHT, fontSize: 18, fontWeight: 900 }}>
                CỰC ĐOAN 1: TUYÊN BỐ QUÁ RỘNG (OVER-GENERALIZATION)
              </span>
            </div>
            <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 16, lineHeight: 1.45 }}>
              Khẳng định: <em>"Chưa có nhiều nghiên cứu về đề tài này..."</em> mà không đưa ra bằng chứng tổng hợp có hệ thống từ các tạp chí uy tín.
            </p>
          </div>

          {/* Extreme 2: Too Narrow / Superficial Context */}
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 20,
              border: `2px solid ${PALETTE.CORAL_ALERT}`,
              padding: '24px 28px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <span style={{ color: PALETTE.CORAL_ALERT, fontSize: 24, fontWeight: 900 }}>✕</span>
              <span style={{ color: PALETTE.CORAL_LIGHT, fontSize: 18, fontWeight: 900 }}>
                CỰC ĐOAN 2: THU HẸP HÌNH THỨC (TRIVIAL LOCALIZATION)
              </span>
            </div>
            <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 16, lineHeight: 1.45 }}>
              Đồng nhất bối cảnh mới với tính mới: <em>"Chưa có nghiên cứu nào tại tỉnh X hay quốc gia Y"</em> nhưng không chứng minh được bối cảnh đó làm thay đổi cơ chế lý thuyết hay mức độ tác động.
            </p>
          </div>

          {/* Golden Balance Solution */}
          <div
            style={{
              backgroundColor: PALETTE.EMERALD_SOFT,
              borderRadius: 20,
              border: `2.5px solid ${PALETTE.EMERALD_SUCCESS}`,
              padding: '24px 28px',
              boxShadow: '0 15px 40px rgba(16, 185, 129, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <span style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 24, fontWeight: 900 }}>✓</span>
              <span style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 19, fontWeight: 900 }}>
                ĐIỂM CÂN BẰNG HỌC THUẬT CHUẨN SCOPUS:
              </span>
            </div>
            <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 16, lineHeight: 1.5 }}>
              Đặt nghiên cứu vào dòng tri thức hiện có ➔ Làm rõ điểm tri thức chưa hoàn tất ➔ Chứng minh nghiên cứu mới có thiết kế đủ năng lực giải quyết điểm chưa hoàn tất ấy!
            </p>
          </div>
        </div>

        {/* Analyzing Researcher */}
        <div style={{ position: 'absolute', top: 1040, right: 40, width: 260, height: 400 }}>
          <ResearcherRig
            pose="analyzing"
            frame={frame}
            showGlasses
            showMagnifier
            scale={0.75}
          />
        </div>
      </div>

      {/* PHASE 3: CONCLUDING AXIOM & VICTORIOUS SCOPUS ACCEPTANCE (Frames 320 - 450) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${interpolate(phase3Spring, [0, 1], [1200, 0])}px)`,
          pointerEvents: 'none',
        }}
      >
        {/* Top Celebration Title */}
        <div style={{ position: 'absolute', top: 220, left: 96, right: 96, textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 42, fontWeight: 900 }}>
            CHÚC BÀI BÁO CỦA BẠN
            <br />
            <span style={{ color: PALETTE.EMERALD_SUCCESS }}>CÔNG BỐ THÀNH CÔNG TRÊN SCOPUS!</span>
          </h1>
        </div>

        {/* Acceptance Certificate Card */}
        <div
          style={{
            position: 'absolute',
            top: 360,
            left: 140,
            width: 800,
            height: 270,
            backgroundColor: PALETTE.NAVY_SURFACE,
            borderRadius: 24,
            border: `3px solid ${PALETTE.EMERALD_SUCCESS}`,
            padding: 30,
            boxSizing: 'border-box',
            boxShadow: '0 25px 60px rgba(16, 185, 129, 0.3)',
          }}
        >
          <div style={{ fontSize: 16, color: PALETTE.EMERALD_LIGHT, fontWeight: 'bold', letterSpacing: 1 }}>
            HỘI ĐỒNG BIÊN TẬP TẠP CHÍ SCOPUS Q1
          </div>
          <div style={{ marginTop: 12, fontSize: 21, fontWeight: 'bold', color: PALETTE.TEXT_PRIMARY, lineHeight: 1.4 }}>
            "Bản thảo thể hiện đóng góp học thuật xuất sắc, Research Gap có căn cứ vững chắc và phương pháp nhất quán."
          </div>

          {/* Glowing Green ACCEPTED Q1 Stamp */}
          <div
            style={{
              position: 'absolute',
              top: 120,
              right: 32,
              border: `4px solid ${PALETTE.EMERALD_SUCCESS}`,
              borderRadius: 16,
              padding: '10px 22px',
              transform: `scale(${stampScale}) rotate(-10deg)`,
              backgroundColor: 'rgba(16, 185, 129, 0.22)',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>
              ACCEPTED (Q1)
            </span>
          </div>

          <div style={{ position: 'absolute', bottom: 18, left: 30, color: PALETTE.TEXT_SECONDARY, fontSize: 14 }}>
            Tuân thủ: Swales (1990) • Snyder (2019) • PRISMA 2020
          </div>
        </div>

        {/* Celebrating Researcher Character Rig */}
        <div
          style={{
            position: 'absolute',
            top: 670,
            left: 360,
            width: 360,
            height: 480,
            zIndex: 10,
          }}
        >
          <ResearcherRig
            pose="celebrating"
            frame={frame}
            showGlasses
            showCertificate
            scale={0.95}
          />
        </div>

        {/* Concluding Scientific Axiom Banner */}
        <div
          style={{
            position: 'absolute',
            top: 1190,
            left: 140,
            width: 800,
            backgroundColor: PALETTE.NAVY_SURFACE,
            borderRadius: 20,
            border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
            padding: '16px 24px',
            boxSizing: 'border-box',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(6, 182, 212, 0.2)',
          }}
        >
          <div style={{ color: PALETTE.CYAN_GLOW, fontSize: 18, fontWeight: 900, letterSpacing: 0.5 }}>
            NGUYÊN LÝ CỐT LÕI (SCIENTIFIC AXIOM)
          </div>
          <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 16, fontWeight: 'bold', marginTop: 6, lineHeight: 1.4 }}>
            "Research Gap là nền tảng của tính mới, mục tiêu nghiên cứu, mô hình lý thuyết và phương pháp phân tích."
          </div>
        </div>
      </div>
    </div>
  );
};
