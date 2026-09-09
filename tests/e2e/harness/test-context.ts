/**
 * tests/e2e/harness/test-context.ts
 * Lifecycle, Registry, Types, and Progressive Resolution for V3 E2E Test Suite
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { NotImplementedError, SkipError } from './assert';

export type TestTier = 1 | 2 | 3 | 4;
export type TestStatus = 'PASS' | 'FAIL' | 'NOT_IMPLEMENTED' | 'SKIPPED';

export interface TestContext {
  testId: string;
  tier: TestTier;
  feature: string;
  name: string;
  log: (...args: unknown[]) => void;
  skip: (reason: string) => void;
  notImplemented: (reason: string) => void;
  createTempDir: (prefix?: string) => string;
  cleanupTempDirs: () => void;
}

export interface TestCase {
  id: string;                          // e.g. "T1-F01-01", "T2-F15-03", "T3-COMB-01", "T4-APP-01"
  name: string;                        // Clear human-readable description
  feature: string;                     // Feature code e.g. "F01", "F15", "F08+F12", "Scenario-01"
  tier: TestTier;                      // 1, 2, 3, or 4
  description?: string;                // Detailed requirement intent
  timeoutMs?: number;                  // Per-test timeout override (default: 5000ms)
  fn: (ctx: TestContext) => void | Promise<void>;
}

export interface TestSuite {
  name: string;
  feature: string;
  tier: TestTier;
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
  telemetry?: Record<string, unknown>;
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
  tier: '1' | '2' | '3' | '4' | 'all';
  feature?: string;
  filter?: string;
  scenario?: string;
  verbose: boolean;
  bail: boolean;
  strict: boolean;
  json: boolean;
  tap: boolean;
  output?: string;
  timeoutMs: number;
  dryRun: boolean;
}

/**
 * Singleton Test Registry
 */
export class TestRegistry {
  private static instance: TestRegistry;
  private suites: TestSuite[] = [];

  private constructor() {}

  public static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  public register(suite: TestSuite): void {
    if (!this.suites.includes(suite)) {
      this.suites.push(suite);
    }
  }

  public getSuites(): TestSuite[] {
    return this.suites;
  }

  public clear(): void {
    this.suites = [];
  }
}

export function registerSuite(suite: TestSuite): void {
  TestRegistry.getInstance().register(suite);
}

let activeSuite: TestSuite | null = null;

export function describe(name: string, fn: () => void, options?: { feature?: string; tier?: TestTier }): TestSuite {
  const s: TestSuite = {
    name,
    feature: options?.feature || '',
    tier: options?.tier || 1,
    tests: [],
  };
  const prev = activeSuite;
  activeSuite = s;
  try {
    fn();
  } finally {
    activeSuite = prev;
  }
  registerSuite(s);
  return s;
}

export function test(
  name: string,
  fn: (ctx: TestContext) => void | Promise<void>,
  options?: { id?: string; feature?: string; tier?: TestTier; timeoutMs?: number }
): TestCase {
  const tc: TestCase = {
    id: options?.id || name,
    name,
    feature: options?.feature || activeSuite?.feature || '',
    tier: options?.tier || activeSuite?.tier || 1,
    timeoutMs: options?.timeoutMs,
    fn,
  };
  if (activeSuite) {
    activeSuite.tests.push(tc);
  }
  return tc;
}

/**
 * Progressive Resolution Helper: Safely imports modules that may not exist in early milestones.
 */
export async function resolveOptionalModule<T = any>(modulePath: string): Promise<T | null> {
  try {
    return await import(modulePath);
  } catch (err: any) {
    if (
      err.code === 'ERR_MODULE_NOT_FOUND' ||
      err.code === 'MODULE_NOT_FOUND' ||
      (typeof err.message === 'string' && err.message.includes('Cannot find module'))
    ) {
      return null;
    }
    // If it's a syntax or runtime error in an existing file, rethrow to avoid masking genuine bugs!
    throw err;
  }
}

