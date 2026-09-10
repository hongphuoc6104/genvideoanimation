import * as path from 'path';
import * as fs from 'fs';
import { mixAudioTracks } from '../packages/narration-kit/src/audio/mixAudio';

const baseDir = path.resolve(__dirname, '../connection-film/src/scopus-explainer/audio');
const manifestPath = path.join(baseDir, 'audio-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const musicFile = path.join(baseDir, manifest.tracks.background.file);
const sfxTracks = manifest.tracks.sfx.map((s: any) => ({
  filePath: path.join(baseDir, s.file),
  startTimeSec: s.timeSec,
  volume: s.volume || 0.75,
}));

const outputPath = path.join(baseDir, 'scopus_master_audio.wav');

console.log('Mixing audio tracks:');
console.log('- Music:', musicFile);
console.log('- SFX tracks count:', sfxTracks.length);

const result = mixAudioTracks({
  musicTrack: {
    filePath: musicFile,
    volume: 0.32,
  },
  sfxTracks,
  targetDurationSec: 80.0,
  outputPath,
});

console.log('Mix complete!');
console.log('Output file:', outputPath);
console.log('Duration:', result.durationSec, 'seconds');
console.log('Integrated Loudness:', result.integratedLoudnessLufs, 'LUFS');
console.log('True Peak:', result.truePeakDbFs, 'dBFS');
console.log('Clipped Samples:', result.clippedSamples);
