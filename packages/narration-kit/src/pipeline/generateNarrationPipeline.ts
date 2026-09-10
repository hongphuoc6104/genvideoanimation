/**
 * packages/narration-kit/src/pipeline/generateNarrationPipeline.ts
 * Unified V3 Narration, Karaoke Alignment, and Audio Production Pipeline.
 * Orchestrates: Script -> Normalization -> Chunking -> TTS -> Concatenation ->
 * Forced Alignment -> Caption Segmentation -> Audio Mixing -> Manifest Artifacts.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { KokoroTtsEngine } from '../tts/KokoroTtsEngine';
import { TextNormalizer } from '../normalization/textNormalizer';
import { NarrationChunker } from '../tts/chunkNarration';
import { NarrationProfileName, PROSODY_PROFILES } from '../prosody';
import { concatenateWavBuffers, parseWavHeader } from '../tts/wav';
import { WhisperXLocalAligner } from '../alignment/WhisperXLocalAligner';
import { normalizeAlignment } from '../alignment/normalizeAlignment';
import { validateAlignment } from '../alignment/validateAlignment';
import { segmentCaptions } from '../captions/segmentCaptions';
import { mixAudioTracks } from '../audio/mixAudio';
import { createAudioManifest } from '../audio/audioManifest';
import { AudioTrackSpec } from '../audio/types';
import { PlacementOptions } from '../captions/types';

export interface NarrationPipelineRequest {
  script: string;
  outputDir: string;
  voice?: string;
  profile?: NarrationProfileName;
  fps?: number;
  offline?: boolean;
  musicFilePath?: string;
  musicVolume?: number;
  sfxTracks?: AudioTrackSpec[];
  emphasisWords?: string[];
  safeArea?: PlacementOptions;
}

export interface NarrationPipelineResult {
  scriptPath: string;
  narrationWavPath: string;
  mixedAudioPath: string;
  textMapPath: string;
  wordsPath: string;
  captionsPath: string;
  audioManifestPath: string;
  durationSeconds: number;
  totalFrames: number;
  wordsCount: number;
  captionsCount: number;
}

export async function generateNarrationPipeline(
  request: NarrationPipelineRequest
): Promise<NarrationPipelineResult> {
  const outDir = path.resolve(request.outputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const fps = request.fps || 30;
  const voice = request.voice || 'am_adam';
  const profile = request.profile || 'educational';
  const isOffline = request.offline ?? true;

  // 1. Write canonical script.txt
  const scriptPath = path.join(outDir, 'script.txt');
  fs.writeFileSync(scriptPath, request.script.trim() + '\n', 'utf-8');

  // 2. Deterministic Text Normalization & Mapping
  const normalizer = new TextNormalizer();
  const textMap = normalizer.createNarrationTextMap(request.script);
  const textMapPath = path.join(outDir, 'narration-text-map.json');
  fs.writeFileSync(textMapPath, JSON.stringify(textMap, null, 2), 'utf-8');

  // 3. Prosody Semantic Chunking
  const chunker = new NarrationChunker();
  const chunks = chunker.chunkText(request.script, {
    profile,
    emphasisWords: request.emphasisWords,
  });

  // 4. TTS Chunk Synthesis & Lossless Concatenation
  const ttsEngine = new KokoroTtsEngine();
  const chunkBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkText = chunk.spokenText || chunk.text;
    const chunkOut = path.join(outDir, `_chunk_${i}.wav`);

    const synthRes = await ttsEngine.synthesize({
      text: chunkText,
      voice,
      speed: chunk.profile?.speed ?? 1.0,
      outputPath: chunkOut,
      offline: isOffline,
    });

    const wavPath = synthRes.outputPath || chunkOut;
    const wavBuf = fs.readFileSync(wavPath);
    chunkBuffers.push(wavBuf);
    try { fs.unlinkSync(wavPath); } catch {}
  }

  // Concatenate losslessly with silence gaps
  const narrationWavBuf = concatenateWavBuffers(chunkBuffers, 250);
  const narrationWavPath = path.join(outDir, 'narration.wav');
  fs.writeFileSync(narrationWavPath, narrationWavBuf);

  const wavHeader = parseWavHeader(narrationWavBuf);
  const durationSeconds = Math.round(wavHeader.durationSec * 100) / 100;
  const totalFrames = Math.ceil(durationSeconds * fps);

  // 5. Local Forced Alignment (WhisperX / Wav2Vec2)
  const aligner = new WhisperXLocalAligner();
  // Align canonical script tokens against synthesized audio with text map
  const rawTimings = await aligner.align(narrationWavPath, request.script, textMapPath);
  const wordTimings = normalizeAlignment(rawTimings, durationSeconds);

  // Alignment Quality Gates validation
  const alignReport = validateAlignment(wordTimings, {
    audioDurationSec: durationSeconds,
    minConfidence: 0.6,
  });
  if (!alignReport.valid) {
    console.warn(`[Pipeline Warning] Alignment Quality Gate warnings:`, alignReport.errors);
  }

  const wordsPath = path.join(outDir, 'words.json');
  fs.writeFileSync(wordsPath, JSON.stringify(wordTimings, null, 2), 'utf-8');

  // 6. Caption Segmentation
  const captionManifest = segmentCaptions(wordTimings, {
    fps,
    maxLinesPerGroup: 2,
    maxCharsPerLine: 42,
    position: request.safeArea?.position || 'bottom',
    viewport: request.safeArea?.viewport,
    safeMargin: request.safeArea?.safeMargin,
  });

  const captionsPath = path.join(outDir, 'captions.json');
  fs.writeFileSync(captionsPath, JSON.stringify(captionManifest, null, 2), 'utf-8');

  // 7. Audio Mixing & Mastering
  const mixedAudioPath = path.join(outDir, 'mixed_audio.wav');
  const narrationTrack: AudioTrackSpec = {
    id: 'track-narration',
    type: 'narration',
    filePath: narrationWavPath,
    volume: 1.0,
  };

  let musicTrack: AudioTrackSpec | undefined;
  if (request.musicFilePath && fs.existsSync(request.musicFilePath)) {
    musicTrack = {
      id: 'track-music',
      type: 'music',
      filePath: request.musicFilePath,
      volume: request.musicVolume ?? 0.3,
      loop: true,
    };
  }

  const mixResult = mixAudioTracks({
    narrationTrack,
    musicTrack,
    sfxTracks: request.sfxTracks,
    outputPath: mixedAudioPath,
    targetDurationSec: durationSeconds,
  });

  // 8. Create audio-manifest.json
  const audioManifestPath = path.join(outDir, 'audio-manifest.json');
  createAudioManifest({
    outputPath: audioManifestPath,
    totalDurationSec: mixResult.durationSec,
    peakDbfs: mixResult.peakDbfs,
    integratedLufs: -16.0,
    narrationTrack,
    musicTrack,
    sfxTracks: request.sfxTracks,
    duckingRegions: mixResult.duckingRegions,
  });

  return {
    scriptPath,
    narrationWavPath,
    mixedAudioPath,
    textMapPath,
    wordsPath,
    captionsPath,
    audioManifestPath,
    durationSeconds,
    totalFrames,
    wordsCount: wordTimings.length,
    captionsCount: captionManifest.groups.length,
  };
}
