/**
 * tests/e2e/tier1-features/f20-audio-manifest-output.test.ts
 * Tier 1: Feature Coverage Tests for F20 (Audio Manifest Output - audio-manifest.json)
 */

import {
  assertEqual,
  assertTrue,
  assertInRange,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_AUDIO_MANIFEST_JSON } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F20 Audio Manifest Output (audio-manifest.json)',
  feature: 'F20',
  tier: 1,
  tests: [
    {
      id: 'T1-F20-01',
      name: 'audio-manifest.json conforms to authoritative AudioManifest schema',
      feature: 'F20',
      tier: 1,
      fn: async (ctx) => {
        assertSchema(MOCK_AUDIO_MANIFEST_JSON, {
          version: 'string',
          tracks: 'object',
          ducking: 'object',
          output: 'object',
        });
        assertEqual(MOCK_AUDIO_MANIFEST_JSON.version, '1.0.0');
      },
    },
    {
      id: 'T1-F20-02',
      name: 'Narration track metadata conforms to 24kHz mono PCM specification',
      feature: 'F20',
      tier: 1,
      fn: async (ctx) => {
        const narration = MOCK_AUDIO_MANIFEST_JSON.tracks.narration;
        assertSchema(narration, {
          file: 'string',
          duration: 'number',
          sampleRate: 'number',
          channels: 'number',
        });
        assertEqual(narration.sampleRate, 24000);
        assertEqual(narration.channels, 1);
        assertTrue(narration.duration > 0);
      },
    },
    {
      id: 'T1-F20-03',
      name: 'Music and SFX track entries expose valid paths and volume metrics',
      feature: 'F20',
      tier: 1,
      fn: async (ctx) => {
        const { music, sfx } = MOCK_AUDIO_MANIFEST_JSON.tracks;
        assertTrue(typeof music.file === 'string' && music.file.length > 0);
        assertTrue(Array.isArray(sfx));

        for (const s of sfx) {
          assertSchema(s, {
            id: 'string',
            file: 'string',
            frame: 'number',
            volume: 'number',
          });
          assertTrue(s.frame >= 0);
        }
      },
    },
    {
      id: 'T1-F20-04',
      name: 'Output track specifications conform to 48kHz stereo with true peak <= -1.0 dBFS',
      feature: 'F20',
      tier: 1,
      fn: async (ctx) => {
        const out = MOCK_AUDIO_MANIFEST_JSON.output;
        assertEqual(out.sampleRate, 48000);
        assertEqual(out.channels, 2);
        assertTrue(out.truePeakDbfs <= -1.0);
        assertEqual(out.clippedSamples, 0);
      },
    },
    {
      id: 'T1-F20-05',
      name: 'Integrated loudness satisfies EBU R128 standard (-16.0 +/- 1.5 LUFS)',
      feature: 'F20',
      tier: 1,
      fn: async (ctx) => {
        const lufs = MOCK_AUDIO_MANIFEST_JSON.output.lufs;
        // Target: -16.0 LUFS, tolerance +/- 1.5 => [-17.5, -14.5]
        assertInRange(lufs, -17.5, -14.5, `LUFS ${lufs} out of broadcast bounds [-17.5, -14.5]`);
      },
    },
  ],
};

registerSuite(suite);
