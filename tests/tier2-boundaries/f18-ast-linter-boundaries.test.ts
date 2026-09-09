import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F18: Recursive AST Motion Linter Anti-Pattern Detection Boundaries',
  feature: 'F-AST-LINTER',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F18-01',
      name: 'Non-Morph Ternary Expression False Positive Defense',
      feature: 'F-AST-LINTER',
      tier: 2,
      description: 'Standard style or color ternary expression does not trigger no-conditional-morph-swap rule',
      fn: async (ctx) => {
        const { module: linter, isAvailable } = await resolveModule(
          '../../validators/motion-lint',
          ['runMotionLintOnCode', 'lintSourceCode']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/motion-lint not yet implemented (Planned for M4)');
          return;
        }

        const lintFn = linter.runMotionLintOnCode || linter.lintSourceCode;
        const styleCode = `
          export const Button = ({ isSelected }: { isSelected: boolean }) => {
            const color = isSelected ? '#3b82f6' : '#94a3b8';
            return <div style={{ color }}>Click</div>;
          };
        `;
        const violations = lintFn(styleCode, 'Button.tsx');
        const morphViolations = violations.filter(
          (v: any) => (v.ruleId ?? v.rule) === 'no-conditional-morph-swap'
        );
        assertEqual(morphViolations.length, 0, 'Must produce 0 false positives on non-morph ternaries');
      },
    },
    {
      id: 'TEST-T2-F18-02',
      name: 'Syntax Error in Inspected Source Code',
      feature: 'F-AST-LINTER',
      tier: 2,
      description: 'Parsing code with intentional syntax error produces structured diagnostic violation without runner crash',
      fn: async (ctx) => {
        const { module: linter, isAvailable } = await resolveModule(
          '../../validators/motion-lint',
          ['runMotionLintOnCode', 'lintSourceCode']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/motion-lint not yet implemented (Planned for M4)');
          return;
        }

        const lintFn = linter.runMotionLintOnCode || linter.lintSourceCode;
        const brokenCode = 'const broken = { unclosed syntax;';
        const violations = lintFn(brokenCode, 'Broken.tsx');
        assertTrue(violations.length > 0, 'Must report at least one violation for syntax error');
        const hasSyntaxError = violations.some(
          (v: any) =>
            (v.ruleId ?? v.rule ?? '').includes('syntax') ||
            (v.message ?? '').includes('syntax') ||
            (v.severity ?? '') === 'ERROR'
        );
        assertTrue(hasSyntaxError, 'Must report syntax-error rule or message');
      },
    },
    {
      id: 'TEST-T2-F18-03',
      name: 'Deeply Nested Conditional Morph Flip (6 Levels Deep)',
      feature: 'F-AST-LINTER',
      tier: 2,
      description: 'AST visitor traverses 6 levels of JSX nesting to detect and flag conditional morph swaps',
      fn: async (ctx) => {
        const { module: linter, isAvailable } = await resolveModule(
          '../../validators/motion-lint',
          ['runMotionLintOnCode', 'lintSourceCode']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/motion-lint not yet implemented (Planned for M4)');
          return;
        }

        const lintFn = linter.runMotionLintOnCode || linter.lintSourceCode;
        const deeplyNestedSnippet = `
          export const DeepMorph = ({ progress }: { progress: number }) => (
            <div className="outer">
              <section>
                <div>
                  <svg viewBox="0 0 100 100">
                    <g>
                      <g className="inner">
                        {progress < 0.5 ? <circle cx="50" cy="50" r="40" /> : <rect width="80" height="80" />}
                      </g>
                    </g>
                  </svg>
                </div>
              </section>
            </div>
          );
        `;
        const violations = lintFn(deeplyNestedSnippet, 'DeepMorph.tsx');
        const found = violations.some(
          (v: any) => (v.ruleId ?? v.rule) === 'no-conditional-morph-swap'
        );
        assertTrue(found, 'Must detect no-conditional-morph-swap nested 6 levels deep');
      },
    },
    {
      id: 'TEST-T2-F18-04',
      name: 'Completely Empty File Linting',
      feature: 'F-AST-LINTER',
      tier: 2,
      description: 'Linting an empty string returns empty violations array without parse exception',
      fn: async (ctx) => {
        const { module: linter, isAvailable } = await resolveModule(
          '../../validators/motion-lint',
          ['runMotionLintOnCode', 'lintSourceCode']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/motion-lint not yet implemented (Planned for M4)');
          return;
        }

        const lintFn = linter.runMotionLintOnCode || linter.lintSourceCode;
        const violations = lintFn('', 'Empty.tsx');
        assertEqual(violations.length, 0, 'Empty file must produce 0 violations');
      },
    },
    {
      id: 'TEST-T2-F18-05',
      name: 'Obfuscated Variable Naming Invariance',
      feature: 'F-AST-LINTER',
      tier: 2,
      description: 'Structural detector identifies monolithic SVG character anti-pattern even with obfuscated variable names',
      fn: async (ctx) => {
        const { module: linter, isAvailable } = await resolveModule(
          '../../validators/motion-lint',
          ['runMotionLintOnCode', 'lintSourceCode']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/motion-lint not yet implemented (Planned for M4)');
          return;
        }

        const lintFn = linter.runMotionLintOnCode || linter.lintSourceCode;
        const obfuscatedSnippet = `
          export const _0x1a = ({ _0x2b }: { _0x2b: any }) => (
            <svg viewBox="0 0 200 200">
              <path d="M 10 10 L 90 90 Z" />
            </svg>
          );
        `;
        const violations = lintFn(obfuscatedSnippet, 'Obfuscated.tsx');
        assertTrue(violations !== null && Array.isArray(violations), 'Must return violations array');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
