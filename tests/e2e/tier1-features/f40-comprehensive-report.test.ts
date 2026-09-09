/**
 * tests/e2e/tier1-features/f40-comprehensive-report.test.ts
 * Tier 1: Feature Coverage Tests for F40 (Comprehensive Evaluation Report)
 */

import {
  assertEqual,
  assertTrue,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

export const BENCHMARK_REPORT_TEMPLATE = {
  filename: 'benchmark-v3-report.md',
  requiredSections: [
    'Executive Summary',
    'Benchmark A: Standard Educational Narration',
    'Benchmark B: Difficult Technical Narration',
    'Benchmark C: Rapid / Expressive Narration',
    'Voice Comparison Evaluation',
    'Automated Quality Gates Summary',
    'Offline & Air-Gapped Verification',
    'Pass / Fail Certification Scorecard',
  ],
  requiredMetrics: [
    'Duration (s)',
    'Sample Rate (Hz)',
    'Reading Speed (CPS)',
    'True Peak (dBFS)',
    'Integrated Loudness (LUFS)',
    'Alignment Confidence',
  ],
};

export const suite: TestSuite = {
  name: 'Tier 1: F40 Comprehensive Evaluation Report',
  feature: 'F40',
  tier: 1,
  tests: [
    {
      id: 'T1-F40-01',
      name: 'Report output path is canonically benchmark-v3-report.md',
      feature: 'F40',
      tier: 1,
      fn: async (ctx) => {
        assertEqual(BENCHMARK_REPORT_TEMPLATE.filename, 'benchmark-v3-report.md');
      },
    },
    {
      id: 'T1-F40-02',
      name: 'Report structure aggregates benchmarks A, B, C, and Voice Comparison',
      feature: 'F40',
      tier: 1,
      fn: async (ctx) => {
        const sections = BENCHMARK_REPORT_TEMPLATE.requiredSections;
        assertTrue(sections.some((s) => s.includes('Benchmark A')));
        assertTrue(sections.some((s) => s.includes('Benchmark B')));
        assertTrue(sections.some((s) => s.includes('Benchmark C')));
        assertTrue(sections.some((s) => s.includes('Voice Comparison')));
      },
    },
    {
      id: 'T1-F40-03',
      name: 'Report includes quantitative metrics for CPS, LUFS, sample rate, and true peak',
      feature: 'F40',
      tier: 1,
      fn: async (ctx) => {
        const metrics = BENCHMARK_REPORT_TEMPLATE.requiredMetrics;
        assertTrue(metrics.includes('Duration (s)'));
        assertTrue(metrics.includes('Sample Rate (Hz)'));
        assertTrue(metrics.includes('Reading Speed (CPS)'));
        assertTrue(metrics.includes('True Peak (dBFS)'));
        assertTrue(metrics.includes('Integrated Loudness (LUFS)'));
        assertTrue(metrics.includes('Alignment Confidence'));
      },
    },
    {
      id: 'T1-F40-04',
      name: 'Report contains dedicated section verifying 100% offline air-gapped status',
      feature: 'F40',
      tier: 1,
      fn: async (ctx) => {
        const sections = BENCHMARK_REPORT_TEMPLATE.requiredSections;
        assertTrue(
          sections.includes('Offline & Air-Gapped Verification'),
          'Report must include Offline & Air-Gapped Verification section'
        );
      },
    },
    {
      id: 'T1-F40-05',
      name: 'Report provides pass/fail scorecard and quality gate certification',
      feature: 'F40',
      tier: 1,
      fn: async (ctx) => {
        const sections = BENCHMARK_REPORT_TEMPLATE.requiredSections;
        assertTrue(
          sections.includes('Pass / Fail Certification Scorecard'),
          'Report must include Pass / Fail Certification Scorecard'
        );
      },
    },
  ],
};

registerSuite(suite);
