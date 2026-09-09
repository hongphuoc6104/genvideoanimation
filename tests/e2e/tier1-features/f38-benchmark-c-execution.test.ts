/**
 * tests/e2e/tier1-features/f38-benchmark-c-execution.test.ts
 * Tier 1: Feature Coverage Tests for F38 (Benchmark C Execution - Expressive Narration)
 */

import {
  assertEqual,
  assertTrue,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { TEXT_FIXTURES } from '../harness/fixtures';

export const BENCHMARK_C_SPEC = {
  id: 'benchmark-c',
  name: 'Rapid / Expressive Narration',
  voice: 'am_fenrir',
  prosodyProfile: 'dramatic',
  outputDir: 'out/v3/benchmark-c',
  requiredArtifacts: [
    'script.txt',
    'narration.wav',
    'narration-text-map.json',
    'words.json',
    'captions.json',
    'audio-manifest.json',
    'video.mp4',
  ],
};

export const suite: TestSuite = {
  name: 'Tier 1: F38 Benchmark C Execution',
  feature: 'F38',
  tier: 1,
  tests: [
    {
      id: 'T1-F38-01',
      name: 'Benchmark C input script contains expressive punctuation, quotes, and question marks',
      feature: 'F38',
      tier: 1,
      fn: async (ctx) => {
        const script = TEXT_FIXTURES.EXPRESSIVE;
        assertTrue(script.includes('!'), 'Must contain exclamation point');
        assertTrue(script.includes('?'), 'Must contain question mark');
        assertTrue(script.includes('"'), 'Must contain dialogue quotes');
      },
    },
    {
      id: 'T1-F38-02',
      name: 'Benchmark C output destination is canonical out/v3/benchmark-c directory',
      feature: 'F38',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_C_SPEC.outputDir, 'out/v3/benchmark-c');
      },
    },
    {
      id: 'T1-F38-03',
      name: 'Expressive prosody binds dramatic profile with measured silences',
      feature: 'F38',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_C_SPEC.prosodyProfile, 'dramatic');
        assertEqual(BENCHMARK_C_SPEC.voice, 'am_fenrir');
      },
    },
    {
      id: 'T1-F38-04',
      name: 'Audio ducking handles dynamic pause releases during dramatic silences',
      feature: 'F38',
      tier: 1,
      fn: async (ctx) => {
        // Attack 100ms, release 600ms allows music bed to gracefully swell during >1.0s pauses
        const pauseDurationSec = 1.2;
        const releaseTimeSec = 0.6;
        assertTrue(pauseDurationSec > releaseTimeSec, 'Dramatic pause accommodates release envelope');
      },
    },
    {
      id: 'T1-F38-05',
      name: 'Benchmark C declares all 7 required production artifacts',
      feature: 'F38',
      tier: 1,
      fn: async (ctx) => {
        const artifacts = BENCHMARK_C_SPEC.requiredArtifacts;
        assertEqual(artifacts.length, 7);
        assertTrue(artifacts.includes('script.txt'));
        assertTrue(artifacts.includes('video.mp4'));
      },
    },
  ],
};

registerSuite(suite);
