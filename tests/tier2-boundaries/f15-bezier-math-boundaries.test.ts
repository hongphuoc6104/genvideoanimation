import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertPointClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F15: Exact Quadratic & Cubic Bezier Point Calculation Boundaries',
  feature: 'F-BEZIER-MATH',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F15-01',
      name: 'Clamping on Out-of-Range Parameter t',
      feature: 'F-BEZIER-MATH',
      tier: 2,
      description: 'Parameter t = -10.0 clamps to start point P0 and t = 15.0 clamps to end point Pend',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['quadraticBezierPoint', 'cubicBezierPoint']
        );
        if (!isAvailable) {
          ctx.notImplemented('quadraticBezierPoint / cubicBezierPoint not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 10, y: 20 };
        const p1 = { x: 50, y: 90 };
        const p2 = { x: 80, y: 30 };
        const p3 = { x: 100, y: 100 };

        const quadNeg = mod.quadraticBezierPoint(p0, p1, p2, -10.0);
        assertPointClose(quadNeg, p0, 1e-4, 'Quadratic t < 0 must clamp to p0');

        const cubicOver = mod.cubicBezierPoint(p0, p1, p2, p3, 15.0);
        assertPointClose(cubicOver, p3, 1e-4, 'Cubic t > 1 must clamp to p3');
      },
    },
    {
      id: 'TEST-T2-F15-02',
      name: 'Collinear Control Points (Straight Line Degeneracy)',
      feature: 'F-BEZIER-MATH',
      tier: 2,
      description: 'Cubic Bezier with collinear control points along y = 2x satisfies y(t) = 2*x(t) everywhere',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['cubicBezierPoint']
        );
        if (!isAvailable) {
          ctx.notImplemented('cubicBezierPoint not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 0, y: 0 };
        const p1 = { x: 10, y: 20 };
        const p2 = { x: 20, y: 40 };
        const p3 = { x: 30, y: 60 };

        for (let t = 0; t <= 1.0; t += 0.1) {
          const pt = mod.cubicBezierPoint(p0, p1, p2, p3, t);
          const x = Array.isArray(pt) ? pt[0] : pt.x;
          const y = Array.isArray(pt) ? pt[1] : pt.y;
          assertClose(y, 2 * x, 1e-6, `At t=${t}: y must equal 2*x on collinear line`);
        }
      },
    },
    {
      id: 'TEST-T2-F15-03',
      name: 'Single Coincident Point Degeneracy',
      feature: 'F-BEZIER-MATH',
      tier: 2,
      description: 'Cubic curve where all control points are identical evaluates to that coordinate for any t',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['cubicBezierPoint']
        );
        if (!isAvailable) {
          ctx.notImplemented('cubicBezierPoint not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const pt = { x: 75, y: 75 };
        const res = mod.cubicBezierPoint(pt, pt, pt, pt, 0.65);
        assertPointClose(res, pt, 1e-6, 'Coincident points must evaluate to [75, 75]');
      },
    },
    {
      id: 'TEST-T2-F15-04',
      name: 'Negative Coordinate Quadrants',
      feature: 'F-BEZIER-MATH',
      tier: 2,
      description: 'Bezier curves in negative coordinate quadrants maintain identical mathematical precision',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['cubicBezierPoint']
        );
        if (!isAvailable) {
          ctx.notImplemented('cubicBezierPoint not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: -100, y: -200 };
        const p1 = { x: -50, y: -300 };
        const p2 = { x: -20, y: -150 };
        const p3 = { x: -10, y: -50 };

        const res = mod.cubicBezierPoint(p0, p1, p2, p3, 0.5);
        const x = Array.isArray(res) ? res[0] : res.x;
        const y = Array.isArray(res) ? res[1] : res.y;
        assertTrue(x < 0, 'X must remain negative');
        assertTrue(y < 0, 'Y must remain negative');
        assertTrue(Number.isFinite(x) && Number.isFinite(y), 'Coordinates must be finite');
      },
    },
    {
      id: 'TEST-T2-F15-05',
      name: 'Giant Coordinates Float64 Stability',
      feature: 'F-BEZIER-MATH',
      tier: 2,
      description: 'Coordinates around 1e7 px evaluate accurately without catastrophic cancellation',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['cubicBezierPoint']
        );
        if (!isAvailable) {
          ctx.notImplemented('cubicBezierPoint not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 1e7, y: 0 };
        const p1 = { x: 1e7, y: 1e7 };
        const p2 = { x: 2e7, y: 1e7 };
        const p3 = { x: 2e7, y: 0 };

        const mid = mod.cubicBezierPoint(p0, p1, p2, p3, 0.5);
        const x = Array.isArray(mid) ? mid[0] : mid.x;
        assertClose(x, 1.5e7, 1.0, 'Midpoint X on symmetric 1e7..2e7 curve must equal 1.5e7');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
