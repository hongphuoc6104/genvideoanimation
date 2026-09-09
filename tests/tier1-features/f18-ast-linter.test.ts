/**
 * Tier 1 (Feature Coverage): F-AST-LINTER
 * Recursive AST Motion Linter Anti-Pattern Detection
 */

import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertFalse,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';
import {
  SYNTHETIC_CODE_CORRECT_RIG,
  SYNTHETIC_CODE_MONOLITHIC_RIG,
  SYNTHETIC_CODE_BINARY_MORPH,
  SYNTHETIC_CODE_OPACITY_CROSSFADE,
  SYNTHETIC_CODE_SLOW_ZOOM,
} from '../harness/mock-helpers';

export const testSuite: TestSuite = {
  name: 'Recursive AST Motion Linter Anti-Pattern Detection',
  feature: 'F-AST-LINTER',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F18-01',
      name: 'Detection of Monolithic Character SVG: flags inline SVG lacking joint hierarchy as CRITICAL',
      feature: 'F-AST-LINTER',
      tier: 1,
      fn: async (ctx) => {
        const linterPath = path.resolve(__dirname, '../../validators/motion-lint.ts');
        const { module: linter, isAvailable } = await resolveModule(linterPath, ['lintSourceCode']);

        if (!isAvailable || typeof linter?.lintSourceCode !== 'function') {
          ctx.notImplemented('validators/motion-lint not yet available (Planned for M4)');
        }

        const violations = linter.lintSourceCode(SYNTHETIC_CODE_MONOLITHIC_RIG, 'Monolithic.tsx');
        assertTrue(Array.isArray(violations), 'Linter must return array of violations');
        const v = violations.find((item: any) => item.rule === 'no-monolithic-character' || item.ruleId === 'no-monolithic-character');
        assertTrue(v !== undefined, 'Must flag no-monolithic-character violation');
        assertEqual(v.severity, 'CRITICAL', 'Monolithic character severity must be CRITICAL');
      },
    },
    {
      id: 'TEST-T1-F18-02',
      name: 'Detection of Binary Conditional Morph Swap: flags ternary swap during morph as CRITICAL',
      feature: 'F-AST-LINTER',
      tier: 1,
      fn: async (ctx) => {
        const linterPath = path.resolve(__dirname, '../../validators/motion-lint.ts');
        const { module: linter, isAvailable } = await resolveModule(linterPath, ['lintSourceCode']);

        if (!isAvailable || typeof linter?.lintSourceCode !== 'function') {
          ctx.notImplemented('validators/motion-lint not yet available (Planned for M4)');
        }

        const violations = linter.lintSourceCode(SYNTHETIC_CODE_BINARY_MORPH, 'BinaryMorph.tsx');
        assertTrue(Array.isArray(violations), 'Linter must return array of violations');
        const v = violations.find((item: any) => item.rule === 'no-conditional-morph-swap' || item.ruleId === 'no-conditional-morph-swap');
        assertTrue(v !== undefined, 'Must flag no-conditional-morph-swap violation');
        assertEqual(v.severity, 'CRITICAL', 'Conditional morph swap severity must be CRITICAL');
      },
    },
    {
      id: 'TEST-T1-F18-03',
      name: 'Detection of Fake Crossfade Pose Blend: flags sibling opacity fades as CRITICAL',
      feature: 'F-AST-LINTER',
      tier: 1,
      fn: async (ctx) => {
        const linterPath = path.resolve(__dirname, '../../validators/motion-lint.ts');
        const { module: linter, isAvailable } = await resolveModule(linterPath, ['lintSourceCode']);

        if (!isAvailable || typeof linter?.lintSourceCode !== 'function') {
          ctx.notImplemented('validators/motion-lint not yet available (Planned for M4)');
        }

        const violations = linter.lintSourceCode(SYNTHETIC_CODE_OPACITY_CROSSFADE, 'Crossfade.tsx');
        assertTrue(Array.isArray(violations), 'Linter must return array of violations');
        const v = violations.find((item: any) => item.rule === 'no-crossfade-pose-blend' || item.ruleId === 'no-crossfade-pose-blend');
        assertTrue(v !== undefined, 'Must flag no-crossfade-pose-blend violation');
        assertEqual(v.severity, 'CRITICAL', 'Crossfade pose blend severity must be CRITICAL');
      },
    },
    {
      id: 'TEST-T1-F18-04',
      name: 'Detection of Unmotivated Linear Drift: flags slow monotonic zoom or unmotivated transform',
      feature: 'F-AST-LINTER',
      tier: 1,
      fn: async (ctx) => {
        const linterPath = path.resolve(__dirname, '../../validators/motion-lint.ts');
        const { module: linter, isAvailable } = await resolveModule(linterPath, ['lintSourceCode']);

        if (!isAvailable || typeof linter?.lintSourceCode !== 'function') {
          ctx.notImplemented('validators/motion-lint not yet available (Planned for M4)');
        }

        const violations = linter.lintSourceCode(SYNTHETIC_CODE_SLOW_ZOOM, 'SlowZoom.tsx');
        assertTrue(Array.isArray(violations), 'Linter must return array of violations');
        const v = violations.find(
          (item: any) =>
            item.rule === 'no-constant-slow-zoom' ||
            item.ruleId === 'no-constant-slow-zoom' ||
            item.rule === 'no-unmotivated-linear-translate' ||
            item.ruleId === 'no-unmotivated-linear-translate'
        );
        assertTrue(v !== undefined, 'Must flag unmotivated camera/linear motion anti-pattern');
      },
    },
    {
      id: 'TEST-T1-F18-05',
      name: 'Clean V2 Production Code Pass: well-structured articulated rig returns 0 violations',
      feature: 'F-AST-LINTER',
      tier: 1,
      fn: async (ctx) => {
        const linterPath = path.resolve(__dirname, '../../validators/motion-lint.ts');
        const { module: linter, isAvailable } = await resolveModule(linterPath, ['lintSourceCode']);

        if (!isAvailable || typeof linter?.lintSourceCode !== 'function') {
          ctx.notImplemented('validators/motion-lint not yet available (Planned for M4)');
        }

        const violations = linter.lintSourceCode(SYNTHETIC_CODE_CORRECT_RIG, 'ArticulatedCharacter.tsx');
        assertEqual(violations.length, 0, 'Clean articulated rig must have 0 violations');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
