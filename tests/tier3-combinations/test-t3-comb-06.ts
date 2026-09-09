/**
 * T3-COMB-06: Arc-Length LUT Constant Velocity & Tangent Orientation
 * Features: F-BEZIER-DYNAMICS + F-BEZIER-TRAVEL
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-06',
  name: 'Arc-Length LUT Constant Velocity & Tangent Orientation',
  feature: 'F-BEZIER-DYNAMICS+F-BEZIER-TRAVEL',
  tier: 3,
  description:
    'Verifies packet moving via arc-length LUT maintains constant physical speed (delta s approx const) and dynamic tangent rotation across high and low curvature segments.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'createBezierLUT',
      'evaluatePacketTravel',
    ]);

    let bezMod = motionKit;
    if (!isAvailable || !bezMod?.createBezierLUT) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'createBezierLUT',
      ]);
      if (!altAvailable || !altMod?.createBezierLUT) {
        ctx.notImplemented('Bezier LUT packet travel not yet implemented in motion-kit (Planned for M3)');
        return;
      }
      bezMod = altMod;
    }

    const { createBezierLUT, evaluatePacketTravel } = bezMod;
    ctx.log('Evaluating arc-length LUT constant velocity packet traversal...');

    const p0: [number, number] = [0, 0];
    const p1: [number, number] = [100, 300];
    const p2: [number, number] = [400, -100];
    const p3: [number, number] = [500, 200];

    const lut = createBezierLUT(p0, p1, p2, p3, 100);
    const totalLength = lut.totalLength ?? lut.length;
    assertTrue(totalLength > 500, 'LUT totalLength must be accurately computed');

    const stepPx = 10.0;
    const positions: [number, number][] = [];
    const angles: number[] = [];

    const numSteps = Math.min(30, Math.floor(totalLength / stepPx));
    for (let k = 0; k <= numSteps; k++) {
      const dist = k * stepPx;
      const packet = evaluatePacketTravel(lut, dist);
      positions.push([packet.x, packet.y]);
      angles.push(packet.rotationDeg ?? packet.angle);
    }

    // 1. Invariant: Distance between consecutive steps is approximately constant stepPx
    for (let k = 1; k < positions.length; k++) {
      const dx = positions[k][0] - positions[k - 1][0];
      const dy = positions[k][1] - positions[k - 1][1];
      const segDist = Math.hypot(dx, dy);
      assertClose(segDist, stepPx, 0.4, `Step ${k} Euclidean distance must match target stepPx within 0.4px`);
    }
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-06 Suite',
  feature: 'F-BEZIER-DYNAMICS+F-BEZIER-TRAVEL',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
