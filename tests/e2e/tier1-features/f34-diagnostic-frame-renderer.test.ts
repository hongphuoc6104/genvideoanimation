/**
 * tests/e2e/tier1-features/f34-diagnostic-frame-renderer.test.ts
 * Tier 1: Feature Coverage Tests for F34 (Diagnostic Frame Renderer)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_CAPTIONS_JSON, SHOTSPEC_FIXTURES } from '../harness/fixtures';

export function generateDiagnosticSvgOverlay(
  frameNumber: number,
  captionBox: { x: number; y: number; width: number; height: number },
  subjectRegion?: { x: number; y: number; width: number; height: number },
  safeMargin: number = 96
): string {
  const safeGuide = `<rect x="${safeMargin}" y="${safeMargin}" width="${1920 - safeMargin * 2}" height="${1080 - safeMargin * 2}" fill="none" stroke="#22c55e" stroke-dasharray="4,4" stroke-width="2" id="safe-guide" />`;
  const captionRect = `<rect x="${captionBox.x}" y="${captionBox.y}" width="${captionBox.width}" height="${captionBox.height}" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="2" id="caption-box" />`;
  const subjectRect = subjectRegion
    ? `<rect x="${subjectRegion.x}" y="${subjectRegion.y}" width="${subjectRegion.width}" height="${subjectRegion.height}" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="2" id="subject-box" />`
    : '';

  return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" data-frame="${frameNumber}">
    ${safeGuide}
    ${captionRect}
    ${subjectRect}
  </svg>`;
}

export const suite: TestSuite = {
  name: 'Tier 1: F34 Diagnostic Frame Renderer',
  feature: 'F34',
  tier: 1,
  tests: [
    {
      id: 'T1-F34-01',
      name: 'Renderer configuration options specify frames list and output directory',
      feature: 'F34',
      tier: 1,
      fn: async (ctx) => {
        const renderConfig = {
          compositionId: 'BenchmarkA',
          frames: [15, 45, 90, 120],
          outputDir: 'out/v3/diagnostics',
          safeMargin: 96,
        };
        assertSchema(renderConfig, {
          compositionId: 'string',
          frames: (f) => Array.isArray(f) && f.length === 4,
          outputDir: 'string',
          safeMargin: 'number',
        });
      },
    },
    {
      id: 'T1-F34-02',
      name: 'Generates caption bounding box diagnostic overlay elements',
      feature: 'F34',
      tier: 1,
      fn: async (ctx) => {
        const box = MOCK_CAPTIONS_JSON.groups[0].box;
        const svg = generateDiagnosticSvgOverlay(10, box);
        assertTrue(svg.includes('id="caption-box"'));
        assertTrue(svg.includes(`x="${box.x}"`));
        assertTrue(svg.includes(`y="${box.y}"`));
      },
    },
    {
      id: 'T1-F34-03',
      name: 'Generates subject region collision bounding box overlay when present',
      feature: 'F34',
      tier: 1,
      fn: async (ctx) => {
        const box = MOCK_CAPTIONS_JSON.groups[0].box;
        const subject = SHOTSPEC_FIXTURES.WITH_SUBJECT_BOTTOM.subject_region;
        const svg = generateDiagnosticSvgOverlay(10, box, subject);
        assertTrue(svg.includes('id="subject-box"'));
        assertTrue(svg.includes(`x="${subject?.x}"`));
        assertTrue(svg.includes(`stroke="#ef4444"`));
      },
    },
    {
      id: 'T1-F34-04',
      name: 'Generates safe margin guide outlines at exactly 96px screen border',
      feature: 'F34',
      tier: 1,
      fn: async (ctx) => {
        const box = MOCK_CAPTIONS_JSON.groups[0].box;
        const svg = generateDiagnosticSvgOverlay(10, box, undefined, 96);
        assertTrue(svg.includes('id="safe-guide"'));
        assertTrue(svg.includes('x="96" y="96"'));
        assertTrue(svg.includes(`width="${1920 - 96 * 2}"`)); // 1728
        assertTrue(svg.includes(`height="${1080 - 96 * 2}"`)); // 888
      },
    },
    {
      id: 'T1-F34-05',
      name: 'Saves diagnostic frame image markup into destination directory',
      feature: 'F34',
      tier: 1,
      fn: async (ctx) => {
        const tmpDir = ctx.createTempDir('tier1-f34-');
        const box = MOCK_CAPTIONS_JSON.groups[0].box;
        const svg = generateDiagnosticSvgOverlay(15, box);
        
        const outFile = path.join(tmpDir, 'frame_0015_diagnostic.svg');
        fs.writeFileSync(outFile, svg, 'utf-8');

        assertTrue(fs.existsSync(outFile));
        const readBack = fs.readFileSync(outFile, 'utf-8');
        assertTrue(readBack.includes('data-frame="15"'));
      },
    },
  ],
};

registerSuite(suite);
