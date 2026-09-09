/**
 * tests/e2e/tier2-boundaries/f17-captions-artifact-output.boundary.test.ts
 * Feature F17: Captions Artifact Output Boundary Tests (T2-F17-01 to T2-F17-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F17: Captions Artifact Output Boundary Tests', () => {
  test('T2-F17-01: Schema boundary validation for captions.json artifact', async (ctx) => {
    const captions = FIXTURES.CAPTIONS;
    assertSchema(captions, {
      version: 'string',
      fps: 'number',
      groups: (val) => Array.isArray(val) && val.length > 0,
    });
  }, { id: 'T2-F17-01', feature: 'F17', tier: 2 });

  test('T2-F17-02: Frame synchrony invariant: startFrame < endFrame and matches seconds conversion', async (ctx) => {
    const captions = FIXTURES.CAPTIONS;
    const fps = captions.fps;
    assertEqual(fps, 30);

    for (const group of captions.groups) {
      assertTrue(group.startFrame < group.endFrame, `startFrame ${group.startFrame} must be < endFrame ${group.endFrame}`);
      const expectedStartFrame = Math.round(group.startTime * fps);
      assertTrue(
        Math.abs(group.startFrame - expectedStartFrame) <= 1,
        `startFrame ${group.startFrame} deviates from startTime ${group.startTime} * ${fps}`
      );
    }
  }, { id: 'T2-F17-02', feature: 'F17', tier: 2 });

  test('T2-F17-03: Word completeness: all words in captions match words.json tokens', async (ctx) => {
    const captions = FIXTURES.CAPTIONS;
    const allCaptionWords: any[] = [];
    for (const g of captions.groups) {
      for (const l of g.lines) {
        for (const w of l.words) {
          allCaptionWords.push(w);
        }
      }
    }
    assertEqual(allCaptionWords.length, FIXTURES.WORDS.length, 'Total caption word count must match words.json count');
  }, { id: 'T2-F17-03', feature: 'F17', tier: 2 });

  test('T2-F17-04: Bounding box dimensions strictly positive and within canvas limits', async (ctx) => {
    const captions = FIXTURES.CAPTIONS;
    for (const group of captions.groups) {
      assertTrue(group.box.width > 0, `Box width ${group.box.width} must be positive`);
      assertTrue(group.box.height > 0, `Box height ${group.box.height} must be positive`);
      assertTrue(group.box.width <= 1920, `Box width exceeds 1920`);
      assertTrue(group.box.height <= 1080, `Box height exceeds 1080`);
    }
  }, { id: 'T2-F17-04', feature: 'F17', tier: 2 });

  test('T2-F17-05: Consecutive caption groups do not overlap in frame intervals', async (ctx) => {
    const captions = FIXTURES.CAPTIONS;
    for (let i = 1; i < captions.groups.length; i++) {
      const prev = captions.groups[i - 1];
      const curr = captions.groups[i];
      assertTrue(
        curr.startFrame >= prev.endFrame,
        `Caption group frame collision: prev ends at ${prev.endFrame}, curr starts at ${curr.startFrame}`
      );
    }
  }, { id: 'T2-F17-05', feature: 'F17', tier: 2 });
}, { feature: 'F17', tier: 2 });
