/**
 * T3-COMB-04: Spring Damping Across Hermite Spline Shot Transitions
 * Features: F-CAM-DAMPING + F-CAM-CONTINUITY
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertClose } from '../harness/assert';
import { resolveModule } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-04',
  name: 'Spring Damping Across Hermite Spline Shot Transitions',
  feature: 'F-CAM-DAMPING+F-CAM-CONTINUITY',
  tier: 3,
  description:
    'Verifies incoming spring-damped camera velocity is preserved into the Hermite spline basis, ensuring C1 velocity continuity across shot transitions.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'interpolateCameraHermite',
    ]);

    let camMod = motionKit;
    if (!isAvailable || !camMod?.interpolateCameraHermite) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'interpolateCameraHermite',
      ]);
      if (!altAvailable || !altMod?.interpolateCameraHermite) {
        ctx.notImplemented('interpolateCameraHermite not yet implemented in motion-kit (Planned for M3)');
        return;
      }
      camMod = altMod;
    }

    const { interpolateCameraHermite } = camMod;
    ctx.log('Evaluating Hermite camera interpolation with non-zero incoming velocity vector...');

    const p0 = { x: 300, y: 150, zoom: 1.2 };
    const p1 = { x: 800, y: 400, zoom: 1.0 };
    const v0 = { vx: 12.5, vy: 4.2, vZoom: 0.0 };
    const v1 = { vx: 0.0, vy: 0.0, vZoom: 0.0 };

    // 1. Invariant: At t=0, camera position must match p0
    const startCam = interpolateCameraHermite(p0, p1, v0, v1, 0.0);
    assertClose(startCam.x, p0.x, 1e-4, 'Hermite start x must equal p0.x');
    assertClose(startCam.y, p0.y, 1e-4, 'Hermite start y must equal p0.y');
    assertClose(startCam.zoom, p0.zoom, 1e-4, 'Hermite start zoom must equal p0.zoom');

    // 2. Invariant: At t=1, camera position must match p1
    const endCam = interpolateCameraHermite(p0, p1, v0, v1, 1.0);
    assertClose(endCam.x, p1.x, 1e-4, 'Hermite end x must equal p1.x');
    assertClose(endCam.y, p1.y, 1e-4, 'Hermite end y must equal p1.y');

    // 3. Invariant: Velocity at t=0 matches v0 via finite differences: (p(h) - p(0)) / h approx v0
    const h = 0.001; // dt in normalized units
    const p_h = interpolateCameraHermite(p0, p1, v0, v1, h);
    // In normalized Hermite: dp/dt = v0
    const numVx = (p_h.x - startCam.x) / h;
    const numVy = (p_h.y - startCam.y) / h;
    assertClose(numVx, v0.vx, 0.5, 'Initial numerical derivative x must match incoming v0.vx');
    assertClose(numVy, v0.vy, 0.5, 'Initial numerical derivative y must match incoming v0.vy');
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-04 Suite',
  feature: 'F-CAM-DAMPING+F-CAM-CONTINUITY',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
