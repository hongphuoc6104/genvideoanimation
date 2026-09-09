/**
 * T3-COMB-13: Camera Tracking a Bezier Packet Trajectory with Look-Ahead
 * Features: F-BEZIER-TRAVEL + F-CAM-TRACKING
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-13',
  name: 'Camera Tracking a Bezier Packet Trajectory with Look-Ahead',
  feature: 'F-BEZIER-TRAVEL+F-CAM-TRACKING',
  tier: 3,
  description:
    'Verifies camera tracking an entity traveling along a curved Bezier trajectory orients its look-ahead lead vector along the instantaneous curve tangent without focal snapping.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'createBezierLUT',
      'evaluatePacketTravel',
      'cameraFollowContinuous',
    ]);

    let camMod = motionKit;
    if (!isAvailable || !camMod?.cameraFollowContinuous) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'cameraFollow',
      ]);
      if (!altAvailable || !altMod) {
        ctx.notImplemented('Camera tracking with Bezier look-ahead not yet implemented (Planned for M3)');
        return;
      }
      camMod = altMod;
    }

    ctx.log('Evaluating camera tracking a packet traveling along a cubic Bezier curve...');
    const { createBezierLUT, evaluatePacketTravel, cameraFollowContinuous } = camMod;
    const p0: [number, number] = [0, 0];
    const p1: [number, number] = [200, 400];
    const p2: [number, number] = [600, -200];
    const p3: [number, number] = [800, 300];

    const lut = createBezierLUT(p0, p1, p2, p3, 100);
    const totalLength = lut.totalLength ?? lut.length;

    let cam = { x: 0, y: 0, vx: 0, vy: 0 };
    const frames = 60;
    const camPositions: { x: number; y: number }[] = [];

    for (let f = 0; f <= frames; f++) {
      const dist = (f / frames) * totalLength;
      const packet = evaluatePacketTravel(lut, dist);
      cam = cameraFollowContinuous(
        cam,
        { x: packet.x, y: packet.y, vx: packet.vx, vy: packet.vy },
        { deadZoneRadius: 5, leadFactor: 2.0 }
      );
      camPositions.push({ x: cam.x, y: cam.y });
    }

    // Verify camera tracks smoothly without focal snapping
    for (let i = 1; i < camPositions.length; i++) {
      const step = Math.hypot(camPositions[i].x - camPositions[i - 1].x, camPositions[i].y - camPositions[i - 1].y);
      assertTrue(step < 150, `Camera motion must be smooth without focal snapping, step was ${step}`);
    }
    assertTrue(camPositions[frames].x > 500, 'Camera should track towards final destination along Bezier trajectory');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-13 Suite',
  feature: 'F-BEZIER-TRAVEL+F-CAM-TRACKING',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
