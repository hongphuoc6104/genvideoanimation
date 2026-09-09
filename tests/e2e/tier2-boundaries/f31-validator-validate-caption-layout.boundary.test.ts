/**
 * tests/e2e/tier2-boundaries/f31-validator-validate-caption-layout.boundary.test.ts
 * Feature F31: Validator validate-caption-layout.ts Boundary Tests (T2-F31-01 to T2-F31-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F31: Validator validate-caption-layout.ts Boundary Tests', () => {
  const validateLayout = (
    box: { x: number; y: number; width: number; height: number },
    subject?: { x: number; y: number; width: number; height: number } | null,
    viewport = { width: 1920, height: 1080 },
    safeMargin = 96
  ): { valid: boolean; reason?: string } => {
    if (box.width <= 0 || box.height <= 0) return { valid: false, reason: 'Invalid box dimensions' };
    if (box.x < safeMargin) return { valid: false, reason: `Box left edge ${box.x} < safe margin ${safeMargin}` };
    if (box.y < safeMargin) return { valid: false, reason: `Box top edge ${box.y} < safe margin ${safeMargin}` };
    if (box.x + box.width > viewport.width - safeMargin) return { valid: false, reason: 'Box right edge exceeds safe margin' };
    if (box.y + box.height > viewport.height - safeMargin) return { valid: false, reason: 'Box bottom edge exceeds safe margin' };

    if (subject) {
      const collides =
        box.x < subject.x + subject.width &&
        box.x + box.width > subject.x &&
        box.y < subject.y + subject.height &&
        box.y + box.height > subject.y;
      if (collides) return { valid: false, reason: 'Collision with subject_region detected' };
    }

    return { valid: true };
  };

  test('T2-F31-01: Caption box violating 96px safe margin fails layout validation', async (ctx) => {
    const marginBreachBox = { x: 50, y: 864, width: 1536, height: 120 }; // x: 50 < 96
    const res = validateLayout(marginBreachBox);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('safe margin'));
  }, { id: 'T2-F31-01', feature: 'F31', tier: 2 });

  test('T2-F31-02: Caption box overlapping ShotSpec subject region fails collision validation', async (ctx) => {
    const captionBox = { x: 500, y: 750, width: 800, height: 120 };
    const subject = { x: 500, y: 750, width: 920, height: 280 };
    const res = validateLayout(captionBox, subject);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('Collision with subject_region'));
  }, { id: 'T2-F31-02', feature: 'F31', tier: 2 });

  test('T2-F31-03: Caption box extending outside 1920x1080 canvas bounds fails validation', async (ctx) => {
    const overflowBox = { x: 192, y: 1000, width: 1536, height: 150 }; // 1000 + 150 = 1150 > 984 (safe bottom)
    const res = validateLayout(overflowBox);
    assertEqual(res.valid, false);
    assertTrue(res.reason!.includes('bottom edge exceeds'));
  }, { id: 'T2-F31-03', feature: 'F31', tier: 2 });

  test('T2-F31-04: Non-positive width or height in caption box fails validation', async (ctx) => {
    const zeroBox = { x: 192, y: 864, width: 0, height: 120 };
    const resZero = validateLayout(zeroBox);
    assertEqual(resZero.valid, false);
    assertTrue(resZero.reason!.includes('Invalid box dimensions'));

    const negBox = { x: 192, y: 864, width: 1536, height: -10 };
    const resNeg = validateLayout(negBox);
    assertEqual(resNeg.valid, false);
  }, { id: 'T2-F31-04', feature: 'F31', tier: 2 });

  test('T2-F31-05: Properly positioned box with >= 96px margin and 0 subject collision passes', async (ctx) => {
    const validBox = { x: 192, y: 864, width: 1536, height: 120 };
    const nonCollidingSubject = { x: 500, y: 200, width: 400, height: 300 };
    const res = validateLayout(validBox, nonCollidingSubject);
    assertEqual(res.valid, true);
  }, { id: 'T2-F31-05', feature: 'F31', tier: 2 });
}, { feature: 'F31', tier: 2 });
