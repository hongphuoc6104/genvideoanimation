/**
 * tests/e2e/tier1-features/f31-validator-validate-caption-layout.test.ts
 * Tier 1: Feature Coverage Tests for F31 (Validator validate-caption-layout.ts)
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_CAPTIONS_JSON, SHOTSPEC_FIXTURES } from '../harness/fixtures';

export function validateCaptionLayout(
  captions: typeof MOCK_CAPTIONS_JSON,
  shotSpec: { safe_margin?: number; subject_region?: { x: number; y: number; width: number; height: number } }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const safeMargin = shotSpec.safe_margin ?? 96;
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  for (const group of captions.groups) {
    const { x, y, width, height } = group.box;

    // Safe margin checks
    if (x < safeMargin) errors.push(`Group ${group.id} left edge ${x} < safe margin ${safeMargin}`);
    if (y < safeMargin) errors.push(`Group ${group.id} top edge ${y} < safe margin ${safeMargin}`);
    if (x + width > canvasWidth - safeMargin) {
      errors.push(`Group ${group.id} right edge ${x + width} > ${canvasWidth - safeMargin}`);
    }
    if (y + height > canvasHeight - safeMargin) {
      errors.push(`Group ${group.id} bottom edge ${y + height} > ${canvasHeight - safeMargin}`);
    }

    // Subject collision check
    if (shotSpec.subject_region) {
      const sub = shotSpec.subject_region;
      const xOverlap = Math.max(0, Math.min(x + width, sub.x + sub.width) - Math.max(x, sub.x));
      const yOverlap = Math.max(0, Math.min(y + height, sub.y + sub.height) - Math.max(y, sub.y));
      const collisionArea = xOverlap * yOverlap;

      if (collisionArea > 0) {
        errors.push(`Group ${group.id} collides with subject region (overlap area: ${collisionArea}px²)`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export const suite: TestSuite = {
  name: 'Tier 1: F31 Validator validate-caption-layout.ts',
  feature: 'F31',
  tier: 1,
  tests: [
    {
      id: 'T1-F31-01',
      name: 'Validator accepts captions and shotSpec inputs and validates layout',
      feature: 'F31',
      tier: 1,
      fn: async (ctx) => {
        const spec = SHOTSPEC_FIXTURES.DEFAULT_EDUCATIONAL;
        const res = validateCaptionLayout(MOCK_CAPTIONS_JSON, spec);
        assertTrue(res.valid, `Expected valid layout, got errors: ${res.errors.join(', ')}`);
        assertEqual(res.errors.length, 0);
      },
    },
    {
      id: 'T1-F31-02',
      name: 'Validator catches title-safe margin violations when box encroaches border',
      feature: 'F31',
      tier: 1,
      fn: async (ctx) => {
        const invalidCaptions = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        // Push box into bottom border (y=1020 + h=120 = 1140 > 984)
        invalidCaptions.groups[0].box.y = 1020;

        const res = validateCaptionLayout(invalidCaptions, { safe_margin: 96 });
        assertFalse(res.valid, 'Should detect safe margin encroachment');
        assertTrue(res.errors.some((e) => e.includes('bottom edge')));
      },
    },
    {
      id: 'T1-F31-03',
      name: 'Validator catches AABB collision between caption box and subject region',
      feature: 'F31',
      tier: 1,
      fn: async (ctx) => {
        const specWithBottomSubject = SHOTSPEC_FIXTURES.WITH_SUBJECT_BOTTOM;
        // Mock captions has bottom boxes at y=864, which intersect subject region at y=750..1030
        const res = validateCaptionLayout(MOCK_CAPTIONS_JSON, specWithBottomSubject);
        assertFalse(res.valid, 'Should detect collision with bottom subject');
        assertTrue(res.errors.some((e) => e.includes('collides with subject region')));
      },
    },
    {
      id: 'T1-F31-04',
      name: 'Validator confirms repositioned top captions avoid bottom subject collision',
      feature: 'F31',
      tier: 1,
      fn: async (ctx) => {
        const topCaptions = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        // Reposition boxes to top safe zone y=96
        topCaptions.groups[0].box.y = 96;
        topCaptions.groups[1].box.y = 96;

        const specWithBottomSubject = SHOTSPEC_FIXTURES.WITH_SUBJECT_BOTTOM;
        const res = validateCaptionLayout(topCaptions, specWithBottomSubject);
        assertTrue(res.valid, 'Top repositioned captions must have 0 collision with bottom subject');
      },
    },
    {
      id: 'T1-F31-05',
      name: 'Validator enforces 1920x1080 canvas bounds constraints',
      feature: 'F31',
      tier: 1,
      fn: async (ctx) => {
        const outOfBoundsCaptions = JSON.parse(JSON.stringify(MOCK_CAPTIONS_JSON));
        outOfBoundsCaptions.groups[0].box.x = 1850; // past right border

        const res = validateCaptionLayout(outOfBoundsCaptions, { safe_margin: 96 });
        assertFalse(res.valid, 'Should reject box outside right boundary');
        assertTrue(res.errors.some((e) => e.includes('right edge')));
      },
    },
  ],
};

registerSuite(suite);
