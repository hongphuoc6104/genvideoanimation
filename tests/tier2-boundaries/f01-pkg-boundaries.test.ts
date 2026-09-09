import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as child_process from 'node:child_process';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';

function verifyPackageLayout(targetPath: string): void {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Package path does not exist: ${targetPath}`);
  }
  const stat = fs.lstatSync(targetPath);
  if (stat.isSymbolicLink()) {
    throw new Error('motion-kit must not be a symbolic link');
  }
  if (!stat.isDirectory()) {
    throw new Error('motion-kit must be a physical directory');
  }
}

function loadPackageManifest(manifestPath: string): any {
  const content = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(content);
}

function validatePackageDependencies(manifest: any): string[] {
  const missing: string[] = [];
  const peers = manifest.peerDependencies || {};
  if (!peers.react) missing.push('react');
  if (!peers.remotion) missing.push('remotion');
  return missing;
}

function assertExportsComplete(exportsObj: Record<string, unknown>, minCount = 10): void {
  const count = Object.keys(exportsObj).length;
  if (count < minCount) {
    throw new Error(`Insufficient exports: expected at least ${minCount}, got ${count}`);
  }
}

export const testSuite: TestSuite = {
  name: 'F01: Canonical Package Structure & Exports Boundaries',
  feature: 'F-PKG-CANONICAL',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F01-01',
      name: 'Symlink Directory Rejection',
      feature: 'F-PKG-CANONICAL',
      tier: 2,
      description: 'Packaging validator asserts failure when target directory is a symbolic link',
      fn: () => {
        const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-symlink-test-'));
        const realTarget = path.join(tmpBase, 'real-kit');
        const symlinkTarget = path.join(tmpBase, 'symlink-kit');
        try {
          fs.mkdirSync(realTarget);
          fs.symlinkSync(realTarget, symlinkTarget, 'dir');
          assertThrows(() => verifyPackageLayout(symlinkTarget), /symbolic link/i);

          const motionKitPath = path.resolve(__dirname, '../../motion-kit');
          if (fs.existsSync(motionKitPath)) {
            const stat = fs.lstatSync(motionKitPath);
            assertFalse(stat.isSymbolicLink(), 'motion-kit in repo must not be a symlink');
            assertTrue(stat.isDirectory(), 'motion-kit in repo must be a directory');
          }
        } finally {
          try {
            if (fs.existsSync(symlinkTarget)) fs.unlinkSync(symlinkTarget);
            if (fs.existsSync(realTarget)) fs.rmdirSync(realTarget);
            if (fs.existsSync(tmpBase)) fs.rmdirSync(tmpBase);
          } catch {}
        }
      },
    },
    {
      id: 'TEST-T2-F01-02',
      name: 'Corrupted Malformed package.json',
      feature: 'F-PKG-CANONICAL',
      tier: 2,
      description: 'Manifest parser catches syntax exception when encountering malformed JSON',
      fn: () => {
        const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-json-test-'));
        const badJsonFile = path.join(tmpBase, 'package.json');
        try {
          fs.writeFileSync(badJsonFile, '{\n  "name": "motion-kit",\n  "version": 2.0,\n  trailing_comma_syntax_error: true,\n}');
          assertThrows(() => loadPackageManifest(badJsonFile), /SyntaxError|JSON/);
        } finally {
          try {
            if (fs.existsSync(badJsonFile)) fs.unlinkSync(badJsonFile);
            if (fs.existsSync(tmpBase)) fs.rmdirSync(tmpBase);
          } catch {}
        }
      },
    },
    {
      id: 'TEST-T2-F01-03',
      name: 'Missing Required Peer Dependencies',
      feature: 'F-PKG-CANONICAL',
      tier: 2,
      description: 'Manifest schema validator detects missing react and remotion peerDependencies',
      fn: () => {
        const incompleteManifest = {
          name: 'motion-kit',
          version: '2.0.0',
          peerDependencies: {},
        };
        const errors = validatePackageDependencies(incompleteManifest);
        assertTrue(errors.includes('remotion'), 'Must flag missing remotion peerDependency');
        assertTrue(errors.includes('react'), 'Must flag missing react peerDependency');

        const validManifest = {
          name: 'motion-kit',
          version: '2.0.0',
          peerDependencies: {
            react: '>=18.0.0',
            remotion: '>=4.0.0',
          },
        };
        const validErrors = validatePackageDependencies(validManifest);
        assertEqual(validErrors.length, 0, 'Valid peerDependencies must yield 0 errors');
      },
    },
    {
      id: 'TEST-T2-F01-04',
      name: 'Empty Barrel File Defense',
      feature: 'F-PKG-CANONICAL',
      tier: 2,
      description: 'Barrel export verification rejects empty or incomplete export dictionary',
      fn: () => {
        assertThrows(() => assertExportsComplete({}), /Insufficient exports/);
        assertThrows(() => assertExportsComplete({ RigInterface: true, CameraRig: true }), /Insufficient exports/);
      },
    },
    {
      id: 'TEST-T2-F01-05',
      name: 'Strict TypeScript Compiler Failure on Bad Types',
      feature: 'F-PKG-CANONICAL',
      tier: 2,
      description: 'TypeScript compiler fails with non-zero exit code when encountering intentional type errors',
      fn: () => {
        const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'tsc-test-'));
        const badTsFile = path.join(tmpBase, 'bad.ts');
        const tsConfigFile = path.join(tmpBase, 'tsconfig.json');
        try {
          fs.writeFileSync(badTsFile, 'const x: number = "this is definitely a type error";\n');
          fs.writeFileSync(
            tsConfigFile,
            JSON.stringify({
              compilerOptions: {
                strict: true,
                noEmit: true,
                target: 'ES2022',
                module: 'NodeNext',
              },
              files: [badTsFile],
            })
          );

          assertThrows(() => {
            child_process.execSync(`npx tsc --project "${tsConfigFile}"`, {
              stdio: 'pipe',
            });
          });
        } finally {
          try {
            if (fs.existsSync(badTsFile)) fs.unlinkSync(badTsFile);
            if (fs.existsSync(tsConfigFile)) fs.unlinkSync(tsConfigFile);
            if (fs.existsSync(tmpBase)) fs.rmdirSync(tmpBase);
          } catch {}
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
