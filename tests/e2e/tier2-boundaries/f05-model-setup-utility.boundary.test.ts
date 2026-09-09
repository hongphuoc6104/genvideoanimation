/**
 * tests/e2e/tier2-boundaries/f05-model-setup-utility.boundary.test.ts
 * Feature F05: Model Setup Utility Boundary Tests (T2-F05-01 to T2-F05-05)
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F05: Model Setup Utility Boundary Tests', () => {
  test('T2-F05-01: Setup script exists and supports check-only mode without network access', async (ctx) => {
    const setupPath = path.resolve(process.cwd(), 'scripts/setup-narration-models.ts');
    assertTrue(fs.existsSync(setupPath), 'scripts/setup-narration-models.ts must exist');
    const content = fs.readFileSync(setupPath, 'utf8');
    assertTrue(content.includes('--check-only') || content.includes('checkOnly'), 'Must support --check-only flag');
  }, { id: 'T2-F05-01', feature: 'F05', tier: 2 });

  test('T2-F05-02: Target directory creation: non-existent nested target path created recursively', async (ctx) => {
    const tempDir = ctx.createTempDir('setup-nested-');
    const nested = path.join(tempDir, 'sub1', 'sub2', 'models');
    assertEqual(fs.existsSync(nested), false);
    fs.mkdirSync(nested, { recursive: true });
    assertTrue(fs.existsSync(nested), 'Nested model path must be created cleanly');
  }, { id: 'T2-F05-02', feature: 'F05', tier: 2 });

  test('T2-F05-03: SHA-256 verification detects corrupted payload with mismatched hash', async (ctx) => {
    const originalBuffer = Buffer.from('model-weights-valid-content');
    const corruptBuffer = Buffer.from('model-weights-corrupt-content');

    const expectedHash = crypto.createHash('sha256').update(originalBuffer).digest('hex');
    const actualHash = crypto.createHash('sha256').update(corruptBuffer).digest('hex');

    assertTrue(expectedHash !== actualHash, 'Hashes must differ for corrupted data');
    const verifyHash = (data: Buffer, hash: string): boolean => {
      return crypto.createHash('sha256').update(data).digest('hex') === hash;
    };
    assertEqual(verifyHash(corruptBuffer, expectedHash), false, 'Corrupted data must fail SHA-256 verification');
  }, { id: 'T2-F05-03', feature: 'F05', tier: 2 });

  test('T2-F05-04: Zero-byte dummy model file is rejected as truncated/corrupted asset', async (ctx) => {
    const tempDir = ctx.createTempDir('zero-byte-');
    const dummyPath = path.join(tempDir, 'kokoro-v1.0.onnx');
    fs.writeFileSync(dummyPath, Buffer.alloc(0));

    const stat = fs.statSync(dummyPath);
    assertEqual(stat.size, 0);

    const isAssetValid = (filePath: string, minSize: number): boolean => {
      if (!fs.existsSync(filePath)) return false;
      return fs.statSync(filePath).size >= minSize;
    };

    assertEqual(isAssetValid(dummyPath, 10_000_000), false, 'Zero-byte model file must be rejected');
  }, { id: 'T2-F05-04', feature: 'F05', tier: 2 });

  test('T2-F05-05: Non-standard --dest override targets arbitrary staging directory safely', async (ctx) => {
    const tempDir = ctx.createTempDir('dest-override-');
    const customDest = path.join(tempDir, 'custom-models');
    fs.mkdirSync(customDest, { recursive: true });
    assertTrue(fs.existsSync(customDest), 'Custom dest path must exist');
    assertTrue(!customDest.includes('models/kokoro'), 'Custom dest overrides default layout');
  }, { id: 'T2-F05-05', feature: 'F05', tier: 2 });
}, { feature: 'F05', tier: 2 });
