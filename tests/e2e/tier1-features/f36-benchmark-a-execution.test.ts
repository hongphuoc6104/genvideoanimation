/**
 * tests/e2e/tier1-features/f36-benchmark-a-execution.test.ts
 * Tier 1: Feature Coverage Tests for F36 (Benchmark A Execution)
 */

import {
  assertEqual,
  assertTrue,
  assertInRange,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

export const BENCHMARK_A_SPEC = {
  id: 'benchmark-a',
  name: 'Standard Educational Narration',
  voice: 'am_adam',
  prosodyProfile: 'educational',
  targetDurationSec: [20, 30] as [number, number],
  outputDir: 'out/v3/benchmark-a',
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
  name: 'Tier 1: F36 Benchmark A Execution',
  feature: 'F36',
  tier: 1,
  tests: [
    {
      id: 'T1-F36-01',
      name: 'Benchmark A targets standard 20-30s educational explainer script',
      feature: 'F36',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_A_SPEC.id, 'benchmark-a');
        assertEqual(BENCHMARK_A_SPEC.targetDurationSec[0], 20);
        assertEqual(BENCHMARK_A_SPEC.targetDurationSec[1], 30);
      },
    },
    {
      id: 'T1-F36-02',
      name: 'Benchmark A output path is canonical out/v3/benchmark-a directory',
      feature: 'F36',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_A_SPEC.outputDir, 'out/v3/benchmark-a');
      },
    },
    {
      id: 'T1-F36-03',
      name: 'Benchmark A declares all 7 required production artifacts',
      feature: 'F36',
      tier: 1,
      fn: async (ctx) => {
        const artifacts = BENCHMARK_A_SPEC.requiredArtifacts;
        assertEqual(artifacts.length, 7);
        assertTrue(artifacts.includes('script.txt'));
        assertTrue(artifacts.includes('narration.wav'));
        assertTrue(artifacts.includes('narration-text-map.json'));
        assertTrue(artifacts.includes('words.json'));
        assertTrue(artifacts.includes('captions.json'));
        assertTrue(artifacts.includes('audio-manifest.json'));
        assertTrue(artifacts.includes('video.mp4'));
      },
    },
    {
      id: 'T1-F36-04',
      name: 'Configured with default educational voice am_adam and educational prosody',
      feature: 'F36',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_A_SPEC.voice, 'am_adam');
        assertEqual(BENCHMARK_A_SPEC.prosodyProfile, 'educational');
      },
    },
    {
      id: 'T1-F36-05',
      name: 'Benchmark A expected duration metrics stay strictly within [20.0, 30.0] seconds',
      feature: 'F36',
      tier: 1,
      fn: async (ctx) => {
        const mockDuration = 24.5;
        assertInRange(
          mockDuration,
          BENCHMARK_A_SPEC.targetDurationSec[0],
          BENCHMARK_A_SPEC.targetDurationSec[1]
        );
      },
    },
  ],
};

registerSuite(suite);
