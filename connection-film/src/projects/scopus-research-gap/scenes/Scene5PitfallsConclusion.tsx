import React from 'react';
import { useBeatChoreography } from 'motion-kit';
import { ScopusMicroHUD } from '../components/ScopusMicroHUD';
import { DiagnosticRadarMechanism } from '../components/DiagnosticRadarMechanism';

export interface SceneProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene5PitfallsConclusion: React.FC<SceneProps> = ({
  durationInFrames = 565,
  shotBeats = [],
}) => {
  const { currentBeatIndex, beatProgress } = useBeatChoreography(shotBeats);

  // Active pitfall check:
  // beat 0 -> Lỗi 1 (idx 0)
  // beat 1 -> Lỗi 2 (idx 1)
  // beat 2 -> Lỗi 3 (idx 2) then Lỗi 4 (idx 3) based on intra-beat progress
  // beat 3+ -> All cleared / Scopus triumph (idx 4)
  const isBeat2SecondHalf = beatProgress > 0.48;
  const activeMistakeIndex =
    currentBeatIndex === 0 ? 0 :
    currentBeatIndex === 1 ? 1 :
    currentBeatIndex === 2 ? (isBeat2SecondHalf ? 3 : 2) : 4;

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        backgroundColor: '#0B1120',
        overflow: 'hidden',
      }}
    >
      {/* Semantic Micro HUD */}
      <ScopusMicroHUD currentSection={5} sectionTitle="CHUẨN HÓA CÔNG BỐ SCOPUS" />

      {/* Primary Kinetic Mechanism: Diagnostic Pitfall Radar & Scopus Victory Badge */}
      <DiagnosticRadarMechanism activeMistakeIndex={activeMistakeIndex} />
    </div>
  );
};
