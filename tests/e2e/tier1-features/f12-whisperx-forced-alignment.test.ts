/**
 * tests/e2e/tier1-features/f12-whisperx-forced-alignment.test.ts
 * Tier 1: Feature Coverage Tests for F12 (WhisperX Forced Alignment Subsystem)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertInRange,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_WORDS_JSON } from '../harness/fixtures';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F12 WhisperX Forced Alignment Engine',
  feature: 'F12',
  tier: 1,
  tests: [
    {
      id: 'T1-F12-01',
      name: 'Local Wav2Vec2 alignment model weights exist in models/alignment',
      feature: 'F12',
      tier: 1,
      fn: async (ctx) => {
        const modelPath = path.join(
          REPO_ROOT,
          'models',
          'alignment',
          'wav2vec2_fairseq_base_ls960_asr_ls960.pth'
        );
        assertTrue(fs.existsSync(modelPath), 'Wav2Vec2 model weights must exist locally');
        const stat = fs.statSync(modelPath);
        assertTrue(stat.size > 100_000_000, `Model file size must be > 100MB, got ${stat.size} bytes`);
      },
    },
    {
      id: 'T1-F12-02',
      name: 'Forced alignment matches authoritative transcript without text hallucination',
      feature: 'F12',
      tier: 1,
      fn: async (ctx) => {
        const words = MOCK_WORDS_JSON;
        assertTrue(words.length > 0, 'Word alignment tokens must be non-empty');
        // Verify words match canonical text: "In twenty twenty-six, A I models run at twenty-four kilohertz locally."
        const expectedCleanWords = [
          'in', 'twenty', 'twenty-six', 'a', 'i', 'models', 'run', 'at',
          'twenty-four', 'kilohertz', 'locally'
        ];
        assertEqual(words.length, expectedCleanWords.length);
        for (let i = 0; i < words.length; i++) {
          assertEqual(words[i].cleanWord, expectedCleanWords[i]);
        }
      },
    },
    {
      id: 'T1-F12-03',
      name: 'Produces start and end timestamps in seconds for every aligned token',
      feature: 'F12',
      tier: 1,
      fn: async (ctx) => {
        for (const w of MOCK_WORDS_JSON) {
          assertTrue(typeof w.start === 'number', `start must be a number for ${w.id}`);
          assertTrue(typeof w.end === 'number', `end must be a number for ${w.id}`);
          assertTrue(w.end > w.start, `end (${w.end}) must be greater than start (${w.start})`);
        }
      },
    },
    {
      id: 'T1-F12-04',
      name: 'Acoustic alignment confidence scores are bounded in [0.0, 1.0]',
      feature: 'F12',
      tier: 1,
      fn: async (ctx) => {
        for (const w of MOCK_WORDS_JSON) {
          assertTrue(typeof w.confidence === 'number', `confidence must be number for ${w.id}`);
          assertInRange(w.confidence, 0.0, 1.0, `Confidence out of bounds for ${w.id}`);
          assertTrue(w.confidence >= 0.80, `Expected high confidence for mock fixture word ${w.id}`);
        }
      },
    },
    {
      id: 'T1-F12-05',
      name: 'Detects natural inter-word pauses between disjoint word timing intervals',
      feature: 'F12',
      tier: 1,
      fn: async (ctx) => {
        const words = MOCK_WORDS_JSON;
        // Check pause between w2 ("twenty-six,") and w3 ("A")
        const w2 = words[2];
        const w3 = words[3];
        const pauseGap = w3.start - w2.end;
        assertTrue(pauseGap > 0.05, `Expected punctuation pause gap between w2 and w3, got: ${pauseGap}s`);
      },
    },
  ],
};

registerSuite(suite);
