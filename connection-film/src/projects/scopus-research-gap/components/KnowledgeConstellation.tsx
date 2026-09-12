import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoClippingConnector } from 'motion-kit';

export interface ConstellationNode {
  id: string;
  x: number;
  y: number;
  label: string;
  subLabel?: string;
  cluster: 'foundation' | 'emerging' | 'method';
}

const NODES: ConstellationNode[] = [
  { id: 'n1', x: 240, y: 440, label: 'LÝ THUYẾT A', subLabel: 'Smith (2018)', cluster: 'foundation' },
  { id: 'n2', x: 540, y: 320, label: 'THỰC NGHIỆM', subLabel: 'Chen (2020)', cluster: 'foundation' },
  { id: 'n3', x: 240, y: 960, label: 'KHUNG TAM', subLabel: 'Davis (1989)', cluster: 'foundation' },
  { id: 'n4', x: 840, y: 440, label: 'LÝ THUYẾT B', subLabel: 'Miller (2021)', cluster: 'emerging' },
  { id: 'n5', x: 840, y: 960, label: 'BỐI CẢNH MỚI', subLabel: 'Nguyen (2023)', cluster: 'emerging' },
  { id: 'n6', x: 540, y: 1120, label: 'PHƯƠNG PHÁP', subLabel: 'Hair (2019)', cluster: 'method' },
];

export interface KnowledgeConstellationProps {
  manuscriptState: 'submitting' | 'rejected' | 'connecting' | 'integrated';
  highlightChasm?: boolean;
}

export const KnowledgeConstellationMechanism: React.FC<KnowledgeConstellationProps> = ({
  manuscriptState,
  highlightChasm = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulse animation for nodes and edges
  const pulse = Math.sin((frame / fps) * 3) * 0.15 + 0.85;

  // Stamp impact spring for Beat 01 (slams down at frame 40)
  const stampProgress = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const stampScale = interpolate(stampProgress, [0, 1], [3.0, 1.0]);
  const stampOpacity = Math.min(1, stampProgress * 1.6);
  const shockwaveR = interpolate(stampProgress, [0.8, 1], [0, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shockwaveOpacity = interpolate(stampProgress, [0.8, 1], [0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Manuscript dynamic coordinates
  const manuProgress = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const manuScale = interpolate(manuProgress, [0, 1], [0.88, 1.0]);
  const manuOpacity = interpolate(manuProgress, [0, 1], [0, 1]);

  // When rejected in Beat 01, manuscript is at (680, 700) to balance researcher on left
  const isBeat1 = manuscriptState === 'submitting' || manuscriptState === 'rejected';
  const manuX = isBeat1 ? 680 : 540;
  const manuY = isBeat1 ? 700 : 720;

  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <defs>
        <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowCoral" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Network Edges for Academic Dialogue (Beats 02 & 03) */}
      {!isBeat1 && (
        <g>
          {[
            ['n1', 'n2'],
            ['n1', 'n3'],
            ['n4', 'n5'],
            ['n3', 'n6'],
            ['n5', 'n6'],
          ].map(([srcId, tgtId]) => {
            const src = NODES.find((n) => n.id === srcId)!;
            const tgt = NODES.find((n) => n.id === tgtId)!;
            return (
              <g key={`${srcId}-${tgtId}`} opacity={pulse * 0.75}>
                <AutoClippingConnector
                  source={{
                    cx: src.x,
                    cy: src.y,
                    width: 220,
                    height: 80,
                    cornerRadius: 16,
                  }}
                  target={{
                    cx: tgt.x,
                    cy: tgt.y,
                    width: 220,
                    height: 80,
                    cornerRadius: 16,
                  }}
                  color="#38BDF8"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  startGap={4}
                  endGap={4}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Knowledge Void / Chasm (The Research Gap in Beat 02) */}
      {highlightChasm && !isBeat1 && (
        <g opacity={pulse}>
          <ellipse
            cx={540}
            cy={740}
            rx={190}
            ry={75}
            fill="#0F172A"
            stroke="#F59E0B"
            strokeWidth={4}
            strokeDasharray="8 8"
            filter="url(#glowAmber)"
          />
          <circle cx={540} cy={740} r={40} fill="#EF4444" opacity={0.3} filter="url(#glowCoral)" />
          <text
            x={540}
            y={748}
            textAnchor="middle"
            fill="#F59E0B"
            fontSize={32}
            fontWeight={900}
            letterSpacing="0.06em"
          >
            VÙNG TRỐNG TRI THỨC
          </text>
        </g>
      )}

      {/* Dialogue Scholar Nodes for Beat 03 */}
      {!isBeat1 && (
        <g>
          {NODES.map((node) => {
            const nodeW = 220;
            const nodeH = 80;

            return (
              <g key={node.id} opacity={manuOpacity}>
                <rect
                  x={node.x - nodeW / 2}
                  y={node.y - nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx={16}
                  fill="#0F172A"
                  stroke={node.cluster === 'foundation' ? '#38BDF8' : node.cluster === 'emerging' ? '#10B981' : '#A855F7'}
                  strokeWidth={2.5}
                  filter="url(#glowCyan)"
                />
                <text
                  x={node.x}
                  y={node.y - 8}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={30}
                  fontWeight={800}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={30}
                  fontWeight={600}
                >
                  {node.subLabel}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Manuscript Node */}
      <g
        transform={`translate(${manuX}, ${manuY}) scale(${manuScale})`}
        opacity={manuOpacity}
        style={{ transformOrigin: '0px 0px' }}
      >
        {/* Manuscript Document Paper Sheet */}
        <g transform="translate(-140, -110)">
          <rect
            x={0}
            y={0}
            width={280}
            height={220}
            rx={16}
            fill="#1E293B"
            stroke={isBeat1 ? '#F43F5E' : '#10B981'}
            strokeWidth={3}
            filter="drop-shadow(0 16px 32px rgba(0,0,0,0.6))"
          />
          {/* Header Bar */}
          <rect x={20} y={16} width={240} height={42} rx={8} fill="#0F172A" />
          <text x={140} y={48} fill="#94A3B8" fontSize={30} fontWeight={800} textAnchor="middle">
            RESEARCH ARTICLE
          </text>
          {/* Text Placeholder Lines */}
          <line x1={25} y1={80} x2={220} y2={80} stroke="#475569" strokeWidth={5} strokeLinecap="round" />
          <line x1={25} y1={105} x2={255} y2={105} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <line x1={25} y1={130} x2={240} y2={130} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
          <line x1={25} y1={155} x2={180} y2={155} stroke="#38BDF8" strokeWidth={4} strokeLinecap="round" />
          <line x1={25} y1={180} x2={210} y2={180} stroke="#475569" strokeWidth={4} strokeLinecap="round" />
        </g>

        {/* Desk Reject Giant Rubber Stamp Impact (Beat 01) */}
        {isBeat1 && frame >= 35 && (
          <g transform="translate(0, 0)">
            {/* Shockwave expanding ring */}
            <circle
              cx={0}
              cy={0}
              r={shockwaveR}
              fill="none"
              stroke="#EF4444"
              strokeWidth={5}
              opacity={shockwaveOpacity}
            />

            {/* Smashed Stamp Box */}
            <g
              transform={`scale(${stampScale}) rotate(-12)`}
              opacity={stampOpacity}
              style={{ transformOrigin: '0px 0px' }}
            >
              <rect
                x={-150}
                y={-55}
                width={300}
                height={110}
                rx={18}
                fill="#0F172A"
                stroke="#EF4444"
                strokeWidth={6}
                filter="url(#glowCoral)"
              />
              <rect
                x={-140}
                y={-45}
                width={280}
                height={90}
                rx={12}
                fill="none"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <text
                x={0}
                y={14}
                textAnchor="middle"
                fill="#EF4444"
                fontSize={44}
                fontWeight={900}
                letterSpacing="0.08em"
              >
                DESK REJECT
              </text>
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};

export const KnowledgeConstellation = KnowledgeConstellationMechanism;
