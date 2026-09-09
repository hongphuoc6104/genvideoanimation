/**
 * Tier 1 (Feature Coverage): F-PKG-CANONICAL
 * Canonical Package Structure & Exports
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'Canonical Package Structure & Exports',
  feature: 'F-PKG-CANONICAL',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F01-01',
      name: 'Physical Directory Invariant: motion-kit must be a physical directory and not a symlink',
      feature: 'F-PKG-CANONICAL',
      tier: 1,
      fn: async (ctx) => {
        const pkgPath = path.resolve(__dirname, '../../motion-kit');
        assertTrue(fs.existsSync(pkgPath), 'motion-kit directory must exist at workspace root');
        const stat = fs.lstatSync(pkgPath);
        assertEqual(stat.isDirectory(), true, 'motion-kit must be a physical directory');
        assertEqual(stat.isSymbolicLink(), false, 'motion-kit must not be a symbolic link');
      },
    },
    {
      id: 'TEST-T1-F01-02',
      name: 'Package Manifest Validation: package.json must declare canonical name, version, and peerDeps',
      feature: 'F-PKG-CANONICAL',
      tier: 1,
      fn: async (ctx) => {
        const manifestPath = path.resolve(__dirname, '../../motion-kit/package.json');
        if (!fs.existsSync(manifestPath)) {
          ctx.notImplemented('motion-kit/package.json not yet created');
        }
        const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        assertEqual(pkg.name, 'motion-kit', 'Manifest name must be motion-kit');
        assertTrue(pkg.version === '2.0.0' || /^\d+\.\d+\.\d+/.test(pkg.version), 'Manifest version must be valid semver');
        assertTrue(pkg.main !== undefined, 'package.json must declare main entrypoint');
        assertTrue(pkg.types !== undefined || pkg.typings !== undefined, 'package.json must declare types entrypoint');
        assertTrue(
          pkg.peerDependencies &&
            (pkg.peerDependencies.react !== undefined || pkg.dependencies?.react !== undefined) &&
            (pkg.peerDependencies.remotion !== undefined || pkg.dependencies?.remotion !== undefined),
          'Manifest must declare react and remotion peerDependencies'
        );
      },
    },
    {
      id: 'TEST-T1-F01-03',
      name: 'TypeScript Configuration Strictness: tsconfig.json must enable strict mode and declaration generation',
      feature: 'F-PKG-CANONICAL',
      tier: 1,
      fn: async (ctx) => {
        const tsconfigPath = path.resolve(__dirname, '../../motion-kit/tsconfig.json');
        if (!fs.existsSync(tsconfigPath)) {
          ctx.notImplemented('motion-kit/tsconfig.json not yet created');
        }
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const compilerOpts = tsconfig.compilerOptions || {};
        assertEqual(compilerOpts.strict, true, 'compilerOptions.strict must be true');
        assertEqual(compilerOpts.declaration, true, 'compilerOptions.declaration must be true');
      },
    },
    {
      id: 'TEST-T1-F01-04',
      name: 'Barrel Export Completeness: public index.ts exports all 12 required architectural symbols',
      feature: 'F-PKG-CANONICAL',
      tier: 1,
      fn: async (ctx) => {
        const indexPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        if (!fs.existsSync(indexPath)) {
          ctx.notImplemented('motion-kit/src/index.ts not yet created');
        }
        const requiredSymbols = [
          'RigInterface',
          'CharacterController',
          'BirdRig',
          'HumanRig',
          'ArbitraryCustomRigAdapter',
          'PERFORMANCE_PROFILES',
          'CameraRig',
          'interpolateSvgPath',
          'samplePathArcLength',
          'quadraticBezierPoint',
          'cubicBezierPoint',
          'createCueManifest',
        ];
        const res = await resolveModule(indexPath, requiredSymbols);
        if (!res.isAvailable) {
          ctx.notImplemented(`Missing exports: ${res.missingExports.join(', ')} (Planned for M1-M3)`);
        }
        for (const sym of requiredSymbols) {
          assertTrue(sym in res.module, `Symbol ${sym} must be exported by motion-kit`);
        }
      },
    },
    {
      id: 'TEST-T1-F01-05',
      name: 'Clean Compilation Check: TypeScript compiler passes without errors on motion-kit',
      feature: 'F-PKG-CANONICAL',
      tier: 1,
      fn: async (ctx) => {
        const tsconfigPath = path.resolve(__dirname, '../../motion-kit/tsconfig.json');
        if (!fs.existsSync(tsconfigPath)) {
          ctx.notImplemented('motion-kit/tsconfig.json not yet created');
        }
        try {
          execSync(`npx tsc --project "${tsconfigPath}" --noEmit`, {
            cwd: path.resolve(__dirname, '../../'),
            stdio: 'pipe',
          });
          assertTrue(true, 'Compilation completed cleanly');
        } catch (err: any) {
          throw new CustomAssertionError(`TypeScript compilation failed: ${err.stderr?.toString() || err.stdout?.toString() || err.message}`);
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
