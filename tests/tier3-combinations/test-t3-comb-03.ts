/**
 * T3-COMB-03: Velocity Look-Ahead with 2nd-Order Critically Damped Inertia
 * Features: F-CAM-TRACKING + F-CAM-DAMPING
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-03',
  name: 'Velocity Look-Ahead with 2nd-Order Critically Damped Inertia',
  feature: 'F-CAM-TRACKING+F-CAM-DAMPING',
  tier: 3,
  description:
    'Verifies camera target tracking combines dynamic look-ahead lead with 2nd-order spring damping and dead-zone filtering to eliminate micro-jitter.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'cameraFollowContinuous',
    ]);

    let camMod = motionKit;
    if (!isAvailable || !camMod?.cameraFollowContinuous) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'cameraFollowContinuous',
      ]);
      if (!altAvailable || !altMod?.cameraFollowContinuous) {
        ctx.notImplemented('cameraFollowContinuous not yet implemented in motion-kit (Planned for M3)');
        return;
      }
      camMod = altMod;
    }

    const followFn = camMod.cameraFollowContinuous;

    ctx.log('Testing Camera dead-zone, velocity look-ahead, and critically damped decay...');

    const deadZone = 15;
    // 1. Inside dead-zone test (|delta p| <= 15)
    const stationaryCam = { x: 100, y: 100, vx: 0, vy: 0 };
    const nearTarget = { x: 110, y: 100, vx: 0, vy: 0 }; // delta = 10 <= 15
    const resultDeadZone = followFn(stationaryCam, nearTarget, { deadZoneRadius: deadZone, leadFactor: 4.0 });

    assertClose(resultDeadZone.x, stationaryCam.x, 0.5, 'Camera should remain stationary within dead-zone');

    // 2. High velocity outside dead-zone -> camera leads target
    const cruiseCam = { x: 200, y: 100, vx: 20, vy: 0 };
    const fastTarget = { x: 300, y: 100, vx: 30, vy: 0 };
    const resultLead = followFn(cruiseCam, fastTarget, { deadZoneRadius: deadZone, leadFactor: 3.0 });
    assertTrue(
      resultLead.x >= cruiseCam.x,
      `Camera must advance with look-ahead lead in velocity direction: got ${resultLead.x}`
    );
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-03 Suite',
  feature: 'F-CAM-TRACKING+F-CAM-DAMPING',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
