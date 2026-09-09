/**
 * tests/e2e/tier1-features/f05-model-setup-utility.test.ts
 * Tier 1: Feature Coverage Tests for F05 (Model Setup Utility)
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F05 Model Setup Utility',
  feature: 'F05',
  tier: 1,
  tests: [
    {
      id: 'T1-F05-01',
      name: 'setup-narration-models.ts script exists in scripts directory',
      feature: 'F05',
      tier: 1,
      fn: async (ctx) => {
        const scriptPath = path.join(REPO_ROOT, 'scripts', 'setup-narration-models.ts');
        assertTrue(fs.existsSync(scriptPath), 'scripts/setup-narration-models.ts must exist');
      },
    },
    {
      id: 'T1-F05-02',
      name: 'Script targets models/kokoro directory for Kokoro ONNX model and voices',
      feature: 'F05',
      tier: 1,
      fn: async (ctx) => {
        const scriptPath = path.join(REPO_ROOT, 'scripts', 'setup-narration-models.ts');
        const content = fs.readFileSync(scriptPath, 'utf-8');
        assertTrue(content.includes('models') && content.includes('kokoro'), 'Script must reference models/kokoro');
        assertTrue(content.includes('kokoro-v1.0.onnx'), 'Script must reference kokoro-v1.0.onnx');
      },
    },
    {
      id: 'T1-F05-03',
      name: 'Script targets models/alignment directory for Wav2Vec2 forced alignment model',
      feature: 'F05',
      tier: 1,
      fn: async (ctx) => {
        const scriptPath = path.join(REPO_ROOT, 'scripts', 'setup-narration-models.ts');
        const content = fs.readFileSync(scriptPath, 'utf-8');
        assertTrue(content.includes('alignment'), 'Script must reference alignment models');
        assertTrue(content.includes('wav2vec2'), 'Script must reference wav2vec2 model');
      },
    },
    {
      id: 'T1-F05-04',
      name: 'Setup script supports --check-only flag and executes cleanly',
      feature: 'F05',
      tier: 1,
      fn: async (ctx) => {
        const scriptPath = path.join(REPO_ROOT, 'scripts', 'setup-narration-models.ts');
        const result = childProcess.spawnSync(
          'npx',
          ['tsx', scriptPath, '--check-only'],
          { cwd: REPO_ROOT, encoding: 'utf-8' }
        );
        assertEqual(result.status, 0, `--check-only execution failed with stderr: ${result.stderr}`);
      },
    },
    {
      id: 'T1-F05-05',
      name: 'Pre-staged model assets on local disk have valid non-zero byte sizes',
      feature: 'F05',
      tier: 1,
      fn: async (ctx) => {
        const kokoroOnnx = path.join(REPO_ROOT, 'models', 'kokoro', 'kokoro-v1.0.onnx');
        const alignModel = path.join(REPO_ROOT, 'models', 'alignment', 'wav2vec2_fairseq_base_ls960_asr_ls960.pth');

        assertTrue(fs.existsSync(kokoroOnnx), 'kokoro-v1.0.onnx must exist');
        assertTrue(fs.existsSync(alignModel), 'Wav2Vec2 model file must exist');

        const kokoroStat = fs.statSync(kokoroOnnx);
        const alignStat = fs.statSync(alignModel);

        assertTrue(kokoroStat.size > 10_000_000, `Kokoro ONNX must be > 10MB, got: ${kokoroStat.size}`);
        assertTrue(alignStat.size > 10_000_000, `Wav2Vec2 model must be > 10MB, got: ${alignStat.size}`);
      },
    },
  ],
};

registerSuite(suite);
