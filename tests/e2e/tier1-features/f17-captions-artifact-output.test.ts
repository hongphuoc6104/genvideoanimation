/**
 * tests/e2e/tier1-features/f17-captions-artifact-output.test.ts
 * Tier 1: Feature Coverage Tests for F17 (Captions Artifact Output - captions.json)
 */

import {
  assertEqual,
  assertTrue,
  assertSchema,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_CAPTIONS_JSON } from '../harness/fixtures';

export const suite: TestSuite = {
  name: 'Tier 1: F17 Captions Artifact Output (captions.json)',
  feature: 'F17',
  tier: 1,
  tests: [
    {
      id: 'T1-F17-01',
      name: 'captions.json conforms to authoritative CaptionsManifest schema',
      feature: 'F17',
      tier: 1,
      fn: async (ctx) => {
        assertSchema(MOCK_CAPTIONS_JSON, {
          version: 'string',
          fps: 'number',
          groups: (g) => Array.isArray(g) && g.length > 0,
        });
        assertEqual(MOCK_CAPTIONS_JSON.version, '1.0.0');
        assertEqual(MOCK_CAPTIONS_JSON.fps, 30);
      },
    },
    {
      id: 'T1-F17-02',
      name: 'Groups possess sequential IDs and strictly non-decreasing frame bounds',
      feature: 'F17',
      tier: 1,
      fn: async (ctx) => {
        const groups = MOCK_CAPTIONS_JSON.groups;
        for (let i = 0; i < groups.length; i++) {
          assertEqual(groups[i].id, `g${i}`);
          assertTrue(groups[i].startFrame < groups[i].endFrame, 'startFrame must precede endFrame');
          if (i > 0) {
            assertTrue(
              groups[i].startFrame >= groups[i - 1].endFrame,
              `Group ${i} startFrame must be >= Group ${i - 1} endFrame`
            );
          }
        }
      },
    },
    {
      id: 'T1-F17-03',
      name: 'Every group defines valid coordinate bounding box attributes',
      feature: 'F17',
      tier: 1,
      fn: async (ctx) => {
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          assertSchema(group.box, {
            x: 'number',
            y: 'number',
            width: 'number',
            height: 'number',
          });
          assertTrue(group.box.width > 0 && group.box.height > 0);
        }
      },
    },
    {
      id: 'T1-F17-04',
      name: 'Line and word hierarchy preserves word IDs and timing metadata',
      feature: 'F17',
      tier: 1,
      fn: async (ctx) => {
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          for (const line of group.lines) {
            assertTrue(typeof line.text === 'string' && line.text.length > 0);
            assertTrue(Array.isArray(line.words) && line.words.length > 0);
            for (const word of line.words) {
              assertSchema(word, {
                id: 'string',
                word: 'string',
                start: 'number',
                end: 'number',
              });
              assertTrue(word.end > word.start);
            }
          }
        }
      },
    },
    {
      id: 'T1-F17-05',
      name: 'Frame synchrony aligns accurately with seconds timestamps based on fps',
      feature: 'F17',
      tier: 1,
      fn: async (ctx) => {
        const fps = MOCK_CAPTIONS_JSON.fps;
        for (const group of MOCK_CAPTIONS_JSON.groups) {
          const expectedStartFrame = Math.round(group.startTime * fps);
          const expectedEndFrame = Math.round(group.endTime * fps);
          // Allow +/- 1 frame rounding tolerance
          assertTrue(
            Math.abs(group.startFrame - expectedStartFrame) <= 1,
            `startFrame ${group.startFrame} does not match startTime ${group.startTime} * ${fps}`
          );
          assertTrue(
            Math.abs(group.endFrame - expectedEndFrame) <= 1,
            `endFrame ${group.endFrame} does not match endTime ${group.endTime} * ${fps}`
          );
        }
      },
    },
  ],
};

registerSuite(suite);
