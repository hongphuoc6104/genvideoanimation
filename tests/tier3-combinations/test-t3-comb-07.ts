/**
 * T3-COMB-07: Arc-Length Equidistant Path Resampling & Cyclic Phase Shift Minimization
 * Features: F-MORPH-RESAMPLE + F-MORPH-INTERPOLATE
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual, assertClose } from '../harness/assert';
import {
  resolveModule,
  PATH_DIAMOND_4_VERTICES,
  PATH_STAR_12_VERTICES,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-07',
  name: 'Arc-Length Equidistant Path Resampling & Cyclic Phase Shift Minimization',
  feature: 'F-MORPH-RESAMPLE+F-MORPH-INTERPOLATE',
  tier: 3,
  description:
    'Verifies arc-length path resampling generates uniform equidistant vertices and cyclic phase shift minimization optimizes alignment distance to prevent shape twisting.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'samplePathArcLength',
      'optimizeVertexPhaseShift',
    ]);

    let morphMod = motionKit;
    if (!isAvailable || !morphMod?.samplePathArcLength) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'samplePathArcLength',
      ]);
      if (!altAvailable || !altMod?.samplePathArcLength) {
        ctx.notImplemented('samplePathArcLength and optimizeVertexPhaseShift not yet implemented (Planned for M3)');
        return;
      }
      morphMod = altMod;
    }

    const { samplePathArcLength, optimizeVertexPhaseShift, interpolateSvgPath } = morphMod;
    ctx.log('Testing arc-length resampling on diamond and star paths with phase shift optimization...');

    const N = 64;
    const verticesA = samplePathArcLength(PATH_DIAMOND_4_VERTICES, N);
    const verticesB = samplePathArcLength(PATH_STAR_12_VERTICES, N);

    assertEqual(verticesA.length, N, 'Resampled path A must have exactly N vertices');
    assertEqual(verticesB.length, N, 'Resampled path B must have exactly N vertices');

    // 1. Invariant: Points along resampled perimeter are equidistant
    const segLengthsA: number[] = [];
    for (let i = 0; i < N; i++) {
      const pNext = verticesA[(i + 1) % N];
      const pCurr = verticesA[i];
      segLengthsA.push(Math.hypot(pNext[0] - pCurr[0], pNext[1] - pCurr[1]));
    }
    const avgLen = segLengthsA.reduce((a, b) => a + b, 0) / N;
    for (const len of segLengthsA) {
      assertClose(len, avgLen, avgLen * 0.15, 'Resampled points must be equidistant within 15% tolerance');
    }

    // 2. Invariant: Phase shift optimization reduces squared travel distance
    if (typeof optimizeVertexPhaseShift === 'function') {
      const { optimalShift, unshiftedCost, optimizedCost } = optimizeVertexPhaseShift(verticesA, verticesB);
      assertTrue(
        optimizedCost <= unshiftedCost,
        `Optimized cost (${optimizedCost}) must be <= unshifted cost (${unshiftedCost})`
      );
    }
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-07 Suite',
  feature: 'F-MORPH-RESAMPLE+F-MORPH-INTERPOLATE',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
