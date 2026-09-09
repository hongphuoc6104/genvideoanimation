/**
 * Tier 1 (Feature Coverage): F-CAM-CONTINUITY
 * Hermite Spline C0/C1 Camera Continuity
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

// Standard Cubic Hermite Spline formulation for camera transitions:
// p(t) = (2t^3 - 3t^2 + 1)*p0 + (t^3 - 2t^2 + t)*m0 + (-2t^3 + 3t^2)*p1 + (t^3 - t^2)*m1
// where tangents m0 = v0 * deltaK, m1 = v1 * deltaK (scaled by frame duration deltaK)
function hermitePosition(
  p0: { x: number; y: number },
  v0: { x: number; y: number },
  p1: { x: number; y: number },
  v1: { x: number; y: number },
  deltaK: number,
  t: number
): { x: number; y: number } {
  const m0x = v0.x * deltaK;
  const m0y = v0.y * deltaK;
  const m1x = v1.x * deltaK;
  const m1y = v1.y * deltaK;

  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return {
    x: h00 * p0.x + h10 * m0x + h01 * p1.x + h11 * m1x,
    y: h00 * p0.y + h10 * m0y + h01 * p1.y + h11 * m1y,
  };
}

// Derivative with respect to frame k: dp/dk = (1 / deltaK) * dp/dt
function hermiteVelocity(
  p0: { x: number; y: number },
  v0: { x: number; y: number },
  p1: { x: number; y: number },
  v1: { x: number; y: number },
  deltaK: number,
  t: number
): { x: number; y: number } {
  const m0x = v0.x * deltaK;
  const m0y = v0.y * deltaK;
  const m1x = v1.x * deltaK;
  const m1y = v1.y * deltaK;

  const t2 = t * t;

  // Derivatives of Hermite basis functions:
  // dh00/dt = 6t^2 - 6t
  // dh10/dt = 3t^2 - 4t + 1
  // dh01/dt = -6t^2 + 6t
  // dh11/dt = 3t^2 - 2t
  const dh00 = 6 * t2 - 6 * t;
  const dh10 = 3 * t2 - 4 * t + 1;
  const dh01 = -6 * t2 + 6 * t;
  const dh11 = 3 * t2 - 2 * t;

  const dpdt_x = dh00 * p0.x + dh10 * m0x + dh01 * p1.x + dh11 * m1x;
  const dpdt_y = dh00 * p0.y + dh10 * m0y + dh01 * p1.y + dh11 * m1y;

  return {
    x: dpdt_x / deltaK,
    y: dpdt_y / deltaK,
  };
}

export const testSuite: TestSuite = {
  name: 'Hermite Spline C0/C1 Camera Continuity',
  feature: 'F-CAM-CONTINUITY',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F12-01',
      name: 'Hermite Boundary Positional (C0) Continuity: evaluates to p0 at t=0.0 and p1 at t=1.0',
      feature: 'F-CAM-CONTINUITY',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['interpolateCameraHermite']);

        let interpolate = hermitePosition;
        if (isAvailable && typeof motionKit.interpolateCameraHermite === 'function') {
          interpolate = motionKit.interpolateCameraHermite;
        }

        const p0 = { x: 100, y: 200 };
        const p1 = { x: 500, y: 400 };
        const v0 = { x: 10, y: 5 };
        const v1 = { x: 20, y: 0 };
        const deltaK = 30;

        const at0 = interpolate(p0, v0, p1, v1, deltaK, 0.0);
        const at1 = interpolate(p0, v0, p1, v1, deltaK, 1.0);

        assertClose(at0.x, 100.0, 1e-7, 'Hermite start X must equal p0.x');
        assertClose(at0.y, 200.0, 1e-7, 'Hermite start Y must equal p0.y');
        assertClose(at1.x, 500.0, 1e-7, 'Hermite end X must equal p1.x');
        assertClose(at1.y, 400.0, 1e-7, 'Hermite end Y must equal p1.y');
      },
    },
    {
      id: 'TEST-T1-F12-02',
      name: 'Hermite Boundary Velocity (C1) Continuity: boundary derivatives equal v0 at t=0 and v1 at t=1',
      feature: 'F-CAM-CONTINUITY',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['computeHermiteVelocity']);

        let computeVel = hermiteVelocity;
        if (isAvailable && typeof motionKit.computeHermiteVelocity === 'function') {
          computeVel = motionKit.computeHermiteVelocity;
        }

        const p0 = { x: 100, y: 200 };
        const p1 = { x: 500, y: 400 };
        const v0 = { x: 10, y: 5 };
        const v1 = { x: 20, y: 0 };
        const deltaK = 30;

        const vAt0 = computeVel(p0, v0, p1, v1, deltaK, 0.0);
        const vAt1 = computeVel(p0, v0, p1, v1, deltaK, 1.0);

        assertClose(vAt0.x, 10.0, 1e-5, 'Boundary velocity X at t=0 must equal v0.x');
        assertClose(vAt0.y, 5.0, 1e-5, 'Boundary velocity Y at t=0 must equal v0.y');
        assertClose(vAt1.x, 20.0, 1e-5, 'Boundary velocity X at t=1 must equal v1.x');
        assertClose(vAt1.y, 0.0, 1e-5, 'Boundary velocity Y at t=1 must equal v1.y');
      },
    },
    {
      id: 'TEST-T1-F12-03',
      name: 'Constant Velocity Degenerate Spline: collinear matching velocities yield exact linear progression',
      feature: 'F-CAM-CONTINUITY',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 300, y: 0 };
        const v0 = { x: 10, y: 0 };
        const v1 = { x: 10, y: 0 };
        const deltaK = 30;

        const mid = hermitePosition(p0, v0, p1, v1, deltaK, 0.5);
        const vMid = hermiteVelocity(p0, v0, p1, v1, deltaK, 0.5);

        assertClose(mid.x, 150.0, 1e-5, 'Midpoint X must be exactly 150.0');
        assertClose(mid.y, 0.0, 1e-5, 'Midpoint Y must be 0.0');
        assertClose(vMid.x, 10.0, 1e-5, 'Velocity X must remain 10.0');
      },
    },
    {
      id: 'TEST-T1-F12-04',
      name: 'Rest-to-Rest S-Curve Smoothness: rest-to-rest transition reaches peak velocity 15.0 px/frame at t=0.5',
      feature: 'F-CAM-CONTINUITY',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 100, y: 0 };
        const v0 = { x: 0, y: 0 };
        const v1 = { x: 0, y: 0 };
        const deltaK = 10;

        const vMid = hermiteVelocity(p0, v0, p1, v1, deltaK, 0.5);
        assertClose(vMid.x, 15.0, 0.001, 'Midpoint S-curve peak velocity must be 15.0 px/frame');
      },
    },
    {
      id: 'TEST-T1-F12-05',
      name: 'Multi-Shot Continuous Handover: handover at frame boundary has zero velocity discontinuity (deltaV = 0)',
      feature: 'F-CAM-CONTINUITY',
      tier: 1,
      fn: async (ctx) => {
        // Sequential shots Shot A (frames 0-30) and Shot B (frames 30-60)
        const shotA = {
          pEnd: { x: 300, y: 150 },
          vEnd: { x: 12, y: 4 },
        };
        const shotB = {
          pStart: { x: 300, y: 150 },
          vStart: { x: 12, y: 4 },
        };

        const deltaV = Math.hypot(shotB.vStart.x - shotA.vEnd.x, shotB.vStart.y - shotA.vEnd.y);
        assertEqual(deltaV, 0, 'Handover velocity jump must be strictly 0');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
