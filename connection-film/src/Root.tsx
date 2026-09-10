import React from 'react';
import { Composition } from 'remotion';
import { RemotionRootLegacy } from './RootLegacy';
import { SodiumPotassiumPumpFilm, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from './projects/sodium-potassium-pump';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Canonical Production Project: Sodium-Potassium Pump */}
      <Composition
        id="SodiumPotassiumPump-TikTok916"
        component={SodiumPotassiumPumpFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Legacy Regression Compositions mounted under isolated IDs */}
      <RemotionRootLegacy />
    </>
  );
};
