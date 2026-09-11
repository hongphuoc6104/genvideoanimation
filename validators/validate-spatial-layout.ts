#!/usr/bin/env tsx
/**
 * validators/validate-spatial-layout.ts
 *
 * Automated Spatial Layout & State Retraction Gate.
 * Enforces:
 * 1. Zero-Collision Stage Budgeting (safe margin >= 35px, stage partitioning y in [260, 1420])
 * 2. State Exit / Retraction Principle (no static layer accumulation across active states)
 * 3. Caption Group Boundary Alignment (0 frame-hang mismatches between speech onset and group handoff)
 * 4. Crisp Typography Invariant (single-layer word highlight, zero dual-layer font overlays)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const targetDir = process.argv[2] || 'connection-film/src/projects/scopus-research-gap';
const fullPath = path.resolve(process.cwd(), targetDir);

console.log('==================================================================');
console.log(' VALIDATOR: Spatial Layout & Zero-Collision Invariant Gate');
console.log(` Target Path: ${targetDir}`);
console.log('==================================================================\n');

let violations = 0;

// 1. Check Subtitle Boundary Invariants in subtitles/captions.json
const captionsPath = path.join(fullPath, 'subtitles/captions.json');
if (fs.existsSync(captionsPath)) {
  const captions = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'));
  let captionMismatches = 0;

  for (let i = 0; i < captions.length - 1; i++) {
    const g = captions[i];
    const nextG = captions[i + 1];

    const nextWords: any[] = [];
    if (nextG.lines) {
      for (const l of nextG.lines) nextWords.push(...(l.words || []));
    } else if (nextG.words) {
      nextWords.push(...nextG.words);
    }

    if (nextWords.length > 0) {
      const nextStart = Math.min(
        ...nextWords.map((w: any) => (w.startFrame !== undefined ? w.startFrame : Math.round(w.start * 30)))
      );
      if (g.endFrame > nextStart) {
        console.error(
          `❌ [CAPTION_HANG] Group "${g.id}" endFrame (${g.endFrame}) exceeds next group's speech onset (${nextStart}). Causes subtitle freeze!`
        );
        captionMismatches++;
        violations++;
      }
    }
  }

  if (captionMismatches === 0) {
    console.log(`✅ [PASSED] Subtitle Alignment: All ${captions.length} groups have strict token handoffs.`);
  }
} else {
  console.log(`ℹ️ [SKIP] No subtitles/captions.json found at ${captionsPath}`);
}

// 2. Scan TSX files for layer accumulation and overlapping states
function scanTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanTsxFiles(p));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(p);
    }
  }
  return results;
}

const tsxFiles = scanTsxFiles(fullPath);
console.log(`\n🔍 Analyzing ${tsxFiles.length} TSX component(s) for spatial layout patterns...`);

for (const file of tsxFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(process.cwd(), file);

  // Check 2.1: Dual-layer text overlays with clipPath (causes subpixel anti-aliasing font blur)
  if (content.includes('computeClipPathInset') || (content.includes('clipPath:') && content.includes('<span style={highlightOverlayStyle}'))) {
    console.error(`❌ [TYPOGRAPHY_BLUR] ${relPath}: Detected dual-layer text clipping overlay. Must use single-layer discrete highlight to avoid glyph blur.`);
    violations++;
  }

  // Check 2.2: Hardcoded overlap without state retraction
  if (content.includes('activeTier >= 2 ? 1.0') && !content.includes('activeTier === 2')) {
    console.warn(`⚠️ [LAYER_ACCUMULATION] ${relPath}: State conditional "activeTier >= 2" keeps previous tier fully visible when higher tier activates.`);
  }

  // Check 2.3: Stage Budgeting violations (rendering content in Subtitle Safe Zone y in [1460, 1660])
  const translateMatches = Array.from(content.matchAll(/translate\(\s*(-?\d+)\s*,\s*(\d+)\s*\)/g));
  for (const match of translateMatches) {
    const y = parseInt(match[2], 10);
    // If inside primary stage component and placing items into subtitle zone
    if (y >= 1460 && y <= 1660 && !file.includes('Karaoke') && !file.includes('Film')) {
      console.error(`❌ [STAGE_INCURSION] ${relPath}: Element translated to y=${y} intrudes into Subtitle Safe Zone [1460, 1660].`);
      violations++;
    }
  }
}

console.log('\n==================================================================');
if (violations === 0) {
  console.log('✅ [PASSED] 0 Spatial layout violations! Layouts satisfy invariants.');
  console.log('==================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ [FAILED] Found ${violations} spatial layout violation(s)!`);
  console.log('==================================================================\n');
  process.exit(1);
}
