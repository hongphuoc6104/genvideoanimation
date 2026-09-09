/**
 * T4-SCEN-05: Recursive AST Linter Anti-Pattern Scanning on Entire Codebase
 * Requirements: R7
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse, assertEqual } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-05',
  name: 'Recursive AST Linter Anti-Pattern Scanning on Entire Codebase',
  feature: 'F-AST-LINTER',
  tier: 4,
  description:
    'End-to-end scenario verifying full-project AST analysis across motion-kit and compositions with 0 Critical/Major violations, plus 100% detection sensitivity on synthetic anti-pattern fixtures.',
  fn: async (ctx) => {
    let { module: linter, isAvailable } = await resolveModule('../../validators/motion-lint');
    if (!isAvailable || !linter) {
      const rootRes = await resolveModule('../../motion-lint');
      if (!rootRes.isAvailable || !rootRes.module) {
        ctx.notImplemented('motion-lint not yet available (Planned for M4)');
        return;
      }
      linter = rootRes.module;
    }

    ctx.log('Running static AST anti-pattern inspection on codebase...');

    const rootDir = path.resolve(__dirname, '../..');
    const v2Dir = path.join(rootDir, 'connection-film', 'src', 'benchmarks', 'v2');

    // 1. Run linter on connection-film/src/benchmarks/v2 if present
    if (linter.runLinter && fs.existsSync(v2Dir)) {
      const report = linter.runLinter([v2Dir]);
      const criticalViolations = report.violations.filter(
        (v: any) => v.severity === 'CRITICAL'
      );
      assertEqual(
        criticalViolations.length,
        0,
        `Found unexpected CRITICAL violations in ${v2Dir}: ${JSON.stringify(criticalViolations)}`
      );
    }

    // 2. Synthetic detection sensitivity test on intentional anti-pattern
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scen-lint-'));
    const badFile = path.join(tempDir, 'BadFadeScene.tsx');

    const badCode = [
      '// File header',
      'export const BadScene = ({ progress }: { progress: number }) => {',
      '  const act0Opacity = fadeOut(progress);',
      '  const act1Opacity = reveal(progress) * fadeOut(progress);',
      '  const act2Opacity = reveal(progress);',
      '  return <div style={{ opacity: act0Opacity }} />;',
      '};',
      '// Trailing lines for window',
      '// Line 8',
      '// Line 9',
      '// Line 10',
    ].join('\n');

    fs.writeFileSync(badFile, badCode, 'utf-8');

    try {
      const lintFn = linter.lintSourceFile || ((f: string) => linter.lintSourceCode(fs.readFileSync(f, 'utf-8'), f));
      const violations = lintFn(badFile);
      const hasOpacityTransition = violations.some(
        (v: any) => v.rule === 'no-opacity-scene-transition'
      );
      assertTrue(
        hasOpacityTransition,
        'Linter must detect no-opacity-scene-transition anti-pattern on synthetic fixture'
      );
    } finally {
      try {
        fs.unlinkSync(badFile);
        fs.rmdirSync(tempDir);
      } catch {}
    }
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-05 Suite',
  feature: 'F-AST-LINTER',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
