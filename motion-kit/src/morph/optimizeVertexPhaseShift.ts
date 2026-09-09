import { Point2D, PhaseShiftResult } from './types';

/**
 * Optimizes cyclic vertex indexing and winding orientation between two sampled polygon paths.
 * Minimizes Euclidean squared distance to prevent twisting and inversion artifacts during morphs.
 *
 * @param polyA Source polygon vertex coordinates
 * @param polyB Target polygon vertex coordinates
 * @returns PhaseShiftResult with optimal shift index and aligned vertices
 */
export function optimizeVertexPhaseShift(
  polyA: Point2D[],
  polyB: Point2D[]
): PhaseShiftResult {
  const N = Math.min(polyA.length, polyB.length);
  if (N === 0) {
    return {
      shiftIndex: 0,
      optimalShift: 0,
      minDistanceSq: 0,
      optimizedCost: 0,
      unshiftedCost: 0,
      distance: 0,
      reversed: false,
    };
  }

  // Evaluate unshifted cost (s = 0)
  let unshiftedCost = 0;
  for (let i = 0; i < N; i++) {
    const dx = polyA[i][0] - polyB[i][0];
    const dy = polyA[i][1] - polyB[i][1];
    unshiftedCost += dx * dx + dy * dy;
  }

  let bestShift = 0;
  let minDistanceSq = Infinity;
  let isReversed = false;

  // 1. Evaluate normal orientation
  for (let s = 0; s < N; s++) {
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const a = polyA[(i + s) % N];
      const b = polyB[i];
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      sumSq += dx * dx + dy * dy;
    }
    if (sumSq < minDistanceSq) {
      minDistanceSq = sumSq;
      bestShift = s;
      isReversed = false;
    }
  }

  // 2. Evaluate reversed orientation (handles opposite winding directions)
  const reversedB: Point2D[] = Array.from({ length: N }, (_, i) => polyB[(N - 1 - i) % N]);
  for (let s = 0; s < N; s++) {
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const a = polyA[(i + s) % N];
      const b = reversedB[i];
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      sumSq += dx * dx + dy * dy;
    }
    if (sumSq < minDistanceSq) {
      minDistanceSq = sumSq;
      bestShift = s;
      isReversed = true;
    }
  }

  const alignedB = isReversed ? reversedB : polyB;
  const alignedVertices: Point2D[] = Array.from({ length: N }, (_, i) => alignedB[(i + bestShift) % N]);

  return {
    shiftIndex: bestShift,
    optimalShift: bestShift,
    minDistanceSq,
    optimizedCost: minDistanceSq,
    unshiftedCost,
    distance: Math.sqrt(minDistanceSq / N),
    reversed: isReversed,
    alignedVertices,
  };
}
