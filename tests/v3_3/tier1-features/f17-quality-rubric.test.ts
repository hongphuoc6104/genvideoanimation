/**
 * Tier 1 Feature Suite: F17 — Independent Review & Quality Rubric (R17)
 *
 * Verifies 18-category rubric scoring, overall average >= 4.50, floor minimum >= 4.00,
 * critical minimum >= 4.30, signed qa-report.json, and rejection of sub-threshold scores.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertSchema,
} from '../harness/assert';
import {
  createMockQAReport,
  validateQAReport,
  CRITICAL_CATEGORIES,
  QAReport,
} from '../harness/mock-fixtures';

describe({ name: 'F17: Quality Rubric Certification Contract', feature: 'F17', tier: 1 }, () => {
  test(
    'F17-01: Quality report schema covers all 18 objective evaluation categories',
    () => {
      const report: QAReport = createMockQAReport();
      const validation = validateQAReport(report);
      assertTrue(validation.valid, `QA report validation failed: ${validation.errors.join(', ')}`);

      assertEqual(report.version, '3.3.0');
      assertEqual(Object.keys(report.scores).length, 18, 'Report must contain exactly 18 category scores');
      assertEqual(CRITICAL_CATEGORIES.length, 11, 'Must have exactly 11 critical categories');

      assertSchema(report, {
        version: 'string',
        timestamp: 'string',
        composition: 'string',
        certifiedBy: 'string',
        scores: (s) => typeof s === 'object' && s !== null,
        overallAverage: 'number',
        passed: (p) => p === true,
        verdict: (v) => v === 'CERTIFIED_PRODUCTION_GRADE',
      });
    },
    { id: 'T1-F17-001' }
  );

  test(
    'F17-02: Overall average threshold formula enforces minimum >= 4.50',
    () => {
      const report = createMockQAReport();
      const scores = Object.values(report.scores) as number[];
      const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;

      assertTrue(avg >= 4.50, `Average score ${avg.toFixed(2)} must be >= 4.50`);
      assertEqual(report.overallAverage, Number(avg.toFixed(2)));

      // Sub-threshold report
      const lowAvgReport = createMockQAReport({
        scores: {
          ...report.scores,
          mobileReadability: 4.0,
          effectiveTypographyScaling: 4.0,
          informationDensity: 4.0,
          progressiveDisclosure: 4.0,
          mobileSafeMargins: 4.0,
          karaokeCaptionPlacement: 4.0,
          audioVisualSync: 4.0,
          narrationAcousticQuality: 4.0,
          roleAwarePauseCompliance: 4.0,
          broadcastLoudnessCompliance: 4.0,
          singleAudioOwnership: 4.0,
          authoritativeTimelineDerivation: 4.0,
          shotSpecValidity: 4.0,
          motivatedTransitionsContinuity: 4.0,
          previewLineageParity: 4.0,
          realVideoDecodingIntegrity: 4.0,
          sourceContentCoverage: 4.0,
          productionPortability: 4.0,
        },
      });
      const check = validateQAReport(lowAvgReport);
      assertFalse(check.valid, 'Report with average 4.00 must fail overall >= 4.50 requirement');
    },
    { id: 'T1-F17-002' }
  );

  test(
    'F17-03: Floor minimum threshold requires every individual category score >= 4.00',
    () => {
      const report = createMockQAReport();
      for (const [category, score] of Object.entries(report.scores)) {
        assertTrue(
          score >= 4.00,
          `Category "${category}" score ${score} violates floor minimum of 4.00`
        );
      }

      // 1 failing category under floor minimum
      const floorViolationReport = createMockQAReport({
        scores: {
          ...report.scores,
          informationDensity: 3.9, // 3.9 < 4.0
        },
      });
      const check = validateQAReport(floorViolationReport);
      assertFalse(check.valid);
      assertTrue(check.errors.some((e) => e.includes('failed floor minimum')));
    },
    { id: 'T1-F17-003' }
  );

  test(
    'F17-04: Critical category threshold requires all 11 critical categories >= 4.30',
    () => {
      const report = createMockQAReport();
      for (const cat of CRITICAL_CATEGORIES) {
        const score = report.scores[cat];
        assertTrue(
          score >= 4.30,
          `Critical category "${cat}" score ${score} violates critical minimum of 4.30`
        );
      }

      // Critical category at 4.2 (satisfies 4.0 floor, but fails 4.3 critical minimum)
      const critViolationReport = createMockQAReport({
        scores: {
          ...report.scores,
          singleAudioOwnership: 4.2, // critical category < 4.3
        },
      });
      const check = validateQAReport(critViolationReport);
      assertFalse(check.valid);
      assertTrue(check.errors.some((e) => e.includes('failed critical minimum')));
    },
    { id: 'T1-F17-004' }
  );

  test(
    'F17-05: Signed report validation requires non-empty reviewer signature and certified verdict',
    () => {
      const report = createMockQAReport();
      assertTrue(report.certifiedBy.length > 0, 'Report must be signed by reviewer');
      assertEqual(report.verdict, 'CERTIFIED_PRODUCTION_GRADE');
      assertEqual(report.passed, true);

      // Verify ISO timestamp
      const date = new Date(report.timestamp);
      assertFalse(Number.isNaN(date.getTime()), 'Report timestamp must be valid ISO string');
    },
    { id: 'T1-F17-005' }
  );
});
