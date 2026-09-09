/**
 * Zero-Dependency Assertion Helpers for V2 Motion Animation E2E Test Suite
 */

import * as assert from 'node:assert/strict';

export class NotImplementedError extends Error {
  constructor(message: string = 'Feature or export not yet implemented') {
    super(message);
    this.name = 'NotImplementedError';
  }
}

export class CustomAssertionError extends Error {
  public expected: unknown;
  public actual: unknown;

  constructor(message: string, expected?: unknown, actual?: unknown) {
    super(message);
    this.name = 'CustomAssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Basic boolean condition assert
 */
export function assertTrue(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new CustomAssertionError(message || 'Expected condition to be truthy', true, condition);
  }
}

export function assertFalse(condition: unknown, message?: string): void {
  if (condition) {
    throw new CustomAssertionError(message || 'Expected condition to be falsy', false, condition);
  }
}

/**
 * Strict equality assert
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    assert.strictEqual(actual, expected, message);
  } catch (err: any) {
    throw new CustomAssertionError(message || `Strict equality failed`, expected, actual);
  }
}

export function assertNotEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    assert.notStrictEqual(actual, expected, message);
  } catch (err: any) {
    throw new CustomAssertionError(message || `Expected values not to equal`, expected, actual);
  }
}

/**
 * Deep structural equality assert
 */
export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    assert.deepStrictEqual(actual, expected, message);
  } catch (err: any) {
    throw new CustomAssertionError(message || `Deep equality mismatch`, expected, actual);
  }
}

/**
 * Floating point tolerance assertion (Critical for Bezier, Camera, Easing math)
 */
export function assertClose(
  actual: number,
  expected: number,
  tolerance: number = 1e-4,
  message?: string
): void {
  if (typeof actual !== 'number' || isNaN(actual)) {
    throw new CustomAssertionError(
      message || `assertClose expected numeric actual, received ${actual}`,
      expected,
      actual
    );
  }
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new CustomAssertionError(
      message || `Value ${actual} not close to ${expected} within tolerance ${tolerance} (diff: ${diff})`,
      expected,
      actual
    );
  }
}

/**
 * 2D Point coordinate tolerance assert [x, y] or { x, y }
 */
export function assertPointClose(
  actual: [number, number] | { x: number; y: number },
  expected: [number, number] | { x: number; y: number },
  tolerance: number = 1e-4,
  message?: string
): void {
  const ax = Array.isArray(actual) ? actual[0] : actual.x;
  const ay = Array.isArray(actual) ? actual[1] : actual.y;
  const ex = Array.isArray(expected) ? expected[0] : expected.x;
  const ey = Array.isArray(expected) ? expected[1] : expected.y;

  const dx = Math.abs(ax - ex);
  const dy = Math.abs(ay - ey);

  if (dx > tolerance || dy > tolerance) {
    throw new CustomAssertionError(
      message || `Point [${ax}, ${ay}] not close to [${ex}, ${ey}] (diff: dx=${dx}, dy=${dy}, tol=${tolerance})`,
      [ex, ey],
      [ax, ay]
    );
  }
}

/**
 * Array of numbers floating point tolerance
 */
export function assertArrayClose(
  actual: number[],
  expected: number[],
  tolerance: number = 1e-4,
  message?: string
): void {
  assertEqual(actual.length, expected.length, message || `Array lengths differ`);
  for (let i = 0; i < actual.length; i++) {
    assertClose(actual[i], expected[i], tolerance, `${message || ''} at index [${i}]`);
  }
}

/**
 * Range assertion [min, max] inclusive
 */
export function assertInRange(actual: number, min: number, max: number, message?: string): void {
  if (actual < min || actual > max) {
    throw new CustomAssertionError(
      message || `Value ${actual} out of range [${min}, ${max}]`,
      `[${min}, ${max}]`,
      actual
    );
  }
}

/**
 * Synchronous exception assert
 */
export function assertThrows(block: () => unknown, expectedError?: RegExp | string, message?: string): void {
  let threw = false;
  let errorCaught: any = null;
  try {
    block();
  } catch (err: any) {
    threw = true;
    errorCaught = err;
    if (expectedError instanceof RegExp) {
      assertTrue(expectedError.test(err.message), `Expected error matching ${expectedError}, got "${err.message}"`);
    } else if (typeof expectedError === 'string') {
      assertTrue(err.message.includes(expectedError), `Expected error containing "${expectedError}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new CustomAssertionError(message || `Expected block to throw an error, but it did not`);
  }
}

/**
 * Asynchronous promise rejection assert
 */
export async function assertRejects(
  block: () => Promise<unknown>,
  expectedError?: RegExp | string,
  message?: string
): Promise<void> {
  let threw = false;
  try {
    await block();
  } catch (err: any) {
    threw = true;
    if (expectedError instanceof RegExp) {
      assertTrue(expectedError.test(err.message), `Expected rejection matching ${expectedError}, got "${err.message}"`);
    } else if (typeof expectedError === 'string') {
      assertTrue(err.message.includes(expectedError), `Expected rejection containing "${expectedError}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new CustomAssertionError(message || `Expected promise to reject, but it resolved successfully`);
  }
}

export const assertThrowsAsync = assertRejects;

/**
 * Lightweight structural schema validator
 */
export function assertSchema(
  data: any,
  rules: Record<string, string | ((val: any) => boolean)>,
  message?: string
): void {
  assertTrue(typeof data === 'object' && data !== null, message || `Expected object data for schema check`);
  for (const [key, rule] of Object.entries(rules)) {
    assertTrue(key in data, message || `Missing required schema key: "${key}"`);
    const val = data[key];
    if (typeof rule === 'string') {
      assertEqual(typeof val, rule, message || `Property "${key}" type mismatch: expected ${rule}, got ${typeof val}`);
    } else if (typeof rule === 'function') {
      assertTrue(rule(val), message || `Validation failed for key "${key}"`);
    }
  }
}

/**
 * Lightweight JSON schema validation assert
 */
export function assertValidJsonSchema(data: any, schema: any, message?: string): void {
  assertTrue(typeof data === 'object' && data !== null, message || `Expected object data for schema check`);
  if (schema && typeof schema === 'object' && Array.isArray(schema.required)) {
    for (const reqKey of schema.required) {
      assertTrue(reqKey in data, message || `Missing required schema property: "${reqKey}"`);
    }
  }
}

/**
 * Mark a test as not yet implemented for the current milestone
 */
export function assertNotImplemented(reason: string = 'Feature not implemented'): never {
  throw new NotImplementedError(reason);
}
