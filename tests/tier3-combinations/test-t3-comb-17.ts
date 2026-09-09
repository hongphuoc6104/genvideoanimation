/**
 * T3-COMB-17: Standalone Package Exports & Zero .agents Import Gate
 * Features: F-PKG-CANONICAL + F-PKG-ISOLATION
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T3-COMB-17',
  name: 'Standalone Package Exports & Zero .agents Import Gate',
  feature: 'F-PKG-CANONICAL+F-PKG-ISOLATION',
  tier: 3,
  description:
    'Verifies canonical motion-kit packaging with standalone package manifest and enforces zero runtime imports from .agents/ across compositions.',
  fn: async (ctx) => {
    ctx.log('Checking motion-kit package manifest and scanning for illegal .agents imports...');

    const rootDir = path.resolve(__dirname, '../..');
    const pkgJsonPath = path.join(rootDir, 'motion-kit', 'package.json');

    // 1. Invariant: motion-kit has dedicated package.json
    assertTrue(fs.existsSync(pkgJsonPath), 'motion-kit/package.json must exist');
    const pkgContent = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    assertEqual(pkgContent.name, 'motion-kit', 'Package name must be motion-kit');

    // 2. Invariant: Zero imports from .agents in connection-film/src
    const compSrcDir = path.join(rootDir, 'connection-film', 'src');
    let illegalImportsCount = 0;
    const illegalFiles: string[] = [];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
          const code = fs.readFileSync(full, 'utf-8');
          if (/from\s+['"][^'"]*\.agents/g.test(code) || /import\s+['"][^'"]*\.agents/g.test(code)) {
            illegalImportsCount++;
            illegalFiles.push(entry.name);
          }
        }
      }
    }

    scanDir(compSrcDir);

    assertEqual(
      illegalImportsCount,
      0,
      `Detected ${illegalImportsCount} illegal imports from .agents in: ${illegalFiles.join(', ')}`
    );
  },
};

export const suite: TestSuite = {
  name: 'T3-COMB-17 Suite',
  feature: 'F-PKG-CANONICAL+F-PKG-ISOLATION',
  tier: 3,
  tests: [testCase],
};

registerSuite(suite);
