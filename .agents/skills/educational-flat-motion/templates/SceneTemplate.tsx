import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

/**
 * SceneTemplate: Mẫu dựng cảnh động học theo chuẩn V3.4 (Anti-Slide & Kinetic Transformation).
 * 
 * NGUYÊN TẮC THIẾT KẾ:
 * 1. Tự do bố cục hình ảnh (Creative Layout Freedom): Full-bleed, chia đôi so sánh (split),
 *    chu trình pha tròn (radial phase), hoặc đồ thị mạng lưới. KHÔNG ÉP BUỘC BỐ CỤC 4 TẦNG.
 * 2. Visual Progression: Diễn giải bằng chuyển động của vector, hình khối và cơ chế (Relational Mechanism).
 * 3. Ranh giới bất biến duy nhất: Dành riêng vùng an toàn phụ đề [y: 1520 - 1720px] và lề đáy [y > 1720px].
 *    Không đặt các chi tiết động học chính hoặc văn bản đè lên vùng phụ đề này.
 */
export const SceneTemplate: React.FC<SceneProps> = ({ durationInFrames = 600, shotBeats = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dẫn xuất nhịp động học từ timeline tokens (chống hardcode frame tuyệt đối)
  const { currentBeatIndex, beatProgress: intraBeatProgress, phase } = useBeatChoreography(shotBeats);

  // Ví dụ: Hiệu ứng chuyển biến hình học theo từng nhịp (Intra-beat kinematic interpolation)
  const morphProgress = spring({
    frame: frame % 150,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        backgroundColor: '#0A0F1D',
        overflow: 'hidden',
      }}
    >
      {/* 
        VÙNG KHÔNG GIAN HÌNH ẢNH CHỦ ĐẠO (Primary Kinetic Canvas) [y: 100 - 1500px]
        Tác giả tự do sáng tạo cơ cấu chuyển động: van lật, liên kết đòn bẩy, đồ thị luồng...
      */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920 }}
        viewBox="0 0 1080 1920"
      >
        {/* Ví dụ: Cơ cấu chuyển hóa hình học 2 trạng thái (State A <-> State B) */}
        <g transform={`translate(540, 800) scale(${interpolate(morphProgress, [0, 1], [0.95, 1.05])})`}>
          {/* Cung liên kết / Cánh van cơ học */}
          <path
            d={`M -200 0 Q 0 ${interpolate(morphProgress, [0, 1], [-120, 120])} 200 0`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={12}
            strokeLinecap="round"
          />

          {/* Thực thể hạt / Node động học */}
          <circle
            cx={interpolate(morphProgress, [0, 1], [-160, 160])}
            cy={interpolate(morphProgress, [0, 1], [-40, 40])}
            r={36}
            fill="#10B981"
            filter="drop-shadow(0 0 16px rgba(16, 185, 129, 0.6))"
          />
        </g>

        {/* Nhãn neo cơ học ngắn gọn (Kinetic Anchor Label - chỉ tên gọi <= 3 từ, cấm đoạn văn) */}
        <text
          x={540}
          y={360}
          textAnchor="middle"
          fill="#F8FAFC"
          fontSize={44}
          fontWeight={800}
          letterSpacing="0.02em"
        >
          {phase === 0 ? 'TRẠNG THÁI KHỞI ĐẦU' : 'CHUYỂN HÓA CẤU HÌNH'}
        </text>
      </svg>

      {/* 
        RANH GIỚI BẢO VỆ PHỤ ĐỀ (Subtitle Clearance Zone) [y: 1520 - 1720px]
        Không chèn vật thể hoặc đồ họa tĩnh vào dải này. Phụ đề karaoke được Root mount tại đây.
      */}
    </div>
  );
};
