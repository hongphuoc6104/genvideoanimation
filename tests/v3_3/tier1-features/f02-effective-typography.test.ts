/**
 * Tier 1 Feature Suite: F02 — Effective Typography Scaling Validator (R2)
 *
 * Verifies effective rendered font size after ancestor SVG/CSS transform scaling,
 * role minimum thresholds, and mobile floor (30px).
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertDeepEqual,
  assertInRange,
} from '../harness/assert';
import { TYPOGRAPHY_THRESHOLDS } from '../../../validators/validate-mobile-typography';

describe({ name: 'F02: Effective Typography Scaling Contract', feature: 'F02', tier: 1 }, () => {
  test(
    'F02-01: Semantic typography role minimums comply with R1/R2 standards',
    () => {
      assertEqual(TYPOGRAPHY_THRESHOLDS.hero, 64, 'Hero minimum must be 64px');
      assertEqual(TYPOGRAPHY_THRESHOLDS.section, 48, 'Section title minimum must be 48px');
      assertEqual(TYPOGRAPHY_THRESHOLDS.card, 38, 'Card title minimum must be 38px');
      assertEqual(TYPOGRAPHY_THRESHOLDS.body, 34, 'Body minimum must be 34px');
      assertEqual(TYPOGRAPHY_THRESHOLDS.secondary, 30, 'Secondary text minimum must be 30px');
      assertEqual(TYPOGRAPHY_THRESHOLDS.caption, 52, 'Karaoke caption minimum must be 52px');
    },
    { id: 'T1-F02-001' }
  );

  test(
    'F02-02: Nested scale factor multiplication formula (Effective = Font * Prod(Scale))',
    () => {
      // Simulate EffectiveFontSize calculation: Font * ParentScales
      const calculateEffective = (fontSize: number, scales: number[]): number => {
        return fontSize * scales.reduce((acc, s) => acc * s, 1.0);
      };

      // Case 1: Body text 36px in scale 1.0 -> 36px (Pass)
      assertEqual(calculateEffective(36, [1.0]), 36);

      // Case 2: 40px in container with scale 0.5 -> 20px (Violation, < 30px floor)
      const scaledDown = calculateEffective(40, [0.5]);
      assertEqual(scaledDown, 20);
      assertTrue(scaledDown < TYPOGRAPHY_THRESHOLDS.secondary, '20px must violate secondary floor');

      // Case 3: Nested parent scales [0.8, 0.9] with 48px font -> 34.56px (Pass body, fail card)
      const nested = calculateEffective(48, [0.8, 0.9]);
      assertEqual(Math.round(nested * 100) / 100, 34.56);
      assertTrue(nested >= TYPOGRAPHY_THRESHOLDS.body, 'Effective 34.56px satisfies body minimum');
    },
    { id: 'T1-F02-002' }
  );

  test(
    'F02-03: Absolute mobile floor 30px rejects deceptive font compliance',
    () => {
      const isMobileFloorValid = (effectiveSize: number): boolean => {
        return effectiveSize >= 30.0;
      };

      // 34px in scale 0.85 = 28.9px -> Fail mobile floor
      const deceptiveSize = 34 * 0.85;
      assertFalse(isMobileFloorValid(deceptiveSize), '28.9px must fail absolute mobile floor of 30px');

      // 64px hero in scale 0.5 = 32px -> Passes 30px floor but fails 64px hero threshold
      const heroScaled = 64 * 0.5;
      assertTrue(isMobileFloorValid(heroScaled), '32px passes absolute floor');
      assertFalse(heroScaled >= TYPOGRAPHY_THRESHOLDS.hero, '32px fails hero threshold');
    },
    { id: 'T1-F02-003' }
  );

  test(
    'F02-04: Transform parser extracts numeric scale factors from CSS and SVG strings',
    () => {
      const parseScaleString = (transformStr: string): number[] => {
        const scales: number[] = [];
        const scaleRegex = /scale\(\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/g;
        let match;
        while ((match = scaleRegex.exec(transformStr)) !== null) {
          const sx = parseFloat(match[1]);
          const sy = match[2] ? parseFloat(match[2]) : sx;
          // Minimum of non-uniform scale determines worst-case text rendering
          scales.push(Math.min(sx, sy));
        }
        return scales;
      };

      const testStr1 = 'scale(0.75)';
      assertDeepEqual(parseScaleString(testStr1), [0.75]);

      const testStr2 = 'translate(100, 50) scale(0.5, 0.8)';
      assertDeepEqual(parseScaleString(testStr2), [0.5]);

      const testStr3 = 'scale(0.9) rotate(45deg) scale(0.8)';
      assertDeepEqual(parseScaleString(testStr3), [0.9, 0.8]);
    },
    { id: 'T1-F02-004' }
  );

  test(
    'F02-05: Never Shrink to Fit mandate forces progressive scene splitting over font reduction',
    () => {
      // Mandate: If content length exceeds max safe area capacity, split into sequential beats
      const estimateTextHeight = (charCount: number, fontSize: number, containerWidth: number = 920): number => {
        const charsPerLine = Math.floor(containerWidth / (fontSize * 0.55));
        const lines = Math.ceil(charCount / Math.max(1, charsPerLine));
        const lineHeight = fontSize * 1.35;
        return lines * lineHeight;
      };

      const maxSafeTextHeight = 400; // max allowable vertical space in 1080x1920 card
      const longContent = 'Nghịch lý từ chối bài báo khoa học: bài báo có phương pháp nghiên cứu chặt chẽ và số liệu thực nghiệm phong phú vẫn bị Desk Reject vì không chứng minh được khoảng trống nghiên cứu (Research Gap) thuyết phục.'.repeat(4);

      const heightAtStandard = estimateTextHeight(longContent.length, 34);
      assertTrue(heightAtStandard > maxSafeTextHeight, 'Long content exceeds single card safe height');

      // Rule: Do NOT reduce font to 20px to fit. Instead split into beats:
      const beatsRequired = Math.ceil(heightAtStandard / maxSafeTextHeight);
      assertTrue(beatsRequired >= 2, 'Content must be split into at least 2 progressive disclosure beats');
    },
    { id: 'T1-F02-005' }
  );
});
