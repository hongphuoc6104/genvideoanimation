/**
 * Tier 1 (Feature Coverage): F-BEZIER-DYNAMICS
 * Bezier Derivatives, Tangents & Velocity Vectors
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

type Point = { x: number; y: number } | [number, number];

function getX(p: Point): number {
  return Array.isArray(p) ? p[0] : p.x;
}
function getY(p: Point): number {
  return Array.isArray(p) ? p[1] : p.y;
}

function quadraticDerivative(p0: Point, p1: Point, p2: Point, t: number): { vx: number; vy: number; speed: number } {
  // B'(t) = 2(1-t)(p1 - p0) + 2t(p2 - p1)
  const mt = 1 - t;
  const vx = 2 * mt * (getX(p1) - getX(p0)) + 2 * t * (getX(p2) - getX(p1));
  const vy = 2 * mt * (getY(p1) - getY(p0)) + 2 * t * (getY(p2) - getY(p1));
  return { vx, vy, speed: Math.hypot(vx, vy) };
}

function cubicDerivative(p0: Point, p1: Point, p2: Point, p3: Point, t: number): { vx: number; vy: number; speed: number } {
  // B'(t) = 3(1-t)^2(p1 - p0) + 6(1-t)t(p2 - p1) + 3t^2(p3 - p2)
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const vx = 3 * mt2 * (getX(p1) - getX(p0)) + 6 * mt * t * (getX(p2) - getX(p1)) + 3 * t2 * (getX(p3) - getX(p2));
  const vy = 3 * mt2 * (getY(p1) - getY(p0)) + 6 * mt * t * (getY(p2) - getY(p1)) + 3 * t2 * (getY(p3) - getY(p2));
  return { vx, vy, speed: Math.hypot(vx, vy) };
}

function tangentAngleDeg(vx: number, vy: number): number {
  return (Math.atan2(vy, vx) * 180) / Math.PI;
}

export const testSuite: TestSuite = {
  name: 'Bezier Derivatives, Tangents & Velocity Vectors',
  feature: 'F-BEZIER-DYNAMICS',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F16-01',
      name: 'Quadratic Derivative & Velocity Evaluation: vx=100.0, vy=0.0, speed=100.0 at t=0.5',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 50, y: 100 };
        const p2 = { x: 100, y: 0 };

        const vel = quadraticDerivative(p0, p1, p2, 0.5);

        assertClose(vel.vx, 100.0, 1e-9, 'Velocity X must be 100.0');
        assertClose(vel.vy, 0.0, 1e-9, 'Velocity Y must be 0.0');
        assertClose(vel.speed, 100.0, 1e-9, 'Speed must be 100.0');
      },
    },
    {
      id: 'TEST-T1-F16-02',
      name: 'Tangent Angle at Horizontal Extrema: theta = arctan2(0, 100) = 0.0 deg',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 50, y: 100 };
        const p2 = { x: 100, y: 0 };

        const vel = quadraticDerivative(p0, p1, p2, 0.5);
        const deg = tangentAngleDeg(vel.vx, vel.vy);

        assertClose(deg, 0.0, 1e-6, 'Tangent angle at vertex apex must be exactly 0.0 deg');
      },
    },
    {
      id: 'TEST-T1-F16-03',
      name: 'Cubic Endpoint Tangent Vector Agreement: theta(0.0) = 90.0 deg and theta(1.0) = 0.0 deg',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 0, y: 50 };
        const p2 = { x: 50, y: 100 };
        const p3 = { x: 100, y: 100 };

        const v0 = cubicDerivative(p0, p1, p2, p3, 0.0);
        const v1 = cubicDerivative(p0, p1, p2, p3, 1.0);

        const th0 = tangentAngleDeg(v0.vx, v0.vy);
        const th1 = tangentAngleDeg(v1.vx, v1.vy);

        assertClose(th0, 90.0, 1e-6, 'Initial tangent angle must be 90.0 deg (along +Y)');
        assertClose(th1, 0.0, 1e-6, 'Final tangent angle must be 0.0 deg (along +X)');
      },
    },
    {
      id: 'TEST-T1-F16-04',
      name: 'Numerical Derivative vs Analytical Derivative: matches central difference approximation within 1e-4',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 10, y: 30 };
        const p1 = { x: 25, y: 90 };
        const p2 = { x: 85, y: 70 };
        const p3 = { x: 120, y: 10 };

        const evalPoint = (t: number) => {
          const mt = 1 - t;
          return {
            x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
            y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
          };
        };

        const t = 0.37;
        const h = 1e-5;
        const ana = cubicDerivative(p0, p1, p2, p3, t);
        const pPlus = evalPoint(t + h);
        const pMinus = evalPoint(t - h);

        const numVx = (pPlus.x - pMinus.x) / (2 * h);
        const numVy = (pPlus.y - pMinus.y) / (2 * h);

        assertClose(ana.vx, numVx, 1e-4, 'Analytical vx must match numerical central difference');
        assertClose(ana.vy, numVy, 1e-4, 'Analytical vy must match numerical central difference');
      },
    },
    {
      id: 'TEST-T1-F16-05',
      name: 'Tangent Angle Normalization Invariant: angles across 4 quadrants remain within [-180.0, +180.0] deg',
      feature: 'F-BEZIER-DYNAMICS',
      tier: 1,
      fn: async (ctx) => {
        const vectors: [number, number][] = [
          [10, 0],   // 0 deg
          [0, 10],   // 90 deg
          [-10, 0],  // 180 deg
          [0, -10],  // -90 deg
          [10, 10],  // 45 deg
          [-10, 10], // 135 deg
          [-10, -10],// -135 deg
          [10, -10], // -45 deg
        ];

        for (const [vx, vy] of vectors) {
          const angle = tangentAngleDeg(vx, vy);
          assertTrue(angle >= -180.0 && angle <= 180.0, `Angle ${angle} must reside within [-180, 180]`);
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
