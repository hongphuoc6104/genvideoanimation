import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  SafeStageZone,
  AutoPill,
  AutoClippingConnector,
  OpaqueCard,
  useBeatChoreography,
  BoxDescriptor,
} from 'motion-kit';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

/**
 * SceneTemplate: Mẫu dựng cảnh động học chuẩn V3.4+ với Smart Geometric Primitives.
 * 
 * NGUYÊN TẮC THIẾT KẾ:
 * 1. SafeStageZone: Bọc 100% phần tử trong Stage Zone 2 [36, 1044] x [180, 1420px],
 *    bảo toàn khoảng đệm an toàn >= 50px trước trần phụ đề y = 1470px.
 * 2. AutoClippingConnector: Nối các node với thuật toán Ray-AABB Boundary Clipping,
 *    không bao giờ đâm xuyên qua hộp chữ hoặc tâm node.
 * 3. AutoPill: Tự động đo độ rộng chuỗi tiếng Việt UTF-8, duy trì padding >= 34px.
 * 4. OpaqueCard: Kiến trúc 2 lớp phân ly (Base Shield opacity: 1.0 #0F172A),
 *    chống triệt để bẫy kế thừa CSS khi làm mờ thẻ inactive.
 * 5. Clean Mount/Unmount (Zero Ghosting): Trạng thái cũ unmount sạch sẽ khi chuyển pha.
 */
export const SceneTemplate: React.FC<SceneProps> = ({ durationInFrames = 600, shotBeats = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dẫn xuất nhịp động học từ timeline tokens (chống hardcode frame tuyệt đối)
  const { currentBeatIndex, beatProgress: intraBeatProgress, phase } = useBeatChoreography(shotBeats);

  // Hiệu ứng chuyển biến hình học nội suy
  const morphProgress = spring({
    frame: frame % 150,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  // Khai báo BoxDescriptor cho 2 node quan hệ
  const sourceNode: BoxDescriptor = {
    cx: 340,
    cy: 760,
    width: 260,
    height: 72,
    shape: 'rounded-rect',
    cornerRadius: 18,
  };

  const targetNode: BoxDescriptor = {
    cx: 740,
    cy: 760,
    width: 260,
    height: 72,
    shape: 'rounded-rect',
    cornerRadius: 18,
  };

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
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 1920 }}
        viewBox="0 0 1080 1920"
      >
        {/* VÙNG AN TOÀN SÂN KHẤU ZONE 2: [36, 1044] x [180, 1420] */}
        <SafeStageZone
          minX={36}
          maxX={1044}
          minY={180}
          maxY={1420}
          subtitleZoneY={1470}
          as="svg"
        >
          {({ bounds, mapPoint }) => (
            <g>
              {/* Tiêu đề neo cơ học bằng AutoPill tự co giãn */}
              <AutoPill
                x={bounds.centerX}
                y={280}
                text={phase === 0 ? 'TRẠNG THÁI KHỞI ĐẦU' : 'CHUYỂN HÓA ĐỒNG THUẬN'}
                fontSize={34}
                fontWeight={800}
                color="#F8FAFC"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth={2}
                paddingHorizontal={36}
                minWidth={160}
                height={64}
                anchor="center"
              />

              {/* Đường nối tự động cắt mép Ray-AABB giữa 2 node, cấm đâm vào lòng chữ */}
              <AutoClippingConnector
                from={sourceNode}
                to={targetNode}
                routing="curved"
                curvature={-0.15}
                stroke="#38BDF8"
                strokeWidth={3}
                arrowhead="end"
                arrowheadSize={12}
                startGap={6}
                endGap={6}
              />

              {/* Node nguồn: OpaqueCard với base shield đục 100% chống bẫy CSS opacity */}
              <OpaqueCard
                cx={sourceNode.cx}
                cy={sourceNode.cy}
                width={sourceNode.width}
                height={sourceNode.height}
                rx={sourceNode.cornerRadius}
                isActive={phase === 0}
                isDimmed={phase !== 0}
                inactiveOpacity={0.25}
                activeBorderColor="#38BDF8"
                baseColor="#0F172A"
              >
                {({ isActive, filter }) => (
                  <g style={{ filter }}>
                    <text
                      x={sourceNode.cx!}
                      y={sourceNode.cy!}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isActive ? '#38BDF8' : '#94A3B8'}
                      fontSize={26}
                      fontWeight={700}
                    >
                      NODE TIỀN ĐỀ
                    </text>
                  </g>
                )}
              </OpaqueCard>

              {/* Node đích: OpaqueCard */}
              <OpaqueCard
                cx={targetNode.cx}
                cy={targetNode.cy}
                width={targetNode.width}
                height={targetNode.height}
                rx={targetNode.cornerRadius}
                isActive={phase === 1}
                isDimmed={phase !== 1}
                inactiveOpacity={0.25}
                activeBorderColor="#10B981"
                baseColor="#0F172A"
              >
                {({ isActive, filter }) => (
                  <g style={{ filter }}>
                    <text
                      x={targetNode.cx!}
                      y={targetNode.cy!}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isActive ? '#10B981' : '#94A3B8'}
                      fontSize={26}
                      fontWeight={700}
                    >
                      NODE ĐÍCH ĐẾN
                    </text>
                  </g>
                )}
              </OpaqueCard>

              {/* Clean Mount / Unmount: Không vẽ đè 2 text lên cùng 1 tọa độ */}
              {phase === 0 && (
                <g transform={`translate(${bounds.centerX}, 1040)`}>
                  <circle r={40} fill="#38BDF8" opacity={0.8} />
                  <text y={60} textAnchor="middle" fill="#94A3B8" fontSize={22} fontWeight={600}>
                    GIAI ĐOẠN 1: KHỞI TẠO
                  </text>
                </g>
              )}

              {phase === 1 && (
                <g transform={`translate(${bounds.centerX}, 1040)`}>
                  <rect x={-40} y={-40} width={80} height={80} rx={16} fill="#10B981" />
                  <text y={60} textAnchor="middle" fill="#10B981" fontSize={22} fontWeight={600}>
                    GIAI ĐOẠN 2: HOÀN THÀNH
                  </text>
                </g>
              )}
            </g>
          )}
        </SafeStageZone>
      </svg>
    </div>
  );
};
