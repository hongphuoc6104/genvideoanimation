/**
 * tests/e2e/tier1-features/f21-semantic-animation-cues.test.ts
 * Tier 1: Feature Coverage Tests for F21 (Semantic Animation Cues & CueManifest Integration)
 */

import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertSchema,
  assertMonotonic,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import {
  MOCK_CUE_MANIFEST_JSON,
  SHOTSPEC_FIXTURES,
  MOCK_WORDS_JSON,
} from '../harness/fixtures';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F21 Semantic Animation Cues',
  feature: 'F21',
  tier: 1,
  tests: [
    {
      id: 'T1-F21-01',
      name: 'Derives WORD_EMPHASIS cues for words specified in ShotSpec emphasis_words',
      feature: 'F21',
      tier: 1,
      fn: async (ctx) => {
        const emphasisCues = MOCK_CUE_MANIFEST_JSON.cues.filter((c) => c.type === 'WORD_EMPHASIS');
        assertTrue(emphasisCues.length >= 2, 'Expected at least 2 WORD_EMPHASIS cues');
        
        const emphasisWords = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL.emphasis_words;
        const labels = emphasisCues.map((c) => c.label);
        for (const word of emphasisWords) {
          assertTrue(
            labels.some((l) => l.includes(word)),
            `Emphasis cue missing for word "${word}"`
          );
        }
      },
    },
    {
      id: 'T1-F21-02',
      name: 'Derives SENTENCE_START cues aligned with opening sentence speech frames',
      feature: 'F21',
      tier: 1,
      fn: async (ctx) => {
        const startCues = MOCK_CUE_MANIFEST_JSON.cues.filter((c) => c.type === 'SENTENCE_START');
        assertTrue(startCues.length >= 1, 'Expected at least 1 SENTENCE_START cue');
        assertEqual(startCues[0].frame, 2, 'Sentence 1 should start on frame 2');
        assertEqual(startCues[0].category, 'narrative');
      },
    },
    {
      id: 'T1-F21-03',
      name: 'Derives SENTENCE_END cues aligned with final sentence boundary punctuation',
      feature: 'F21',
      tier: 1,
      fn: async (ctx) => {
        const endCues = MOCK_CUE_MANIFEST_JSON.cues.filter((c) => c.type === 'SENTENCE_END');
        assertTrue(endCues.length >= 1, 'Expected at least 1 SENTENCE_END cue');
        assertEqual(endCues[0].frame, 120, 'Sentence 1 should end on frame 120');
      },
    },
    {
      id: 'T1-F21-04',
      name: 'CueManifest output structure conforms to motion-kit CueManifest contract',
      feature: 'F21',
      tier: 1,
      fn: async (ctx) => {
        const { createCueManifest } = await import(
          path.join(REPO_ROOT, 'motion-kit', 'src', 'cues', 'CueManifest.ts')
        );
        const manifest = createCueManifest(MOCK_CUE_MANIFEST_JSON);

        assertSchema(manifest, {
          compositionId: 'string',
          fps: 'number',
          cues: (c) => Array.isArray(c) && c.length > 0,
        });
        assertEqual(manifest.fps, 30);
      },
    },
    {
      id: 'T1-F21-05',
      name: 'Cue frames are non-negative integers sorted strictly monotonically in time',
      feature: 'F21',
      tier: 1,
      fn: async (ctx) => {
        const frames = MOCK_CUE_MANIFEST_JSON.cues.map((c) => c.frame);
        for (const f of frames) {
          assertTrue(Number.isInteger(f) && f >= 0, `Frame ${f} must be a non-negative integer`);
        }
        assertMonotonic(frames, true, 'Cue event frames must be strictly monotonic');
      },
    },
  ],
};

registerSuite(suite);
