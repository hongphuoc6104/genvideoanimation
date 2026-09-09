/**
 * T3-COMB-19: AST Linter Detection of Binary Pose Crossfades vs CharacterController Blending
 * Features: F-AST-LINTER + F-CHAR-CONTROLLER
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertFalse } from '../harness/assert';
import {
  resolveModule,
  SYNTHETIC_CODE_CONTROLLER_BLEND,
} from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-19',
  name: 'AST Linter Detection of Binary Pose Crossfades vs CharacterController Blending',
  feature: 'F-AST-LINTER+F-CHAR-CONTROLLER',
  tier: 3,
  description:
    'Verifies AST motion linter flags opacity crossfade between two rig instances as CRITICAL while approving single-rig joint blending via CharacterController.',
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

    ctx.log('Running AST linter against pose crossfade vs controller blend fixtures...');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossfade-lint-'));
    const badFile = path.join(tempDir, 'CrossfadePose.tsx');
    const goodFile = path.join(tempDir, 'ControllerBlendPose.tsx');

    const badCode = [
      '// Top comment line 1',
      '// Top comment line 2',
      'export const CrossfadeComponent = ({ progress }: { progress: number }) => {',
      '  return (',
      '    <div>',
      '      <g opacity={1 - progress}><Character pose="idle" /></g>',
      '      <g opacity={progress}><Character pose="happy" /></g>',
      '    </div>',
      '  );',
      '};',
      '// Bottom comment line 1',
      '// Bottom comment line 2',
      '// Bottom comment line 3',
      '// Bottom comment line 4',
      '// Bottom comment line 5',
    ].join('\n');

    fs.writeFileSync(badFile, badCode, 'utf-8');
    fs.writeFileSync(goodFile, SYNTHETIC_CODE_CONTROLLER_BLEND, 'utf-8');

    try {
      const lintFn = linter.lintSourceFile || ((f: string) => linter.lintSourceCode(fs.readFileSync(f, 'utf-8'), f));

      const badViolations = lintFn(badFile);
      const hasCrossfadeViolation = badViolations.some(
        (v: any) => v.rule === 'no-crossfade-pose-blend'
      );
      assertTrue(hasCrossfadeViolation, 'Opacity crossfade must trigger no-crossfade-pose-blend violation');

      const goodViolations = lintFn(goodFile);
      const hasCrossfadeGood = goodViolations.some(
        (v: any) => v.rule === 'no-crossfade-pose-blend'
      );
      assertFalse(hasCrossfadeGood, 'Controller blended pose must not trigger crossfade violation');
    } finally {
      try {
        fs.unlinkSync(badFile);
        fs.unlinkSync(goodFile);
        fs.rmdirSync(tempDir);
      } catch {}
    }
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-19 Suite',
  feature: 'F-AST-LINTER+F-CHAR-CONTROLLER',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
