import React from 'react';
import { Composition } from 'remotion';
import { RemotionRootLegacy } from './RootLegacy';
import { SodiumPotassiumPumpFilm, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from './projects/sodium-potassium-pump';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Canonical Production Project: Sodium-Potassium Pump (Option 2: Minimalist Semantic HUD - Chosen Canonical Standard) */}
      <Composition
        id="SodiumPotassiumPump-TikTok916"
        component={SodiumPotassiumPumpFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ enableMicroHUD: true }}
      />

      {/* Standalone Variant: Option 1 (The Pure Immersive Kinetic Standard) */}
      <Composition
        id="SodiumPotassiumPump-Immersive"
        component={SodiumPotassiumPumpFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ enableMicroHUD: false }}
      />

      {/* Legacy Regression Compositions mounted under isolated IDs */}
      <RemotionRootLegacy />
    </>
  );
};
