#!/usr/bin/env tsx
/**
 * MOBILE PREVIEW LINEAGE & CONTENT PARITY VALIDATOR (R3 & R22)
 *
 * Validates mathematical lineage and content parity between master MP4 (1080x1920)
 * and mobile preview MP4 (360x640):
 * 1. Existence and valid container size (>= 1KB)
 * 2. Freshness: preview mtimeMs >= master mtimeMs (rejects stale previews)
 * 3. Duration parity: |duration_master - duration_preview| < 0.033s (1 frame at 30fps)
 * 4. Frame count parity: N_master == N_preview
 * 5. Visual fidelity: PSNR >= 35.0 dB computed across sampled video frames
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';

export interface ParityReport {
  masterPath: string;
  previewPath: string;
  masterDuration: number;
  previewDuration: number;
  durationDelta: number;
  masterFrames: number;
  previewFrames: number;
  masterMtime: number;
  previewMtime: number;
  averagePsnrDb: number;
  minPsnrDb: number;
  framesSampled: number;
  passed: boolean;
  violations: string[];
}

export function computeFrameMse(bufA: Buffer | Uint8Array, bufB: Buffer | Uint8Array): number {
  const len = Math.min(bufA.length, bufB.length);
  if (len === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const diff = bufA[i] - bufB[i];
    sumSq += diff * diff;
  }
  return sumSq / len;
}

export function computePsnr(mse: number): number {
  if (mse <= 0) return Infinity;
  const maxI = 255.0;
  return 10 * Math.log10((maxI * maxI) / mse);
}

export function getVideoMetadata(filePath: string): {
  duration: number;
  frameCount: number;
  width: number;
  height: number;
  mtimeMs: number;
} {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Video file not found: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (stat.size < 1024) {
    throw new Error(`Video file too small (<1KB), truncated or empty: ${resolved}`);
  }

  const res = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,duration,nb_frames,r_frame_rate:format=duration',
      '-of',
      'json',
      resolved,
    ],
    { encoding: 'utf-8' }
  );

  if (res.error || res.status !== 0) {
    throw new Error(`ffprobe failed on ${resolved}: ${res.stderr || res.error?.message}`);
  }

  const data = JSON.parse(res.stdout);
  const stream = data.streams?.[0] || {};
  const format = data.format || {};

  const duration = parseFloat(stream.duration || format.duration || '0');
  let frameCount = parseInt(stream.nb_frames || '0', 10);
  if (isNaN(frameCount) || frameCount === 0) {
    // Estimate based on r_frame_rate
    const rateParts = (stream.r_frame_rate || '30/1').split('/');
    const fps = rateParts.length === 2 ? parseFloat(rateParts[0]) / parseFloat(rateParts[1]) : 30;
    frameCount = Math.round(duration * fps);
  }

  return {
    duration,
    frameCount,
    width: stream.width || 0,
    height: stream.height || 0,
    mtimeMs: stat.mtimeMs,
  };
}

export function samplePsnrBetweenVideos(
  masterPath: string,
  previewPath: string,
  sampleCount: number = 10
): Promise<{ avgPsnr: number; minPsnr: number; sampled: number }> {
  return new Promise((resolve, reject) => {
    // Sample frames evenly across duration using rawvideo pipes
    const width = 360;
    const height = 640;
    const frameBytes = width * height * 3;

    // Stream 1: Master scaled to 360x640
    const pMaster = spawn('ffmpeg', [
      '-v', 'error',
      '-i', path.resolve(masterPath),
      '-vf', `fps=1,scale=${width}:${height}:flags=lanczos`,
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      '-',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Stream 2: Preview directly (already 360x640)
    const pPreview = spawn('ffmpeg', [
      '-v', 'error',
      '-i', path.resolve(previewPath),
      '-vf', `fps=1,scale=${width}:${height}`,
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      '-',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let masterBuf = Buffer.alloc(0);
    let previewBuf = Buffer.alloc(0);
    const psnrValues: number[] = [];

    pMaster.stdout.on('data', (chunk: Buffer) => {
      masterBuf = Buffer.concat([masterBuf, chunk]);
      drainFrames();
    });

    pPreview.stdout.on('data', (chunk: Buffer) => {
      previewBuf = Buffer.concat([previewBuf, chunk]);
      drainFrames();
    });

    function drainFrames() {
      while (masterBuf.length >= frameBytes && previewBuf.length >= frameBytes) {
        const frameA = masterBuf.subarray(0, frameBytes);
        const frameB = previewBuf.subarray(0, frameBytes);
        const mse = computeFrameMse(frameA, frameB);
        const psnr = computePsnr(mse);
        psnrValues.push(psnr);

        masterBuf = masterBuf.subarray(frameBytes);
        previewBuf = previewBuf.subarray(frameBytes);
      }
    }

    let finished = 0;
    const checkDone = () => {
      finished++;
      if (finished === 2) {
        drainFrames();
        if (psnrValues.length === 0) {
          return reject(new Error('No matching frames extracted for PSNR comparison.'));
        }
        const avg = psnrValues.reduce((a, b) => a + b, 0) / psnrValues.length;
        const min = Math.min(...psnrValues);
        resolve({
          avgPsnr: Number(avg.toFixed(2)),
          minPsnr: Number(min.toFixed(2)),
          sampled: psnrValues.length,
        });
      }
    };

    pMaster.on('close', checkDone);
    pPreview.on('close', checkDone);
    pMaster.on('error', (err) => reject(new Error(`Master ffmpeg failed: ${err.message}`)));
    pPreview.on('error', (err) => reject(new Error(`Preview ffmpeg failed: ${err.message}`)));
  });
}

export async function validatePreviewParity(
  masterPath: string,
  previewPath: string,
  options: { minPsnr?: number; maxDurationDelta?: number } = {}
): Promise<ParityReport> {
  const violations: string[] = [];
  const minPsnrThreshold = options.minPsnr ?? 35.0;
  const maxDurationDelta = options.maxDurationDelta ?? 0.033; // 1 frame at 30fps

  let masterMeta: ReturnType<typeof getVideoMetadata>;
  let previewMeta: ReturnType<typeof getVideoMetadata>;

  try {
    masterMeta = getVideoMetadata(masterPath);
  } catch (err: any) {
    violations.push(`MASTER_ACCESS_ERROR: ${err.message}`);
    return {
      masterPath,
      previewPath,
      masterDuration: 0,
      previewDuration: 0,
      durationDelta: 0,
      masterFrames: 0,
      previewFrames: 0,
      masterMtime: 0,
      previewMtime: 0,
      averagePsnrDb: 0,
      minPsnrDb: 0,
      framesSampled: 0,
      passed: false,
      violations,
    };
  }

  try {
    previewMeta = getVideoMetadata(previewPath);
  } catch (err: any) {
    violations.push(`PREVIEW_ACCESS_ERROR: ${err.message}`);
    return {
      masterPath,
      previewPath,
      masterDuration: masterMeta.duration,
      previewDuration: 0,
      durationDelta: 0,
      masterFrames: masterMeta.frameCount,
      previewFrames: 0,
      masterMtime: masterMeta.mtimeMs,
      previewMtime: 0,
      averagePsnrDb: 0,
      minPsnrDb: 0,
      framesSampled: 0,
      passed: false,
      violations,
    };
  }

  // 1. Freshness: Preview mtime must be >= master mtime
  if (previewMeta.mtimeMs < masterMeta.mtimeMs) {
    violations.push(
      `STALE_PREVIEW: Preview mtime (${new Date(previewMeta.mtimeMs).toISOString()}) is older than master render mtime (${new Date(masterMeta.mtimeMs).toISOString()}). Re-render preview!`
    );
  }

  // 2. Duration Delta
  const durationDelta = Math.abs(masterMeta.duration - previewMeta.duration);
  if (durationDelta >= maxDurationDelta) {
    violations.push(
      `DURATION_DESYNC: Duration delta (${durationDelta.toFixed(4)}s) exceeds max 1 frame tolerance (${maxDurationDelta}s). Master: ${masterMeta.duration.toFixed(3)}s, Preview: ${previewMeta.duration.toFixed(3)}s`
    );
  }

  // 3. Frame Count Match
  if (masterMeta.frameCount !== previewMeta.frameCount) {
    violations.push(
      `FRAME_COUNT_MISMATCH: Master has ${masterMeta.frameCount} frames, but preview has ${previewMeta.frameCount} frames.`
    );
  }

  // 4. PSNR parity
  let psnrResult = { avgPsnr: 0, minPsnr: 0, sampled: 0 };
  try {
    psnrResult = await samplePsnrBetweenVideos(masterPath, previewPath);
    if (psnrResult.avgPsnr < minPsnrThreshold) {
      violations.push(
        `PSNR_PARITY_FAILURE: Average PSNR (${psnrResult.avgPsnr} dB) is below minimum quality threshold (>= ${minPsnrThreshold} dB).`
      );
    }
  } catch (err: any) {
    violations.push(`PSNR_COMPUTATION_ERROR: ${err.message}`);
  }

  const passed = violations.length === 0;

  return {
    masterPath,
    previewPath,
    masterDuration: masterMeta.duration,
    previewDuration: previewMeta.duration,
    durationDelta: Number(durationDelta.toFixed(4)),
    masterFrames: masterMeta.frameCount,
    previewFrames: previewMeta.frameCount,
    masterMtime: masterMeta.mtimeMs,
    previewMtime: previewMeta.mtimeMs,
    averagePsnrDb: psnrResult.avgPsnr,
    minPsnrDb: psnrResult.minPsnr,
    framesSampled: psnrResult.sampled,
    passed,
    violations,
  };
}

export async function main() {
  const args = process.argv.slice(2);
  let master = '';
  let preview = '';
  let outReport = 'out/preview-parity-report.json';
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--master' && args[i + 1]) master = args[++i];
    else if (args[i] === '--preview' && args[i + 1]) preview = args[++i];
    else if (args[i] === '--output' && args[i + 1]) outReport = args[++i];
    else if (!args[i].startsWith('--')) {
      positional.push(args[i]);
    }
  }

  if (!master && positional.length > 0) master = positional[0];
  if (!preview && positional.length > 1) preview = positional[1];
  if (!master) master = 'out/final-v3_3.mp4';
  if (!preview) preview = 'out/preview-360x640.mp4';

  console.log(`\n==================================================================`);
  console.log(` VALIDATOR: Deterministic Mobile Preview Parity (R3 QA Gate)`);
  console.log(` Master:  ${master}`);
  console.log(` Preview: ${preview}`);
  console.log(`==================================================================\n`);

  const report = await validatePreviewParity(master, preview);

  console.log(`------------------------------------------------------------------`);
  console.log(` PARITY EVALUATION SUMMARY`);
  console.log(`------------------------------------------------------------------`);
  console.log(`  Master Duration:   ${report.masterDuration.toFixed(3)}s (${report.masterFrames} frames)`);
  console.log(`  Preview Duration:  ${report.previewDuration.toFixed(3)}s (${report.previewFrames} frames)`);
  console.log(`  Duration Delta:    ${report.durationDelta.toFixed(4)}s (Req < 0.0330s)`);
  console.log(`  Average PSNR:      ${report.averagePsnrDb} dB (Req >= 35.0 dB)`);
  console.log(`  Frames Sampled:    ${report.framesSampled}`);
  console.log(`  Status:            ${report.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`------------------------------------------------------------------\n`);

  if (outReport) {
    const dir = path.dirname(outReport);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf-8');
  }

  if (!report.passed) {
    console.error(`❌ Mobile Preview Parity Gate Failed:`);
    for (const v of report.violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log(`✅ Mobile Preview Parity Gate PASSED cleanly.`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-preview-parity')) {
  main().catch((err) => {
    console.error('Fatal parity validator error:', err);
    process.exit(1);
  });
}
