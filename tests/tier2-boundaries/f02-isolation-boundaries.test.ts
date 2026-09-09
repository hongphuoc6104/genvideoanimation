import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';

function scanForForbiddenImports(code: string): string[] {
  const lines = code.split('\n');
  const violations: string[] = [];
  const forbiddenPattern = /(\.agents\/|\.agents$)/;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }
    if ((trimmed.includes('import') || trimmed.includes('require')) && forbiddenPattern.test(trimmed)) {
      violations.push(`Line ${i + 1}: ${trimmed}`);
    }
  }
  return violations;
}

function scanDynamicImports(code: string): string[] {
  const violations: string[] = [];
  const dynamicRegex = /import\s*\(\s*['"][^'"]*(\.agents)[^'"]*['"]\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = dynamicRegex.exec(code)) !== null) {
    violations.push(match[0]);
  }
  return violations;
}

function scanAstImports(code: string): string[] {
  // Comment-aware import scanner
  const strippedCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  return scanForForbiddenImports(strippedCode);
}

function scanAssetImports(code: string): string[] {
  const assetRegex = /(?:import|require)\s*(?:\(\s*)?['"]([^'"]*\.(?:svg|png|jpg|mp4|json|css))['"]\s*\)?/g;
  const violations: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = assetRegex.exec(code)) !== null) {
    if (match[1].includes('.agents')) {
      violations.push(match[1]);
    }
  }
  return violations;
}

export const testSuite: TestSuite = {
  name: 'F02: Import Isolation Boundaries',
  feature: 'F-PKG-ISOLATION',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F02-01',
      name: 'Relative Traversal Path to .agents',
      feature: 'F-PKG-ISOLATION',
      tier: 2,
      description: 'Import scanner flags forbidden relative traversal path to .agents',
      fn: () => {
        const sampleCode = `
          import React from 'react';
          import { CharacterController } from 'motion-kit';
          import { legacyHelper } from '../../../../.agents/skills/educational-flat-motion/kit';
          export const Scene = () => null;
        `;
        const violations = scanForForbiddenImports(sampleCode);
        assertTrue(violations.length > 0, 'Must flag relative import pointing to .agents');
        assertTrue(
          violations[0].includes('.agents/skills/educational-flat-motion/kit'),
          'Violation details must cite the offending path'
        );
      },
    },
    {
      id: 'TEST-T2-F02-02',
      name: 'Dynamic import() Traversal Detection',
      feature: 'F-PKG-ISOLATION',
      tier: 2,
      description: 'AST/regex scanner catches dynamic import traversal into .agents',
      fn: () => {
        const sampleCode = `
          export async function loadLateModule() {
            const mod = await import('../../../.agents/skills/something');
            return mod;
          }
        `;
        const violations = scanDynamicImports(sampleCode);
        assertEqual(violations.length, 1, 'Must detect exactly 1 dynamic import violation');
        assertTrue(violations[0].includes('.agents/skills/something'), 'Must contain target import string');
      },
    },
    {
      id: 'TEST-T2-F02-03',
      name: 'Commented-Out vs Active Import Discrimination',
      feature: 'F-PKG-ISOLATION',
      tier: 2,
      description: 'Inactive commented-out imports to .agents do not trigger false positive violations',
      fn: () => {
        const sampleCode = `
          // import { obsoleteRig } from '.agents/skills/educational-flat-motion/kit';
          /*
           * import { oldCamera } from '../../.agents/skills/camera';
           */
          import { CameraRig } from 'motion-kit';
          export const ActiveComponent = () => null;
        `;
        const violations = scanAstImports(sampleCode);
        assertEqual(violations.length, 0, 'Commented-out imports must not produce any violations');
      },
    },
    {
      id: 'TEST-T2-F02-04',
      name: 'Non-TS Asset Import Traversal',
      feature: 'F-PKG-ISOLATION',
      tier: 2,
      description: 'Detects and flags asset references (SVG, images) traversing into .agents',
      fn: () => {
        const sampleCode = `
          const icon = require('../../.agents/skills/icon.svg');
          const cleanAsset = require('../assets/clean.svg');
        `;
        const violations = scanAssetImports(sampleCode);
        assertTrue(violations.length >= 1, 'Must detect non-TS asset import pointing into .agents');
        assertTrue(violations.includes('../../.agents/skills/icon.svg'));
        assertFalse(violations.includes('../assets/clean.svg'));
      },
    },
    {
      id: 'TEST-T2-F02-05',
      name: 'Empty Source File Graceful Handling',
      feature: 'F-PKG-ISOLATION',
      tier: 2,
      description: 'Zero-byte empty source files do not cause scanner crashes or false positive violations',
      fn: () => {
        const violations = scanAstImports('');
        assertEqual(violations.length, 0, 'Empty file must yield 0 violations');

        const whitespaceViolations = scanAstImports('   \n\n\t  \n');
        assertEqual(whitespaceViolations.length, 0, 'Whitespace file must yield 0 violations');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
