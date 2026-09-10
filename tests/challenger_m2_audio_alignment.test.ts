/**
 * tests/challenger_m2_audio_alignment.test.ts
 * Empirical Adversarial Challenge Suite for Forced Alignment & WAV Concatenation
 *
 * Authored by: challenger_m2_2 (teamwork_preview_challenger)
 * Roles: critic, specialist
 * Target: packages/narration-kit/src/tts/wav.ts & packages/narration-kit/src/alignment/
 */

import * as assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

import {
  encodeWavHeader,
  createWavFile,
  parseWavHeader,
  extractPcmData,
  generateSilencePcm,
  concatenateWavBuffers,
} from '../packages/narration-kit/src/tts/wav';

import {
  validateAlignment,
  AlignmentValidationOptions,
  AlignmentValidationReport,
} from '../packages/narration-kit/src/alignment/validateAlignment';

import { normalizeAlignment } from '../packages/narration-kit/src/alignment/normalizeAlignment';
import { WordTiming } from '../packages/narration-kit/src/alignment/AlignmentProvider';

export interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export const results: TestResult[] = [];

function recordTest(category: string, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ category, name, passed: true });
      console.log(`  ✓ [${category}] ${name}`);
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        error: err?.message || String(err),
        details: err?.stack,
      });
      console.error(`  ✗ [${category}] ${name}: ${err?.message || err}`);
    }
  };
}

export async function runAllChallenges() {
  console.log('===============================================================');
  console.log(' EMPIRICAL ADVERSARIAL CHALLENGE: Audio Alignment & WAV Concat');
  console.log('===============================================================');

  // ==========================================================================
  // SECTION 1: WAV Header Encoding, Decoding & Format Invariants
  // ==========================================================================
  console.log('\n--- Section 1: WAV Header Encoding, Decoding & Format Invariants ---');

  await recordTest('WAV Header', 'encodes canonical 44-byte RIFF/WAVE header with exact 24kHz mono PCM fields', () => {
    const dataLen = 4800; // 100ms of 24kHz 16-bit mono
    const header = encodeWavHeader(dataLen, 24000, 1, 16);

    assert.strictEqual(header.length, 44, 'Header length must be exactly 44 bytes');
    assert.strictEqual(header.toString('ascii', 0, 4), 'RIFF');
    assert.strictEqual(header.readUInt32LE(4), 36 + dataLen, 'ChunkSize must be 36 + dataLength');
    assert.strictEqual(header.toString('ascii', 8, 12), 'WAVE');
    assert.strictEqual(header.toString('ascii', 12, 16), 'fmt ');
    assert.strictEqual(header.readUInt32LE(16), 16, 'Subchunk1Size must be 16 for PCM');
    assert.strictEqual(header.readUInt16LE(20), 1, 'AudioFormat must be 1 (PCM uncompressed)');
    assert.strictEqual(header.readUInt16LE(22), 1, 'Channels must be 1 (mono)');
    assert.strictEqual(header.readUInt32LE(24), 24000, 'SampleRate must be 24000 Hz');
    assert.strictEqual(header.readUInt32LE(28), 48000, 'ByteRate must be 48000 bytes/sec (48 bytes/ms)');
    assert.strictEqual(header.readUInt16LE(32), 2, 'BlockAlign must be 2 bytes');
    assert.strictEqual(header.readUInt16LE(34), 16, 'BitsPerSample must be 16');
    assert.strictEqual(header.toString('ascii', 36, 40), 'data');
    assert.strictEqual(header.readUInt32LE(40), dataLen, 'Subchunk2Size must equal dataLength');
  })();

  await recordTest('WAV Header', 'parseWavHeader correctly parses valid WAV and calculates durationSec', () => {
    const dataLen = 48000 * 2; // 2 seconds of 24kHz 16-bit mono
    const dummyPcm = Buffer.alloc(dataLen, 0x55);
    const wav = createWavFile(dummyPcm, 24000, 1, 16);

    const parsed = parseWavHeader(wav);
    assert.strictEqual(parsed.sampleRate, 24000);
    assert.strictEqual(parsed.channels, 1);
    assert.strictEqual(parsed.bitDepth, 16);
    assert.strictEqual(parsed.dataLength, dataLen);
    assert.strictEqual(parsed.durationSec, 2.0);
  })();

  await recordTest('WAV Header', 'parseWavHeader rejects buffers smaller than 44 bytes', () => {
    const tiny = Buffer.alloc(43, 0);
    assert.throws(
      () => parseWavHeader(tiny),
      /Invalid WAV: Buffer length 43 < minimum 44 bytes/
    );
  })();

  await recordTest('WAV Header', 'parseWavHeader rejects non-RIFF signatures', () => {
    const corrupted = encodeWavHeader(100);
    corrupted.write('NOPE', 0, 'ascii');
    assert.throws(
      () => parseWavHeader(corrupted),
      /Invalid WAV: Missing RIFF or WAVE header signatures/
    );
  })();

  await recordTest('WAV Header', 'parseWavHeader rejects non-PCM format (e.g. format 3 IEEE float)', () => {
    const fakeFloat = encodeWavHeader(100);
    fakeFloat.writeUInt16LE(3, 20); // format 3 = IEEE float
    assert.throws(
      () => parseWavHeader(fakeFloat),
      /Unsupported WAV format 3; expected 1/
    );
  })();

  // ==========================================================================
  // SECTION 2: Exact Byte Math & Silence Generation (48 bytes/ms)
  // ==========================================================================
  console.log('\n--- Section 2: Exact Byte Math & Silence Generation (48 bytes/ms) ---');

  await recordTest('Byte Math', 'verifies exact 48 bytes per millisecond rule across duration spectrum', () => {
    const testDurationsMs = [0, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

    for (const ms of testDurationsMs) {
      const silence = generateSilencePcm(ms, 24000, 1, 16);
      const expectedBytes = ms * 48; // 24000 * 1 * 2 / 1000 = 48 bytes/ms

      assert.strictEqual(
        silence.length,
        expectedBytes,
        `Duration ${ms}ms must yield exactly ${expectedBytes} bytes, got ${silence.length}`
      );

      // Block alignment invariant: 16-bit mono must be 2-byte aligned
      assert.strictEqual(
        silence.length % 2,
        0,
        `Silence buffer length (${silence.length}) must be aligned to 2 bytes`
      );

      // Verify all bytes are zero
      for (let i = 0; i < silence.length; i++) {
        if (silence[i] !== 0) {
          throw new Error(`Non-zero silence byte at index ${i}: ${silence[i]}`);
        }
      }
    }
  })();

  await recordTest('Byte Math', 'generateSilencePcm handles non-positive durations safely', () => {
    const zero = generateSilencePcm(0);
    assert.strictEqual(zero.length, 0);

    const negative = generateSilencePcm(-50);
    assert.strictEqual(negative.length, 0);

    const tinyNegative = generateSilencePcm(-0.0001);
    assert.strictEqual(tinyNegative.length, 0);
  })();

  await recordTest('Byte Math', 'generateSilencePcm aligns fractional millisecond durations to 2-byte boundaries', () => {
    // 0.5 ms -> 0.5 * 48 = 24 bytes
    const pcmHalfMs = generateSilencePcm(0.5, 24000, 1, 16);
    assert.strictEqual(pcmHalfMs.length, 24);
    assert.strictEqual(pcmHalfMs.length % 2, 0);

    // 1.25 ms -> 1.25 * 48 = 60 bytes
    const pcmFrac = generateSilencePcm(1.25, 24000, 1, 16);
    assert.strictEqual(pcmFrac.length, 60);
    assert.strictEqual(pcmFrac.length % 2, 0);
  })();

  // ==========================================================================
  // SECTION 3: Lossless WAV Concatenation Stress Testing
  // ==========================================================================
  console.log('\n--- Section 3: Lossless WAV Concatenation Stress Testing ---');

  await recordTest('WAV Concat', 'empty input array returns valid 44-byte silent WAV', () => {
    const emptyWav = concatenateWavBuffers([]);
    assert.strictEqual(emptyWav.length, 44);
    const parsed = parseWavHeader(emptyWav);
    assert.strictEqual(parsed.dataLength, 0);
    assert.strictEqual(parsed.durationSec, 0);
  })();

  await recordTest('WAV Concat', 'single buffer concatenation preserves exact PCM without extra gap', () => {
    const rawPcm = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);
    const singleWav = createWavFile(rawPcm, 24000, 1, 16);

    // Even if gapDurationMs is passed, single buffer has 0 gaps (gaps are between chunks)
    const result = concatenateWavBuffers([singleWav], 100);
    assert.strictEqual(result.length, 44 + rawPcm.length);
    const extracted = extractPcmData(result);
    assert.deepStrictEqual(extracted, rawPcm);
  })();

  await recordTest('WAV Concat', 'concatenates multiple varying chunks with zero gap byte-accurately', () => {
    const chunk1Pcm = Buffer.alloc(96, 0x11); // 2ms = 96 bytes
    const chunk2Pcm = Buffer.alloc(480, 0x22); // 10ms = 480 bytes
    const chunk3Pcm = Buffer.alloc(2400, 0x33); // 50ms = 2400 bytes
    const chunk4Pcm = Buffer.alloc(48000, 0x44); // 1000ms = 48000 bytes

    const wav1 = createWavFile(chunk1Pcm);
    const wav2 = createWavFile(chunk2Pcm);
    const wav3 = createWavFile(chunk3Pcm);
    const wav4 = createWavFile(chunk4Pcm);

    const combined = concatenateWavBuffers([wav1, wav2, wav3, wav4], 0);
    const totalExpectedData = chunk1Pcm.length + chunk2Pcm.length + chunk3Pcm.length + chunk4Pcm.length;

    assert.strictEqual(combined.length, 44 + totalExpectedData);
    const extracted = extractPcmData(combined);
    const expectedPcm = Buffer.concat([chunk1Pcm, chunk2Pcm, chunk3Pcm, chunk4Pcm]);
    assert.deepStrictEqual(extracted, expectedPcm);
  })();

  await recordTest('WAV Concat', 'concatenates with silence gaps (48 bytes/ms) between chunks', () => {
    const c1 = Buffer.alloc(480, 0xaa); // 10ms
    const c2 = Buffer.alloc(480, 0xbb); // 10ms
    const c3 = Buffer.alloc(480, 0xcc); // 10ms

    const w1 = createWavFile(c1);
    const w2 = createWavFile(c2);
    const w3 = createWavFile(c3);

    const gapMs = 25; // 25ms * 48 = 1200 bytes per gap
    const combined = concatenateWavBuffers([w1, w2, w3], gapMs);

    const gapBytes = 25 * 48; // 1200
    const expectedTotalData = 480 + gapBytes + 480 + gapBytes + 480; // 3840 bytes

    const parsed = parseWavHeader(combined);
    assert.strictEqual(parsed.dataLength, expectedTotalData);
    assert.strictEqual(combined.length, 44 + expectedTotalData);

    const extracted = extractPcmData(combined);

    // Verify chunk 1
    assert.deepStrictEqual(extracted.subarray(0, 480), c1);
    // Verify gap 1 is all zeroes
    const gap1 = extracted.subarray(480, 480 + gapBytes);
    assert.strictEqual(gap1.length, gapBytes);
    assert.ok(gap1.every((b) => b === 0), 'Gap 1 must be strictly zero bytes');

    // Verify chunk 2
    const offset2 = 480 + gapBytes;
    assert.deepStrictEqual(extracted.subarray(offset2, offset2 + 480), c2);

    // Verify gap 2 is all zeroes
    const gap2 = extracted.subarray(offset2 + 480, offset2 + 480 + gapBytes);
    assert.strictEqual(gap2.length, gapBytes);
    assert.ok(gap2.every((b) => b === 0), 'Gap 2 must be strictly zero bytes');

    // Verify chunk 3
    const offset3 = offset2 + 480 + gapBytes;
    assert.deepStrictEqual(extracted.subarray(offset3, offset3 + 480), c3);
  })();

  await recordTest('WAV Concat', 'concatenates large gaps (5000ms = 240,000 bytes) without overflow or corruption', () => {
    const c1 = Buffer.alloc(960, 0x12);
    const c2 = Buffer.alloc(960, 0x34);
    const w1 = createWavFile(c1);
    const w2 = createWavFile(c2);

    const largeGapMs = 5000;
    const combined = concatenateWavBuffers([w1, w2], largeGapMs);

    const expectedSilenceBytes = 5000 * 48; // 240,000 bytes
    const expectedTotal = 960 + expectedSilenceBytes + 960;

    const parsed = parseWavHeader(combined);
    assert.strictEqual(parsed.dataLength, expectedTotal);
    assert.strictEqual(parsed.durationSec, expectedTotal / 48000);
  })();

  await recordTest('WAV Concat', 'throws explicit error when attempting to concatenate corrupt buffer < 44 bytes', () => {
    const validWav = createWavFile(Buffer.alloc(480, 0));
    const corruptWav = Buffer.alloc(30, 0);

    assert.throws(
      () => concatenateWavBuffers([validWav, corruptWav]),
      /Invalid WAV buffer: length 30 < 44 bytes/
    );
  })();

  // ==========================================================================
  // SECTION 4: validateAlignment Against Intentional Defects
  // ==========================================================================
  console.log('\n--- Section 4: validateAlignment Against Intentional Defects ---');

  const createBaselineTimings = (): WordTiming[] => [
    { id: 'w0', word: 'The', cleanWord: 'the', start: 0.100, end: 0.350, confidence: 0.95, punctuation: '' },
    { id: 'w1', word: 'quick', cleanWord: 'quick', start: 0.360, end: 0.700, confidence: 0.92, punctuation: '' },
    { id: 'w2', word: 'brown', cleanWord: 'brown', start: 0.710, end: 1.050, confidence: 0.94, punctuation: '' },
    { id: 'w3', word: 'fox', cleanWord: 'fox', start: 1.060, end: 1.400, confidence: 0.91, punctuation: '' },
    { id: 'w4', word: 'jumps.', cleanWord: 'jumps', start: 1.410, end: 1.850, confidence: 0.96, punctuation: '.' },
  ];

  await recordTest('validateAlignment', 'baseline valid alignment passes all gates cleanly', () => {
    const timings = createBaselineTimings();
    const script = ['the', 'quick', 'brown', 'fox', 'jumps'];
    const report = validateAlignment(timings, { scriptWords: script, audioDurationSec: 2.0 });

    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.errors.length, 0);
    assert.strictEqual(report.totalWords, 5);
    assert.strictEqual(report.firstWordStart, 0.100);
    assert.strictEqual(report.lastWordEnd, 1.850);
    assert.ok(report.meanConfidence > 0.9);
  })();

  // Defect 1: Negative start timestamp
  await recordTest('validateAlignment Defect 1', 'flags negative start timestamp on first word', () => {
    const timings = createBaselineTimings();
    timings[0].start = -0.050; // Negative start

    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('negative start time (-0.05s)')));
  })();

  await recordTest('validateAlignment Defect 1', 'flags negative start timestamp on middle word', () => {
    const timings = createBaselineTimings();
    timings[2].start = -0.200; // Negative start

    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('negative start time (-0.2s)')));
  })();

  // Defect 2: Inverted word interval (end <= start)
  await recordTest('validateAlignment Defect 2', 'flags inverted word interval where end < start', () => {
    const timings = createBaselineTimings();
    timings[1].start = 0.600;
    timings[1].end = 0.400; // end < start

    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('end 0.4 <= start 0.6')));
  })();

  await recordTest('validateAlignment Defect 2', 'flags zero-duration word interval where end == start', () => {
    const timings = createBaselineTimings();
    timings[3].end = timings[3].start; // zero duration

    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes(`end ${timings[3].start} <= start ${timings[3].start}`)));
  })();

  // Defect 3: Non-monotonic / reversed timestamps (w[i].start < w[i-1].start)
  await recordTest('validateAlignment Defect 3', 'flags reversed timestamp order where w[i].start < w[i-1].start', () => {
    const timings = createBaselineTimings();
    timings[2].start = 0.300; // before w[1].start (0.360)

    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('is before preceding word start')));
  })();

  // Defect 4: Phonetic overlap testing (> 20ms boundary)
  await recordTest('validateAlignment Defect 4', 'permits valid phonetic overlap <= 20ms', () => {
    const timings = createBaselineTimings();
    // w[0] ends at 0.350
    // w[1] starts at 0.330 (overlap = 20ms = 0.020s)
    timings[1].start = 0.330;

    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, true, '20ms overlap should be permitted by 20ms threshold');
    assert.strictEqual(report.errors.length, 0);
  })();

  await recordTest('validateAlignment Defect 4', 'flags excessive phonetic overlap > 20ms (e.g. 25ms, 50ms, 200ms)', () => {
    // Test 25ms overlap
    const timings25ms = createBaselineTimings();
    timings25ms[1].start = 0.325; // w[0].end is 0.350 -> overlap 25ms
    const r25 = validateAlignment(timings25ms);
    assert.strictEqual(r25.valid, false);
    assert.ok(r25.errors.some((e) => e.includes('exceeds 20ms')));

    // Test 50ms overlap
    const timings50ms = createBaselineTimings();
    timings50ms[2].start = 0.650; // w[1].end is 0.700 -> overlap 50ms
    const r50 = validateAlignment(timings50ms);
    assert.strictEqual(r50.valid, false);
    assert.ok(r50.errors.some((e) => e.includes('exceeds 20ms')));

    // Test 200ms overlap
    const timings200ms = createBaselineTimings();
    timings200ms[3].start = 0.850; // w[2].end is 1.050 -> overlap 200ms
    const r200 = validateAlignment(timings200ms);
    assert.strictEqual(r200.valid, false);
    assert.ok(r200.errors.some((e) => e.includes('exceeds 20ms')));
  })();

  // Defect 5: Word omissions & token count mismatches
  await recordTest('validateAlignment Defect 5', 'flags word omissions (aligned count < script count)', () => {
    const timings = createBaselineTimings(); // 5 words
    const script = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog']; // 8 words

    const report = validateAlignment(timings, { scriptWords: script });
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Token count mismatch: expected 8, got 5')));
  })();

  await recordTest('validateAlignment Defect 5', 'flags extra words (aligned count > script count)', () => {
    const timings = createBaselineTimings(); // 5 words
    const script = ['the', 'quick', 'brown']; // 3 words

    const report = validateAlignment(timings, { scriptWords: script });
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Token count mismatch: expected 3, got 5')));
  })();

  await recordTest('validateAlignment Defect 5', 'flags expectedWordCount mismatch when options.expectedWordCount is specified', () => {
    const timings = createBaselineTimings(); // 5 words
    const report = validateAlignment(timings, { expectedWordCount: 6 });
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Transcript word count mismatch: expected 6 words, aligned 5')));
  })();

  // Defect 6: Word substitution / transcript mismatch
  await recordTest('validateAlignment Defect 6', 'flags word substitution / wording mismatch between aligned words and script', () => {
    const timings = createBaselineTimings();
    const script = ['the', 'slow', 'brown', 'fox', 'jumps']; // 'slow' instead of 'quick'

    const report = validateAlignment(timings, { scriptWords: script });
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Word mismatch at 1: expected "slow", got "quick"')));
  })();

  await recordTest('validateAlignment Defect 6', 'performs case-insensitive matching between script and cleanWord', () => {
    const timings = createBaselineTimings();
    const script = ['THE', 'QUICK', 'BROWN', 'FOX', 'JUMPS']; // Uppercase script

    const report = validateAlignment(timings, { scriptWords: script });
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.errors.length, 0);
  })();

  // Defect 7: Silence gap anomalies
  await recordTest('validateAlignment Defect 7', 'flags unexplained silence gap exceeding maxSilenceGapSec', () => {
    const timings = createBaselineTimings();
    // Introduce 5.0s silence gap between w[1] (ends 0.700) and w[2] (starts 5.700)
    timings[2].start = 5.700;
    timings[2].end = 6.000;
    timings[3].start = 6.010;
    timings[3].end = 6.350;
    timings[4].start = 6.360;
    timings[4].end = 6.800;

    // Default maxSilenceGapSec is 4.0s
    const report = validateAlignment(timings);
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Large unexplained silence gap (5.00s)')));
    assert.strictEqual(report.maxSilenceGap, 5.00);
  })();

  await recordTest('validateAlignment Defect 7', 'respects custom maxSilenceGapSec threshold', () => {
    const timings = createBaselineTimings();
    // 2.5s gap between w[2] and w[3]
    timings[3].start = 3.550; // w[2] ends at 1.050 -> gap = 2.500s
    timings[3].end = 3.900;
    timings[4].start = 3.910;
    timings[4].end = 4.200;

    // With default max 4.0s: valid
    const defaultReport = validateAlignment(timings);
    assert.strictEqual(defaultReport.valid, true);

    // With custom max 2.0s: invalid
    const strictReport = validateAlignment(timings, { maxSilenceGapSec: 2.0 });
    assert.strictEqual(strictReport.valid, false);
    assert.ok(strictReport.errors.some((e) => e.includes('Large unexplained silence gap (2.50s)')));
  })();

  // Defect 8: Mean confidence threshold
  await recordTest('validateAlignment Defect 8', 'flags mean confidence drop below threshold', () => {
    const timings = createBaselineTimings();
    // Drop all confidences to 0.40
    for (const w of timings) {
      w.confidence = 0.40;
    }

    const report = validateAlignment(timings, { minConfidence: 0.60 });
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Mean confidence 0.40 is below 0.6')));
    assert.strictEqual(report.meanConfidence, 0.40);
  })();

  // Defect 9: Audio duration overrun
  await recordTest('validateAlignment Defect 9', 'flags final word ending beyond audio duration + 0.05s tolerance', () => {
    const timings = createBaselineTimings(); // last word ends at 1.850
    const audioDur = 1.700; // audio ends before last word

    const report = validateAlignment(timings, { audioDurationSec: audioDur });
    assert.strictEqual(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('exceeds audio duration (1.7s)')));
  })();

  await recordTest('validateAlignment Defect 9', 'permits final word ending within 0.05s tolerance of audio duration', () => {
    const timings = createBaselineTimings(); // last word ends at 1.850
    const audioDur = 1.810; // 1.850 <= 1.810 + 0.050 = 1.860

    const report = validateAlignment(timings, { audioDurationSec: audioDur });
    assert.strictEqual(report.valid, true);
  })();

  // Edge cases & Degenerate inputs
  await recordTest('validateAlignment Edge Cases', 'handles empty array gracefully', () => {
    const report = validateAlignment([]);
    assert.strictEqual(report.valid, false);
    assert.strictEqual(report.totalWords, 0);
    assert.ok(report.errors.includes('Alignment contains zero word timings.'));
  })();

  await recordTest('validateAlignment Edge Cases', 'handles single-word alignment correctly', () => {
    const single: WordTiming[] = [
      { id: 'w0', word: 'Hello', cleanWord: 'hello', start: 0.050, end: 0.400, confidence: 0.98, punctuation: '' },
    ];
    const report = validateAlignment(single, { scriptWords: ['hello'] });
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.totalWords, 1);
    assert.strictEqual(report.firstWordStart, 0.050);
    assert.strictEqual(report.lastWordEnd, 0.400);
  })();

  await recordTest('validateAlignment Edge Cases', 'handles string array shorthand for scriptWords parameter', () => {
    const timings = createBaselineTimings();
    const script = ['the', 'quick', 'brown', 'fox', 'jumps'];
    const report = validateAlignment(timings, script);
    assert.strictEqual(report.valid, true);
  })();

  // ==========================================================================
  // SECTION 5: normalizeAlignment Rehabilitation & Karaoke Invariants
  // ==========================================================================
  console.log('\n--- Section 5: normalizeAlignment Rehabilitation & Karaoke Invariants ---');

  await recordTest('normalizeAlignment', 'rehabilitates corrupted raw timings with negative start and heavy overlaps', () => {
    const rawDefectiveTimings: WordTiming[] = [
      { id: 'raw0', word: 'First', cleanWord: 'first', start: -0.120, end: 0.300, confidence: 0.9, punctuation: '' },
      { id: 'raw1', word: 'Second,', cleanWord: '', start: 0.200, end: 0.150, confidence: 0.85 } as any, // overlap + end <= start + undefined punctuation
      { id: 'raw2', word: 'Third', cleanWord: 'third', start: 0.250, end: 0.600, confidence: 0.92, punctuation: '' }, // overlap
      { id: 'raw3', word: 'Fourth!', cleanWord: '', start: 0.500, end: 0.900, confidence: 0.88, punctuation: '!' },
    ];

    const normalized = normalizeAlignment(rawDefectiveTimings, 1.0);

    // 1. All IDs should be standardized to w0, w1, w2, w3
    assert.deepStrictEqual(normalized.map((w) => w.id), ['w0', 'w1', 'w2', 'w3']);

    // 2. First word start should be clamped to >= 0
    assert.ok(normalized[0].start >= 0, `First word start ${normalized[0].start} >= 0`);

    // 3. All words must have end > start (at least 0.05s / 50ms positive duration)
    for (const w of normalized) {
      assert.ok(w.end > w.start, `Word ${w.id} end (${w.end}) must be > start (${w.start})`);
      const durMs = Math.round((w.end - w.start) * 1000);
      assert.ok(durMs >= 50, `Word ${w.id} duration (${durMs}ms) >= 50ms (0.05s)`);
    }

    // 4. Highlight boundaries must be monotonic (w[i].start >= w[i-1].end)
    for (let i = 1; i < normalized.length; i++) {
      assert.ok(
        normalized[i].start >= normalized[i - 1].end,
        `Word ${normalized[i].id} start (${normalized[i].start}) must be >= prev end (${normalized[i - 1].end})`
      );
    }

    // 5. Punctuation & clean words properly separated
    assert.strictEqual(normalized[1].punctuation, ',');
    assert.strictEqual(normalized[1].cleanWord, 'second');
    assert.strictEqual(normalized[3].punctuation, '!');
    assert.strictEqual(normalized[3].cleanWord, 'fourth');

    // 6. Running validateAlignment on normalized timings must now PASS (with phonetic overlap = 0)
    const report = validateAlignment(normalized);
    assert.strictEqual(report.valid, true, `Normalized timings must pass validateAlignment: ${report.errors.join(', ')}`);
  })();

  // ==========================================================================
  // SECTION 6: High-Scale & Multi-Error Accumulation Stress
  // ==========================================================================
  console.log('\n--- Section 6: High-Scale & Multi-Error Accumulation Stress ---');

  await recordTest('Multi-Error Accumulation', 'accumulates all distinct defects simultaneously without crashing or early exit', () => {
    const multiDefectTimings: WordTiming[] = [
      { id: 'w0', word: 'Alpha', cleanWord: 'alpha', start: -0.500, end: 0.200, confidence: 0.30, punctuation: '' }, // negative start + low conf
      { id: 'w1', word: 'Beta', cleanWord: 'beta', start: 0.800, end: 0.400, confidence: 0.20, punctuation: '' },   // end <= start + low conf
      { id: 'w2', word: 'Gamma', cleanWord: 'gamma', start: 0.300, end: 0.900, confidence: 0.25, punctuation: '' },  // start < prev.start (0.3 < 0.8)
      { id: 'w3', word: 'Delta', cleanWord: 'delta', start: 0.700, end: 1.200, confidence: 0.35, punctuation: '' },  // overlap with w2 (0.900 - 0.700 = 200ms > 20ms)
      { id: 'w4', word: 'Epsilon', cleanWord: 'epsilon', start: 6.500, end: 7.000, confidence: 0.40, punctuation: '' }, // 5.3s silence gap
    ];

    const report = validateAlignment(multiDefectTimings, {
      scriptWords: ['Alpha', 'WrongWord', 'Gamma', 'Delta', 'Epsilon', 'ExtraWord'], // count mismatch + word mismatch
      audioDurationSec: 5.0, // w4 ends at 7.0 > 5.05 duration overrun
      minConfidence: 0.60,
      maxSilenceGapSec: 4.0,
    });

    assert.strictEqual(report.valid, false);
    // Verify every single gate triggered an error in report.errors:
    assert.ok(report.errors.some((e) => e.includes('Token count mismatch')));
    assert.ok(report.errors.some((e) => e.includes('negative start time')));
    assert.ok(report.errors.some((e) => e.includes('end 0.4 <= start 0.8')));
    assert.ok(report.errors.some((e) => e.includes('is before preceding word start')));
    assert.ok(report.errors.some((e) => e.includes('exceeds 20ms')));
    assert.ok(report.errors.some((e) => e.includes('Large unexplained silence gap')));
    assert.ok(report.errors.some((e) => e.includes('Word mismatch at 1')));
    assert.ok(report.errors.some((e) => e.includes('Mean confidence')));
    assert.ok(report.errors.some((e) => e.includes('exceeds audio duration')));
    assert.ok(report.errors.length >= 8, `Expected at least 8 accumulated errors, got ${report.errors.length}`);
  })();

  await recordTest('Scale Stress - WAV Concat', 'concatenates 100 audio chunks with 10ms gaps in < 50ms', () => {
    const chunkPcm = Buffer.alloc(480, 0x7f); // 10ms PCM
    const chunkWav = createWavFile(chunkPcm);
    const chunks = Array.from({ length: 100 }, () => chunkWav);

    const t0 = performance.now();
    const concatenated = concatenateWavBuffers(chunks, 10);
    const elapsed = performance.now() - t0;

    // 100 chunks of 480 bytes + 99 gaps of 480 bytes = 48000 + 47520 = 95520 bytes
    const expectedData = 100 * 480 + 99 * (10 * 48);
    const parsed = parseWavHeader(concatenated);
    assert.strictEqual(parsed.dataLength, expectedData);
    assert.strictEqual(concatenated.length, 44 + expectedData);
    assert.ok(elapsed < 100, `Concatenation took ${elapsed.toFixed(2)}ms (expected < 100ms)`);
  })();

  await recordTest('Scale Stress - validateAlignment', 'validates 5,000 word timings array in < 50ms', () => {
    const largeTimings: WordTiming[] = [];
    const script: string[] = [];
    for (let i = 0; i < 5000; i++) {
      const start = i * 0.300;
      const end = start + 0.250;
      largeTimings.push({
        id: `w${i}`,
        word: `word${i}`,
        cleanWord: `word${i}`,
        start,
        end,
        confidence: 0.95,
        punctuation: '',
      });
      script.push(`word${i}`);
    }

    const t0 = performance.now();
    const report = validateAlignment(largeTimings, {
      scriptWords: script,
      audioDurationSec: 5000 * 0.300 + 1.0,
    });
    const elapsed = performance.now() - t0;

    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.totalWords, 5000);
    assert.strictEqual(report.errors.length, 0);
    assert.ok(elapsed < 100, `Validation of 5,000 words took ${elapsed.toFixed(2)}ms (expected < 100ms)`);
  })();

  // ==========================================================================
  // Summary and Verdict
  // ==========================================================================
  console.log('\n===============================================================');
  console.log(' ADVERSARIAL CHALLENGE EXECUTION SUMMARY');
  console.log('===============================================================');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Challenges: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed / Regressions Flagged: ${failedCount}`);

  if (failedCount > 0) {
    console.log('\nFailures & Regressions Flagged:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - [${r.category}] ${r.name}`);
      console.log(`    Error/Finding: ${r.error}`);
    }
  }

  return { total: results.length, passed: passedCount, failed: failedCount, results };
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('challenger_m2_audio_alignment')) {
  runAllChallenges()
    .then((summary) => {
      console.log(`\nRunner completed. Status: ${summary.failed > 0 ? 'FAILURES_DETECTED' : 'CLEAN_PASS'}`);
      if (summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal runner error:', err);
      process.exit(1);
    });
}
