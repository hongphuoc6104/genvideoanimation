#!/usr/bin/env tsx
/**
 * Master CLI Executable Entrypoint for V3.3 Production Integrity E2E Test Suite
 *
 * Usage:
 *   npx tsx tests/v3_3/run-v3_3-e2e.ts
 *   npx tsx tests/v3_3/run-v3_3-e2e.ts --tier=1
 *   npx tsx tests/v3_3/run-v3_3-e2e.ts --tier=2
 *   npx tsx tests/v3_3/run-v3_3-e2e.ts --feature=F01
 *   npx tsx tests/v3_3/run-v3_3-e2e.ts --filter="typography"
 *   npx tsx tests/v3_3/run-v3_3-e2e.ts --strict --json
 */

import { E2ERunner } from './harness/runner';
import { TestRunnerOptions } from './harness/test-context';

function parseArgs(): TestRunnerOptions {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {
    tier: 'all',
    verbose: true,
    bail: false,
    strict: false,
    json: false,
    tap: false,
    timeoutMs: 15000,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log(`
V3.3 E2E Test Runner Options:
  --tier=<1|2|3|4|all>   Run specific tier (default: all)
  --feature=<F01..F18>   Filter suites by feature code
  --filter=<pattern>     Filter test name or id by substring
  --scenario=<S01..S14>  Filter scenario tests
  --bail                 Stop on first test failure
  --strict               Treat skipped or not-implemented as failure
  --json                 Output result in JSON format
  --tap                  Output in TAP 13 format
  --output=<path>        Write JSON summary report to file
  --timeout=<ms>         Per-test timeout in milliseconds (default: 15000)
`);
      process.exit(0);
    } else if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1] as any;
    } else if (arg.startsWith('--feature=')) {
      options.feature = arg.split('=')[1];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg.startsWith('--scenario=')) {
      options.scenario = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--timeout=')) {
      options.timeoutMs = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--bail') {
      options.bail = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--tap') {
      options.tap = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const runner = new E2ERunner(options);

  try {
    const summary = await runner.run();
    process.exit(summary.success ? 0 : 1);
  } catch (err: any) {
    console.error('Fatal runner execution error:', err);
    process.exit(1);
  }
}

if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.endsWith('run-v3_3-e2e.ts'))) {
  main();
}
