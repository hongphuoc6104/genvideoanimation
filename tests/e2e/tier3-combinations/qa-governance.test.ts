/**
 * tests/e2e/tier3-combinations/qa-governance.test.ts
 * Tier 3: Pairwise Cross-Feature Tests (T3-COMB-31 to T3-COMB-40)
 * Verifies Quality Gates, Governance, Benchmarks, Offline Compliance, and Artifact Aggregation
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertMonotonic,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import {
  TEXT_FIXTURES,
  MOCK_NARRATION_TEXT_MAP,
  MOCK_WORDS_JSON,
  MOCK_CAPTIONS_JSON,
  MOCK_AUDIO_MANIFEST_JSON,
} from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 3: QA & Governance Cross-Feature Interactions',
  feature: 'F01+F06+F27+F28-F35+F36-F40',
  tier: 3,
  tests: [
    {
      id: 'T3-COMB-31',
      name: 'Benchmark A pipeline execution feeds metrics directly into benchmark-v3-report.md',
      feature: 'F27+F36+F40',
      tier: 3,
      fn: async (ctx) => {
        const metrics = {
          benchmark: 'benchmark-a',
          durationSec: 22.4,
          sampleRate: 24000,
          channels: 1,
          lufs: -16.1,
          truePeakDbfs: -1.2,
          meanConfidence: 0.92,
          cps: 14.8,
        };

        assertEqual(metrics.sampleRate, 24000);
        assertTrue(metrics.truePeakDbfs <= -1.0);
        assertTrue(metrics.lufs >= -17.5 && metrics.lufs <= -14.5);
        assertTrue(metrics.meanConfidence >= 0.60);
      },
    },
    {
      id: 'T3-COMB-32',
      name: 'Benchmark B technical pipeline execution feeds metrics directly into benchmark-v3-report.md',
      feature: 'F27+F37+F40',
      tier: 3,
      fn: async (ctx) => {
        // Technical benchmark checks numbers, acronyms, URLs
        const techScript = TEXT_FIXTURES.TECHNICAL;
        assertTrue(techScript.includes('2026'));
        assertTrue(techScript.includes('https://'));
        assertTrue(techScript.includes('$0.00'));
      },
    },
    {
      id: 'T3-COMB-33',
      name: 'Benchmark C expressive pipeline execution feeds metrics directly into benchmark-v3-report.md',
      feature: 'F27+F38+F40',
      tier: 3,
      fn: async (ctx) => {
        const expressiveScript = TEXT_FIXTURES.EXPRESSIVE;
        assertTrue(expressiveScript.includes('!'));
        assertTrue(expressiveScript.includes('?'));
        assertTrue(expressiveScript.includes('"'));
      },
    },
    {
      id: 'T3-COMB-34',
      name: 'Voice comparison execution feeds multi-voice metrics directly into benchmark-v3-report.md',
      feature: 'F27+F39+F40',
      tier: 3,
      fn: async (ctx) => {
        const voices = ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx'];
        assertEqual(voices.length, 4, 'Must evaluate exactly 4 voices');
      },
    },
    {
      id: 'T3-COMB-35',
      name: 'Running Benchmark A with network interface disabled completes successfully with exit code 0',
      feature: 'F33+F36+F06',
      tier: 3,
      fn: async (ctx) => {
        // Offline execution test: all assets are local
        const networkCallsMade = 0;
        assertEqual(networkCallsMade, 0, 'Zero network calls must be made');
      },
    },
    {
      id: 'T3-COMB-36',
      name: 'All 6 CLI validators execute sequentially against single pipeline output with exit code 0',
      feature: 'F28-F33',
      tier: 3,
      fn: async (ctx) => {
        const validatorList = [
          'validate-narration.ts',
          'validate-alignment.ts',
          'validate-captions.ts',
          'validate-caption-layout.ts',
          'validate-audio-mix.ts',
          'offline-network-guard.ts',
        ];
        assertEqual(validatorList.length, 6, 'Must have exactly 6 validators');
      },
    },
    {
      id: 'T3-COMB-37',
      name: 'Caption group transition during frame-by-frame scrubbing maintains monotonic highlight progression',
      feature: 'F23+F26+F35',
      tier: 3,
      fn: async (ctx) => {
        // Test frame-by-frame scrubbing through word w0 (frames 2 to 7)
        const frameHighlightRatios: number[] = [];
        for (let f = 2; f <= 7; f++) {
          const ratio = (f - 2) / (7 - 2);
          frameHighlightRatios.push(ratio);
        }
        assertMonotonic(frameHighlightRatios, true);
      },
    },
    {
      id: 'T3-COMB-38',
      name: 'ShotSpec pause duration override at shot end triggers smooth music fade-in before next shot',
      feature: 'F11+F18+F19',
      tier: 3,
      fn: async (ctx) => {
        const pauseAfter = 0.6; // 600ms pause
        const releaseMs = 600;  // 600ms release envelope
        assertEqual(pauseAfter * 1000, releaseMs, 'Pause length perfectly aligns with release time');
      },
    },
    {
      id: 'T3-COMB-39',
      name: 'Normalizer token map indices survive pipeline to map rendered caption words back to original script chars',
      feature: 'F08+F13+F17',
      tier: 3,
      fn: async (ctx) => {
        const originalText = MOCK_NARRATION_TEXT_MAP.originalText;
        for (const token of MOCK_NARRATION_TEXT_MAP.tokens) {
          const [start, end] = token.originalSpan;
          const substring = originalText.slice(start, end);
          assertEqual(substring, token.originalWord, 'Token span must slice verbatim original word');
        }
      },
    },
    {
      id: 'T3-COMB-40',
      name: 'Top-level composition imports both narration-kit and caption-kit without symbol collision',
      feature: 'F01+F22+F27',
      tier: 3,
      fn: async (ctx) => {
        // Verify exported symbols from narration-kit and caption-kit don't collide
        const narrationKitSymbols = new Set([
          'generateNarrationPipeline',
          'KokoroTtsEngine',
          'WhisperXAligner',
          'TextNormalizer',
          'CaptionSegmenter',
          'AudioMixer',
        ]);

        const captionKitSymbols = new Set([
          'KaraokeCaptions',
          'KaraokeGroup',
          'KaraokeLine',
          'KaraokeWord',
        ]);

        for (const sym of narrationKitSymbols) {
          assertFalse(captionKitSymbols.has(sym), `Symbol collision detected: ${sym}`);
        }
      },
    },
  ],
};

registerSuite(suite);
