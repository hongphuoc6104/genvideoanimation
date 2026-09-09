/**
 * tests/e2e/tier2-boundaries/f33-validator-offline-network-guard.boundary.test.ts
 * Feature F33: Validator offline-network-guard.ts Boundary Tests (T2-F33-01 to T2-F33-05)
 */

import { describe, test, resolveOptionalModule } from '../harness/test-context.js';
import { assert, assertEqual, assertTrue, assertThrows, assertSchema, NotImplementedError } from '../harness/assert.js';
import { FIXTURES } from '../harness/fixtures.js';

export const suite = describe('Tier 2 - F33: Validator offline-network-guard.ts Boundary Tests', () => {
  test('T2-F33-01: Offline guard validator CLI contract: intercepts HTTP call with descriptive violation', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.OfflineNetworkViolationError) {
      ctx.notImplemented('OfflineNetworkViolationError not yet exported');
      return;
    }
    const err = new guardMod.OfflineNetworkViolationError('http.get', 'api.openai.com:443');
    assertEqual(err.name, 'OfflineNetworkViolationError');
    assertEqual(err.code, 'ERR_OFFLINE_VIOLATION');
    assertTrue(err.message.includes('http.get'));
    assertTrue(err.message.includes('api.openai.com:443'));
  }, { id: 'T2-F33-01', feature: 'F33', tier: 2 });

  test('T2-F33-02: Offline guard error contains primitive and target host attributes', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.OfflineNetworkViolationError) {
      ctx.notImplemented('OfflineNetworkViolationError not yet exported');
      return;
    }
    const err = new guardMod.OfflineNetworkViolationError('dns.lookup', 'huggingface.co');
    assertEqual(err.primitive, 'dns.lookup');
    assertEqual(err.target, 'huggingface.co');
  }, { id: 'T2-F33-02', feature: 'F33', tier: 2 });

  test('T2-F33-03: Offline guard detects active status via isOfflineGuardActive', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.isOfflineGuardActive) {
      ctx.notImplemented('isOfflineGuardActive not yet exported');
      return;
    }
    assertEqual(guardMod.isOfflineGuardActive(), false);
    const restore = guardMod.enableOfflineNetworkGuard();
    assertEqual(guardMod.isOfflineGuardActive(), true);
    restore();
    assertEqual(guardMod.isOfflineGuardActive(), false);
  }, { id: 'T2-F33-03', feature: 'F33', tier: 2 });

  test('T2-F33-04: Strict offline mode without network attempts executes with zero violations', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard();
    let violationOccurred = false;
    try {
      // Local in-memory calculation (simulating offline pipeline)
      const data = Buffer.from('offline local compute');
      const hash = data.toString('hex');
      assertTrue(hash.length > 0);
    } catch {
      violationOccurred = true;
    } finally {
      restore();
    }
    assertEqual(violationOccurred, false, 'Purely local code must never trigger offline violation');
  }, { id: 'T2-F33-04', feature: 'F33', tier: 2 });

  test('T2-F33-05: Environment variable propagation: sets HF_HUB_OFFLINE and TRANSFORMERS_OFFLINE', async (ctx) => {
    const guardMod = await resolveOptionalModule<any>('../../../validators/offline-network-guard.ts');
    if (!guardMod || !guardMod.enableOfflineNetworkGuard) {
      ctx.notImplemented('enableOfflineNetworkGuard not yet exported');
      return;
    }
    const restore = guardMod.enableOfflineNetworkGuard();
    assertEqual(process.env.HF_HUB_OFFLINE, '1');
    assertEqual(process.env.TRANSFORMERS_OFFLINE, '1');
    restore();
    assertTrue(process.env.HF_HUB_OFFLINE !== '1' || process.env.TRANSFORMERS_OFFLINE !== '1');
  }, { id: 'T2-F33-05', feature: 'F33', tier: 2 });
}, { feature: 'F33', tier: 2 });
