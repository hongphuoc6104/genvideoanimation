/**
 * tests/e2e/tier2-boundaries/f06-strict-offline-network-guard.boundary.test.ts
 * Feature F06: Strict Offline Network Guard Boundary Tests (T2-F06-01 to T2-F06-05)
 */

import * as http from 'node:http';
import * as net from 'node:net';
import * as dns from 'node:dns';
import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F06: Strict Offline Network Guard Boundary Tests', () => {
  test('T2-F06-01: Guard intercepts external HTTP calls and throws OfflineNetworkViolationError', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard();
    try {
      assertThrows(() => {
        http.get('http://example.com/api/test');
      }, /Network access forbidden in offline mode/i, 'HTTP request must be blocked');
    } finally {
      restore();
    }
  }, { id: 'T2-F06-01', feature: 'F06', tier: 2 });

  test('T2-F06-02: Guard intercepts raw net.Socket connections and throws OfflineNetworkViolationError', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard();
    try {
      assertThrows(() => {
        const socket = new net.Socket();
        socket.connect(443, '93.184.216.34');
      }, /Network access forbidden in offline mode/i, 'Raw TCP socket connect must be blocked');
    } finally {
      restore();
    }
  }, { id: 'T2-F06-02', feature: 'F06', tier: 2 });

  test('T2-F06-03: Guard intercepts dns lookup and raises OfflineNetworkViolationError', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard();
    try {
      let caught = false;
      await new Promise<void>((resolve) => {
        dns.lookup('huggingface.co', (err) => {
          if (err && err.message.includes('Network access forbidden in offline mode')) {
            caught = true;
          }
          resolve();
        });
      });
      assertTrue(caught, 'dns.lookup callback must receive OfflineNetworkViolationError');
    } finally {
      restore();
    }
  }, { id: 'T2-F06-03', feature: 'F06', tier: 2 });

  test('T2-F06-04: Strict mode (allowLocalhost: false) blocks connections to 127.0.0.1 and localhost', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard({ allowLocalhost: false });
    try {
      assertThrows(() => {
        const socket = new net.Socket();
        socket.connect(8080, '127.0.0.1');
      }, /Network access forbidden in offline mode/i, 'Strict offline mode must block 127.0.0.1');
    } finally {
      restore();
    }
  }, { id: 'T2-F06-04', feature: 'F06', tier: 2 });

  test('T2-F06-05: Teardown cleanup function restores normal network operations and resets active count', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard();
    assertTrue(guardMod.isOfflineGuardActive(), 'Guard must report active after enabling');
    restore();
    assertEqual(guardMod.isOfflineGuardActive(), false, 'Guard must report inactive after restore');
  }, { id: 'T2-F06-05', feature: 'F06', tier: 2 });
}, { feature: 'F06', tier: 2 });
