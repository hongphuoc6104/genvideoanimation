import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { LipidBilayer } from '../components/LipidBilayer';
import { SodiumPotassiumPumpRig } from '../components/SodiumPotassiumPumpRig';
import { IonParticle } from '../components/IonParticle';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene1ElectrochemicalGradient: React.FC<SceneProps> = ({
  durationInFrames = 294,
  shotBeats = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { currentBeatIndex } = useBeatChoreography(shotBeats);

  // Entrance spring for full-bleed kinetic canvas
  const canvasEntrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Beat 0: Resting potential & passive leak
  // Beat 1: Alternating access pump introduction
  const isBeat2 = currentBeatIndex >= 1;

  // Passive leak arrow animation during Beat 1
  const leakOffset = (frame * 3) % 100;

  // Pump appearance in Beat 2
  const pumpEntrance = isBeat2
    ? spring({
        frame: frame - 147,
        fps,
        config: { damping: 12, stiffness: 90 },
      })
    : 0;

  // Demonstrative alternation in Beat 2 (cycles between E1 and E2)
  const alternatingProgress = isBeat2
    ? 0.5 + 0.5 * Math.sin((frame - 147) * 0.08)
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
      {/* 
        FULL-BLEED KINETIC CANVAS [0, 0, 1080, 1920]
        Zero slide titles, zero status ribbons. Pure Kurzgesagt visual mechanics.
      */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: canvasEntrance,
        }}
      >
        {/* Phospholipid Bilayer Canvas centered vertically at y = 820 */}
        <LipidBilayer
          membraneY={820}
          thickness={160}
          width={1080}
          pumpGapWidth={isBeat2 ? 340 : 0}
          pumpGapX={540}
          showLabels={true}
          restingPotential={-70}
        />

        {/* Extracellular High Na+ Cloud (Top Region: y in [240, 680]) */}
        <IonParticle type="na" x={140} y={320} scale={1.1} />
        <IonParticle type="na" x={280} y={420} scale={1.0} />
        <IonParticle type="na" x={420} y={300} scale={1.15} />
        <IonParticle type="na" x={620} y={360} scale={1.05} />
        <IonParticle type="na" x={800} y={310} scale={1.1} />
        <IonParticle type="na" x={940} y={430} scale={1.0} />
        <IonParticle type="k" x={920} y={260} scale={0.85} opacity={0.6} />

        {/* Cytoplasm High K+ Cloud (Bottom Region: y in [980, 1420]) */}
        <IonParticle type="k" x={160} y={1180} scale={1.2} />
        <IonParticle type="k" x={320} y={1100} scale={1.05} />
        <IonParticle type="k" x={480} y={1220} scale={1.15} />
        <IonParticle type="k" x={680} y={1120} scale={1.1} />
        <IonParticle type="k" x={860} y={1200} scale={1.2} />
        <IonParticle type="na" x={930} y={1120} scale={0.8} opacity={0.6} />

        {/* Passive Leak Flux Warning Vectors during Beat 1 */}
        {!isBeat2 && (
          <g transform="translate(540, 820)">
            {/* Leaking Na+ rushing inwards */}
            <g transform="translate(-160, 0)">
              <path
                d={`M 0 -200 L 0 180`}
                stroke="#EF4444"
                strokeWidth={5}
                strokeDasharray="14,10"
                strokeDashoffset={-leakOffset}
              />
              <polygon points="0,200 -12,165 12,165" fill="#EF4444" />
              <circle cx={0} cy={-220} r={32} fill="#EF4444" />
              <text
                x={0}
                y={-208}
                fill="#FFF"
                fontSize={30}
                fontWeight={900}
                textAnchor="middle"
              >
                Na⁺
              </text>
              <text
                x={0}
                y={-110}
                fill="#FCA5A5"
                fontSize={30}
                fontWeight={800}
                textAnchor="middle"
              >
                Rò Rỉ Vào Trong
              </text>
            </g>

            {/* Leaking K+ diffusing outwards */}
            <g transform="translate(160, 0)">
              <path
                d={`M 0 180 L 0 -200`}
                stroke="#A855F7"
                strokeWidth={5}
                strokeDasharray="14,10"
                strokeDashoffset={-leakOffset}
              />
              <polygon points="0,-220 -12,-185 12,-185" fill="#A855F7" />
              <circle cx={0} cy={200} r={32} fill="#A855F7" />
              <text
                x={0}
                y={212}
                fill="#FFF"
                fontSize={30}
                fontWeight={900}
                textAnchor="middle"
              >
                K⁺
              </text>
              <text
                x={0}
                y={130}
                fill="#E9D5FF"
                fontSize={30}
                fontWeight={800}
                textAnchor="middle"
              >
                Khuếch Tán Ra Ngoài
              </text>
            </g>
          </g>
        )}

        {/* Beat 2: Sodium Potassium Pump Rig enters and toggles E1 <-> E2 */}
        {isBeat2 && (
          <g
            opacity={pumpEntrance}
            transform={`scale(${interpolate(pumpEntrance, [0, 1], [0.85, 1.0])})`}
            style={{ transformOrigin: '540px 820px' }}
          >
            <SodiumPotassiumPumpRig
              frame={frame}
              cx={540}
              cy={820}
              e1ToE2Progress={alternatingProgress}
              isPhosphorylated={false}
              scale={1.25}
            />

            {/* Kinetic Anchor Label indicating alternating mechanism state with smooth crossfade */}
            <g transform="translate(540, 560)">
              <text
                x={0}
                y={0}
                fill="#93C5FD"
                fontSize={36}
                fontWeight={800}
                textAnchor="middle"
                letterSpacing="0.05em"
                opacity={interpolate(alternatingProgress, [0.35, 0.65], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
              >
                TRẠNG THÁI E1 (MỞ VÀO TRONG)
              </text>
              <text
                x={0}
                y={0}
                fill="#93C5FD"
                fontSize={36}
                fontWeight={800}
                textAnchor="middle"
                letterSpacing="0.05em"
                opacity={interpolate(alternatingProgress, [0.35, 0.65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
              >
                TRẠNG THÁI E2 (MỞ RA NGOÀI)
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
