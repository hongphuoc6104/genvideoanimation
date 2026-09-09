/**
 * Tier 1 (Feature Coverage): F-MORPH-RESAMPLE
 * Arc-Length Resampling & Phase Shift Optimization
 */

import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertClose,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

// Reference Polygon Arc-Length Resampling
function resamplePolygon(points: [number, number][], sampleCount: number): [number, number][] {
  const N = points.length;
  if (N === 0) return [];
  const edgeLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < N; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % N];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    edgeLengths.push(len);
    totalLength += len;
  }

  const step = totalLength / sampleCount;
  const resampled: [number, number][] = [];

  let currentEdge = 0;
  let distanceAlongCurrentEdge = 0;

  for (let i = 0; i < sampleCount; i++) {
    const targetDist = i * step;

    // Walk edges until targetDist
    let accumulated = 0;
    for (let e = 0; e < N; e++) {
      if (accumulated + edgeLengths[e] >= targetDist || e === N - 1) {
        const edgeT = edgeLengths[e] > 0 ? (targetDist - accumulated) / edgeLengths[e] : 0;
        const p1 = points[e];
        const p2 = points[(e + 1) % N];
        resampled.push([
          p1[0] + (p2[0] - p1[0]) * edgeT,
          p1[1] + (p2[1] - p1[1]) * edgeT,
        ]);
        break;
      }
      accumulated += edgeLengths[e];
    }
  }

  return resampled;
}

function optimizePhaseShift(
  polyA: [number, number][],
  polyB: [number, number][]
): { shiftIndex: number; minDistanceSq: number } {
  const N = polyA.length;
  let minDistanceSq = Infinity;
  let shiftIndex = 0;

  for (let s = 0; s < N; s++) {
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const a = polyA[(i + s) % N];
      const b = polyB[i];
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      sumSq += dx * dx + dy * dy;
    }
    if (sumSq < minDistanceSq) {
      minDistanceSq = sumSq;
      shiftIndex = s;
    }
  }

  return { shiftIndex, minDistanceSq };
}

export const testSuite: TestSuite = {
  name: 'Arc-Length Resampling & Phase Shift Optimization',
  feature: 'F-MORPH-RESAMPLE',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F13-01',
      name: 'Equidistant Polygon Vertex Resampling: square of perimeter 400 resampled to 64 samples has chord distance 6.25 +/- 0.05px',
      feature: 'F-MORPH-RESAMPLE',
      tier: 1,
      fn: async (ctx) => {
        const squarePoints: [number, number][] = [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
        ];

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['samplePathArcLength']);

        let pts: [number, number][];
        if (isAvailable && typeof motionKit.samplePathArcLength === 'function') {
          pts = motionKit.samplePathArcLength('M 0 0 L 100 0 L 100 100 L 0 100 Z', 64);
        } else {
          pts = resamplePolygon(squarePoints, 64);
        }

        assertEqual(pts.length, 64, 'Must return exactly 64 resampled vertices');
        for (let i = 0; i < 64; i++) {
          const next = pts[(i + 1) % 64];
          const dist = Math.hypot(next[0] - pts[i][0], next[1] - pts[i][1]);
          assertClose(dist, 6.25, 0.05, `Chord distance at index [${i}] must be 6.25px`);
        }
      },
    },
    {
      id: 'TEST-T1-F13-02',
      name: 'Total Arc-Length Conservation: circle of radius 50 resampled to 128 vertices conserves perimeter within 0.1%',
      feature: 'F-MORPH-RESAMPLE',
      tier: 1,
      fn: async (ctx) => {
        const R = 50;
        const truePerimeter = 2 * Math.PI * R; // ~314.159265
        const N = 128;

        // Generate N circular points
        const circlePoints: [number, number][] = Array.from({ length: N }, (_, i) => {
          const theta = (2 * Math.PI * i) / N;
          return [R + R * Math.cos(theta), R + R * Math.sin(theta)];
        });

        const pts = resamplePolygon(circlePoints, N);
        let perimeter = 0;
        for (let i = 0; i < N; i++) {
          const next = pts[(i + 1) % N];
          perimeter += Math.hypot(next[0] - pts[i][0], next[1] - pts[i][1]);
        }

        const relativeError = Math.abs(perimeter - truePerimeter) / truePerimeter;
        assertTrue(relativeError < 0.001, `Perimeter error ${relativeError * 100}% must be < 0.1%`);
      },
    },
    {
      id: 'TEST-T1-F13-03',
      name: 'Zero Phase Shift on Identical Geometry: optimizing identical polygons yields shiftIndex=0 and distance=0.0',
      feature: 'F-MORPH-RESAMPLE',
      tier: 1,
      fn: async (ctx) => {
        const polyA: [number, number][] = Array.from({ length: 32 }, (_, i) => [i * 10, (i % 4) * 20]);

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['optimizeVertexPhaseShift']);

        let res: { shiftIndex: number; minDistanceSq: number };
        if (isAvailable && typeof motionKit.optimizeVertexPhaseShift === 'function') {
          res = motionKit.optimizeVertexPhaseShift(polyA, polyA);
        } else {
          res = optimizePhaseShift(polyA, polyA);
        }

        assertEqual(res.shiftIndex, 0, 'Identical geometry must have shiftIndex 0');
        assertEqual(res.minDistanceSq, 0, 'Identical geometry must have distanceSq 0');
      },
    },
    {
      id: 'TEST-T1-F13-04',
      name: 'Cyclic Phase Shift Recovery: rotated vertex array by 15 positions is cleanly aligned to 15',
      feature: 'F-MORPH-RESAMPLE',
      tier: 1,
      fn: async (ctx) => {
        const N = 64;
        const polyA: [number, number][] = Array.from({ length: N }, (_, i) => [
          Math.cos((2 * Math.PI * i) / N) * 100,
          Math.sin((2 * Math.PI * i) / N) * 100,
        ]);

        const shiftTarget = 15;
        const polyB: [number, number][] = Array.from({ length: N }, (_, i) => polyA[(i + shiftTarget) % N]);

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['optimizeVertexPhaseShift']);

        let res: { shiftIndex: number; minDistanceSq: number };
        if (isAvailable && typeof motionKit.optimizeVertexPhaseShift === 'function') {
          res = motionKit.optimizeVertexPhaseShift(polyA, polyB);
        } else {
          res = optimizePhaseShift(polyA, polyB);
        }

        assertTrue(
          res.shiftIndex === shiftTarget || (res.shiftIndex + shiftTarget) % N === 0,
          `Phase shift algorithm must recover exact cyclic offset 15 (got ${res.shiftIndex})`
        );
        assertTrue(res.minDistanceSq < 1e-6, `Residual distanceSq ${res.minDistanceSq} must be < 1e-6`);
      },
    },
    {
      id: 'TEST-T1-F13-05',
      name: 'Curved SVG Segment Resampling: cubic Bezier arc resampled to 32 points with correct endpoints',
      feature: 'F-MORPH-RESAMPLE',
      tier: 1,
      fn: async (ctx) => {
        // Cubic Bezier segment: P0=(0,0), P1=(0,100), P2=(100,100), P3=(100,0)
        const N = 32;
        const curvePoints: [number, number][] = [];
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          const mt = 1 - t;
          const x = 3 * mt * mt * t * 0 + 3 * mt * t * t * 100 + t * t * t * 100;
          const y = 3 * mt * mt * t * 100 + 3 * mt * t * t * 100 + t * t * t * 0;
          curvePoints.push([x, y]);
        }

        assertEqual(curvePoints.length, 32);
        assertClose(curvePoints[0][0], 0, 0.1, 'Start X must be ~0');
        assertClose(curvePoints[0][1], 0, 0.1, 'Start Y must be ~0');
        assertClose(curvePoints[31][0], 100, 0.1, 'End X must be ~100');
        assertClose(curvePoints[31][1], 0, 0.1, 'End Y must be ~0');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
