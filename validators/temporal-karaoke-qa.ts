#!/usr/bin/env tsx
/**
 * validators/temporal-karaoke-qa.ts
 * Standalone CLI validator for frame-deterministic progressive karaoke highlight monotonicity.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CaptionsManifest, CaptionWord } from '../packages/narration-kit/src/captions/types';
import { calculateWordProgress } from '../packages/caption-kit/src/utils';

function main() {
  const args = process.argv.slice(2);
  let captionsPath = 'captions.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--captions' && args[i + 1]) {
      captionsPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      captionsPath = args[i];
    }
  }

  const resolvedPath = path.resolve(captionsPath);
  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Temporal Karaoke Monotonicity QA`);
  console.log(` Target: ${resolvedPath}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ FAIL: Captions file does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  let manifest: CaptionsManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  } catch (err: any) {
    console.error(`❌ FAIL: Invalid JSON: ${err.message}`);
    process.exit(1);
  }

  const errors: string[] = [];
  const words: CaptionWord[] = [];

  for (const group of manifest.groups || []) {
    for (const line of group.lines || []) {
      for (const word of line.words || []) {
        words.push(word);
      }
    }
  }

  if (words.length === 0) {
    errors.push('No words found in captions manifest.');
  }

  // 1. Monotonicity test per word
  for (const w of words) {
    let prevProgress = -0.0001;

    // Check progress at word.startFrame
    const atStart = calculateWordProgress(w.startFrame, w);
    if (atStart > 0.05) {
      errors.push(`Word [${w.id}: "${w.word}"] progress at startFrame (${w.startFrame}) is ${atStart.toFixed(3)} (expected ~0.0).`);
    }

    // Check progress at word.endFrame
    const atEnd = calculateWordProgress(w.endFrame, w);
    if (atEnd < 0.95) {
      errors.push(`Word [${w.id}: "${w.word}"] progress at endFrame (${w.endFrame}) is ${atEnd.toFixed(3)} (expected ~1.0).`);
    }

    // Check step-by-step frame monotonicity
    for (let f = w.startFrame; f <= w.endFrame; f++) {
      const p = calculateWordProgress(f, w);
      if (p < prevProgress - 0.00001) {
        errors.push(`Word [${w.id}: "${w.word}"] non-monotonic progress drop from frame ${f - 1} (${prevProgress}) to frame ${f} (${p}).`);
      }
      prevProgress = p;
    }
  }

  // 2. Mutual exclusivity test: no two words simultaneously CURRENT unless permitted
  const maxFrame = Math.max(...words.map((w) => w.endFrame), 0);
  for (let f = 0; f <= maxFrame; f++) {
    const activeWords = words.filter((w) => f >= w.startFrame && f < w.endFrame);
    if (activeWords.length > 1) {
      errors.push(`Frame ${f} has ${activeWords.length} simultaneously active CURRENT words: [${activeWords.map((w) => w.word).join(', ')}].`);
    }
  }

  console.log(`  Total Words Tested: ${words.length}`);
  console.log(`  Frames Evaluated:   0 to ${maxFrame}`);

  if (errors.length > 0) {
    console.error(`\n❌ TEMPORAL KARAOKE VALIDATION FAILED with ${errors.length} error(s):`);
    for (const err of errors.slice(0, 10)) {
      console.error(`  - ${err}`);
    }
    if (errors.length > 10) {
      console.error(`  ... and ${errors.length - 10} more.`);
    }
    process.exit(1);
  }

  console.log(`\n✅ PASS: Temporal highlight progression is strictly monotonic (0% -> 100%).\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('temporal-karaoke-qa')) {
  main();
}
