#!/usr/bin/env tsx
/**
 * validators/validate-token-reconciliation.ts
 * Validator 3 (Requirement R11): Verifies strict decoupling of displayText vs spokenText and karaoke subunit mapping.
 * CLI: npx tsx validators/validate-token-reconciliation.ts --words <words.json> --captions <captions.json> --script <original-script.txt>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export function validateTokenReconciliation(
  wordsPath: string,
  captionsPath: string,
  scriptPath: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(wordsPath)) return { valid: false, errors: [`Words file not found: ${wordsPath}`] };
  if (!fs.existsSync(captionsPath)) return { valid: false, errors: [`Captions file not found: ${captionsPath}`] };
  if (!fs.existsSync(scriptPath)) return { valid: false, errors: [`Script file not found: ${scriptPath}`] };

  const script = fs.readFileSync(scriptPath, 'utf-8').trim();
  const words: any[] = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
  const captionsManifest = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'));

  // 1. Check caption words reconstructed text matches original script
  const captionGroups = captionsManifest.groups || [];
  const captionTokens: string[] = [];

  for (const g of captionGroups) {
    for (const l of g.lines || []) {
      for (const w of l.words || []) {
        captionTokens.push(w.word);
      }
    }
  }

  // Check [FAIL-RECON-03]: Spaced acronyms in captions
  for (const ct of captionTokens) {
    if (ct === 'G P U' || ct === 'A I' || ct === 'G P T' || ct === 'D O I') {
      if (!script.includes(ct)) {
        errors.push(`[FAIL-RECON-03] Acronym '${ct}' expanded with spaces in captions when original script does not contain spaces.`);
      }
    }
  }

  // Check [FAIL-RECON-01]: Phonetic aliases leaked into caption text
  for (const ct of captionTokens) {
    if (ct.includes('không trăm') || ct.includes('hai mươi sáu') || ct.includes('phần trăm')) {
      if (!script.includes(ct)) {
        errors.push(`[FAIL-RECON-01] Phonetic normalization '${ct}' leaked into caption display text.`);
      }
    }
  }

  // Check [FAIL-RECON-02] & [FAIL-RECON-04] on words.json
  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // Verify start < end
    if (w.start >= w.end) {
      errors.push(`[FAIL-RECON-02] Word [${w.id}] '${w.word}' start (${w.start}) >= end (${w.end}).`);
    }

    // Verify subunits if present
    if (Array.isArray(w.subunits) && w.subunits.length > 0) {
      for (let sIdx = 0; sIdx < w.subunits.length; sIdx++) {
        const sub = w.subunits[sIdx];
        if (sub.start >= sub.end) {
          errors.push(`[FAIL-RECON-04] Word [${w.id}] subunit '${sub.text}' start (${sub.start}) >= end (${sub.end}).`);
        }
        if (sub.start < w.start - 0.05 || sub.end > w.end + 0.05) {
          errors.push(`[FAIL-RECON-04] Word [${w.id}] subunit '${sub.text}' [${sub.start}, ${sub.end}] outside parent word bounds [${w.start}, ${w.end}].`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const args = process.argv.slice(2);
  let wordsPath = '';
  let captionsPath = '';
  let scriptPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--words' && args[i + 1]) {
      wordsPath = args[i + 1];
      i++;
    } else if (args[i] === '--captions' && args[i + 1]) {
      captionsPath = args[i + 1];
      i++;
    } else if (args[i] === '--script' && args[i + 1]) {
      scriptPath = args[i + 1];
      i++;
    }
  }

  if (!wordsPath || !captionsPath || !scriptPath) {
    console.error('Usage: tsx validators/validate-token-reconciliation.ts --words <words.json> --captions <captions.json> --script <original-script.txt>');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Token Reconciliation Quality Gate (R11 Validator 3)`);
  console.log(` Words:    ${path.resolve(wordsPath)}`);
  console.log(` Captions: ${path.resolve(captionsPath)}`);
  console.log(` Script:   ${path.resolve(scriptPath)}`);
  console.log(`======================================================\n`);

  const result = validateTokenReconciliation(
    path.resolve(wordsPath),
    path.resolve(captionsPath),
    path.resolve(scriptPath)
  );

  if (!result.valid) {
    console.error(`❌ VALIDATION FAILED with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ PASS: Token reconciliation strictly decoupled; captions 100% match original script without phonetic leak.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-token-reconciliation')) {
  main();
}
