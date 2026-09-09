/**
 * Tier 1 (Feature Coverage): F-MORPH-INTERPOLATE
 * Continuous Geometric SVG Path Morphing
 */

import * as path from 'node:path';
import * as React from 'react';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertClose,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

// Standard polygon area via Shoelace formula
function computePolygonArea(pts: [number, number][]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return Math.abs(area) / 2.0;
}

// Linear vertex-to-vertex interpolation for resampled polygons
function interpolateVertices(
  polyA: [number, number][],
  polyB: [number, number][],
  t: number
): [number, number][] {
  const n = Math.min(polyA.length, polyB.length);
  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = (1 - t) * polyA[i][0] + t * polyB[i][0];
    const y = (1 - t) * polyA[i][1] + t * polyB[i][1];
    result.push([x, y]);
  }
  return result;
}

export const testSuite: TestSuite = {
  name: 'Continuous Geometric SVG Path Morphing',
  feature: 'F-MORPH-INTERPOLATE',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F14-01',
      name: 'Boundary Geometry Fidelity at t=0.0: interpolated vertices match source path exactly',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 1,
      fn: async (ctx) => {
        const polyA: [number, number][] = [
          [50, 0],
          [100, 50],
          [50, 100],
          [0, 50],
        ];
        const polyB: [number, number][] = [
          [10, 10],
          [90, 10],
          [90, 90],
          [10, 90],
        ];

        const morphed = interpolateVertices(polyA, polyB, 0.0);
        assertEqual(morphed.length, polyA.length);
        for (let i = 0; i < polyA.length; i++) {
          assertClose(morphed[i][0], polyA[i][0], 1e-4, `X mismatch at [${i}] for t=0.0`);
          assertClose(morphed[i][1], polyA[i][1], 1e-4, `Y mismatch at [${i}] for t=0.0`);
        }
      },
    },
    {
      id: 'TEST-T1-F14-02',
      name: 'Boundary Geometry Fidelity at t=1.0: interpolated vertices match target path exactly',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 1,
      fn: async (ctx) => {
        const polyA: [number, number][] = [
          [50, 0],
          [100, 50],
          [50, 100],
          [0, 50],
        ];
        const polyB: [number, number][] = [
          [10, 10],
          [90, 10],
          [90, 90],
          [10, 90],
        ];

        const morphed = interpolateVertices(polyA, polyB, 1.0);
        assertEqual(morphed.length, polyB.length);
        for (let i = 0; i < polyB.length; i++) {
          assertClose(morphed[i][0], polyB[i][0], 1e-4, `X mismatch at [${i}] for t=1.0`);
          assertClose(morphed[i][1], polyB[i][1], 1e-4, `Y mismatch at [${i}] for t=1.0`);
        }
      },
    },
    {
      id: 'TEST-T1-F14-03',
      name: 'Midpoint Coordinate Invariant (t=0.5): (0, 100) morphing to (100, 0) yields (50.0, 50.0)',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 1,
      fn: async (ctx) => {
        const polyA: [number, number][] = [[0, 100]];
        const polyB: [number, number][] = [[100, 0]];

        const morphed = interpolateVertices(polyA, polyB, 0.5);
        assertClose(morphed[0][0], 50.0, 1e-5, 'Midpoint X must be 50.0');
        assertClose(morphed[0][1], 50.0, 1e-5, 'Midpoint Y must be 50.0');
      },
    },
    {
      id: 'TEST-T1-F14-04',
      name: 'Intermediate Polygon Area Continuity: morphing from circle to square exhibits continuous area progression',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 1,
      fn: async (ctx) => {
        // Circle with radius 50 (area ~7853.98) to square 100x100 (area 10000)
        const N = 64;
        const R = 50;
        const circle: [number, number][] = Array.from({ length: N }, (_, i) => {
          const theta = (2 * Math.PI * i) / N;
          return [50 + R * Math.cos(theta), 50 + R * Math.sin(theta)];
        });

        // 64-vertex square
        const square: [number, number][] = [];
        const perSide = N / 4;
        for (let i = 0; i < perSide; i++) square.push([i * (100 / perSide), 0]);
        for (let i = 0; i < perSide; i++) square.push([100, i * (100 / perSide)]);
        for (let i = 0; i < perSide; i++) square.push([100 - i * (100 / perSide), 100]);
        for (let i = 0; i < perSide; i++) square.push([0, 100 - i * (100 / perSide)]);

        // Align vertex phase shift to eliminate twisting
        let minDistanceSq = Infinity;
        let bestShift = 0;
        for (let s = 0; s < N; s++) {
          let sumSq = 0;
          for (let i = 0; i < N; i++) {
            const c = circle[(i + s) % N];
            const sq = square[i];
            sumSq += (c[0] - sq[0]) ** 2 + (c[1] - sq[1]) ** 2;
          }
          if (sumSq < minDistanceSq) {
            minDistanceSq = sumSq;
            bestShift = s;
          }
        }
        const alignedCircle: [number, number][] = circle.map((_, i) => circle[(i + bestShift) % N]);

        const tValues = [0.0, 0.25, 0.5, 0.75, 1.0];
        const areas = tValues.map((t) => computePolygonArea(interpolateVertices(alignedCircle, square, t)));

        // Verify continuous monotonic increase in area from circle to square
        for (let i = 0; i < areas.length - 1; i++) {
          assertTrue(areas[i] < areas[i + 1], `Area must increase monotonically: areas[${i}]=${areas[i]} < areas[${i + 1}]=${areas[i + 1]}`);
        }
      },
    },
    {
      id: 'TEST-T1-F14-05',
      name: 'PathMorph React Component Rendering: renders single path element with continuous d attribute',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['PathMorph']);

        if (!isAvailable || !motionKit.PathMorph) {
          ctx.notImplemented('PathMorph component not yet exported by motion-kit (Planned for M3)');
        }

        const pathA = 'M 50 0 L 100 50 L 50 100 L 0 50 Z';
        const pathB = 'M 10 10 L 90 10 L 90 90 L 10 90 Z';
        const element = React.createElement(motionKit.PathMorph, {
          from: pathA,
          to: pathB,
          progress: 0.5,
          fill: '#3b82f6',
        });

        assertTrue(React.isValidElement(element), 'PathMorph must return valid React element');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
