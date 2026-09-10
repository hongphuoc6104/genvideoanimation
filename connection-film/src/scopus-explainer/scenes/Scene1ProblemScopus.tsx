import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE } from '../palette';
import { ResearcherRig } from '../components/ResearcherRig';

export const Scene1ProblemScopus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance springs
  const introSpring = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const cardScale = interpolate(introSpring, [0, 1], [0.92, 1.0]);

  // Phase progression:
  // Phase A (0 - 150): Desk Reject Paradox & Stamp Impact
  // Phase B (150 - 300): Nature of Scopus & 3 Core Questions Triangle
  // Phase C (300 - 450): Swales CARS (1990) Move 1-2-3 & 4 Mandatory Attributes
  const phaseBProgress = spring({
    frame: Math.max(0, frame - 145),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const phaseCProgress = spring({
    frame: Math.max(0, frame - 295),
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Desk Rejection stamp physics with squash and impact shake
  const stampProgress = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 8, stiffness: 190 },
  });
  const stampScale = interpolate(stampProgress, [0, 1], [3.2, 1.0]);
  const stampOpacity = Math.min(1, stampProgress * 1.5);
  const shakeOffset = stampProgress > 0.8 && stampProgress < 1.1
    ? Math.sin((frame - 35) * 2.2) * 6
    : 0;

  // Triangle pulse animation for Phase B
  const trianglePulse = Math.sin(frame * 0.1) * 0.05 + 1.0;

  // Dynamic researcher pose determination
  const researcherPose = frame < 150
    ? 'puzzled'
    : frame < 300
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
      <svg width={1080} height={1920} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.1 }}>
        <defs>
          <pattern id="scene1GridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={PALETTE.CYAN_PRIMARY} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene1GridPattern)" />
      </svg>

      {/* TOP HEADER: CONSTANT VISUAL ANCHOR */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 96,
          right: 96,
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
            padding: '8px 24px',
            marginBottom: 14,
          }}
        >
          <span style={{ color: PALETTE.CYAN_GLOW, fontSize: 17, fontWeight: 'bold', letterSpacing: 1.5 }}>
            PHẦN 1: ĐẶT VẤN ĐỀ & BẢN CHẤT SCOPUS
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            color: PALETTE.TEXT_PRIMARY,
            fontSize: 40,
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

      {/* PHASE A (Frames 0 - 150): PROBLEM & REJECTION PARADOX */}
      <div
        style={{
          position: 'absolute',
          top: 350,
          left: 96,
          right: 96,
          height: 1080,
          transform: `translateY(${-phaseBProgress * 1100}px)`,
          pointerEvents: 'none',
        }}
      >
        {/* Upper Split: Researcher & Rejected Manuscript Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 480,
            transform: `translateY(${shakeOffset}px)`,
          }}
        >
          {/* Researcher Rig (Puzzled with paper) */}
          <div style={{ width: 330, height: 470 }}>
            <ResearcherRig
              pose={researcherPose}
              frame={frame}
              showPaper
              showGlasses
              scale={0.88}
              x={0}
              y={10}
            />
          </div>

          {/* Manuscript Card with Desk Reject Stamp */}
          <div
            style={{
              width: 490,
              height: 430,
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 24,
              border: `2px solid ${PALETTE.CORAL_ALERT}`,
              padding: 28,
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ fontSize: 14, color: PALETTE.TEXT_SECONDARY, letterSpacing: 1, textTransform: 'uppercase' }}>
              BẢN THẢO QUỐC TẾ (MANUSCRIPT)
            </div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 'bold', color: PALETTE.TEXT_PRIMARY, lineHeight: 1.35 }}>
              "Mô hình dữ liệu lớn & Định lượng phức tạp"
            </div>
            <div
              style={{
                marginTop: 18,
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 12,
                borderLeft: `4px solid ${PALETTE.CORAL_ALERT}`,
              }}
            >
              <div style={{ fontSize: 14, color: PALETTE.CORAL_LIGHT, fontWeight: 'bold' }}>
                Reviewer 1 Feedback:
              </div>
              <div style={{ marginTop: 4, fontSize: 15, color: PALETTE.TEXT_PRIMARY, fontStyle: 'italic', lineHeight: 1.35 }}>
                "Khoảng trống nghiên cứu mơ hồ, thiếu đóng góp lý thuyết mới thuyết phục."
              </div>
            </div>

            {/* Red DESK REJECT Stamp Hit */}
            <div
              style={{
                position: 'absolute',
                top: 210,
                right: 24,
                border: `5px solid ${PALETTE.CORAL_ALERT}`,
                borderRadius: 16,
                padding: '10px 22px',
                transform: `scale(${stampScale}) rotate(-13deg)`,
                opacity: stampOpacity,
                backgroundColor: 'rgba(239, 68, 68, 0.22)',
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
              }}
            >
              <span style={{ color: PALETTE.CORAL_ALERT, fontSize: 32, fontWeight: 900, letterSpacing: 2 }}>
                DESK REJECT
              </span>
            </div>
          </div>
        </div>

        {/* Lower Paradox Alert Card */}
        <div
          style={{
            marginTop: 40,
            backgroundColor: PALETTE.NAVY_SURFACE,
            borderRadius: 24,
            border: `2px solid ${PALETTE.AMBER_ALERT}`,
            padding: '24px 30px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <span style={{ color: PALETTE.AMBER_LIGHT, fontSize: 20, fontWeight: 900 }}>
              NGHỊCH LÝ CÔNG BỐ QUỐC TẾ:
            </span>
          </div>
          <p style={{ margin: 0, color: PALETTE.TEXT_PRIMARY, fontSize: 18, lineHeight: 1.5 }}>
            Phương pháp mạnh và dữ liệu tốt vẫn <strong>bị từ chối ngay từ vòng đầu</strong> nếu phần mở đầu không chứng minh được khoảng trống học thuật thuyết phục!
          </p>
          <div style={{ marginTop: 14, color: PALETTE.TEXT_SECONDARY, fontSize: 15 }}>
            Theo thống kê: Hơn 70% bản thảo bị Desk Reject do lỗi xác lập Research Gap yếu.
          </div>
        </div>
      </div>

      {/* PHASE B (Frames 150 - 300): NATURE OF SCOPUS & 3 CORE QUESTIONS TRIANGLE */}
      <div
        style={{
          position: 'absolute',
          top: 350,
          left: 96,
          right: 96,
          height: 1080,
          transform: `translateY(${interpolate(phaseBProgress, [0, 1], [1100, 0]) - phaseCProgress * 1100}px)`,
          pointerEvents: 'none',
        }}
      >
        {/* Researcher on Left + Discourse Philosophy */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 260, height: 380 }}>
            <ResearcherRig
              pose="analyzing"
              frame={frame}
              showGlasses
              showMagnifier
              scale={0.78}
              x={0}
              y={0}
            />
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: PALETTE.NAVY_SURFACE,
              borderRadius: 20,
              border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
              padding: '20px 24px',
            }}
          >
            <div style={{ color: PALETTE.CYAN_GLOW, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              BẢN CHẤT CHUẨN SCOPUS
            </div>
            <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 16, lineHeight: 1.45 }}>
              Không phải nhãn hình thức hay câu chữ trang trí. Đó là năng lực tham gia vào <strong>đối thoại tri thức (academic discourse)</strong>: vấn đề rõ, tổng quan có chọn lọc, lập luận có căn cứ.
            </div>
          </div>
        </div>

        {/* 3 Core Questions Golden Triangle */}
        <div
          style={{
            backgroundColor: PALETTE.NAVY_SURFACE,
            borderRadius: 24,
            border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
            padding: '26px 30px',
            transform: `scale(${trianglePulse})`,
            boxShadow: '0 20px 45px rgba(6, 182, 212, 0.15)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ color: PALETTE.CYAN_GLOW, fontSize: 22, fontWeight: 900 }}>
              TAM GIÁC 3 CÂU HỎI CỐT LÕI CỦA RESEARCH GAP
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Vertex 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: PALETTE.CYAN_PRIMARY,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: PALETTE.NAVY_DARK,
                  fontWeight: 900,
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <div style={{ color: PALETTE.CYAN_GLOW, fontSize: 15, fontWeight: 'bold' }}>
                  TRI THỨC ĐÃ CÓ (ESTABLISHED KNOWLEDGE)
                </div>
                <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 17, fontWeight: 600 }}>
                  Tri thức hiện có <strong>đã biết / giải thích được điều gì</strong>?
                </div>
              </div>
            </div>

            {/* Vertex 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: PALETTE.AMBER_ALERT,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: PALETTE.NAVY_DARK,
                  fontWeight: 900,
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <div style={{ color: PALETTE.AMBER_LIGHT, fontSize: 15, fontWeight: 'bold' }}>
                  ĐIỂM NGHẼN HỌC THUẬT (THE RESEARCH GAP)
                </div>
                <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 17, fontWeight: 600 }}>
                  Điểm nào vẫn <strong>chưa được giải thích thỏa đáng</strong>?
                </div>
              </div>
            </div>

            {/* Vertex 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: PALETTE.EMERALD_SUCCESS,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: PALETTE.NAVY_DARK,
                  fontWeight: 900,
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <div style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 15, fontWeight: 'bold' }}>
                  ĐÓNG GÓP MỚI (NOVEL CONTRIBUTION)
                </div>
                <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 17, fontWeight: 600 }}>
                  Nghiên cứu hiện tại <strong>bổ sung gì cho cuộc thảo luận</strong>?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE C (Frames 300 - 450): SWALES CARS (1990) & 4 MANDATORY PROPERTIES */}
      <div
        style={{
          position: 'absolute',
          top: 350,
          left: 96,
          right: 96,
          height: 1080,
          transform: `translateY(${interpolate(phaseCProgress, [0, 1], [1100, 0])}px)`,
          pointerEvents: 'none',
        }}
      >
        {/* Swales CARS (1990) Architectural Block */}
        <div
          style={{
            backgroundColor: PALETTE.NAVY_SURFACE,
            borderRadius: 22,
            border: `2px solid ${PALETTE.CYAN_PRIMARY}`,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ color: PALETTE.CYAN_GLOW, fontSize: 20, fontWeight: 900 }}>
              MÔ HÌNH SWALES CARS (1990): 3 BƯỚC LẬP LUẬN
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {/* Move 1 */}
            <div style={{ backgroundColor: PALETTE.NAVY_DEEP, borderRadius: 14, border: `1px solid ${PALETTE.CYAN_PRIMARY}`, padding: 12 }}>
              <div style={{ color: PALETTE.CYAN_PRIMARY, fontSize: 14, fontWeight: 'bold' }}>MOVE 1</div>
              <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>Tạo lập địa hạt</div>
              <div style={{ color: PALETTE.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>Khẳng định tầm quan trọng chủ đề</div>
            </div>

            {/* Move 2 */}
            <div style={{ backgroundColor: PALETTE.NAVY_DEEP, borderRadius: 14, border: `1px solid ${PALETTE.AMBER_ALERT}`, padding: 12 }}>
              <div style={{ color: PALETTE.AMBER_LIGHT, fontSize: 14, fontWeight: 'bold' }}>MOVE 2</div>
              <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>Xác lập gap</div>
              <div style={{ color: PALETTE.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>Chỉ ra điểm thiếu hụt tri thức</div>
            </div>

            {/* Move 3 */}
            <div style={{ backgroundColor: PALETTE.NAVY_DEEP, borderRadius: 14, border: `1px solid ${PALETTE.EMERALD_SUCCESS}`, padding: 12 }}>
              <div style={{ color: PALETTE.EMERALD_LIGHT, fontSize: 14, fontWeight: 'bold' }}>MOVE 3</div>
              <div style={{ color: PALETTE.TEXT_PRIMARY, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>Chiếm lĩnh gap</div>
              <div style={{ color: PALETTE.TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>Tuyên bố mục tiêu & đóng góp mới</div>
            </div>
          </div>
        </div>

        {/* 4 Mandatory Attributes Badges Grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ color: PALETTE.AMBER_LIGHT, fontSize: 18, fontWeight: 'bold' }}>
              4 THUỘC TÍNH BẮT BUỘC CỦA GAP CHUẨN SCOPUS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Attribute 1 */}
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 16, border: `1.5px solid ${PALETTE.CYAN_PRIMARY}`, padding: '14px 18px' }}>
              <span style={{ color: PALETTE.CYAN_GLOW, fontWeight: 900, fontSize: 16 }}>① TÍNH ĐỊNH VỊ</span>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 14, lineHeight: 1.35 }}>
                Cắm mốc trong một <strong>dòng nghiên cứu cụ thể</strong>, không nói chung chung.
              </p>
            </div>

            {/* Attribute 2 */}
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 16, border: `1.5px solid ${PALETTE.CYAN_PRIMARY}`, padding: '14px 18px' }}>
              <span style={{ color: PALETTE.CYAN_PRIMARY, fontWeight: 900, fontSize: 16 }}>② TÍNH CHỨNG CỨ</span>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 14, lineHeight: 1.35 }}>
                Hỗ trợ bằng tổng quan tài liệu có hệ thống từ <strong>nguồn uy tín Scopus</strong>.
              </p>
            </div>

            {/* Attribute 3 */}
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 16, border: `1.5px solid ${PALETTE.AMBER_ALERT}`, padding: '14px 18px' }}>
              <span style={{ color: PALETTE.AMBER_LIGHT, fontWeight: 900, fontSize: 16 }}>③ TÍNH GIẢI THÍCH</span>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 14, lineHeight: 1.35 }}>
                Chỉ rõ vì sao khoảng trống đó <strong>làm nghẽn bức tranh lý thuyết</strong>.
              </p>
            </div>

            {/* Attribute 4 */}
            <div style={{ backgroundColor: PALETTE.NAVY_SURFACE, borderRadius: 16, border: `1.5px solid ${PALETTE.EMERALD_SUCCESS}`, padding: '14px 18px' }}>
              <span style={{ color: PALETTE.EMERALD_LIGHT, fontWeight: 900, fontSize: 16 }}>④ TÍNH KHẢ NGHIÊN CỨU</span>
              <p style={{ margin: '6px 0 0', color: PALETTE.TEXT_SECONDARY, fontSize: 14, lineHeight: 1.35 }}>
                Chuyển hóa được thành <strong>câu hỏi, giả thuyết &amp; mô hình</strong> khả thi.
              </p>
            </div>
          </div>
        </div>

        {/* Small Discovering Researcher Rig at Bottom Right */}
        <div style={{ position: 'absolute', bottom: 10, right: 20, width: 220, height: 320 }}>
          <ResearcherRig
            pose="discovering"
            frame={frame}
            showGlasses
            showIdeaBulb
            scale={0.65}
          />
        </div>
      </div>
    </div>
  );
};
