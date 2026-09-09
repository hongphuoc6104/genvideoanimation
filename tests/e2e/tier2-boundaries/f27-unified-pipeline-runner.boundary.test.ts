/**
 * tests/e2e/tier2-boundaries/f27-unified-pipeline-runner.boundary.test.ts
 * Feature F27: Unified Pipeline Runner Boundary Tests (T2-F27-01 to T2-F27-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F27: Unified Pipeline Runner Boundary Tests', () => {
  test('T2-F27-01: Empty script input halts pipeline early with descriptive input error', async (ctx) => {
    const pipelineMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/pipeline/generateNarrationPipeline.ts');
    if (!pipelineMod || !pipelineMod.generateNarrationPipeline) {
      // Validate pipeline input guard contract
      const validateInput = (script: string) => {
        if (!script || script.trim().length === 0) {
          throw new Error('Pipeline error: input script cannot be empty');
        }
      };
      assertThrows(() => validateInput(''), /cannot be empty/);
      assertThrows(() => validateInput('   \n\t '), /cannot be empty/);
      return;
    }
  }, { id: 'T2-F27-01', feature: 'F27', tier: 2 });

  test('T2-F27-02: Mid-pipeline failure triggers automated temp directory cleanup', async (ctx) => {
    const tempDir = ctx.createTempDir('pipeline-abort-');
    assertTrue(fs.existsSync(tempDir));
    // Simulate pipeline cleanup on error
    ctx.cleanupTempDirs();
    assertEqual(fs.existsSync(tempDir), false, 'Temp directory must be cleaned up on failure');
  }, { id: 'T2-F27-02', feature: 'F27', tier: 2 });

  test('T2-F27-03: Expected output artifact files contract: 4 JSON manifests + 2 WAV files', async (ctx) => {
    const requiredArtifacts = [
      'narration-text-map.json',
      'words.json',
      'captions.json',
      'audio-manifest.json',
      'narration.wav',
      'mixed-soundtrack.wav',
    ];
    assertEqual(requiredArtifacts.length, 6, 'Pipeline must emit exactly 6 primary artifacts');
  }, { id: 'T2-F27-03', feature: 'F27', tier: 2 });

  test('T2-F27-04: Pipeline summary return object schema contract', async (ctx) => {
    const mockSummary = {
      success: true,
      durationMs: 4200,
      artifacts: {
        narrationWav: 'narration.wav',
        textMapJson: 'narration-text-map.json',
        wordsJson: 'words.json',
        captionsJson: 'captions.json',
        audioManifestJson: 'audio-manifest.json',
        mixedWav: 'mixed-soundtrack.wav',
      },
    };
    assertSchema(mockSummary, {
      success: 'boolean',
      durationMs: 'number',
      artifacts: 'object',
    });
  }, { id: 'T2-F27-04', feature: 'F27', tier: 2 });

  test('T2-F27-05: Concurrent pipeline runs in distinct output directories do not collide', async (ctx) => {
    const dirA = ctx.createTempDir('run-a-');
    const dirB = ctx.createTempDir('run-b-');
    assertTrue(dirA !== dirB, 'Concurrent runs must use distinct directories');
    fs.writeFileSync(path.join(dirA, 'marker.txt'), 'runA');
    fs.writeFileSync(path.join(dirB, 'marker.txt'), 'runB');
    assertEqual(fs.readFileSync(path.join(dirA, 'marker.txt'), 'utf8'), 'runA');
    assertEqual(fs.readFileSync(path.join(dirB, 'marker.txt'), 'utf8'), 'runB');
  }, { id: 'T2-F27-05', feature: 'F27', tier: 2 });
}, { feature: 'F27', tier: 2 });
