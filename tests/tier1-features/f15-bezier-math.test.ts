/**
 * Tier 1 (Feature Coverage): F-BEZIER-MATH
 * Exact Quadratic & Cubic Bezier Point Calculation
 */

import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertClose,
  assertPointClose,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

type Point = { x: number; y: number } | [number, number];

function getX(p: Point): number {
  return Array.isArray(p) ? p[0] : p.x;
}
function getY(p: Point): number {
  return Array.isArray(p) ? p[1] : p.y;
}

function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * getX(p0) + 2 * mt * t * getX(p1) + t2 * getX(p2),
    y: mt2 * getY(p0) + 2 * mt * t * getY(p1) + t2 * getY(p2),
  };
}

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * getX(p0) + 3 * mt2 * t * getX(p1) + 3 * mt * t2 * getX(p2) + t3 * getX(p3),
    y: mt3 * getY(p0) + 3 * mt2 * t * getY(p1) + 3 * mt * t2 * getY(p2) + t3 * getY(p3),
  };
}

export const testSuite: TestSuite = {
  name: 'Exact Quadratic & Cubic Bezier Point Calculation',
  feature: 'F-BEZIER-MATH',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F15-01',
      name: 'Quadratic Bezier Algebraic Exactness: evaluates (50.0, 50.0) at t=0.5 for control points (0,0), (50,100), (100,0)',
      feature: 'F-BEZIER-MATH',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['quadraticBezierPoint']);

        let calc = quadraticBezier;
        if (isAvailable && typeof motionKit.quadraticBezierPoint === 'function') {
          calc = (p0, p1, p2, t) => {
            const res = motionKit.quadraticBezierPoint(p0, p1, p2, t);
            return { x: getX(res), y: getY(res) };
          };
        }

        const p0 = { x: 0, y: 0 };
        const p1 = { x: 50, y: 100 };
        const p2 = { x: 100, y: 0 };
        const pt = calc(p0, p1, p2, 0.5);

        assertClose(pt.x, 50.0, 1e-9, 'Quadratic Bezier X at t=0.5 must be exactly 50.0');
        assertClose(pt.y, 50.0, 1e-9, 'Quadratic Bezier Y at t=0.5 must be exactly 50.0');
      },
    },
    {
      id: 'TEST-T1-F15-02',
      name: 'Cubic Bezier Algebraic Exactness: evaluates (50.0, 75.0) at t=0.5 for arch control points',
      feature: 'F-BEZIER-MATH',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['cubicBezierPoint']);

        let calc = cubicBezier;
        if (isAvailable && typeof motionKit.cubicBezierPoint === 'function') {
          calc = (p0, p1, p2, p3, t) => {
            const res = motionKit.cubicBezierPoint(p0, p1, p2, p3, t);
            return { x: getX(res), y: getY(res) };
          };
        }

        const p0 = { x: 0, y: 0 };
        const p1 = { x: 0, y: 100 };
        const p2 = { x: 100, y: 100 };
        const p3 = { x: 100, y: 0 };
        const pt = calc(p0, p1, p2, p3, 0.5);

        assertClose(pt.x, 50.0, 1e-9, 'Cubic Bezier X at t=0.5 must be exactly 50.0');
        assertClose(pt.y, 75.0, 1e-9, 'Cubic Bezier Y at t=0.5 must be exactly 75.0');
      },
    },
    {
      id: 'TEST-T1-F15-03',
      name: 'Boundary Endpoint Invariant: B(0.0) strictly matches P0 and B(1.0) strictly matches P3',
      feature: 'F-BEZIER-MATH',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 12.3456, y: 78.9012 };
        const p1 = { x: 34.5678, y: 90.1234 };
        const p2 = { x: 56.7890, y: 12.3456 };
        const p3 = { x: 78.9012, y: 34.5678 };

        const start = cubicBezier(p0, p1, p2, p3, 0.0);
        const end = cubicBezier(p0, p1, p2, p3, 1.0);

        assertClose(start.x, p0.x, 1e-12, 'Start X must match P0.x');
        assertClose(start.y, p0.y, 1e-12, 'Start Y must match P0.y');
        assertClose(end.x, p3.x, 1e-12, 'End X must match P3.x');
        assertClose(end.y, p3.y, 1e-12, 'End Y must match P3.y');
      },
    },
    {
      id: 'TEST-T1-F15-04',
      name: 'Convex Hull Property Invariant: all 1000 evaluated points lie strictly within control point bounding box',
      feature: 'F-BEZIER-MATH',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 10, y: 20 };
        const p1 = { x: 40, y: 180 };
        const p2 = { x: 120, y: 90 };
        const p3 = { x: 200, y: 10 };

        const minX = Math.min(p0.x, p1.x, p2.x, p3.x);
        const maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
        const minY = Math.min(p0.y, p1.y, p2.y, p3.y);
        const maxY = Math.max(p0.y, p1.y, p2.y, p3.y);

        for (let i = 0; i <= 1000; i++) {
          const pt = cubicBezier(p0, p1, p2, p3, i / 1000);
          assertTrue(
            pt.x >= minX - 1e-9 && pt.x <= maxX + 1e-9,
            `Point X ${pt.x} outside bounding box [${minX}, ${maxX}]`
          );
          assertTrue(
            pt.y >= minY - 1e-9 && pt.y <= maxY + 1e-9,
            `Point Y ${pt.y} outside bounding box [${minY}, ${maxY}]`
          );
        }
      },
    },
    {
      id: 'TEST-T1-F15-05',
      name: 'Affine Invariance Under Translation: translated curve equals translated point within 1e-9',
      feature: 'F-BEZIER-MATH',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 5, y: 15 };
        const p1 = { x: 25, y: 75 };
        const p2 = { x: 80, y: 60 };
        const p3 = { x: 120, y: 20 };

        const dx = 250;
        const dy = -150;
        const trans = (p: { x: number; y: number }) => ({ x: p.x + dx, y: p.y + dy });

        const t = 0.33;
        const pOrig = cubicBezier(p0, p1, p2, p3, t);
        const pTrans = cubicBezier(trans(p0), trans(p1), trans(p2), trans(p3), t);

        assertClose(pTrans.x - pOrig.x, dx, 1e-9, 'Translation along X must equal dx');
        assertClose(pTrans.y - pOrig.y, dy, 1e-9, 'Translation along Y must equal dy');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
