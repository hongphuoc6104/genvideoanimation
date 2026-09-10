import React from 'react';
import { THEME } from './DesignTokens';

export interface PVDiagramProps {
  cycleProgress: number; // 0 to 1 through the 4-phase cycle
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export interface PVPointResult {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
  p4: { x: number; y: number };
  pCtrl: { x: number; y: number };
  p3Bottom: { x: number; y: number };
  tracerX: number;
  tracerY: number;
  phaseLabel: string;
}

export function calculatePVPoint(
  cycleProgress: number,
  originX: number = 90,
  originY: number = 360
): PVPointResult {
  // Key thermodynamic cycle coordinates in SVG space
  const p1 = { x: originX + 50, y: originY - 240 };
  const p2 = { x: originX + 140, y: originY - 240 };
  const p3 = { x: originX + 320, y: originY - 90 };
  const p4 = { x: originX + 50, y: originY - 40 };

  const pCtrl = { x: originX + 220, y: originY - 180 };
  const p3Bottom = { x: p3.x, y: p4.y };

  let tracerX = p1.x;
  let tracerY = p1.y;
  let phaseLabel = 'Pha 1: Nạp hơi cao áp vào xi-lanh';

  if (cycleProgress < 0.25) {
    const t = cycleProgress / 0.25;
    tracerX = p1.x + t * (p2.x - p1.x);
    tracerY = p1.y;
    phaseLabel = 'Pha 1: Nạp hơi cao áp (P cao, giãn nở)';
  } else if (cycleProgress < 0.60) {
    const t = (cycleProgress - 0.25) / 0.35;
    const invT = 1 - t;
    tracerX = invT * invT * p2.x + 2 * invT * t * pCtrl.x + t * t * p3.x;
    tracerY = invT * invT * p2.y + 2 * invT * t * pCtrl.y + t * t * p3.y;
    phaseLabel = 'Pha 2: Giãn nở đoạn nhiệt sinh công hữu ích';
  } else if (cycleProgress < 0.75) {
    const t = (cycleProgress - 0.60) / 0.15;
    tracerX = p3.x;
    tracerY = p3.y + t * (p3Bottom.y - p3.y);
    phaseLabel = 'Pha 3: Xả hơi sang bình ngưng riêng';
  } else if (cycleProgress < 0.90) {
    const t = (cycleProgress - 0.75) / 0.15;
    tracerX = p3Bottom.x - t * (p3Bottom.x - p4.x);
    tracerY = p4.y;
    phaseLabel = 'Pha 4: Hơi ngưng tụ tạo chân không hồi lưu';
  } else {
    const t = (cycleProgress - 0.90) / 0.10;
    tracerX = p4.x;
    tracerY = p4.y - t * (p4.y - p1.y);
    phaseLabel = 'Chu trình khép kín: Bắt đầu nạp hơi mới';
  }

  return { p1, p2, p3, p4, pCtrl, p3Bottom, tracerX, tracerY, phaseLabel };
}

export const PVDiagram: React.FC<PVDiagramProps> = ({
  cycleProgress,
  width = 520,
  height = 480,
  showLabels = true,
}) => {
  const originX = 90;
  const originY = 360;
  const axisLengthX = 360;
  const axisLengthY = 280;

  const { p1, p2, p3, p4, pCtrl, p3Bottom, tracerX, tracerY, phaseLabel } = calculatePVPoint(
    cycleProgress,
    originX,
    originY
  );

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="pvWorkArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.25" />
          </linearGradient>

          <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. COORDINATE AXES (P vs V) */}
        <g id="pv-axes">
          {/* Y-Axis: Pressure P */}
          <line
            x1={originX}
            y1={originY}
            x2={originX}
            y2={originY - axisLengthY}
            stroke="#94A3B8"
            strokeWidth={3}
          />
          {/* Y-Axis Arrow */}
          <polygon
            points={`${originX - 6},${originY - axisLengthY + 4} ${originX + 6},${originY - axisLengthY + 4} ${originX},${originY - axisLengthY - 10}`}
            fill="#94A3B8"
          />
          <text
            x={originX - 24}
            y={originY - axisLengthY + 12}
            textAnchor="middle"
            fill={THEME.colors.steamHot}
            fontSize={THEME.typography.cardTitle}
            fontWeight="bold"
          >
            P
          </text>

          {/* X-Axis: Volume V */}
          <line
            x1={originX}
            y1={originY}
            x2={originX + axisLengthX}
            y2={originY}
            stroke="#94A3B8"
            strokeWidth={3}
          />
          {/* X-Axis Arrow */}
          <polygon
            points={`${originX + axisLengthX - 4},${originY - 6} ${originX + axisLengthX - 4},${originY + 6} ${originX + axisLengthX + 10},${originY}`}
            fill="#94A3B8"
          />
          <text
            x={originX + axisLengthX + 16}
            y={originY + 10}
            textAnchor="start"
            fill={THEME.colors.condenserCold}
            fontSize={THEME.typography.cardTitle}
            fontWeight="bold"
          >
            V
          </text>
        </g>

        {/* 2. ENCLOSED WORK AREA (Useful Work W = \oint P dV) */}
        <g id="work-area">
          <path
            d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Q ${originX + 220} ${originY - 180}, ${p3.x} ${p3.y} L ${originX + 320} ${p4.y} L ${p4.x} ${p4.y} Z`}
            fill="url(#pvWorkArea)"
            stroke="#F59E0B"
            strokeWidth={3}
          />
          <text
            x={originX + 175}
            y={originY - 140}
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize={THEME.typography.cardTitle}
            fontWeight="bold"
          >
            CÔNG HỮU ÍCH (W)
          </text>
          <text
            data-role="secondary"
            x={originX + 175}
            y={originY - 100}
            textAnchor="middle"
            fill="#FDE68A"
            fontSize={THEME.typography.secondary}
          >
            W = ∮ P dV
          </text>
        </g>

        {/* 3. CYCLE TRANSITION ARROWS */}
        <g id="cycle-arrows" stroke="#F97316" strokeWidth={2} fill="none">
          {/* 1 -> 2 arrow */}
          <line x1={p1.x + 20} y1={p1.y} x2={p2.x - 20} y2={p2.y} strokeDasharray="4 2" />
          {/* 2 -> 3 expansion */}
          <path d={`M ${p2.x} ${p2.y} Q ${originX + 220} ${originY - 180}, ${p3.x} ${p3.y}`} stroke="#EF4444" strokeWidth={3} />
          {/* 3 -> 4 exhaust */}
          <line x1={p3.x} y1={p3.y} x2={originX + 320} y2={p4.y} stroke="#06B6D4" strokeWidth={3} />
        </g>

        {/* 4. CURRENT STATE TRACER POINT */}
        <g id="state-tracer" filter="url(#pointGlow)">
          <circle cx={tracerX} cy={tracerY} r={10} fill="#FFF" stroke="#EF4444" strokeWidth={4} />
          <circle cx={tracerX} cy={tracerY} r={16} fill="none" stroke="#F59E0B" strokeWidth={2} opacity={0.6} />
        </g>

        {/* 5. CURRENT PHASE BANNER */}
        {showLabels && (
          <g id="phase-banner" transform={`translate(${originX + 20}, ${originY + 54})`}>
            <rect x={0} y={0} width={340} height={46} rx={8} fill="#1E293B" stroke="#334155" strokeWidth={2} />
            <text
              data-role="secondary"
              x={170}
              y={30}
              textAnchor="middle"
              fill={THEME.colors.textPrimary}
              fontSize={THEME.typography.secondary}
              fontWeight="600"
            >
              {phaseLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
