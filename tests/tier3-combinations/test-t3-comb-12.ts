/**
 * T3-COMB-12: RigInterface Joint Hierarchy Structural Validation via AST
 * Features: F-RIG-INTERFACE + F-AST-LINTER
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse } from '../harness/assert';
import {
  resolveModule,
  SYNTHETIC_CODE_CORRECT_RIG,
  SYNTHETIC_CODE_MONOLITHIC_RIG,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-12',
  name: 'RigInterface Joint Hierarchy Structural Validation via AST',
  feature: 'F-RIG-INTERFACE+F-AST-LINTER',
  tier: 3,
  description:
    'Verifies AST motion linter enforces RigInterface articulated joint hierarchy, rejecting monolithic inline SVGs lacking independent part transforms.',
  fn: async (ctx) => {
    const { module: linter, isAvailable } = await resolveModule('../../validators/motion-lint', [
      'lintSourceCode',
    ]);
    if (!isAvailable || !linter) {
      ctx.notImplemented('AST motion linter with no-monolithic-character not yet implemented (Planned for M4)');
      return;
    }

    ctx.log('Testing AST motion linter on articulated vs monolithic character rigs...');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rig-lint-'));
    const goodFile = path.join(tempDir, 'ArticulatedCharacter.tsx');
    const badFile = path.join(tempDir, 'MonolithicCharacterArt.tsx');

    fs.writeFileSync(goodFile, SYNTHETIC_CODE_CORRECT_RIG, 'utf-8');
    fs.writeFileSync(badFile, SYNTHETIC_CODE_MONOLITHIC_RIG, 'utf-8');

    try {
      const lintFn = linter.lintSourceFile || ((f: string) => linter.lintSourceCode(fs.readFileSync(f, 'utf-8'), f));

      const goodViolations = lintFn(goodFile);
      const hasMonolithicInGood = goodViolations.some(
        (v: any) => v.rule === 'no-monolithic-character'
      );
      assertFalse(hasMonolithicInGood, 'Articulated rig must not trigger no-monolithic-character');

      const badViolations = lintFn(badFile);
      const hasMonolithicInBad = badViolations.some(
        (v: any) => v.rule === 'no-monolithic-character'
      );
      assertTrue(hasMonolithicInBad, 'Monolithic character rig must trigger no-monolithic-character');
    } finally {
      try {
        fs.unlinkSync(goodFile);
        fs.unlinkSync(badFile);
        fs.rmdirSync(tempDir);
      } catch {}
    }
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-12 Suite',
  feature: 'F-RIG-INTERFACE+F-AST-LINTER',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
