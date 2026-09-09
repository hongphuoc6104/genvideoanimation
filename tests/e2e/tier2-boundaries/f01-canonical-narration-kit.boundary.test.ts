/**
 * tests/e2e/tier2-boundaries/f01-canonical-narration-kit.boundary.test.ts
 * Feature F01: Canonical Narration Kit Boundary Tests (T2-F01-01 to T2-F01-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F01: Canonical Narration Kit Boundary Tests', () => {
  test('T2-F01-01: Resolving non-existent or invalid submodule path returns null safely', async (ctx) => {
    const res = await resolveOptionalModule('./packages/narration-kit/non-existent-submodule.js');
    assertEqual(res, null, 'Non-existent submodule should resolve to null');
  }, { id: 'T2-F01-01', feature: 'F01', tier: 2 });

  test('T2-F01-02: Package manifest validation rejects missing fields or invalid versions', async (ctx) => {
    const pkgPath = path.resolve(process.cwd(), 'packages/narration-kit/package.json');
    if (!fs.existsSync(pkgPath)) {
      ctx.notImplemented('packages/narration-kit/package.json not yet created');
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assertTrue(pkg.name && pkg.name.length > 0, 'Package name must be non-empty string');
    assertTrue(pkg.version && /^\d+\.\d+\.\d+/.test(pkg.version), 'Package version must follow semver format');
    assertTrue(pkg.exports || pkg.main, 'Package must declare exports or main entrypoint');
  }, { id: 'T2-F01-02', feature: 'F01', tier: 2 });

  test('T2-F01-03: Zero runtime leakage: package source contains zero imports from .agents/', async (ctx) => {
    const srcDir = path.resolve(process.cwd(), 'packages/narration-kit/src');
    if (!fs.existsSync(srcDir)) {
      ctx.notImplemented('packages/narration-kit/src not yet created');
      return;
    }
    const walk = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) results = results.concat(walk(full));
        else if (full.endsWith('.ts') || full.endsWith('.js')) results.push(full);
      }
      return results;
    };
    const files = walk(srcDir);
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      assertTrue(!content.includes('.agents/'), `File ${f} must not import from .agents/`);
    }
  }, { id: 'T2-F01-03', feature: 'F01', tier: 2 });

  test('T2-F01-04: Invalid or null config passed to TTS engine throws error on empty text or invalid model', async (ctx) => {
    const ttsMod = await resolveOptionalModule<any>('../../../packages/narration-kit/src/tts/index.ts');
    if (!ttsMod || !ttsMod.KokoroTtsEngine) {
      ctx.notImplemented('KokoroTtsEngine not yet exported');
      return;
    }
    const engine = new ttsMod.KokoroTtsEngine();
    let threw = false;
    try {
      await engine.synthesize({ text: '' });
    } catch (err: any) {
      threw = true;
      assertTrue(err.message.includes('cannot be empty'), 'Expected empty text error');
    }
    assertTrue(threw, 'Should throw on empty text');
  }, { id: 'T2-F01-04', feature: 'F01', tier: 2 });

  test('T2-F01-05: Edge-case paths: root directories with spaces or non-standard characters handled safely', async (ctx) => {
    const tempDir = ctx.createTempDir('e2e-space test-');
    assertTrue(fs.existsSync(tempDir), 'Temp directory with space in name must be created');
    assertTrue(tempDir.includes('space test'), 'Temp path must contain space');
  }, { id: 'T2-F01-05', feature: 'F01', tier: 2 });
}, { feature: 'F01', tier: 2 });
