/**
 * T3-COMB-05: Cubic Bezier Points vs Analytical Derivatives & Tangent Vectors
 * Features: F-BEZIER-MATH + F-BEZIER-DYNAMICS
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-05',
  name: 'Cubic Bezier Points vs Analytical Derivatives & Tangent Vectors',
  feature: 'F-BEZIER-MATH+F-BEZIER-DYNAMICS',
  tier: 3,
  description:
    'Verifies exact cubic coordinates B(t) mathematically reconcile with analytical first derivatives B\'(t) and tangent orientation angles theta(t).',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'cubicBezierPoint',
    ]);

    let bezMod = motionKit;
    if (!isAvailable || !bezMod?.cubicBezierPoint) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'cubicBezierPoint',
      ]);
      if (!altAvailable || !altMod?.cubicBezierPoint) {
        ctx.notImplemented('cubicBezierPoint or bezier dynamics not yet implemented in motion-kit (Planned for M3)');
        return;
      }
      bezMod = altMod;
    }

    const { cubicBezierPoint, bezierVelocity, bezierTangentAngle } = bezMod;
    ctx.log('Evaluating cubic Bezier points and analytical derivatives across t in [0, 1]...');

    const p0: [number, number] = [50, 100];
    const p1: [number, number] = [150, 400];
    const p2: [number, number] = [400, 50];
    const p3: [number, number] = [600, 300];

    const h = 1e-5;
    for (let i = 1; i < 50; i++) {
      const t = i / 50;

      // Numerical central finite difference derivative
      const pPlus = cubicBezierPoint(p0, p1, p2, p3, t + h);
      const pMinus = cubicBezierPoint(p0, p1, p2, p3, t - h);
      const v_fd_x = (pPlus[0] - pMinus[0]) / (2 * h);
      const v_fd_y = (pPlus[1] - pMinus[1]) / (2 * h);

      if (typeof bezierVelocity === 'function') {
        const v_analytical = bezierVelocity(p0, p1, p2, p3, t);
        const vx = Array.isArray(v_analytical) ? v_analytical[0] : v_analytical.x;
        const vy = Array.isArray(v_analytical) ? v_analytical[1] : v_analytical.y;
        assertClose(vx, v_fd_x, 1e-3, `Analytical vx mismatch at t=${t}`);
        assertClose(vy, v_fd_y, 1e-3, `Analytical vy mismatch at t=${t}`);
      }

      if (typeof bezierTangentAngle === 'function') {
        const thetaDeg = bezierTangentAngle(p0, p1, p2, p3, t);
        const thetaRad = (thetaDeg * Math.PI) / 180;
        const expectedAngleRad = Math.atan2(v_fd_y, v_fd_x);
        assertClose(thetaRad, expectedAngleRad, 1e-3, `Tangent angle mismatch at t=${t}`);
      }
    }
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-05 Suite',
  feature: 'F-BEZIER-MATH+F-BEZIER-DYNAMICS',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
