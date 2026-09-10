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

  const { currentBeatIndex, beatProgress: intraBeatProgress } = useBeatChoreography(shotBeats);

  // Entrance spring for central canvas
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
          {isBeat2 ? 'Mô Hình Van Luân Phiên' : 'Nghịch Lý Điện Sinh Học'}
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
          {isBeat2 ? 'Cơ Chế Van Đổi Hướng E1 ⇄ E2' : 'Duy Trì Điện Thế Nghỉ -70 mV'}
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
          opacity: canvasEntrance,
          transform: `scale(${interpolate(canvasEntrance, [0, 1], [0.92, 1.0])})`,
        }}
      >
        <svg width="920" height="980" viewBox="0 0 920 980">
          {/* Phospholipid Bilayer Canvas */}
          <LipidBilayer
            membraneY={520}
            thickness={140}
            width={920}
            pumpGapWidth={isBeat2 ? 300 : 0}
            pumpGapX={460}
            showLabels={true}
            restingPotential={-70}
          />

          {/* Random background ion cloud demonstrating concentration gradients */}
          {/* Extracellular High Na+ (Top region) */}
          <IonParticle type="na" x={120} y={160} scale={0.9} />
          <IonParticle type="na" x={240} y={220} scale={0.85} />
          <IonParticle type="na" x={380} y={150} scale={1.0} />
          <IonParticle type="na" x={540} y={190} scale={0.9} />
          <IonParticle type="na" x={700} y={140} scale={0.95} />
          <IonParticle type="na" x={820} y={230} scale={0.85} />
          <IonParticle type="k" x={830} y={120} scale={0.75} opacity={0.6} />

          {/* Cytoplasm High K+ (Bottom region) */}
          <IonParticle type="k" x={140} y={820} scale={1.0} />
          <IonParticle type="k" x={280} y={760} scale={0.9} />
          <IonParticle type="k" x={420} y={840} scale={0.95} />
          <IonParticle type="k" x={600} y={780} scale={0.9} />
          <IonParticle type="k" x={740} y={850} scale={1.0} />
          <IonParticle type="na" x={820} y={790} scale={0.7} opacity={0.6} />

          {/* Passive Leak Flux Warning Vectors during Beat 1 */}
          {!isBeat2 && (
            <g transform="translate(460, 520)">
              {/* Leaking Na+ rushing inwards */}
              <g transform="translate(-140, 0)">
                <path
                  d={`M 0 -160 L 0 140`}
                  stroke="#EF4444"
                  strokeWidth={5}
                  strokeDasharray="10 8"
                  strokeDashoffset={-leakOffset}
                />
                <polygon points="-12,130 12,130 0,160" fill="#EF4444" />
                <rect
                  x={-160}
                  y={-40}
                  width={320}
                  height={50}
                  rx={16}
                  fill="rgba(239, 68, 68, 0.25)"
                  stroke="#EF4444"
                  strokeWidth={2}
                />
                <text
                  x={0}
                  y={-5}
                  fill="#FCA5A5"
                  fontSize={32}
                  fontWeight={800}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  Na⁺ Rò Rỉ Vào Trong
                </text>
              </g>

              {/* Leaking K+ rushing outwards */}
              <g transform="translate(140, 0)">
                <path
                  d={`M 0 160 L 0 -140`}
                  stroke="#A855F7"
                  strokeWidth={5}
                  strokeDasharray="10 8"
                  strokeDashoffset={-leakOffset}
                />
                <polygon points="-12,-130 12,-130 0,-160" fill="#A855F7" />
                <rect
                  x={-160}
                  y={10}
                  width={320}
                  height={50}
                  rx={16}
                  fill="rgba(168, 85, 247, 0.25)"
                  stroke="#A855F7"
                  strokeWidth={2}
                />
                <text
                  x={0}
                  y={45}
                  fill="#E9D5FF"
                  fontSize={32}
                  fontWeight={800}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  K⁺ Khuếch Tán Ra Ngoài
                </text>
              </g>
            </g>
          )}

          {/* Beat 2: Sodium Potassium Pump Rig enters and toggles E1 <-> E2 */}
          {isBeat2 && (
            <g
              opacity={pumpEntrance}
              transform={`scale(${interpolate(pumpEntrance, [0, 1], [0.8, 1.0])})`}
              style={{ transformOrigin: '460px 520px' }}
            >
              <SodiumPotassiumPumpRig
                frame={frame}
                cx={460}
                cy={520}
                e1ToE2Progress={alternatingProgress}
                isPhosphorylated={alternatingProgress > 0.5}
                scale={1.05}
              />
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
            backgroundColor: isBeat2 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: isBeat2 ? '2px solid #3B82F6' : '2px solid #EF4444',
            borderRadius: 30,
            padding: '12px 32px',
            color: isBeat2 ? '#93C5FD' : '#FCA5A5',
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          {isBeat2
            ? 'Cơ Chế: Van Đổi Hướng Không Bao Giờ Mở Thông Hai Phía'
            : 'Nguy Cơ: Gradient Sụp Đổ Do Khuếch Tán Thụ Động'}
        </div>
      </div>

      {/* Tầng 4: Karaoke Subtitles [y: 1420 - 1750px] - Rendered by Root Composition */}
    </div>
  );
};
