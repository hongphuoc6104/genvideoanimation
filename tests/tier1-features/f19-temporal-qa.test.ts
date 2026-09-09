/**
 * Tier 1 (Feature Coverage): F-TEMPORAL-QA
 * FFmpeg Rawvideo Pipe Decoding & Rolling MAD Spike QA (>4x local median)
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertFalse,
  assertClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'FFmpeg Video Decoding & Rolling MAD QA',
  feature: 'F-TEMPORAL-QA',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F19-01',
      name: 'Rawvideo FFmpeg Pipe Video Decoding: decodes MP4 into frame MAD series',
      feature: 'F-TEMPORAL-QA',
      tier: 1,
      fn: async (ctx) => {
        const qaPath = path.resolve(__dirname, '../../validators/temporal-render-qa.ts');
        const { module: qa, isAvailable } = await resolveModule(qaPath, [
          'decodeVideoMadSeries',
          'analyzeRenderedVideo',
        ]);

        if (!isAvailable || typeof qa?.decodeVideoMadSeries !== 'function') {
          ctx.notImplemented('validators/temporal-render-qa not yet available (Planned for M4)');
        }

        // Test with sample benchmark video if present, or root video
        const candidateVideos = [
          path.resolve(__dirname, '../../benchmark-character.mp4'),
          path.resolve(__dirname, '../../benchmark-abstract.mp4'),
          path.resolve(__dirname, '../../out/benchmark-character.mp4'),
        ];
        const sampleVideo = candidateVideos.find((p) => fs.existsSync(p));

        if (!sampleVideo) {
          ctx.skip('No sample MP4 video available for rawvideo decoding test');
          return;
        }

        const madSeries = await qa.decodeVideoMadSeries(sampleVideo, { width: 320, height: 180 });
        assertTrue(Array.isArray(madSeries), 'decodeVideoMadSeries must return an array');
        assertTrue(madSeries.length > 0, 'Decoded frame count must be > 0');
        assertEqual(madSeries[0], 0.0, 'First frame MAD must be exactly 0.0');
        for (let i = 0; i < madSeries.length; i++) {
          assertTrue(Number.isFinite(madSeries[i]), `Frame ${i} MAD must be finite number`);
          assertTrue(madSeries[i] >= 0.0, `Frame ${i} MAD must be non-negative`);
        }
      },
    },
    {
      id: 'TEST-T1-F19-02',
      name: 'Mean Absolute Difference (MAD) Invariant: computes exact byte difference between frames',
      feature: 'F-TEMPORAL-QA',
      tier: 1,
      fn: async (ctx) => {
        const qaPath = path.resolve(__dirname, '../../validators/temporal-render-qa.ts');
        const { module: qa, isAvailable } = await resolveModule(qaPath, ['computeFrameMAD']);

        if (!isAvailable || typeof qa?.computeFrameMAD !== 'function') {
          ctx.notImplemented('computeFrameMAD not yet available in temporal-render-qa (Planned for M4)');
        }

        const size = 1000;
        // Case A: Identical frames -> MAD = 0.0
        const bufA = Buffer.alloc(size, 128);
        const bufB = Buffer.alloc(size, 128);
        assertEqual(qa.computeFrameMAD(bufA, bufB), 0.0, 'Identical frames must have MAD 0.0');

        // Case B: Maximum difference (0 vs 255) -> MAD = 255.0
        const bufDark = Buffer.alloc(size, 0);
        const bufBright = Buffer.alloc(size, 255);
        assertEqual(qa.computeFrameMAD(bufDark, bufBright), 255.0, 'Black vs white must have MAD 255.0');

        // Case C: Known partial delta: 500 bytes diff of 50 -> MAD = 25.0
        const bufC = Buffer.alloc(size, 100);
        const bufD = Buffer.alloc(size, 100);
        for (let i = 0; i < 500; i++) bufD[i] = 150;
        assertClose(qa.computeFrameMAD(bufC, bufD), 25.0, 0.001, 'Partial difference must match expected average');
      },
    },
    {
      id: 'TEST-T1-F19-03',
      name: 'Rolling Local Median Filter: calculates exact sliding window median',
      feature: 'F-TEMPORAL-QA',
      tier: 1,
      fn: async (ctx) => {
        const qaPath = path.resolve(__dirname, '../../validators/temporal-render-qa.ts');
        const { module: qa, isAvailable } = await resolveModule(qaPath, ['computeRollingMedian']);

        if (!isAvailable || typeof qa?.computeRollingMedian !== 'function') {
          ctx.notImplemented('computeRollingMedian not yet available (Planned for M4)');
        }

        // Window radius 2 (window size up to 5)
        const series = [10, 10, 10, 50, 10, 10, 10];
        const medians = qa.computeRollingMedian(series, 2);

        assertEqual(medians.length, series.length, 'Medians length must equal series length');
        // Center frame index 3 has window [10, 10, 50, 10, 10] -> sorted [10, 10, 10, 10, 50] -> median 10
        assertEqual(medians[3], 10, 'Rolling median must filter out isolated impulse spike');

        // Monotonic ramp: [1, 2, 3, 4, 5], radius 1 -> at index 2 (window [2, 3, 4]) -> median 3
        const ramp = [1, 2, 3, 4, 5];
        const rampMedians = qa.computeRollingMedian(ramp, 1);
        assertEqual(rampMedians[2], 3, 'Median of ramp centered window [2, 3, 4] must be 3');
      },
    },
    {
      id: 'TEST-T1-F19-04',
      name: 'Discontinuity Detection (>4.0x): flags unannotated spikes exceeding threshold',
      feature: 'F-TEMPORAL-QA',
      tier: 1,
      fn: async (ctx) => {
        const qaPath = path.resolve(__dirname, '../../validators/temporal-render-qa.ts');
        const { module: qa, isAvailable } = await resolveModule(qaPath, [
          'evaluateMadSpikes',
          'detectTemporalDiscontinuities',
        ]);

        if (!isAvailable) {
          ctx.notImplemented('evaluateMadSpikes not yet available (Planned for M4)');
        }

        const evalFn = qa.evaluateMadSpikes || qa.detectTemporalDiscontinuities;

        // 50 frames with baseline MAD = 2.0, frame 25 has spike = 12.0 (ratio = 6.0x)
        const madSeries = new Array(50).fill(2.0);
        madSeries[25] = 12.0;

        const result = evalFn(madSeries, 5, 4.0, []);
        assertFalse(result.valid, 'Evaluation with unannotated spike must FAIL');
        assertEqual(result.anomalies.length, 1, 'Exactly 1 anomaly should be flagged');
        assertEqual(result.anomalies[0].frame, 25, 'Flagged frame must be 25');
        assertClose(result.anomalies[0].ratio, 6.0, 0.2, 'Ratio must be ~6.0x');
      },
    },
    {
      id: 'TEST-T1-F19-05',
      name: 'ShotSpec Whitelist Reconciliation: deliberate impact frames pass QA',
      feature: 'F-TEMPORAL-QA',
      tier: 1,
      fn: async (ctx) => {
        const qaPath = path.resolve(__dirname, '../../validators/temporal-render-qa.ts');
        const { module: qa, isAvailable } = await resolveModule(qaPath, [
          'evaluateMadSpikes',
          'extractWhitelistedFrames',
        ]);

        if (!isAvailable) {
          ctx.notImplemented('evaluateMadSpikes not yet available (Planned for M4)');
        }

        const evalFn = qa.evaluateMadSpikes || qa.detectTemporalDiscontinuities;

        // Frame 20 is a legitimate high-velocity impact (MAD = 16.0, ratio 8.0x)
        const madSeries = new Array(50).fill(2.0);
        madSeries[20] = 16.0;

        // Case A: Whitelisted -> PASS
        const resPass = evalFn(madSeries, 5, 4.0, [20]);
        assertTrue(resPass.valid, 'Whitelisted impact frame must PASS QA');
        assertEqual(resPass.anomalies.length, 0, 'Zero anomalies for whitelisted frame');
        assertEqual(resPass.whitelistedEvents.length, 1, 'Must record 1 whitelisted event');
        assertEqual(resPass.whitelistedEvents[0].frame, 20, 'Whitelisted event frame must be 20');

        // Case B: Not whitelisted -> FAIL
        const resFail = evalFn(madSeries, 5, 4.0, []);
        assertFalse(resFail.valid, 'Unannotated spike must FAIL QA');
        assertEqual(resFail.anomalies.length, 1, 'Must flag 1 unannotated anomaly');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
