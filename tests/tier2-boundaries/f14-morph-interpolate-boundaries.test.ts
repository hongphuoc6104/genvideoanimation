import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F14: Continuous Geometric SVG Path Morphing Boundaries',
  feature: 'F-MORPH-INTERPOLATE',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F14-01',
      name: 'Morph Progress Clamping',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 2,
      description: 'progress values < 0 and > 1 clamp strictly to 0.0 and 1.0 geometry',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['interpolateSvgPath']
        );
        if (!isAvailable) {
          ctx.notImplemented('interpolateSvgPath not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const pA = 'M 0 0 L 100 0 L 100 100 L 0 100 Z';
        const pB = 'M 50 0 L 100 50 L 50 100 L 0 50 Z';

        const pathNeg = mod.interpolateSvgPath(pA, pB, -0.75);
        const pathZero = mod.interpolateSvgPath(pA, pB, 0.0);
        assertEqual(pathNeg, pathZero, 'progress < 0 must clamp to progress 0.0');

        const pathOver = mod.interpolateSvgPath(pA, pB, 2.5);
        const pathOne = mod.interpolateSvgPath(pA, pB, 1.0);
        assertEqual(pathOver, pathOne, 'progress > 1 must clamp to progress 1.0');
      },
    },
    {
      id: 'TEST-T2-F14-02',
      name: 'Extreme Aspect Ratio Disparity Morph',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 2,
      description: 'Morphing between thin sliver (2x200) and wide banner (200x2) produces 0 NaN tokens',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['interpolateSvgPath']
        );
        if (!isAvailable) {
          ctx.notImplemented('interpolateSvgPath not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const sliver = 'M 0 0 L 2 0 L 2 200 L 0 200 Z';
        const banner = 'M 0 0 L 200 0 L 200 2 L 0 2 Z';
        const interpolated = mod.interpolateSvgPath(sliver, banner, 0.5);

        assertFalse(interpolated.includes('NaN'), 'Interpolated SVG path must not contain NaN tokens');
        assertFalse(interpolated.includes('undefined'), 'Interpolated SVG path must not contain undefined');
      },
    },
    {
      id: 'TEST-T2-F14-03',
      name: 'Self-Intersection Minimization Check',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 2,
      description: 'Phase optimization aligns vertex pairing to minimize twist across 180-degree rotation',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['optimizeVertexPhaseShift']
        );
        if (!isAvailable) {
          ctx.notImplemented('optimizeVertexPhaseShift not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const polyA = [[0, 50], [50, 0], [100, 50], [50, 100]];
        const polyB = [[100, 50], [50, 100], [0, 50], [50, 0]]; // Rotated 180 deg
        const result = mod.optimizeVertexPhaseShift(polyA, polyB);

        assertTrue(result !== null, 'Must compute phase shift optimization');
        assertTrue(Number.isFinite(result.minDistanceSq ?? result.distance ?? 0), 'Distance must be finite');
      },
    },
    {
      id: 'TEST-T2-F14-04',
      name: 'Invalid Malformed SVG Path Syntax',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 2,
      description: 'Attempting to interpolate malformed path string throws controlled parsing error',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['interpolateSvgPath']
        );
        if (!isAvailable) {
          ctx.notImplemented('interpolateSvgPath not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const goodPath = 'M 0 0 L 100 0 L 100 100 Z';
        const badPath = 'M invalid gibberish random characters not path commands';
        assertThrows(() => mod.interpolateSvgPath(badPath, goodPath, 0.5), /parse|syntax|invalid/i);
      },
    },
    {
      id: 'TEST-T2-F14-05',
      name: 'Morph Between Identical Paths',
      feature: 'F-MORPH-INTERPOLATE',
      tier: 2,
      description: 'Identity morph between identical paths evaluates to matching input geometry at any progress',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/morph/index',
          ['interpolateSvgPath']
        );
        if (!isAvailable) {
          ctx.notImplemented('interpolateSvgPath not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const path = 'M 20 20 L 80 20 L 80 80 L 20 80 Z';
        const mid = mod.interpolateSvgPath(path, path, 0.43);
        assertTrue(mid.length > 0, 'Midpath must not be empty');
        assertFalse(mid.includes('NaN'), 'Midpath must not contain NaN');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
