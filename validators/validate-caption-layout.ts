#!/usr/bin/env tsx
/**
 * validators/validate-caption-layout.ts
 * Standalone CLI validator for caption visual layout and safe placement conforming to V3 R10.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CaptionsManifest, SubjectRegion } from '../packages/narration-kit/src/captions/types';

function aabbOverlap(
  b1: { x: number; y: number; width: number; height: number },
  b2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    b1.x + b1.width <= b2.x ||
    b2.x + b2.width <= b1.x ||
    b1.y + b1.height <= b2.y ||
    b2.y + b2.height <= b1.y
  );
}

function main() {
  const args = process.argv.slice(2);
  let captionsPath = 'captions.json';
  let subjectJson: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--captions' && args[i + 1]) {
      captionsPath = args[i + 1];
      i++;
    } else if (args[i] === '--subject' && args[i + 1]) {
      subjectJson = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      captionsPath = args[i];
    }
  }

  const resolvedPath = path.resolve(captionsPath);
  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Caption Layout & Collision Quality Gate`);
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
  const groups = manifest.groups || [];
  const canvasWidth = 1920;
  const canvasHeight = 1080;
  const safeMargin = 96;

  let subjectRegion: SubjectRegion | undefined;
  if (subjectJson) {
    try {
      subjectRegion = JSON.parse(subjectJson);
    } catch {}
  }

  for (const g of groups) {
    const box = g.box;

    // Check 1: Box inside frame
    if (box.x < 0 || box.y < 0 || box.x + box.width > canvasWidth || box.y + box.height > canvasHeight) {
      errors.push(`Group [${g.id}] extends outside canvas frame: [${box.x}, ${box.y}, ${box.width}, ${box.height}].`);
    }

    // Check 2: Safe margin violation
    if (
      box.x < safeMargin - 1 ||
      box.y < safeMargin - 1 ||
      box.x + box.width > canvasWidth - safeMargin + 1 ||
      box.y + box.height > canvasHeight - safeMargin + 1
    ) {
      errors.push(`Group [${g.id}] violates safe margin (${safeMargin}px): box=[${box.x}, ${box.y}, ${box.width}, ${box.height}].`);
    }

    // Check 3: Subject region collision
    if (subjectRegion && aabbOverlap(box, subjectRegion)) {
      errors.push(`Group [${g.id}] collides with ShotSpec subject region [${subjectRegion.x}, ${subjectRegion.y}, ${subjectRegion.width}, ${subjectRegion.height}].`);
    }
  }

  console.log(`  Groups Evaluated:     ${groups.length}`);
  console.log(`  Safe Margin:          ${safeMargin}px`);
  console.log(`  Subject Collisions:   ${errors.filter((e) => e.includes('collides with')).length}`);

  if (errors.length > 0) {
    console.error(`\n❌ CAPTION LAYOUT VALIDATION FAILED with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ PASS: Caption layout conforms to all visual safe area rules.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-caption-layout')) {
  main();
}
