/**
 * tests/e2e/tier1-features/f06-strict-offline-network-guard.test.ts
 * Tier 1: Feature Coverage Tests for F06 (Strict Offline Network Guard)
 */

import * as http from 'node:http';
import * as https from 'node:https';
import * as net from 'node:net';
import * as dns from 'node:dns';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F06 Strict Offline Network Guard',
  feature: 'F06',
  tier: 1,
  tests: [
    {
      id: 'T1-F06-01',
      name: 'Guard blocks outbound HTTP requests with OfflineNetworkViolationError',
      feature: 'F06',
      tier: 1,
      fn: async (ctx) => {
        const { enableOfflineNetworkGuard } = await import(
          path.join(REPO_ROOT, 'validators', 'offline-network-guard.ts')
        );
        const restore = enableOfflineNetworkGuard();
        try {
          assertThrows(
            () => http.get('http://example.com/api/test'),
            /Network access forbidden in offline mode: \[http\.get\]/
          );
        } finally {
          restore();
        }
      },
    },
    {
      id: 'T1-F06-02',
      name: 'Guard blocks outbound HTTPS requests with OfflineNetworkViolationError',
      feature: 'F06',
      tier: 1,
      fn: async (ctx) => {
        const { enableOfflineNetworkGuard } = await import(
          path.join(REPO_ROOT, 'validators', 'offline-network-guard.ts')
        );
        const restore = enableOfflineNetworkGuard();
        try {
          assertThrows(
            () => https.request('https://huggingface.co/api/models'),
            /Network access forbidden in offline mode: \[https\.request\]/
          );
        } finally {
          restore();
        }
      },
    },
    {
      id: 'T1-F06-03',
      name: 'Guard blocks external net.Socket connection attempts',
      feature: 'F06',
      tier: 1,
      fn: async (ctx) => {
        const { enableOfflineNetworkGuard } = await import(
          path.join(REPO_ROOT, 'validators', 'offline-network-guard.ts')
        );
        const restore = enableOfflineNetworkGuard();
        try {
          const socket = new net.Socket();
          assertThrows(
            () => socket.connect(80, '93.184.216.34'),
            /Network access forbidden in offline mode: \[net\.Socket\.connect\]/
          );
        } finally {
          restore();
        }
      },
    },
    {
      id: 'T1-F06-04',
      name: 'Guard blocks external DNS hostname resolution attempts',
      feature: 'F06',
      tier: 1,
      fn: async (ctx) => {
        const { enableOfflineNetworkGuard } = await import(
          path.join(REPO_ROOT, 'validators', 'offline-network-guard.ts')
        );
        const restore = enableOfflineNetworkGuard();
        try {
          let caughtError: any = null;
          await new Promise<void>((resolve) => {
            dns.lookup('api.openai.com', (err) => {
              caughtError = err;
              resolve();
            });
          });
          assertTrue(caughtError !== null, 'dns.lookup should return an error in offline mode');
          assertTrue(
            caughtError.message.includes('Network access forbidden in offline mode'),
            `Expected offline violation error, got: ${caughtError.message}`
          );

          // Also test dns.promises.lookup
          let promiseRejected = false;
          try {
            await dns.promises.lookup('api.anthropic.com');
          } catch (err: any) {
            promiseRejected = true;
            assertTrue(err.message.includes('Network access forbidden in offline mode'));
          }
          assertTrue(promiseRejected, 'dns.promises.lookup must reject in offline mode');
        } finally {
          restore();
        }
      },
    },
    {
      id: 'T1-F06-05',
      name: 'Guard allows local in-memory computations without false positives',
      feature: 'F06',
      tier: 1,
      fn: async (ctx) => {
        const { runWithOfflineGuard, isOfflineGuardActive } = await import(
          path.join(REPO_ROOT, 'validators', 'offline-network-guard.ts')
        );
        const result = await runWithOfflineGuard(async () => {
          assertTrue(isOfflineGuardActive(), 'Offline guard should report active');
          // In-memory math computation
          const val = Math.sqrt(144) * 10;
          return val;
        });

        assertEqual(result, 120);
        assertFalse(isOfflineGuardActive(), 'Guard should restore to inactive after execution');
      },
    },
  ],
};

registerSuite(suite);
