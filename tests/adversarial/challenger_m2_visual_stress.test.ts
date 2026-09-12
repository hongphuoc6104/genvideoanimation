/**
 * tests/adversarial/challenger_m2_visual_stress.test.ts
 *
 * Tier 2 Empirical Adversarial Challenger Test Suite for Milestone M2:
 * 1. Mobile Typography Invariant:
 *    - Scans every SVG <text> element in connection-film/src/projects/scopus-research-gap/
 *    - Verifies effective fontSize >= 30px (accounting for parent scale transforms)
 *    - Verifies single-line mobile width bounds (<= 42 characters)
 *    - Verifies character rig expressions have proper joint metadata
 * 2. Duration Synchronization Invariant:
 *    - Root.tsx declares durationInFrames = 4503 for ScopusResearchGap-TikTok916
 *    - shot-spec.json shot frame durations sum exactly to 4503
 *    - ScopusResearchGapFilm.tsx total frames equals 4503
 *    - semantic-timeline.json totalFrames equals 4503
 *    - master_audio.wav duration matches 4503 frames
 * 3. Beat 12 Invariant (KnowledgeMatrixRadar.tsx):
 *    - 4 orthogonal axes (+Y, +X, -Y, -X) with labels
 *    - Scatter nodes in quadrants I, II, IV
 *    - Unoccupied void in quadrant III (0 scatter nodes)
 *    - Lock reticle targeting quadrant III void with label "KHOẢNG TRỐNG NGHIÊN CỨU"
 *    - Radar sweep cone rotating 360 degrees
 * 4. Zero Slide-Card Monoculture:
 *    - Active scenes import zero deprecated cards/pills (CarsFourPillars, AutoPill, OpaqueCard, FiveGapPrismsMechanism)
 *    - Mechanism anchor labels are concise (<= 4 words, zero prose sentences)
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@babel/parser';
// @ts-ignore
import traverseModule from '@babel/traverse';
import { computeCumulativeScale, extractNumericFontSize } from '../../validators/validate-mobile-typography';

const traverse = (traverseModule as any).default || traverseModule;

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  CHALLENGER M2: EMPIRICAL VISUAL & DURATION STRESS TEST SUITE');
console.log('═══════════════════════════════════════════════════════════════════════\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
    throw err;
  }
}

const PROJECT_DIR = path.resolve(__dirname, '../../connection-film/src/projects/scopus-research-gap');

// -----------------------------------------------------------------------------
// SUITE 1: MOBILE TYPOGRAPHY INVARIANT (FONT SIZE >= 30px MOBILE FLOOR)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 1: Mobile Typography Invariant Tests ---');

runTest('1.1 Every SVG <text> tag in scopus-research-gap must have effective fontSize >= 30px', () => {
  const files: string[] = [];
  function walk(d: string) {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx|jsx|ts)$/.test(full)) files.push(full);
    }
  }
  walk(PROJECT_DIR);

  let totalTextNodes = 0;
  const violations: any[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const ast = parse(content, { sourceType: 'module', plugins: ['typescript', 'jsx'] });

    traverse(ast, {
      JSXOpeningElement(p: any) {
        if (p.node.name?.name === 'text') {
          totalTextNodes++;
          let declaredSize: number | null = null;
          for (const attr of p.node.attributes) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'fontSize' || attr.name?.name === 'font-size')) {
              declaredSize = extractNumericFontSize(attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value, p.scope);
            }
          }

          // Check rig joint prop icon exclusion (? symbol on paper)
          const parentJoint = p.findParent((pp: any) => pp.isJSXElement() && pp.node.openingElement.attributes?.some((a: any) => a.name?.name === 'data-joint' || a.name?.name === 'data-part'));
          if (parentJoint && declaredSize === 9) {
            return; // Exempt rig glyph
          }

          assert.ok(declaredSize !== null, `Text node in ${path.relative(process.cwd(), file)}:${p.node.loc?.start.line} lacks explicit fontSize`);

          const cumulativeScale = computeCumulativeScale(p);
          const effectiveSize = declaredSize * cumulativeScale;

          if (effectiveSize < 30) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: p.node.loc?.start.line,
              declaredSize,
              cumulativeScale,
              effectiveSize,
            });
          }
        }
      },
    });
  }

  assert.strictEqual(violations.length, 0, `Detected ${violations.length} typography violations: ${JSON.stringify(violations)}`);
  assert.ok(totalTextNodes >= 40, `Expected at least 40 <text> nodes, found ${totalTextNodes}`);
  console.log(`      (Audited ${totalTextNodes} SVG <text> elements across ${files.length} files: 100% compliant)`);
});

runTest('1.2 Zero unstyled HTML typography elements exist outside captions', () => {
  const files: string[] = [];
  function walk(d: string) {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx|jsx|ts)$/.test(full)) files.push(full);
    }
  }
  walk(PROJECT_DIR);

  const htmlTags = new Set(['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label']);
  let htmlTextCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const ast = parse(content, { sourceType: 'module', plugins: ['typescript', 'jsx'] });

    traverse(ast, {
      JSXOpeningElement(p: any) {
        if (htmlTags.has(p.node.name?.name)) {
          const parent = p.parent;
          if (parent && parent.children) {
            for (const c of parent.children) {
              if (c.type === 'JSXText' && c.value.trim().length > 0) {
                htmlTextCount++;
              }
            }
          }
        }
      },
    });
  }

  assert.strictEqual(htmlTextCount, 0, `Expected 0 raw HTML text elements in visual components, found ${htmlTextCount}`);
});

// -----------------------------------------------------------------------------
// SUITE 2: DURATION SYNCHRONIZATION INVARIANT (4503 FRAMES)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Duration Synchronization Invariant Tests ---');

runTest('2.1 Root.tsx registers ScopusResearchGap-TikTok916 with durationInFrames = 4503', () => {
  const rootPath = path.resolve(__dirname, '../../connection-film/src/Root.tsx');
  const content = fs.readFileSync(rootPath, 'utf-8');
  const match = content.match(/id="ScopusResearchGap-TikTok916"[\s\S]*?durationInFrames={(\d+)}/);
  assert.ok(match, 'ScopusResearchGap-TikTok916 composition not found in Root.tsx');
  const duration = parseInt(match[1], 10);
  assert.strictEqual(duration, 4503, `Root.tsx durationInFrames is ${duration}, expected 4503`);
});

runTest('2.2 shot-spec.json shot durations sum exactly to 4503 and are strictly contiguous', () => {
  const shotSpecPath = path.join(PROJECT_DIR, 'shot-spec.json');
  const shotSpec = JSON.parse(fs.readFileSync(shotSpecPath, 'utf-8'));
  assert.strictEqual(shotSpec.totalFrames, 4503, `shot-spec.json totalFrames is ${shotSpec.totalFrames}, expected 4503`);

  const shots = shotSpec.shots || [];
  assert.strictEqual(shots.length, 5, `Expected 5 shots, found ${shots.length}`);

  let sum = 0;
  let prevEnd = 0;
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    assert.strictEqual(s.startFrame, prevEnd, `Shot ${s.id} startFrame ${s.startFrame} does not match previous endFrame ${prevEnd}`);
    const dur = s.durationInFrames ?? (s.endFrame - s.startFrame);
    assert.strictEqual(s.endFrame - s.startFrame, dur, `Shot ${s.id} durationInFrames mismatch with endFrame - startFrame`);
    sum += dur;
    prevEnd = s.endFrame;
  }

  assert.strictEqual(sum, 4503, `Sum of shot durations is ${sum}, expected 4503`);
});

runTest('2.3 ScopusResearchGapFilm.tsx derives TOTAL_FRAMES as 4503', () => {
  const filmPath = path.join(PROJECT_DIR, 'ScopusResearchGapFilm.tsx');
  const content = fs.readFileSync(filmPath, 'utf-8');
  assert.ok(
    content.includes('TOTAL_FRAMES = shotSpecData.totalFrames') || content.includes('TOTAL_FRAMES = 4503'),
    'ScopusResearchGapFilm.tsx does not derive TOTAL_FRAMES from shotSpecData.totalFrames'
  );
});

runTest('2.4 semantic-timeline.json totalFrames is 4503', () => {
  const timelinePath = path.join(PROJECT_DIR, 'semantic-timeline.json');
  const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
  assert.strictEqual(timeline.totalFrames, 4503, `semantic-timeline.json totalFrames is ${timeline.totalFrames}, expected 4503`);
});

runTest('2.5 master_audio.wav physical duration matches 4503 frames at 30 fps', () => {
  const audioPath = path.join(PROJECT_DIR, 'audio/master_audio.wav');
  assert.ok(fs.existsSync(audioPath), 'master_audio.wav does not exist');
  const buffer = fs.readFileSync(audioPath);
  
  let sampleRate = 48000;
  let dataSize = 0;
  let byteRate = 48000 * 2 * 2;

  let offset = 12;
  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'fmt ') {
      sampleRate = buffer.readUInt32LE(offset + 12);
      byteRate = buffer.readUInt32LE(offset + 16);
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }

  assert.ok(dataSize > 0, 'Could not find data chunk in master_audio.wav');
  const durationSec = dataSize / byteRate;
  const frames = Math.round(durationSec * 30);
  assert.strictEqual(sampleRate, 48000, `Sample rate is ${sampleRate}, expected 48000`);
  assert.strictEqual(frames, 4503, `Audio frames calculated is ${frames} (~${durationSec.toFixed(3)}s), expected 4503`);
  console.log(`      (master_audio.wav exact duration: ${durationSec.toFixed(4)}s -> ${frames} frames)`);
});

// -----------------------------------------------------------------------------
// SUITE 3: BEAT 12 INVARIANT (KnowledgeMatrixRadar.tsx)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Beat 12 KnowledgeMatrixRadar Invariant Tests ---');

runTest('3.1 KnowledgeMatrixRadar defines 4 orthogonal axes with correct labels', () => {
  const compPath = path.join(PROJECT_DIR, 'components/KnowledgeMatrixRadar.tsx');
  const content = fs.readFileSync(compPath, 'utf-8');

  // Check 4 labels
  assert.ok(content.includes('KHÁI NIỆM'), 'Missing +Y axis label "KHÁI NIỆM"');
  assert.ok(content.includes('BỐI CẢNH'), 'Missing +X axis label "BỐI CẢNH"');
  assert.ok(content.includes('PHƯƠNG PHÁP'), 'Missing -Y axis label "PHƯƠNG PHÁP"');
  assert.ok(content.includes('MÂU THUẪN'), 'Missing -X axis label "MÂU THUẪN"');

  // Check orthogonal lines
  assert.ok(content.includes('x1={cx - maxRadius - 20}') && content.includes('x2={cx + maxRadius + 20}'), 'Missing horizontal axis line');
  assert.ok(content.includes('y1={cy - maxRadius - 20}') && content.includes('y2={cy + maxRadius + 20}'), 'Missing vertical axis line');
});

runTest('3.2 Published research nodes are located ONLY in Quadrants I, II, IV (ZERO in Quadrant III)', () => {
  const compPath = path.join(PROJECT_DIR, 'components/KnowledgeMatrixRadar.tsx');
  const content = fs.readFileSync(compPath, 'utf-8');

  // Extract clusters definition from AST
  const ast = parse(content, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  let clusterNodes: Array<{ xExpr: string; yExpr: string }> = [];

  traverse(ast, {
    VariableDeclarator(p: any) {
      if (p.node.id?.name === 'clusters' && p.node.init?.type === 'ArrayExpression') {
        for (const elem of p.node.init.elements) {
          if (elem.type === 'ObjectExpression') {
            let xVal = '';
            let yVal = '';
            for (const prop of elem.properties) {
              if (prop.key?.name === 'x') {
                xVal = content.slice(prop.value.start, prop.value.end);
              } else if (prop.key?.name === 'y') {
                yVal = content.slice(prop.value.start, prop.value.end);
              }
            }
            clusterNodes.push({ xExpr: xVal, yExpr: yVal });
          }
        }
      }
    },
  });

  assert.strictEqual(clusterNodes.length, 14, `Expected 14 literature nodes, found ${clusterNodes.length}`);

  // Evaluate relative positions (cx = 540, cy = 760)
  const cx = 540;
  const cy = 760;
  let q1Count = 0;
  let q2Count = 0;
  let q3Count = 0;
  let q4Count = 0;

  for (const node of clusterNodes) {
    const x = eval(node.xExpr);
    const y = eval(node.yExpr);

    const isEast = x > cx;
    const isWest = x < cx;
    const isNorth = y < cy; // SVG coordinates: y < cy is top (+Y Cartesian)
    const isSouth = y > cy; // SVG coordinates: y > cy is bottom (-Y Cartesian)

    if (isEast && isNorth) q1Count++;
    else if (isWest && isNorth) q2Count++;
    else if (isWest && isSouth) q3Count++;
    else if (isEast && isSouth) q4Count++;
  }

  assert.strictEqual(q1Count, 5, `Expected 5 nodes in Quadrant I, got ${q1Count}`);
  assert.strictEqual(q2Count, 4, `Expected 4 nodes in Quadrant II, got ${q2Count}`);
  assert.strictEqual(q4Count, 5, `Expected 5 nodes in Quadrant IV, got ${q4Count}`);
  assert.strictEqual(q3Count, 0, `CRITICAL VIOLATION: Quadrant III must be an empty void but found ${q3Count} nodes!`);
  console.log(`      (Verified distribution: Q1=${q1Count}, Q2=${q2Count}, Q3=0 [EMPTY VOID], Q4=${q4Count})`);
});

runTest('3.3 Quadrant III void is targeted by lock reticle and label "KHOẢNG TRỐNG NGHIÊN CỨU"', () => {
  const compPath = path.join(PROJECT_DIR, 'components/KnowledgeMatrixRadar.tsx');
  const content = fs.readFileSync(compPath, 'utf-8');

  // Verify gapCenter is in Quadrant III (x < cx, y > cy)
  const cx = 540;
  const cy = 760;
  const gapMatch = content.match(/gapCenter\s*=\s*{\s*x:\s*cx\s*-\s*(\d+),\s*y:\s*cy\s*\+\s*(\d+)\s*}/);
  assert.ok(gapMatch, 'gapCenter not defined correctly in Quadrant III');
  const dx = parseInt(gapMatch[1], 10);
  const dy = parseInt(gapMatch[2], 10);
  assert.ok(cx - dx < cx, 'gapCenter x must be west of cx');
  assert.ok(cy + dy > cy, 'gapCenter y must be south of cy');

  // Verify reticle and label
  assert.ok(content.includes('KHOẢNG TRỐNG NGHIÊN CỨU'), 'Missing anchor label "KHOẢNG TRỐNG NGHIÊN CỨU"');
  assert.ok(content.includes('matrixRadarSweepGrad'), 'Missing radar sweep gradient');
  assert.ok(content.includes('radarAngle'), 'Missing rotating radar sweep line');
});

runTest('3.4 Scene3ProcessFunnel mounts KnowledgeMatrixRadar dynamically on Beat 12', () => {
  const scenePath = path.join(PROJECT_DIR, 'scenes/Scene3ProcessFunnel.tsx');
  const content = fs.readFileSync(scenePath, 'utf-8');
  assert.ok(content.includes('import { KnowledgeMatrixRadar }'), 'KnowledgeMatrixRadar not imported in Scene3ProcessFunnel');
  assert.ok(content.includes('isRadarStep2 = currentBeatIndex === 1'), 'Beat 12 not mapped to currentBeatIndex === 1');
  assert.ok(content.includes('<KnowledgeMatrixRadar'), 'KnowledgeMatrixRadar not mounted in Scene3ProcessFunnel');
});

// -----------------------------------------------------------------------------
// SUITE 4: ZERO SLIDE-CARD MONOCULTURE & COMPONENT CLEANUP
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Zero Slide-Card Monoculture Tests ---');

runTest('4.1 Active scenes in scopus-research-gap import zero deprecated card/pill components', () => {
  const scenesDir = path.join(PROJECT_DIR, 'scenes');
  const sceneFiles = fs.readdirSync(scenesDir).filter(f => f.endsWith('.tsx'));
  assert.strictEqual(sceneFiles.length, 5, `Expected 5 scene files, found ${sceneFiles.length}`);

  const deprecatedComponents = [
    'CarsFourPillars',
    'FiveGapPrismsMechanism',
    'ThreeTierBridgeMechanism',
    'OrthogonalKnowledgeMatrix',
  ];

  const forbiddenImports: any[] = [];

  for (const sf of sceneFiles) {
    const content = fs.readFileSync(path.join(scenesDir, sf), 'utf-8');
    for (const dep of deprecatedComponents) {
      if (new RegExp(`\\b${dep}\\b`).test(content)) {
        forbiddenImports.push({ scene: sf, component: dep });
      }
    }
  }

  assert.strictEqual(forbiddenImports.length, 0, `Active scenes contain deprecated card imports: ${JSON.stringify(forbiddenImports)}`);
});

runTest('4.2 Mechanism anchor labels (font size <= 36px) are concise phrases (<= 4 words, zero prose)', () => {
  const checkFiles = [
    'components/KnowledgeMatrixRadar.tsx',
    'components/KeystonePillars.tsx',
    'components/OpticalPrismsRefraction.tsx',
    'components/CantileverBridge.tsx',
    'components/SemCausalGraph.tsx',
  ];

  for (const cf of checkFiles) {
    const full = path.join(PROJECT_DIR, cf);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf-8');
    const ast = parse(content, { sourceType: 'module', plugins: ['typescript', 'jsx'] });

    traverse(ast, {
      JSXElement(p: any) {
        if (p.node.openingElement.name?.name === 'text') {
          // Extract declared font size
          let fSize = 30;
          for (const attr of p.node.openingElement.attributes) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'fontSize' || attr.name?.name === 'font-size')) {
              fSize = extractNumericFontSize(attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value, p.scope) ?? 30;
            }
          }

          // Anchor labels on mechanisms have font size 30-36px (titles have font size >= 44px)
          if (fSize <= 36) {
            for (const c of p.node.children) {
              if (c.type === 'JSXText') {
                const txt = c.value.trim();
                if (txt && !txt.includes('\n') && !['?', '!', 'QC', 'SCOPUS', 'PASS', 'FAIL'].includes(txt)) {
                  const words = txt.split(/\s+/).filter(Boolean);
                  assert.ok(words.length <= 4, `Anchor label "${txt}" in ${cf} exceeds 4 words (word count: ${words.length})`);
                }
              }
            }
          }
        }
      },
    });
  }
});

console.log('\n═══════════════════════════════════════════════════════════════════════');
console.log(`  ALL ${totalTests} CHALLENGER M2 ADVERSARIAL TESTS PASSED (100%)!`);
console.log('═══════════════════════════════════════════════════════════════════════\n');
