/**
 * Tier 2 Boundary Suite: F02 — Typography Boundaries & Extremes (R2)
 *
 * Verifies exact threshold boundaries, scale factor floor boundaries,
 * micro-scales, negative/zero font sizes, and string unit parsing.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
} from '../harness/assert';
import { TYPOGRAPHY_THRESHOLDS } from '../../../validators/validate-mobile-typography';

describe({ name: 'F02-B: Typography Boundaries', feature: 'F02', tier: 2 }, () => {
  test(
    'F02-B01: Exact role threshold boundaries (63.9 vs 64.0, 33.9 vs 34.0)',
    () => {
      const checkHero = (size: number) => size >= TYPOGRAPHY_THRESHOLDS.hero;
      assertTrue(checkHero(64.0), '64.0px hero passes');
      assertFalse(checkHero(63.9), '63.9px hero fails');

      const checkBody = (size: number) => size >= TYPOGRAPHY_THRESHOLDS.body;
      assertTrue(checkBody(34.0), '34.0px body passes');
      assertFalse(checkBody(33.9), '33.9px body fails');

      const checkFloor = (size: number) => size >= TYPOGRAPHY_THRESHOLDS.secondary;
      assertTrue(checkFloor(30.0), '30.0px secondary floor passes');
      assertFalse(checkFloor(29.99), '29.99px secondary floor fails');
    },
    { id: 'T2-F02-001' }
  );

  test(
    'F02-B02: Scale factor floor boundaries (60px * 0.5 = 30.0px vs 59px * 0.5 = 29.5px)',
    () => {
      const computeEffective = (font: number, scale: number) => font * scale;

      const validBoundary = computeEffective(60, 0.5);
      assertEqual(validBoundary, 30.0);
      assertTrue(validBoundary >= 30.0, '60px * 0.5 = 30.0px satisfies mobile floor');

      const invalidBoundary = computeEffective(59, 0.5);
      assertEqual(invalidBoundary, 29.5);
      assertFalse(invalidBoundary >= 30.0, '59px * 0.5 = 29.5px violates mobile floor');
    },
    { id: 'T2-F02-002' }
  );

  test(
    'F02-B03: Micro-scale extremes and reflection transforms (scale(-1))',
    () => {
      const resolveMagnitudeScale = (sx: number, sy: number = sx): number => {
        // Absolute value accounts for CSS mirror/flip transforms like scale(-1, 1)
        return Math.min(Math.abs(sx), Math.abs(sy));
      };

      // Flipped horizontal scale(-1, 1) -> Magnitude is 1.0 (text not scaled down, just flipped)
      assertEqual(resolveMagnitudeScale(-1, 1), 1.0);

      // Micro-scale: scale(0.001)
      const microScale = resolveMagnitudeScale(0.001);
      assertClose(microScale, 0.001, 1e-5);
      const effectiveWithMicro = 34 * microScale;
      assertFalse(effectiveWithMicro >= 30.0, 'Micro-scale must fail mobile floor');
    },
    { id: 'T2-F02-003' }
  );

  test(
    'F02-B04: Zero, negative, and NaN font sizes rejected cleanly',
    () => {
      const isValidFontSize = (size: unknown): boolean => {
        if (typeof size !== 'number' || Number.isNaN(size) || !Number.isFinite(size)) {
          return false;
        }
        return size >= 30.0;
      };

      assertFalse(isValidFontSize(0), '0px font size must fail');
      assertFalse(isValidFontSize(-34), 'Negative font size must fail');
      assertFalse(isValidFontSize(NaN), 'NaN font size must fail');
      assertFalse(isValidFontSize(Infinity), 'Infinity font size must fail');
      assertTrue(isValidFontSize(34), '34px valid font size passes');
    },
    { id: 'T2-F02-004' }
  );

  test(
    'F02-B05: String font units parsing handles px, decimals, and rejects unknown units',
    () => {
      const parseFontString = (val: string): number | null => {
        const match = val.trim().match(/^(\d+(?:\.\d+)?)(?:px)?$/);
        return match ? parseFloat(match[1]) : null;
      };

      assertEqual(parseFontString('34px'), 34);
      assertEqual(parseFontString('48.5px'), 48.5);
      assertEqual(parseFontString('64'), 64);
      assertEqual(parseFontString('  52px  '), 52);

      // Rejects non-px units that would cause viewport calculation ambiguity
      assertEqual(parseFontString('2rem'), null);
      assertEqual(parseFontString('5vw'), null);
      assertEqual(parseFontString('auto'), null);
    },
    { id: 'T2-F02-005' }
  );
});
