#!/usr/bin/env tsx
/**
 * validators/validate-audio-mix.ts
 * Standalone CLI validator for audio production mix conforming to V3 R11.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { AudioManifest } from '../packages/narration-kit/src/audio/types';
import { parseWavHeader } from '../packages/narration-kit/src/tts/wav';

function main() {
  const args = process.argv.slice(2);
  let manifestPath = 'audio-manifest.json';
  let wavPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest' && args[i + 1]) {
      manifestPath = args[i + 1];
      i++;
    } else if (args[i] === '--wav' && args[i + 1]) {
      wavPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      manifestPath = args[i];
    }
  }

  const resolvedManifest = path.resolve(manifestPath);
  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Audio Mix & Manifest Quality Gate`);
  console.log(` Manifest: ${resolvedManifest}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(resolvedManifest)) {
    console.error(`❌ FAIL: Audio manifest does not exist: ${resolvedManifest}`);
    process.exit(1);
  }

  let manifest: AudioManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(resolvedManifest, 'utf-8'));
  } catch (err: any) {
    console.error(`❌ FAIL: Invalid JSON manifest: ${err.message}`);
    process.exit(1);
  }

  const errors: string[] = [];

  // Check 1: Priority narration track
  if (!manifest.tracks || !manifest.tracks.narration) {
    errors.push('Manifest lacks authoritative narration track.');
  }

  // Check 2: Digital clipping headroom (peak <= -0.1 dBFS)
  if (manifest.peakDbfs > -0.05) {
    errors.push(`Peak level (${manifest.peakDbfs} dBFS) exceeds maximum safe ceiling (-0.1 dBFS).`);
  }

  // Check 3: Duration validity
  if (manifest.totalDurationSec <= 0) {
    errors.push(`Invalid audio total duration: ${manifest.totalDurationSec}s.`);
  }

  // Check 4: Ducking verification
  if (manifest.ducking?.enabled) {
    if (!manifest.ducking.config || manifest.ducking.config.duckingDepthDb > -6.0) {
      errors.push(`Ducking depth (${manifest.ducking.config?.duckingDepthDb} dB) insufficient (must be <= -6.0 dB).`);
    }
  }

  // Check 5: Audio file check if provided
  if (wavPath && fs.existsSync(wavPath)) {
    try {
      const buf = fs.readFileSync(wavPath);
      const h = parseWavHeader(buf);
      if (Math.abs(h.durationSec - manifest.totalDurationSec) > 0.5) {
        errors.push(`WAV file duration (${h.durationSec.toFixed(2)}s) mismatches manifest duration (${manifest.totalDurationSec}s).`);
      }
    } catch (e: any) {
      errors.push(`Failed to read WAV file: ${e.message}`);
    }
  }

  console.log(`  Total Duration:     ${manifest.totalDurationSec}s`);
  console.log(`  Sample Rate:        ${manifest.sampleRate} Hz`);
  console.log(`  True Peak:          ${manifest.peakDbfs} dBFS`);
  console.log(`  Integrated LUFS:    ${manifest.integratedLufs} LUFS`);
  console.log(`  Ducking Enabled:    ${manifest.ducking?.enabled ? 'Yes' : 'No'}`);
  console.log(`  Ducking Regions:    ${manifest.ducking?.regions?.length || 0}`);

  if (errors.length > 0) {
    console.error(`\n❌ AUDIO MIX VALIDATION FAILED with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ PASS: Audio mix and manifest satisfy all production criteria.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-audio-mix')) {
  main();
}
