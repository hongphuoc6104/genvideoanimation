/**
 * V3.3 E2E Test Harness — Context, Registry and Types
 * Authoritative interface definitions for Tier 1 through Tier 4 test suites.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';

export type TestTier = 1 | 2 | 3 | 4;
export type TestStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT_IMPLEMENTED';

export interface TestContext {
  testId: string;
  log: (...args: unknown[]) => void;
  skip: (reason: string) => void;
  notImplemented: (reason: string) => void;
}

export interface TestCase {
  id: string;
  name: string;
  feature: string;
  tier: TestTier;
  description?: string;
  timeoutMs?: number;
  fn?: (ctx: TestContext) => void | Promise<void>;
  run?: (ctx: TestContext) => void | Promise<void>;
}

export interface TestSuite {
  name: string;
  feature: string;
  tier: TestTier;
  file?: string;
  tests: TestCase[];
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
}

export interface TestErrorDetail {
  message: string;
  stack?: string;
  expected?: unknown;
  actual?: unknown;
}

export interface TestResult {
  id: string;
  name: string;
  feature: string;
  tier: TestTier;
  status: TestStatus;
  durationMs: number;
  error?: TestErrorDetail;
  reason?: string;
  logs?: string[];
}

export interface TierSummary {
  tier: number;
  total: number;
  passed: number;
  failed: number;
  notImplemented: number;
  skipped: number;
}

export interface RunSummary {
  timestamp: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  notImplemented: number;
  skipped: number;
  success: boolean;
  tiers: TierSummary[];
  results: TestResult[];
}

export interface TestRunnerOptions {
  tier?: '1' | '2' | '3' | '4' | 'all';
  feature?: string;
  filter?: string;
  scenario?: string;
  bail?: boolean;
  strict?: boolean;
  json?: boolean;
  tap?: boolean;
  output?: string;
  timeoutMs?: number;
  verbose?: boolean;
}

export class SkipTestError extends Error {
  constructor(public reason: string) {
    super(`Test skipped: ${reason}`);
    this.name = 'SkipTestError';
  }
}

export class NotImplementedError extends Error {
  constructor(public reason: string = 'Feature not implemented') {
    super(`Not implemented: ${reason}`);
    this.name = 'NotImplementedError';
  }
}

/**
 * Global Registry Singleton
 */
export class TestRegistry {
  private static instance: TestRegistry;
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;
  private testCounter: number = 0;

  private constructor() {}

  public static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  public registerSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  public getSuites(): TestSuite[] {
    return this.suites;
  }

  public clear(): void {
    this.suites = [];
    this.currentSuite = null;
    this.testCounter = 0;
  }

  public setCurrentSuite(suite: TestSuite | null): void {
    this.currentSuite = suite;
  }

  public getCurrentSuite(): TestSuite | null {
    return this.currentSuite;
  }

  public nextTestId(tier: TestTier, feature: string): string {
    this.testCounter++;
    const prefix = `T${tier}-${feature}`;
    return `${prefix}-${String(this.testCounter).padStart(3, '0')}`;
  }
}

/**
 * Suite declaration
 */
export interface DescribeOptions {
  name: string;
  feature: string;
  tier: TestTier;
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
}

export function describe(
  optionsOrName: string | DescribeOptions,
  fnOrOptions?: (() => void) | Partial<DescribeOptions>,
  maybeFn?: () => void
): TestSuite {
  let name = '';
  let feature = 'GENERAL';
  let tier: TestTier = 1;
  let fn: (() => void) | undefined;
  let hooks: Partial<DescribeOptions> = {};

  if (typeof optionsOrName === 'string') {
    name = optionsOrName;
    if (typeof fnOrOptions === 'function') {
      fn = fnOrOptions;
    } else if (typeof fnOrOptions === 'object' && fnOrOptions !== null) {
      feature = fnOrOptions.feature || feature;
      tier = fnOrOptions.tier || tier;
      hooks = fnOrOptions;
      fn = maybeFn;
    }
  } else {
    name = optionsOrName.name;
    feature = optionsOrName.feature;
    tier = optionsOrName.tier;
    hooks = optionsOrName;
    fn = typeof fnOrOptions === 'function' ? fnOrOptions : maybeFn;
  }

  const suite: TestSuite = {
    name,
    feature,
    tier,
    tests: [],
    beforeAll: hooks.beforeAll,
    afterAll: hooks.afterAll,
    beforeEach: hooks.beforeEach,
    afterEach: hooks.afterEach,
  };

  const registry = TestRegistry.getInstance();
  const prevSuite = registry.getCurrentSuite();
  registry.setCurrentSuite(suite);

  if (fn) {
    fn();
  }

  registry.setCurrentSuite(prevSuite);
  registry.registerSuite(suite);
  return suite;
}

/**
 * Test case declaration
 */
export interface TestOptions {
  id?: string;
  description?: string;
  timeoutMs?: number;
  feature?: string;
  tier?: TestTier;
}

export function test(
  name: string,
  fn: (ctx: TestContext) => void | Promise<void>,
  options: TestOptions = {}
): TestCase {
  const registry = TestRegistry.getInstance();
  const currentSuite = registry.getCurrentSuite();

  const feature = options.feature || currentSuite?.feature || 'GENERAL';
  const tier = options.tier || currentSuite?.tier || 1;
  const id = options.id || registry.nextTestId(tier, feature);

  const testCase: TestCase = {
    id,
    name,
    feature,
    tier,
    description: options.description,
    timeoutMs: options.timeoutMs,
    fn,
    run: fn,
  };

  if (currentSuite) {
    currentSuite.tests.push(testCase);
  }

  return testCase;
}

export const it = test;

/**
 * Safely resolves an optional module or file from disk
 */
export function resolveOptionalModule<T = any>(modulePath: string): T | null {
  try {
    const fullPath = path.isAbsolute(modulePath)
      ? modulePath
      : path.resolve(process.cwd(), modulePath);

    if (fs.existsSync(fullPath)) {
      // Use dynamic require or import
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(fullPath) as T;
    }
    return null;
  } catch {
    return null;
  }
}
