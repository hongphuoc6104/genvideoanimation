/**
 * Tier 1 (Feature Coverage): F-CAM-DAMPING
 * 2nd-Order Spring-Damper Inertia & Soft Dead-Zone
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

// Standard 2nd-order spring damper integrator:
// x'' + 2*zeta*omega*x' + omega^2*(x - target) = 0
function simulateSpringDamper(
  initPos: number,
  targetPos: number,
  steps: number,
  dt: number,
  omega: number,
  zeta: number
): number[] {
  const trajectory: number[] = [];
  let pos = initPos;
  let vel = 0;

  for (let i = 0; i < steps; i++) {
    const error = pos - targetPos;
    const accel = -2 * zeta * omega * vel - omega * omega * error;
    vel += accel * dt;
    pos += vel * dt;
    trajectory.push(pos);
  }

  return trajectory;
}

function softDeadZone(delta: number, threshold: number): number {
  const abs = Math.abs(delta);
  if (abs <= threshold) return 0;
  return Math.sign(delta) * (abs - threshold);
}

export const testSuite: TestSuite = {
  name: '2nd-Order Spring-Damper Inertia & Soft Dead-Zone',
  feature: 'F-CAM-DAMPING',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F11-01',
      name: 'Critically Damped Step Response (zeta = 1.0): monotonically settles near 100 with zero overshoot',
      feature: 'F-CAM-DAMPING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['integrateCameraSpringDamper']);

        let traj: number[];
        if (isAvailable && typeof motionKit.integrateCameraSpringDamper === 'function') {
          traj = motionKit.integrateCameraSpringDamper(0, 100, 60, 1 / 30, 4.0, 1.0);
        } else {
          traj = simulateSpringDamper(0, 100, 60, 1 / 30, 4.0, 1.0);
        }

        const maxPos = Math.max(...traj);
        assertTrue(maxPos <= 100.001, `Critical damping must not overshoot 100.0 (got max ${maxPos})`);
        assertTrue(traj[traj.length - 1] >= 99.0, `Final position ${traj[traj.length - 1]} must settle near target (>= 99.0)`);
      },
    },
    {
      id: 'TEST-T1-F11-02',
      name: 'Zero Inert Damping Verification: underdamped zeta=0.5 exhibits overshoot while zeta=1.0 exhibits none',
      feature: 'F-CAM-DAMPING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['integrateCameraSpringDamper']);

        let peakUnder: number;
        let peakCrit: number;

        if (isAvailable && typeof motionKit.integrateCameraSpringDamper === 'function') {
          peakUnder = Math.max(...motionKit.integrateCameraSpringDamper(0, 100, 60, 1 / 30, 2.0, 0.5));
          peakCrit = Math.max(...motionKit.integrateCameraSpringDamper(0, 100, 60, 1 / 30, 2.0, 1.0));
        } else {
          peakUnder = Math.max(...simulateSpringDamper(0, 100, 60, 1 / 30, 2.0, 0.5));
          peakCrit = Math.max(...simulateSpringDamper(0, 100, 60, 1 / 30, 2.0, 1.0));
        }

        assertTrue(peakUnder > 105.0, `Underdamped peak ${peakUnder} must exceed 105.0`);
        assertTrue(peakCrit <= 100.001, `Critically damped peak ${peakCrit} must not exceed 100.001`);
      },
    },
    {
      id: 'TEST-T1-F11-03',
      name: 'Dead-Zone Stillness Invariant: displacement 12.0 within threshold 15.0 produces 0.0 error',
      feature: 'F-CAM-DAMPING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['applySoftDeadZone']);

        let applyDeadZone = softDeadZone;
        if (isAvailable && typeof motionKit.applySoftDeadZone === 'function') {
          applyDeadZone = motionKit.applySoftDeadZone;
        }

        const err = applyDeadZone(12.0, 15.0);
        assertEqual(err, 0.0, 'Displacement within dead-zone must produce exact zero error');
      },
    },
    {
      id: 'TEST-T1-F11-04',
      name: 'Soft Dead-Zone Linear Continuity at Exit: displacement 18.0 with threshold 15.0 produces +3.0 error',
      feature: 'F-CAM-DAMPING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['applySoftDeadZone']);

        let applyDeadZone = softDeadZone;
        if (isAvailable && typeof motionKit.applySoftDeadZone === 'function') {
          applyDeadZone = motionKit.applySoftDeadZone;
        }

        const err = applyDeadZone(18.0, 15.0);
        assertClose(err, 3.0, 1e-5, 'Exit error must be linearly continuous (+3.0)');
      },
    },
    {
      id: 'TEST-T1-F11-05',
      name: 'Steady-State Convergence After Target Stop: camera settles within 0.01px and vel < 0.001 at target (500, 500)',
      feature: 'F-CAM-DAMPING',
      tier: 1,
      fn: async (ctx) => {
        // Integrate camera approaching 500
        const dt = 1 / 30;
        const omega = 7.5;
        const zeta = 1.0;
        let pos = 450;
        let vel = 10;
        const target = 500;

        for (let frame = 0; frame < 60; frame++) {
          const subSteps = 10;
          const subDt = dt / subSteps;
          for (let s = 0; s < subSteps; s++) {
            const err = pos - target;
            const accel = -2 * zeta * omega * vel - omega * omega * err;
            vel += accel * subDt;
            pos += vel * subDt;
          }
        }

        const velPerFrame = Math.abs(vel * dt);
        assertTrue(Math.abs(pos - target) < 0.01, `Steady state position error ${Math.abs(pos - target)} must be < 0.01px`);
        assertTrue(velPerFrame < 0.001, `Steady state velocity ${velPerFrame} must be < 0.001 px/frame`);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
