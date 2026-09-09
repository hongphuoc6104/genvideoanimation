/**
 * T3-COMB-08: Geometric Path Morphing vs AST Motion Linter Enforcement
 * Features: F-MORPH-INTERPOLATE + F-AST-LINTER
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import {
  resolveModule,
  SYNTHETIC_CODE_CONTINUOUS_MORPH,
  SYNTHETIC_CODE_BINARY_MORPH,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-08',
  name: 'Geometric Path Morphing vs AST Motion Linter Enforcement',
  feature: 'F-MORPH-INTERPOLATE+F-AST-LINTER',
  tier: 3,
  description:
    'Verifies AST motion linter approves continuous geometric path morphing while flagging binary conditional ternary flips as CRITICAL violations.',
  fn: async (ctx) => {
    let { module: linter, isAvailable } = await resolveModule('../../validators/motion-lint', [
      'lintSourceCode',
    ]);

    if (!isAvailable || !linter) {
      // Try root motion-lint.ts
      const rootRes = await resolveModule('../../motion-lint', ['lintSourceCode']);
      if (!rootRes.isAvailable || !rootRes.module) {
        ctx.notImplemented('AST motion linter with lintSourceCode not yet implemented (Planned for M4)');
        return;
      }
      linter = rootRes.module;
    }

    ctx.log('Running AST linter against continuous morph and binary morph fixtures...');

    const validViolations = linter.lintSourceCode(SYNTHETIC_CODE_CONTINUOUS_MORPH, 'ContinuousMorph.tsx');
    const hasMorphViolationInValid = validViolations.some(
      (v: any) => v.rule === 'no-conditional-morph-swap'
    );
    assertTrue(!hasMorphViolationInValid, 'Continuous geometric morph must not produce morph violations');

    const invalidViolations = linter.lintSourceCode(SYNTHETIC_CODE_BINARY_MORPH, 'BinaryMorph.tsx');
    const morphViolation = invalidViolations.find(
      (v: any) => v.rule === 'no-conditional-morph-swap'
    );
    assertTrue(
      !!morphViolation,
      'Binary ternary morph flip must trigger no-conditional-morph-swap violation'
    );
    assertEqual(morphViolation.severity, 'CRITICAL', 'Severity must be CRITICAL');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-08 Suite',
  feature: 'F-MORPH-INTERPOLATE+F-AST-LINTER',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
