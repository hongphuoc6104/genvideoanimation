import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { LipidBilayer } from '../components/LipidBilayer';
import { SodiumPotassiumPumpRig } from '../components/SodiumPotassiumPumpRig';
import { IonParticle } from '../components/IonParticle';
import { ATPMechanism } from '../components/ATPMechanism';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene2ConformationalCycle: React.FC<SceneProps> = ({
  durationInFrames = 615,
  shotBeats = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { currentBeatIndex, beatProgress: intraBeatProgress } = useBeatChoreography(shotBeats);

  // Beat 0: Beat 3 (b03: Na+ binding + ATP phosphorylation)
  // Beat 1: Beat 4 (b04: E1 -> E2 morph + 3 Na+ extrusion)
  // Beat 2: Beat 5 (b05: 2 K+ binding + dephosphorylation)
  // Beat 3: Beat 6 (b06: E2 -> E1 morph + 2 K+ cytoplasm release)

  // Stage 1: Beat 0 (b03)
  // 3 Na+ dock into pump, ATP docks and hydrolyzes
  const naDockProgress = currentBeatIndex === 0 ? intraBeatProgress : 1.0;
  const atpHydrolysis = currentBeatIndex === 0
    ? interpolate(intraBeatProgress, [0.4, 0.9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : currentBeatIndex === 1
    ? 1.0
    : 0.0;

  // Stage 2: Beat 1 (b04)
  // Morph from E1 to E2
  const e1ToE2 = currentBeatIndex === 0
    ? 0.0
    : currentBeatIndex === 1
    ? interpolate(intraBeatProgress, [0.1, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : currentBeatIndex === 2
    ? 1.0
    : interpolate(intraBeatProgress, [0.1, 0.6], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Na+ extrusion into extracellular space during Beat 1
  const naExtrudeProgress = currentBeatIndex === 1
    ? interpolate(intraBeatProgress, [0.5, 0.95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : currentBeatIndex > 1
    ? 1.0
    : 0.0;

  // Stage 3: Beat 2 (b05)
  // 2 K+ docking into outward-facing E2 pump
  const kDockProgress = currentBeatIndex < 2
    ? 0.0
    : currentBeatIndex === 2
    ? interpolate(intraBeatProgress, [0.05, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1.0;

  // Dephosphorylation progress during Beat 2
  const dephosphorylationProgress = currentBeatIndex === 2
    ? interpolate(intraBeatProgress, [0.5, 0.95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : currentBeatIndex > 2
    ? 1.0
    : 0.0;

  // Stage 4: Beat 3 (b06)
  // K+ release into cytoplasm
  const kReleaseProgress = currentBeatIndex === 3
    ? interpolate(intraBeatProgress, [0.5, 0.95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0.0;

  // Compute phosphorylation flag
  const isPhosphorylated =
    (currentBeatIndex === 0 && intraBeatProgress >= 0.7) ||
    currentBeatIndex === 1 ||
    (currentBeatIndex === 2 && intraBeatProgress < 0.6);

  // Compute bound ion counts
  const boundNaCount =
    currentBeatIndex === 0
      ? Math.min(3, Math.floor(naDockProgress * 3.5))
      : currentBeatIndex === 1
      ? Math.max(0, 3 - Math.floor(naExtrudeProgress * 3.5))
      : 0;

  const boundKCount =
    currentBeatIndex === 2
      ? Math.min(2, Math.floor(kDockProgress * 2.5))
      : currentBeatIndex === 3
      ? Math.max(0, 2 - Math.floor(kReleaseProgress * 2.5))
      : 0;

  // Dynamic Phase Title and Badge
  let phaseTitle = 'Pha 1 & 2: Gắn Na⁺ & Phosphoryl Hóa';
  let phaseSub = 'Ba ion Na⁺ gắn kết, ATP cung cấp năng lượng';
  let statusText = 'Trạng thái E1: Ái lực Na⁺ cao, mở vào trong';

  if (currentBeatIndex === 1) {
    phaseTitle = 'Pha 3: Đổi Hình Thể E1 ➔ E2';
    phaseSub = 'Lật mở ra ngoài, giải phóng ba ion Na⁺';
    statusText = 'Trạng thái E2-P: Ái lực Na⁺ giảm mạnh, đẩy Na⁺ ra ngoại bào';
  } else if (currentBeatIndex === 2) {
    phaseTitle = 'Pha 4 & 5: Gắn K⁺ & Khử Phosphoryl';
    phaseSub = 'Hai ion K⁺ gắn vào, kích hoạt nhả gốc phosphate';
    statusText = 'Trạng thái E2: Ái lực K⁺ cao, giải phóng Pi tự do';
  } else if (currentBeatIndex === 3) {
    phaseTitle = 'Pha 6: Hồi Phục E2 ➔ E1';
    phaseSub = 'Bơm lật về trong, giải phóng hai ion K⁺';
    statusText = 'Trạng thái E1: Bơm trở về ban đầu, sẵn sàng chu trình mới';
  }

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
      {/* Tầng 1: Title Header [y: 120 - 280px] */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 80,
          right: 80,
          textAlign: 'center',
        }}
      >
        <div
          data-role="section"
          style={{
            display: 'inline-block',
            padding: '10px 28px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '2px solid #3B82F6',
            borderRadius: 24,
            color: '#60A5FA',
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          {phaseTitle}
        </div>
        <h1
          style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          {phaseSub}
        </h1>
      </div>

      {/* Tầng 2: Central Visual Canvas [y: 300 - 1320px] */}
      <div
        style={{
          position: 'absolute',
          top: 310,
          left: 80,
          width: 920,
          height: 980,
        }}
      >
        <svg width="920" height="980" viewBox="0 0 920 980">
          {/* Phospholipid Bilayer */}
          <LipidBilayer
            membraneY={520}
            thickness={140}
            width={920}
            pumpGapWidth={300}
            pumpGapX={460}
            showLabels={false}
          />

          {/* Central Na+/K+-ATPase Pump Rig */}
          <SodiumPotassiumPumpRig
            frame={frame}
            cx={460}
            cy={520}
            e1ToE2Progress={e1ToE2}
            isPhosphorylated={isPhosphorylated}
            boundNaCount={boundNaCount}
            boundKCount={boundKCount}
            scale={1.1}
          />

          {/* Incoming Na+ Ions (Moving from Cytoplasm into Pump in Beat 0) */}
          {currentBeatIndex === 0 && naDockProgress < 0.9 && (
            <g>
              <IonParticle
                type="na"
                x={interpolate(naDockProgress, [0, 0.8], [280, 425])}
                y={interpolate(naDockProgress, [0, 0.8], [880, 545])}
                scale={interpolate(naDockProgress, [0, 0.8], [1.1, 0.95])}
              />
              <IonParticle
                type="na"
                x={interpolate(naDockProgress, [0.1, 0.85], [460, 460])}
                y={interpolate(naDockProgress, [0.1, 0.85], [890, 510])}
                scale={interpolate(naDockProgress, [0.1, 0.85], [1.1, 0.95])}
              />
              <IonParticle
                type="na"
                x={interpolate(naDockProgress, [0.2, 0.9], [640, 495])}
                y={interpolate(naDockProgress, [0.2, 0.9], [880, 545])}
                scale={interpolate(naDockProgress, [0.2, 0.9], [1.1, 0.95])}
              />
            </g>
          )}

          {/* Extruding Na+ Ions (Moving from Pump out to Extracellular in Beat 1) */}
          {currentBeatIndex === 1 && naExtrudeProgress > 0.1 && (
            <g opacity={interpolate(naExtrudeProgress, [0.1, 0.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
              <IonParticle
                type="na"
                x={interpolate(naExtrudeProgress, [0.1, 0.9], [425, 260])}
                y={interpolate(naExtrudeProgress, [0.1, 0.9], [480, 160])}
                scale={1.0}
              />
              <IonParticle
                type="na"
                x={interpolate(naExtrudeProgress, [0.15, 0.95], [460, 460])}
                y={interpolate(naExtrudeProgress, [0.15, 0.95], [460, 130])}
                scale={1.0}
              />
              <IonParticle
                type="na"
                x={interpolate(naExtrudeProgress, [0.2, 1.0], [495, 660])}
                y={interpolate(naExtrudeProgress, [0.2, 1.0], [480, 160])}
                scale={1.0}
              />
            </g>
          )}

          {/* Incoming K+ Ions (Moving from Extracellular into E2 Pump in Beat 2) */}
          {currentBeatIndex === 2 && kDockProgress < 0.9 && (
            <g opacity={interpolate(intraBeatProgress, [0, 0.08], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
              <IonParticle
                type="k"
                x={interpolate(kDockProgress, [0, 0.8], [320, 430])}
                y={interpolate(kDockProgress, [0, 0.8], [150, 500])}
                scale={interpolate(kDockProgress, [0, 0.8], [1.1, 0.95])}
              />
              <IonParticle
                type="k"
                x={interpolate(kDockProgress, [0.1, 0.85], [600, 490])}
                y={interpolate(kDockProgress, [0.1, 0.85], [150, 500])}
                scale={interpolate(kDockProgress, [0.1, 0.85], [1.1, 0.95])}
              />
            </g>
          )}

          {/* Discharging K+ Ions (Moving from Pump into Cytoplasm in Beat 3) */}
          {currentBeatIndex === 3 && kReleaseProgress > 0.1 && (
            <g opacity={interpolate(kReleaseProgress, [0.1, 0.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
              <IonParticle
                type="k"
                x={interpolate(kReleaseProgress, [0.1, 0.9], [430, 300])}
                y={interpolate(kReleaseProgress, [0.1, 0.9], [540, 860])}
                scale={1.0}
              />
              <IonParticle
                type="k"
                x={interpolate(kReleaseProgress, [0.15, 0.95], [490, 620])}
                y={interpolate(kReleaseProgress, [0.15, 0.95], [540, 860])}
                scale={1.0}
              />
            </g>
          )}

          {/* ATP Hydrolysis Machinery during Beat 0 */}
          {currentBeatIndex === 0 && (
            <g transform="translate(480, 720)">
              <ATPMechanism
                x={0}
                y={0}
                hydrolysisProgress={atpHydrolysis}
                scale={0.9}
              />
            </g>
          )}

          {/* Dephosphorylation Pi release during Beat 2 */}
          {currentBeatIndex === 2 && dephosphorylationProgress > 0.1 && (
            <g
              transform={`translate(${interpolate(dephosphorylationProgress, [0.1, 0.9], [560, 720])}, ${interpolate(dephosphorylationProgress, [0.1, 0.9], [640, 780])})`}
              opacity={interpolate(dephosphorylationProgress, [0.1, 0.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            >
              <circle cx={0} cy={0} r={24} fill="#EF4444" stroke="#FCA5A5" strokeWidth={3} />
              <text x={0} y={9} fill="#FFF" fontSize={30} fontWeight={900} textAnchor="middle">
                Pi
              </text>
              <text x={0} y={44} fill="#FCA5A5" fontSize={30} fontWeight={800} textAnchor="middle">
                (Pi tự do)
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Tầng 3: Status Ribbon [y: 1330 - 1410px] */}
      <div
        style={{
          position: 'absolute',
          top: 1340,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10B981',
            borderRadius: 30,
            padding: '12px 32px',
            color: '#6EE7B7',
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          {statusText}
        </div>
      </div>

      {/* Tầng 4: Karaoke Subtitles [y: 1420 - 1750px] - Rendered by Root Composition */}
    </div>
  );
};
