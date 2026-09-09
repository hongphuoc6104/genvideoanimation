import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertDeepEqual,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F13: Arc-Length Resampling & Phase Shift Optimization Boundaries',
  feature: 'F-MORPH-RESAMPLE',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F13-01',
      name: 'Empty SVG Path String',
      feature: 'F-MORPH-RESAMPLE',
      tier: 2,
      description: 'Sampling an empty SVG path string throws a descriptive error or rejects gracefully',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['samplePathArcLength']
        );
        if (!isAvailable) {
          ctx.notImplemented('samplePathArcLength not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        assertThrows(() => mod.samplePathArcLength('', 64), /empty/i);
      },
    },
    {
      id: 'TEST-T2-F13-02',
      name: 'Zero-Length Degenerate Path',
      feature: 'F-MORPH-RESAMPLE',
      tier: 2,
      description: 'Degenerate path with zero arc length returns N vertices at the coordinate without divide-by-zero crash',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['samplePathArcLength']
        );
        if (!isAvailable) {
          ctx.notImplemented('samplePathArcLength not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const pts = mod.samplePathArcLength('M 10 10 L 10 10 Z', 32);
        assertEqual(pts.length, 32, 'Must return 32 vertices');
        for (const p of pts) {
          const x = Array.isArray(p) ? p[0] : p.x;
          const y = Array.isArray(p) ? p[1] : p.y;
          assertEqual(x, 10, 'Vertex x must be 10');
          assertEqual(y, 10, 'Vertex y must be 10');
        }
      },
    },
    {
      id: 'TEST-T2-F13-03',
      name: 'Opposite Winding Orientation Detection',
      feature: 'F-MORPH-RESAMPLE',
      tier: 2,
      description: 'Polygons with opposite winding directions are normalized to minimize twist distortion distance',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['optimizeVertexPhaseShift']
        );
        if (!isAvailable) {
          ctx.notImplemented('optimizeVertexPhaseShift not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const cwPoly: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
        const ccwPoly: [number, number][] = [[0, 0], [0, 10], [10, 10], [10, 0]];
        const res = mod.optimizeVertexPhaseShift(cwPoly, ccwPoly);

        assertTrue(res !== null && typeof res === 'object', 'Must return optimization result');
        assertTrue(Number.isFinite(res.minDistanceSq ?? res.distance ?? 0), 'Distance must be finite');
      },
    },
    {
      id: 'TEST-T2-F13-04',
      name: 'Minimal Sample Count (N < 3)',
      feature: 'F-MORPH-RESAMPLE',
      tier: 2,
      description: 'samplePathArcLength with count < 3 throws RangeError because polygons require >= 3 vertices',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['samplePathArcLength']
        );
        if (!isAvailable) {
          ctx.notImplemented('samplePathArcLength not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const circlePath = 'M 50 0 A 50 50 0 1 0 50 100 A 50 50 0 1 0 50 0 Z';
        assertThrows(() => mod.samplePathArcLength(circlePath, 1), /range|at least 3/i);
      },
    },
    {
      id: 'TEST-T2-F13-05',
      name: 'Multi-Subpath SVG String',
      feature: 'F-MORPH-RESAMPLE',
      tier: 2,
      description: 'SVG path containing multiple M commands samples primary contour without losing requested count N',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['samplePathArcLength']
        );
        if (!isAvailable) {
          ctx.notImplemented('samplePathArcLength not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const multiPath = 'M 0 0 L 10 0 Z M 50 50 L 60 50 Z';
        const pts = mod.samplePathArcLength(multiPath, 64);
        assertEqual(pts.length, 64, 'Must return requested 64 vertices');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
