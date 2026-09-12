#!/usr/bin/env tsx
/**
 * STORYBOARD CONTACT SHEET GENERATOR (LAYER 1 QA GATE)
 * 
 * Reads semantic-timeline.json and rendered MP4 video (1080p or 360p).
 * For each semantic beat, extracts:
 * - Start keyframe: Fs (onset of beat)
 * - Mid keyframe: floor((Fs + Fe) / 2) (apex of transformation)
 * - End keyframe: Fe - 1 (settled state)
 * 
 * Saves frames to output directory and generates contact-sheet-manifest.json.
 * CLI: npx tsx validators/extract-contact-sheet.ts <timelinePath> [videoPath] [outDir]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

export interface BeatKeyframeInfo {
  beatId: string;
  shotId?: string;
  conceptId?: string;
  startFrame: number;
  midFrame: number;
  endFrame: number;
  startSec: number;
  midSec: number;
  endSec: number;
  visualIntent?: string;
  primaryObject?: string;
  visualExplanationContract?: {
    spatialRelationship?: string;
    transformationType?: string;
    coreMechanism?: string;
  };
  frames: {
    start: string;
    mid: string;
    end: string;
  };
}

export interface ContactSheetManifest {
  version: string;
  generatedAt: string;
  timelinePath: string;
  videoPath: string;
  outputDirectory: string;
  totalBeats: number;
  totalFramesExtracted: number;
  beats: BeatKeyframeInfo[];
}

export interface ExtractOptions {
  timelinePath: string;
  videoPath?: string;
  outDir?: string;
  verbose?: boolean;
  clean?: boolean;
  force?: boolean;
}

/**
 * Extracts 3 keyframes (Start, Mid, End) per semantic beat from a rendered video.
 */
export async function extractContactSheet(options: ExtractOptions): Promise<ContactSheetManifest> {
  const { timelinePath, verbose = false, clean = false, force = false } = options;
  const resolvedTimeline = path.resolve(timelinePath);

  if (!fs.existsSync(resolvedTimeline)) {
    throw new Error(`Timeline file not found: ${resolvedTimeline}`);
  }

  const timelineRaw = fs.readFileSync(resolvedTimeline, 'utf-8');
  let timeline: any;
  try {
    timeline = JSON.parse(timelineRaw);
  } catch (err: any) {
    throw new Error(`Failed to parse timeline JSON at ${resolvedTimeline}: ${err.message}`);
  }

  const beats: any[] = Array.isArray(timeline.beats) ? timeline.beats : (Array.isArray(timeline) ? timeline : []);
  if (beats.length === 0) {
    throw new Error(`No semantic beats found in timeline at ${resolvedTimeline}`);
  }

  const fps = typeof timeline.fps === 'number' && timeline.fps > 0 ? timeline.fps : 30;

  // Resolve video path: default to project-specific preview or fallback candidates
  let videoPath = options.videoPath;
  if (!videoPath) {
    const compName = path.basename(path.dirname(resolvedTimeline));
    const candidatePreviews = [
      path.join('out', `${compName}-preview-360x640.mp4`),
      path.join('out', `${compName}-1080p.mp4`),
      'out/scopus-research-gap-preview-360x640.mp4',
      'out/scopus-research-gap-1080p.mp4',
      'out/preview-360x640.mp4',
      'out/final-v3_3.mp4',
    ];
    for (const candidate of candidatePreviews) {
      if (fs.existsSync(candidate)) {
        videoPath = candidate;
        break;
      }
    }
    if (!videoPath) {
      videoPath = 'out/preview-360x640.mp4';
    }
  }

  const resolvedVideo = path.resolve(videoPath);
  if (!fs.existsSync(resolvedVideo)) {
    throw new Error(`Video file not found: ${resolvedVideo} (fail-closed)`);
  }

  // Determine output directory
  let outDir = options.outDir;
  if (!outDir) {
    const compName = path.basename(path.dirname(resolvedTimeline));
    outDir = path.join('out/contact-sheets', compName || 'default');
  }
  const resolvedOutDir = path.resolve(outDir);
  if (!fs.existsSync(resolvedOutDir)) {
    fs.mkdirSync(resolvedOutDir, { recursive: true });
  } else if (clean || force) {
    const existing = fs.readdirSync(resolvedOutDir);
    for (const f of existing) {
      if (f.endsWith('.png') || f === 'contact-sheet-manifest.json') {
        try {
          fs.unlinkSync(path.join(resolvedOutDir, f));
        } catch {}
      }
    }
    if (verbose) {
      console.log(`Cleaned previous keyframes in ${resolvedOutDir}`);
    }
  }

  console.log(`\n==================================================================`);
  console.log(` STORYBOARD CONTACT SHEET GENERATOR (LAYER 1 QA GATE)`);
  console.log(` Timeline: ${resolvedTimeline}`);
  console.log(` Video:    ${resolvedVideo}`);
  console.log(` Output:   ${resolvedOutDir}`);
  console.log(` Beats:    ${beats.length} beats @ ${fps} fps`);
  console.log(`==================================================================\n`);

  // Build target keyframe mappings
  const beatManifests: BeatKeyframeInfo[] = [];
  interface FrameTarget {
    frameIndex: number;
    destPath: string;
    fileName: string;
  }
  const targets: FrameTarget[] = [];

  for (const b of beats) {
    const startF = typeof b.startFrame === 'number' ? b.startFrame : Math.round((b.startSec || 0) * fps);
    const rawEndF = typeof b.endFrame === 'number' ? b.endFrame : Math.round((b.endSec || 0) * fps);
    const endF = Math.max(startF, rawEndF - 1);
    const midF = Math.floor((startF + rawEndF) / 2);

    const safeId = (b.id || `beat_${beats.indexOf(b) + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const startName = `${safeId}_start.png`;
    const midName = `${safeId}_mid.png`;
    const endName = `${safeId}_end.png`;

    targets.push({ frameIndex: startF, destPath: path.join(resolvedOutDir, startName), fileName: startName });
    targets.push({ frameIndex: midF, destPath: path.join(resolvedOutDir, midName), fileName: midName });
    targets.push({ frameIndex: endF, destPath: path.join(resolvedOutDir, endName), fileName: endName });

    beatManifests.push({
      beatId: b.id || safeId,
      shotId: b.shotId,
      conceptId: b.conceptId,
      startFrame: startF,
      midFrame: midF,
      endFrame: endF,
      startSec: Number((startF / fps).toFixed(3)),
      midSec: Number((midF / fps).toFixed(3)),
      endSec: Number((endF / fps).toFixed(3)),
      visualIntent: b.visualIntent,
      primaryObject: b.primaryObject,
      visualExplanationContract: b.visualExplanationContract,
      frames: {
        start: startName,
        mid: midName,
        end: endName,
      },
    });
  }

  // Group unique frame indices to extract
  const uniqueFrameMap = new Map<number, FrameTarget[]>();
  for (const t of targets) {
    if (!uniqueFrameMap.has(t.frameIndex)) {
      uniqueFrameMap.set(t.frameIndex, []);
    }
    uniqueFrameMap.get(t.frameIndex)!.push(t);
  }

  const sortedFrames = Array.from(uniqueFrameMap.keys()).sort((a, b) => a - b);
  console.log(`Extracting ${sortedFrames.length} unique keyframes across ${beats.length} beats...`);

  // Create temporary scratch dir for batch extraction
  const tempScratch = path.join(resolvedOutDir, '.tmp_extract_' + Date.now());
  fs.mkdirSync(tempScratch, { recursive: true });

  const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';

  // Attempt fast single-pass extraction via select filter
  let batchSuccess = false;
  try {
    const selectFilter = sortedFrames.map((f) => `eq(n\\,${f})`).join('+');
    const outPattern = path.join(tempScratch, 'frame_%05d.png');
    const ffmpegArgs = [
      '-y',
      '-v', 'error',
      '-i', resolvedVideo,
      '-vf', `select='${selectFilter}'`,
      '-vsync', 'vfr',
      outPattern,
    ];

    if (verbose) {
      console.log(`Executing FFmpeg batch select: ${ffmpegBin} ${ffmpegArgs.join(' ')}`);
    }

    const res = spawnSync(ffmpegBin, ffmpegArgs, { stdio: 'pipe' });
    if (res.status === 0) {
      const files = fs.readdirSync(tempScratch).filter((f) => f.endsWith('.png')).sort();
      if (files.length === sortedFrames.length) {
        // Map extracted frames to destination paths
        for (let i = 0; i < sortedFrames.length; i++) {
          const frameNum = sortedFrames[i];
          const srcPath = path.join(tempScratch, files[i]);
          const targetDests = uniqueFrameMap.get(frameNum) || [];
          for (const dest of targetDests) {
            fs.copyFileSync(srcPath, dest.destPath);
          }
        }
        batchSuccess = true;
        console.log(`✔ Fast batch extraction successful (${files.length} frames extracted in 1 pass).`);
      }
    }
  } catch (err: any) {
    if (verbose) {
      console.warn(`Batch extraction failed, falling back to sequential seek: ${err.message}`);
    }
  } finally {
    // Clean scratch
    try {
      if (fs.existsSync(tempScratch)) {
        const files = fs.readdirSync(tempScratch);
        for (const f of files) fs.unlinkSync(path.join(tempScratch, f));
        fs.rmdirSync(tempScratch);
      }
    } catch {
      // Ignore scratch cleanup error
    }
  }

  // Fallback: Individual frame seeking if batch pass didn't complete all frames
  if (!batchSuccess) {
    console.log(`Running individual keyframe extraction for missing frames...`);
    let extractedCount = 0;
    for (const frameNum of sortedFrames) {
      const dests = uniqueFrameMap.get(frameNum) || [];
      const primaryDest = dests[0]?.destPath;
      if (!primaryDest) continue;

      const timeSec = (frameNum / fps).toFixed(3);
      const args = [
        '-y',
        '-v', 'error',
        '-ss', String(timeSec),
        '-i', resolvedVideo,
        '-frames:v', '1',
        '-update', '1',
        primaryDest,
      ];
      const res = spawnSync(ffmpegBin, args, { stdio: 'pipe' });
      if (res.status !== 0 || !fs.existsSync(primaryDest)) {
        throw new Error(`Failed to extract keyframe at ${timeSec}s (frame ${frameNum}): ${res.stderr?.toString()}`);
      }
      extractedCount++;

      // Copy to other duplicate destinations if any
      for (let i = 1; i < dests.length; i++) {
        fs.copyFileSync(primaryDest, dests[i].destPath);
      }
    }
    console.log(`✔ Sequential extraction completed (${extractedCount} frames).`);
  }

  // Verify all files exist
  let missing = 0;
  for (const t of targets) {
    if (!fs.existsSync(t.destPath) || fs.statSync(t.destPath).size < 100) {
      missing++;
      console.error(`❌ Missing extracted frame: ${t.destPath}`);
    }
  }
  if (missing > 0) {
    throw new Error(`Contact sheet extraction incomplete: ${missing} frame(s) missing or corrupt.`);
  }

  // Write manifest
  const manifest: ContactSheetManifest = {
    version: '3.3.0',
    generatedAt: new Date().toISOString(),
    timelinePath: path.relative(process.cwd(), resolvedTimeline),
    videoPath: path.relative(process.cwd(), resolvedVideo),
    outputDirectory: path.relative(process.cwd(), resolvedOutDir),
    totalBeats: beats.length,
    totalFramesExtracted: targets.length,
    beats: beatManifests,
  };

  const manifestPath = path.join(resolvedOutDir, 'contact-sheet-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n✅ [PASSED] Contact sheet manifest written to: ${manifestPath}`);
  console.log(`  Total beats indexed:  ${manifest.totalBeats}`);
  console.log(`  Total frames saved:   ${manifest.totalFramesExtracted}\n`);

  return manifest;
}

// CLI Execution
export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📸 [STORYBOARD CONTACT SHEET EXTRACTOR] Layer 1 Visual Verification Gate

Usage:
  npx tsx validators/extract-contact-sheet.ts <timelinePath> [videoPath] [outDir] [options]

Arguments:
  timelinePath    Path to semantic-timeline.json (required)
  videoPath       Path to rendered MP4 video (default: out/preview-360x640.mp4)
  outDir          Output directory for keyframe PNGs and manifest (default: out/contact-sheets/<comp>)

Options:
  --clean, -c     Purge previous PNG keyframes and manifest before extraction
  --force, -f     Force overwrite all existing keyframe files
  --verbose, -v   Verbose logging
  --help, -h      Display this guide
`);
    process.exit(0);
  }

  const flags = new Set(args.filter((a) => a.startsWith('-')));
  const positional = args.filter((a) => !a.startsWith('-'));

  let timelinePath = '';
  let videoPath: string | undefined;
  let outDir: string | undefined;
  let projectPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--timeline=')) timelinePath = a.split('=')[1];
    else if (a === '--timeline' && args[i + 1]) timelinePath = args[++i];
    else if (a.startsWith('--video=')) videoPath = a.split('=')[1];
    else if (a === '--video' && args[i + 1]) videoPath = args[++i];
    else if (a.startsWith('--outDir=')) outDir = a.split('=')[1];
    else if (a.startsWith('--out=')) outDir = a.split('=')[1];
    else if ((a === '--outDir' || a === '--out') && args[i + 1]) outDir = args[++i];
    else if (a.startsWith('--project=')) projectPath = a.split('=')[1];
    else if (a === '--project' && args[i + 1]) projectPath = args[++i];
  }

  if (!timelinePath && positional[0]) {
    timelinePath = positional[0];
  }
  if (!videoPath && positional[1]) {
    videoPath = positional[1];
  }
  if (!outDir && positional[2]) {
    outDir = positional[2];
  }

  if (!timelinePath) {
    if (projectPath) {
      timelinePath = path.join(projectPath, 'semantic-timeline.json');
    } else {
      const candidates = [
        'connection-film/src/projects/scopus-research-gap/semantic-timeline.json',
        'connection-film/src/legacy/scopus-explainer/semantic-timeline.json',
        'semantic-timeline.json',
        'out/semantic-timeline.json',
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          timelinePath = c;
          break;
        }
      }
    }
  }

  const verbose = flags.has('--verbose') || flags.has('-v');
  const clean = flags.has('--clean') || flags.has('-c') || flags.has('--force') || flags.has('-f');
  const force = flags.has('--force') || flags.has('-f');

  try {
    await extractContactSheet({ timelinePath, videoPath, outDir, verbose, clean, force });
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ Contact Sheet Extraction Failed: ${err.message}\n`);
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.includes('extract-contact-sheet')) {
  runCli();
}
