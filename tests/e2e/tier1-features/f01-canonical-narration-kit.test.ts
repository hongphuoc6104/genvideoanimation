/**
 * tests/e2e/tier1-features/f01-canonical-narration-kit.test.ts
 * Tier 1: Feature Coverage Tests for F01 (Canonical narration-kit Workspace Package)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const PKG_DIR = path.join(REPO_ROOT, 'packages', 'narration-kit');

export const suite: TestSuite = {
  name: 'Tier 1: F01 Canonical narration-kit Package',
  feature: 'F01',
  tier: 1,
  tests: [
    {
      id: 'T1-F01-01',
      name: 'package.json exists with required metadata and manifest exports',
      feature: 'F01',
      tier: 1,
      fn: async (ctx) => {
        const pkgJsonPath = path.join(PKG_DIR, 'package.json');
        assertTrue(fs.existsSync(pkgJsonPath), 'packages/narration-kit/package.json must exist');

        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        assertSchema(pkg, {
          name: 'string',
          version: 'string',
          main: 'string',
          types: 'string',
        });
        assertTrue(pkg.name.includes('narration-kit'), `Package name must contain "narration-kit", got: ${pkg.name}`);
        assertEqual(pkg.version, '1.0.0');
      },
    },
    {
      id: 'T1-F01-02',
      name: 'tsconfig.json enforces strict TypeScript compilation',
      feature: 'F01',
      tier: 1,
      fn: async (ctx) => {
        const tsconfigPath = path.join(PKG_DIR, 'tsconfig.json');
        assertTrue(fs.existsSync(tsconfigPath), 'packages/narration-kit/tsconfig.json must exist');

        const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
        // Parse JSON allowing potential comments
        const cleanJson = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const tsconfig = JSON.parse(cleanJson);
        
        assertTrue(tsconfig.compilerOptions, 'tsconfig must contain compilerOptions');
        assertTrue(tsconfig.compilerOptions.strict === true, 'compilerOptions.strict must be true');
        assertTrue(Boolean(tsconfig.compilerOptions.declaration), 'compilerOptions.declaration must be enabled');
      },
    },
    {
      id: 'T1-F01-03',
      name: 'src/index.ts exports public TTS API entry points',
      feature: 'F01',
      tier: 1,
      fn: async (ctx) => {
        const indexPath = path.join(PKG_DIR, 'src', 'index.ts');
        assertTrue(fs.existsSync(indexPath), 'packages/narration-kit/src/index.ts must exist');

        const content = fs.readFileSync(indexPath, 'utf-8');
        assertTrue(content.includes('export * from'), 'src/index.ts must export submodules');

        const mod = await import(path.join(PKG_DIR, 'src', 'index.ts'));
        assertTrue(typeof mod.KokoroTtsEngine === 'function', 'KokoroTtsEngine must be exported');
        assertTrue(Array.isArray(mod.SUPPORTED_VOICES), 'SUPPORTED_VOICES must be exported as an array');
        assertTrue(typeof mod.createWavFile === 'function', 'createWavFile must be exported');
      },
    },
    {
      id: 'T1-F01-04',
      name: 'package.json exports field defines canonical root and subpath mappings',
      feature: 'F01',
      tier: 1,
      fn: async (ctx) => {
        const pkgJsonPath = path.join(PKG_DIR, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

        assertTrue(pkg.exports, 'package.json must contain "exports" mapping');
        assertTrue(pkg.exports['.'], 'package.json exports must define root "." entry');
        assertTrue(pkg.exports['./tts'] || pkg.exports['./*'], 'package.json exports must support subpath exports');
      },
    },
    {
      id: 'T1-F01-05',
      name: 'Source code satisfies zero runtime import violation from .agents/skills',
      feature: 'F01',
      tier: 1,
      fn: async (ctx) => {
        const srcDir = path.join(PKG_DIR, 'src');
        assertTrue(fs.existsSync(srcDir), 'packages/narration-kit/src must exist');

        const checkFilesRecursively = (dir: string): string[] => {
          let violations: string[] = [];
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              violations = violations.concat(checkFilesRecursively(fullPath));
            } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
              const fileText = fs.readFileSync(fullPath, 'utf-8');
              if (fileText.includes('.agents/skills') || fileText.includes('.agents\\skills')) {
                violations.push(fullPath);
              }
            }
          }
          return violations;
        };

        const violations = checkFilesRecursively(srcDir);
        assertEqual(violations.length, 0, `Forbidden .agents/skills import found in: ${violations.join(', ')}`);
      },
    },
  ],
};

registerSuite(suite);
