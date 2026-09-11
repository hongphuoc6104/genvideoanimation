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
  { id: 'n1', x: 240, y: 480, label: 'Lý thuyết A', subLabel: 'Smith (2018)', cluster: 'foundation' },
  { id: 'n2', x: 440, y: 380, label: 'Thực nghiệm 1', subLabel: 'Chen (2020)', cluster: 'foundation' },
  { id: 'n3', x: 220, y: 760, label: 'Khung TAM', subLabel: 'Davis (1989)', cluster: 'foundation' },
  { id: 'n4', x: 800, y: 460, label: 'Lý thuyết B', subLabel: 'Miller (2021)', cluster: 'emerging' },
  { id: 'n5', x: 840, y: 740, label: 'Bối cảnh mới', subLabel: 'Nguyen (2023)', cluster: 'emerging' },
  { id: 'n6', x: 540, y: 920, label: 'Phương pháp SEM', subLabel: 'Hair (2019)', cluster: 'method' },
];

const EDGES: [string, string][] = [
  ['n1', 'n2'],
  ['n1', 'n3'],
  ['n2', 'n3'],
  ['n4', 'n5'],
  ['n3', 'n6'],
  ['n5', 'n6'],
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

  // Manuscript dynamic coordinates: settled cleanly at (540, 560) with scale/opacity entrance
  const manuProgress = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const manuScale = interpolate(manuProgress, [0, 1], [0.88, 1.0]);
  const manuOpacity = interpolate(manuProgress, [0, 1], [0, 1]);
  const manuY = interpolate(manuProgress, [0, 1], [575, 560]);

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
        {/* Glow Filters */}
        <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
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
        <filter id="glowCoral" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Network Edges - AutoClippingConnector prevents vector penetration into node cards */}
      {manuscriptState !== 'rejected' && (
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
              <g key={`${srcId}-${tgtId}`} opacity={pulse * 0.7}>
                <AutoClippingConnector
                  source={{
                    cx: src.x,
                    cy: src.y,
                    width: 340,
                    height: 140,
                    cornerRadius: 20,
                  }}
                  target={{
                    cx: tgt.x,
                    cy: tgt.y,
                    width: 340,
                    height: 140,
                    cornerRadius: 20,
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

      {/* Knowledge Void / Chasm (The Research Gap) */}
      {highlightChasm && (
        <g opacity={pulse}>
          <ellipse
            cx={540}
            cy={800}
            rx={240}
            ry={90}
            fill="#0F172A"
            stroke="#F59E0B"
            strokeWidth={3}
            strokeDasharray="8 8"
            filter="url(#glowAmber)"
          />
          <text
            x={540}
            y={790}
            textAnchor="middle"
            fill="#F59E0B"
            fontSize={30}
            fontWeight={900}
            letterSpacing="0.06em"
          >
            KHOẢNG TRỐNG (GAP)
          </text>
          <text
            x={540}
            y={830}
            textAnchor="middle"
            fill="#FDE68A"
            fontSize={30}
            fontWeight={700}
          >
            Thiếu hụt tri thức
          </text>
        </g>
      )}

      {/* Published Literature Nodes with Opaque Shielded Cards (height=140 satisfies >=30px padding) */}
      {manuscriptState !== 'rejected' && (
        <g>
          {NODES.map((node) => {
            const isFoundation = node.cluster === 'foundation';
            const strokeColor = isFoundation ? '#38BDF8' : node.cluster === 'emerging' ? '#10B981' : '#A855F7';
            return (
              <g key={node.id}>
                {/* Opaque Shield Card backing entire node and labels */}
                <rect
                  x={node.x - 170}
                  y={node.y - 70}
                  width={340}
                  height={140}
                  rx={20}
                  fill="#0F172A"
                  stroke={strokeColor}
                  strokeWidth={2}
                  filter="url(#glowCyan)"
                  data-badge="true"
                />
                {/* Semantic Label */}
                <text
                  x={node.x}
                  y={node.y - 12}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize={30}
                  fontWeight={700}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize={30}
                  fontWeight={500}
                >
                  {node.subLabel}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Dynamic Candidate Manuscript Node with Opaque Card Shield */}
      <g
        transform={`translate(540, ${manuY}) scale(${manuScale})`}
        opacity={manuOpacity}
        style={{ transformOrigin: '540px 560px' }}
      >
        {manuscriptState === 'rejected' ? (
          <g>
            {/* Opaque Shield Badge for Desk Reject (height=190 for >= 30px padding) */}
            <rect
              x={-250}
              y={-95}
              width={500}
              height={190}
              rx={24}
              fill="#0F172A"
              stroke="#F43F5E"
              strokeWidth={4}
              filter="url(#glowCoral)"
              data-badge="true"
            />
            {/* Rejection Shockwave Icon */}
            <circle
              cx={0}
              cy={-45}
              r={24}
              fill="rgba(244, 63, 94, 0.2)"
              stroke="#F43F5E"
              strokeWidth={3}
            />
            <line x1={-10} y1={-55} x2={10} y2={-35} stroke="#F43F5E" strokeWidth={4} strokeLinecap="round" />
            <line x1={10} y1={-55} x2={-10} y2={-35} stroke="#F43F5E" strokeWidth={4} strokeLinecap="round" />
            {/* 2-Line Compact Desk Reject label */}
            <text
              x={0}
              y={10}
              textAnchor="middle"
              fill="#F43F5E"
              fontSize={32}
              fontWeight={900}
              letterSpacing="0.06em"
            >
              DESK REJECT
            </text>
            <text
              x={0}
              y={52}
              textAnchor="middle"
              fill="#FDA4AF"
              fontSize={30}
              fontWeight={700}
            >
              (Đứt gãy học thuật)
            </text>
          </g>
        ) : (
          <g>
            {/* Opaque Shield Badge for Manuscript (height=110 for >= 30px padding) */}
            <rect
              x={-255}
              y={-55}
              width={510}
              height={110}
              rx={22}
              fill="#0F172A"
              stroke="#10B981"
              strokeWidth={3}
              filter="url(#glowCyan)"
              data-badge="true"
            />
            <text
              x={0}
              y={8}
              textAnchor="middle"
              fill="#38BDF8"
              fontSize={30}
              fontWeight={900}
              letterSpacing="0.04em"
            >
              BẢN THẢO (MANUSCRIPT)
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

export const KnowledgeConstellation = KnowledgeConstellationMechanism;
