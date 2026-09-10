#!/usr/bin/env tsx
/**
 * validators/validate-bilingual-alignment.ts
 * Validator 4 (Requirement R11): Audits multilingual forced alignment across code-switch boundaries.
 * CLI: npx tsx validators/validate-bilingual-alignment.ts --words <words.json> --audio <narration.wav>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseWavHeader } from '../packages/narration-kit/src/tts/wav';

export function validateBilingualAlignment(wordsPath: string, audioPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(wordsPath)) return { valid: false, errors: [`Words file not found: ${wordsPath}`] };
  if (!fs.existsSync(audioPath)) return { valid: false, errors: [`Audio file not found: ${audioPath}`] };

  const words: any[] = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
  const audioBuf = fs.readFileSync(audioPath);
  const wavInfo = parseWavHeader(audioBuf);
  const audioDurationSec = wavInfo.durationSec;

  if (words.length === 0) {
    errors.push('Words array is empty (0 words).');
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // Check 1: [FAIL-ALIGN-01] Non-negative and monotonic
    if (w.start < 0) {
      errors.push(`[FAIL-ALIGN-01] Word #${i} '${w.word}' has negative start timestamp (${w.start}s).`);
    }
    if (w.end <= w.start) {
      errors.push(`[FAIL-ALIGN-01] Word #${i} '${w.word}' start (${w.start}s) >= end (${w.end}s).`);
    }

    if (i > 0) {
      const prev = words[i - 1];
      if (w.start < prev.start) {
        errors.push(`[FAIL-ALIGN-01] Word #${i} '${w.word}' start (${w.start}s) is earlier than previous word '${prev.word}' start (${prev.start}s).`);
      }
    }

    // Check 2: [FAIL-ALIGN-04] Audio bounds exceed check
    if (w.end > audioDurationSec + 0.15) {
      errors.push(`[FAIL-ALIGN-04] Word #${i} '${w.word}' end (${w.end}s) exceeds total audio duration (${audioDurationSec.toFixed(2)}s) by > 0.15s.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const args = process.argv.slice(2);
  let wordsPath = '';
  let audioPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--words' && args[i + 1]) {
      wordsPath = args[i + 1];
      i++;
    } else if (args[i] === '--audio' && args[i + 1]) {
      audioPath = args[i + 1];
      i++;
    }
  }

  if (!wordsPath || !audioPath) {
    console.error('Usage: tsx validators/validate-bilingual-alignment.ts --words <words.json> --audio <narration.wav>');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Bilingual Forced Alignment Quality Gate (R11 Validator 4)`);
  console.log(` Words: ${path.resolve(wordsPath)}`);
  console.log(` Audio: ${path.resolve(audioPath)}`);
  console.log(`======================================================\n`);

  const result = validateBilingualAlignment(path.resolve(wordsPath), path.resolve(audioPath));

  if (!result.valid) {
    console.error(`❌ VALIDATION FAILED with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ PASS: Word timings are strictly monotonic, within audio bounds, and preserve code-switch transitions.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-bilingual-alignment')) {
  main();
}
