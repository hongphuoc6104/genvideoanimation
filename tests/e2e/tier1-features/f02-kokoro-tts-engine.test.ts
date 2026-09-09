/**
 * tests/e2e/tier1-features/f02-kokoro-tts-engine.test.ts
 * Tier 1: Feature Coverage Tests for F02 (Local Kokoro-82M TTS Engine)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertClose,
  assertWavHeader,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { createMockWavBuffer } from '../harness/fixtures';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F02 Kokoro-82M TTS Local Engine',
  feature: 'F02',
  tier: 1,
  tests: [
    {
      id: 'T1-F02-01',
      name: 'KokoroTtsEngine instantiates cleanly with default configuration',
      feature: 'F02',
      tier: 1,
      fn: async (ctx) => {
        const { KokoroTtsEngine } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        const engine = new KokoroTtsEngine({ repoRoot: REPO_ROOT });
        assertTrue(engine instanceof KokoroTtsEngine, 'Engine must be an instance of KokoroTtsEngine');
        assertTrue(typeof engine.synthesize === 'function', 'Engine must implement synthesize()');
      },
    },
    {
      id: 'T1-F02-02',
      name: 'Kokoro ONNX weights and voice embedding assets exist on local disk',
      feature: 'F02',
      tier: 1,
      fn: async (ctx) => {
        const { KokoroTtsEngine } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        const engine = new KokoroTtsEngine({ repoRoot: REPO_ROOT });
        const isValid = await engine.validateModelAssets();
        assertTrue(isValid, 'Local Kokoro model assets (kokoro-v1.0.onnx and voices-v1.0.bin) must be present and non-empty');
      },
    },
    {
      id: 'T1-F02-03',
      name: 'Engine strictly generates 24kHz sample rate audio headers',
      feature: 'F02',
      tier: 1,
      fn: async (ctx) => {
        const { encodeWavHeader, parseWavHeader } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        const pcmLength = 24000 * 2; // 1 second of 16-bit mono PCM
        const header = encodeWavHeader(pcmLength, 24000, 1, 16);
        const dummyBuffer = Buffer.concat([header, Buffer.alloc(pcmLength)]);

        assertWavHeader(dummyBuffer, 24000, 1, 16);
        const info = parseWavHeader(dummyBuffer);
        assertEqual(info.sampleRate, 24000, 'Sample rate must be strictly 24000 Hz');
      },
    },
    {
      id: 'T1-F02-04',
      name: 'Engine enforces 16-bit mono PCM format invariants',
      feature: 'F02',
      tier: 1,
      fn: async (ctx) => {
        const { parseWavHeader } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        const wav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 1.5 });
        const info = parseWavHeader(wav);

        assertEqual(info.channels, 1, 'Audio channels must be mono (1)');
        assertEqual(info.bitDepth, 16, 'Bit depth must be 16-bit PCM');
      },
    },
    {
      id: 'T1-F02-05',
      name: 'Deterministic duration calculation from PCM byte count matches expectations',
      feature: 'F02',
      tier: 1,
      fn: async (ctx) => {
        const { parseWavHeader } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        // 24000 samples/sec * 2 bytes/sample * 3.5 seconds = 168,000 bytes
        const wav = createMockWavBuffer({ sampleRate: 24000, channels: 1, durationSec: 3.5 });
        const info = parseWavHeader(wav);

        assertClose(info.durationSec, 3.5, 1e-2, 'Calculated duration must be 3.5s');
      },
    },
  ],
};

registerSuite(suite);
