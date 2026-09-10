/**
 * V3.3 E2E Test Suite Runner
 * Auto-discovery across tier1-features, tier2-boundaries, tier3-combinations, tier4-scenarios.
 * Supports: --tier=, --feature=, --filter=, --scenario=, --bail, --strict, --json, --tap, --output=
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TestRegistry,
  TestSuite,
  TestCase,
  TestResult,
  RunSummary,
  TierSummary,
  TestRunnerOptions,
  TestTier,
  TestContext,
  SkipTestError,
  NotImplementedError,
} from './test-context';

export class E2ERunner {
  private baseDir: string;
  private options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.options = {
      tier: 'all',
      verbose: true,
      bail: false,
      strict: false,
      json: false,
      tap: false,
      timeoutMs: 15000,
      ...options,
    };
    this.baseDir = path.resolve(__dirname, '..');
  }

  /**
   * Auto-discover and dynamically load test files
   */
  public async discover(): Promise<string[]> {
    const registry = TestRegistry.getInstance();
    registry.clear();

    const tier = this.options.tier || 'all';
    const targetDirs: Array<{ dirName: string; tierNum: TestTier }> = [];

    if (tier === '1' || tier === 'all') {
      targetDirs.push({ dirName: 'tier1-features', tierNum: 1 });
    }
    if (tier === '2' || tier === 'all') {
      targetDirs.push({ dirName: 'tier2-boundaries', tierNum: 2 });
    }
    if (tier === '3' || tier === 'all') {
      targetDirs.push({ dirName: 'tier3-combinations', tierNum: 3 });
    }
    if (tier === '4' || tier === 'all') {
      targetDirs.push({ dirName: 'tier4-scenarios', tierNum: 4 });
    }

    const loadedFiles: string[] = [];

    for (const { dirName } of targetDirs) {
      const fullDir = path.join(this.baseDir, dirName);
      if (!fs.existsSync(fullDir)) continue;

      const entries = fs.readdirSync(fullDir);
      for (const entry of entries) {
        if (entry.endsWith('.test.ts') || entry.endsWith('.test.js')) {
          // Check feature filter at file level if feature option is provided
          if (this.options.feature) {
            const featNormalized = this.options.feature.toLowerCase().replace(/[^a-z0-9]/g, '');
            const entryNormalized = entry.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!entryNormalized.includes(featNormalized)) {
              continue;
            }
          }

          const fullFilePath = path.join(fullDir, entry);
          try {
            // Dynamic import to register suites
            await import(fullFilePath);
            loadedFiles.push(fullFilePath);
          } catch (err: any) {
            console.error(`Error loading test file ${entry}:`, err);
            throw err;
          }
        }
      }
    }

    return loadedFiles;
  }

  /**
   * Execute registered test suites
   */
  public async run(): Promise<RunSummary> {
    await this.discover();

    const registry = TestRegistry.getInstance();
    const suites = registry.getSuites();
    const results: TestResult[] = [];
    const startTime = Date.now();

    let bailTriggered = false;

    for (const suite of suites) {
      if (bailTriggered) break;

      // Check tier filter
      if (this.options.tier && this.options.tier !== 'all') {
        const targetTier = parseInt(this.options.tier, 10);
        if (suite.tier !== targetTier) continue;
      }

      // Check feature filter
      if (this.options.feature) {
        const featTarget = this.options.feature.toLowerCase().replace(/[^a-z0-9]/g, '');
        const suiteFeat = suite.feature.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!suiteFeat.includes(featTarget)) continue;
      }

      // Run suite beforeAll
      if (suite.beforeAll) {
        try {
          await suite.beforeAll();
        } catch (err: any) {
          console.error(`Suite beforeAll failed in "${suite.name}":`, err);
        }
      }

      for (const testCase of suite.tests) {
        if (bailTriggered) break;

        // Check filter option
        if (this.options.filter) {
          const filterTerm = this.options.filter.toLowerCase();
          const match =
            testCase.name.toLowerCase().includes(filterTerm) ||
            testCase.id.toLowerCase().includes(filterTerm);
          if (!match) continue;
        }

        // Check scenario option
        if (this.options.scenario) {
          const scenTerm = this.options.scenario.toLowerCase();
          const match =
            testCase.id.toLowerCase().includes(scenTerm) ||
            testCase.name.toLowerCase().includes(scenTerm);
          if (!match) continue;
        }

        // Run suite beforeEach
        if (suite.beforeEach) {
          try {
            await suite.beforeEach();
          } catch (err: any) {
            console.error(`beforeEach failed in "${suite.name}":`, err);
          }
        }

        const testStart = Date.now();
        const logs: string[] = [];
        let status: 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT_IMPLEMENTED' = 'PASS';
        let errorDetail: any = undefined;
        let skipReason: string | undefined = undefined;

        const ctx: TestContext = {
          testId: testCase.id,
          log: (...args: unknown[]) => {
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          },
          skip: (reason: string) => {
            throw new SkipTestError(reason);
          },
          notImplemented: (reason: string) => {
            throw new NotImplementedError(reason);
          },
        };

        try {
          const testFn = testCase.fn || testCase.run;
          if (!testFn) {
            throw new NotImplementedError('No test implementation function provided');
          }

          const timeoutMs = testCase.timeoutMs || this.options.timeoutMs || 15000;
          await Promise.race([
            testFn(ctx),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs)
            ),
          ]);
        } catch (err: any) {
          if (err instanceof SkipTestError) {
            status = 'SKIPPED';
            skipReason = err.reason;
          } else if (err instanceof NotImplementedError) {
            status = 'NOT_IMPLEMENTED';
            skipReason = err.reason;
          } else {
            status = 'FAIL';
            errorDetail = {
              message: err?.message || String(err),
              stack: err?.stack,
              expected: err?.expected,
              actual: err?.actual,
            };
            if (this.options.bail) {
              bailTriggered = true;
            }
          }
        } finally {
          if (suite.afterEach) {
            try {
              await suite.afterEach();
            } catch (err: any) {
              console.error(`afterEach failed in "${suite.name}":`, err);
            }
          }
        }

        const durationMs = Date.now() - testStart;
        const result: TestResult = {
          id: testCase.id,
          name: testCase.name,
          feature: testCase.feature,
          tier: testCase.tier,
          status,
          durationMs,
          error: errorDetail,
          reason: skipReason,
          logs: logs.length > 0 ? logs : undefined,
        };

        results.push(result);
        this.printLiveResult(result);
      }

      // Run suite afterAll
      if (suite.afterAll) {
        try {
          await suite.afterAll();
        } catch (err: any) {
          console.error(`Suite afterAll failed in "${suite.name}":`, err);
        }
      }
    }

    const totalDurationMs = Date.now() - startTime;
    const summary = this.buildSummary(results, totalDurationMs);

    if (this.options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else if (this.options.tap) {
      this.printTap(results);
    } else {
      this.printSummaryTable(summary);
    }

    if (this.options.output) {
      try {
        const outPath = path.isAbsolute(this.options.output)
          ? this.options.output
          : path.resolve(process.cwd(), this.options.output);
        const parentDir = path.dirname(outPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
        console.log(`Summary report written to: ${outPath}`);
      } catch (err: any) {
        console.error(`Failed to write summary report to ${this.options.output}:`, err.message);
      }
    }

    return summary;
  }

  private printLiveResult(res: TestResult): void {
    if (this.options.json || this.options.tap) return;
    const badge =
      res.status === 'PASS'
        ? '\x1b[32m✔ PASS\x1b[0m'
        : res.status === 'FAIL'
        ? '\x1b[31m✖ FAIL\x1b[0m'
        : res.status === 'SKIPPED'
        ? '\x1b[33m⊘ SKIP\x1b[0m'
        : '\x1b[35m⏳ NOT_IMPL\x1b[0m';

    console.log(`  ${badge} [${res.id}] ${res.name} (${res.durationMs}ms)`);
    if (res.error) {
      console.log(`      \x1b[31m${res.error.message}\x1b[0m`);
    }
  }

  private printTap(results: TestResult[]): void {
    console.log('TAP version 13');
    console.log(`1..${results.length}`);
    results.forEach((res, i) => {
      const idx = i + 1;
      if (res.status === 'PASS') {
        console.log(`ok ${idx} - [${res.id}] ${res.name}`);
      } else if (res.status === 'FAIL') {
        console.log(`not ok ${idx} - [${res.id}] ${res.name}`);
        if (res.error) {
          console.log(`  ---`);
          console.log(`  message: "${res.error.message}"`);
          console.log(`  ...`);
        }
      } else if (res.status === 'SKIPPED') {
        console.log(`ok ${idx} - [${res.id}] ${res.name} # SKIP ${res.reason || ''}`);
      } else {
        console.log(`ok ${idx} - [${res.id}] ${res.name} # TODO ${res.reason || ''}`);
      }
    });
  }

  private printSummaryTable(summary: RunSummary): void {
    console.log('\n' + '='.repeat(70));
    console.log(`           V3.3 PRODUCTION INTEGRITY E2E TEST SUMMARY           `);
    console.log('='.repeat(70));
    console.log(`Timestamp:       ${summary.timestamp}`);
    console.log(`Total Duration:  ${(summary.durationMs / 1000).toFixed(2)}s`);
    console.log(`Total Tests:     ${summary.total}`);
    console.log(`Passed:          \x1b[32m${summary.passed}\x1b[0m`);
    console.log(`Failed:          ${summary.failed > 0 ? `\x1b[31m${summary.failed}\x1b[0m` : '0'}`);
    console.log(`Not Implemented: ${summary.notImplemented}`);
    console.log(`Skipped:         ${summary.skipped}`);
    console.log('-'.repeat(70));
    console.log('Tier Breakdown:');
    for (const t of summary.tiers) {
      console.log(
        `  Tier ${t.tier}: total ${t.total.toString().padStart(3)}, pass: \x1b[32m${t.passed
          .toString()
          .padStart(3)}\x1b[0m, fail: ${t.failed.toString().padStart(2)}, not_impl: ${t.notImplemented}`
      );
    }
    console.log('='.repeat(70));
    if (summary.success) {
      console.log(`\x1b[32m✔ OVERALL STATUS: PASS (All criteria satisfied)\x1b[0m\n`);
    } else {
      console.log(`\x1b[31m✖ OVERALL STATUS: FAIL (${summary.failed} test(s) failed)\x1b[0m\n`);
    }
  }

  private buildSummary(results: TestResult[], durationMs: number): RunSummary {
    let passed = 0;
    let failed = 0;
    let notImplemented = 0;
    let skipped = 0;

    const tierMap = new Map<number, TierSummary>();
    for (let t = 1; t <= 4; t++) {
      tierMap.set(t, {
        tier: t,
        total: 0,
        passed: 0,
        failed: 0,
        notImplemented: 0,
        skipped: 0,
      });
    }

    for (const r of results) {
      const tSum = tierMap.get(r.tier) || {
        tier: r.tier,
        total: 0,
        passed: 0,
        failed: 0,
        notImplemented: 0,
        skipped: 0,
      };
      tSum.total++;

      switch (r.status) {
        case 'PASS':
          passed++;
          tSum.passed++;
          break;
        case 'FAIL':
          failed++;
          tSum.failed++;
          break;
        case 'NOT_IMPLEMENTED':
          notImplemented++;
          tSum.notImplemented++;
          break;
        case 'SKIPPED':
          skipped++;
          tSum.skipped++;
          break;
      }
      tierMap.set(r.tier, tSum);
    }

    const tiers = Array.from(tierMap.values()).filter((t) => t.total > 0);
    const success = this.options.strict
      ? failed === 0 && notImplemented === 0
      : failed === 0;

    return {
      timestamp: new Date().toISOString(),
      durationMs,
      total: results.length,
      passed,
      failed,
      notImplemented,
      skipped,
      success,
      tiers,
      results,
    };
  }
}
