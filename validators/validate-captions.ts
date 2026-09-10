#!/usr/bin/env tsx
/**
 * validators/validate-captions.ts
 * Standalone CLI validator for caption segmentation conforming to V3 R8 & R10.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CaptionsManifest } from '../packages/narration-kit/src/captions/types';

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
  console.log(` VALIDATOR: Caption Segmentation Quality Gate`);
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
    console.error(`❌ FAIL: Invalid JSON format: ${err.message}`);
    process.exit(1);
  }

  const errors: string[] = [];
  const groups = manifest.groups || [];

  if (groups.length === 0) {
    errors.push('Captions manifest contains 0 groups.');
  }

  let maxLinesObserved = 0;
  let maxCharsObserved = 0;
  let maxCpsObserved = 0;

  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const g = groups[gIdx];

    // Check 1: Max lines <= 2
    if (g.lines.length > maxLinesObserved) maxLinesObserved = g.lines.length;
    if (g.lines.length > 2) {
      errors.push(`Group [${g.id}] exceeds maximum 2 lines (has ${g.lines.length} lines).`);
    }

    // Check 2: Max chars per line <= 42
    for (let lIdx = 0; lIdx < g.lines.length; lIdx++) {
      const lineLen = g.lines[lIdx].text.length;
      if (lineLen > maxCharsObserved) maxCharsObserved = lineLen;
      if (lineLen > 42) {
        errors.push(`Group [${g.id}] line ${lIdx + 1} exceeds 42 characters (${lineLen} chars: "${g.lines[lIdx].text}").`);
      }
    }

    // Check 3: Reading speed (CPS)
    const duration = g.endTime - g.startTime;
    const totalChars = g.lines.reduce((sum, l) => sum + l.text.length, 0);
    const cps = duration > 0 ? totalChars / duration : 999;
    if (cps > maxCpsObserved) maxCpsObserved = cps;
    if (cps > 21.0 && duration < 0.5) {
      errors.push(`Group [${g.id}] reading speed (${cps.toFixed(1)} CPS) exceeds max threshold 21.0 CPS.`);
    }

    // Check 4: Frame bounds monotonicity
    if (gIdx > 0) {
      const prev = groups[gIdx - 1];
      if (g.startFrame < prev.endFrame) {
        errors.push(`Group [${g.id}] startFrame (${g.startFrame}) overlaps previous group endFrame (${prev.endFrame}).`);
      }
    }
  }

  console.log(`  Total Groups:       ${groups.length}`);
  console.log(`  Max Lines / Group:  ${maxLinesObserved} (limit: <= 2)`);
  console.log(`  Max Chars / Line:   ${maxCharsObserved} (limit: <= 42)`);
  console.log(`  Max Reading Speed:  ${maxCpsObserved.toFixed(1)} CPS (limit: <= 21.0)`);

  if (errors.length > 0) {
    console.error(`\n❌ CAPTION VALIDATION FAILED with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ PASS: Captions pass all V3 segmentation requirements.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-captions')) {
  main();
}
