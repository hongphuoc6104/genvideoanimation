/**
 * Tier 1 (Feature Coverage): F-PKG-ISOLATION
 * Import Isolation (Zero .agents/skills Imports)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  CustomAssertionError,
} from '../harness/assert';

function findFilesRecursive(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...findFilesRecursive(fullPath, extensions));
      }
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export const testSuite: TestSuite = {
  name: 'Import Isolation (Zero .agents/skills Imports)',
  feature: 'F-PKG-ISOLATION',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F02-01',
      name: 'V2 Benchmark Compositions Import Isolation: 0 references to .agents or .agents/skills in benchmarks',
      feature: 'F-PKG-ISOLATION',
      tier: 1,
      fn: async (ctx) => {
        const v2Dir = path.resolve(__dirname, '../../connection-film/src/benchmarks/v2');
        if (!fs.existsSync(v2Dir)) {
          ctx.notImplemented('connection-film/src/benchmarks/v2 not yet created (Planned for M5)');
        }
        const files = findFilesRecursive(v2Dir, ['.ts', '.tsx']);
        if (files.length === 0) {
          ctx.notImplemented('No V2 benchmark files authored yet (Planned for M5)');
        }
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          const forbidden = /\.agents\/|\.agents\/skills/.test(content);
          assertFalse(forbidden, `Forbidden import to .agents detected in ${path.relative(process.cwd(), file)}`);
        }
      },
    },
    {
      id: 'TEST-T1-F02-02',
      name: 'Motion-Kit Internal Source Isolation: package sources contain zero relative traversal to .agents',
      feature: 'F-PKG-ISOLATION',
      tier: 1,
      fn: async (ctx) => {
        const motionKitDir = path.resolve(__dirname, '../../motion-kit');
        assertTrue(fs.existsSync(motionKitDir), 'motion-kit directory must exist');
        const files = findFilesRecursive(motionKitDir, ['.ts', '.tsx']);
        assertTrue(files.length > 0, 'motion-kit must contain TypeScript files');
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          const forbidden = /\.\.\/\.\.\/\.agents|\.agents\/skills/.test(content);
          assertFalse(forbidden, `Forbidden import to .agents in motion-kit file: ${path.relative(process.cwd(), file)}`);
        }
      },
    },
    {
      id: 'TEST-T1-F02-03',
      name: 'Quality Tooling Script Isolation: validators scripts have zero references to .agents/skills',
      feature: 'F-PKG-ISOLATION',
      tier: 1,
      fn: async (ctx) => {
        const validatorPaths = [
          path.resolve(__dirname, '../../validators/motion-lint.ts'),
          path.resolve(__dirname, '../../validators/temporal-render-qa.ts'),
          path.resolve(__dirname, '../../validators/validate-shot-spec.ts'),
        ];
        const existing = validatorPaths.filter((p) => fs.existsSync(p));
        if (existing.length === 0) {
          ctx.notImplemented('Quality tooling validators not yet created (Planned for M4)');
        }
        for (const file of existing) {
          const content = fs.readFileSync(file, 'utf8');
          const forbidden = /\.agents\/skills/.test(content);
          assertFalse(forbidden, `Forbidden reference to .agents/skills in validator: ${path.basename(file)}`);
        }
      },
    },
    {
      id: 'TEST-T1-F02-04',
      name: 'Node Package Resolution Invariant: motion-kit resolves inside workspace root and not in .agents',
      feature: 'F-PKG-ISOLATION',
      tier: 1,
      fn: async (ctx) => {
        const resolvedPath = path.resolve(__dirname, '../../motion-kit');
        assertTrue(fs.existsSync(resolvedPath), 'motion-kit path must exist');
        assertFalse(
          resolvedPath.includes('.agents/skills'),
          `Resolved motion-kit must not reside in .agents/skills (resolved: ${resolvedPath})`
        );
      },
    },
    {
      id: 'TEST-T1-F02-05',
      name: 'Package Self-Contained Dependency Graph: only permitted external dependencies imported',
      feature: 'F-PKG-ISOLATION',
      tier: 1,
      fn: async (ctx) => {
        const motionKitDir = path.resolve(__dirname, '../../motion-kit');
        const files = findFilesRecursive(motionKitDir, ['.ts', '.tsx']);
        const allowedPackages = new Set([
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'remotion',
          'motion-kit',
          'node:fs',
          'node:path',
          'node:child_process',
          'node:assert',
          'node:perf_hooks',
          'node:process',
          'fs',
          'path',
          'child_process',
          'assert',
        ]);

        const importRegex = /(?:import|export)\s+(?:.*?from\s+)?['"]([^'"]+)['"]/g;
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const specifier = match[1];
            if (specifier.startsWith('.')) continue; // relative import within package
            assertTrue(
              allowedPackages.has(specifier) || specifier.startsWith('node:'),
              `Unapproved external dependency in ${path.relative(process.cwd(), file)}: "${specifier}"`
            );
          }
        }
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
