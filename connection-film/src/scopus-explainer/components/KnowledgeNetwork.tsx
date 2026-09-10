import React, { useMemo } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { quadraticBezierPoint, Point2D } from 'motion-kit';
import { PALETTE } from '../palette';

export interface KnowledgeNetworkProps {
  progress?: number;
  highlightGap?: boolean;
  style?: React.CSSProperties;
}

interface Node {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

const NODES: Node[] = [
  { id: 'concepts', label: '1. Khái niệm & Lý thuyết', sub: 'Concepts (TAM, E-SQ, Trust)', x: 280, y: 560, color: PALETTE.CYAN_PRIMARY, size: 52 },
  { id: 'contexts', label: '2. Bối cảnh nghiên cứu', sub: 'Contexts (Thị trường mới nổi)', x: 800, y: 560, color: PALETTE.CYAN_GLOW, size: 52 },
  { id: 'methods', label: '3. Phương pháp & Đo lường', sub: 'Methods (Dữ liệu dọc, CMV)', x: 280, y: 1020, color: PALETTE.PURPLE_ACCENT, size: 52 },
  { id: 'findings', label: '4. Kết quả thực nghiệm', sub: 'Empirical Findings (Mâu thuẫn)', x: 800, y: 1020, color: PALETTE.CORAL_ALERT, size: 52 },
];

export const KnowledgeNetwork: React.FC<KnowledgeNetworkProps> = ({
  progress,
  highlightGap = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = progress !== undefined
    ? progress
    : spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  // Compute curved Bezier pulses targeting the central Gap node
  const pulseT1 = (frame % 45) / 45;
  const pulseT2 = ((frame + 22) % 45) / 45;

  const pGap: Point2D = { x: 540, y: 790 };

  // Conduit 1: Concepts -> Gap
  const pConcepts: Point2D = { x: 280, y: 560 };
  const pMid1: Point2D = { x: 390, y: 660 };
  const packet1 = quadraticBezierPoint(pConcepts, pMid1, pGap, pulseT1);

  // Conduit 2: Contexts -> Gap
  const pContexts: Point2D = { x: 800, y: 560 };
  const pMid2: Point2D = { x: 690, y: 660 };
  const packet2 = quadraticBezierPoint(pContexts, pMid2, pGap, pulseT2);

  // Conduit 3: Methods -> Gap
  const pMethods: Point2D = { x: 280, y: 1020 };
  const pMid3: Point2D = { x: 390, y: 920 };
  const packet3 = quadraticBezierPoint(pMethods, pMid3, pGap, pulseT1);

  // Conduit 4: Findings -> Gap
  const pFindings: Point2D = { x: 800, y: 1020 };
  const pMid4: Point2D = { x: 690, y: 920 };
  const packet4 = quadraticBezierPoint(pFindings, pMid4, pGap, pulseT2);

  const gapPulse = Math.sin(frame * 0.12) * 0.1 + 1.0;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="gapGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g data-part="network-root" data-joint="network-frame" opacity={Math.min(1, animProgress * 1.2)}>
          {/* Header Card: Snyder (2019) & PRISMA 2020 Standard */}
          <rect
            x={140}
            y={380}
            width={800}
            height={90}
            rx={18}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.CYAN_PRIMARY}
            strokeWidth={2}
          />
          <text x={540} y={420} fill={PALETTE.CYAN_GLOW} fontSize={22} fontWeight="bold" textAnchor="middle">
            BẢN ĐỒ TRI THỨC HIỆN CÓ (KNOWLEDGE MAPPING)
          </text>
          <text x={540} y={450} fill={PALETTE.TEXT_SECONDARY} fontSize={16} textAnchor="middle">
            Tổng quan hệ thống theo chuẩn PRISMA 2020 &amp; Snyder (2019)
          </text>

          {/* Network Perimeter Conduits */}
          <line x1={280} y1={560} x2={800} y2={560} stroke={PALETTE.NAVY_BORDER} strokeWidth={2.5} strokeDasharray="6 4" />
          <line x1={280} y1={560} x2={280} y2={1020} stroke={PALETTE.NAVY_BORDER} strokeWidth={2.5} strokeDasharray="6 4" />
          <line x1={800} y1={560} x2={800} y2={1020} stroke={PALETTE.NAVY_BORDER} strokeWidth={2.5} strokeDasharray="6 4" />
          <line x1={280} y1={1020} x2={800} y2={1020} stroke={PALETTE.NAVY_BORDER} strokeWidth={2.5} strokeDasharray="6 4" />

          {/* Curved Bezier Conduits targeting Central Gap */}
          <path d="M 280 560 Q 390 660 540 790" stroke={PALETTE.CYAN_PRIMARY} strokeWidth={3.5} fill="none" opacity={0.75} />
          <path d="M 800 560 Q 690 660 540 790" stroke={PALETTE.CYAN_GLOW} strokeWidth={3.5} fill="none" opacity={0.75} />
          <path d="M 280 1020 Q 390 920 540 790" stroke={PALETTE.PURPLE_ACCENT} strokeWidth={3.5} fill="none" opacity={0.75} />
          <path d="M 800 1020 Q 690 920 540 790" stroke={PALETTE.CORAL_ALERT} strokeWidth={3.5} fill="none" opacity={0.75} />

          {/* Animated data packets on Bezier paths */}
          <circle cx={packet1.x} cy={packet1.y} r={6} fill={PALETTE.CYAN_PRIMARY} />
          <circle cx={packet2.x} cy={packet2.y} r={6} fill={PALETTE.CYAN_GLOW} />
          <circle cx={packet3.x} cy={packet3.y} r={6} fill={PALETTE.PURPLE_ACCENT} />
          <circle cx={packet4.x} cy={packet4.y} r={6} fill={PALETTE.CORAL_ALERT} />

          {/* Standard 4 Knowledge Axis Nodes */}
          {NODES.map(node => (
            <g key={node.id} data-part={`node-${node.id}`} data-joint={`joint-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                r={node.size}
                fill={PALETTE.NAVY_SURFACE}
                stroke={node.color}
                strokeWidth={3}
              />
              <text y={-6} fill={PALETTE.TEXT_PRIMARY} fontSize={15} fontWeight="bold" textAnchor="middle">
                {node.label}
              </text>
              <text y={16} fill={PALETTE.TEXT_SECONDARY} fontSize={12} textAnchor="middle">
                {node.sub}
              </text>
            </g>
          ))}

          {/* CENTRAL GAP NODE (Pulsing Amber Missing / Broken Void) */}
          <g
            data-part="gap-node"
            data-joint="gap-joint"
            transform={`translate(540, 790) scale(${highlightGap ? gapPulse : 1}) translate(-540, -790)`}
            filter="url(#gapGlowFilter)"
          >
            {/* Warning Ring with Broken Dashed Conduits */}
            <circle
              cx={540}
              cy={790}
              r={76}
              fill={PALETTE.AMBER_SOFT}
              stroke={PALETTE.AMBER_ALERT}
              strokeWidth={3}
              strokeDasharray="8 6"
            />
            {/* Core Gap Circle */}
            <circle
              cx={540}
              cy={790}
              r={60}
              fill={PALETTE.NAVY_DEEP}
              stroke={PALETTE.AMBER_ALERT}
              strokeWidth={4}
            />
            {/* Gap Labels */}
            <text x={540} y={776} fill={PALETTE.AMBER_LIGHT} fontSize={14} fontWeight="900" textAnchor="middle">
              KHOẢNG TRỐNG TRI THỨC
            </text>
            <text x={540} y={798} fill={PALETTE.TEXT_PRIMARY} fontSize={12} fontWeight="bold" textAnchor="middle">
              (Research Gap: Chưa rõ cơ chế)
            </text>
          </g>

          {/* Bottom Callout Banner */}
          <rect
            x={180}
            y={1200}
            width={720}
            height={80}
            rx={16}
            fill={PALETTE.NAVY_SURFACE}
            stroke={PALETTE.AMBER_ALERT}
            strokeWidth={2}
          />
          <text x={540} y={1234} fill={PALETTE.AMBER_LIGHT} fontSize={18} fontWeight="bold" textAnchor="middle">
            Robinson et al. (2011): Làm rõ bằng chứng thiếu ở đâu &amp; theo cách nào!
          </text>
          <text x={540} y={1262} fill={PALETTE.TEXT_SECONDARY} fontSize={15} textAnchor="middle">
            Không dựa vào cảm tính &quot;đề tài còn mới&quot; để tuyên bố khoảng trống
          </text>
        </g>
      </svg>
    </div>
  );
};
