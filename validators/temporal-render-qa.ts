#!/usr/bin/env tsx
/**
 * TEMPORAL RENDER QUALITY ASSURANCE (QA) VALIDATOR
 *
 * Decodes rendered MP4 video frames via high-performance sub-second rawvideo pipe
 * using FFmpeg (grayscale luminance downscaled to 320x180).
 * Computes adjacent-frame Mean Absolute Difference (MAD),
 * computes rolling local median filter (radius 5-15 frames),
 * flags unannotated temporal discontinuities exceeding > 4.0x local median,
 * and reconciles deliberate high-velocity impact frames against ShotSpec impact whitelists.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

export interface TemporalQAAnomaly {
  frame: number;
  mad: number;
  localMedian: number;
  ratio: number;
}

export interface TemporalQAWhitelistedEvent {
  frame: number;
  mad: number;
  ratio: number;
}

export interface TemporalQAResult {
  valid: boolean;
  passed: boolean;
  anomalies: TemporalQAAnomaly[];
  whitelistedEvents: TemporalQAWhitelistedEvent[];
  medians?: number[];
  madSeries?: number[];
}

export interface TemporalQAOptions {
  windowRadius?: number; // default: 5 (or 15 for long window)
  thresholdRatio?: number; // default: 4.0
  ffmpegPath?: string; // override path to ffmpeg binary
  width?: number; // default: 320
  height?: number; // default: 180
  verbose?: boolean;
}

export interface TemporalVideoQAReport extends TemporalQAResult {
  videoPath: string;
  frameCount: number;
  durationSec: number;
  thresholdRatio: number;
  windowRadius: number;
  stats: {
    minMad: number;
    maxMad: number;
    avgMad: number;
    medianMad: number;
  };
}

/**
 * Resolves the path to the ffmpeg executable.
 * Prioritizes:
 * 1. Explicit override option / FFMPEG_PATH env
 * 2. /home/hongphuoc6104/.local/bin/ffmpeg
 * 3. System 'ffmpeg'
 */
export function getFfmpegPath(overridePath?: string): string {
  if (overridePath && fs.existsSync(overridePath)) {
    return overridePath;
  }
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  const defaultLocal = '/home/hongphuoc6104/.local/bin/ffmpeg';
  if (fs.existsSync(defaultLocal)) {
    return defaultLocal;
  }
  return 'ffmpeg';
}

/**
 * Computes the Mean Absolute Difference (MAD) between two raw frame byte buffers.
 */
export function computeFrameMAD(bufA: Buffer, bufB: Buffer): number {
  const len = Math.min(bufA.length, bufB.length);
  if (len === 0) return 0;
  let diffSum = 0;
  for (let i = 0; i < len; i++) {
    diffSum += Math.abs(bufA[i] - bufB[i]);
  }
  return diffSum / len;
}

/**
 * Computes rolling local median of a numerical series.
 * Clamps window indices [i - radius, i + radius + 1] cleanly at sequence boundaries,
 * preventing NaN and ensuring output length matches input length.
 */
export function computeRollingMedian(series: number[], windowRadius: number = 5): number[] {
  const result: number[] = [];
  const len = series.length;
  if (len === 0) return result;

  for (let i = 0; i < len; i++) {
    const start = Math.max(0, i - windowRadius);
    const end = Math.min(len, i + windowRadius + 1);
    const window = series.slice(start, end).sort((a, b) => a - b);
    const mid = Math.floor(window.length / 2);
    const median = window.length % 2 !== 0 ? window[mid] : (window[mid - 1] + window[mid]) / 2;
    result.push(median);
  }

  return result;
}

// Export alias for compatibility
export const calculateRollingMedian = computeRollingMedian;

/**
 * Evaluates rolling adjacent-frame MAD series against local medians.
 * Flags frames where ratio = MAD / max(median, 0.5) > thresholdRatio.
 * Reconciles flagged frames with whitelistedFrames:
 * - If whitelisted: logged to whitelistedEvents, does NOT cause failure.
 * - If unannotated: logged to anomalies, marks QA as invalid/failed.
 */
export function evaluateMadSpikes(
  madSeries: number[],
  windowRadius: number = 5,
  spikeThreshold: number = 4.0,
  whitelistedFrames: number[] = []
): TemporalQAResult {
  const medians = computeRollingMedian(madSeries, windowRadius);
  const anomalies: TemporalQAAnomaly[] = [];
  const whitelistedEvents: TemporalQAWhitelistedEvent[] = [];
  const whitelistSet = new Set(whitelistedFrames);

  for (let t = 0; t < madSeries.length; t++) {
    const mad = madSeries[t];
    const med = medians[t];
    // Baseline epsilon clamping to 0.5 prevents division by zero / false alarms in static frames
    const denominator = Math.max(med, 0.5);
    const ratio = mad / denominator;

    // Strict inequality: ratio > spikeThreshold (e.g. exactly 4.000 is NOT flagged)
    if (ratio > spikeThreshold) {
      if (whitelistSet.has(t)) {
        whitelistedEvents.push({ frame: t, mad, ratio });
      } else {
        anomalies.push({ frame: t, mad, localMedian: med, ratio });
      }
    }
  }

  const valid = anomalies.length === 0;
  return {
    valid,
    passed: valid,
    anomalies,
    whitelistedEvents,
    medians,
    madSeries,
  };
}

// Export alias for compatibility with test suites
export const detectTemporalDiscontinuities = evaluateMadSpikes;

/**
 * Extracts whitelisted impact frame numbers from ShotSpec data structures.
 * Supports top-level arrays, ShotSpec with shots[].impact_frames, or whitelisted_impact_frames.
 */
export function extractWhitelistedFrames(shotSpecData: any): number[] {
  const frames = new Set<number>();
  if (!shotSpecData) return [];

  // Direct array of numbers: [30, 75]
  if (Array.isArray(shotSpecData) && shotSpecData.every((x) => typeof x === 'number')) {
    return shotSpecData;
  }

  // Top-level declarations
  if (Array.isArray(shotSpecData.whitelisted_impact_frames)) {
    for (const f of shotSpecData.whitelisted_impact_frames) if (typeof f === 'number') frames.add(f);
  }
  if (Array.isArray(shotSpecData.impact_frames)) {
    for (const f of shotSpecData.impact_frames) if (typeof f === 'number') frames.add(f);
  }

  // Nested shots array
  const shots = Array.isArray(shotSpecData.shots)
    ? shotSpecData.shots
    : Array.isArray(shotSpecData)
    ? shotSpecData
    : [];

  for (const shot of shots) {
    if (Array.isArray(shot.impact_frames)) {
      for (const f of shot.impact_frames) if (typeof f === 'number') frames.add(f);
    }
    if (Array.isArray(shot.whitelisted_impact_frames)) {
      for (const f of shot.whitelisted_impact_frames) if (typeof f === 'number') frames.add(f);
    }
  }

  return Array.from(frames).sort((a, b) => a - b);
}

/**
 * Streams MP4 video frames through FFmpeg rawvideo pipe and computes rolling adjacent-frame MAD series.
 */
export function decodeVideoMadSeries(
  videoPath: string,
  options: TemporalQAOptions = {}
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const resolvedPath = path.resolve(videoPath);
    if (!fs.existsSync(resolvedPath)) {
      return reject(new Error(`Video file not found (ENOENT): ${resolvedPath}`));
    }

    const ffmpegBin = getFfmpegPath(options.ffmpegPath);
    const width = options.width || 320;
    const height = options.height || 180;
    const frameSize = width * height; // 1 byte per pixel in grayscale

    const ffmpegArgs = [
      '-v',
      'error',
      '-i',
      resolvedPath,
      '-vf',
      `scale=${width}:${height},format=gray`,
      '-f',
      'rawvideo',
      '-',
    ];

    let ffmpegProc: any;
    try {
      ffmpegProc = spawn(ffmpegBin, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: any) {
      return reject(new Error(`Failed to spawn FFmpeg binary (${ffmpegBin}): ${err.message}`));
    }

    let remainder = Buffer.alloc(0);
    let prevFrame: Buffer | null = null;
    const madSeries: number[] = [];
    let stderrOutput = '';

    ffmpegProc.stderr.on('data', (data: Buffer) => {
      stderrOutput += data.toString('utf-8');
    });

    ffmpegProc.stdout.on('data', (chunk: Buffer) => {
      remainder = Buffer.concat([remainder, chunk]);
      while (remainder.length >= frameSize) {
        const currentFrame = remainder.subarray(0, frameSize);
        if (prevFrame === null) {
          madSeries.push(0.0); // Initial frame has zero predecessor difference
        } else {
          const mad = computeFrameMAD(currentFrame, prevFrame);
          madSeries.push(mad);
        }
        prevFrame = Buffer.from(currentFrame);
        remainder = remainder.subarray(frameSize);
      }
    });

    ffmpegProc.on('error', (err: any) => {
      reject(new Error(`FFmpeg process execution failed: ${err.message}`));
    });

    ffmpegProc.on('close', (code: number) => {
      if (code !== 0 && madSeries.length === 0) {
        return reject(
          new Error(`FFmpeg exited with error code ${code}: ${stderrOutput.trim() || 'Unknown error'}`)
        );
      }
      resolve(madSeries);
    });
  });
}

/**
 * End-to-end analysis of a rendered MP4 video against a ShotSpec impact whitelist.
 */
export async function analyzeRenderedVideo(
  videoPath: string,
  shotSpecOrPath?: any,
  options: TemporalQAOptions = {}
): Promise<TemporalVideoQAReport> {
  const resolvedVideo = path.resolve(videoPath);
  if (!fs.existsSync(resolvedVideo)) {
    throw new Error(`Video file not found (ENOENT): ${resolvedVideo}`);
  }

  let whitelistedFrames: number[] = [];

  if (typeof shotSpecOrPath === 'string' && shotSpecOrPath.trim().length > 0) {
    const specPath = path.resolve(shotSpecOrPath);
    if (!fs.existsSync(specPath) || fs.statSync(specPath).isDirectory()) {
      throw new Error(`ShotSpec file not found (ENOENT): ${specPath}`);
    }
    const rawSpec = fs.readFileSync(specPath, 'utf-8');
    const parsedSpec = JSON.parse(rawSpec);
    whitelistedFrames = extractWhitelistedFrames(parsedSpec);
  } else if (shotSpecOrPath && typeof shotSpecOrPath === 'object') {
    whitelistedFrames = extractWhitelistedFrames(shotSpecOrPath);
  }

  const windowRadius = options.windowRadius ?? 5;
  const thresholdRatio = options.thresholdRatio ?? 4.0;

  const madSeries = await decodeVideoMadSeries(resolvedVideo, options);
  const evalResult = evaluateMadSpikes(madSeries, windowRadius, thresholdRatio, whitelistedFrames);

  const frameCount = madSeries.length;
  const durationSec = frameCount / 30; // standard 30fps default

  const minMad = frameCount > 0 ? Math.min(...madSeries) : 0;
  const maxMad = frameCount > 0 ? Math.max(...madSeries) : 0;
  const avgMad = frameCount > 0 ? madSeries.reduce((a, b) => a + b, 0) / frameCount : 0;

  const sortedMads = [...madSeries].sort((a, b) => a - b);
  const mid = Math.floor(sortedMads.length / 2);
  const medianMad =
    sortedMads.length === 0
      ? 0
      : sortedMads.length % 2 !== 0
      ? sortedMads[mid]
      : (sortedMads[mid - 1] + sortedMads[mid]) / 2;

  return {
    ...evalResult,
    videoPath: resolvedVideo,
    frameCount,
    durationSec,
    thresholdRatio,
    windowRadius,
    stats: {
      minMad,
      maxMad,
      avgMad,
      medianMad,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI Execution
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log(`
🎬 [TEMPORAL RENDER QA] Automated Video Discontinuity & Spike Inspector

Usage:
  npx tsx validators/temporal-render-qa.ts <video-path.mp4> [shot-spec.json] [options]

Options:
  -t, --threshold=<number>   Spike ratio threshold relative to local median (default: 4.0)
  -w, --window=<number>      Local median rolling window radius in frames (default: 5)
  -j, --json                 Output machine-readable JSON report
  -o, --output=<file>        Write JSON report to specified file path
  --ffmpeg=<path>            Explicit path to ffmpeg executable
  -v, --verbose              Display frame-by-frame telemetry
  -h, --help                 Display this usage guide
`);
}

const isDirectCli =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? process.argv[1].endsWith('temporal-render-qa.ts') || process.argv[1].endsWith('temporal-render-qa')
    : false;

if (isDirectCli) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
      printUsage();
      process.exit(args.length === 0 ? 1 : 0);
    }

    let videoPath = '';
    let shotSpecPath = '';
    let thresholdRatio = 4.0;
    let windowRadius = 5;
    let jsonOutput = false;
    let outputFile = '';
    let ffmpegPath = '';
    let verbose = false;

    const positional: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--json' || arg === '-j') {
        jsonOutput = true;
      } else if (arg === '--verbose' || arg === '-v') {
        verbose = true;
      } else if (arg.startsWith('--threshold=')) {
        thresholdRatio = parseFloat(arg.split('=')[1]);
      } else if ((arg === '--threshold' || arg === '-t') && args[i + 1] && !args[i + 1].startsWith('-')) {
        thresholdRatio = parseFloat(args[++i]);
      } else if (arg.startsWith('--window=')) {
        windowRadius = parseInt(arg.split('=')[1], 10);
      } else if ((arg === '--window' || arg === '-w') && args[i + 1] && !args[i + 1].startsWith('-')) {
        windowRadius = parseInt(args[++i], 10);
      } else if (arg.startsWith('--output=')) {
        outputFile = arg.split('=')[1];
      } else if ((arg === '--output' || arg === '-o') && args[i + 1] && !args[i + 1].startsWith('-')) {
        outputFile = args[++i];
      } else if (arg.startsWith('--ffmpeg=')) {
        ffmpegPath = arg.split('=')[1];
      } else if (arg === '--ffmpeg' && args[i + 1] && !args[i + 1].startsWith('-')) {
        ffmpegPath = args[++i];
      } else if (!arg.startsWith('-')) {
        positional.push(arg);
      }
    }

    if (positional.length < 1) {
      console.error('Error: video path argument is required.');
      process.exit(1);
    }

    videoPath = positional[0];
    if (positional.length >= 2) {
      shotSpecPath = positional[1];
    }

    try {
      if (!jsonOutput) {
        console.log(`\n🔍 [TEMPORAL QA] Analyzing video: ${videoPath}`);
        if (shotSpecPath) {
          console.log(`📋 [TEMPORAL QA] Reconciling with ShotSpec: ${shotSpecPath}`);
        }
      }

      const report = await analyzeRenderedVideo(videoPath, shotSpecPath, {
        windowRadius,
        thresholdRatio,
        ffmpegPath,
        verbose,
      });

      if (outputFile) {
        fs.writeFileSync(path.resolve(outputFile), JSON.stringify(report, null, 2), 'utf-8');
      }

      if (jsonOutput) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(`\n================================================================================`);
        console.log(`                           TEMPORAL RENDER QA REPORT                            `);
        console.log(`================================================================================`);
        console.log(` Video File:      ${report.videoPath}`);
        console.log(` Total Frames:    ${report.frameCount} (${report.durationSec.toFixed(2)}s @ 30fps)`);
        console.log(` Median Window:   ±${report.windowRadius} frames (window size: ${report.windowRadius * 2 + 1})`);
        console.log(` Spike Threshold: > ${report.thresholdRatio.toFixed(1)}x local median MAD`);
        console.log(` Min / Avg / Max: ${report.stats.minMad.toFixed(3)} / ${report.stats.avgMad.toFixed(3)} / ${report.stats.maxMad.toFixed(3)}`);
        console.log(` Overall Median:  ${report.stats.medianMad.toFixed(3)}`);
        console.log(`--------------------------------------------------------------------------------`);

        if (report.whitelistedEvents.length > 0) {
          console.log(`\x1b[36m[WHITELISTED IMPACTS]\x1b[0m ${report.whitelistedEvents.length} deliberate event(s):`);
          for (const w of report.whitelistedEvents) {
            console.log(`  ✓ Frame ${String(w.frame).padStart(4)}: MAD = ${w.mad.toFixed(2)}, Ratio = ${w.ratio.toFixed(2)}x (Permitted)`);
          }
        }

        if (report.anomalies.length > 0) {
          console.log(`\n\x1b[31m[UNANNOTATED ANOMALIES]\x1b[0m ${report.anomalies.length} defect(s) detected:`);
          for (const a of report.anomalies) {
            console.log(
              `  ✗ Frame ${String(a.frame).padStart(4)}: MAD = ${a.mad.toFixed(2)}, Local Median = ${a.localMedian.toFixed(2)}, Ratio = \x1b[31m${a.ratio.toFixed(2)}x\x1b[0m`
            );
          }
        }

        console.log(`================================================================================`);
        if (report.valid) {
          console.log(`\x1b[32m\x1b[1m✅ [PASSED] Temporal video quality certified. 0 unannotated discontinuities.\x1b[0m\n`);
          process.exit(0);
        } else {
          console.log(
            `\x1b[31m\x1b[1m❌ [FAILED] Quality gate rejected: ${report.anomalies.length} unannotated discontinuity spike(s) > ${report.thresholdRatio}x.\x1b[0m\n`
          );
          process.exit(1);
        }
      }
    } catch (err: any) {
      if (jsonOutput) {
        console.log(JSON.stringify({ error: err.message, stack: err.stack }));
      } else {
        console.error(`\n\x1b[31m[ERROR]\x1b[0m ${err.message}`);
      }
      process.exit(1);
    }
  })();
}
