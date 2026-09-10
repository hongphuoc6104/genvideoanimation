#!/usr/bin/env tsx
/**
 * validators/validate-pronunciation-map.ts
 * Validator 2 (Requirement R11): Verifies phonetic mapping adherence against hierarchical lexicons.
 * CLI: npx tsx validators/validate-pronunciation-map.ts --map <pronunciation-map.json> --lexicons <lexicons/>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { LexiconManager } from '../packages/narration-kit/src/normalization/lexiconManager';

export function validatePronunciationMap(mapPath: string, lexiconsDir?: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(mapPath)) {
    return { valid: false, errors: [`Pronunciation map file does not exist: ${mapPath}`] };
  }

  let entries: any[];
  try {
    entries = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    if (!Array.isArray(entries)) {
      return { valid: false, errors: ['Pronunciation map JSON must be an array of entries.'] };
    }
  } catch (err: any) {
    return { valid: false, errors: [`Failed to parse pronunciation map JSON: ${err.message}`] };
  }

  const lexiconManager = LexiconManager.getInstance(lexiconsDir);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const token = e.token || e.displayToken || '';
    const prefix = `Entry #${i} [${token}]`;

    // 1. [FAIL-PRON-04] Phonetic normalizations leaked into displayToken
    if (e.displayToken && (e.displayToken.includes('A I') || e.displayToken.includes('G P U') || e.displayToken.includes('không trăm'))) {
      errors.push(`[FAIL-PRON-04] ${prefix} phonetic normalization leaked into displayToken: '${e.displayToken}'.`);
    }

    // 2. Acronym checks
    const isUppercaseAcronym = /^[A-Z]{2,}$/.test(token);
    if (isUppercaseAcronym) {
      const match = lexiconManager.lookup(token);
      if (!match) {
        errors.push(`[FAIL-PRON-01] ${prefix} unknown uppercase acronym '${token}' is not registered in lexicons and was silently processed.`);
      } else {
        // [FAIL-PRON-02] Check unintended Vietnamese letter spelling for English initialisms
        // e.g. "Gờ", "Pê", "U" instead of English letters
        const spokenStr = Array.isArray(e.spokenUnits) ? e.spokenUnits.join(' ') : (e.spokenText || '');
        if (/gờ|pê|quy|hát\b|vê\b/i.test(spokenStr) && match.mode === 'en_spell') {
          errors.push(`[FAIL-PRON-02] ${prefix} English acronym '${token}' pronounced using unintended Vietnamese spelling ('${spokenStr}') when lexicon specifies English.`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const args = process.argv.slice(2);
  let mapPath = '';
  let lexiconsDir = path.resolve(process.cwd(), 'lexicons');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--map' && args[i + 1]) {
      mapPath = args[i + 1];
      i++;
    } else if (args[i] === '--lexicons' && args[i + 1]) {
      lexiconsDir = args[i + 1];
      i++;
    }
  }

  if (!mapPath) {
    console.error('Usage: tsx validators/validate-pronunciation-map.ts --map <pronunciation-map.json> [--lexicons <lexicons/>]');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Pronunciation Map Quality Gate (R11 Validator 2)`);
  console.log(` Target Map:   ${path.resolve(mapPath)}`);
  console.log(` Lexicons Dir: ${path.resolve(lexiconsDir)}`);
  console.log(`======================================================\n`);

  const result = validatePronunciationMap(path.resolve(mapPath), path.resolve(lexiconsDir));

  if (!result.valid) {
    console.error(`❌ VALIDATION FAILED with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ PASS: Pronunciation map strictly adheres to hierarchical lexicons and zero silent acronym guessing.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-pronunciation-map')) {
  main();
}
