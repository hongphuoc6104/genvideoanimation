#!/usr/bin/env tsx
/**
 * validators/validate-vietnamese-normalization.ts
 * Validator 5 (Requirement R11): Audits number reading, year pronunciation, and alphanumeric normalization.
 * CLI: npx tsx validators/validate-vietnamese-normalization.ts --original <original-script.txt> --spoken <spoken-script.txt>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export function validateVietnameseNormalization(originalPath: string, spokenPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(originalPath)) return { valid: false, errors: [`Original script not found: ${originalPath}`] };
  if (!fs.existsSync(spokenPath)) return { valid: false, errors: [`Spoken script not found: ${spokenPath}`] };

  const original = fs.readFileSync(originalPath, 'utf-8');
  const spoken = fs.readFileSync(spokenPath, 'utf-8');

  // 1. [FAIL-NORM-01] English year words in spoken text
  const ENGLISH_YEAR_TERMS = ['twenty twenty-six', 'twenty twenty', 'nineteen ninety', 'twenty twenty-five'];
  for (const term of ENGLISH_YEAR_TERMS) {
    if (spoken.toLowerCase().includes(term)) {
      errors.push(`[FAIL-NORM-01] Vietnamese year normalized into English words: '${term}' found in spoken text.`);
    }
  }

  // If original contains "2026", spoken must contain "hai nghìn" or "hai ngàn"
  if (original.includes('2026')) {
    if (!spoken.includes('hai nghìn') && !spoken.includes('hai ngàn')) {
      errors.push(`[FAIL-NORM-01] Year '2026' was not normalized into Vietnamese words ('hai nghìn không trăm hai mươi sáu').`);
    }
  }

  // 2. [FAIL-NORM-02] Vietnamese counting numbers read in English
  if (/(\d+)\s*(bước|loại|tầng|câu|phần|trang)\b/i.test(original)) {
    if (/\b(one|two|three|four|five)\s*(bước|loại|tầng|câu|phần|trang)\b/i.test(spoken)) {
      errors.push(`[FAIL-NORM-02] Vietnamese counting numbers read in English words.`);
    }
  }

  // 3. [FAIL-NORM-03] Percentages read in English
  if (original.includes('%')) {
    if (/percent\b/i.test(spoken) && !spoken.includes('phần trăm')) {
      errors.push(`[FAIL-NORM-03] Percentage read in English words ('percent') instead of Vietnamese ('phần trăm').`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const args = process.argv.slice(2);
  let origPath = '';
  let spokenPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--original' && args[i + 1]) {
      origPath = args[i + 1];
      i++;
    } else if (args[i] === '--spoken' && args[i + 1]) {
      spokenPath = args[i + 1];
      i++;
    }
  }

  if (!origPath || !spokenPath) {
    console.error('Usage: tsx validators/validate-vietnamese-normalization.ts --original <original-script.txt> --spoken <spoken-script.txt>');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Vietnamese Normalization Quality Gate (R11 Validator 5)`);
  console.log(` Original: ${path.resolve(origPath)}`);
  console.log(` Spoken:   ${path.resolve(spokenPath)}`);
  console.log(`======================================================\n`);

  const result = validateVietnameseNormalization(path.resolve(origPath), path.resolve(spokenPath));

  if (!result.valid) {
    console.error(`❌ VALIDATION FAILED with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ PASS: Vietnamese numbers and years normalized with native grammar.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-vietnamese-normalization')) {
  main();
}
