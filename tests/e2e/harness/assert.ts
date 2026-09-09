/**
 * tests/e2e/harness/assert.ts
 * Strict Zero-Dependency Assertion Helpers for V3 Narration & Karaoke Subsystem
 */

import * as assert from 'node:assert/strict';
export { assert };

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

export class NotImplementedError extends Error {
  constructor(message: string = 'Feature or export not yet implemented') {
    super(message);
    this.name = 'NotImplementedError';
  }
}

export class SkipError extends Error {
  constructor(message: string = 'Test skipped') {
    super(message);
    this.name = 'SkipError';
  }
}

// Boolean conditions
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

// Strict equality
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    if (message) {
      assert.strictEqual(actual, expected, message);
    } else {
      assert.strictEqual(actual, expected);
    }
  } catch (err: any) {
    throw new CustomAssertionError(message || `Strict equality failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, expected, actual);
  }
}

export function assertNotEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    if (message) {
      assert.notStrictEqual(actual, expected, message);
    } else {
      assert.notStrictEqual(actual, expected);
    }
  } catch (err: any) {
    throw new CustomAssertionError(message || `Expected values not to equal`, expected, actual);
  }
}

// Deep structural equality
export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    if (message) {
      assert.deepStrictEqual(actual, expected, message);
    } else {
      assert.deepStrictEqual(actual, expected);
    }
  } catch (err: any) {
    throw new CustomAssertionError(message || `Deep equality mismatch`, expected, actual);
  }
}

// Floating point & numerical precision
export function assertClose(
  actual: number,
  expected: number,
  tolerance: number = 1e-3,
  message?: string
): void {
  if (typeof actual !== 'number' || Number.isNaN(actual)) {
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

export function assertArrayClose(
  actual: number[],
  expected: number[],
  tolerance: number = 1e-3,
  message?: string
): void {
  assertEqual(actual.length, expected.length, message || `Array lengths differ`);
  for (let i = 0; i < actual.length; i++) {
    assertClose(actual[i], expected[i], tolerance, `${message || ''} at index [${i}]`);
  }
}

export function assertInRange(
  actual: number,
  min: number,
  max: number,
  message?: string
): void {
  if (actual < min || actual > max) {
    throw new CustomAssertionError(
      message || `Value ${actual} out of range [${min}, ${max}]`,
      `[${min}, ${max}]`,
      actual
    );
  }
}

// Temporal Monotonicity & Timing Constraints
export function assertMonotonic(
  numbers: number[],
  strict: boolean = true,
  message?: string
): void {
  for (let i = 1; i < numbers.length; i++) {
    const prev = numbers[i - 1];
    const curr = numbers[i];
    const valid = strict ? curr > prev : curr >= prev;
    if (!valid) {
      throw new CustomAssertionError(
        message || `Sequence not monotonic at index ${i}: prev=${prev}, curr=${curr} (strict=${strict})`,
        strict ? `> ${prev}` : `>= ${prev}`,
        curr
      );
    }
  }
}

export function assertNoOverlap(
  intervals: Array<{ start: number; end: number; id?: string }>,
  message?: string
): void {
  for (let i = 1; i < intervals.length; i++) {
    const prev = intervals[i - 1];
    const curr = intervals[i];
    if (curr.start < prev.end - 1e-4) {
      throw new CustomAssertionError(
        message || `Interval overlap detected between [${prev.start}, ${prev.end}] (${prev.id || i - 1}) and [${curr.start}, ${curr.end}] (${curr.id || i})`,
        `start >= ${prev.end}`,
        curr.start
      );
    }
  }
}

// Exceptions
export function assertThrows(
  block: () => unknown,
  expected?: RegExp | string | Function,
  message?: string
): void {
  let threw = false;
  let caught: any = null;
  try {
    block();
  } catch (err: any) {
    threw = true;
    caught = err;
    if (expected instanceof RegExp) {
      assertTrue(expected.test(err.message), `Expected error matching ${expected}, got "${err.message}"`);
    } else if (typeof expected === 'string') {
      assertTrue(err.message.includes(expected), `Expected error containing "${expected}", got "${err.message}"`);
    } else if (typeof expected === 'function') {
      assertTrue(err instanceof expected, `Expected error instanceof ${expected.name}, got ${err.name}`);
    }
  }
  if (!threw) {
    throw new CustomAssertionError(message || `Expected block to throw an error, but it did not`);
  }
}

export async function assertAsyncThrows(
  block: () => Promise<unknown>,
  expected?: RegExp | string | Function,
  message?: string
): Promise<void> {
  let threw = false;
  try {
    await block();
  } catch (err: any) {
    threw = true;
    if (expected instanceof RegExp) {
      assertTrue(expected.test(err.message), `Expected rejection matching ${expected}, got "${err.message}"`);
    } else if (typeof expected === 'string') {
      assertTrue(err.message.includes(expected), `Expected rejection containing "${expected}", got "${err.message}"`);
    } else if (typeof expected === 'function') {
      assertTrue(err instanceof expected, `Expected rejection instanceof ${expected.name}, got ${err.name}`);
    }
  }
  if (!threw) {
    throw new CustomAssertionError(message || `Expected promise to reject, but it resolved successfully`);
  }
}
export const assertRejects = assertAsyncThrows;

// Structural Schema Assertions
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

// RIFF/WAV Header Validation
export function assertWavHeader(
  buffer: Buffer,
  expectedSampleRate: number = 24000,
  expectedChannels: number = 1,
  expectedBitsPerSample: number = 16
): void {
  assertTrue(buffer.length >= 44, `WAV buffer too small: ${buffer.length} bytes (minimum 44 bytes)`);
  assertEqual(buffer.toString('ascii', 0, 4), 'RIFF', 'Missing RIFF magic');
  assertEqual(buffer.toString('ascii', 8, 12), 'WAVE', 'Missing WAVE format');
  assertEqual(buffer.toString('ascii', 12, 16), 'fmt ', 'Missing fmt chunk marker');

  const audioFormat = buffer.readUInt16LE(20);
  assertEqual(audioFormat, 1, `Expected PCM audio format (1), received ${audioFormat}`);

  const numChannels = buffer.readUInt16LE(22);
  assertEqual(numChannels, expectedChannels, `Channels mismatch: expected ${expectedChannels}, received ${numChannels}`);

  const sampleRate = buffer.readUInt32LE(24);
  assertEqual(sampleRate, expectedSampleRate, `Sample rate mismatch: expected ${expectedSampleRate}Hz, received ${sampleRate}Hz`);

  const bitsPerSample = buffer.readUInt16LE(34);
  assertEqual(bitsPerSample, expectedBitsPerSample, `Bits per sample mismatch: expected ${expectedBitsPerSample}, received ${bitsPerSample}`);
}

export function assertNotImplemented(reason: string = 'Feature not implemented'): never {
  throw new NotImplementedError(reason);
}
