/**
 * tests/e2e/harness/runner.ts
 * Standalone E2E Test Runner Engine for V3 Narration & Karaoke Subsystem
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as url from 'node:url';
import { performance } from 'node:perf_hooks';
import {
  TestCase,
  TestResult,
  TestSuite,
  TestRunnerOptions,
  RunSummary,
  TierSummary,
  TestContext,
  TestRegistry,
} from './test-context';
import { NotImplementedError, SkipError } from './assert';

export class E2ERunner {
  private options: TestRunnerOptions;

  constructor(options: Partial<TestRunnerOptions> = {}) {
    this.options = {
      tier: options.tier || 'all',
      feature: options.feature,
      filter: options.filter,
      scenario: options.scenario,
      verbose: options.verbose || false,
      bail: options.bail || false,
      strict: options.strict || false,
      json: options.json || false,
      tap: options.tap || false,
      output: options.output,
      timeoutMs: options.timeoutMs || 5000,
      dryRun: options.dryRun || false,
    };
  }

  public parseArgv(argv: string[]): TestRunnerOptions {
    const opts: Partial<TestRunnerOptions> = {};
    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--verbose' || arg === '-v') opts.verbose = true;
      else if (arg === '--bail' || arg === '-b') opts.bail = true;
      else if (arg === '--strict' || arg === '-s') opts.strict = true;
      else if (arg === '--json' || arg === '-j') opts.json = true;
      else if (arg === '--tap') opts.tap = true;
      else if (arg === '--dry-run' || arg === '-d') opts.dryRun = true;
      else if (arg.startsWith('--tier=')) opts.tier = arg.split('=')[1] as any;
      else if ((arg === '--tier' || arg === '-t') && argv[i + 1]) opts.tier = argv[++i] as any;
      else if (arg.startsWith('--feature=')) opts.feature = arg.split('=')[1];
      else if ((arg === '--feature' || arg === '-f') && argv[i + 1]) opts.feature = argv[++i];
      else if (arg.startsWith('--filter=')) opts.filter = arg.split('=')[1];
      else if ((arg === '--filter' || arg === '-k') && argv[i + 1]) opts.filter = argv[++i];
      else if (arg.startsWith('--scenario=')) opts.scenario = arg.split('=')[1];
      else if (arg === '--scenario' && argv[i + 1]) opts.scenario = argv[++i];
      else if (arg.startsWith('--output=')) opts.output = arg.split('=')[1];
      else if ((arg === '--output' || arg === '-o') && argv[i + 1]) opts.output = argv[++i];
      else if (arg.startsWith('--timeout=')) opts.timeoutMs = parseInt(arg.split('=')[1], 10);
      else if (arg === '--timeout' && argv[i + 1]) opts.timeoutMs = parseInt(argv[++i], 10);
      else if (arg === '--help' || arg === '-h') {
        this.printHelp();
        process.exit(0);
      }
    }
    this.options = { ...this.options, ...opts };
    return this.options;
  }

  public printHelp(): void {
    console.log(`
V3 Narration & Karaoke Subsystem - Zero-Dependency E2E Test Runner

Usage:
  npx tsx tests/e2e/run-e2e-tests.ts [options]
  npm run test:v3 -- [options]

Options:
  -t, --tier=<1|2|3|4|all>   Target test tier (default: all)
  -f, --feature=<code>       Target specific feature code (e.g. F01, F15)
  -k, --filter=<regex>       Filter test name or ID by regular expression
      --scenario=<id>        Filter by scenario ID (e.g. T4-APP-01)
  -v, --verbose              Display verbose test logs and error stacks
  -b, --bail                 Halt execution immediately on first failure
  -s, --strict               Treat NOT_IMPLEMENTED as failure (exit code 1)
  -j, --json                 Output machine-readable JSON results
      --tap                  Output Test Anything Protocol (TAP v13)
  -o, --output=<path>        Save JSON summary to specified file
  -d, --dry-run              List matching tests without running them
  -h, --help                 Display this help message
`);
  }

  public async autoDiscoverSuites(baseDir: string): Promise<void> {
    const tierDirs = [
      { tier: '1', dir: 'tier1-features' },
      { tier: '2', dir: 'tier2-boundaries' },
      { tier: '3', dir: 'tier3-combinations' },
      { tier: '4', dir: 'tier4-applications' },
    ];

    for (const { tier, dir } of tierDirs) {
      if (this.options.tier !== 'all' && this.options.tier !== tier) {
        continue;
      }
      const fullDir = path.resolve(baseDir, dir);
      if (!fs.existsSync(fullDir)) continue;

      const files = fs
        .readdirSync(fullDir)
        .filter((f) => f.endsWith('.test.ts') || (f.endsWith('.ts') && !f.endsWith('.d.ts')))
        .sort();

      for (const file of files) {
        const filePath = path.join(fullDir, file);
        try {
          const fileUrl = url.pathToFileURL(filePath).href;
          const mod = await import(fileUrl);
          if (mod.suite && typeof mod.suite === 'object') {
            const existing = TestRegistry.getInstance().getSuites();
            if (!existing.includes(mod.suite)) {
              TestRegistry.getInstance().register(mod.suite);
            }
          } else if (mod.suites && Array.isArray(mod.suites)) {
            const existing = TestRegistry.getInstance().getSuites();
            for (const s of mod.suites) {
              if (!existing.includes(s)) {
                TestRegistry.getInstance().register(s);
              }
            }
          }
        } catch (err: any) {
          console.error(`Error loading test file ${filePath}:`, err.message);
        }
      }
    }
  }

  public async run(): Promise<RunSummary> {
    const startTime = performance.now();
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(url.fileURLToPath(import.meta.url));
    const testsDir = path.resolve(currentDir, '..');
    await this.autoDiscoverSuites(testsDir);

    const suites = TestRegistry.getInstance().getSuites();
    const allResults: TestResult[] = [];
    let bailed = false;

    // Filter matching suites & tests
    const filteredSuites: { suite: TestSuite; tests: TestCase[] }[] = [];
    for (const suite of suites) {
      if (this.options.tier !== 'all' && suite.tier.toString() !== this.options.tier.toString()) {
        continue;
      }
      if (this.options.feature && !suite.feature.toLowerCase().includes(this.options.feature.toLowerCase())) {
        continue;
      }

      const matchingTests = suite.tests.filter((t) => {
        if (this.options.tier !== 'all' && t.tier.toString() !== this.options.tier.toString()) return false;
        if (this.options.feature && !t.feature.toLowerCase().includes(this.options.feature.toLowerCase())) return false;
        if (this.options.scenario && !t.id.toLowerCase().includes(this.options.scenario.toLowerCase())) return false;
        if (this.options.filter) {
          const reg = new RegExp(this.options.filter, 'i');
          return reg.test(t.id) || reg.test(t.name);
        }
        return true;
      });

      if (matchingTests.length > 0) {
        filteredSuites.push({ suite, tests: matchingTests });
      }
    }

    if (!this.options.json && !this.options.tap) {
      this.printBanner();
    } else if (this.options.tap) {
      const totalCount = filteredSuites.reduce((acc, s) => acc + s.tests.length, 0);
      console.log('TAP version 13');
      console.log(`1..${totalCount}`);
    }

    let tapIndex = 1;

    for (const { suite, tests } of filteredSuites) {
      if (bailed) break;

      if (!this.options.json && !this.options.tap && this.options.verbose) {
        console.log(`\n\x1b[36m\x1b[1m[SUITE]\x1b[0m ${suite.name} (${suite.feature}) [Tier ${suite.tier}]`);
      }

      try {
        if (suite.beforeAll && !this.options.dryRun) {
          await suite.beforeAll();
        }
      } catch (err: any) {
        for (const test of tests) {
          allResults.push({
            id: test.id,
            name: test.name,
            feature: test.feature,
            tier: test.tier,
            status: 'FAIL',
            durationMs: 0,
            error: { message: `Suite beforeAll failed: ${err.message}`, stack: err.stack },
          });
        }
        continue;
      }

      for (const test of tests) {
        if (this.options.dryRun) {
          const res: TestResult = {
            id: test.id,
            name: test.name,
            feature: test.feature,
            tier: test.tier,
            status: 'SKIPPED',
            durationMs: 0,
            reason: 'dry-run',
          };
          allResults.push(res);
          continue;
        }

        const testResult = await this.executeTestCase(test, suite);
        allResults.push(testResult);

        if (!this.options.json && !this.options.tap) {
          this.printTestResult(testResult);
        } else if (this.options.tap) {
          this.printTapLine(testResult, tapIndex++);
        }

        if (testResult.status === 'FAIL' && this.options.bail) {
          bailed = true;
          break;
        }
      }

      try {
        if (suite.afterAll && !this.options.dryRun) {
          await suite.afterAll();
        }
      } catch (err: any) {
        console.error(`Suite afterAll error in ${suite.name}:`, err.message);
      }
    }

    const totalDurationMs = performance.now() - startTime;
    const summary = this.buildSummary(allResults, totalDurationMs);

    if (this.options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else if (!this.options.tap) {
      this.printMatrix(summary);
    }

    if (this.options.output) {
      const outDir = path.dirname(path.resolve(this.options.output));
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(this.options.output, JSON.stringify(summary, null, 2), 'utf-8');
    }

    return summary;
  }

  private async executeTestCase(test: TestCase, suite: TestSuite): Promise<TestResult> {
    const start = performance.now();
    const currentLog: string[] = [];
    const tempDirs: string[] = [];

    const ctx: TestContext = {
      testId: test.id,
      tier: test.tier,
      feature: test.feature,
      name: test.name,
      log: (...args: unknown[]) => {
        currentLog.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      },
      skip: (reason: string) => {
        throw new SkipError(reason);
      },
      notImplemented: (reason: string) => {
        throw new NotImplementedError(reason);
      },
      createTempDir: (prefix = 'e2e-tmp-') => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
        tempDirs.push(dir);
        return dir;
      },
      cleanupTempDirs: () => {
        for (const dir of tempDirs) {
          try {
            if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
          } catch {}
        }
      },
    };

    try {
      if (suite.beforeEach) await suite.beforeEach();

      const timeoutMs = test.timeoutMs || this.options.timeoutMs;
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Test timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        timer.unref?.();
      });

      await Promise.race([Promise.resolve(test.fn(ctx)), timeoutPromise]);

      if (suite.afterEach) await suite.afterEach();
      ctx.cleanupTempDirs();

      const durationMs = performance.now() - start;
      return {
        id: test.id,
        name: test.name,
        feature: test.feature,
        tier: test.tier,
        status: 'PASS',
        durationMs,
        logs: currentLog.length > 0 ? currentLog : undefined,
      };
    } catch (err: any) {
      const durationMs = performance.now() - start;
      ctx.cleanupTempDirs();
      try {
        if (suite.afterEach) await suite.afterEach();
      } catch {}

      if (err instanceof NotImplementedError) {
        return {
          id: test.id,
          name: test.name,
          feature: test.feature,
          tier: test.tier,
          status: 'NOT_IMPLEMENTED',
          durationMs,
          reason: err.message,
          logs: currentLog.length > 0 ? currentLog : undefined,
        };
      }

      if (err instanceof SkipError) {
        return {
          id: test.id,
          name: test.name,
          feature: test.feature,
          tier: test.tier,
          status: 'SKIPPED',
          durationMs,
          reason: err.message,
        };
      }

      return {
        id: test.id,
        name: test.name,
        feature: test.feature,
        tier: test.tier,
        status: 'FAIL',
        durationMs,
        error: {
          message: err.message || String(err),
          stack: err.stack,
          expected: err.expected,
          actual: err.actual,
        },
        logs: currentLog.length > 0 ? currentLog : undefined,
      };
    }
  }

  private printBanner(): void {
    console.log(`\x1b[1m\x1b[34m================================================================================\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m            V3 NARRATION & KARAOKE SUBSYSTEM - E2E TEST RUNNER\x1b[0m`);
    console.log(`\x1b[1m\x1b[34m================================================================================\x1b[0m`);
    console.log(
      `  Tier: \x1b[33m${this.options.tier}\x1b[0m | Feature: \x1b[33m${this.options.feature || 'all'}\x1b[0m | Filter: \x1b[33m${
        this.options.filter || this.options.scenario || 'none'
      }\x1b[0m | Strict: \x1b[33m${this.options.strict}\x1b[0m`
    );
    console.log(`--------------------------------------------------------------------------------`);
  }

  private printTestResult(res: TestResult): void {
    let tag = '';
    if (res.status === 'PASS') tag = '\x1b[32m\x1b[1m✓ PASS\x1b[0m';
    else if (res.status === 'FAIL') tag = '\x1b[31m\x1b[1m✗ FAIL\x1b[0m';
    else if (res.status === 'NOT_IMPLEMENTED') tag = '\x1b[33m\x1b[1m? PEND\x1b[0m';
    else tag = '\x1b[90m- SKIP\x1b[0m';

    const dur = `${res.durationMs.toFixed(1)}ms`.padStart(7);
    console.log(`  ${tag}  \x1b[90m[${res.id}]\x1b[0m ${res.name.padEnd(52)} \x1b[90m(${dur})\x1b[0m`);

    if (res.status === 'FAIL' && res.error) {
      console.log(`      \x1b[31mError: ${res.error.message}\x1b[0m`);
      if (res.error.expected !== undefined && res.error.actual !== undefined) {
        console.log(`      \x1b[32mExpected: ${JSON.stringify(res.error.expected)}\x1b[0m`);
        console.log(`      \x1b[31mActual:   ${JSON.stringify(res.error.actual)}\x1b[0m`);
      }
      if (this.options.verbose && res.error.stack) {
        console.log(`\x1b[90m${res.error.stack.split('\n').slice(1, 5).join('\n')}\x1b[0m`);
      }
    }
  }

  private printTapLine(res: TestResult, index: number): void {
    if (res.status === 'PASS') {
      console.log(`ok ${index} - [${res.id}] ${res.name}`);
    } else if (res.status === 'FAIL') {
      console.log(`not ok ${index} - [${res.id}] ${res.name}`);
      if (res.error) console.log(`  # ${res.error.message}`);
    } else if (res.status === 'NOT_IMPLEMENTED') {
      console.log(`ok ${index} - [${res.id}] ${res.name} # TODO ${res.reason || 'Not implemented'}`);
    } else {
      console.log(`ok ${index} - [${res.id}] ${res.name} # SKIP ${res.reason || 'Skipped'}`);
    }
  }

  private buildSummary(results: TestResult[], totalDurationMs: number): RunSummary {
    const tierMap: Record<number, TierSummary> = {
      1: { tier: 1, total: 0, passed: 0, failed: 0, notImplemented: 0, skipped: 0 },
      2: { tier: 2, total: 0, passed: 0, failed: 0, notImplemented: 0, skipped: 0 },
      3: { tier: 3, total: 0, passed: 0, failed: 0, notImplemented: 0, skipped: 0 },
      4: { tier: 4, total: 0, passed: 0, failed: 0, notImplemented: 0, skipped: 0 },
    };

    let passed = 0;
    let failed = 0;
    let notImplemented = 0;
    let skipped = 0;

    for (const r of results) {
      if (!tierMap[r.tier]) {
        tierMap[r.tier] = { tier: r.tier, total: 0, passed: 0, failed: 0, notImplemented: 0, skipped: 0 };
      }
      const t = tierMap[r.tier];
      t.total++;
      if (r.status === 'PASS') {
        t.passed++;
        passed++;
      } else if (r.status === 'FAIL') {
        t.failed++;
        failed++;
      } else if (r.status === 'NOT_IMPLEMENTED') {
        t.notImplemented++;
        notImplemented++;
      } else if (r.status === 'SKIPPED') {
        t.skipped++;
        skipped++;
      }
    }

    const success = failed === 0 && (!this.options.strict || notImplemented === 0);

    return {
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      total: results.length,
      passed,
      failed,
      notImplemented,
      skipped,
      success,
      tiers: Object.values(tierMap),
      results,
    };
  }

  private printMatrix(summary: RunSummary): void {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(` Tier                      Total   PASS   FAIL   PENDING   SKIP   Pass Rate`);
    console.log(`--------------------------------------------------------------------------------`);
    for (const t of summary.tiers) {
      const name = `Tier ${t.tier}`.padEnd(24);
      const tot = String(t.total).padStart(6);
      const pass = `\x1b[32m${String(t.passed).padStart(6)}\x1b[0m`;
      const fail = t.failed > 0 ? `\x1b[31m${String(t.failed).padStart(6)}\x1b[0m` : `     0`;
      const notImpl =
        t.notImplemented > 0 ? `\x1b[33m${String(t.notImplemented).padStart(9)}\x1b[0m` : `        0`;
      const skip = String(t.skipped).padStart(6);
      const rate = t.total > 0 ? `${((t.passed / t.total) * 100).toFixed(1)}%`.padStart(10) : '      N/A';
      console.log(` ${name} ${tot} ${pass} ${fail} ${notImpl} ${skip} ${rate}`);
    }
    console.log(`--------------------------------------------------------------------------------`);
    const totAll = String(summary.total).padStart(6);
    const passAll = `\x1b[32m${String(summary.passed).padStart(6)}\x1b[0m`;
    const failAll = summary.failed > 0 ? `\x1b[31m${String(summary.failed).padStart(6)}\x1b[0m` : `     0`;
    const pendAll =
      summary.notImplemented > 0 ? `\x1b[33m${String(summary.notImplemented).padStart(9)}\x1b[0m` : `        0`;
    const skipAll = String(summary.skipped).padStart(6);
    const rateAll =
      summary.total > 0 ? `${((summary.passed / summary.total) * 100).toFixed(1)}%`.padStart(10) : '      N/A';
    console.log(` \x1b[1mTotal                   \x1b[0m ${totAll} ${passAll} ${failAll} ${pendAll} ${skipAll} ${rateAll}`);
    console.log(`================================================================================`);

    if (summary.success) {
      if (summary.notImplemented > 0) {
        console.log(
          ` \x1b[33m\x1b[1mRESULT: PROGRESSIVE PASS\x1b[0m (${summary.passed} passed, ${summary.notImplemented} pending implementation for later milestones)`
        );
      } else {
        console.log(` \x1b[32m\x1b[1mRESULT: 100% COMPLETE PASS\x1b[0m (${summary.passed} passed, 0 failures)`);
      }
    } else {
      console.log(` \x1b[31m\x1b[1mRESULT: FAILED\x1b[0m (${summary.failed} failures encountered)`);
    }
  }
}
