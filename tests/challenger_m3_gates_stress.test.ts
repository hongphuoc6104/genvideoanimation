/**
 * tests/challenger_m3_gates_stress.test.ts
 *
 * Empirical Challenger Stress Test Suite for Milestone M3:
 * 1. scripts/run-production-gate.ts:
 *    - Verify --lean-visual bypasses only G04, G04B, G04D and strictly runs G01, G02, G03, G04C, G05, G05B, G06, G07, G08.
 *    - Verify fail-closed behavior on broken gates.
 * 2. validators/extract-contact-sheet.ts:
 *    - Keyframe extraction, boundary conditions, and file integrity.
 *    - Fail-closed behavior on duration mismatch (video shorter than timeline).
 * 3. scripts/evaluate-vision-rubric.ts:
 *    - Stress-test the 3 core criteria (Anti-slide monoculture, 1:1 semantic match, aesthetic/spatial hierarchy)
 *      with adversarial inputs (text-heavy slide fixtures, static frames, buffer intrusion, corrupted files).
 *    - Verify --strict fails closed on subpar scores.
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { extractContactSheet } from '../validators/extract-contact-sheet';
import { evaluateVisionRubric, evaluateBeat } from '../scripts/evaluate-vision-rubric';

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('  CHALLENGER M3 EMPIRICAL STRESS & ADVERSARIAL VERIFICATION SUITE');
console.log('═══════════════════════════════════════════════════════════════════════\n');

let totalTests = 0;
let passedTests = 0;
const findings: Array<{ section: string; title: string; severity: string; details: string }> = [];

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

async function runAsyncTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
    throw err;
  }
}

const TEST_SCRATCH = path.resolve(__dirname, '../out/.challenger_m3_tmp');
if (fs.existsSync(TEST_SCRATCH)) {
  fs.rmSync(TEST_SCRATCH, { recursive: true, force: true });
}
fs.mkdirSync(TEST_SCRATCH, { recursive: true });

async function runAll() {
  // ============================================================================
  // SECTION 1: scripts/run-production-gate.ts
  // ============================================================================
  console.log('\n--- SECTION 1: scripts/run-production-gate.ts ---');

  runTest('1.1 Parse and verify gate definitions in scripts/run-production-gate.ts for --lean-visual', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../scripts/run-production-gate.ts'), 'utf-8');
    const gatesMatch = content.match(/const gates: GateDef\[\] = \[([\s\S]*?)\];/);
    assert.ok(gatesMatch, 'gates array must be defined in scripts/run-production-gate.ts');
    
    const gateBlocks = gatesMatch[1].split(/\{[\s\n]*id:/).slice(1);
    const gateMap = new Map<string, boolean>();
    
    for (const b of gateBlocks) {
      const id = b.match(/^[\s]*['"]([^'"]+)['"]/)?.[1];
      if (id) {
        const skip = b.includes('skipInLeanVisual: true');
        gateMap.set(id, skip);
      }
    }

    assert.strictEqual(gateMap.get('G04-visual-semantics'), true, 'G04-visual-semantics must be skipped in lean-visual');
    assert.strictEqual(gateMap.get('G04B-layout-geometry'), true, 'G04B-layout-geometry must be skipped in lean-visual');
    assert.strictEqual(gateMap.get('G04D-runtime-geometry'), true, 'G04D-runtime-geometry must be skipped in lean-visual');

    // Expected non-bypassed gates per mission requirements:
    const expectedNonBypassed = [
      'G01-mobile-typography',
      'G02-portability',
      'G03-audio-ownership',
      'G05-contact-sheet',
      'G05B-vision-rubric',
      'G06-temporal-qa',
      'G07-preview-parity',
      'G08-preview-rubric'
    ];

    for (const gid of expectedNonBypassed) {
      assert.strictEqual(gateMap.get(gid), false, `${gid} must NOT be skipped in lean-visual`);
    }

    // AUDIT OBSERVATION ON G04C:
    const g04cSkipped = gateMap.get('G04C-frame-salience');
    if (g04cSkipped === true) {
      findings.push({
        section: 'scripts/run-production-gate.ts',
        title: 'G04C-frame-salience is bypassed in --lean-visual contrary to mission specification',
        severity: 'MAJOR',
        details: 'Line 167 in scripts/run-production-gate.ts sets skipInLeanVisual: true for G04C-frame-salience. Mission specification requires that --lean-visual bypasses ONLY G04, G04B, G04D and strictly executes G04C. Worker falsely claimed in handoff.md that G04C was executed.'
      });
      console.log('     ⚠️ FINDING RECORDED: G04C-frame-salience has skipInLeanVisual: true (Bypassed)!');
    }
  });

  runTest('1.2 Fail-closed: run-production-gate.ts halts immediately when shot-spec.json is missing', () => {
    const fakeProjectDir = path.join(TEST_SCRATCH, 'fake-missing-spec');
    fs.mkdirSync(fakeProjectDir, { recursive: true });
    fs.writeFileSync(path.join(fakeProjectDir, 'semantic-timeline.json'), JSON.stringify({ beats: [] }));

    const res = spawnSync('npx', ['tsx', 'scripts/run-production-gate.ts', `--project=${fakeProjectDir}`, '--lean-visual'], {
      stdio: 'pipe',
    });
    assert.strictEqual(res.status, 1, 'Process must exit with status code 1 when shot-spec.json is missing');
    assert.ok(res.stderr.toString().includes('shot-spec.json missing'), 'Error message must cite missing shot-spec.json');
  });

  runTest('1.3 Fail-closed: run-production-gate.ts halts immediately when semantic-timeline.json is missing', () => {
    const fakeProjectDir = path.join(TEST_SCRATCH, 'fake-missing-tl');
    fs.mkdirSync(fakeProjectDir, { recursive: true });
    fs.writeFileSync(path.join(fakeProjectDir, 'shot-spec.json'), JSON.stringify({ shots: [] }));

    const res = spawnSync('npx', ['tsx', 'scripts/run-production-gate.ts', `--project=${fakeProjectDir}`, '--lean-visual'], {
      stdio: 'pipe',
    });
    assert.strictEqual(res.status, 1, 'Process must exit with status code 1 when semantic-timeline.json is missing');
    assert.ok(res.stderr.toString().includes('semantic-timeline.json missing'), 'Error message must cite missing semantic-timeline.json');
  });

  runTest('1.4 Fail-closed: run-production-gate.ts halts on G01 typography violation', () => {
    const badProjectDir = path.join(TEST_SCRATCH, 'bad-typo-project');
    fs.mkdirSync(path.join(badProjectDir, 'scenes'), { recursive: true });
    fs.writeFileSync(path.join(badProjectDir, 'shot-spec.json'), JSON.stringify({ shots: [] }));
    fs.writeFileSync(path.join(badProjectDir, 'semantic-timeline.json'), JSON.stringify({ beats: [{ id: 'b1', startFrame: 0, endFrame: 30 }] }));
    fs.writeFileSync(path.join(badProjectDir, 'scenes/BadScene.tsx'), `
      import React from 'react';
      export const BadScene = () => {
        return <div style={{ fontSize: 18 }}>Subpar illegal font</div>;
      };
    `);

    const res = spawnSync('npx', ['tsx', 'scripts/run-production-gate.ts', `--project=${badProjectDir}`, '--lean-visual'], {
      stdio: 'pipe',
    });
    assert.strictEqual(res.status, 1, 'Process must exit with code 1 when typography violation occurs');
    const combined = res.stdout.toString() + res.stderr.toString();
    assert.ok(combined.includes('G01-mobile-typography') && combined.includes('FAIL'), 'Output must indicate G01 failure');
  });

  runTest('1.5 Fail-closed: run-production-gate.ts halts on G03 audio ownership violation in isolated fixture', () => {
    const badAudioProj = path.join(TEST_SCRATCH, 'bad-audio-proj');
    fs.mkdirSync(path.join(badAudioProj, 'scenes'), { recursive: true });
    fs.writeFileSync(path.join(badAudioProj, 'shot-spec.json'), JSON.stringify({ shots: [] }));
    fs.writeFileSync(path.join(badAudioProj, 'semantic-timeline.json'), JSON.stringify({ beats: [{ id: 'b1', startFrame: 0, endFrame: 30 }] }));
    fs.writeFileSync(path.join(badAudioProj, 'scenes/LegalScene.tsx'), `
      import React from 'react';
      import { Audio } from 'remotion';
      export const LegalScene = () => {
        return (
          <div style={{ fontSize: 36 }}>
            <Audio src="audio1.wav" />
            <Audio src="audio2.wav" />
          </div>
        );
      };
    `);

    const res = spawnSync('npx', ['tsx', 'scripts/run-production-gate.ts', `--project=${badAudioProj}`, '--lean-visual'], {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    assert.strictEqual(res.status, 1, 'Process must exit with code 1 on audio ownership violation');
    const output = res.stdout + res.stderr;
    assert.ok(output.includes('G03-audio-ownership') && output.includes('FAIL'), 'Must log G03 failure');
    assert.ok(output.includes('CANONICAL PRODUCTION GATE HALTED: FAIL-CLOSED ON G03-audio-ownership'), 'Must log FAIL-CLOSED banner');
  });

  // ============================================================================
  // SECTION 2: validators/extract-contact-sheet.ts
  // ============================================================================
  console.log('\n--- SECTION 2: validators/extract-contact-sheet.ts ---');

  await runAsyncTest('2.1 Verify clean single-pass batch extraction on production video (scopus-research-gap 150s)', async () => {
    const outDir = path.join(TEST_SCRATCH, 'scopus-contact-sheet-real');
    const manifest = await extractContactSheet({
      timelinePath: 'connection-film/src/projects/scopus-research-gap/semantic-timeline.json',
      videoPath: 'out/scopus-research-gap-preview-360x640.mp4',
      outDir,
      verbose: false,
    });

    assert.strictEqual(manifest.totalBeats, 23, 'Must extract 23 beats');
    assert.strictEqual(manifest.totalFramesExtracted, 69, 'Must extract 69 keyframes (3 per beat)');

    // Verify all 69 files exist, are valid PNG format, non-empty
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    for (const b of manifest.beats) {
      for (const role of ['start', 'mid', 'end'] as const) {
        const fileName = b.frames[role];
        const filePath = path.join(outDir, fileName);
        assert.ok(fs.existsSync(filePath), `Frame file ${filePath} must exist`);
        
        const stat = fs.statSync(filePath);
        assert.ok(stat.size > 1000, `Frame ${fileName} size (${stat.size} bytes) must be substantial PNG`);

        const fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(8);
        fs.readSync(fd, header, 0, 8, 0);
        fs.closeSync(fd);
        assert.ok(header.equals(pngSignature), `Frame ${fileName} must have valid PNG magic signature`);
      }
      assert.ok(b.startFrame <= b.midFrame, `startFrame <= midFrame for ${b.beatId}`);
      assert.ok(b.midFrame <= b.endFrame, `midFrame <= endFrame for ${b.beatId}`);
    }
  });

  await runAsyncTest('2.2 Fail-closed: extraction fails when video duration is shorter than timeline', async () => {
    // Pass a 35-second video (pump) with a 150-second timeline (scopus)
    // Verify that extractContactSheet throws fail-closed when seeking past EOF!
    const outDir = path.join(TEST_SCRATCH, 'duration-mismatch-test');
    await assert.rejects(
      async () => {
        await extractContactSheet({
          timelinePath: 'connection-film/src/projects/scopus-research-gap/semantic-timeline.json',
          videoPath: 'out/sodium-potassium-pump-preview-360x640.mp4',
          outDir,
        });
      },
      /Failed to extract keyframe/,
      'Must throw when keyframe timestamp exceeds video duration (fail-closed)'
    );
  });

  await runAsyncTest('2.3 Boundary condition: 1-frame duration beat (startFrame === endFrame)', async () => {
    const singleFrameTlPath = path.join(TEST_SCRATCH, 'single-frame-timeline.json');
    fs.writeFileSync(singleFrameTlPath, JSON.stringify({
      fps: 30,
      beats: [
        {
          id: 'beat_one_frame',
          startFrame: 60,
          endFrame: 60,
          visualIntent: 'Flash event',
        }
      ]
    }, null, 2));

    const outDir = path.join(TEST_SCRATCH, 'contact-sheet-single-frame');
    const manifest = await extractContactSheet({
      timelinePath: singleFrameTlPath,
      videoPath: 'out/sodium-potassium-pump-preview-360x640.mp4',
      outDir,
    });

    assert.strictEqual(manifest.beats.length, 1);
    const b = manifest.beats[0];
    assert.strictEqual(b.startFrame, 60);
    assert.strictEqual(b.midFrame, 60);
    assert.strictEqual(b.endFrame, 60);
    
    for (const role of ['start', 'mid', 'end'] as const) {
      const fPath = path.join(outDir, b.frames[role]);
      assert.ok(fs.existsSync(fPath) && fs.statSync(fPath).size > 1000, `Single-frame ${role} file must exist`);
    }
  });

  await runAsyncTest('2.4 Boundary condition: Beat at frame 0 and continuous back-to-back beats', async () => {
    const boundaryTlPath = path.join(TEST_SCRATCH, 'boundary-timeline.json');
    fs.writeFileSync(boundaryTlPath, JSON.stringify({
      fps: 30,
      beats: [
        { id: 'beat_zero', startFrame: 0, endFrame: 30 },
        { id: 'beat_consecutive', startFrame: 30, endFrame: 60 },
      ]
    }, null, 2));

    const outDir = path.join(TEST_SCRATCH, 'contact-sheet-boundary');
    const manifest = await extractContactSheet({
      timelinePath: boundaryTlPath,
      videoPath: 'out/sodium-potassium-pump-preview-360x640.mp4',
      outDir,
    });

    assert.strictEqual(manifest.beats[0].startFrame, 0);
    assert.strictEqual(manifest.beats[0].midFrame, 15);
    assert.strictEqual(manifest.beats[0].endFrame, 29);
    assert.strictEqual(manifest.beats[1].startFrame, 30);
    assert.strictEqual(manifest.beats[1].endFrame, 59);
  });

  await runAsyncTest('2.5 Fail-closed: missing video file throws error', async () => {
    await assert.rejects(
      async () => {
        await extractContactSheet({
          timelinePath: 'connection-film/src/projects/sodium-potassium-pump/semantic-timeline.json',
          videoPath: 'out/non_existent_video_file_xyz.mp4',
          outDir: path.join(TEST_SCRATCH, 'throw-missing-vid'),
        });
      },
      /Video file not found/
    );
  });

  await runAsyncTest('2.6 Fail-closed: missing timeline file throws error', async () => {
    await assert.rejects(
      async () => {
        await extractContactSheet({
          timelinePath: 'non_existent_timeline_123.json',
          videoPath: 'out/sodium-potassium-pump-preview-360x640.mp4',
          outDir: path.join(TEST_SCRATCH, 'throw-missing-tl'),
        });
      },
      /Timeline file not found/
    );
  });

  await runAsyncTest('2.7 Fail-closed: empty beats in timeline throws error', async () => {
    const emptyTlPath = path.join(TEST_SCRATCH, 'empty-beats.json');
    fs.writeFileSync(emptyTlPath, JSON.stringify({ beats: [] }));
    await assert.rejects(
      async () => {
        await extractContactSheet({
          timelinePath: emptyTlPath,
          videoPath: 'out/sodium-potassium-pump-preview-360x640.mp4',
          outDir: path.join(TEST_SCRATCH, 'throw-empty-beats'),
        });
      },
      /No semantic beats found/
    );
  });

  // ============================================================================
  // SECTION 3: scripts/evaluate-vision-rubric.ts
  // ============================================================================
  console.log('\n--- SECTION 3: scripts/evaluate-vision-rubric.ts ---');

  runTest('3.1 Verify baseline rubric evaluation on scopus-research-gap contact sheet', () => {
    const manifestPath = path.resolve(__dirname, '../out/contact-sheets/scopus-research-gap/contact-sheet-manifest.json');
    assert.ok(fs.existsSync(manifestPath), `Manifest must exist at ${manifestPath}`);

    const report = evaluateVisionRubric({
      manifestPath,
      outputPath: path.join(TEST_SCRATCH, 'baseline-report.json'),
      strict: true,
    });

    assert.strictEqual(report.totalBeats, 23);
    assert.ok(report.overallScore >= 4.50, `Overall score (${report.overallScore}) must be >= 4.50`);
    assert.ok(report.categoryScores.antiSlideMonoculture >= 4.30, `Anti-slide score (${report.categoryScores.antiSlideMonoculture}) must be >= 4.30`);
    assert.ok(report.categoryScores.semanticCorrespondence >= 4.30, `Semantic match score (${report.categoryScores.semanticCorrespondence}) must be >= 4.30`);
    assert.ok(report.categoryScores.aestheticHierarchy >= 4.00, `Aesthetic score (${report.categoryScores.aestheticHierarchy}) must be >= 4.00`);
    assert.strictEqual(report.passed, true, 'Report must pass on real production video');
  });

  runTest('3.2 Adversarial stress test: massive prose card slide fixture is severely penalized', () => {
    const advDir = path.join(TEST_SCRATCH, 'adv-slide');
    fs.mkdirSync(advDir, { recursive: true });

    const startPng = path.join(advDir, 'adv_start.png');
    const midPng = path.join(advDir, 'adv_mid.png');
    const endPng = path.join(advDir, 'adv_end.png');

    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vframes 1 "${startPng}"`);
    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vf "drawbox=x=30:y=100:w=300:h=300:color=0xEEEEEE:t=fill" -vframes 1 "${midPng}"`);
    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vframes 1 "${endPng}"`);

    const beatItem = {
      beatId: 'beat_text_heavy_slide',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      visualIntent: 'Dense textual summary card',
      frames: {
        start: 'adv_start.png',
        mid: 'adv_mid.png',
        end: 'adv_end.png',
      }
    };

    const evalResult = evaluateBeat(beatItem, advDir);
    console.log(`     Adversarial Slide Anti-Slide Score: ${evalResult.antiSlideScore}/5.00`);
    console.log(`     Adversarial Critique: ${evalResult.critique}`);

    assert.ok(evalResult.antiSlideScore < 4.0, `Anti-slide score (${evalResult.antiSlideScore}) must be penalized below 4.0 for text-heavy slide`);

    const advManifestPath = path.join(advDir, 'adv-manifest.json');
    fs.writeFileSync(advManifestPath, JSON.stringify({
      version: '3.3.0',
      totalBeats: 1,
      beats: [beatItem],
    }, null, 2));

    const advReport = evaluateVisionRubric({
      manifestPath: advManifestPath,
      outputPath: path.join(advDir, 'adv-report.json'),
      strict: false,
    });

    assert.strictEqual(advReport.passed, false, 'Manifest containing text-heavy slide must fail passed check');

    const cliRes = spawnSync('npx', ['tsx', 'scripts/evaluate-vision-rubric.ts', advManifestPath, '--strict'], {
      stdio: 'pipe',
    });
    assert.strictEqual(cliRes.status, 1, 'CLI must exit with code 1 when --strict is passed on failing rubric');
  });

  runTest('3.3 Adversarial stress test: static scene (zero kinetic motion) penalizes semantic score', () => {
    const staticDir = path.join(TEST_SCRATCH, 'adv-static');
    fs.mkdirSync(staticDir, { recursive: true });

    const framePng = path.join(staticDir, 'static_frame.png');
    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vf "drawbox=x=100:y=200:w=160:h=160:color=0x06B6D4:t=fill" -vframes 1 "${framePng}"`);

    const beatItem = {
      beatId: 'beat_frozen_static',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      visualIntent: 'A frozen static box',
      frames: {
        start: 'static_frame.png',
        mid: 'static_frame.png',
        end: 'static_frame.png',
      }
    };

    const evalResult = evaluateBeat(beatItem, staticDir);
    console.log(`     Frozen Static Semantic Score: ${evalResult.semanticMatchScore}/5.00`);
    assert.ok(evalResult.semanticMatchScore <= 4.20, `Semantic score (${evalResult.semanticMatchScore}) must be <= 4.20 when frame has 0 motion`);
  });

  runTest('3.4 Adversarial stress test: subtitle zone intrusion penalizes aesthetic score', () => {
    const intrudeDir = path.join(TEST_SCRATCH, 'adv-intrusion');
    fs.mkdirSync(intrudeDir, { recursive: true });

    const startPng = path.join(intrudeDir, 'start.png');
    const midPng = path.join(intrudeDir, 'mid.png');
    const endPng = path.join(intrudeDir, 'end.png');

    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vframes 1 "${startPng}"`);
    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vf "drawbox=x=30:y=475:w=300:h=30:color=0xEF4444:t=fill" -vframes 1 "${midPng}"`);
    execSync(`ffmpeg -y -v error -f lavfi -i "color=c=0x0F172A:s=360x640:d=1" -vframes 1 "${endPng}"`);

    const beatItem = {
      beatId: 'beat_intrusion',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      frames: {
        start: 'start.png',
        mid: 'mid.png',
        end: 'end.png',
      }
    };

    const evalResult = evaluateBeat(beatItem, intrudeDir);
    console.log(`     Subtitle Intrusion Aesthetic Score: ${evalResult.aestheticScore}/5.00`);
    assert.ok(evalResult.aestheticScore <= 4.50, `Aesthetic score (${evalResult.aestheticScore}) must be penalized for subtitle intrusion`);
  });

  runTest('3.5 Fail-closed: missing manifest or malformed manifest fails gracefully', () => {
    assert.throws(
      () => {
        evaluateVisionRubric({ manifestPath: 'non_existent_manifest.json' });
      },
      /Contact sheet manifest not found/
    );

    const malformedPath = path.join(TEST_SCRATCH, 'malformed-manifest.json');
    fs.writeFileSync(malformedPath, '{ "beats": [ invalid_json }');
    assert.throws(
      () => {
        evaluateVisionRubric({ manifestPath: malformedPath });
      },
      /Failed to parse contact sheet manifest/
    );
  });

  // Clean scratch artifacts
  try {
    fs.rmSync(TEST_SCRATCH, { recursive: true, force: true });
  } catch {}

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log(`  CHALLENGER M3 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  if (findings.length > 0) {
    console.log(`  ⚠️  CRITICAL & MAJOR FINDINGS IDENTIFIED: ${findings.length}`);
    for (const f of findings) {
      console.log(`    - [${f.severity}] ${f.section}: ${f.title}`);
      console.log(`      ${f.details}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
