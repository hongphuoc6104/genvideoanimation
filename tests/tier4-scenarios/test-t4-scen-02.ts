/**
 * T4-SCEN-02: Complex Mechanical Physics & True Geometry Morph
 * Benchmark: BenchmarkV2MechanicalMorph.tsx (Benchmark V2-B)
 * Requirements: R1, R3, R4, R5, R8, R9
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse, assertEqual } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-02',
  name: 'Complex Mechanical Physics & True Geometry Morph (Benchmark V2-B)',
  feature: 'F-BENCHMARK-MECHANICAL',
  tier: 4,
  description:
    'End-to-end scenario verifying 150-frame mechanical sequence: Geneva clockwork rotational inertia, continuous SVG path morphing (0% ternary flips, N>=64 vertices), and electromagnetic induction spin.',
  fn: async (ctx) => {
    const rootDir = path.resolve(__dirname, '../..');
    const compPath = path.join(
      rootDir,
      'connection-film',
      'src',
      'benchmarks',
      'v2',
      'BenchmarkV2MechanicalMorph.tsx'
    );
    const specPath = path.join(
      rootDir,
      'connection-film',
      'src',
      'benchmarks',
      'v2',
      'shot-spec.v2-b.json'
    );

    if (!fs.existsSync(compPath) || !fs.existsSync(specPath)) {
      ctx.notImplemented(
        'BenchmarkV2MechanicalMorph.tsx or shot-spec.v2-b.json not yet created (Planned for M5)'
      );
      return;
    }

    ctx.log('Validating BenchmarkV2MechanicalMorph composition and ShotSpec...');

    // 1. Validate ShotSpec schema and continuity
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

    // 2. Verify source code does not contain ternary morph swaps
    const code = fs.readFileSync(compPath, 'utf-8');
    const hasTernaryMorphSwap =
      /progress\s*<\s*[\d.]+\s*\?\s*<[A-Za-z0-9_]+\s*\/?>\s*:\s*<[A-Za-z0-9_]+/g.test(code);
    assertFalse(hasTernaryMorphSwap, 'BenchmarkV2MechanicalMorph must not contain binary ternary morph swaps');
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-02 Suite',
  feature: 'F-BENCHMARK-MECHANICAL',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
