import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { NarrowingFunnel } from '../components/NarrowingFunnel';
import { KnowledgeNetwork } from '../components/KnowledgeNetwork';
import { ThreeTierAssembly } from '../components/ThreeTierAssembly';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene3ProcessFunnel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 4 Steps timing across 540 frames (18s @ 30fps):
  // Step 1: Funnel (0 - 135)
  // Step 2: Knowledge Network (135 - 270)
  // Step 3: 3-Condition Filter (270 - 400)
  // Step 4: 3-Tier Gap Assembly (400 - 540)
  const step2Spring = spring({
    frame: Math.max(0, frame - 130),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const step3Spring = spring({
    frame: Math.max(0, frame - 265),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const step4Spring = spring({
    frame: Math.max(0, frame - 395),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Researcher Rig dynamic pose
  const researcherPose = frame < 135
    ? 'analyzing'
    : frame < 270
    ? 'presenting'
    : frame < 400
    ? 'analyzing'
    : 'discovering';

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
          <pattern id="scene3GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene3GridPattern)" />
      </svg>

      {/* TOP HEADER: GLOBAL TO SCENE 3 */}
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
            backgroundColor: PALETTE.CYAN_SOFT,
            border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
            borderRadius: 30,
            padding: '8px 24px',
            marginBottom: 10,
          }}
        >
          <span style={{ color: PALETTE.CYAN_GLOW, fontSize: 17, fontWeight: 'bold', letterSpacing: 1.5 }}>
            PHẦN 3: QUY TRÌNH 4 BƯỚC XÁC ĐỊNH RESEARCH GAP
          </span>
        </div>
      </div>

      {/* STEP 1: NARROWING FUNNEL (Frames 0 - 135) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${-step2Spring * 1200}px)`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 220, left: 96, right: 96, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 900 }}>
            BƯỚC 1: THU HẸP TỪ CHỦ ĐỀ SANG DÒNG NGHIÊN CỨU
          </h2>
          <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 16 }}>
            Chủ đề rộng (Chuyển đổi số) ➔ Dòng cụ thể (Ý định dùng Ngân hàng số kết hợp E-SQ &amp; Rủi ro)
          </p>
        </div>

        <NarrowingFunnel
          activeStage={frame < 50 ? 1 : frame < 95 ? 2 : 3}
          highlightGap={frame >= 95}
        />
      </div>

      {/* STEP 2: KNOWLEDGE NETWORK & MATRIX (Frames 135 - 270) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${interpolate(step2Spring, [0, 1], [1200, 0]) - step3Spring * 1200}px)`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 220, left: 96, right: 96, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 900 }}>
            BƯỚC 2: LẬP BẢN ĐỒ TRI THỨC (KNOWLEDGE MATRIX)
          </h2>
          <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 16 }}>
            Nhóm theo Khái niệm, Bối cảnh, Phương pháp &amp; Tìm điểm mâu thuẫn lặp lại
          </p>
        </div>

        <KnowledgeNetwork highlightGap={true} />
      </div>

      {/* STEP 3: 3-CONDITION FILTER PASS (Frames 270 - 400) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${interpolate(step3Spring, [0, 1], [1200, 0]) - step4Spring * 1200}px)`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 220, left: 96, right: 96, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 900 }}>
            BƯỚC 3: BỘ LỌC 3 ĐIỀU KIỆN CHUYỂN HẠN CHẾ THÀNH GAP
          </h2>
          <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 16 }}>
            Không phải mọi hạn chế đều thành gap — Phải thỏa mãn đồng thời 3 điều kiện
          </p>
        </div>

        {/* 3 Conditions Cards Container */}
        <div
          style={{
            position: 'absolute',
            top: 360,
            left: 140,
            width: 800,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Condition 1 */}
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 20,
              border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ maxWidth: 580 }}>
              <div style={{ color: PALETTE.CYAN_GLOW, fontSize: 16, fontWeight: 'bold' }}>
                ĐIỀU KIỆN 1: LIÊN HỆ CỐT LÕI (CORE THEORETICAL LINK)
              </div>
              <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 18, fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>
                Có liên hệ trực tiếp với câu hỏi học thuật hoặc cơ chế lý thuyết quan trọng.
              </div>
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: PALETTE.EMERALD_SUCCESS,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: PALETTE.NAVY_DARK,
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              ✓
            </div>
          </div>

          {/* Condition 2 */}
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 20,
              border: `2px solid ${PALETTE.AMBER_ALERT}`,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ maxWidth: 580 }}>
              <div style={{ color: PALETTE.AMBER_LIGHT, fontSize: 16, fontWeight: 'bold' }}>
                ĐIỀU KIỆN 2: LẶP LẠI Ở NHIỀU BÀI BÁO (REPRODUCIBILITY)
              </div>
              <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 18, fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>
                Hạn chế lặp lại ở nhiều công trình uy tín, không chỉ là giới hạn ngẫu nhiên của 1 bài đơn lẻ.
              </div>
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: PALETTE.EMERALD_SUCCESS,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: PALETTE.NAVY_DARK,
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              ✓
            </div>
          </div>

          {/* Condition 3 */}
          <div
            style={{
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 20,
              border: `2px solid ${PALETTE.EMERALD_SUCCESS}`,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ maxWidth: 580 }}>
              <div style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 16, fontWeight: 'bold' }}>
                ĐIỀU KIỆN 3: KHẢ THI KIỂM ĐỊNH (TESTABILITY / ACTIONABILITY)
              </div>
              <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 18, fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>
                Có thể thu thập dữ liệu và sử dụng phương pháp phù hợp để giải quyết dứt điểm gap.
              </div>
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: PALETTE.EMERALD_SUCCESS,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: PALETTE.NAVY_DARK,
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              ✓
            </div>
          </div>

          {/* Filter Verdict Banner */}
          <div
            style={{
              marginTop: 10,
              backgroundColor: PALETTE.EMERALD_SOFT,
              border: `2px solid ${PALETTE.EMERALD_SUCCESS}`,
              borderRadius: 18,
              padding: '16px 24px',
              textAlign: 'center',
            }}
          >
            <span style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 18, fontWeight: 'bold' }}>
              ✦ KẾT QUẢ BỘ LỌC: ĐỦ ĐIỀU KIỆN HỌC THUẬT ĐỂ PHÁT TRIỂN GAP STATEMENT
            </span>
          </div>
        </div>
      </div>

      {/* STEP 4: THREE-TIER GAP ASSEMBLY (Frames 400 - 540) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${interpolate(step4Spring, [0, 1], [1200, 0])}px)`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: 220, left: 96, right: 96, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: PALETTE.CYAN_GLOW, fontSize: 32, fontWeight: 900 }}>
            BƯỚC 4: VIẾT GAP STATEMENT THEO CẤU TRÚC 3 TẦNG
          </h2>
          <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 16 }}>
            Kế thừa có chọn lọc: Tầng Nền tảng ➔ Tầng Vấn đề ➔ Tầng Khối nghiên cứu mới
          </p>
        </div>

        <ThreeTierAssembly />
      </div>

      {/* Dynamically positioned Researcher Rig */}
      <div
        style={{
          position: 'absolute',
          top: 1020,
          left: 40,
          width: 270,
          height: 420,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <ResearcherRig
          pose={researcherPose}
          frame={frame}
          showGlasses
          showMagnifier={researcherPose === 'analyzing'}
          showIdeaBulb={researcherPose === 'discovering'}
          scale={0.76}
        />
      </div>
    </div>
  );
};

export const Scene3FourStepProcess = Scene3ProcessFunnel;
