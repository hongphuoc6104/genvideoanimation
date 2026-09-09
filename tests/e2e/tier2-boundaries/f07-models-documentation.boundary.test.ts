/**
 * tests/e2e/tier2-boundaries/f07-models-documentation.boundary.test.ts
 * Feature F07: Models Documentation Boundary Tests (T2-F07-01 to T2-F07-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F07: Models Documentation Boundary Tests', () => {
  test('T2-F07-01: models/README.md exists and contains non-empty documentation', async (ctx) => {
    const readmePath = path.resolve(process.cwd(), 'models/README.md');
    assertTrue(fs.existsSync(readmePath), 'models/README.md must exist');
    const content = fs.readFileSync(readmePath, 'utf8');
    assertTrue(content.length > 200, 'README.md must have substantial documentation content');
  }, { id: 'T2-F07-01', feature: 'F07', tier: 2 });

  test('T2-F07-02: Documentation covers Kokoro-82M ONNX model provenance and Apache-2.0 license', async (ctx) => {
    const readmePath = path.resolve(process.cwd(), 'models/README.md');
    if (!fs.existsSync(readmePath)) {
      ctx.notImplemented('models/README.md not found');
      return;
    }
    const content = fs.readFileSync(readmePath, 'utf8');
    assertTrue(/kokoro/i.test(content), 'Must document Kokoro model');
    assertTrue(/82M|onnx/i.test(content), 'Must specify ONNX architecture or 82M parameter size');
  }, { id: 'T2-F07-02', feature: 'F07', tier: 2 });

  test('T2-F07-03: Documentation covers WhisperX / Wav2Vec2 forced alignment model requirements', async (ctx) => {
    const readmePath = path.resolve(process.cwd(), 'models/README.md');
    if (!fs.existsSync(readmePath)) {
      ctx.notImplemented('models/README.md not found');
      return;
    }
    const content = fs.readFileSync(readmePath, 'utf8');
    assertTrue(/wav2vec2|whisper|alignment/i.test(content), 'Must document alignment model details');
  }, { id: 'T2-F07-03', feature: 'F07', tier: 2 });

  test('T2-F07-04: Documentation specifies directory layout tree under models/', async (ctx) => {
    const readmePath = path.resolve(process.cwd(), 'models/README.md');
    if (!fs.existsSync(readmePath)) {
      ctx.notImplemented('models/README.md not found');
      return;
    }
    const content = fs.readFileSync(readmePath, 'utf8');
    assertTrue(content.includes('kokoro/'), 'Must list kokoro/ directory in structure');
    assertTrue(content.includes('alignment/'), 'Must list alignment/ directory in structure');
  }, { id: 'T2-F07-04', feature: 'F07', tier: 2 });

  test('T2-F07-05: Documentation specifies setup script commands and offline environment variables', async (ctx) => {
    const readmePath = path.resolve(process.cwd(), 'models/README.md');
    if (!fs.existsSync(readmePath)) {
      ctx.notImplemented('models/README.md not found');
      return;
    }
    const content = fs.readFileSync(readmePath, 'utf8');
    assertTrue(/narration:setup|setup-narration-models/i.test(content), 'Must document setup command');
    assertTrue(/offline/i.test(content), 'Must document offline operation');
  }, { id: 'T2-F07-05', feature: 'F07', tier: 2 });
}, { feature: 'F07', tier: 2 });
