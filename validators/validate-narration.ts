#!/usr/bin/env tsx
/**
 * validators/validate-narration.ts
 * Standalone CLI validator for narration audio quality gates conforming to V3 R2 & R12.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseWavHeader } from '../packages/narration-kit/src/tts/wav';

function main() {
  const args = process.argv.slice(2);
  let wavPath = 'narration.wav';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--wav' && args[i + 1]) {
      wavPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      wavPath = args[i];
    }
  }

  const resolvedPath = path.resolve(wavPath);
  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Narration Audio Quality Gate`);
  console.log(` Target: ${resolvedPath}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ FAIL: Audio file does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  const buf = fs.readFileSync(resolvedPath);
  let header;
  try {
    header = parseWavHeader(buf);
  } catch (err: any) {
    console.error(`❌ FAIL: Invalid WAV header format: ${err.message}`);
    process.exit(1);
  }

  const errors: string[] = [];

  // Check 1: Sample Rate (Must be 24,000 Hz)
  if (header.sampleRate !== 24000) {
    errors.push(`Expected sample rate 24000 Hz, got ${header.sampleRate} Hz.`);
  }

  // Check 2: Mono channel (Channels === 1)
  if (header.channels !== 1) {
    errors.push(`Expected 1 channel (mono), got ${header.channels}.`);
  }

  // Check 3: Bit depth (16-bit PCM)
  if (header.bitDepth !== 16) {
    errors.push(`Expected 16-bit PCM, got ${header.bitDepth}-bit.`);
  }

  // Check 4: Duration > 0
  if (header.durationSec <= 0.1) {
    errors.push(`Audio duration too short or empty: ${header.durationSec.toFixed(2)}s.`);
  }

  // Check 5: Silence anomaly & RMS levels
  const dataOffset = 44;
  const pcm16 = new Int16Array(buf.buffer, buf.byteOffset + dataOffset, (buf.length - dataOffset) / 2);
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < pcm16.length; i++) {
    const s = pcm16[i] / 32768.0;
    const abs = Math.abs(s);
    if (abs > peak) peak = abs;
    sumSq += s * s;
  }
  const rms = Math.sqrt(sumSq / pcm16.length);

  if (peak === 0 || rms < 0.001) {
    errors.push(`Audio is pure digital silence (peak=0, rms=${rms.toFixed(4)}).`);
  }

  console.log(`  Sample Rate:   ${header.sampleRate} Hz`);
  console.log(`  Channels:      ${header.channels} (mono)`);
  console.log(`  Bit Depth:     ${header.bitDepth}-bit PCM`);
  console.log(`  Duration:      ${header.durationSec.toFixed(2)}s`);
  console.log(`  Peak Level:    ${(20 * Math.log10(peak || 1e-6)).toFixed(1)} dBFS`);
  console.log(`  RMS Level:     ${(20 * Math.log10(rms || 1e-6)).toFixed(1)} dBFS`);

  if (errors.length > 0) {
    console.error(`\n❌ NARRATION VALIDATION FAILED with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ PASS: Narration audio conforms to all V3 specifications.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-narration')) {
  main();
}
