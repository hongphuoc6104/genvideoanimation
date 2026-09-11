import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OpaqueCard, AutoClippingConnector } from 'motion-kit';

export interface ThreeTierBridgeMechanismProps {
  activeTier: 1 | 2 | 3; // 1: Foundation, 2: Tension, 3: Keystone Lock
}

export const ThreeTierBridgeMechanism: React.FC<ThreeTierBridgeMechanismProps> = ({
  activeTier,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Keystone drop spring
  const keystoneDrop = spring({
    frame: activeTier === 3 ? frame : 0,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const keystoneY = interpolate(keystoneDrop, [0, 1], [-100, 0]);

  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Header Badge */}
      <g transform="translate(540, 420)">
        <rect
          x={-430}
          y={-60}
          width={860}
          height={120}
          rx={24}
          fill="#0F172A"
          stroke="#10B981"
          strokeWidth={2}
          filter="drop-shadow(0 0 16px rgba(16, 185, 129, 0.3))"
          data-badge="true"
        />
        <text x={0} y={8} textAnchor="middle" fill="#10B981" fontSize={30} fontWeight={900}>
          BƯỚC 4-5: CƠ CẤU CẦU DẦM & CÔNG THỨC
        </text>
      </g>

      {/* CƠ CẤU CẦU DẦM 3 TẦNG SWALES CARS (y in [650, 1420]) */}
      <g transform="translate(540, 720)">
        {/* The Abyssal Chasm (Background Void) - Unmounted cleanly when Tier 3 Victory Bridge is built */}
        <path
          d="M -440,240 L -180,240 L -80,500 L 80,500 L 180,240 L 440,240"
          fill="none"
          stroke="#334155"
          strokeWidth={4}
        />

        {activeTier < 3 && (
          <OpaqueCard
            cx={0}
            cy={380}
            width={500}
            height={110}
            rx={20}
            baseColor="#0F172A"
            borderColor="#334155"
            borderWidth={2}
            isActive={false}
          >
            <text
              x={0}
              y={388}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize={30}
              fontWeight={800}
            >
              VỰC THẲM TRI THỨC
            </text>
          </OpaqueCard>
        )}

        {/* TIER 1: TẦNG NỀN MÓNG (FOUNDATION ABUTMENT) */}
        <g opacity={activeTier >= 1 ? 1.0 : 0.3}>
          {/* Left Abutment Pillar */}
          <OpaqueCard
            cx={-310}
            cy={230}
            width={300}
            height={180}
            rx={20}
            baseColor="#0F172A"
            borderColor="#10B981"
            borderWidth={4}
            isActive={activeTier >= 1}
          >
            <text x={-310} y={205} textAnchor="middle" fill="#10B981" fontSize={32} fontWeight={800}>
              NỀN TẢNG
            </text>
            <text x={-310} y={265} textAnchor="middle" fill="#E2E8F0" fontSize={30} fontWeight={600}>
              Đã biết
            </text>
          </OpaqueCard>

          {/* Right Abutment Pillar */}
          <OpaqueCard
            cx={310}
            cy={230}
            width={300}
            height={180}
            rx={20}
            baseColor="#0F172A"
            borderColor="#10B981"
            borderWidth={4}
            isActive={activeTier >= 1}
          >
            <text x={310} y={205} textAnchor="middle" fill="#10B981" fontSize={32} fontWeight={800}>
              ĐÍCH ĐẾN
            </text>
            <text x={310} y={265} textAnchor="middle" fill="#E2E8F0" fontSize={30} fontWeight={600}>
              Mục tiêu
            </text>
          </OpaqueCard>
        </g>

        {/* TIER 2: TẦNG VẤN ĐỀ (TENSION GAP SPAN) */}
        <g opacity={activeTier >= 2 ? 1.0 : 0}>
          {/* Suspended Arch Truss spanning cleanly between abutments (-160 to 160) */}
          <path
            d="M -160,200 Q 0,100 160,200"
            fill="none"
            stroke={activeTier === 3 ? '#38BDF8' : '#F59E0B'}
            strokeWidth={activeTier === 3 ? 4 : 6}
            strokeOpacity={activeTier === 3 ? 0.35 : 1.0}
            strokeDasharray={activeTier === 2 ? '8 6' : 'none'}
          />

          {/* Struts connected via AutoClippingConnector */}
          <g opacity={activeTier === 3 ? 0.3 : 1.0}>
            <AutoClippingConnector
              source={{ cx: -90, cy: 160, width: 20, height: 20, cornerRadius: 4 }}
              target={{ cx: -90, cy: 235, width: 20, height: 20, cornerRadius: 4 }}
              color="#F59E0B"
              strokeWidth={3}
            />
            <AutoClippingConnector
              source={{ cx: 90, cy: 160, width: 20, height: 20, cornerRadius: 4 }}
              target={{ cx: 90, cy: 235, width: 20, height: 20, cornerRadius: 4 }}
              color="#F59E0B"
              strokeWidth={3}
            />
          </g>

          {activeTier === 2 && (
            <OpaqueCard
              cx={0}
              cy={95}
              width={700}
              height={170}
              rx={22}
              baseColor="#0F172A"
              borderColor="#F59E0B"
              borderWidth={3}
              isActive={true}
            >
              <text x={0} y={68} textAnchor="middle" fill="#F59E0B" fontSize={32} fontWeight={900}>
                TẦNG 2: MÂU THUẪN / KHOẢNG NỨT
              </text>
              <text x={0} y={128} textAnchor="middle" fill="#E2E8F0" fontSize={30} fontWeight={600}>
                "Tuy nhiên, hạn chế hiện tại là..."
              </text>
            </OpaqueCard>
          )}
        </g>

        {/* TIER 3: TẦNG ĐỊNH VỊ (THE LOCKING KEYSTONE) */}
        <g
          transform={`translate(0, ${keystoneY})`}
          opacity={activeTier === 3 ? 1.0 : 0}
        >
          <OpaqueCard
            cx={0}
            cy={170}
            width={380}
            height={170}
            rx={24}
            baseColor="#0F172A"
            borderColor="#38BDF8"
            borderWidth={4}
            activeGlowColor="rgba(56, 189, 248, 0.9)"
            isActive={true}
          >
            <text x={0} y={142} textAnchor="middle" fill="#38BDF8" fontSize={32} fontWeight={900}>
              ĐỊNH VỊ
            </text>
            <text x={0} y={200} textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight={700}>
              Đóng góp mới
            </text>
          </OpaqueCard>
        </g>

        {/* Synthesis Status Badge & Variable Formula A-B-C-D-E-M-F */}
        {activeTier === 3 && (
          <g transform="translate(0, 310)">
            {/* Victory Badge */}
            <rect
              x={-440}
              y={-15}
              width={880}
              height={110}
              rx={24}
              fill="#0F172A"
              stroke="#10B981"
              strokeWidth={3}
              data-badge="true"
            />
            <text x={0} y={48} textAnchor="middle" fill="#10B981" fontSize={30} fontWeight={800}>
              CÂY CẦU HOÀN CHỈNH: ĐẠT CHUẨN Q1
            </text>

            {/* Variable Formula Circuit A-B-C-D-E-M-F */}
            <g transform="translate(0, 105)">
              <rect
                x={-440}
                y={-10}
                width={880}
                height={110}
                rx={20}
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth={2}
                data-badge="true"
              />
              <text x={0} y={54} textAnchor="middle" fill="#38BDF8" fontSize={30} fontWeight={900}>
                CÔNG THỨC: A-B-C-D-E-M-F
              </text>
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};
