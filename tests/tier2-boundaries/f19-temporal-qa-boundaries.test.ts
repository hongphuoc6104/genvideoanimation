import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F19: FFmpeg Video Decoding & Rolling MAD QA Boundaries',
  feature: 'F-TEMPORAL-QA',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F19-01',
      name: 'Completely Static Video (MAD = 0.0 Everywhere)',
      feature: 'F-TEMPORAL-QA',
      tier: 2,
      description: 'Zero MAD across all frames clamps epsilon denominator to 0.5 and produces zero false positive spikes',
      fn: async (ctx) => {
        const { module: qa, isAvailable } = await resolveModule(
          '../../validators/temporal-render-qa',
          ['detectTemporalDiscontinuities', 'evaluateMadSpikes']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/temporal-render-qa not yet implemented (Planned for M4)');
          return;
        }

        const detectFn = qa.detectTemporalDiscontinuities || qa.evaluateMadSpikes;
        const zeroMad = new Array(60).fill(0.0);
        const result = detectFn(zeroMad, 5, 4.0, []);
        const anomalies = Array.isArray(result) ? result : (result.anomalies ?? []);
        assertEqual(anomalies.length, 0, 'Static video (MAD = 0.0) must produce 0 anomaly spikes');
      },
    },
    {
      id: 'TEST-T2-F19-02',
      name: 'Video Edge Frame Window Truncation',
      feature: 'F-TEMPORAL-QA',
      tier: 2,
      description: 'Rolling median computation at video boundaries [0, M] and [N-M, N] clamps window indices without NaN',
      fn: async (ctx) => {
        const { module: qa, isAvailable } = await resolveModule(
          '../../validators/temporal-render-qa',
          ['computeRollingMedian']
        );
        if (!isAvailable) {
          ctx.notImplemented('computeRollingMedian not yet implemented in temporal-render-qa (Planned for M4)');
          return;
        }

        const shortMadSeries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        const medians = qa.computeRollingMedian(shortMadSeries, 5);
        assertEqual(medians.length, shortMadSeries.length, 'Output length must match input series length');
        for (let i = 0; i < medians.length; i++) {
          assertTrue(Number.isFinite(medians[i]), `Median at index ${i} must be finite`);
        }
      },
    },
    {
      id: 'TEST-T2-F19-03',
      name: 'Missing or Unreadable MP4 Video File',
      feature: 'F-TEMPORAL-QA',
      tier: 2,
      description: 'Invoking temporal-render-qa against non-existent file path throws or reports missing file error',
      fn: async (ctx) => {
        const { module: qa, isAvailable } = await resolveModule(
          '../../validators/temporal-render-qa',
          ['analyzeRenderedVideo']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/temporal-render-qa not yet implemented (Planned for M4)');
          return;
        }

        let threw = false;
        try {
          await qa.analyzeRenderedVideo('/nonexistent/dummy_video_file.mp4', { shots: [] });
        } catch (err: any) {
          threw = true;
          assertTrue(/not found|enoent|no such file/i.test(err.message));
        }
        assertTrue(threw, 'Must throw error when video file does not exist');
      },
    },
    {
      id: 'TEST-T2-F19-04',
      name: 'Discontinuity Ratio Borderline Value (R = 4.000)',
      feature: 'F-TEMPORAL-QA',
      tier: 2,
      description: 'Frame with discontinuity ratio exactly equal to 4.000 is not flagged (threshold is strictly > 4.0)',
      fn: async (ctx) => {
        const { module: qa, isAvailable } = await resolveModule(
          '../../validators/temporal-render-qa',
          ['detectTemporalDiscontinuities', 'evaluateMadSpikes']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/temporal-render-qa not yet implemented (Planned for M4)');
          return;
        }

        const detectFn = qa.detectTemporalDiscontinuities || qa.evaluateMadSpikes;
        // Construct MAD series where median = 10, target frame has MAD = 40 -> Ratio = 4.0
        const series = [10, 10, 10, 40, 10, 10, 10];
        const result = detectFn(series, 3, 4.0, []);
        const anomalies = Array.isArray(result) ? result : (result.anomalies ?? []);
        const index3Flagged = anomalies.some((a: any) => (typeof a === 'number' ? a === 3 : a.frame === 3));
        assertFalse(index3Flagged, 'Frame with Ratio exactly 4.000 must NOT be flagged as spike');
      },
    },
    {
      id: 'TEST-T2-F19-05',
      name: 'Continuous High-Action Motion Scene',
      feature: 'F-TEMPORAL-QA',
      tier: 2,
      description: 'Sustained high motion (constant MAD ~50.0) yields local ratio ~1.0 with zero false alarms',
      fn: async (ctx) => {
        const { module: qa, isAvailable } = await resolveModule(
          '../../validators/temporal-render-qa',
          ['detectTemporalDiscontinuities', 'evaluateMadSpikes']
        );
        if (!isAvailable) {
          ctx.notImplemented('validators/temporal-render-qa not yet implemented (Planned for M4)');
          return;
        }

        const detectFn = qa.detectTemporalDiscontinuities || qa.evaluateMadSpikes;
        const highMotionSeries = new Array(60).fill(50.0);
        const result = detectFn(highMotionSeries, 5, 4.0, []);
        const anomalies = Array.isArray(result) ? result : (result.anomalies ?? []);
        assertEqual(anomalies.length, 0, 'Sustained high motion must produce 0 false alarms');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
