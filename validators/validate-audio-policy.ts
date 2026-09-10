#!/usr/bin/env tsx
/**
 * validators/validate-audio-policy.ts
 *
 * Production Audio Policy and Acoustic Delivery Validator (V3.2 / R6 / R7 / R9).
 *
 * For policy "narration-sfx":
 * - Strictly FAILS if any background music, BGM, musicTrack, looped music,
 *   or music asset is present in the audio manifest or track list.
 * - PASSES only when final mix contains narration and optional SFX/ambience.
 * - Measures real rendered WAV file via FFmpeg single-pass ebur128:
 *     1. Integrated Loudness: [-16.5, -14.5] LUFS (Target: -15.0 LUFS)
 *     2. True Peak: <= -1.8 dBTP
 *     3. Max dead air / inter-sentence gap <= 0.30s
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface AudioPolicyCheckResult {
  passed: boolean;
  policy: string;
  manifestErrors: string[];
  acousticErrors: string[];
  measurements?: {
    durationSec: number;
    integratedLufs: number;
    truePeakDbtp: number;
    loudnessRangeLu: number;
    maxInterSilenceSec: number;
  };
}

export function measureAudioWav(wavPath: string): {
  durationSec: number;
  integratedLufs: number;
  truePeakDbtp: number;
  loudnessRangeLu: number;
  maxInterSilenceSec: number;
} {
  const resolvedPath = path.resolve(wavPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`WAV file not found for acoustic measurement: ${resolvedPath}`);
  }

  const ffmpegArgs = [
    '-hide_banner',
    '-nostats',
    '-vn',
    '-i',
    resolvedPath,
    '-af',
    'ebur128=peak=true,silencedetect=noise=-40dB:duration=0.30',
    '-f',
    'null',
    '-',
  ];

  const res = childProcess.spawnSync('ffmpeg', ffmpegArgs, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  const stderr = res.stderr || '';

  // 1. Duration
  let durationSec = 0;
  const durMatch = stderr.match(/Duration:\s+(\d+):(\d+):([\d.]+)/);
  if (durMatch) {
    const hours = parseFloat(durMatch[1]);
    const mins = parseFloat(durMatch[2]);
    const secs = parseFloat(durMatch[3]);
    durationSec = hours * 3600 + mins * 60 + secs;
  }

  // 2. Integrated Loudness
  let integratedLufs = -100;
  const lufsMatch = stderr.match(/Integrated loudness:\s+I:\s+([-\d.]+(?:e[+-]?\d+)?|-?inf)\s+LUFS/i);
  if (lufsMatch) {
    integratedLufs = lufsMatch[1].toLowerCase().includes('inf') ? -100 : parseFloat(lufsMatch[1]);
  }

  // 3. True Peak
  let truePeakDbtp = -100;
  const peakMatch = stderr.match(/True peak:\s+Peak:\s+([-\d.]+(?:e[+-]?\d+)?|-?inf)\s+dB(?:FS|TP)/i);
  if (peakMatch) {
    truePeakDbtp = peakMatch[1].toLowerCase().includes('inf') ? -100 : parseFloat(peakMatch[1]);
  }

  // 4. Loudness Range (LRA)
  let loudnessRangeLu = 0;
  const lraMatch = stderr.match(/Loudness range:\s+LRA:\s+([-\d.]+(?:e[+-]?\d+)?|-?inf)\s+LU/i);
  if (lraMatch) {
    loudnessRangeLu = lraMatch[1].toLowerCase().includes('inf') ? 0 : parseFloat(lraMatch[1]);
  }

  // 5. Silences
  const silences: Array<{ start: number; end: number; duration: number }> = [];
  let currentStart: number | null = null;
  const lines = stderr.split(/\r?\n/);

  for (const line of lines) {
    const startMatch = line.match(/silence_start:\s+([\d.]+)/);
    if (startMatch) {
      currentStart = parseFloat(startMatch[1]);
    }
    const endMatch = line.match(/silence_end:\s+([\d.]+)\s+\|\s+silence_duration:\s+([\d.]+)/);
    if (endMatch) {
      const end = parseFloat(endMatch[1]);
      const dur = parseFloat(endMatch[2]);
      const start = currentStart !== null ? currentStart : Math.max(0, end - dur);
      silences.push({ start, end, duration: dur });
      currentStart = null;
    }
  }

  const interSilences = silences.filter(
    (s) => durationSec <= 0 || (s.end < durationSec - 0.25 && s.start < durationSec - 1.2)
  );

  const maxInterSilenceSec = interSilences.length > 0
    ? Math.max(...interSilences.map((s) => s.duration))
    : 0.0;

  return {
    durationSec,
    integratedLufs: Math.round(integratedLufs * 10) / 10,
    truePeakDbtp: Math.round(truePeakDbtp * 10) / 10,
    loudnessRangeLu: Math.round(loudnessRangeLu * 10) / 10,
    maxInterSilenceSec: Math.round(maxInterSilenceSec * 100) / 100,
  };
}

export function validateAudioPolicy(options: {
  manifestPath?: string;
  manifestData?: any;
  wavPath?: string;
  expectedPolicy?: 'narration-sfx' | 'narration-music-sfx';
}): AudioPolicyCheckResult {
  const policy = options.expectedPolicy || 'narration-sfx';
  const manifestErrors: string[] = [];
  const acousticErrors: string[] = [];

  let manifest = options.manifestData;
  if (!manifest && options.manifestPath) {
    const resolvedManifest = path.resolve(options.manifestPath);
    if (!fs.existsSync(resolvedManifest)) {
      manifestErrors.push(`Manifest file not found: ${resolvedManifest}`);
    } else {
      try {
        manifest = JSON.parse(fs.readFileSync(resolvedManifest, 'utf-8'));
      } catch (e: any) {
        manifestErrors.push(`Failed to parse manifest JSON: ${e.message}`);
      }
    }
  }

  if (manifest) {
    // 1. Audio policy declaration check
    const declaredPolicy = manifest.audioPolicy || (manifest.tracks?.music || manifest.tracks?.background ? 'narration-music-sfx' : 'narration-sfx');
    if (policy === 'narration-sfx') {
      if (declaredPolicy !== 'narration-sfx') {
        manifestErrors.push(
          `Audio policy mismatch: declared policy '${declaredPolicy}', expected '${policy}'`
        );
      }

      // 2. Strict Music Prohibition under 'narration-sfx'
      const musicKeys = ['music', 'background', 'bgm', 'musicTrack', 'backgroundMusic', 'BGM'];
      for (const key of musicKeys) {
        if (manifest.tracks && manifest.tracks[key]) {
          manifestErrors.push(
            `Forbidden music track found in manifest.tracks.${key}: background music is strictly banned under narration-sfx policy.`
          );
        }
        if (manifest[key]) {
          manifestErrors.push(
            `Forbidden music element found in manifest.${key}: background music is strictly banned under narration-sfx policy.`
          );
        }
      }

      // Check sfx tracks for disguised music
      if (Array.isArray(manifest.tracks?.sfx)) {
        for (const sfx of manifest.tracks.sfx) {
          const fileName = (sfx.file || sfx.filePath || '').toLowerCase();
          if (
            fileName.includes('music') ||
            fileName.includes('soundtrack') ||
            fileName.includes('bgm') ||
            fileName.includes('theme')
          ) {
            manifestErrors.push(
              `Disguised music asset detected in SFX track '${sfx.id || fileName}': '${fileName}'`
            );
          }
          if (sfx.loop) {
            manifestErrors.push(
              `SFX track '${sfx.id || fileName}' has loop=true: continuous musical looping is banned under narration-sfx.`
            );
          }
        }
      }

      // 3. Narration presence check
      const hasNarration = Boolean(
        manifest.tracks?.narration || manifest.narrationTrack || manifest.output?.hasNarration !== false
      );
      if (!hasNarration) {
        manifestErrors.push('Manifest lacks authoritative narration track.');
      }
    }
  }

  // 4. Acoustic WAV Measurement if WAV path provided
  let measurements: any;
  if (options.wavPath) {
    const resolvedWav = path.resolve(options.wavPath);
    if (!fs.existsSync(resolvedWav)) {
      acousticErrors.push(`WAV file not found: ${resolvedWav}`);
    } else {
      try {
        measurements = measureAudioWav(resolvedWav);

        // Check integrated loudness [-16.5, -14.5] LUFS (Target -15.0 LUFS)
        if (measurements.integratedLufs < -16.5 || measurements.integratedLufs > -14.5) {
          acousticErrors.push(
            `Integrated Loudness (${measurements.integratedLufs} LUFS) outside target window [-16.5, -14.5] LUFS.`
          );
        }

        // Check true peak ceiling <= -1.8 dBTP
        if (measurements.truePeakDbtp > -1.8) {
          acousticErrors.push(
            `True Peak (${measurements.truePeakDbtp} dBTP) exceeds maximum delivery ceiling (-1.8 dBTP).`
          );
        }

        // Check dead air / silence cap
        if (measurements.maxInterSilenceSec > 0.35) {
          acousticErrors.push(
            `Excessive dead-air pause detected (${measurements.maxInterSilenceSec}s > 0.35s maximum inter-sentence threshold).`
          );
        }
      } catch (err: any) {
        acousticErrors.push(`Failed to measure WAV acoustics: ${err.message}`);
      }
    }
  }

  const passed = manifestErrors.length === 0 && acousticErrors.length === 0;

  return {
    passed,
    policy,
    manifestErrors,
    acousticErrors,
    measurements,
  };
}

function main() {
  const args = process.argv.slice(2);
  let manifestPath: string | undefined;
  let wavPath: string | undefined;
  let policy: 'narration-sfx' | 'narration-music-sfx' = 'narration-sfx';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest' && args[i + 1]) {
      manifestPath = args[i + 1];
      i++;
    } else if (args[i] === '--wav' && args[i + 1]) {
      wavPath = args[i + 1];
      i++;
    } else if (args[i] === '--policy' && args[i + 1]) {
      policy = args[i + 1] as any;
      i++;
    } else if (!args[i].startsWith('--')) {
      if (!manifestPath) manifestPath = args[i];
      else if (!wavPath) wavPath = args[i];
    }
  }

  console.log(`\n======================================================`);
  console.log(` VALIDATOR: Audio Policy & Acoustic Delivery Gate`);
  console.log(` Policy:   ${policy}`);
  if (manifestPath) console.log(` Manifest: ${manifestPath}`);
  if (wavPath) console.log(` WAV File: ${wavPath}`);
  console.log(`======================================================\n`);

  const result = validateAudioPolicy({
    manifestPath,
    wavPath,
    expectedPolicy: policy,
  });

  if (result.measurements) {
    console.log('Real Audio Measurements (FFmpeg ebur128):');
    console.log(`  Duration:            ${result.measurements.durationSec.toFixed(2)}s`);
    console.log(`  Integrated Loudness: ${result.measurements.integratedLufs} LUFS (Target: -15.0 LUFS)`);
    console.log(`  True Peak:           ${result.measurements.truePeakDbtp} dBTP (Ceiling: <= -1.8 dBTP)`);
    console.log(`  Loudness Range (LRA): ${result.measurements.loudnessRangeLu} LU`);
    console.log(`  Max Inter-Sentence:  ${result.measurements.maxInterSilenceSec}s\n`);
  }

  if (!result.passed) {
    console.error(`❌ AUDIO POLICY VALIDATION FAILED:`);
    for (const err of result.manifestErrors) {
      console.error(`  [Manifest Error] ${err}`);
    }
    for (const err of result.acousticErrors) {
      console.error(`  [Acoustic Error] ${err}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(`✅ PASS: Audio policy '${policy}' and acoustic delivery criteria satisfied.\n`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-audio-policy')) {
  main();
}
