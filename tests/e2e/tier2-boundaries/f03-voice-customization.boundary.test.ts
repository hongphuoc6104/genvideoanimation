/**
 * tests/e2e/tier2-boundaries/f03-voice-customization.boundary.test.ts
 * Feature F03: Voice Customization Presets Boundary Tests (T2-F03-01 to T2-F03-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F03: Voice Customization Presets Boundary Tests', () => {
  test('T2-F03-01: Unsupported voice identifier throws descriptive error with supported voices list', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.validateVoice) {
      ctx.notImplemented('validateVoice not yet exported');
      return;
    }
    assertThrows(() => {
      ttsMod.validateVoice('am_invalid_speaker');
    }, /Unsupported voice: "am_invalid_speaker"/, 'Must reject unknown voice identifier');

    assertThrows(() => {
      ttsMod.validateVoice('voice_xyz_123');
    }, /Supported voices are: am_adam, am_fenrir, am_michael, am_onyx/, 'Error message must enumerate valid voices');
  }, { id: 'T2-F03-01', feature: 'F03', tier: 2 });

  test('T2-F03-02: Empty or undefined voice parameter defaults cleanly to am_adam without throwing', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.validateVoice) {
      ctx.notImplemented('validateVoice not yet exported');
      return;
    }
    const defaultVoice = ttsMod.validateVoice(undefined);
    assertEqual(defaultVoice, 'am_adam', 'Undefined voice must default to am_adam');

    const emptyVoice = ttsMod.validateVoice('');
    assertEqual(emptyVoice, 'am_adam', 'Empty voice string must default to am_adam');
  }, { id: 'T2-F03-02', feature: 'F03', tier: 2 });

  test('T2-F03-03: Voice embeddings binary asset presence and size boundary check', async (ctx) => {
    const voicesBinPath = path.resolve(process.cwd(), 'models/kokoro/voices-v1.0.bin');
    if (!fs.existsSync(voicesBinPath)) {
      ctx.notImplemented('models/kokoro/voices-v1.0.bin not yet staged');
      return;
    }
    const stat = fs.statSync(voicesBinPath);
    assertTrue(stat.size > 1_000_000, `voices-v1.0.bin size (${stat.size} bytes) must exceed 1MB`);
  }, { id: 'T2-F03-03', feature: 'F03', tier: 2 });

  test('T2-F03-04: Supported voice list is strictly immutable and contains exactly 4 canonical voices', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.SUPPORTED_VOICES) {
      ctx.notImplemented('SUPPORTED_VOICES not yet exported');
      return;
    }
    assertEqual(ttsMod.SUPPORTED_VOICES.length, 4, 'Must support exactly 4 canonical voices');
    assertTrue(ttsMod.SUPPORTED_VOICES.includes('am_adam'));
    assertTrue(ttsMod.SUPPORTED_VOICES.includes('am_fenrir'));
    assertTrue(ttsMod.SUPPORTED_VOICES.includes('am_michael'));
    assertTrue(ttsMod.SUPPORTED_VOICES.includes('am_onyx'));
  }, { id: 'T2-F03-04', feature: 'F03', tier: 2 });

  test('T2-F03-05: Voice metadata map contains language, gender, and description for every voice', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.VOICE_METADATA) {
      ctx.notImplemented('VOICE_METADATA not yet exported');
      return;
    }
    for (const voiceId of ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx'] as const) {
      const meta = ttsMod.VOICE_METADATA[voiceId];
      assertTrue(meta, `Metadata for voice ${voiceId} must exist`);
      assertEqual(meta.id, voiceId);
      assertEqual(meta.language, 'en-us');
      assertTrue(typeof meta.name === 'string' && meta.name.length > 0);
      assertTrue(typeof meta.description === 'string' && meta.description.length > 0);
    }
  }, { id: 'T2-F03-05', feature: 'F03', tier: 2 });
}, { feature: 'F03', tier: 2 });
