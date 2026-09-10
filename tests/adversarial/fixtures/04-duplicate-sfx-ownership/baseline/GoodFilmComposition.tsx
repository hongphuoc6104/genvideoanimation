import React from 'react';
import { Audio, staticFile } from 'remotion';

export const GoodFilmComposition: React.FC = () => {
  return (
    <div>
      {/* COMPLIANT: PREMIXED single ownership mounts exactly 1 master Audio tag */}
      <Audio src={staticFile('audio/scopus_master_audio.wav')} volume={1.0} />
    </div>
  );
};
