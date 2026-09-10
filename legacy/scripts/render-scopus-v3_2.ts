#!/usr/bin/env tsx
/**
 * scripts/render-scopus-v3_2.ts
 *
 * Scopus Explainer Film Acceptance Runner for V3.2 (Requirements R11 & R12):
 * - V3.1 Bilingual NLP (TextNormalizer)
 * - V3.2 GENVIDEO_ADAM_PROFILE (Adam, v3turbo, onnx, fp32, temp 0.65, silenceP 0.05)
 * - Genvideo Audio Chain (GAP_CHAIN 0.13s pause cap, atempo, VOICE_CHAIN, loudnorm -15.0 LUFS / <= -1.8 dBTP)
 * - Content-Driven Timing Invariant:
 *     durationPolicy = "content-driven"
 *     allowSemanticOmission = false
 *     allowContentCompression = false
 *     Zero speedup hacks; video, shots, and scenes expand to fit spoken duration.
 * - SFX-Only Audio Policy:
 *     audioPolicy = "narration-sfx"
 *     Zero background music, zero BGM.
 * - Outputs:
 *     out/scopus-v3_2-no-music.mp4
 *     out/mobile-preview-360x640.mp4
 *     connection-film/public/audio/scopus_master_audio.wav
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SCOPUS_SCRIPT, FPS } from '../connection-film/src/scopus-explainer/script';
import { TextNormalizer } from '../packages/narration-kit/src/normalization/textNormalizer';
import { ROLE_DEFAULTS, NarrativeRole } from '../packages/narration-kit/src/audio/voiceProfile';
import { segmentCaptions } from '../packages/narration-kit/src/captions/segmentCaptions';
import { mixAudioTracks } from '../packages/narration-kit/src/audio/mixAudio';
import { createAudioManifest } from '../packages/narration-kit/src/audio/audioManifest';
import { validateAudioPolicy } from '../validators/validate-audio-policy';

// Assigned narrative roles for all 23 beats
const BEAT_ROLES: NarrativeRole[] = [
  'hook',     // beat_01
  'thesis',   // beat_02
  'body',     // beat_03
  'evidence', // beat_04
  'body',     // beat_05
  'evidence', // beat_06
  'evidence', // beat_07
  'evidence', // beat_08
  'evidence', // beat_09
  'evidence', // beat_10
  'body',     // beat_11
  'body',     // beat_12
  'body',     // beat_13
  'body',     // beat_14
  'evidence', // beat_15
  'body',     // beat_16
  'evidence', // beat_17
  'turn',     // beat_18
  'payoff',   // beat_19
  'body',     // beat_20
  'body',     // beat_21
  'turn',     // beat_22
  'close',    // beat_23
];

async function main() {
  console.log('======================================================================');
  console.log(' V3.2: SCOPUS RESEARCH GAP EXPLAINER (VOICE PARITY + SFX-ONLY)');
  console.log(' durationPolicy: content-driven | allowSemanticOmission: false');
  console.log(' allowContentCompression: false | audioPolicy: narration-sfx');
  console.log('======================================================================\n');

  const repoRoot = path.resolve(__dirname, '..');
  const scopusDir = path.join(repoRoot, 'connection-film', 'src', 'scopus-explainer');
  const publicAudioDir = path.join(repoRoot, 'connection-film', 'public', 'audio');
  const outDir = path.join(repoRoot, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(publicAudioDir, { recursive: true });

  const vieneuPython = '/home/hongphuoc6104/video3d/.genvideo/voice/vieneu/.venv/bin/python3';
  const alignPython = path.join(repoRoot, '.venv', 'bin', 'python3');
  const alignScript = path.join(repoRoot, 'scripts', 'align-multilingual.py');
  const vieneuScript = path.join(repoRoot, 'scripts', 'generate-vieneu-narration.py');

  const normalizer = new TextNormalizer({ locale: 'vi-VN' });

  // 1. Prepare Batch Synthesis Payload for VieNeu (Loaded ONCE for all 23 lines)
  console.log(`--> Preparing batch synthesis for ${SCOPUS_SCRIPT.length} narrative beats...`);
  const batchLines = [];
  const normalizedBeats: any[] = [];

  for (let i = 0; i < SCOPUS_SCRIPT.length; i++) {
    const beat = SCOPUS_SCRIPT[i];
    const role = BEAT_ROLES[i] || 'body';
    const roleDef = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.body;
    const textMap = normalizer.createNarrationTextMap(beat.narration);

    batchLines.push({
      id: i + 1,
      role,
      speed: roleDef.speed,
      pauseAfter: roleDef.pauseAfter,
      spoken: textMap.spokenText,
    });

    normalizedBeats.push({
      ...beat,
      role,
      speed: roleDef.speed,
      pauseAfter: roleDef.pauseAfter,
      spoken: textMap.spokenText,
      textMap,
    });
  }

  const batchOutputDir = path.join(scopusDir, 'audio');
  fs.mkdirSync(batchOutputDir, { recursive: true });

  const batchPayloadPath = path.join(batchOutputDir, 'scopus_batch.json');
  fs.writeFileSync(
    batchPayloadPath,
    JSON.stringify({
      voice: {
        voice: 'Adam',
        mode: 'v3turbo',
        backend: 'onnx',
        device: 'cpu',
        precision: 'fp32',
        temperature: 0.65,
        silenceP: 0.05,
      },
      lines: batchLines,
      outputDir: batchOutputDir,
      masterVoiceover: 'scopus_voiceover.wav',
    }, null, 2),
    'utf-8'
  );

  console.log(`--> Synthesizing all 23 takes in single VieNeu model load via ${vieneuScript}...`);
  childProcess.execFileSync(
    vieneuPython,
    [
      vieneuScript,
      '--batch-json', batchPayloadPath,
      '--reuse-voice',
      '--json',
    ],
    {
      stdio: 'inherit',
      env: { ...process.env, OFFLINE_MODE: '1' },
    }
  );

  const timingDataPath = path.join(batchOutputDir, 'timing.json');
  const timingData = JSON.parse(fs.readFileSync(timingDataPath, 'utf-8'));
  console.log(`✓ Narration batch synthesis complete: total ${timingData.totalDurationSec}s across ${timingData.totalLines} lines.`);

  // 2. Perform Forced Alignment (MMS_FA) on Each Synthesized Take
  console.log(`--> Aligning word timings via MMS_FA for each narrative beat...`);
  const allAlignedWords: any[] = [];
  const tmpDir = path.join(batchOutputDir, 'tmp_align');
  fs.mkdirSync(tmpDir, { recursive: true });

  for (let i = 0; i < timingData.scenes.length; i++) {
    const sceneTiming = timingData.scenes[i];
    const beat = normalizedBeats[i];
    const takeWav = sceneTiming.file;

    const beatOrigScript = path.join(tmpDir, `beat_${i + 1}_orig.txt`);
    const beatTextMapPath = path.join(tmpDir, `beat_${i + 1}_map.json`);
    const beatWordsOut = path.join(tmpDir, `beat_${i + 1}_words.json`);

    fs.writeFileSync(beatOrigScript, beat.narration.trim() + '\n', 'utf-8');
    fs.writeFileSync(beatTextMapPath, JSON.stringify(beat.textMap, null, 2), 'utf-8');

    childProcess.execFileSync(
      alignPython,
      [
        alignScript,
        '--audio', takeWav,
        '--transcript-file', beatOrigScript,
        '--text-map', beatTextMapPath,
        '--output', beatWordsOut,
        '--offline',
      ],
      {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, OFFLINE_MODE: '1' },
      }
    );

    const beatWords: any[] = JSON.parse(fs.readFileSync(beatWordsOut, 'utf-8'));
    const offsetSec = sceneTiming.start;

    for (const w of beatWords) {
      const globalStart = Math.round((offsetSec + w.start) * 1000) / 1000;
      const globalEnd = Math.round((offsetSec + w.end) * 1000) / 1000;
      const globalSubunits = w.subunits
        ? w.subunits.map((sub: any) => ({
            ...sub,
            start: Math.round((offsetSec + sub.start) * 1000) / 1000,
            end: Math.round((offsetSec + sub.end) * 1000) / 1000,
          }))
        : undefined;

      allAlignedWords.push({
        ...w,
        id: `w_${allAlignedWords.length}`,
        start: globalStart,
        end: globalEnd,
        subunits: globalSubunits,
      });
    }

    try {
      fs.unlinkSync(beatOrigScript);
      fs.unlinkSync(beatTextMapPath);
      fs.unlinkSync(beatWordsOut);
    } catch {}
  }

  try {
    fs.rmdirSync(tmpDir);
  } catch {}

  const wordsJsonPath = path.join(scopusDir, 'audio', 'words.json');
  fs.writeFileSync(wordsJsonPath, JSON.stringify(allAlignedWords, null, 2), 'utf-8');
  console.log(`✓ Forced alignment complete: ${allAlignedWords.length} words aligned.`);

  // 3. Segment into Mobile 9:16 Captions
  console.log(`--> Segmenting captions for mobile 1080x1920 safe areas...`);
  const captionManifest = segmentCaptions(allAlignedWords, {
    fps: FPS,
    maxLinesPerGroup: 2,
    maxCharsPerLine: 26,
    position: 'bottom',
    viewport: { width: 1080, height: 1920 },
    safeMargin: 96,
  });

  const captionsDst = path.join(scopusDir, 'subtitles', 'captions.json');
  fs.writeFileSync(captionsDst, JSON.stringify(captionManifest, null, 2), 'utf-8');
  console.log(`✓ Saved captions.json (${captionManifest.groups.length} groups).`);

  // 4. Calculate Content-Driven Shot Boundaries and Update shot-spec.json
  console.log(`--> Calculating content-driven shot boundaries for 5 scenes...`);
  // Mapping beats to scenes:
  // Scene 1: beats 0..4 (lines 1..5)
  // Scene 2: beats 5..9 (lines 6..10)
  // Scene 3: beats 10..14 (lines 11..15)
  // Scene 4: beats 15..18 (lines 16..19)
  // Scene 5: beats 19..22 (lines 20..23)
  const sceneBeatRanges = [
    { id: 'shot_01', startIdx: 0, endIdx: 4 },
    { id: 'shot_02', startIdx: 5, endIdx: 9 },
    { id: 'shot_03', startIdx: 10, endIdx: 14 },
    { id: 'shot_04', startIdx: 15, endIdx: 18 },
    { id: 'shot_05', startIdx: 19, endIdx: 22 },
  ];

  let currentFrameCursor = 0;
  const updatedShots = [];

  for (const range of sceneBeatRanges) {
    const firstBeatTiming = timingData.scenes[range.startIdx];
    const lastBeatTiming = timingData.scenes[range.endIdx];

    const sceneStartSec = firstBeatTiming.start;
    const sceneEndSec = lastBeatTiming.end + lastBeatTiming.pauseAfter;
    const sceneDurationSec = sceneEndSec - sceneStartSec;
    const sceneDurationFrames = Math.ceil(sceneDurationSec * FPS);

    const shotStartFrame = currentFrameCursor;
    const shotEndFrame = currentFrameCursor + sceneDurationFrames;
    currentFrameCursor = shotEndFrame;

    updatedShots.push({
      id: range.id,
      startFrame: shotStartFrame,
      endFrame: shotEndFrame,
      durationInFrames: sceneDurationFrames,
      startTimeSec: round(sceneStartSec, 3),
      endTimeSec: round(sceneEndSec, 3),
    });
  }

  const totalVideoFrames = currentFrameCursor;
  const totalVideoDurationSec = round(totalVideoFrames / FPS, 3);
  console.log(`✓ Content-driven video timeline: ${totalVideoFrames} frames (${totalVideoDurationSec}s @ ${FPS}fps).`);

  // Update shot-spec.json
  const shotSpecPath = path.join(scopusDir, 'shot-spec.json');
  const existingShotSpec = JSON.parse(fs.readFileSync(shotSpecPath, 'utf-8'));
  const newShotSpec = {
    ...existingShotSpec,
    totalFrames: totalVideoFrames,
    totalDurationSec: totalVideoDurationSec,
    durationPolicy: 'content-driven',
    allowSemanticOmission: false,
    allowContentCompression: false,
    shots: existingShotSpec.shots.map((shot: any, idx: number) => {
      const match = updatedShots[idx];
      return {
        ...shot,
        startFrame: match.startFrame,
        endFrame: match.endFrame,
        durationInFrames: match.durationInFrames,
      };
    }),
  };
  fs.writeFileSync(shotSpecPath, JSON.stringify(newShotSpec, null, 2), 'utf-8');

  // Update cues.json with synchronized frame timestamps
  const cuesPath = path.join(scopusDir, 'cues.json');
  const existingCues = JSON.parse(fs.readFileSync(cuesPath, 'utf-8'));
  const updatedCues = existingCues.cues.map((cue: any, idx: number) => {
    const beatTiming = timingData.scenes[idx];
    if (!beatTiming) return cue;
    const hitTimeSec = round(beatTiming.start + Math.min(1.5, beatTiming.audioDuration * 0.4), 3);
    const hitFrame = Math.round(hitTimeSec * FPS);
    return {
      ...cue,
      timeSec: hitTimeSec,
      frame: hitFrame,
    };
  });
  fs.writeFileSync(
    cuesPath,
    JSON.stringify({ ...existingCues, durationInFrames: totalVideoFrames, cues: updatedCues }, null, 2),
    'utf-8'
  );

  // 5. Multi-Track SFX Audio Mixing (NO BACKGROUND MUSIC)
  console.log(`--> Mixing master audio with narration + SFX only (no music)...`);
  const rawNarrationPath = path.join(batchOutputDir, 'scopus_voiceover.wav');

  const sfxTracks = updatedCues
    .filter((c: any) => Boolean(c.soundFx))
    .map((c: any) => ({
      filePath: path.join(scopusDir, 'audio', c.soundFx),
      startTimeSec: c.timeSec,
      volume: c.volume ?? 0.75,
    }));

  const masterAudioPublic = path.join(publicAudioDir, 'scopus_master_audio.wav');
  const masterAudioInternal = path.join(scopusDir, 'audio', 'scopus_master_audio.wav');

  const mixResult = mixAudioTracks({
    narrationTrack: {
      filePath: rawNarrationPath,
      volume: 1.0,
      durationSec: totalVideoDurationSec,
    },
    audioPolicy: 'narration-sfx', // Strictly NO MUSIC
    sfxTracks,
    targetDurationSec: totalVideoDurationSec,
    outputPath: masterAudioPublic,
  });

  fs.copyFileSync(masterAudioPublic, masterAudioInternal);
  console.log(`✓ Master audio mixed: ${mixResult.durationSec}s, ${mixResult.lufs} LUFS, peak ${mixResult.truePeakDbfs} dBTP.`);

  // 6. Create & Write Canonical audio-manifest.json
  const manifestPath = path.join(scopusDir, 'audio', 'audio-manifest.json');
  const audioManifest = createAudioManifest({
    outputPath: manifestPath,
    outputFile: 'scopus_master_audio.wav',
    audioPolicy: 'narration-sfx',
    voiceProfile: 'GENVIDEO_ADAM_PROFILE',
    totalDurationSec: mixResult.durationSec,
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    targetLufs: -15.0,
    truePeakDbfs: mixResult.truePeakDbfs,
    peakDbfs: mixResult.peakDbfs,
    integratedLufs: mixResult.lufs,
    lufs: mixResult.lufs,
    clippedSamples: mixResult.clippedSamples,
    narrationTrack: {
      id: 'narration_master',
      type: 'narration',
      file: 'scopus_voiceover.wav',
      duration: mixResult.durationSec,
      volume: 1.0,
    },
    sfxTracks,
  });
  fs.writeFileSync(manifestPath, JSON.stringify(audioManifest, null, 2), 'utf-8');

  // 7. Validate with Audio Policy Validator (R9)
  console.log(`--> Validating audio policy and acoustics with validate-audio-policy.ts...`);
  const policyCheck = validateAudioPolicy({
    manifestPath,
    wavPath: masterAudioPublic,
    expectedPolicy: 'narration-sfx',
  });

  if (!policyCheck.passed) {
    console.error('❌ Audio policy check failed:');
    console.error(policyCheck.manifestErrors);
    console.error(policyCheck.acousticErrors);
    process.exit(1);
  }
  console.log(`✓ Audio policy check PASSED: zero music, LUFS ${policyCheck.measurements?.integratedLufs}, TP ${policyCheck.measurements?.truePeakDbtp} dBTP.`);

  // 8. Re-render Complete Video with Remotion
  console.log(`\n--> Rendering complete Scopus Explainer (${totalVideoFrames} frames, 1080x1920 30fps)...`);
  const finalMp4 = path.join(outDir, 'scopus-v3_2-no-music.mp4');

  const remotionBin = path.join(repoRoot, 'connection-film', 'node_modules', '.bin', 'remotion');
  childProcess.execFileSync(
    remotionBin,
    [
      'render',
      'src/index.ts',
      'ScopusResearchGap-TikTok916',
      finalMp4,
      '--concurrency=2',
      '--log=warn',
    ],
    {
      cwd: path.join(repoRoot, 'connection-film'),
      stdio: ['ignore', 'inherit', 'inherit'],
    }
  );

  const mp4Stat = fs.statSync(finalMp4);
  console.log(`✓ Rendered scopus-v3_2-no-music.mp4: ${(mp4Stat.size / (1024 * 1024)).toFixed(2)} MB`);

  // 9. Mobile QA Preview (360x640)
  const previewMp4 = path.join(outDir, 'mobile-preview-360x640.mp4');
  console.log(`--> Generating mobile QA preview (360x640)...`);
  childProcess.execSync(
    `ffmpeg -y -i "${finalMp4}" -vf scale=360:640 -c:v libx264 -crf 24 -preset fast -c:a copy "${previewMp4}"`,
    { stdio: 'pipe' }
  );
  const prevStat = fs.statSync(previewMp4);
  console.log(`✓ Generated mobile-preview-360x640.mp4: ${(prevStat.size / 1024).toFixed(1)} KB`);

  console.log('\n======================================================================');
  console.log(' ✅ V3.2 SCOPUS RE-RENDER & ACCEPTANCE COMPLETE');
  console.log(` Video:   ${finalMp4}`);
  console.log(` Preview: ${previewMp4}`);
  console.log(` Master:  ${masterAudioPublic}`);
  console.log('======================================================================\n');
}

function round(val: number, decimals: number = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(val * f) / f;
}

if (require.main === module || process.argv[1]?.includes('render-scopus-v3_2')) {
  main().catch((err) => {
    console.error('❌ Fatal error in Scopus V3.2 render:', err);
    process.exit(1);
  });
}
