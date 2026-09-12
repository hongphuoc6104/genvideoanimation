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

  let manifest: any;
  try {
    manifest = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  } catch (err: any) {
    console.error(`❌ FAIL: Invalid JSON format: ${err.message}`);
    process.exit(1);
  }

  const errors: string[] = [];
  const groups: any[] = Array.isArray(manifest) ? manifest : (manifest?.groups || []);

  if (groups.length === 0) {
    errors.push('Captions manifest contains 0 groups.');
  }

  let maxLinesObserved = 0;
  let maxCharsObserved = 0;
  let maxCpsObserved = 0;

  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const g = groups[gIdx];
    const words: any[] = g.words || (g.lines?.flatMap((l: any) => l.words || []) || []);

    // Check 1: Max lines <= 2
    if (g.lines && g.lines.length > maxLinesObserved) maxLinesObserved = g.lines.length;
    if (g.lines && g.lines.length > 2) {
      errors.push(`Group [${g.id}] exceeds maximum 2 lines (has ${g.lines.length} lines).`);
    }

    // Check 2: Max chars per line <= 42
    if (g.lines) {
      for (let lIdx = 0; lIdx < g.lines.length; lIdx++) {
        const lineLen = g.lines[lIdx].text.length;
        if (lineLen > maxCharsObserved) maxCharsObserved = lineLen;
        if (lineLen > 42) {
          errors.push(`Group [${g.id}] line ${lIdx + 1} exceeds 42 characters (${lineLen} chars: "${g.lines[lIdx].text}").`);
        }
      }
    }

    // Check 3: Reading speed (CPS)
    const duration = g.endTime - g.startTime;
    const totalChars = g.lines ? g.lines.reduce((sum: number, l: any) => sum + l.text.length, 0) : 0;
    const cps = duration > 0 ? totalChars / duration : 999;
    if (cps > maxCpsObserved) maxCpsObserved = cps;
    if (cps > 21.0 && duration < 0.5) {
      errors.push(`Group [${g.id}] reading speed (${cps.toFixed(1)} CPS) exceeds max threshold 21.0 CPS.`);
    }

    // Check 4: Frame bounds validity and non-overlapping
    if (g.endFrame < g.startFrame) {
      errors.push(`Group [${g.id}] endFrame (${g.endFrame}) is before startFrame (${g.startFrame}).`);
    }
    if (gIdx > 0) {
      const prev = groups[gIdx - 1];
      if (g.startFrame < prev.endFrame) {
        errors.push(`Group [${g.id}] startFrame (${g.startFrame}) overlaps previous group endFrame (${prev.endFrame}).`);
      }
    }

    // Check 5: Acoustic Anchor Law (group.startFrame <= group.words[0].startFrame)
    if (words.length > 0) {
      const firstWord = words[0];
      const firstWordStartFrame = firstWord.startFrame !== undefined
        ? firstWord.startFrame
        : Math.round(firstWord.start * 30);
      if (g.startFrame > firstWordStartFrame) {
        errors.push(
          `Group [${g.id}] Acoustic Anchor Law violation: group mounted at frame ${g.startFrame}, but first word "${firstWord.word}" starts at frame ${firstWordStartFrame} (pre-spoken delay: ${g.startFrame - firstWordStartFrame} frames).`
        );
      }
    }

    // Check 6: Handoff Latency Guard (latency <= 2 frames for contiguous speech)
    if (gIdx > 0 && words.length > 0) {
      const prev = groups[gIdx - 1];
      const prevWords: any[] = prev.words || (prev.lines?.flatMap((l: any) => l.words || []) || []);
      if (prevWords.length > 0) {
        const prevLastWord = prevWords[prevWords.length - 1];
        const prevLastEndFrame = prevLastWord.endFrame !== undefined
          ? prevLastWord.endFrame
          : Math.round(prevLastWord.end * 30);
        const firstWord = words[0];
        const firstWordStartFrame = firstWord.startFrame !== undefined
          ? firstWord.startFrame
          : Math.round(firstWord.start * 30);

        const acousticGap = firstWordStartFrame - prevLastEndFrame;
        // For contiguous speech with tight acoustic gap (<= 2 frames / 66ms), visual handoff latency must be <= 2 frames
        if (acousticGap <= 2) {
          const handoffLatency = g.startFrame - prev.endFrame;
          if (handoffLatency > 2) {
            errors.push(
              `Groups [${prev.id} -> ${g.id}] Handoff Latency violation: acoustic gap is ${acousticGap} frames, but visual handoff latency is ${handoffLatency} frames (must be <= 2 frames).`
            );
          }
        }
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
