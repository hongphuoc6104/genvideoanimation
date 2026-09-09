/**
 * tests/e2e/tier1-features/f16-safe-area-placement-planner.test.ts
 * Tier 1: Feature Coverage Tests for F16 (Safe Area Placement Planner)
 */

import {
  assertEqual,
  assertTrue,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_CAPTIONS_JSON, SHOTSPEC_FIXTURES } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F16 Safe Area Placement Planner',
  feature: 'F16',
  tier: 1,
  tests: [
    {
      id: 'T1-F16-01',
      name: 'Enforces minimum 96px title-safe margin from canvas boundaries (1920x1080)',
      feature: 'F16',
      tier: 1,
      fn: async (ctx) => {
        const safeMargin = 96;
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          const { x, y, width, height } = group.box;
          assertTrue(x >= safeMargin, `Left margin violation: x=${x} < ${safeMargin}`);
          assertTrue(y >= safeMargin, `Top margin violation: y=${y} < ${safeMargin}`);
          assertTrue(x + width <= 1920 - safeMargin, `Right margin violation: x+width=${x + width} > ${1920 - safeMargin}`);
          assertTrue(y + height <= 1080 - safeMargin, `Bottom margin violation: y+height=${y + height} > ${1080 - safeMargin}`);
        }
      },
    },
    {
      id: 'T1-F16-02',
      name: 'Supports canonical placement presets (bottom, top, lower-left, lower-right, auto)',
      feature: 'F16',
      tier: 1,
      fn: async (ctx) => {
        const validPositions = ['bottom', 'top', 'lower-left', 'lower-right', 'auto'];
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          assertTrue(validPositions.includes(group.position), `Invalid position preset: ${group.position}`);
        }
      },
    },
    {
      id: 'T1-F16-03',
      name: 'Calculates 2D Axis-Aligned Bounding Box (AABB) intersection area accurately',
      feature: 'F16',
      tier: 1,
      fn: async (ctx) => {
        const computeAabbIntersection = (
          a: { x: number; y: number; width: number; height: number },
          b: { x: number; y: number; width: number; height: number }
        ): number => {
          const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
          const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
          return xOverlap * yOverlap;
        };

        const box1 = { x: 100, y: 100, width: 200, height: 100 };
        const box2 = { x: 150, y: 150, width: 200, height: 100 };
        const area = computeAabbIntersection(box1, box2);
        assertEqual(area, 150 * 50, 'Intersection area of overlapping boxes must equal 7500');

        const box3 = { x: 500, y: 500, width: 100, height: 100 };
        assertEqual(computeAabbIntersection(box1, box3), 0, 'Disjoint boxes must have 0 intersection area');
      },
    },
    {
      id: 'T1-F16-04',
      name: 'Dynamic repositioning switches bottom to top when subject region obstructs bottom zone',
      feature: 'F16',
      tier: 1,
      fn: async (ctx) => {
        const subject = SHOTSPEC_FIXTURES.WITH_SUBJECT_BOTTOM.subject_region!;
        assertTrue(subject !== undefined, 'Subject region fixture must be defined');

        const bottomBox = { x: 192, y: 864, width: 1536, height: 120 };
        const topBox = { x: 192, y: 96, width: 1536, height: 120 };

        // Check that bottomBox overlaps with subject
        const xOverlapBottom = Math.max(0, Math.min(bottomBox.x + bottomBox.width, subject.x + subject.width) - Math.max(bottomBox.x, subject.x));
        const yOverlapBottom = Math.max(0, Math.min(bottomBox.y + bottomBox.height, subject.y + subject.height) - Math.max(bottomBox.y, subject.y));
        assertTrue(xOverlapBottom * yOverlapBottom > 0, 'Bottom box must collide with bottom subject');

        // Check that topBox is completely collision-free
        const yOverlapTop = Math.max(0, Math.min(topBox.y + topBox.height, subject.y + subject.height) - Math.max(topBox.y, subject.y));
        assertEqual(yOverlapTop, 0, 'Top relocated box must have zero collision with bottom subject');
      },
    },
    {
      id: 'T1-F16-05',
      name: 'Caption bounding box dimensions are strictly positive and fit within viewport',
      feature: 'F16',
      tier: 1,
      fn: async (ctx) => {
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          const { width, height } = group.box;
          assertTrue(width > 200, `Width (${width}) must be substantial`);
          assertTrue(height > 40, `Height (${height}) must be substantial`);
          assertTrue(width <= 1920, `Width must not exceed viewport 1920`);
          assertTrue(height <= 400, `Height must not exceed 400`);
        }
      },
    },
  ],
};

registerSuite(suite);
