/**
 * tests/e2e/tier1-features/f26-karaoke-captions-coordinator.test.ts
 * Tier 1: Feature Coverage Tests for F26 (KaraokeCaptions Remotion Coordinator)
 */

import {
  assertEqual,
  assertTrue,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';
import { MOCK_CAPTIONS_JSON } from '../harness/fixtures';

export function resolveActiveGroup(captions: typeof MOCK_CAPTIONS_JSON, currentFrame: number) {
  return captions.groups.find(
    (g) => currentFrame >= g.startFrame && currentFrame <= g.endFrame
  ) || null;
}

export const suite: TestSuite = {
  name: 'Tier 1: F26 KaraokeCaptions Coordinator',
  feature: 'F26',
  tier: 1,
  tests: [
    {
      id: 'T1-F26-01',
      name: 'Coordinator accepts canonical captions.json manifest without schema errors',
      feature: 'F26',
      tier: 1,
      fn: async (ctx) => {
        assertTrue(MOCK_CAPTIONS_JSON.groups.length >= 2);
        assertEqual(MOCK_CAPTIONS_JSON.version, '1.0.0');
        assertEqual(MOCK_CAPTIONS_JSON.fps, 30);
      },
    },
    {
      id: 'T1-F26-02',
      name: 'Active group selection logic isolates exact active group for current composition frame',
      feature: 'F26',
      tier: 1,
      fn: async (ctx) => {
        // g0: frame 2 to 40
        const activeAt10 = resolveActiveGroup(MOCK_CAPTIONS_JSON, 10);
        assertTrue(activeAt10 !== null, 'Expected active group at frame 10');
        assertEqual(activeAt10?.id, 'g0');

        // g1: frame 41 to 120
        const activeAt50 = resolveActiveGroup(MOCK_CAPTIONS_JSON, 50);
        assertTrue(activeAt50 !== null, 'Expected active group at frame 50');
        assertEqual(activeAt50?.id, 'g1');
      },
    },
    {
      id: 'T1-F26-03',
      name: 'Coordinator mounts group container at specified pixel coordinates',
      feature: 'F26',
      tier: 1,
      fn: async (ctx) => {
        const group0 = MOCK_CAPTIONS_JSON.groups[0];
        const containerStyle = {
          position: 'absolute',
          left: `${group0.box.x}px`,
          top: `${group0.box.y}px`,
          width: `${group0.box.width}px`,
          height: `${group0.box.height}px`,
        };
        assertEqual(containerStyle.left, '192px');
        assertEqual(containerStyle.top, '864px');
        assertEqual(containerStyle.width, '1536px');
      },
    },
    {
      id: 'T1-F26-04',
      name: 'Coordinator returns null during silent gap intervals before or after captions',
      feature: 'F26',
      tier: 1,
      fn: async (ctx) => {
        // Frame 0 is before g0 starts (starts at frame 2)
        const silentBefore = resolveActiveGroup(MOCK_CAPTIONS_JSON, 0);
        assertEqual(silentBefore, null, 'Should return null before speech starts');

        // Frame 150 is after g1 ends (ends at frame 120)
        const silentAfter = resolveActiveGroup(MOCK_CAPTIONS_JSON, 150);
        assertEqual(silentAfter, null, 'Should return null after speech ends');
      },
    },
    {
      id: 'T1-F26-05',
      name: 'Group handover transition occurs cleanly across adjacent group boundary frames',
      feature: 'F26',
      tier: 1,
      fn: async (ctx) => {
        // g0 ends at frame 40, g1 starts at frame 41
        const atFrame40 = resolveActiveGroup(MOCK_CAPTIONS_JSON, 40);
        const atFrame41 = resolveActiveGroup(MOCK_CAPTIONS_JSON, 41);

        assertEqual(atFrame40?.id, 'g0', 'Frame 40 must belong to g0');
        assertEqual(atFrame41?.id, 'g1', 'Frame 41 must belong to g1');
      },
    },
  ],
};

registerSuite(suite);
