import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { LipidBilayer } from '../components/LipidBilayer';
import { SodiumPotassiumPumpRig } from '../components/SodiumPotassiumPumpRig';
import { IonParticle } from '../components/IonParticle';
import { ATPMechanism } from '../components/ATPMechanism';
import { PhaseMicroHUD } from '../components/PhaseMicroHUD';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
  enableMicroHUD?: boolean;
}

export const Scene2ConformationalCycle: React.FC<SceneProps> = ({
  durationInFrames = 615,
  shotBeats = [],
  enableMicroHUD = false,
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
      {/* Full-Bleed Kinetic Canvas [0, 0, 1080, 1920] - Zero Slide Headers */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* Phospholipid Bilayer */}
        <LipidBilayer
          membraneY={780}
          thickness={150}
          width={1080}
          pumpGapWidth={340}
          pumpGapX={540}
          showLabels={false}
        />

        {/* Central Na+/K+-ATPase Pump Rig */}
        <SodiumPotassiumPumpRig
          frame={frame}
          cx={540}
          cy={780}
          e1ToE2Progress={e1ToE2}
          isPhosphorylated={isPhosphorylated}
          boundNaCount={boundNaCount}
          boundKCount={boundKCount}
          scale={1.2}
          showStateBadge={false}
        />

        {/* Incoming Na+ Ions (Moving from Cytoplasm into Pump in Beat 0) */}
        {currentBeatIndex === 0 && naDockProgress < 0.9 && (
          <g>
            <IonParticle
              type="na"
              x={interpolate(naDockProgress, [0, 0.8], [340, 505])}
              y={interpolate(naDockProgress, [0, 0.8], [1160, 805])}
              scale={interpolate(naDockProgress, [0, 0.8], [1.1, 0.95])}
            />
            <IonParticle
              type="na"
              x={interpolate(naDockProgress, [0.1, 0.85], [540, 540])}
              y={interpolate(naDockProgress, [0.1, 0.85], [1180, 770])}
              scale={interpolate(naDockProgress, [0.1, 0.85], [1.1, 0.95])}
            />
            <IonParticle
              type="na"
              x={interpolate(naDockProgress, [0.2, 0.9], [740, 575])}
              y={interpolate(naDockProgress, [0.2, 0.9], [1160, 805])}
              scale={interpolate(naDockProgress, [0.2, 0.9], [1.1, 0.95])}
            />
          </g>
        )}

        {/* Extruding Na+ Ions (Moving from Pump out to Extracellular in Beat 1) */}
        {currentBeatIndex === 1 && naExtrudeProgress > 0.1 && (
          <g opacity={interpolate(naExtrudeProgress, [0.1, 0.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
            <IonParticle
              type="na"
              x={interpolate(naExtrudeProgress, [0.1, 0.9], [505, 340])}
              y={interpolate(naExtrudeProgress, [0.1, 0.9], [740, 360])}
              scale={1.0}
            />
            <IonParticle
              type="na"
              x={interpolate(naExtrudeProgress, [0.15, 0.95], [540, 540])}
              y={interpolate(naExtrudeProgress, [0.15, 0.95], [720, 310])}
              scale={1.0}
            />
            <IonParticle
              type="na"
              x={interpolate(naExtrudeProgress, [0.2, 1.0], [575, 740])}
              y={interpolate(naExtrudeProgress, [0.2, 1.0], [740, 360])}
              scale={1.0}
            />
          </g>
        )}

        {/* Incoming K+ Ions (Moving from Extracellular into E2 Pump in Beat 2) */}
        {currentBeatIndex === 2 && kDockProgress < 0.9 && (
          <g opacity={interpolate(intraBeatProgress, [0, 0.08], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
            <IonParticle
              type="k"
              x={interpolate(kDockProgress, [0, 0.8], [380, 505])}
              y={interpolate(kDockProgress, [0, 0.8], [360, 760])}
              scale={interpolate(kDockProgress, [0, 0.8], [1.1, 0.95])}
            />
            <IonParticle
              type="k"
              x={interpolate(kDockProgress, [0.1, 0.85], [700, 575])}
              y={interpolate(kDockProgress, [0.1, 0.85], [360, 760])}
              scale={interpolate(kDockProgress, [0.1, 0.85], [1.1, 0.95])}
            />
          </g>
        )}

        {/* Discharging K+ Ions (Moving from Pump into Cytoplasm in Beat 3) */}
        {currentBeatIndex === 3 && kReleaseProgress > 0.1 && (
          <g opacity={interpolate(kReleaseProgress, [0.1, 0.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
            <IonParticle
              type="k"
              x={interpolate(kReleaseProgress, [0.1, 0.9], [505, 380])}
              y={interpolate(kReleaseProgress, [0.1, 0.9], [800, 1180])}
              scale={1.0}
            />
            <IonParticle
              type="k"
              x={interpolate(kReleaseProgress, [0.15, 0.95], [575, 700])}
              y={interpolate(kReleaseProgress, [0.15, 0.95], [800, 1180])}
              scale={1.0}
            />
          </g>
        )}

        {/* ATP Hydrolysis Machinery during Beat 0 */}
        {currentBeatIndex === 0 && (
          <g transform="translate(540, 1140)">
            <ATPMechanism
              x={0}
              y={0}
              hydrolysisProgress={atpHydrolysis}
              scale={0.95}
            />
          </g>
        )}

        {/* Dephosphorylation Pi release during Beat 2 */}
        {currentBeatIndex === 2 && dephosphorylationProgress > 0.1 && (
          <g
            transform={`translate(${interpolate(dephosphorylationProgress, [0.1, 0.9], [640, 820])}, ${interpolate(dephosphorylationProgress, [0.1, 0.9], [900, 1100])})`}
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

        {/* Minimalist Micro-HUD (Option 2: Active when enabled) */}
        {enableMicroHUD && <PhaseMicroHUD currentPhaseIndex={currentBeatIndex} />}
      </svg>
    </div>
  );
};
