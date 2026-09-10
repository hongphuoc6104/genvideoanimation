/**
 * Strict Zero-Dependency Assertion Engine for V3.3 E2E Test Framework
 */

import * as assert from 'node:assert/strict';

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
 * Asserts truthiness
 */
export function assertTrue(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new CustomAssertionError(
      message || 'Expected condition to be truthy, got falsy value',
      true,
      condition
    );
  }
}

/**
 * Asserts falsiness
 */
export function assertFalse(condition: unknown, message?: string): void {
  if (condition) {
    throw new CustomAssertionError(
      message || 'Expected condition to be falsy, got truthy value',
      false,
      condition
    );
  }
}

/**
 * Strict equality
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    assert.strictEqual(actual, expected, message);
  } catch {
    throw new CustomAssertionError(
      message || `Strict equality failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      expected,
      actual
    );
  }
}

/**
 * Strict inequality
 */
export function assertNotEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    assert.notStrictEqual(actual, expected, message);
  } catch {
    throw new CustomAssertionError(
      message || `Expected values NOT to strictly equal: ${JSON.stringify(actual)}`,
      expected,
      actual
    );
  }
}

/**
 * Deep structural equality
 */
export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  try {
    assert.deepStrictEqual(actual, expected, message);
  } catch (err: any) {
    throw new CustomAssertionError(
      message || `Deep structural equality mismatch: ${err.message}`,
      expected,
      actual
    );
  }
}

/**
 * Floating point close comparison
 */
export function assertClose(
  actual: number,
  expected: number,
  tolerance: number = 1e-4,
  message?: string
): void {
  if (typeof actual !== 'number' || Number.isNaN(actual)) {
    throw new CustomAssertionError(
      message || `assertClose expected numeric actual value, received ${actual}`,
      expected,
      actual
    );
  }
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new CustomAssertionError(
      message || `Value ${actual} is not close to ${expected} within tolerance ${tolerance} (diff: ${diff})`,
      expected,
      actual
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
  assertEqual(actual.length, expected.length, message || `Array lengths differ: actual ${actual.length}, expected ${expected.length}`);
  for (let i = 0; i < actual.length; i++) {
    assertClose(actual[i], expected[i], tolerance, `${message || ''} at index [${i}]`);
  }
}

/**
 * Inclusive range assertion [min, max]
 */
export function assertInRange(
  actual: number,
  min: number,
  max: number,
  message?: string
): void {
  if (typeof actual !== 'number' || Number.isNaN(actual) || actual < min || actual > max) {
    throw new CustomAssertionError(
      message || `Value ${actual} out of expected range [${min}, ${max}]`,
      `[${min}, ${max}]`,
      actual
    );
  }
}

/**
 * Monotonic sequence assertion
 */
export type MonotonicDirection = 'increasing' | 'strictly-increasing' | 'decreasing' | 'strictly-decreasing';

export function assertMonotonic(
  arr: number[],
  direction: MonotonicDirection = 'increasing',
  message?: string
): void {
  if (!Array.isArray(arr) || arr.length <= 1) {
    return;
  }

  for (let i = 0; i < arr.length - 1; i++) {
    const a = arr[i];
    const b = arr[i + 1];
    let ok = false;
    switch (direction) {
      case 'increasing':
        ok = b >= a;
        break;
      case 'strictly-increasing':
        ok = b > a;
        break;
      case 'decreasing':
        ok = b <= a;
        break;
      case 'strictly-decreasing':
        ok = b < a;
        break;
    }
    if (!ok) {
      throw new CustomAssertionError(
        message || `Sequence violation (${direction}) at indices [${i}] (${a}) and [${i + 1}] (${b})`,
        direction,
        arr
      );
    }
  }
}

/**
 * Disjoint intervals assertion (ensures no pairwise overlap)
 */
export function assertNoOverlap(
  intervals: Array<[number, number]> | Array<{ start: number; end: number }>,
  message?: string
): void {
  if (!Array.isArray(intervals) || intervals.length <= 1) {
    return;
  }

  // Normalize to sorted pairs [start, end]
  const normalized: Array<{ start: number; end: number; originalIndex: number }> = intervals.map(
    (item, idx) => {
      if (Array.isArray(item)) {
        return { start: item[0], end: item[1], originalIndex: idx };
      }
      return { start: item.start, end: item.end, originalIndex: idx };
    }
  );

  normalized.sort((a, b) => a.start - b.start || a.end - b.end);

  for (let i = 0; i < normalized.length - 1; i++) {
    const curr = normalized[i];
    const next = normalized[i + 1];
    if (curr.end > next.start) {
      throw new CustomAssertionError(
        message ||
          `Interval overlap detected: interval #${curr.originalIndex} [${curr.start}, ${curr.end}] overlaps interval #${next.originalIndex} [${next.start}, ${next.end}]`,
        'no overlap',
        { conflict: [curr, next] }
      );
    }
  }
}

/**
 * Synchronous error assertion
 */
export function assertThrows(
  block: () => unknown,
  expectedError?: RegExp | string,
  message?: string
): void {
  let threw = false;
  let caught: any = null;
  try {
    block();
  } catch (err: any) {
    threw = true;
    caught = err;
    if (expectedError instanceof RegExp) {
      assertTrue(
        expectedError.test(err.message || String(err)),
        `Expected error matching ${expectedError}, received "${err.message || String(err)}"`
      );
    } else if (typeof expectedError === 'string') {
      assertTrue(
        (err.message || String(err)).includes(expectedError),
        `Expected error containing "${expectedError}", received "${err.message || String(err)}"`
      );
    }
  }
  if (!threw) {
    throw new CustomAssertionError(message || 'Expected block to throw an error, but it did not');
  }
}

/**
 * Asynchronous rejection assertion
 */
export async function assertAsyncThrows(
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
      assertTrue(
        expectedError.test(err.message || String(err)),
        `Expected rejection matching ${expectedError}, received "${err.message || String(err)}"`
      );
    } else if (typeof expectedError === 'string') {
      assertTrue(
        (err.message || String(err)).includes(expectedError),
        `Expected rejection containing "${expectedError}", received "${err.message || String(err)}"`
      );
    }
  }
  if (!threw) {
    throw new CustomAssertionError(message || 'Expected async promise to reject, but it resolved');
  }
}

/**
 * Flexible structural schema validation
 */
export function assertSchema(
  data: any,
  rules: Record<string, string | ((val: any) => boolean)>,
  message?: string
): void {
  assertTrue(typeof data === 'object' && data !== null, message || 'Expected non-null object for schema assertion');
  for (const [key, rule] of Object.entries(rules)) {
    assertTrue(key in data, message || `Missing required property "${key}" in schema`);
    const val = data[key];
    if (typeof rule === 'string') {
      assertEqual(
        typeof val,
        rule,
        message || `Property "${key}" type mismatch: expected ${rule}, got ${typeof val}`
      );
    } else if (typeof rule === 'function') {
      assertTrue(
        rule(val),
        message || `Property "${key}" failed custom validation function with value: ${JSON.stringify(val)}`
      );
    }
  }
}

/**
 * Physical RIFF WAV Header Parser & Assertion
 */
export interface ParsedWavHeader {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationSec: number;
  byteRate: number;
  audioFormat: number;
  dataSize: number;
}

export function assertWavHeader(
  buffer: Buffer,
  expected?: {
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
    minDurationSec?: number;
  },
  message?: string
): ParsedWavHeader {
  assertTrue(
    Buffer.isBuffer(buffer) && buffer.length >= 44,
    message || `Expected WAV buffer with length >= 44 bytes, received ${buffer?.length || 0} bytes`
  );

  const riff = buffer.subarray(0, 4).toString('ascii');
  const wave = buffer.subarray(8, 12).toString('ascii');
  assertEqual(riff, 'RIFF', message || 'Invalid RIFF magic identifier in WAV header');
  assertEqual(wave, 'WAVE', message || 'Invalid WAVE format identifier in WAV header');

  // Traverse chunks to locate 'fmt ' and 'data'
  let offset = 12;
  let audioFormat = 1;
  let channels = 2;
  let sampleRate = 48000;
  let byteRate = 192000;
  let bitDepth = 16;
  let dataSize = 0;
  let foundFmt = false;
  let foundData = false;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      foundFmt = true;
      audioFormat = buffer.readUInt16LE(offset + 8);
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      byteRate = buffer.readUInt32LE(offset + 16);
      bitDepth = buffer.readUInt16LE(offset + 22);
    } else if (chunkId === 'data') {
      foundData = true;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    // Align to 2-byte boundary
    if (chunkSize % 2 !== 0) {
      offset += 1;
    }
  }

  assertTrue(foundFmt, message || 'Failed to locate "fmt " subchunk in WAV file');
  assertTrue(foundData, message || 'Failed to locate "data" subchunk in WAV file');

  const bytesPerSample = (bitDepth / 8) * channels;
  const durationSec = bytesPerSample > 0 ? dataSize / (sampleRate * bytesPerSample) : 0;

  if (expected) {
    if (expected.sampleRate !== undefined) {
      assertEqual(
        sampleRate,
        expected.sampleRate,
        message || `WAV sampleRate mismatch: expected ${expected.sampleRate}Hz, got ${sampleRate}Hz`
      );
    }
    if (expected.channels !== undefined) {
      assertEqual(
        channels,
        expected.channels,
        message || `WAV channels mismatch: expected ${expected.channels}, got ${channels}`
      );
    }
    if (expected.bitDepth !== undefined) {
      assertEqual(
        bitDepth,
        expected.bitDepth,
        message || `WAV bitDepth mismatch: expected ${expected.bitDepth}-bit, got ${bitDepth}-bit`
      );
    }
    if (expected.minDurationSec !== undefined) {
      assertTrue(
        durationSec >= expected.minDurationSec,
        message || `WAV duration ${durationSec.toFixed(3)}s is less than minimum ${expected.minDurationSec}s`
      );
    }
  }

  return {
    sampleRate,
    channels,
    bitDepth,
    durationSec,
    byteRate,
    audioFormat,
    dataSize,
  };
}
