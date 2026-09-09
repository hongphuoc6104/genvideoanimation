#!/usr/bin/env tsx
/**
 * tests/e2e/run-e2e-tests.ts
 * Master CLI Entry Point for V3 Narration & Karaoke Subsystem E2E Test Suite
 * Usage:
 *   npx tsx tests/e2e/run-e2e-tests.ts [options]
 *   npm run test:v3 -- [options]
 */

import { E2ERunner } from './harness/runner';

async function main() {
  const runner = new E2ERunner();
  runner.parseArgv(process.argv);
  const summary = await runner.run();
  process.exit(summary.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
