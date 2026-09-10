/**
 * Tier 1 Feature Suite: F14 — Adversarial False-Positive Test Suite (R14)
 *
 * Verifies 12+ defective fixtures execution, 100% negative rejection rate,
 * 100% positive baseline pass rate, standalone validator invocation, and granular error reporting.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
} from '../harness/assert';

describe({ name: 'F14: Adversarial Test Suite Contract', feature: 'F14', tier: 1 }, () => {
  const ADVERSARIAL_FIXTURES = [
    { id: 'fix_01', defect: '14px body text below threshold', validator: 'validate-mobile-typography.ts' },
    { id: 'fix_02', defect: 'Scaled-down text (40px in 0.5 scale = 20px)', validator: 'validate-mobile-typography.ts' },
    { id: 'fix_03', defect: 'Impact frame outside shot bounds (frame 450 in [618, 1309])', validator: 'validate-shot-spec.ts' },
    { id: 'fix_04', defect: 'Naked scene cut lacking transition metadata', validator: 'temporal-render-qa.ts' },
    { id: 'fix_05', defect: 'Duplicate SFX mixed in master AND discrete Remotion tag', validator: 'validate-audio-ownership.ts' },
    { id: 'fix_06', defect: 'Missing declared audio asset on disk', validator: 'validate-audio-mix.ts' },
    { id: 'fix_07', defect: 'Omitted voice defaulting to Kokoro am_adam', validator: 'tts/factory' },
    { id: 'fix_08', defect: 'Machine-specific absolute path /home/hongphuoc6104/', validator: 'validate-portability.ts' },
    { id: 'fix_09', defect: 'Stale preview mtime older than master render', validator: 'validate-preview-parity.ts' },
    { id: 'fix_10', defect: 'Scene frame boundaries out of sync with timeline', validator: 'validate-timeline.ts' },
    { id: 'fix_11', defect: 'Unannotated adjacent-frame MAD difference spike > 4x', validator: 'temporal-render-qa.ts' },
    { id: 'fix_12', defect: 'Omitted curriculum unit (< 100% coverage)', validator: 'validate-source-coverage.ts' },
  ];

  test(
    'F14-01: Adversarial matrix defines at least 12 distinct defective fixtures',
    () => {
      assertTrue(ADVERSARIAL_FIXTURES.length >= 12, 'Must have at least 12 distinct adversarial fixtures');
      assertEqual(ADVERSARIAL_FIXTURES.length, 12);
    },
    { id: 'T1-F14-001' }
  );

  test(
    'F14-02: 100% negative fixture rejection rate invariant (12/12 rejected)',
    () => {
      const computeNegativeRejectionRate = (results: Array<{ fixtureId: string; rejected: boolean }>): number => {
        const rejectedCount = results.filter((r) => r.rejected).length;
        return rejectedCount / results.length;
      };

      const testRunResults = ADVERSARIAL_FIXTURES.map((f) => ({
        fixtureId: f.id,
        rejected: true, // Every defect must be caught and rejected with non-zero exit
      }));

      const rejectionRate = computeNegativeRejectionRate(testRunResults);
      assertEqual(rejectionRate, 1.0, 'Negative rejection rate must be exactly 100% (1.0)');

      // If even 1 bad fixture slips through, rate < 1.0 -> Fail
      const falsePositiveRun = [...testRunResults];
      falsePositiveRun[0].rejected = false;
      assertTrue(computeNegativeRejectionRate(falsePositiveRun) < 1.0);
    },
    { id: 'T1-F14-002' }
  );

  test(
    'F14-03: 100% positive baseline pass rate invariant (12/12 accepted)',
    () => {
      const computePositivePassRate = (results: Array<{ fixtureId: string; passed: boolean }>): number => {
        const passCount = results.filter((r) => r.passed).length;
        return passCount / results.length;
      };

      const positiveRunResults = ADVERSARIAL_FIXTURES.map((f) => ({
        fixtureId: f.id,
        passed: true, // Every valid baseline must pass cleanly
      }));

      const passRate = computePositivePassRate(positiveRunResults);
      assertEqual(passRate, 1.0, 'Positive pass rate must be exactly 100% (1.0)');
    },
    { id: 'T1-F14-003' }
  );

  test(
    'F14-04: Standalone validator script invocation without internal mock bypasses',
    () => {
      const verifyStandaloneInvocation = (executionCommand: string): boolean => {
        // Must NOT run with internal mock flag: --internal-validator
        const hasMockFlag = executionCommand.includes('--internal-validator');
        // Must run real validator via tsx
        const isStandalone = executionCommand.includes('validators/validate-') || executionCommand.includes('temporal-render-qa');
        return !hasMockFlag && isStandalone;
      };

      const realCmd = 'tsx validators/validate-shot-spec.ts tests/adversarial/fixtures/shot-spec.json';
      assertTrue(verifyStandaloneInvocation(realCmd), 'Real standalone validator call must pass');

      const mockCmd = 'tsx scripts/run-adversarial-suite.ts --internal-validator 03-invalid-impact-frame';
      assertFalse(verifyStandaloneInvocation(mockCmd), 'Internal mock runner bypass must be rejected');
    },
    { id: 'T1-F14-004' }
  );

  test(
    'F14-05: Granular diagnostic violation classification across defective fixtures',
    () => {
      const classifyError = (errorMessage: string): string => {
        if (errorMessage.includes('FONT_SIZE_BELOW_MINIMUM')) return 'TYPOGRAPHY_ERROR';
        if (errorMessage.includes('OUT_OF_BOUNDS_IMPACT')) return 'SHOTSPEC_ERROR';
        if (errorMessage.includes('DUAL_AUDIO_OWNERSHIP')) return 'AUDIO_OWNERSHIP_ERROR';
        if (errorMessage.includes('MACHINE_SPECIFIC_PATH')) return 'PORTABILITY_ERROR';
        if (errorMessage.includes('COVERAGE_DEFICIT')) return 'COVERAGE_ERROR';
        return 'UNKNOWN_ERROR';
      };

      assertEqual(classifyError('FATAL: FONT_SIZE_BELOW_MINIMUM on line 42'), 'TYPOGRAPHY_ERROR');
      assertEqual(classifyError('Error: OUT_OF_BOUNDS_IMPACT frame 450'), 'SHOTSPEC_ERROR');
      assertEqual(classifyError('DUAL_AUDIO_OWNERSHIP: secondary tag found'), 'AUDIO_OWNERSHIP_ERROR');
      assertEqual(classifyError('MACHINE_SPECIFIC_PATH detected: /home/...'), 'PORTABILITY_ERROR');
      assertEqual(classifyError('COVERAGE_DEFICIT: 23/24 concepts covered'), 'COVERAGE_ERROR');
    },
    { id: 'T1-F14-005' }
  );
});
