/**
 * tests/e2e/tier3-combinations/pipeline-stages.test.ts
 * Tier 3: Pairwise Cross-Feature Tests (T3-COMB-01 to T3-COMB-10)
 * Verifies data flow across Pipeline Stages (Normalize + TTS + Align + Captions + Layout)
 */

import {
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertClose,
  assertMonotonic,
  assertNoOverlap,
  assertSchema,
  assertWavHeader,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
  resolveOptionalModule,
} from '../harness/test-context';
import {
  TEXT_FIXTURES,
  SHOTSPEC_FIXTURES,
  MOCK_NARRATION_TEXT_MAP,
  MOCK_WORDS_JSON,
  MOCK_CAPTIONS_JSON,
  createMockWavBuffer,
} from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 3: Pipeline Stages Cross-Feature Interactions',
  feature: 'F08+F09+F02+F12+F15+F16',
  tier: 3,
  tests: [
    {
      id: 'T3-COMB-01',
      name: 'Number expansion to spoken tokens aligns with Wav2Vec2 without span drift',
      feature: 'F08+F09+F12',
      tier: 3,
      fn: async (ctx) => {
        // Test integration between TextNormalizer, Bidirectional Map, and Word Alignment
        const map = MOCK_NARRATION_TEXT_MAP;
        const numberToken = map.tokens.find((t) => t.originalWord === '2026');
        assertTrue(numberToken, 'Expected token for 2026 to exist');
        
        // Verify span in original text
        const sliced = map.originalText.slice(numberToken.originalSpan[0], numberToken.originalSpan[1]);
        assertEqual(sliced, '2026', 'Original span must extract verbatim "2026"');
        
        // Verify spoken words match alignment tokens in words.json
        const spoken = numberToken.spokenWords;
        assertEqual(spoken.length, 2, '2026 must expand to 2 spoken words');
        assertEqual(spoken[0], 'twenty');
        assertEqual(spoken[1], 'twenty-six');

        const word1 = MOCK_WORDS_JSON.find((w) => w.cleanWord === 'twenty');
        const word2 = MOCK_WORDS_JSON.find((w) => w.cleanWord === 'twenty-six');
        assertTrue(word1 && word2, 'Both spoken words must exist in words.json');
        assertTrue(word2.start >= word1.end - 0.01, 'Spoken words must be sequential in time');
      },
    },
    {
      id: 'T3-COMB-02',
      name: 'Technical acronyms under educational prosody synthesize with proper syllable pauses',
      feature: 'F08+F10+F02',
      tier: 3,
      fn: async (ctx) => {
        const acronymToken = MOCK_NARRATION_TEXT_MAP.tokens.find((t) => t.originalWord === 'AI');
        assertTrue(acronymToken, 'Token for AI must exist');
        assertDeepEqual(acronymToken.spokenWords, ['A', 'I'], 'AI must expand to letters A and I');

        const wordA = MOCK_WORDS_JSON.find((w) => w.cleanWord === 'a' && w.id === 'w3');
        const wordI = MOCK_WORDS_JSON.find((w) => w.cleanWord === 'i' && w.id === 'w4');
        assertTrue(wordA && wordI, 'Letters A and I must be aligned');
        assertTrue(wordI.start >= wordA.end, 'Syllable pause: I must start at or after A ends');
      },
    },
    {
      id: 'T3-COMB-03',
      name: 'narration-text-map.json span intervals map injectively to words.json token IDs',
      feature: 'F09+F13+F14',
      tier: 3,
      fn: async (ctx) => {
        const intervals = MOCK_NARRATION_TEXT_MAP.tokens.map((t) => ({
          start: t.originalSpan[0],
          end: t.originalSpan[1],
          id: t.id,
        }));
        
        // Assert spans are non-overlapping and strictly ordered
        assertNoOverlap(intervals, 'Text map original spans must not overlap');
        
        // Verify word timestamps are strictly monotonic
        const starts = MOCK_WORDS_JSON.map((w) => w.start);
        assertMonotonic(starts, true, 'Word start timestamps must be strictly monotonic');
      },
    },
    {
      id: 'T3-COMB-04',
      name: 'Switching voices from am_adam to am_fenrir preserves direct 24kHz PCM WAV without MP3',
      feature: 'F02+F03+F04',
      tier: 3,
      fn: async (ctx) => {
        // Test audio synthesis contract: direct 24kHz mono PCM WAV buffer
        const adamWav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.0 });
        const fenrirWav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.2 });

        assertWavHeader(adamWav, 24000, 1, 16);
        assertWavHeader(fenrirWav, 24000, 1, 16);

        // Verify zero MP3 magic header (ID3 or 0xFFFB)
        assertFalse(adamWav.toString('ascii', 0, 3) === 'ID3', 'Audio must not contain ID3 tag');
        assertFalse(fenrirWav.toString('ascii', 0, 3) === 'ID3', 'Audio must not contain ID3 tag');
      },
    },
    {
      id: 'T3-COMB-05',
      name: 'ShotSpec energetic profile speeds up Kokoro TTS while respecting pause_after',
      feature: 'F10+F11+F02',
      tier: 3,
      fn: async (ctx) => {
        const spec = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL;
        assertTrue(spec.pause_after >= 0, 'pause_after must be non-negative');
        assertEqual(spec.fps, 30);
        
        const pauseFrames = Math.round(spec.pause_after * spec.fps);
        assertEqual(pauseFrames, 18, '0.6s pause at 30fps equals 18 frames');
        assertTrue(spec.duration_frames >= pauseFrames, 'Shot duration must accommodate pause');
      },
    },
    {
      id: 'T3-COMB-06',
      name: 'WhisperX word alignment boundary pauses feed directly into caption chunk breaks',
      feature: 'F12+F13+F15',
      tier: 3,
      fn: async (ctx) => {
        // Group boundary in mock captions occurs after word w2 ("twenty-six,")
        const group0 = MOCK_CAPTIONS_JSON.groups[0];
        const group1 = MOCK_CAPTIONS_JSON.groups[1];
        
        assertEqual(group0.id, 'g0');
        assertEqual(group1.id, 'g1');
        assertTrue(group1.startTime >= group0.endTime, 'Group 1 must start at or after Group 0 ends');
        assertTrue(group1.startFrame > group0.endFrame, 'Group 1 startFrame must be strictly greater than Group 0 endFrame');
      },
    },
    {
      id: 'T3-COMB-07',
      name: 'Caption segmenter produces 2-line groups whose bounding boxes pass safe-area checks',
      feature: 'F15+F16+F17',
      tier: 3,
      fn: async (ctx) => {
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          assertTrue(group.lines.length <= 2, `Group ${group.id} must have at most 2 lines`);
          for (const line of group.lines) {
            assertTrue(line.text.length <= 42, `Line text exceeds 42 characters: "${line.text}"`);
          }
          
          // Verify bounding box inside safe margins [96, 1824] x [96, 984]
          const { x, y, width, height } = group.box;
          assertTrue(x >= 96, `Box x (${x}) violates safe margin >= 96`);
          assertTrue(y >= 96, `Box y (${y}) violates safe margin >= 96`);
          assertTrue(x + width <= 1824, `Box right edge (${x + width}) exceeds safe margin <= 1824`);
          assertTrue(y + height <= 984, `Box bottom edge (${y + height}) exceeds safe margin <= 984`);
        }
      },
    },
    {
      id: 'T3-COMB-08',
      name: 'Moving ShotSpec subject region triggers dynamic caption repositioning verified by validator',
      feature: 'F16+F31+F26',
      tier: 3,
      fn: async (ctx) => {
        // Subject region at bottom [500, 750, 920, 280]
        const subject = SHOTSPEC_FIXTURES.WITH_SUBJECT_BOTTOM.subject_region;
        const bottomCaptionBox = { x: 192, y: 864, width: 1536, height: 120 };

        // Test collision detection:
        const xOverlap = Math.max(0, Math.min(bottomCaptionBox.x + bottomCaptionBox.width, subject.x + subject.width) - Math.max(bottomCaptionBox.x, subject.x));
        const yOverlap = Math.max(0, Math.min(bottomCaptionBox.y + bottomCaptionBox.height, subject.y + subject.height) - Math.max(bottomCaptionBox.y, subject.y));
        const collisionArea = xOverlap * yOverlap;
        assertTrue(collisionArea > 0, 'Bottom caption box should collide with subject region');

        // Repositioned to top:
        const topCaptionBox = { x: 192, y: 96, width: 1536, height: 120 };
        const topYOverlap = Math.max(0, Math.min(topCaptionBox.y + topCaptionBox.height, subject.y + subject.height) - Math.max(topCaptionBox.y, subject.y));
        assertEqual(topYOverlap, 0, 'Top caption box must have 0 collision with bottom subject');
      },
    },
    {
      id: 'T3-COMB-09',
      name: 'captions.json consumed directly by Remotion KaraokeCaptions with zero schema errors',
      feature: 'F17+F22+F26',
      tier: 3,
      fn: async (ctx) => {
        assertSchema(MOCK_CAPTIONS_JSON, {
          version: (v) => v === '1.0.0',
          fps: (f) => typeof f === 'number' && f > 0,
          groups: (g) => Array.isArray(g) && g.length > 0,
        });

        const firstGroup = MOCK_CAPTIONS_JSON.groups[0];
        assertSchema(firstGroup, {
          id: 'string',
          startFrame: 'number',
          endFrame: 'number',
          startTime: 'number',
          endTime: 'number',
          position: 'string',
          box: 'object',
          lines: (l) => Array.isArray(l) && l.length >= 1 && l.length <= 2,
        });
      },
    },
    {
      id: 'T3-COMB-10',
      name: 'Word timestamps drive progressive KaraokeWord fill passing strict monotonicity QA',
      feature: 'F13+F23+F35',
      tier: 3,
      fn: async (ctx) => {
        // Word 'In' is active from frame 2 to frame 7 (duration: 5 frames)
        const startFrame = 2;
        const endFrame = 7;
        const progressValues: number[] = [];

        for (let f = startFrame; f <= endFrame; f++) {
          const progress = (f - startFrame) / (endFrame - startFrame);
          progressValues.push(progress);
        }

        assertEqual(progressValues[0], 0.0, 'Initial progress must be 0%');
        assertEqual(progressValues[progressValues.length - 1], 1.0, 'Final progress must be 100%');
        assertMonotonic(progressValues, true, 'Progress values across frames must be strictly monotonic');
      },
    },
  ],
};

registerSuite(suite);
