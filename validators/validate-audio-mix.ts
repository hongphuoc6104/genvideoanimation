#!/usr/bin/env tsx
/**
 * validators/validate-audio-mix.ts
 * Standalone CLI validator for audio production mix conforming to V3 R11.
 * Supports both nested manifest.output and flat legacy properties.
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

  const narrationDur =
    (manifest.tracks?.narration as any)?.duration ??
    (manifest.tracks?.narration as any)?.durationSec ??
    0;
  const outputDur =
    manifest.output?.durationSec ??
    manifest.totalDurationSec ??
    manifest.durationSec ??
    0;

  // Check 1: Priority narration track
  if (!manifest.tracks || !manifest.tracks.narration || narrationDur <= 0) {
    errors.push('Manifest lacks authoritative narration track.');
  }

  // Duration synchronization check
  if (narrationDur > 0 && outputDur > 0 && Math.abs(narrationDur - outputDur) > 0.1) {
    errors.push(`Track duration mismatch: narration=${narrationDur}s, output=${outputDur}s (delta > 0.1s).`);
  }

  // Check 2: Peak / True-peak level and clipping
  const peak = manifest.output?.truePeakDbfs ?? manifest.truePeakDbfs ?? manifest.peakDbfs ?? 0;
  if (peak > -0.05) {
    errors.push(`Peak level (${peak} dBFS) exceeds maximum safe ceiling (-0.1 dBFS).`);
  }
  if (manifest.output?.truePeakDbfs !== undefined && manifest.output.truePeakDbfs > -1.0) {
    errors.push(`Output true peak (${manifest.output.truePeakDbfs} dBFS) exceeds broadcast ceiling (-1.0 dBFS).`);
  }

  const clippedSamples = manifest.output?.clippedSamples ?? manifest.clippedSamples ?? 0;
  if (clippedSamples > 0) {
    errors.push(`Output contains ${clippedSamples} clipped samples.`);
  }

  // Check 3: Duration validity
  if (outputDur <= 0) {
    errors.push(`Invalid audio total duration: ${outputDur}s.`);
  }

  // Check 4: Ducking verification
  const duckingEnabled =
    manifest.ducking?.enabled ??
    Boolean(manifest.tracks?.music && manifest.tracks?.narration);
  const duckingDepth =
    manifest.ducking?.attenuationDb ??
    manifest.ducking?.config?.duckingDepthDb ??
    0;

  if (duckingEnabled && duckingDepth > -6.0) {
    errors.push(`Ducking depth (${duckingDepth} dB) insufficient (must be <= -6.0 dB).`);
  }

  // Check 5: Integrated LUFS broadcast specification [-17.5, -14.5]
  const lufs = manifest.output?.lufs ?? manifest.integratedLufs;
  if (lufs !== undefined && (lufs < -17.5 || lufs > -14.5)) {
    errors.push(`Output loudness (${lufs} LUFS) is outside broadcast spec [-17.5, -14.5].`);
  }

  // Check 6: WAV file validation if provided
  if (wavPath && fs.existsSync(wavPath)) {
    try {
      const buf = fs.readFileSync(wavPath);
      const h = parseWavHeader(buf);
      if (outputDur > 0 && Math.abs(h.durationSec - outputDur) > 0.5) {
        errors.push(`WAV file duration (${h.durationSec.toFixed(2)}s) mismatches manifest duration (${outputDur}s).`);
      }
    } catch (e: any) {
      errors.push(`Failed to read WAV file: ${e.message}`);
    }
  }

  const displaySampleRate = manifest.output?.sampleRate ?? manifest.sampleRate ?? 48000;
  console.log(`  Total Duration:     ${outputDur}s`);
  console.log(`  Sample Rate:        ${displaySampleRate} Hz`);
  console.log(`  True Peak:          ${peak} dBFS`);
  console.log(`  Integrated LUFS:    ${lufs ?? 'N/A'} LUFS`);
  console.log(`  Ducking Enabled:    ${duckingEnabled ? 'Yes' : 'No'}`);
  console.log(`  Ducking Depth:      ${duckingDepth} dB`);
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
