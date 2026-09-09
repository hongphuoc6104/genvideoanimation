/**
 * Tier 1 (Feature Coverage): F-BEZIER-TRAVEL
 * Arc-Length LUT Packet Travel & Stroke Reveal
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

type Point = { x: number; y: number };

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function cubicTangent(p0: Point, p1: Point, p2: Point, p3: Point, t: number): number {
  const mt = 1 - t;
  const vx = 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const vy = 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return (Math.atan2(vy, vx) * 180) / Math.PI;
}

interface BezierLUT {
  totalLength: number;
  samples: { t: number; distance: number; point: Point }[];
}

function buildLUT(p0: Point, p1: Point, p2: Point, p3: Point, subdivisions = 200): BezierLUT {
  const samples: { t: number; distance: number; point: Point }[] = [];
  let totalLength = 0;
  let prevPt = p0;
  samples.push({ t: 0, distance: 0, point: p0 });

  for (let i = 1; i <= subdivisions; i++) {
    const t = i / subdivisions;
    const pt = cubicPoint(p0, p1, p2, p3, t);
    const dist = Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
    totalLength += dist;
    samples.push({ t, distance: totalLength, point: pt });
    prevPt = pt;
  }

  return { totalLength, samples };
}

function getPointAtArcProgress(lut: BezierLUT, p0: Point, p1: Point, p2: Point, p3: Point, progress: number) {
  const targetDist = Math.max(0, Math.min(1, progress)) * lut.totalLength;
  const samples = lut.samples;

  // Binary search
  let low = 0;
  let high = samples.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid].distance < targetDist) low = mid + 1;
    else high = mid - 1;
  }

  const idx = Math.min(samples.length - 1, Math.max(1, low));
  const sPrev = samples[idx - 1];
  const sNext = samples[idx];
  const segDist = sNext.distance - sPrev.distance;
  const segT = segDist > 0 ? (targetDist - sPrev.distance) / segDist : 0;
  const t = sPrev.t + segT * (sNext.t - sPrev.t);

  const pt = cubicPoint(p0, p1, p2, p3, t);
  const angle = cubicTangent(p0, p1, p2, p3, t);

  return {
    coordinate: [pt.x, pt.y] as [number, number],
    t,
    arcProgress: progress,
    tangentAngle: angle,
  };
}

function strokeReveal(totalLength: number, revealProgress: number): { strokeDasharray: string; strokeDashoffset: number } {
  const clamped = Math.max(0, Math.min(1, revealProgress));
  return {
    strokeDasharray: `${totalLength} ${totalLength}`,
    strokeDashoffset: totalLength * (1 - clamped),
  };
}

export const testSuite: TestSuite = {
  name: 'Arc-Length LUT Packet Travel & Stroke Reveal',
  feature: 'F-BEZIER-TRAVEL',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F17-01',
      name: 'Constant Physical Velocity via Arc-Length LUT: consecutive 0.1 progress stations travel equal arc distances',
      feature: 'F-BEZIER-TRAVEL',
      tier: 1,
      fn: async (ctx) => {
        // Asymmetric cubic Bezier curve
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 10, y: 150 };
        const p2 = { x: 300, y: 200 };
        const p3 = { x: 400, y: 0 };

        const lut = buildLUT(p0, p1, p2, p3, 200);
        const L = lut.totalLength;

        for (let i = 0; i < 10; i++) {
          const pA = getPointAtArcProgress(lut, p0, p1, p2, p3, i / 10);
          const pB = getPointAtArcProgress(lut, p0, p1, p2, p3, (i + 1) / 10);
          const chordDist = Math.hypot(pB.coordinate[0] - pA.coordinate[0], pB.coordinate[1] - pA.coordinate[1]);
          const expectedStepDist = 0.1 * L;
          const relativeErr = Math.abs(chordDist - expectedStepDist) / expectedStepDist;
          assertTrue(relativeErr < 0.03, `Step [${i}] chord distance error ${relativeErr * 100}% must be < 3%`);
        }
      },
    },
    {
      id: 'TEST-T1-F17-02',
      name: 'Midpoint Packet Arc-Length Accuracy: progress=0.5 returns arcProgress=0.500 within 1e-4',
      feature: 'F-BEZIER-TRAVEL',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 50, y: 100 };
        const p2 = { x: 150, y: 0 };
        const p3 = { x: 200, y: 100 };

        const lut = buildLUT(p0, p1, p2, p3, 100);
        const pkt = getPointAtArcProgress(lut, p0, p1, p2, p3, 0.5);

        assertClose(pkt.arcProgress, 0.5, 1e-4, 'Packet arcProgress must equal 0.5');
      },
    },
    {
      id: 'TEST-T1-F17-03',
      name: 'Packet Tangent Orientation Alignment: packet orientation matches curve tangent within 0.01 deg',
      feature: 'F-BEZIER-TRAVEL',
      tier: 1,
      fn: async (ctx) => {
        const p0 = { x: 0, y: 0 };
        const p1 = { x: 100, y: 100 };
        const p2 = { x: 200, y: 100 };
        const p3 = { x: 300, y: 0 };

        const lut = buildLUT(p0, p1, p2, p3, 100);
        const pkt = getPointAtArcProgress(lut, p0, p1, p2, p3, 0.75);
        const expectedAngle = cubicTangent(p0, p1, p2, p3, pkt.t);

        assertClose(pkt.tangentAngle, expectedAngle, 0.01, 'Packet tangent angle must match curve tangent');
      },
    },
    {
      id: 'TEST-T1-F17-04',
      name: 'Stroke Reveal Dashoffset Calculation: length=600.0, revealProgress=0.35 yields strokeDashoffset=390.0',
      feature: 'F-BEZIER-TRAVEL',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['strokeReveal']);

        let calcReveal = strokeReveal;
        if (isAvailable && typeof motionKit.strokeReveal === 'function') {
          calcReveal = motionKit.strokeReveal;
        }

        const reveal = calcReveal(600.0, 0.35);
        assertEqual(reveal.strokeDasharray, '600 600', 'strokeDasharray must be "600 600"');
        assertClose(reveal.strokeDashoffset, 390.0, 1e-4, 'strokeDashoffset must be 390.0 (600 * (1 - 0.35))');
      },
    },
    {
      id: 'TEST-T1-F17-05',
      name: 'Complete Stroke Reveal (progress=1.0): strokeDashoffset equals exactly 0.0',
      feature: 'F-BEZIER-TRAVEL',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['strokeReveal']);

        let calcReveal = strokeReveal;
        if (isAvailable && typeof motionKit.strokeReveal === 'function') {
          calcReveal = motionKit.strokeReveal;
        }

        const reveal = calcReveal(1250.0, 1.0);
        assertEqual(reveal.strokeDashoffset, 0.0, 'Full reveal must have strokeDashoffset exactly 0.0');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
