#!/usr/bin/env tsx
/**
 * scripts/render-scopus-v3_1.ts
 *
 * Real Project Acceptance Runner for Milestone 7 (Requirement R13):
 * - Synthesizes master Vietnamese narration using local offline VieNeu-TTS v3 Turbo
 *   for the complete 80.0s (2400 frames) Scopus Research Gap Explainer.
 * - Preserves natural English pronunciation for Scopus, Research Gap, Desk Reject,
 *   Web of Science, Swales CARS, TAM, CMV.
 * - Aligns word timings and subunit timestamps using local MMS_FA.
 * - Formats captions conforming to 1080x1920 mobile safe areas (max 26 chars/line).
 * - Mixes master soundtrack with background music and sound effects.
 * - Re-renders ScopusResearchGap-TikTok916 (1080x1920 30fps) with Remotion.
 * - Generates 360x640 preview video for mobile readability QA.
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { SCOPUS_SCRIPT, TOTAL_FRAMES, FPS } from '../connection-film/src/scopus-explainer/script';
import { runWithOfflineGuard } from '../validators/offline-network-guard';
import { TextNormalizer } from '../packages/narration-kit/src/normalization/textNormalizer';
import { VieNeuTtsEngine } from '../packages/narration-kit/src/tts/VieNeuTtsEngine';
import { parseWavHeader, extractPcmData, createWavFile } from '../packages/narration-kit/src/tts/wav';
import { segmentCaptions } from '../packages/narration-kit/src/captions/segmentCaptions';
import { mixAudioTracks } from '../packages/narration-kit/src/audio/mixAudio';

async function main() {
  console.log('######################################################################');
  console.log(' MILESTONE 7: SCOPUS RESEARCH GAP EXPLAINER V3.1 ACCEPTANCE');
  console.log(' Strict Offline Network Guard: ENFORCED');
  console.log(` Timeline: ${TOTAL_FRAMES} frames @ ${FPS} fps (80.00 seconds)`);
  console.log('######################################################################\n');

  const repoRoot = path.resolve(__dirname, '..');
  const scopusDir = path.join(repoRoot, 'connection-film', 'src', 'scopus-explainer');
  const publicAudioDir = path.join(repoRoot, 'connection-film', 'public', 'audio');
  const outDir = path.join(repoRoot, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(publicAudioDir, { recursive: true });

  await runWithOfflineGuard(async () => {
    const normalizer = new TextNormalizer({ locale: 'vi-VN' });
    const ttsEngine = new VieNeuTtsEngine({ offline: true, sampleRate: 48000 });
    const alignScript = path.join(repoRoot, 'scripts', 'align-multilingual.py');
    const pythonPath = path.join(repoRoot, '.venv', 'bin', 'python3');

    const totalSamples = 80 * 48000;
    const masterNarrationPcm = new Int16Array(totalSamples);
    const allAlignedWords: any[] = [];

    console.log(`--> Synthesizing ${SCOPUS_SCRIPT.length} narrative beats via VieNeu-TTS...`);

    const tmpDir = os.tmpdir();

    for (let i = 0; i < SCOPUS_SCRIPT.length; i++) {
      const beat = SCOPUS_SCRIPT[i];
      const slotDuration = beat.endTime - beat.startTime;
      console.log(`  [Beat ${i + 1}/${SCOPUS_SCRIPT.length}] ${beat.id} (${beat.startTime}s - ${beat.endTime}s, max ${slotDuration.toFixed(2)}s)`);

      const textMap = normalizer.createNarrationTextMap(beat.narration);
      const beatWavPath = path.join(tmpDir, `scopus_beat_${beat.id}.wav`);

      // Determine appropriate speed to fit cleanly in slot with a safe buffer
      let targetSpeed = 1.0;
      const wordCount = beat.narration.trim().split(/\s+/).length;
      const estDuration = wordCount / 3.0; // ~3.0 words per second baseline
      if (estDuration > slotDuration - 0.2) {
        targetSpeed = Math.min(1.25, Math.max(1.0, estDuration / (slotDuration - 0.25)));
      }

      await ttsEngine.synthesize({
        text: textMap.spokenText,
        voice: 'Minh Quân',
        speed: targetSpeed,
        outputPath: beatWavPath,
        offline: true,
      });

      const beatWavBuf = fs.readFileSync(beatWavPath);
      const beatHeader = parseWavHeader(beatWavBuf);
      const beatPcmBytes = extractPcmData(beatWavBuf);
      const beatSamples = new Int16Array(
        beatPcmBytes.buffer,
        beatPcmBytes.byteOffset,
        Math.floor(beatPcmBytes.length / 2)
      );

      // Place into master narration buffer
      const startSample = Math.round(beat.startTime * 48000);
      for (let s = 0; s < beatSamples.length && startSample + s < totalSamples; s++) {
        masterNarrationPcm[startSample + s] = beatSamples[s];
      }

      // Forced alignment for beat
      const beatOrigScript = path.join(tmpDir, `scopus_orig_${beat.id}.txt`);
      const beatTextMapPath = path.join(tmpDir, `scopus_map_${beat.id}.json`);
      const beatWordsOut = path.join(tmpDir, `scopus_words_${beat.id}.json`);

      fs.writeFileSync(beatOrigScript, beat.narration.trim() + '\n', 'utf-8');
      fs.writeFileSync(beatTextMapPath, JSON.stringify(textMap, null, 2), 'utf-8');

      childProcess.execFileSync(pythonPath, [
        alignScript,
        '--audio', beatWavPath,
        '--transcript-file', beatOrigScript,
        '--text-map', beatTextMapPath,
        '--output', beatWordsOut,
        '--offline',
      ], {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, OFFLINE_MODE: '1' },
      });

      const beatWords: any[] = JSON.parse(fs.readFileSync(beatWordsOut, 'utf-8'));
      for (const w of beatWords) {
        const globalStart = Math.round((beat.startTime + w.start) * 1000) / 1000;
        const globalEnd = Math.round((beat.startTime + w.end) * 1000) / 1000;
        const globalSubunits = w.subunits ? w.subunits.map((sub: any) => ({
          ...sub,
          start: Math.round((beat.startTime + sub.start) * 1000) / 1000,
          end: Math.round((beat.startTime + sub.end) * 1000) / 1000,
        })) : undefined;

        allAlignedWords.push({
          ...w,
          id: `w_${allAlignedWords.length}`,
          start: globalStart,
          end: globalEnd,
          subunits: globalSubunits,
        });
      }

      // Clean up tmp files for beat
      try {
        if (fs.existsSync(beatWavPath)) fs.unlinkSync(beatWavPath);
        if (fs.existsSync(beatOrigScript)) fs.unlinkSync(beatOrigScript);
        if (fs.existsSync(beatTextMapPath)) fs.unlinkSync(beatTextMapPath);
        if (fs.existsSync(beatWordsOut)) fs.unlinkSync(beatWordsOut);
      } catch {}
    }

    console.log(`\n✓ Assembled 80.0s master narration (${allAlignedWords.length} words aligned across 23 beats).`);

    // 2. Write master narration WAV
    const narrationWavBuf = createWavFile(Buffer.from(masterNarrationPcm.buffer), 48000, 1, 16);
    const rawNarrationPath = path.join(tmpDir, 'scopus_raw_narration.wav');
    fs.writeFileSync(rawNarrationPath, narrationWavBuf);

    // 3. Segment into captions conforming to 1080x1920 mobile safe areas
    console.log(`--> Segmenting captions for mobile 1080x1920 safe areas...`);
    const scopusCaptionsManifest = segmentCaptions(allAlignedWords, {
      fps: 30,
      maxLinesPerGroup: 2,
      maxCharsPerLine: 26,
      position: 'bottom',
      viewport: { width: 1080, height: 1920 },
      safeMargin: 96,
    });

    const captionsDst = path.join(scopusDir, 'subtitles', 'captions.json');
    fs.writeFileSync(captionsDst, JSON.stringify(scopusCaptionsManifest, null, 2), 'utf-8');
    console.log(`✓ Saved captions.json (${scopusCaptionsManifest.groups.length} caption groups).`);

    // 4. Mix Master Soundtrack
    console.log(`--> Mixing master soundtrack (narration + background music + SFX)...`);
    const manifestPath = path.join(scopusDir, 'audio', 'audio-manifest.json');
    const audioManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const musicFile = path.join(scopusDir, 'audio', audioManifest.tracks.background.file);
    const sfxTracks = audioManifest.tracks.sfx.map((s: any) => ({
      filePath: path.join(scopusDir, 'audio', s.file),
      startTimeSec: s.timeSec,
      volume: s.volume || 0.75,
    }));

    const scopusMasterOut = path.join(publicAudioDir, 'scopus_master_audio.wav');
    const scopusMasterSrc = path.join(scopusDir, 'audio', 'scopus_master_audio.wav');

    const mixResult = mixAudioTracks({
      narrationTrack: {
        filePath: rawNarrationPath,
        volume: 1.0,
      },
      musicTrack: {
        filePath: musicFile,
        volume: 0.28,
      },
      sfxTracks,
      targetDurationSec: 80.0,
      outputPath: scopusMasterOut,
    });

    fs.copyFileSync(scopusMasterOut, scopusMasterSrc);
    console.log(`✓ Master audio mixed: ${mixResult.durationSec}s, ${mixResult.integratedLoudnessLufs} LUFS.`);

    // 5. Re-render Complete Video with Remotion (1080x1920 30fps)
    console.log(`\n--> Rendering complete Scopus Explainer (1080x1920 30fps, 2400 frames)...`);
    const finalMp4 = path.join(outDir, 'scopus-research-gap-tiktok-9x16.mp4');

    const remotionBin = path.join(repoRoot, 'connection-film', 'node_modules', '.bin', 'remotion');
    childProcess.execFileSync(remotionBin, [
      'render',
      'src/index.ts',
      'ScopusResearchGap-TikTok916',
      finalMp4,
      '--concurrency=2',
      '--log=warn',
    ], {
      cwd: path.join(repoRoot, 'connection-film'),
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    const stat = fs.statSync(finalMp4);
    console.log(`✓ Rendered scopus-research-gap-tiktok-9x16.mp4: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);

    // 6. Mobile QA Preview (360x640)
    const previewMp4 = path.join(outDir, 'scopus-preview-360x640.mp4');
    console.log(`--> Generating mobile QA preview (360x640)...`);
    childProcess.execSync(
      `ffmpeg -y -i "${finalMp4}" -vf scale=360:640 -c:v libx264 -crf 24 -preset fast -c:a copy "${previewMp4}"`,
      { stdio: 'pipe' }
    );
    const prevStat = fs.statSync(previewMp4);
    console.log(`✓ Generated scopus-preview-360x640.mp4: ${(prevStat.size / 1024).toFixed(1)} KB`);

    // 7. Validate Caption Safe Margins
    console.log(`--> Validating Scopus captions layout against 1080x1920 safe areas...`);
    childProcess.execFileSync(
      'npx',
      ['tsx', path.join(repoRoot, 'validators', 'validate-caption-layout.ts'), '--captions', captionsDst],
      { cwd: repoRoot, stdio: 'inherit' }
    );

    console.log(`\n======================================================================`);
    console.log(` ✅ MILESTONE 7 REAL PROJECT ACCEPTANCE COMPLETE PASS!`);
    console.log(` Video: out/scopus-research-gap-tiktok-9x16.mp4`);
    console.log(` Preview: out/scopus-preview-360x640.mp4`);
    console.log(`======================================================================\n`);
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n❌ FATAL SCOPUS ACCEPTANCE ERROR:', err);
    process.exit(1);
  });
}
