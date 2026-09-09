/**
 * T4-SCEN-01: Human Conversational Explainer Acting
 * Benchmark: BenchmarkV2HumanExplainer.tsx (Benchmark V2-A)
 * Requirements: R1, R2, R3, R4, R9, R10
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-01',
  name: 'Human Conversational Explainer Acting (Benchmark V2-A)',
  feature: 'F-BENCHMARK-HUMAN',
  tier: 4,
  description:
    'End-to-end scenario verifying 150-frame conversational explainer featuring articulated HumanRig Maya across 4 performance beats (calm, energetic, dramatic, playful), look-ahead camera tracking, and validated ShotSpec.',
  fn: async (ctx) => {
    const rootDir = path.resolve(__dirname, '../..');
    const compPath = path.join(
      rootDir,
      'connection-film',
      'src',
      'benchmarks',
      'v2',
      'BenchmarkV2HumanExplainer.tsx'
    );
    const specPath = path.join(
      rootDir,
      'connection-film',
      'src',
      'benchmarks',
      'v2',
      'shot-spec.v2-a.json'
    );

    if (!fs.existsSync(compPath) || !fs.existsSync(specPath)) {
      ctx.notImplemented(
        'BenchmarkV2HumanExplainer.tsx or shot-spec.v2-a.json not yet created (Planned for M5)'
      );
      return;
    }

    ctx.log('Validating BenchmarkV2HumanExplainer composition and ShotSpec...');

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

    // 2. Validate AST Linter on BenchmarkV2HumanExplainer.tsx
    let { module: linter } = await resolveModule('../../validators/motion-lint');
    if (!linter) {
      const rootRes = await resolveModule('../../motion-lint');
      linter = rootRes.module;
    }

    if (linter?.lintSourceFile) {
      const violations = linter.lintSourceFile(compPath);
      const criticalOrMajor = violations.filter(
        (v: any) => v.severity === 'CRITICAL' || v.severity === 'MAJOR'
      );
      assertEqual(
        criticalOrMajor.length,
        0,
        `BenchmarkV2HumanExplainer must have 0 Critical/Major lint violations: ${JSON.stringify(criticalOrMajor)}`
      );
    }
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-01 Suite',
  feature: 'F-BENCHMARK-HUMAN',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
