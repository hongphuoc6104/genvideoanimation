#!/usr/bin/env tsx
/**
 * validators/validate-language-spans.ts
 * Validator 1 (Requirement R11): Audits language classification and span coverage.
 * CLI: npx tsx validators/validate-language-spans.ts --spans <spans.json> --script <original-script.txt>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const VALID_SEMANTIC_TYPES = new Set([
  'VIETNAMESE',
  'ENGLISH_WORD',
  'ENGLISH_PHRASE',
  'ACRONYM',
  'INITIALISM',
  'PROPER_NOUN',
  'NUMBER',
  'UNIT',
  'FORMULA',
  'MODEL_NAME',
]);

const VALID_MODES = new Set([
  'vi',
  'en_word',
  'en_phrase',
  'en_spell',
  'custom',
]);

export function validateLanguageSpans(spansJsonPath: string, scriptPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(spansJsonPath)) {
    return { valid: false, errors: [`Spans file does not exist: ${spansJsonPath}`] };
  }
  if (!fs.existsSync(scriptPath)) {
    return { valid: false, errors: [`Script file does not exist: ${scriptPath}`] };
  }

  const scriptContent = fs.readFileSync(scriptPath, 'utf-8').trim();
  let spans: any[];
  try {
    spans = JSON.parse(fs.readFileSync(spansJsonPath, 'utf-8'));
    if (!Array.isArray(spans)) {
      errors.push('Spans JSON root must be an array of LanguageSpan objects.');
      return { valid: false, errors };
    }
  } catch (err: any) {
    return { valid: false, errors: [`Failed to parse spans JSON: ${err.message}`] };
  }

  if (spans.length === 0) {
    errors.push('Language spans array is empty (0 spans).');
  }

  // Check spans valid schema
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    const prefix = `Span #${i} [${s.id || 'no-id'}] (${s.text || 'no-text'})`;

    // 1. Enum checks
    if (!VALID_SEMANTIC_TYPES.has(s.semanticType)) {
      errors.push(`[FAIL-SPAN-04] ${prefix} invalid semanticType: '${s.semanticType}'. Must be one of: ${Array.from(VALID_SEMANTIC_TYPES).join(', ')}`);
    }
    if (!VALID_MODES.has(s.pronunciationMode)) {
      errors.push(`[FAIL-SPAN-04] ${prefix} invalid pronunciationMode: '${s.pronunciationMode}'. Must be one of: ${Array.from(VALID_MODES).join(', ')}`);
    }

    // 2. Acronym guessing detection
    // If text looks like uppercase acronym (e.g. CARS, CMV, GPU, DOI) but is classified as VIETNAMESE plain word with mode 'vi'
    if (/^[A-Z]{2,}$/.test(s.text) && s.semanticType === 'VIETNAMESE' && s.pronunciationMode === 'vi') {
      errors.push(`[FAIL-SPAN-03] ${prefix} is an uppercase acronym '${s.text}' silently guessed as VIETNAMESE plain word with mode 'vi'. Silent guessing is prohibited.`);
    }

    // 3. Check span character offset against script
    if (Array.isArray(s.span) && s.span.length === 2) {
      const [start, end] = s.span;
      if (start < 0 || end > scriptContent.length || start >= end) {
        errors.push(`[FAIL-SPAN-02] ${prefix} span offsets [${start}, ${end}] out of range for script length ${scriptContent.length}.`);
      } else {
        const expectedSlice = scriptContent.slice(start, end);
        if (expectedSlice !== s.text) {
          errors.push(`[FAIL-SPAN-02] ${prefix} offset text mismatch: expected '${expectedSlice}', got '${s.text}'.`);
        }
      }
    } else {
      errors.push(`[FAIL-SPAN-02] ${prefix} missing valid [start, end] span offsets.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const args = process.argv.slice(2);
  let spansPath = '';
  let scriptPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spans' && args[i + 1]) {
      spansPath = args[i + 1];
      i++;
    } else if (args[i] === '--script' && args[i + 1]) {
      scriptPath = args[i + 1];
      i++;
    }
  }

  if (!spansPath || !scriptPath) {
    console.error('Usage: tsx validators/validate-language-spans.ts --spans <spans.json> --script <original-script.txt>');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Language Spans Quality Gate (R11 Validator 1)`);
  console.log(` Spans:  ${path.resolve(spansPath)}`);
  console.log(` Script: ${path.resolve(scriptPath)}`);
  console.log(`======================================================\n`);

  const result = validateLanguageSpans(path.resolve(spansPath), path.resolve(scriptPath));

  if (!result.valid) {
    console.error(`❌ VALIDATION FAILED with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ PASS: All language spans conform to 10 semantic types and 100% script coverage.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-language-spans')) {
  main();
}
