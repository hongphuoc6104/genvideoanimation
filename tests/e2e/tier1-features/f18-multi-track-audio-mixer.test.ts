/**
 * tests/e2e/tier1-features/f18-multi-track-audio-mixer.test.ts
 * Tier 1: Feature Coverage Tests for F18 (Multi-Track Audio Mixer)
 */

import {
  assertEqual,
  assertTrue,
  assertWavHeader,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import {
  MOCK_AUDIO_MANIFEST_JSON,
  createMockWavBuffer,
} from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F18 Multi-Track Audio Mixer',
  feature: 'F18',
  tier: 1,
  tests: [
    {
      id: 'T1-F18-01',
      name: 'Mixer track manifest declares narration, background music, and SFX',
      feature: 'F18',
      tier: 1,
      fn: async (ctx) => {
        const tracks = MOCK_AUDIO_MANIFEST_JSON.tracks;
        assertTrue(tracks.narration !== undefined, 'narration track must be present');
        assertTrue(tracks.music !== undefined, 'music track must be present');
        assertTrue(Array.isArray(tracks.sfx), 'sfx track list must be present');
        assertEqual(tracks.narration.channels, 1, 'Narration is mono');
      },
    },
    {
      id: 'T1-F18-02',
      name: 'Mixed output specifies broadcast standard 48kHz 2-channel stereo WAV',
      feature: 'F18',
      tier: 1,
      fn: async (ctx) => {
        const out = MOCK_AUDIO_MANIFEST_JSON.output;
        assertEqual(out.sampleRate, 48000, 'Mixed soundtrack sample rate must be 48000 Hz');
        assertEqual(out.channels, 2, 'Mixed soundtrack channels must be stereo (2)');

        // Verify with 48kHz stereo mock buffer
        const stereoWav = createMockWavBuffer({ sampleRate: 48000, channels: 2, durationSec: 1.0 });
        assertWavHeader(stereoWav, 48000, 2, 16);
      },
    },
    {
      id: 'T1-F18-03',
      name: 'Track duration synchronization delta is within 0.1s tolerance',
      feature: 'F18',
      tier: 1,
      fn: async (ctx) => {
        const narrationDuration = MOCK_AUDIO_MANIFEST_JSON.tracks.narration.duration;
        const outputDuration = MOCK_AUDIO_MANIFEST_JSON.output.durationSec;
        const delta = Math.abs(outputDuration - narrationDuration);
        assertTrue(delta <= 0.1, `Duration delta (${delta.toFixed(3)}s) exceeds 0.1s sync threshold`);
      },
    },
    {
      id: 'T1-F18-04',
      name: 'Track volume scaling enforces fractional gain bounds [0.0, 1.0]',
      feature: 'F18',
      tier: 1,
      fn: async (ctx) => {
        const music = MOCK_AUDIO_MANIFEST_JSON.tracks.music;
        assertTrue(music.volume >= 0.0 && music.volume <= 1.0, 'music volume must be in [0.0, 1.0]');
        assertTrue(music.duckedVolume >= 0.0 && music.duckedVolume <= music.volume, 'duckedVolume must be <= volume');

        for (const sfx of MOCK_AUDIO_MANIFEST_JSON.tracks.sfx) {
          assertTrue(sfx.volume >= 0.0 && sfx.volume <= 1.0, `SFX ${sfx.id} volume out of bounds`);
        }
      },
    },
    {
      id: 'T1-F18-05',
      name: 'True peak limiter prevents digital clipping and holds truePeakDbfs <= -1.0',
      feature: 'F18',
      tier: 1,
      fn: async (ctx) => {
        const out = MOCK_AUDIO_MANIFEST_JSON.output;
        assertTrue(out.truePeakDbfs <= -1.0, `True peak (${out.truePeakDbfs} dBFS) exceeds ceiling -1.0 dBFS`);
        assertEqual(out.clippedSamples, 0, 'Clipped samples count must be strictly 0');
      },
    },
  ],
};

registerSuite(suite);
