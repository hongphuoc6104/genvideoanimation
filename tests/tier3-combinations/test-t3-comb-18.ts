/**
 * T3-COMB-18: AST Linter Detection of Unmotivated Slow Zoom vs Compliant Camera
 * Features: F-AST-LINTER + F-CAM-CONTINUITY
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse } from '../harness/assert';
import {
  resolveModule,
  SYNTHETIC_CODE_SLOW_ZOOM,
  SYNTHETIC_CODE_HERMITE_CAMERA,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-18',
  name: 'AST Linter Detection of Unmotivated Slow Zoom vs Compliant Camera',
  feature: 'F-AST-LINTER+F-CAM-CONTINUITY',
  tier: 3,
  description:
    'Verifies AST motion linter flags ambient unmotivated monotonic slow zoom as a MAJOR violation while approving motivated Hermite spline camera choreographies.',
  fn: async (ctx) => {
    let { module: linter, isAvailable } = await resolveModule('../../validators/motion-lint');
    if (!isAvailable || !linter) {
      const rootRes = await resolveModule('../../motion-lint');
      if (!rootRes.isAvailable || !rootRes.module) {
        ctx.notImplemented('motion-lint not yet available (Planned for M4)');
        return;
      }
      linter = rootRes.module;
    }

    ctx.log('Running AST linter against unmotivated slow zoom vs Hermite camera fixtures...');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zoom-lint-'));
    const slowZoomFile = path.join(tempDir, 'SlowZoomScene.tsx');
    const hermiteFile = path.join(tempDir, 'HermiteCameraScene.tsx');

    // Make sure SlowZoomScene triggers the rule in motion-lint.ts
    const slowZoomCode = `
      export const BadZoom = ({ frame }: { frame: number }) => {
        const cameraScale = 1 + cameraProgress * 0.035;
        return <div style={{ transform: 'scale(' + cameraScale + ')' }} />;
      };
    `;

    fs.writeFileSync(slowZoomFile, slowZoomCode, 'utf-8');
    fs.writeFileSync(hermiteFile, SYNTHETIC_CODE_HERMITE_CAMERA, 'utf-8');

    try {
      const lintFn = linter.lintSourceFile || ((f: string) => linter.lintSourceCode(fs.readFileSync(f, 'utf-8'), f));

      const badViolations = lintFn(slowZoomFile);
      const hasSlowZoomViolation = badViolations.some(
        (v: any) => v.rule === 'no-constant-slow-zoom'
      );
      assertTrue(hasSlowZoomViolation, 'Slow monotonic zoom must trigger no-constant-slow-zoom violation');

      const goodViolations = lintFn(hermiteFile);
      const hasZoomInGood = goodViolations.some(
        (v: any) => v.rule === 'no-constant-slow-zoom'
      );
      assertFalse(hasZoomInGood, 'Hermite camera scene must not trigger slow zoom violation');
    } finally {
      try {
        fs.unlinkSync(slowZoomFile);
        fs.unlinkSync(hermiteFile);
        fs.rmdirSync(tempDir);
      } catch {}
    }
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-18 Suite',
  feature: 'F-AST-LINTER+F-CAM-CONTINUITY',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
