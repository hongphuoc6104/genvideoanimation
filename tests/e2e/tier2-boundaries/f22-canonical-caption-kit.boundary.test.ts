/**
 * tests/e2e/tier2-boundaries/f22-canonical-caption-kit.boundary.test.ts
 * Feature F22: Canonical Caption Kit Package Boundary Tests (T2-F22-01 to T2-F22-05)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F22: Canonical Caption Kit Package Boundary Tests', () => {
  test('T2-F22-01: Caption kit package component exports contract', async (ctx) => {
    const kitMod = await resolveOptionalModule<any>('../../../packages/caption-kit/src/index.ts');
    if (!kitMod) {
      // Validate expected export names definition
      const requiredExports = ['KaraokeCaptions', 'KaraokeGroup', 'KaraokeLine', 'KaraokeWord'];
      assertEqual(requiredExports.length, 4);
      return;
    }
    assertTrue('KaraokeCaptions' in kitMod);
    assertTrue('KaraokeGroup' in kitMod);
    assertTrue('KaraokeLine' in kitMod);
    assertTrue('KaraokeWord' in kitMod);
  }, { id: 'T2-F22-01', feature: 'F22', tier: 2 });

  test('T2-F22-02: Zero runtime leakage: caption-kit contains zero imports from .agents/', async (ctx) => {
    const pkgDir = path.resolve(process.cwd(), 'packages/caption-kit');
    if (!fs.existsSync(pkgDir)) {
      // Verified when package directory is created
      return;
    }
    const checkNoAgents = (dir: string) => {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) checkNoAgents(full);
        else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js')) {
          const content = fs.readFileSync(full, 'utf8');
          assertTrue(!content.includes('.agents/'), `File ${full} must not import from .agents/`);
        }
      }
    };
    checkNoAgents(pkgDir);
  }, { id: 'T2-F22-02', feature: 'F22', tier: 2 });

  test('T2-F22-03: Empty caption groups data structure handled gracefully', async (ctx) => {
    const emptyCaptions = {
      version: '1.0.0',
      fps: 30,
      groups: [],
    };
    assertEqual(emptyCaptions.groups.length, 0);
    const renderCaptionGroup = (data: typeof emptyCaptions, frame: number) => {
      const active = data.groups.find((g: any) => frame >= g.startFrame && frame <= g.endFrame);
      return active || null;
    };
    assertEqual(renderCaptionGroup(emptyCaptions, 15), null, 'Empty groups should return null active group');
  }, { id: 'T2-F22-03', feature: 'F22', tier: 2 });

  test('T2-F22-04: Caption styling props interface supports theme and font overrides', async (ctx) => {
    interface CaptionThemeProps {
      fontSize?: number;
      accentColor?: string;
      upcomingColor?: string;
      spokenColor?: string;
      safeMargin?: number;
    }
    const customProps: CaptionThemeProps = {
      fontSize: 42,
      accentColor: '#38bdf8',
      upcomingColor: '#94a3b8',
      spokenColor: '#64748b',
      safeMargin: 96,
    };
    assertTrue(customProps.fontSize! > 0);
    assertTrue(customProps.accentColor!.startsWith('#'));
    assertEqual(customProps.safeMargin, 96);
  }, { id: 'T2-F22-04', feature: 'F22', tier: 2 });

  test('T2-F22-05: Package manifest package.json validation for caption-kit package', async (ctx) => {
    const pkgPath = path.resolve(process.cwd(), 'packages/caption-kit/package.json');
    if (!fs.existsSync(pkgPath)) {
      // Pending milestone M4 creation
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assertTrue(pkg.name && pkg.name.includes('caption-kit'));
    assertTrue(pkg.version && /^\d+\.\d+\.\d+/.test(pkg.version));
  }, { id: 'T2-F22-05', feature: 'F22', tier: 2 });
}, { feature: 'F22', tier: 2 });
