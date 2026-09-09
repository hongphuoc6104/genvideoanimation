import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F16: Bezier Derivatives, Tangents & Velocity Vectors Boundaries',
  feature: 'F-BEZIER-DYNAMICS',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F16-01',
      name: 'Cusp Singularity with Zero Velocity Derivative',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 2,
      description: 'At cusp where P0 = P1 (zero velocity derivative), tangent angle computes finite angle without NaN from atan2(0, 0)',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['bezierTangentAngle']
        );
        if (!isAvailable) {
          ctx.notImplemented('bezierTangentAngle not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 0, y: 0 };
        const p1 = { x: 0, y: 0 }; // Identical to p0 -> derivative at t=0 is (0, 0)
        const p2 = { x: 50, y: 50 };
        const p3 = { x: 100, y: 100 };

        const angle = mod.bezierTangentAngle([p0, p1, p2, p3], 0.0);
        assertTrue(Number.isFinite(angle), 'Tangent angle at cusp must be a finite number');
      },
    },
    {
      id: 'TEST-T2-F16-02',
      name: 'Pure Vertical Tangent (theta = +/-90 deg)',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 2,
      description: 'Pure vertical curve where dx/dt = 0 evaluates strictly to 90 degrees without divide-by-zero error',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['bezierTangentAngle']
        );
        if (!isAvailable) {
          ctx.notImplemented('bezierTangentAngle not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const curve = [{ x: 50, y: 0 }, { x: 50, y: 50 }, { x: 50, y: 100 }];
        const angle = mod.bezierTangentAngle(curve, 0.5);
        assertClose(Math.abs(angle), 90.0, 1e-4, 'Vertical curve tangent must be 90 degrees');
      },
    },
    {
      id: 'TEST-T2-F16-03',
      name: 'Self-Reversing Inflection Loop',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 2,
      description: 'Cubic curve that doubles back on itself maintains finite and bounded velocity throughout inflection',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['bezierVelocity']
        );
        if (!isAvailable) {
          ctx.notImplemented('bezierVelocity not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const reversingCurve = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: -50, y: 50 }, { x: 50, y: 50 }];
        const v1 = mod.bezierVelocity(reversingCurve, 0.49);
        const v2 = mod.bezierVelocity(reversingCurve, 0.51);

        const s1 = typeof v1 === 'number' ? v1 : (v1.speed ?? Math.hypot(v1.x, v1.y));
        const s2 = typeof v2 === 'number' ? v2 : (v2.speed ?? Math.hypot(v2.x, v2.y));
        assertTrue(Number.isFinite(s1), 'Pre-inflection velocity must be finite');
        assertTrue(Number.isFinite(s2), 'Post-inflection velocity must be finite');
      },
    },
    {
      id: 'TEST-T2-F16-04',
      name: 'Derivative Evaluation Out-of-Range (t < 0, t > 1)',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 2,
      description: 'Evaluating velocity outside [0, 1] clamps to derivatives at t = 0.0 and t = 1.0',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['bezierVelocity']
        );
        if (!isAvailable) {
          ctx.notImplemented('bezierVelocity not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const curve = [{ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }];
        const vNeg = mod.bezierVelocity(curve, -0.5);
        const vZero = mod.bezierVelocity(curve, 0.0);
        const sNeg = typeof vNeg === 'number' ? vNeg : (vNeg.speed ?? Math.hypot(vNeg.x, vNeg.y));
        const sZero = typeof vZero === 'number' ? vZero : (vZero.speed ?? Math.hypot(vZero.x, vZero.y));
        assertClose(sNeg, sZero, 1e-4, 'Negative t must clamp to t=0 velocity');

        const vOver = mod.bezierVelocity(curve, 1.5);
        const vOne = mod.bezierVelocity(curve, 1.0);
        const sOver = typeof vOver === 'number' ? vOver : (vOver.speed ?? Math.hypot(vOver.x, vOver.y));
        const sOne = typeof vOne === 'number' ? vOne : (vOne.speed ?? Math.hypot(vOne.x, vOne.y));
        assertClose(sOver, sOne, 1e-4, 't > 1 must clamp to t=1 velocity');
      },
    },
    {
      id: 'TEST-T2-F16-05',
      name: 'Zero-Length Bezier Derivative',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 2,
      description: 'Curve with coincident control points has velocity = 0.0 and defaults tangent to 0.0 deg',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['bezierVelocity', 'bezierTangentAngle']
        );
        if (!isAvailable) {
          ctx.notImplemented('bezierVelocity / bezierTangentAngle not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const pt = { x: 50, y: 50 };
        const curve = [pt, pt, pt];
        const vel = mod.bezierVelocity(curve, 0.5);
        const speed = typeof vel === 'number' ? vel : (vel.speed ?? Math.hypot(vel.x, vel.y));
        assertClose(speed, 0.0, 1e-6, 'Zero length curve must have speed = 0.0');

        const angle = mod.bezierTangentAngle(curve, 0.5);
        assertClose(angle, 0.0, 1e-6, 'Zero length curve must default angle to 0.0');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
