#!/usr/bin/env tsx
/**
 * validators/validate-alignment.ts
 * Standalone CLI validator for forced alignment word timings conforming to V3 R7.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateAlignment } from '../packages/narration-kit/src/alignment/validateAlignment';
import { WordTiming } from '../packages/narration-kit/src/alignment/AlignmentProvider';

function main() {
  const args = process.argv.slice(2);
  let wordsPath = 'words.json';
  let audioDurationSec: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--words' && args[i + 1]) {
      wordsPath = args[i + 1];
      i++;
    } else if (args[i] === '--duration' && args[i + 1]) {
      audioDurationSec = parseFloat(args[i + 1]);
      i++;
    } else if (!args[i].startsWith('--')) {
      wordsPath = args[i];
    }
  }

  const resolvedPath = path.resolve(wordsPath);
  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Word Alignment Quality Gate`);
  console.log(` Target: ${resolvedPath}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ FAIL: Alignment file does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  let timings: WordTiming[];
  try {
    timings = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  } catch (err: any) {
    console.error(`❌ FAIL: Invalid JSON format: ${err.message}`);
    process.exit(1);
  }

  const report = validateAlignment(timings, {
    audioDurationSec,
    minConfidence: 0.6,
  });

  console.log(`  Total Words:       ${report.totalWords}`);
  console.log(`  First Word Start:  ${report.firstWordStart.toFixed(2)}s`);
  console.log(`  Last Word End:     ${report.lastWordEnd.toFixed(2)}s`);
  console.log(`  Min Confidence:    ${report.minConfidence.toFixed(2)}`);
  console.log(`  Max Silence Gap:   ${report.maxSilenceGap.toFixed(2)}s`);

  if (!report.valid) {
    console.error(`\n❌ ALIGNMENT VALIDATION FAILED with ${report.errors.length} error(s):`);
    for (const err of report.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ PASS: Word alignment passes all V3 Quality Gates.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-alignment')) {
  main();
}
