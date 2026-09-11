import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { LipidBilayer } from '../components/LipidBilayer';
import { IonParticle } from '../components/IonParticle';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3ElectrogenicSynthesis: React.FC<SceneProps> = ({
  durationInFrames = 159,
  shotBeats = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { beatProgress: intraBeatProgress } = useBeatChoreography(shotBeats);

  // Entrance spring for scene
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  // Kinetic pulse for the -70mV potential
  const pulse = 1.0 + 0.04 * Math.sin(frame * 0.15);

  // Moving Na+ ions (3 Na+ moving upward from membrane into extracellular)
  const naY1 = interpolate(frame % 60, [0, 60], [660, 360]);
  const naY2 = interpolate((frame + 20) % 60, [0, 60], [660, 320]);
  const naY3 = interpolate((frame + 40) % 60, [0, 60], [660, 360]);

  // Moving K+ ions (2 K+ moving downward from membrane into cytoplasm)
  const kY1 = interpolate(frame % 60, [0, 60], [740, 1020]);
  const kY2 = interpolate((frame + 30) % 60, [0, 60], [740, 1020]);

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
          opacity: entrance,
        }}
      >
        {/* Continuous Phospholipid Bilayer across center at y = 700 */}
        <LipidBilayer
          membraneY={700}
          thickness={120}
          width={1080}
          pumpGapWidth={260}
          pumpGapX={540}
          showLabels={false}
        />

        {/* Central Pump Channel Core Silhouette */}
        <path
          d="M 430 640 C 470 680, 470 720, 430 760 L 470 760 C 495 725, 495 675, 470 640 Z"
          fill="#1E3A8A"
          stroke="#60A5FA"
          strokeWidth={3}
        />
        <path
          d="M 650 640 C 610 680, 610 720, 650 760 L 610 760 C 585 725, 585 675, 610 640 Z"
          fill="#1E3A8A"
          stroke="#60A5FA"
          strokeWidth={3}
        />

        {/* 1. Extracellular Region: +3 Na+ Efflux Dynamic Field */}
        <g>
          {/* Ambient Na+ Cloud */}
          <IonParticle type="na" x={160} y={320} scale={1.05} opacity={0.7} />
          <IonParticle type="na" x={920} y={340} scale={1.05} opacity={0.7} />

          {/* Active Extruding 3 Na+ with golden vectors */}
          <IonParticle type="na" x={380} y={naY1} scale={1.15} />
          <IonParticle type="na" x={540} y={naY2} scale={1.2} />
          <IonParticle type="na" x={700} y={naY3} scale={1.15} />

          {/* Dynamic Vector Lines pointing upward */}
          <line x1={380} y1={640} x2={380} y2={280} stroke="#F59E0B" strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={-frame * 3} />
          <polygon points="380,260 370,285 390,285" fill="#F59E0B" />

          <line x1={540} y1={640} x2={540} y2={240} stroke="#F59E0B" strokeWidth={5} strokeDasharray="10 8" strokeDashoffset={-frame * 3} />
          <polygon points="540,220 530,245 550,245" fill="#F59E0B" />

          <line x1={700} y1={640} x2={700} y2={280} stroke="#F59E0B" strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={-frame * 3} />
          <polygon points="700,260 690,285 710,285" fill="#F59E0B" />

          {/* Dynamic Action Heading: Not a card, an explanatory kinetic label */}
          <text
            x={540}
            y={160}
            fill="#FCD34D"
            fontSize={44}
            fontWeight={900}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            3 Na⁺ ĐẨY RA NGOÀI
          </text>
          <text
            x={540}
            y={205}
            fill="#FDE68A"
            fontSize={32}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            +3 Điện tích dương thoát khỏi tế bào
          </text>
        </g>

        {/* 2. Cytoplasm Region: +2 K+ Influx Dynamic Field */}
        <g>
          {/* Ambient K+ Cloud */}
          <IonParticle type="k" x={160} y={960} scale={1.1} opacity={0.7} />
          <IonParticle type="k" x={920} y={980} scale={1.1} opacity={0.7} />

          {/* Active Inflowing 2 K+ with purple vectors */}
          <IonParticle type="k" x={450} y={kY1} scale={1.2} />
          <IonParticle type="k" x={630} y={kY2} scale={1.2} />

          {/* Dynamic Vector Lines pointing downward */}
          <line x1={450} y1={760} x2={450} y2={1060} stroke="#8B5CF6" strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={frame * 3} />
          <polygon points="450,1080 440,1055 460,1055" fill="#8B5CF6" />

          <line x1={630} y1={760} x2={630} y2={1060} stroke="#8B5CF6" strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={frame * 3} />
          <polygon points="630,1080 620,1055 640,1055" fill="#8B5CF6" />

          {/* Dynamic Action Heading */}
          <text
            x={540}
            y={1150}
            fill="#C4B5FD"
            fontSize={44}
            fontWeight={900}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            2 K⁺ HÚT VÀO TRONG
          </text>
          <text
            x={540}
            y={1195}
            fill="#DDD6FE"
            fontSize={32}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Chỉ nhận lại +2 điện tích dương
          </text>
        </g>

        {/* 3. Central Dynamic Electrogenic Balance & Voltmeter */}
        <g
          transform={`translate(540, 1340) scale(${pulse})`}
          style={{ transformOrigin: '540px 1340px' }}
        >
          {/* Glowing Digital Capacitor Gauge */}
          <rect
            x={-340}
            y={-65}
            width={680}
            height={130}
            rx={36}
            fill="#064E3B"
            stroke="#34D399"
            strokeWidth={3.5}
          />
          <text
            x={0}
            y={-10}
            fill="#6EE7B7"
            fontSize={30}
            fontWeight={800}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            MẤT RÒNG 1 ĐIỆN TÍCH DƯƠNG (-1e)
          </text>
          <text
            x={0}
            y={42}
            fill="#FFFFFF"
            fontSize={52}
            fontWeight={900}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            ĐIỆN THẾ NGHỈ: -70 mV
          </text>
        </g>
      </svg>
    </div>
  );
};
