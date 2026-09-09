/**
 * tests/e2e/tier1-features/f03-voice-customization.test.ts
 * Tier 1: Feature Coverage Tests for F03 (Voice Customization Presets)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertThrows,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F03 Voice Customization Presets',
  feature: 'F03',
  tier: 1,
  tests: [
    {
      id: 'T1-F03-01',
      name: 'Default voice is canonically configured as am_adam',
      feature: 'F03',
      tier: 1,
      fn: async (ctx) => {
        const { DEFAULT_VOICE, validateVoice } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        assertEqual(DEFAULT_VOICE, 'am_adam');
        assertEqual(validateVoice(undefined), 'am_adam');
        assertEqual(validateVoice(''), 'am_adam');
      },
    },
    {
      id: 'T1-F03-02',
      name: 'All four canonical voice presets are recognized and supported',
      feature: 'F03',
      tier: 1,
      fn: async (ctx) => {
        const { SUPPORTED_VOICES, validateVoice } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        const expected = ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx'];
        for (const voice of expected) {
          assertTrue(SUPPORTED_VOICES.includes(voice), `Voice ${voice} must be in SUPPORTED_VOICES`);
          assertEqual(validateVoice(voice), voice);
        }
      },
    },
    {
      id: 'T1-F03-03',
      name: 'Voice metadata exposes valid description, gender, and language attributes',
      feature: 'F03',
      tier: 1,
      fn: async (ctx) => {
        const { VOICE_METADATA } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        for (const [id, meta] of Object.entries(VOICE_METADATA)) {
          assertSchema(meta, {
            id: 'string',
            name: 'string',
            gender: 'string',
            description: 'string',
            language: 'string',
          });
          assertEqual(meta.id, id);
        }
      },
    },
    {
      id: 'T1-F03-04',
      name: 'Invalid voice identifiers throw explicit descriptive error',
      feature: 'F03',
      tier: 1,
      fn: async (ctx) => {
        const { validateVoice } = await import(
          path.join(REPO_ROOT, 'packages', 'narration-kit', 'src', 'index.ts')
        );
        assertThrows(
          () => validateVoice('invalid_voice_xyz'),
          /Unsupported voice: "invalid_voice_xyz"/
        );
      },
    },
    {
      id: 'T1-F03-05',
      name: 'Voice binary embedding files exist in models/kokoro/voices directory',
      feature: 'F03',
      tier: 1,
      fn: async (ctx) => {
        const voicesDir = path.join(REPO_ROOT, 'models', 'kokoro', 'voices');
        assertTrue(fs.existsSync(voicesDir), 'models/kokoro/voices directory must exist');

        const expectedFiles = ['am_adam.bin', 'am_fenrir.bin', 'am_michael.bin', 'am_onyx.bin'];
        for (const file of expectedFiles) {
          const filePath = path.join(voicesDir, file);
          assertTrue(fs.existsSync(filePath), `Voice file ${file} must exist in models/kokoro/voices/`);
          const stat = fs.statSync(filePath);
          assertTrue(stat.size > 1000, `Voice file ${file} must be non-empty (size: ${stat.size} bytes)`);
        }
      },
    },
  ],
};

registerSuite(suite);
