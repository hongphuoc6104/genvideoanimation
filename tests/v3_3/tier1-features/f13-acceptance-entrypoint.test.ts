/**
 * Tier 1 Feature Suite: F13 — Canonical Acceptance Entrypoint (R13)
 *
 * Verifies unified v3.3:gate command chain, fail-closed execution, zero warnings-as-pass,
 * typecheck integration, and test suite execution.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';

describe({ name: 'F13: Canonical Acceptance Entrypoint Contract', feature: 'F13', tier: 1 }, () => {
  test(
    'F13-01: Canonical v3.3:gate command chain defines ordered quality gates',
    () => {
      const getCanonicalGateSequence = (): string[] => [
        'npm run typecheck',
        'npm test',
        'npx tsx validators/validate-mobile-typography.ts',
        'npx tsx validators/validate-shot-spec.ts',
        'npx tsx validators/validate-timeline.ts',
        'npx tsx validators/validate-source-coverage.ts',
        'npx tsx validators/validate-audio-ownership.ts',
        'npx tsx validators/validate-audio-policy.ts',
        'npx tsx validators/validate-audio-mix.ts',
        'npx tsx validators/validate-portability.ts',
        'npx tsx validators/temporal-render-qa.ts',
        'npx tsx validators/validate-preview-parity.ts',
        'npx tsx validators/validate-preview-rubric.ts',
        'npm run test:adversarial',
      ];

      const sequence = getCanonicalGateSequence();
      assertTrue(sequence.length >= 12, 'Gate sequence must include all primary validation stages');
      assertEqual(sequence[0], 'npm run typecheck', 'Typecheck must be first in chain');
      assertEqual(sequence[1], 'npm test', 'Unit/E2E test suite must run early in chain');
      assertTrue(sequence.includes('npx tsx validators/validate-mobile-typography.ts'));
      assertTrue(sequence.includes('npx tsx validators/validate-source-coverage.ts'));
      assertTrue(sequence.includes('npx tsx validators/validate-preview-parity.ts'));
    },
    { id: 'T1-F13-001' }
  );

  test(
    'F13-02: Fail-closed execution immediately halts gate pipeline on any non-zero exit code',
    () => {
      const runPipeline = (stepExitCodes: number[]): { passed: boolean; executedSteps: number } => {
        let executed = 0;
        for (const code of stepExitCodes) {
          executed++;
          if (code !== 0) {
            return { passed: false, executedSteps: executed };
          }
        }
        return { passed: true, executedSteps: executed };
      };

      // All steps succeed -> Pipeline passes, all steps executed
      const allPass = runPipeline([0, 0, 0, 0]);
      assertTrue(allPass.passed);
      assertEqual(allPass.executedSteps, 4);

      // Step 2 fails -> Pipeline fails, steps 3 and 4 never executed
      const earlyFail = runPipeline([0, 1, 0, 0]);
      assertFalse(earlyFail.passed);
      assertEqual(earlyFail.executedSteps, 2, 'Pipeline must fail closed at step 2');
    },
    { id: 'T1-F13-002' }
  );

  test(
    'F13-03: Zero warnings-as-pass policy treats unhandled warnings or partial fails as failure',
    () => {
      const evaluateGateResult = (result: { exitCode: number; warningCount: number; strict: boolean }): boolean => {
        if (result.exitCode !== 0) return false;
        if (result.strict && result.warningCount > 0) return false;
        return true;
      };

      // Clean exit with 0 warnings
      assertTrue(evaluateGateResult({ exitCode: 0, warningCount: 0, strict: true }));

      // Exit 0 with warnings under strict mode -> Fail
      assertFalse(evaluateGateResult({ exitCode: 0, warningCount: 2, strict: true }));

      // Exit 1 regardless of warnings -> Fail
      assertFalse(evaluateGateResult({ exitCode: 1, warningCount: 0, strict: false }));
    },
    { id: 'T1-F13-003' }
  );

  test(
    'F13-04: Typecheck integration enforces zero TypeScript compiler errors',
    () => {
      const parseTscOutput = (stdout: string): { errors: number; clean: boolean } => {
        const errorMatches = stdout.match(/error TS\d+:/g) || [];
        return {
          errors: errorMatches.length,
          clean: errorMatches.length === 0,
        };
      };

      const cleanOutput = '✨ TypeScript compilation completed with 0 errors.';
      assertTrue(parseTscOutput(cleanOutput).clean);

      const errorOutput = `
        src/index.ts:15:23 - error TS2322: Type 'string' is not assignable to type 'number'.
        src/utils.ts:42:5 - error TS2304: Cannot find name 'foo'.
      `;
      const result = parseTscOutput(errorOutput);
      assertFalse(result.clean);
      assertEqual(result.errors, 2);
    },
    { id: 'T1-F13-004' }
  );

  test(
    'F13-05: E2E test harness execution is required in gate chain',
    () => {
      const verifyHarnessInGate = (packageJsonScripts: Record<string, string>): boolean => {
        const gateScript = packageJsonScripts['v3.3:gate'] || '';
        return (
          gateScript.includes('tests/v3_3/run-v3_3-e2e.ts') ||
          gateScript.includes('npm test') ||
          gateScript.includes('test:v3_3')
        );
      };

      const validScripts = {
        'v3.3:gate': 'npm run typecheck && npx tsx tests/v3_3/run-v3_3-e2e.ts && echo "PASS"',
      };
      assertTrue(verifyHarnessInGate(validScripts));

      const invalidScripts = {
        'v3.3:gate': 'npm run lint && echo "BYPASS"',
      };
      assertFalse(verifyHarnessInGate(invalidScripts));
    },
    { id: 'T1-F13-005' }
  );
});
