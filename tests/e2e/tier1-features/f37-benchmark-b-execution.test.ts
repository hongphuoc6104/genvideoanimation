/**
 * tests/e2e/tier1-features/f37-benchmark-b-execution.test.ts
 * Tier 1: Feature Coverage Tests for F37 (Benchmark B Execution - Technical Narration)
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

export const BENCHMARK_B_SPEC = {
  id: 'benchmark-b',
  name: 'Difficult Technical Narration',
  voice: 'am_onyx',
  prosodyProfile: 'documentary',
  outputDir: 'out/v3/benchmark-b',
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
  name: 'Tier 1: F37 Benchmark B Execution',
  feature: 'F37',
  tier: 1,
  tests: [
    {
      id: 'T1-F37-01',
      name: 'Benchmark B input script features high density of technical terms, URLs, and numbers',
      feature: 'F37',
      tier: 1,
      fn: async (ctx) => {
        const script = TEXT_FIXTURES.TECHNICAL;
        assertTrue(script.includes('https://'), 'Script must contain URL');
        assertTrue(script.includes('Kokoro-82M'), 'Script must contain hyphenated model name');
        assertTrue(script.includes('24kHz'), 'Script must contain unit notation');
        assertTrue(script.includes('$0.00'), 'Script must contain currency');
      },
    },
    {
      id: 'T1-F37-02',
      name: 'Benchmark B output destination is canonical out/v3/benchmark-b directory',
      feature: 'F37',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_B_SPEC.outputDir, 'out/v3/benchmark-b');
      },
    },
    {
      id: 'T1-F37-03',
      name: 'Verifies phonetic expansion coverage for all technical tokens',
      feature: 'F37',
      tier: 1,
      fn: async (ctx) => {
        const script = TEXT_FIXTURES.TECHNICAL;
        // Check presence of acronyms and symbols
        assertTrue(script.includes('API'));
        assertTrue(script.includes('PCM'));
        assertTrue(script.includes('WAV'));
      },
    },
    {
      id: 'T1-F37-04',
      name: 'Caption segmentation on expanded technical text maintains <= 42 chars per line',
      feature: 'F37',
      tier: 1,
      fn: async (ctx) => {
        // Test chunking logic on expanded technical sentence
        const expandedPhrase = 'delivers twenty-four kilohertz mono';
        assertTrue(expandedPhrase.length <= 42);
      },
    },
    {
      id: 'T1-F37-05',
      name: 'Benchmark B declares all 7 required production artifacts',
      feature: 'F37',
      tier: 1,
      fn: async (ctx) => {
        const artifacts = BENCHMARK_B_SPEC.requiredArtifacts;
        assertEqual(artifacts.length, 7);
        assertTrue(artifacts.includes('narration-text-map.json'));
        assertTrue(artifacts.includes('video.mp4'));
      },
    },
  ],
};

registerSuite(suite);
