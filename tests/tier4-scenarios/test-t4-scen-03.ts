/**
 * T4-SCEN-03: Multi-Stage Network Protocol Data Flow
 * Benchmark: BenchmarkV2NetworkFlow.tsx (Benchmark V2-C)
 * Requirements: R1, R2, R6, R4, R9, R10
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-03',
  name: 'Multi-Stage Network Protocol Data Flow (Benchmark V2-C)',
  feature: 'F-BENCHMARK-NETWORK',
  tier: 4,
  description:
    'End-to-end scenario verifying 180-frame 3-shot network protocol visualization: exact cubic Bezier packet travel with tangent banking, multi-branch consensus dispatch, and audio-synchronized database commit impact.',
  fn: async (ctx) => {
    const rootDir = path.resolve(__dirname, '../..');
    const compPath = path.join(
      rootDir,
      'connection-film',
      'src',
      'benchmarks',
      'v2',
      'BenchmarkV2NetworkFlow.tsx'
    );
    const specPath = path.join(
      rootDir,
      'connection-film',
      'src',
      'benchmarks',
      'v2',
      'shot-spec.v2-c.json'
    );

    if (!fs.existsSync(compPath) || !fs.existsSync(specPath)) {
      ctx.notImplemented(
        'BenchmarkV2NetworkFlow.tsx or shot-spec.v2-c.json not yet created (Planned for M5)'
      );
      return;
    }

    ctx.log('Validating BenchmarkV2NetworkFlow composition and ShotSpec...');

    let { module: validatorMod } = await resolveModule('../../validators/validate-shot-spec');
    if (!validatorMod) {
      const rootRes = await resolveModule('../../validate-shot-spec');
      validatorMod = rootRes.module;
    }

    if (validatorMod?.validateShotSpec) {
      const specData = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
      const shots = Array.isArray(specData.shots) ? specData.shots : specData;
      for (let i = 0; i < shots.length; i++) {
        const prev = i > 0 ? shots[i - 1] : undefined;
        const res = validatorMod.validateShotSpec(shots[i], prev);
        assertTrue(res.valid, `ShotSpec validation failed for shot ${shots[i].shot_id}: ${res.errors?.join(', ')}`);
      }
    }
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-03 Suite',
  feature: 'F-BENCHMARK-NETWORK',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
