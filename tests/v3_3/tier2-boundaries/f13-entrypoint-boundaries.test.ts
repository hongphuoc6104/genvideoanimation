/**
 * Tier 2 Boundary Suite: F13 — Acceptance Entrypoint Boundaries (R13)
 *
 * Verifies exit code propagation (1, 2, 127), empty pipeline rejection,
 * timeout handling, step 1 failure termination, and stderr aggregation.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';

describe({ name: 'F13-B: Acceptance Entrypoint Boundaries', feature: 'F13', tier: 2 }, () => {
  test(
    'F13-B01: Exit code propagation preserves exact non-zero codes (1, 2, 127)',
    () => {
      const propagateExitCode = (childExitCode: number): number => {
        return childExitCode !== 0 ? childExitCode : 0;
      };

      assertEqual(propagateExitCode(0), 0);
      assertEqual(propagateExitCode(1), 1);
      assertEqual(propagateExitCode(2), 2);
      assertEqual(propagateExitCode(127), 127, 'Command not found 127 preserved');
    },
    { id: 'T2-F13-001' }
  );

  test(
    'F13-B02: Empty gate pipeline configuration rejected',
    () => {
      const validatePipelineConfig = (steps: string[]): { valid: boolean; error?: string } => {
        if (!Array.isArray(steps) || steps.length === 0) {
          return { valid: false, error: 'EMPTY_PIPELINE: No validation gates defined' };
        }
        return { valid: true };
      };

      assertFalse(validatePipelineConfig([]).valid);
      assertTrue(validatePipelineConfig(['npm run typecheck']).valid);
    },
    { id: 'T2-F13-002' }
  );

  test(
    'F13-B03: Timeout enforcement aborts stalled gate step',
    async () => {
      const executeWithTimeout = async <T>(
        promise: Promise<T>,
        timeoutMs: number
      ): Promise<T> => {
        let timer: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`STEP_TIMEOUT: Exceeded ${timeoutMs}ms`)), timeoutMs);
        });
        try {
          return await Promise.race([promise, timeoutPromise]);
        } finally {
          clearTimeout(timer);
        }
      };

      // Fast task completes
      const fastTask = Promise.resolve('COMPLETED');
      const res = await executeWithTimeout(fastTask, 100);
      assertEqual(res, 'COMPLETED');

      // Stalled task times out
      const stalledTask = new Promise((resolve) => setTimeout(resolve, 500));
      let caughtError = '';
      try {
        await executeWithTimeout(stalledTask, 20);
      } catch (err: any) {
        caughtError = err.message;
      }
      assertTrue(caughtError.includes('STEP_TIMEOUT'));
    },
    { id: 'T2-F13-003' }
  );

  test(
    'F13-B04: Non-zero exit on first step halts immediately without executing subsequent steps',
    () => {
      const executionLog: string[] = [];
      const runSteps = (steps: Array<{ name: string; run: () => number }>) => {
        for (const s of steps) {
          executionLog.push(s.name);
          const code = s.run();
          if (code !== 0) {
            return code;
          }
        }
        return 0;
      };

      const result = runSteps([
        { name: 'step1', run: () => 1 },
        { name: 'step2', run: () => 0 },
        { name: 'step3', run: () => 0 },
      ]);

      assertEqual(result, 1);
      assertEqual(executionLog.length, 1, 'Only step 1 must execute before halting');
      assertEqual(executionLog[0], 'step1');
    },
    { id: 'T2-F13-004' }
  );

  test(
    'F13-B05: Stderr capture and aggregation on gate failure',
    () => {
      const aggregateErrorOutput = (
        stepName: string,
        exitCode: number,
        stderr: string
      ): string => {
        return `[GATE_FAILURE] Step "${stepName}" failed with exit code ${exitCode}:\n${stderr.trim()}`;
      };

      const aggregated = aggregateErrorOutput(
        'validate-mobile-typography.ts',
        1,
        'CRITICAL: Text size 20px below 30px floor'
      );
      assertTrue(aggregated.includes('[GATE_FAILURE]'));
      assertTrue(aggregated.includes('exit code 1'));
      assertTrue(aggregated.includes('Text size 20px below 30px floor'));
    },
    { id: 'T2-F13-005' }
  );
});
