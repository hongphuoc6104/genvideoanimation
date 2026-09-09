/**
 * tests/e2e/tier1-features/f33-validator-offline-network-guard.test.ts
 * Tier 1: Feature Coverage Tests for F33 (Validator offline-network-guard.ts)
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertRejects,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const GUARD_SCRIPT = path.join(REPO_ROOT, 'validators', 'offline-network-guard.ts');

export const suite: TestSuite = {
  name: 'Tier 1: F33 Validator offline-network-guard.ts',
  feature: 'F33',
  tier: 1,
  tests: [
    {
      id: 'T1-F33-01',
      name: 'offline-network-guard.ts script exists and exports guard utility functions',
      feature: 'F33',
      tier: 1,
      fn: async (ctx) => {
        assertTrue(fs.existsSync(GUARD_SCRIPT), 'validators/offline-network-guard.ts must exist');
        const mod = await import(GUARD_SCRIPT);
        assertTrue(typeof mod.enableOfflineNetworkGuard === 'function');
        assertTrue(typeof mod.runWithOfflineGuard === 'function');
      },
    },
    {
      id: 'T1-F33-02',
      name: 'Guard intercepts unauthorized outbound network call and throws violation error',
      feature: 'F33',
      tier: 1,
      fn: async (ctx) => {
        const { runWithOfflineGuard } = await import(GUARD_SCRIPT);
        let threw = false;
        try {
          await runWithOfflineGuard(async () => {
            await globalThis.fetch('http://example.com/forbidden');
          });
        } catch (err: any) {
          threw = true;
          assertTrue(
            err.message.includes('Network access forbidden in offline mode'),
            `Expected offline violation message, got: ${err.message}`
          );
        }
        assertTrue(threw, 'Offline guard must intercept outbound network access');
      },
    },
    {
      id: 'T1-F33-03',
      name: 'Guard permits strictly local offline operations and completes cleanly',
      feature: 'F33',
      tier: 1,
      fn: async (ctx) => {
        const { runWithOfflineGuard } = await import(GUARD_SCRIPT);
        const result = await runWithOfflineGuard(async () => {
          return 'Local offline execution success';
        });
        assertEqual(result, 'Local offline execution success');
      },
    },
    {
      id: 'T1-F33-04',
      name: 'In-process guard intercepts globalThis.fetch promises',
      feature: 'F33',
      tier: 1,
      fn: async (ctx) => {
        const { enableOfflineNetworkGuard } = await import(GUARD_SCRIPT);
        const restore = enableOfflineNetworkGuard();
        try {
          await assertRejects(
            async () => {
              await globalThis.fetch('https://api.github.com');
            },
            /Network access forbidden in offline mode/
          );
        } finally {
          restore();
        }
      },
    },
    {
      id: 'T1-F33-05',
      name: 'Setting allowLocalhost option allows loopback connections without violation',
      feature: 'F33',
      tier: 1,
      fn: async (ctx) => {
        const { enableOfflineNetworkGuard } = await import(GUARD_SCRIPT);
        // Enable with allowLocalhost: true
        const restore = enableOfflineNetworkGuard({ allowLocalhost: true });
        try {
          // Verify localhost URL is not immediately aborted by the guard filter
          let errorThrown = false;
          try {
            // Will fail at OS connect level (ECONNREFUSED) but must NOT throw OfflineNetworkViolationError
            await globalThis.fetch('http://127.0.0.1:65534');
          } catch (err: any) {
            errorThrown = true;
            assertFalse(
              err.name === 'OfflineNetworkViolationError',
              'Should not throw OfflineNetworkViolationError for localhost'
            );
          }
          assertTrue(errorThrown);
        } finally {
          restore();
        }
      },
    },
  ],
};

registerSuite(suite);
