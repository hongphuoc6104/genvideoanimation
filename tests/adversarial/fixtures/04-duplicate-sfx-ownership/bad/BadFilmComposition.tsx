import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';

const cues = [{ id: 'c1', frame: 45, soundFx: 'sfx/stamp_reject.wav' }];

export const BadFilmComposition: React.FC = () => {
  return (
    <div>
      {/* Master audio contains mixed narration + SFX */}
      <Audio src={staticFile('audio/scopus_master_audio.wav')} volume={1.0} />
      {/* VIOLATION: Secondary discrete Audio tags mounting SFX already in master */}
      {cues.map((c) => (
        <Sequence key={c.id} from={c.frame} durationInFrames={60}>
          <Audio src={staticFile(c.soundFx)} volume={0.8} />
        </Sequence>
      ))}
    </div>
  );
};
