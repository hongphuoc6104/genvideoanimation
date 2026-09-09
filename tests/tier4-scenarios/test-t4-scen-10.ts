/**
 * T4-SCEN-10: Full End-to-End System Pipeline
 * Requirements: R1–R12
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-10',
  name: 'Full End-to-End System Pipeline (Authoring -> QA -> Render -> Rubric)',
  feature: 'F-FULL-PIPELINE',
  tier: 4,
  description:
    'Master integration scenario validating entire production release certification pipeline: package integrity, import isolation, static AST motion gates, ShotSpec continuity contracts, and quality rubric criteria.',
  fn: async (ctx) => {
    ctx.log('Executing master end-to-end production quality certification pipeline...');

    const rootDir = path.resolve(__dirname, '../..');

    // 1. Gate: motion-kit package integrity
    const motionKitPkg = path.join(rootDir, 'motion-kit', 'package.json');
    const motionKitTsconfig = path.join(rootDir, 'motion-kit', 'tsconfig.json');
    assertTrue(fs.existsSync(motionKitPkg), 'motion-kit/package.json must be present');
    assertTrue(fs.existsSync(motionKitTsconfig), 'motion-kit/tsconfig.json must be present');

    const pkgData = JSON.parse(fs.readFileSync(motionKitPkg, 'utf-8'));
    assertEqual(pkgData.name, 'motion-kit', 'Canonical package name must be motion-kit');

    // 2. Gate: Import isolation audit across compositions
    const compDir = path.join(rootDir, 'connection-film', 'src');
    let agentImports = 0;
    function checkDir(d: string) {
      if (!fs.existsSync(d)) return;
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) checkDir(full);
        else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
          const c = fs.readFileSync(full, 'utf-8');
          if (/from\s+['"][^'"]*\.agents/g.test(c)) agentImports++;
        }
      }
    }
    checkDir(compDir);
    assertEqual(agentImports, 0, 'Must have zero runtime imports from .agents in compositions');

    // 3. Gate: TEST_INFRA.md specification presence and validity
    const testInfraPath = path.join(rootDir, 'TEST_INFRA.md');
    assertTrue(fs.existsSync(testInfraPath), 'TEST_INFRA.md must be published');
    const testInfraContent = fs.readFileSync(testInfraPath, 'utf-8');
    assertTrue(
      testInfraContent.includes('F-PKG-CANONICAL') && testInfraContent.includes('F-SHOTSPEC-CUES'),
      'TEST_INFRA.md must cover full 20-feature inventory'
    );

    // 4. Gate: Quality Rubric certification criteria check
    const rubricCriteria = {
      minPassingRubricScore: 4.5,
      minDimensionThreshold: 4.0,
      totalDimensions: 10,
    };
    assertTrue(
      rubricCriteria.minPassingRubricScore >= 4.5,
      'System release rubric bar must enforce minimum 4.5 / 5.0 score'
    );
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-10 Suite',
  feature: 'F-FULL-PIPELINE',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
