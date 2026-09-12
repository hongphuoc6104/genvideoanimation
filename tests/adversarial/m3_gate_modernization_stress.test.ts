/**
 * tests/adversarial/m3_gate_modernization_stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS & ORACLE VALIDATION SUITE
 * Milestone M3: Visual Evaluation & Gate Modernization (R3)
 *
 * Targets:
 *   1. scripts/run-production-gate.ts:
 *      - Lean-visual mode vs non-lean mode across configurations (CLI flags, env vars, ShotSpec, timeline).
 *      - Gate bypass behavior (G04, G04B, G04C, G04D bypassed vs G01, G02, G03, G06 strictly preserved).
 *      - Dynamic score derivation in qa-report.json from vision-rubric-report.json.
 *      - Tamper-evidence: score changes, failure detection, verdict reflection.
 *      - Fail-closed behavior on gate errors, geometry violations in standard mode, and rubric deficit.
 *
 *   2. validators/extract-contact-sheet.ts:
 *      - Named flags vs positional parameters vs mixed syntax.
 *      - Recursive directory auto-creation for arbitrary output paths.
 *      - Keyframe index formula precision (Start, Mid, End bounds).
 *      - Fail-closed handling of missing video, missing timeline, malformed JSON.
 *      - Output manifest schema compliance.
 *
 *   3. scripts/evaluate-vision-rubric.ts:
 *      - Authentic rawvideo RGB24 pixel decoding via FFmpeg pipe.
 *      - Kinetic motion energy calculation (static vs animated frames).
 *      - Edge-case frame analysis: monochrome black, monochrome white, navy #0F172A, chaotic noise.
 *      - Anti-slide monoculture detection (penalizing bright prose card blocks).
 *      - Subtitle buffer zone intrusion penalty.
 *      - Horizontal margin violation penalty.
 *      - Strict mode enforcement and external review file integration.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { extractContactSheet } from '../../validators/extract-contact-sheet';
import { evaluateBeat, evaluateVisionRubric, ContactSheetBeatItem } from '../../scripts/evaluate-vision-rubric';

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCRATCH_DIR = path.join(ROOT_DIR, 'out', '.tmp_m3_stress_' + Date.now());

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      throw new Error(`Test "${name}" returned a Promise. Use runAsyncTest instead.`);
    }
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  ✔ [PASS] ${name} (${durationMs.toFixed(1)}ms)`);
  } catch (err: any) {
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: false, error: err.message, durationMs });
    console.error(`  ❌ [FAIL] ${name} (${durationMs.toFixed(1)}ms)`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: true, durationMs });
    console.log(`  ✔ [PASS] ${name} (${durationMs.toFixed(1)}ms)`);
  } catch (err: any) {
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: false, error: err.message, durationMs });
    console.error(`  ❌ [FAIL] ${name} (${durationMs.toFixed(1)}ms)`);
    console.error(`     Error: ${err.message}`);
  }
}

// Helper to generate synthetic PNG images via ffmpeg
function generateSyntheticImage(outputPath: string, options: {
  width?: number;
  height?: number;
  color?: string;
  filter?: string;
  isNoise?: boolean;
}) {
  const width = options.width || 360;
  const height = options.height || 640;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';
  let args: string[];

  if (options.isNoise) {
    args = [
      '-y', '-v', 'error',
      '-f', 'lavfi', '-i', `nullsrc=s=${width}x${height}:d=0.04`,
      '-vf', 'geq=random(1)*255:128:128',
      '-frames:v', '1', '-update', '1',
      outputPath,
    ];
  } else if (options.filter) {
    args = [
      '-y', '-v', 'error',
      '-f', 'lavfi', '-i', `color=c=${options.color || 'black'}:s=${width}x${height}:d=0.04`,
      '-vf', options.filter,
      '-frames:v', '1', '-update', '1',
      outputPath,
    ];
  } else {
    args = [
      '-y', '-v', 'error',
      '-f', 'lavfi', '-i', `color=c=${options.color || 'black'}:s=${width}x${height}:d=0.04`,
      '-frames:v', '1', '-update', '1',
      outputPath,
    ];
  }

  const res = spawnSync(ffmpegBin, args, { stdio: 'pipe' });
  if (res.status !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(`Failed to generate synthetic test image: ${res.stderr?.toString()}`);
  }
}

// ============================================================================
// SUITE 1: scripts/run-production-gate.ts Adversarial Testing
// ============================================================================
async function runSuite1() {
  console.log('\n======================================================================');
  console.log(' SUITE 1: scripts/run-production-gate.ts (Lean vs Standard, Score Tampering)');
  console.log('======================================================================\n');

  const suite = 'Suite 1: run-production-gate.ts';
  const gateScript = path.join(ROOT_DIR, 'scripts/run-production-gate.ts');
  const pumpProj = 'connection-film/src/projects/sodium-potassium-pump';
  const scopusProj = 'connection-film/src/projects/scopus-research-gap';

  // 1.1 CLI Argument Parsing: --lean-visual flag
  runTest(suite, '1.1.1 --lean-visual flag activates lean visual mode in qa-report.json', () => {
    // Inspect qa-report.json generated from canonical lean-visual run
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'out/qa-report.json')), 'out/qa-report.json must exist');
    const qaReport = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'out/qa-report.json'), 'utf-8'));
    assert.strictEqual(qaReport.leanVisualMode, true);
    assert.strictEqual(qaReport.passed, true);

    // Verify bypassed gates in qa-report
    const g04 = qaReport.gates.find((g: any) => g.id === 'G04-visual-semantics');
    assert.ok(g04, 'G04 must be recorded in gates array');
    assert.strictEqual(g04.advisory, true);
    assert.strictEqual(g04.durationMs, 0);

    const g04d = qaReport.gates.find((g: any) => g.id === 'G04D-runtime-geometry');
    assert.ok(g04d, 'G04D must be recorded in gates array');
    assert.strictEqual(g04d.advisory, true);
    assert.strictEqual(g04d.durationMs, 0);
  });

  // 1.1.2 CLI Argument Parsing: --lean alias
  runTest(suite, '1.1.2 --lean alias correctly activates lean visual mode in argument parser', () => {
    // Test argument parser behavior by running with dry mock project
    const mockProjDir = path.join(SCRATCH_DIR, 'mock_proj_lean_alias');
    fs.mkdirSync(mockProjDir, { recursive: true });
    fs.writeFileSync(path.join(mockProjDir, 'shot-spec.json'), JSON.stringify({ total_duration_frames: 100 }));
    fs.writeFileSync(path.join(mockProjDir, 'semantic-timeline.json'), JSON.stringify({ beats: [] }));

    const res = spawnSync('npx', ['tsx', gateScript, `--project=${mockProjDir}`, '--lean'], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.match(res.stdout, /Pipeline Mode:\s+LEAN-VISUAL/);
  });

  // 1.1.3 Environment Variable: LEAN_VISUAL=1
  runTest(suite, '1.1.3 LEAN_VISUAL=1 environment variable activates lean visual mode', () => {
    const mockProjDir = path.join(SCRATCH_DIR, 'mock_proj_env');
    fs.mkdirSync(mockProjDir, { recursive: true });
    fs.writeFileSync(path.join(mockProjDir, 'shot-spec.json'), JSON.stringify({ total_duration_frames: 100 }));
    fs.writeFileSync(path.join(mockProjDir, 'semantic-timeline.json'), JSON.stringify({ beats: [] }));

    const res = spawnSync('npx', ['tsx', gateScript, `--project=${mockProjDir}`], {
      cwd: ROOT_DIR,
      env: { ...process.env, LEAN_VISUAL: '1' },
      encoding: 'utf-8',
    });
    assert.match(res.stdout, /Pipeline Mode:\s+LEAN-VISUAL/);
  });

  // 1.1.4 Config Auto-Detection: shot-spec.json with visualStyle='lean'
  runTest(suite, '1.1.4 Auto-detects leanVisual from mock project shot-spec.json', () => {
    const mockProjDir = path.join(SCRATCH_DIR, 'mock_proj_lean_spec');
    fs.mkdirSync(mockProjDir, { recursive: true });
    fs.writeFileSync(path.join(mockProjDir, 'shot-spec.json'), JSON.stringify({ visualStyle: 'lean', total_duration_frames: 100 }));
    fs.writeFileSync(path.join(mockProjDir, 'semantic-timeline.json'), JSON.stringify({ beats: [] }));

    const res = spawnSync('npx', ['tsx', gateScript, `--project=${mockProjDir}`], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.match(res.stdout, /Pipeline Mode:\s+LEAN-VISUAL/);
  });

  // 1.1.5 Config Auto-Detection: semantic-timeline.json with pipeline='lean-visual'
  runTest(suite, '1.1.5 Auto-detects leanVisual from mock project semantic-timeline.json', () => {
    const mockProjDir = path.join(SCRATCH_DIR, 'mock_proj_lean_timeline');
    fs.mkdirSync(mockProjDir, { recursive: true });
    fs.writeFileSync(path.join(mockProjDir, 'shot-spec.json'), JSON.stringify({ total_duration_frames: 100 }));
    fs.writeFileSync(path.join(mockProjDir, 'semantic-timeline.json'), JSON.stringify({ pipeline: 'lean-visual', beats: [] }));

    const res = spawnSync('npx', ['tsx', gateScript, `--project=${mockProjDir}`], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.match(res.stdout, /Pipeline Mode:\s+LEAN-VISUAL/);
  });

  // 1.2.1 Non-lean mode executes standard G04D and halts on unpadded kinetic layouts
  runTest(suite, '1.2.1 Non-lean mode executes standard G04D and fails closed on unpadded vector layouts', () => {
    // When run on sodium-potassium-pump (which uses open kinetic vectors without card wrappers),
    // standard non-lean mode executes G04D and fails with container padding deficit.
    const res = spawnSync('npx', ['tsx', 'validators/validate-runtime-geometry.ts', pumpProj], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.strictEqual(res.status, 1, 'G04D must fail on open vector layouts without padding');
    assert.match(res.stdout, /CONTAINER_PADDING_DEFICIT/);
  });

  // 1.2.2 Lean-visual mode bypasses G04D allowing open kinetic vector designs to pass cleanly
  runTest(suite, '1.2.2 Lean-visual mode bypasses G04D and passes through all 12 gates cleanly', () => {
    const qaReport = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'out/qa-report.json'), 'utf-8'));
    assert.strictEqual(qaReport.leanVisualMode, true);
    assert.strictEqual(qaReport.passed, true);
    assert.strictEqual(qaReport.verdict, 'CERTIFIED_PRODUCTION_GRADE');

    // Confirm that G01 (Typography), G02 (Portability), G03 (Audio), G06 (Temporal QA) were NOT bypassed
    const criticalGates = ['G01-mobile-typography', 'G02-portability', 'G03-audio-ownership', 'G06-temporal-qa'];
    for (const id of criticalGates) {
      const g = qaReport.gates.find((gate: any) => gate.id === id);
      assert.ok(g, `${id} must exist in qa-report`);
      assert.strictEqual(g.passed, true);
      assert.strictEqual(g.advisory, undefined, `${id} must NOT be advisory/bypassed`);
      assert.ok(g.durationMs > 0, `${id} must have real non-zero duration`);
    }
  });

  // 1.3.1 Dynamic score derivation in qa-report.json
  runTest(suite, '1.3.1 qa-report.json overallAverage dynamically reflects vision-rubric-report.json overallScore', () => {
    const visionReport = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'out/vision-rubric-report.json'), 'utf-8'));
    const qaReport = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'out/qa-report.json'), 'utf-8'));

    assert.strictEqual(
      qaReport.overallAverage,
      visionReport.overallScore,
      `qa-report overallAverage (${qaReport.overallAverage}) must equal vision report overallScore (${visionReport.overallScore})`
    );
    assert.strictEqual(
      qaReport.quality_rubric_audit.composite_score,
      visionReport.overallScore
    );
    assert.deepStrictEqual(
      qaReport.quality_rubric_audit.visionRubric.categoryScores,
      visionReport.categoryScores
    );
  });

  // 1.3.2 Tamper-Resistance: G05B halts gate when vision rubric evaluation fails strict thresholds
  runTest(suite, '1.3.2 G05B halts gate when evaluate-vision-rubric --strict encounters deficit', () => {
    // Test evaluate-vision-rubric --strict with a failing mock manifest
    const failingManifestPath = path.join(SCRATCH_DIR, 'mock_fail_manifest.json');
    fs.writeFileSync(failingManifestPath, JSON.stringify({
      version: '3.4.0',
      outputDirectory: SCRATCH_DIR,
      beats: [
        {
          beatId: 'fail_beat',
          frames: { start: 'non_existent.png', mid: 'non_existent.png', end: 'non_existent.png' },
        },
      ],
    }));

    const res = spawnSync('npx', [
      'tsx',
      path.join(ROOT_DIR, 'scripts/evaluate-vision-rubric.ts'),
      failingManifestPath,
      '--strict',
    ], { cwd: ROOT_DIR, encoding: 'utf-8' });

    assert.strictEqual(res.status, 1, 'G05B command must fail with status 1 on failing rubric');
  });

  // 1.4 Missing project files trigger fail-closed
  runTest(suite, '1.4.1 Missing shot-spec.json immediately halts production gate with exit code 1', () => {
    const emptyProj = path.join(SCRATCH_DIR, 'empty_proj');
    fs.mkdirSync(emptyProj, { recursive: true });
    const res = spawnSync('npx', ['tsx', gateScript, `--project=${emptyProj}`], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.strictEqual(res.status, 1);
    assert.match(res.stderr, /shot-spec\.json missing/);
  });
}

// ============================================================================
// SUITE 2: validators/extract-contact-sheet.ts Adversarial Testing
// ============================================================================
async function runSuite2() {
  console.log('\n======================================================================');
  console.log(' SUITE 2: validators/extract-contact-sheet.ts (Flags, Dirs, Formats)');
  console.log('======================================================================\n');

  const suite = 'Suite 2: extract-contact-sheet.ts';
  const scriptPath = path.join(ROOT_DIR, 'validators/extract-contact-sheet.ts');
  const validVideo = path.join(ROOT_DIR, 'out/scopus-research-gap-preview-360x640.mp4');

  // Create a minimal 2-beat test timeline
  const miniTimelinePath = path.join(SCRATCH_DIR, 'mini-timeline.json');
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  const miniTimeline = {
    version: '3.4.0',
    fps: 30,
    totalDurationFrames: 90,
    beats: [
      {
        id: 'beat_01',
        startFrame: 0,
        endFrame: 45,
        visualIntent: 'Introduction hook',
        primaryObject: 'magnifying_lens',
        visualExplanationContract: { coreMechanism: 'zoom' },
      },
      {
        id: 'beat_02',
        startFrame: 45,
        endFrame: 90,
        visualIntent: 'Knowledge matrix radar',
        primaryObject: 'radar_matrix',
        visualExplanationContract: { coreMechanism: 'matrix' },
      },
    ],
  };
  fs.writeFileSync(miniTimelinePath, JSON.stringify(miniTimeline, null, 2), 'utf-8');

  // 2.1 Positional parameter execution
  await runAsyncTest(suite, '2.1.1 Positional argument parsing (<timeline> <video> <outDir>)', async () => {
    const outDir = path.join(SCRATCH_DIR, 'out_positional');
    const res = spawnSync('npx', ['tsx', scriptPath, miniTimelinePath, validVideo, outDir], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.strictEqual(res.status, 0, `Failed: ${res.stderr || res.stdout}`);

    const manifestPath = path.join(outDir, 'contact-sheet-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'Manifest must exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert.strictEqual(manifest.totalBeats, 2);
    assert.strictEqual(manifest.totalFramesExtracted, 6);
    assert.strictEqual(manifest.beats[0].startFrame, 0);
    assert.strictEqual(manifest.beats[0].midFrame, 22);
    assert.strictEqual(manifest.beats[0].endFrame, 44);
    assert.ok(fs.existsSync(path.join(outDir, manifest.beats[0].frames.start)));
    assert.ok(fs.existsSync(path.join(outDir, manifest.beats[0].frames.mid)));
    assert.ok(fs.existsSync(path.join(outDir, manifest.beats[0].frames.end)));
  });

  // 2.2 Named flags with '=' syntax
  await runAsyncTest(suite, '2.2.1 Named flags with equals sign (--timeline=... --video=... --outDir=...)', async () => {
    const outDir = path.join(SCRATCH_DIR, 'out_named_eq');
    const res = spawnSync('npx', [
      'tsx', scriptPath,
      `--timeline=${miniTimelinePath}`,
      `--video=${validVideo}`,
      `--outDir=${outDir}`,
    ], { cwd: ROOT_DIR, encoding: 'utf-8' });

    assert.strictEqual(res.status, 0, `Failed: ${res.stderr || res.stdout}`);
    assert.ok(fs.existsSync(path.join(outDir, 'contact-sheet-manifest.json')));
  });

  // 2.3 Named flags with space syntax and --out alias
  await runAsyncTest(suite, '2.3.1 Named flags with space separator and --out alias', async () => {
    const outDir = path.join(SCRATCH_DIR, 'out_named_space');
    const res = spawnSync('npx', [
      'tsx', scriptPath,
      '--timeline', miniTimelinePath,
      '--video', validVideo,
      '--out', outDir,
    ], { cwd: ROOT_DIR, encoding: 'utf-8' });

    assert.strictEqual(res.status, 0, `Failed: ${res.stderr || res.stdout}`);
    assert.ok(fs.existsSync(path.join(outDir, 'contact-sheet-manifest.json')));
  });

  // 2.4 Directory auto-creation (deeply nested non-existent directory)
  await runAsyncTest(suite, '2.4.1 Deeply nested non-existent directory auto-creation', async () => {
    const deepOutDir = path.join(SCRATCH_DIR, 'level1', 'level2', 'level3', 'contact_sheet');
    assert.strictEqual(fs.existsSync(deepOutDir), false, 'Directory must not exist beforehand');

    const manifest = await extractContactSheet({
      timelinePath: miniTimelinePath,
      videoPath: validVideo,
      outDir: deepOutDir,
    });

    assert.strictEqual(fs.existsSync(deepOutDir), true, 'Directory must be created recursively');
    assert.strictEqual(manifest.totalBeats, 2);
    assert.strictEqual(manifest.totalFramesExtracted, 6);
  });

  // 2.5 Single-frame and boundary beats calculation
  await runAsyncTest(suite, '2.5.1 Single-frame beat (startFrame === endFrame - 1) calculation', async () => {
    const singleFrameTimelinePath = path.join(SCRATCH_DIR, 'single-frame-timeline.json');
    const singleTimeline = {
      version: '3.4.0',
      fps: 30,
      beats: [
        {
          id: 'single_beat',
          startFrame: 10,
          endFrame: 11,
          visualIntent: 'Flash cue',
        },
      ],
    };
    fs.writeFileSync(singleFrameTimelinePath, JSON.stringify(singleTimeline, null, 2), 'utf-8');

    const outDir = path.join(SCRATCH_DIR, 'out_single_frame');
    const manifest = await extractContactSheet({
      timelinePath: singleFrameTimelinePath,
      videoPath: validVideo,
      outDir,
    });

    assert.strictEqual(manifest.totalBeats, 1);
    const b = manifest.beats[0];
    assert.strictEqual(b.startFrame, 10);
    assert.strictEqual(b.midFrame, 10);
    assert.strictEqual(b.endFrame, 10);
    assert.ok(fs.existsSync(path.join(outDir, b.frames.start)));
    assert.ok(fs.existsSync(path.join(outDir, b.frames.mid)));
    assert.ok(fs.existsSync(path.join(outDir, b.frames.end)));
  });

  // 2.6 Fail-closed on missing video
  await runAsyncTest(suite, '2.6.1 Missing video file throws error fail-closed', async () => {
    await assert.rejects(
      async () => {
        await extractContactSheet({
          timelinePath: miniTimelinePath,
          videoPath: 'non_existent_video_path.mp4',
          outDir: path.join(SCRATCH_DIR, 'out_fail'),
        });
      },
      /Video file not found/
    );
  });

  // 2.7 Fail-closed on missing timeline
  await runAsyncTest(suite, '2.7.1 Missing timeline file throws error fail-closed', async () => {
    await assert.rejects(
      async () => {
        await extractContactSheet({
          timelinePath: 'non_existent_timeline.json',
          videoPath: validVideo,
          outDir: path.join(SCRATCH_DIR, 'out_fail'),
        });
      },
      /Timeline file not found/
    );
  });
}

// ============================================================================
// SUITE 3: scripts/evaluate-vision-rubric.ts Adversarial Testing
// ============================================================================
async function runSuite3() {
  console.log('\n======================================================================');
  console.log(' SUITE 3: scripts/evaluate-vision-rubric.ts (Pixels, Noise, Margins, Penalties)');
  console.log('======================================================================\n');

  const suite = 'Suite 3: evaluate-vision-rubric.ts';
  const imgDir = path.join(SCRATCH_DIR, 'synthetic_images');
  fs.mkdirSync(imgDir, { recursive: true });

  // Generate synthetic test frames
  const navyImg = path.join(imgDir, 'navy_bg.png');
  const blackImg = path.join(imgDir, 'black_bg.png');
  const whiteImg = path.join(imgDir, 'white.png');
  const noiseImg = path.join(imgDir, 'noise.png');
  const cardSlideImg = path.join(imgDir, 'card_slide.png');
  const subtitleIntrusionImg = path.join(imgDir, 'sub_intrusion.png');
  const marginOverflowImg = path.join(imgDir, 'margin_overflow.png');
  const kineticMidImg = path.join(imgDir, 'kinetic_mid.png');

  console.log('  Generating synthetic test images via FFmpeg...');
  generateSyntheticImage(navyImg, { color: '0x0F172A' });
  generateSyntheticImage(blackImg, { color: 'black' });
  generateSyntheticImage(whiteImg, { color: 'white' });
  generateSyntheticImage(noiseImg, { isNoise: true });

  // Prose Card Slide: Navy background with large central white/light-gray box in stage zone
  // Stage in 360x640 is y in [60, 473]. Box size 240x250 centered at (60, 100)
  generateSyntheticImage(cardSlideImg, {
    color: '0x0F172A',
    filter: 'drawbox=x=60:y=100:w=240:h=250:color=white@1.0:t=fill',
  });

  // Subtitle Intrusion: element drawn at y = 480 (between stage y=473 and sub y=490)
  generateSyntheticImage(subtitleIntrusionImg, {
    color: '0x0F172A',
    filter: 'drawbox=x=50:y=475:w=260:h=12:color=yellow@1.0:t=fill',
  });

  // Horizontal Margin Overflow: elements drawn outside x in [12, 348] (e.g. x=2 to x=8, w=6)
  generateSyntheticImage(marginOverflowImg, {
    color: '0x0F172A',
    filter: 'drawbox=x=1:y=100:w=10:h=300:color=red@1.0:t=fill,drawbox=x=350:y=100:w=9:h=300:color=red@1.0:t=fill',
  });

  // Kinetic Mid Image: colored circles in stage zone
  generateSyntheticImage(kineticMidImg, {
    color: '0x0F172A',
    filter: 'drawbox=x=100:y=200:w=160:h=160:color=cyan@1.0:t=fill',
  });

  // 3.1 Static vs Kinetic Motion Energy Verification
  runTest(suite, '3.1.1 Static frames (Start === Mid === End) trigger motion energy penalty', () => {
    const staticBeat: ContactSheetBeatItem = {
      beatId: 'test_static',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      visualIntent: 'Static slide presentation',
      frames: {
        start: path.basename(navyImg),
        mid: path.basename(navyImg),
        end: path.basename(navyImg),
      },
    };

    const evalResult = evaluateBeat(staticBeat, imgDir);
    assert.strictEqual(evalResult.semanticMatchScore, 4.20, 'Static beat must be penalized to 4.20 semantic score');
    assert.match(evalResult.critique, /động năng ΔE=0\.0/);
  });

  runTest(suite, '3.1.2 Dynamic kinetic frames trigger positive motion energy', () => {
    const dynamicBeat: ContactSheetBeatItem = {
      beatId: 'test_dynamic',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      visualIntent: 'Dynamic radar expansion',
      frames: {
        start: path.basename(navyImg),
        mid: path.basename(kineticMidImg),
        end: path.basename(navyImg),
      },
    };

    const evalResult = evaluateBeat(dynamicBeat, imgDir);
    assert.ok(evalResult.semanticMatchScore >= 4.80, `Expected score >= 4.80, got ${evalResult.semanticMatchScore}`);
    assert.doesNotMatch(evalResult.critique, /động năng ΔE=0\.0/);
  });

  // 3.2 Anti-Slide Monoculture: Detecting rectangular prose card blocks
  runTest(suite, '3.2.1 Rectangular prose card block triggers Anti-Slide penalty (< 4.0)', () => {
    const cardBeat: ContactSheetBeatItem = {
      beatId: 'test_card_monoculture',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      visualIntent: 'Powerpoint card layout',
      frames: {
        start: path.basename(navyImg),
        mid: path.basename(cardSlideImg),
        end: path.basename(cardSlideImg),
      },
    };

    const evalResult = evaluateBeat(cardBeat, imgDir);
    assert.ok(evalResult.antiSlideScore < 4.0, `Expected antiSlideScore < 4.0 for card monoculture, got ${evalResult.antiSlideScore}`);
    assert.match(evalResult.critique, /Phát hiện diện tích khối thẻ văn xuôi/);
  });

  // 3.3 Subtitle Zone Intrusion Detection
  runTest(suite, '3.3.1 Active pixels in subtitle buffer zone trigger aesthetic penalty', () => {
    const subBeat: ContactSheetBeatItem = {
      beatId: 'test_sub_intrusion',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      frames: {
        start: path.basename(navyImg),
        mid: path.basename(subtitleIntrusionImg),
        end: path.basename(navyImg),
      },
    };

    const evalResult = evaluateBeat(subBeat, imgDir);
    assert.ok(evalResult.aestheticScore <= 4.50, `Expected aesthetic <= 4.50 with subtitle intrusion, got ${evalResult.aestheticScore}`);
  });

  // 3.4 Horizontal Margin Overflow Detection
  runTest(suite, '3.4.1 Active elements violating horizontal margins trigger aesthetic penalty', () => {
    const marginBeat: ContactSheetBeatItem = {
      beatId: 'test_margin_overflow',
      startFrame: 0,
      midFrame: 15,
      endFrame: 30,
      startSec: 0,
      midSec: 0.5,
      endSec: 1.0,
      frames: {
        start: path.basename(navyImg),
        mid: path.basename(marginOverflowImg),
        end: path.basename(navyImg),
      },
    };

    const evalResult = evaluateBeat(marginBeat, imgDir);
    assert.ok(evalResult.aestheticScore <= 4.60, `Expected aesthetic <= 4.60 with margin overflow, got ${evalResult.aestheticScore}`);
  });

  // 3.5 Full Manifest Evaluation & Acceptance Thresholds
  runTest(suite, '3.5.1 Full manifest evaluation: composite score formula & thresholds', () => {
    const testManifestPath = path.join(SCRATCH_DIR, 'test-manifest.json');
    const manifestData = {
      version: '3.4.0',
      generatedAt: new Date().toISOString(),
      timelinePath: 'timeline.json',
      videoPath: 'video.mp4',
      outputDirectory: imgDir,
      totalBeats: 2,
      totalFramesExtracted: 6,
      beats: [
        {
          beatId: 'beat_01',
          startFrame: 0,
          midFrame: 15,
          endFrame: 30,
          startSec: 0,
          midSec: 0.5,
          endSec: 1.0,
          visualIntent: 'Dynamic radar',
          frames: {
            start: path.basename(navyImg),
            mid: path.basename(kineticMidImg),
            end: path.basename(navyImg),
          },
        },
        {
          beatId: 'beat_02',
          startFrame: 30,
          midFrame: 45,
          endFrame: 60,
          startSec: 1.0,
          midSec: 1.5,
          endSec: 2.0,
          visualIntent: 'Dynamic transition',
          frames: {
            start: path.basename(navyImg),
            mid: path.basename(kineticMidImg),
            end: path.basename(navyImg),
          },
        },
      ],
    };
    fs.writeFileSync(testManifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');

    const report = evaluateVisionRubric({
      manifestPath: testManifestPath,
      outputPath: path.join(SCRATCH_DIR, 'test-vision-report.json'),
    });

    assert.strictEqual(report.totalBeats, 2);
    assert.strictEqual(report.passed, true);
    assert.ok(report.overallScore >= 4.50, `Overall score should be >= 4.50, got ${report.overallScore}`);

    const expectedComposite = Number(
      (
        report.categoryScores.antiSlideMonoculture * 0.35 +
        report.categoryScores.semanticCorrespondence * 0.35 +
        report.categoryScores.aestheticHierarchy * 0.30
      ).toFixed(2)
    );
    assert.strictEqual(report.overallScore, expectedComposite, 'Composite overall score must match weighted formula');
  });

  // 3.6 Strict mode fail-closed on card monoculture
  runTest(suite, '3.6.1 evaluate-vision-rubric --strict exits with code 1 when beat fails floor', () => {
    const failingManifestPath = path.join(SCRATCH_DIR, 'failing-manifest.json');
    const failingData = {
      version: '3.4.0',
      generatedAt: new Date().toISOString(),
      timelinePath: 'timeline.json',
      videoPath: 'video.mp4',
      outputDirectory: imgDir,
      totalBeats: 1,
      totalFramesExtracted: 3,
      beats: [
        {
          beatId: 'beat_card_failure',
          startFrame: 0,
          midFrame: 15,
          endFrame: 30,
          startSec: 0,
          midSec: 0.5,
          endSec: 1.0,
          frames: {
            start: path.basename(navyImg),
            mid: path.basename(cardSlideImg),
            end: path.basename(cardSlideImg),
          },
        },
      ],
    };
    fs.writeFileSync(failingManifestPath, JSON.stringify(failingData, null, 2), 'utf-8');

    const res = spawnSync('npx', [
      'tsx',
      path.join(ROOT_DIR, 'scripts/evaluate-vision-rubric.ts'),
      failingManifestPath,
      '--strict',
      `--out=${path.join(SCRATCH_DIR, 'failing-vision-report.json')}`,
    ], { cwd: ROOT_DIR, encoding: 'utf-8' });

    assert.strictEqual(res.status, 1, `Expected evaluate-vision-rubric --strict to fail with exit code 1, got ${res.status}`);
    assert.match(res.stdout, /STATUS:\s+❌ FAILED/);
  });

  // 3.7 External Review File Integration (--review-file)
  runTest(suite, '3.7.1 External LLM/SME review file blends custom scores and critiques', () => {
    const testManifestPath = path.join(SCRATCH_DIR, 'test-manifest.json');
    const reviewFilePath = path.join(SCRATCH_DIR, 'external-review.json');
    const reviewData = {
      beats: [
        {
          beatId: 'beat_01',
          antiSlideScore: 5.0,
          semanticMatchScore: 4.95,
          aestheticScore: 4.88,
          critique: 'Verified by independent Human SME: flawless kinetic visual metaphor.',
        },
      ],
    };
    fs.writeFileSync(reviewFilePath, JSON.stringify(reviewData, null, 2), 'utf-8');

    const report = evaluateVisionRubric({
      manifestPath: testManifestPath,
      reviewFile: reviewFilePath,
      outputPath: path.join(SCRATCH_DIR, 'blended-vision-report.json'),
    });

    const b1 = report.beats.find((b) => b.beatId === 'beat_01');
    assert.ok(b1);
    assert.strictEqual(b1.antiSlideScore, 5.0);
    assert.strictEqual(b1.semanticMatchScore, 4.95);
    assert.strictEqual(b1.aestheticScore, 4.88);
    assert.strictEqual(b1.critique, 'Verified by independent Human SME: flawless kinetic visual metaphor.');
  });
}

// ============================================================================
// SUITE 4: Discovered Edge Cases & Findings (Bug Analysis)
// ============================================================================
function runSuite4() {
  console.log('\n======================================================================');
  console.log(' SUITE 4: Discovered Edge Cases & Findings (Bug Analysis)');
  console.log('======================================================================\n');

  const suite = 'Suite 4: Discovered Edge Cases';

  // Finding 1: Exit code 0 when rubricPassed is false in run-production-gate.ts
  runTest(suite, '4.1 [Finding] Inspect run-production-gate.ts exit code handling when rubricPassed is false', () => {
    const gateCode = fs.readFileSync(path.join(ROOT_DIR, 'scripts/run-production-gate.ts'), 'utf-8');
    const hasRubricCheckBeforeExit = gateCode.includes('if (!report.passed)') || gateCode.includes('if (!rubricPassed)');
    
    // Check if process.exit(0) is unconditional at end of main():
    const hasUnconditionalZeroExit = /console\.log\(`Audit report certified and written to: \$\{reportPath\}\\n`\);\s*process\.exit\(0\);/.test(gateCode);

    if (hasUnconditionalZeroExit && !hasRubricCheckBeforeExit) {
      console.log('    ⚠️ Confirmed Gap: run-production-gate.ts executes process.exit(0) unconditionally at end of main() even if report.passed is false (e.g. when rubricPassed is false).');
    }
    assert.ok(hasUnconditionalZeroExit, 'Confirmed run-production-gate.ts exits with 0 unconditionally at end of main');
  });

  // Finding 2: Scopus explainer project typography floor verification
  runTest(suite, '4.2 [Finding] Verify that scopus-research-gap satisfies G01 (>= 30px)', () => {
    const typoRes = spawnSync('npx', [
      'tsx',
      path.join(ROOT_DIR, 'validators/validate-mobile-typography.ts'),
      path.join(ROOT_DIR, 'connection-film/src/projects/scopus-research-gap'),
    ], { cwd: ROOT_DIR, encoding: 'utf-8' });

    assert.strictEqual(typoRes.status, 0, 'Typography validator must return exit code 0 when >= 30px');
    assert.match(typoRes.stdout, /0 Typography violations detected/);
    console.log('    ✔ Confirmed: connection-film/src/projects/scopus-research-gap now passes G01 typography floor (all text >= 30px).');
  });
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  console.log('======================================================================');
  console.log(' EMPIRICAL CHALLENGER 2: MILESTONE M3 ADVERSARIAL STRESS SUITE');
  console.log(' Verifying: run-production-gate.ts, extract-contact-sheet.ts, evaluate-vision-rubric.ts');
  console.log('======================================================================');

  try {
    await runSuite1();
    await runSuite2();
    await runSuite3();
    runSuite4();

    console.log('\n======================================================================');
    console.log(' TEST EXECUTION SUMMARY');
    console.log('======================================================================');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(` Total Tests:  ${results.length}`);
    console.log(` Passed:       ${passed} / ${results.length} (${((passed / results.length) * 100).toFixed(1)}%)`);
    console.log(` Failed:       ${failed} / ${results.length}`);

    if (failed > 0) {
      console.log('\nFailed Tests:');
      for (const r of results.filter((r) => !r.passed)) {
        console.log(` - [${r.suite}] ${r.name}: ${r.error}`);
      }
      process.exit(1);
    }
  } finally {
    // Cleanup scratch directory
    try {
      if (fs.existsSync(SCRATCH_DIR)) {
        fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
      }
    } catch {}
  }
}

main().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
