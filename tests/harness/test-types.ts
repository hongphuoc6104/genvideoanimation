/**
 * Test types and harness interfaces for V2 Motion Animation System E2E Suite
 */

export type TestTier = 1 | 2 | 3 | 4;
export type TestStatus = 'PASS' | 'FAIL' | 'NOT_IMPLEMENTED' | 'SKIPPED';

export interface TestContext {
  testId: string;
  log: (...args: unknown[]) => void;
  skip: (reason: string) => void;
  notImplemented: (reason: string) => void;
}

export interface TestCase {
  id: string;                          // Unique ID e.g. "T1-BEZ-001", "T3-COMB-01", "T4-SCEN-01"
  name: string;                        // Human readable description
  feature: string;                     // Primary feature code e.g. "F-BEZIER-MATH"
  tier: TestTier;                      // 1, 2, 3, or 4
  description?: string;                // Detailed test scenario intent
  timeoutMs?: number;                  // Optional per-test override
  fn?: (ctx: TestContext) => void | Promise<void>;
  run?: (ctx?: TestContext) => void | Promise<void>; // Optional alias for compatibility
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
  output?: string;
  timeoutMs: number;
  dryRun: boolean;
}
