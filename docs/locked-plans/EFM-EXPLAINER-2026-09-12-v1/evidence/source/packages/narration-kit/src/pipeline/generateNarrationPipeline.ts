/**
 * packages/narration-kit/src/pipeline/generateNarrationPipeline.ts
 * Unified V3 Narration, Karaoke Alignment, and Audio Production Pipeline.
 * Orchestrates: Script -> Normalization -> Chunking -> TTS -> Concatenation ->
 * Forced Alignment -> Caption Segmentation -> Audio Mixing -> Cue Derivation -> Manifest Artifacts.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { KokoroTtsEngine } from '../tts/KokoroTtsEngine';
import { createTTSProvider, DEFAULT_VIENEU_VOICE } from '../tts';
import { TextNormalizer } from '../normalization/textNormalizer';
import { NarrationChunker } from '../tts/chunkNarration';
import { NarrationProfileName } from '../prosody';
import { concatenateWavBuffers, parseWavHeader } from '../tts/wav';
import { WhisperXLocalAligner } from '../alignment/WhisperXLocalAligner';
import { normalizeAlignment } from '../alignment/normalizeAlignment';
import { validateAlignment } from '../alignment/validateAlignment';
import { segmentCaptions } from '../captions/segmentCaptions';
import { mixAudioTracks } from '../audio/mixAudio';
import { createAudioManifest } from '../audio/audioManifest';
import { createCueManifestFromNarration, CueManifest } from './deriveCues';
import { AudioPolicy, AudioTrackSpec } from '../audio/types';
import { GENVIDEO_ADAM_PROFILE } from '../audio/voiceProfile';
import { PlacementOptions, ShotSpecPlacementInput } from '../captions/types';

export interface NarrationPipelineRequest {
  script?: string;
  scriptText?: string;
  outputDir: string;
  voice?: string;
  profile?: NarrationProfileName;
  fps?: number;
  offline?: boolean;
  audioPolicy?: AudioPolicy;
  musicFilePath?: string;
  musicVolume?: number;
  sfxTracks?: AudioTrackSpec[];
  emphasisWords?: string[];
  shotSpecPath?: string;
  shotSpec?: ShotSpecPlacementInput | any;
  safeArea?: PlacementOptions;
  writeCuesJson?: boolean;
  compositionId?: string;
}

export interface PipelineArtifacts {
  scriptTxt: string;
  narrationWav: string;
  textMapJson: string;
  wordsJson: string;
  captionsJson: string;
  audioManifestJson: string;
  mixedWav: string;
  cuesJson?: string;
}

export interface NarrationPipelineResult {
  success: boolean;
  durationMs: number;
  durationSeconds: number;
  totalFrames: number;
  wordsCount: number;
  captionsCount: number;
  scriptPath: string;
  narrationWavPath: string;
  mixedAudioPath: string;
  textMapPath: string;
  wordsPath: string;
  captionsPath: string;
  audioManifestPath: string;
  cuesPath?: string;
  cueManifest?: CueManifest;
  artifacts: PipelineArtifacts;
}

export async function generateNarrationPipeline(
  request: NarrationPipelineRequest
): Promise<NarrationPipelineResult> {
  const startTime = performance.now();

  // 0. Input validation (T2-F27-01 requirement: halt on empty or whitespace script)
  const rawScript = (request.script ?? request.scriptText ?? '').trim();
  if (rawScript.length === 0) {
    throw new Error('Pipeline error: input script cannot be empty');
  }

  const outDir = path.resolve(request.outputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const fps = request.fps || 30;
  const voice =
    request.voice && request.voice.trim().length > 0
      ? request.voice.trim()
      : DEFAULT_VIENEU_VOICE;
  const isOffline = request.offline ?? true;
  const compositionId = request.compositionId || 'v3_composition';

  // Read ShotSpec file if shotSpecPath is provided and file exists
  let mergedShotSpec: any = request.shotSpec || null;
  if (!mergedShotSpec && request.shotSpecPath && fs.existsSync(request.shotSpecPath)) {
    try {
      mergedShotSpec = JSON.parse(fs.readFileSync(request.shotSpecPath, 'utf-8'));
    } catch {}
  }

  const profile: NarrationProfileName =
    request.profile || mergedShotSpec?.narration_profile || 'educational';
  const emphasisWords: string[] =
    request.emphasisWords || mergedShotSpec?.emphasis_words || [];

  // 1. Write canonical script.txt and original-script.txt
  const scriptPath = path.join(outDir, 'script.txt');
  fs.writeFileSync(scriptPath, rawScript + '\n', 'utf-8');
  const originalScriptPath = path.join(outDir, 'original-script.txt');
  fs.writeFileSync(originalScriptPath, rawScript + '\n', 'utf-8');

  // 2. Deterministic Bilingual Text Normalization & Bidirectional Mapping
  const normalizer = new TextNormalizer();
  const textMap = normalizer.createNarrationTextMap(rawScript);
  const textMapPath = path.join(outDir, 'narration-text-map.json');
  fs.writeFileSync(textMapPath, JSON.stringify(textMap, null, 2), 'utf-8');

  const spokenScriptPath = path.join(outDir, 'spoken-script.txt');
  fs.writeFileSync(spokenScriptPath, (textMap.spokenText || rawScript) + '\n', 'utf-8');

  const languageSpansPath = path.join(outDir, 'language-spans.json');
  fs.writeFileSync(languageSpansPath, JSON.stringify(textMap.languageSpans || [], null, 2), 'utf-8');

  const pronMapPath = path.join(outDir, 'pronunciation-map.json');
  fs.writeFileSync(pronMapPath, JSON.stringify(textMap.pronunciationMap || [], null, 2), 'utf-8');

  // 3. Prosody Semantic Chunking
  const chunker = new NarrationChunker();
  const chunks = chunker.chunkText(rawScript, {
    profile,
    emphasisWords,
  });

  // 4. TTS Chunk Synthesis & Lossless Concatenation via Polymorphic TTSProvider
  const ttsEngine = createTTSProvider({ voice, offline: isOffline });
  const chunkBuffers: Buffer[] = [];
  const tempChunkFiles: string[] = [];

  try {
    // If text fits in a single utterance (e.g. <= 2 chunks or short script), synthesize directly in single utterance
    if (chunks.length <= 1) {
      const synthText = textMap.spokenText || rawScript;
      const synthRes = await ttsEngine.synthesize({
        text: synthText,
        voice,
        speed: 1.0,
        offline: isOffline,
      });
      if (synthRes.audioBuffer) {
        chunkBuffers.push(synthRes.audioBuffer);
      } else if (synthRes.outputPath && fs.existsSync(synthRes.outputPath)) {
        chunkBuffers.push(fs.readFileSync(synthRes.outputPath));
      } else {
        throw new Error(`TTS synthesis returned neither audioBuffer nor valid outputPath`);
      }
    } else {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkText = chunk.spokenText || chunk.text;
        const chunkOut = path.join(outDir, `_chunk_${i}.wav`);
        tempChunkFiles.push(chunkOut);

        const synthRes = await ttsEngine.synthesize({
          text: chunkText,
          voice,
          speed: chunk.profile?.speed ?? 1.0,
          outputPath: chunkOut,
          offline: isOffline,
        });

        const wavPath = synthRes.outputPath || chunkOut;
        const wavBuf = fs.existsSync(wavPath) ? fs.readFileSync(wavPath) : synthRes.audioBuffer;
        if (!wavBuf) {
          throw new Error(`Chunk ${i} audio synthesis produced no buffer or file`);
        }
        chunkBuffers.push(wavBuf);
      }
    }
  } finally {
    // Automated temp cleanup
    for (const f of tempChunkFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
  }

  // Concatenate losslessly with silence gaps
  const narrationWavBuf = chunkBuffers.length === 1 ? chunkBuffers[0] : concatenateWavBuffers(chunkBuffers, 250);
  const narrationWavPath = path.join(outDir, 'narration.wav');
  fs.writeFileSync(narrationWavPath, narrationWavBuf);

  const wavHeader = parseWavHeader(narrationWavBuf);
  const durationSeconds = Math.round(wavHeader.durationSec * 100) / 100;
  const totalFrames = Math.ceil(durationSeconds * fps);

  // 5. Local Forced Alignment (WhisperX / Wav2Vec2)
  const aligner = new WhisperXLocalAligner();
  const rawTimings = await aligner.align(narrationWavPath, rawScript, textMapPath);
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

  // 6. Caption Segmentation & Safe Area Placement
  const safePosition = request.safeArea?.position || mergedShotSpec?.caption_position || 'bottom';
  const safeMargin = request.safeArea?.safeMargin || mergedShotSpec?.safe_margin || 96;
  const viewport = request.safeArea?.viewport || mergedShotSpec?.viewport;
  const subjectRegion = request.safeArea?.subjectRegion || mergedShotSpec?.subject_region;

  const isPortraitViewport = (viewport && viewport.height > viewport.width) || (!viewport);
  const maxChars = isPortraitViewport ? 26 : 42;

  const captionManifest = segmentCaptions(wordTimings, {
    fps,
    maxLinesPerGroup: 2,
    maxCharsPerLine: maxChars,
    position: safePosition,
    viewport: viewport || { width: 1080, height: 1920 },
    safeMargin,
    shotSpec: mergedShotSpec
      ? {
          caption_position: safePosition,
          safe_margin: safeMargin,
          viewport: viewport || { width: 1080, height: 1920 },
          subject_region: subjectRegion,
        }
      : undefined,
  });

  const captionsPath = path.join(outDir, 'captions.json');
  fs.writeFileSync(captionsPath, JSON.stringify(captionManifest, null, 2), 'utf-8');

  // 7. Multi-Track Audio Mixing & Dynamic Ducking (Outputs 48kHz stereo mixed-soundtrack.wav)
  const mixedSoundtrackName = 'mixed-soundtrack.wav';
  const mixedAudioPath = path.join(outDir, mixedSoundtrackName);

  const narrationTrack: AudioTrackSpec = {
    id: 'track-narration',
    type: 'narration',
    filePath: narrationWavPath,
    volume: 1.0,
    sampleRate: 24000,
    channels: 1,
    duration: durationSeconds,
    durationSec: durationSeconds,
  };

  const audioPolicy: AudioPolicy = request.audioPolicy || 'narration-sfx';

  let musicTrack: AudioTrackSpec | undefined;
  if (audioPolicy !== 'narration-sfx' && request.musicFilePath && fs.existsSync(request.musicFilePath)) {
    musicTrack = {
      id: 'track-music',
      type: 'music',
      filePath: request.musicFilePath,
      volume: request.musicVolume ?? 0.22,
      duration: durationSeconds,
      durationSec: durationSeconds,
      loop: true,
    };
  }

  const mixResult = mixAudioTracks({
    narrationTrack,
    musicTrack,
    sfxTracks: request.sfxTracks,
    outputPath: mixedAudioPath,
    targetDurationSec: durationSeconds,
    words: wordTimings,
    audioPolicy,
    duckingConfig: {
      duckingDepthDb: -12.8,
      attackMs: 100,
      releaseMs: 600,
    },
  });

  // 8. Create canonical audio-manifest.json
  const audioManifestPath = path.join(outDir, 'audio-manifest.json');
  createAudioManifest({
    outputPath: audioManifestPath,
    outputFile: mixedSoundtrackName,
    audioPolicy,
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
    narrationTrack,
    musicTrack,
    sfxTracks: request.sfxTracks,
    duckingConfig: {
      duckingDepthDb: -12.8,
      attackMs: 100,
      releaseMs: 600,
    },
    duckingRegions: mixResult.duckingRegions,
  });

  // 9. Semantic Animation Cues Derivation (F21 / motion-kit CueManifest)
  const cuesPath = path.join(outDir, 'cues.json');
  const cueManifest = createCueManifestFromNarration(wordTimings, captionManifest.groups, {
    fps,
    compositionId,
    durationInFrames: totalFrames,
    emphasisWords,
    outputPath: request.writeCuesJson !== false ? cuesPath : undefined,
  });

  const durationMs = Math.round(performance.now() - startTime);

  return {
    success: true,
    durationMs,
    durationSeconds,
    totalFrames,
    wordsCount: wordTimings.length,
    captionsCount: captionManifest.groups.length,
    scriptPath,
    narrationWavPath,
    mixedAudioPath,
    textMapPath,
    wordsPath,
    captionsPath,
    audioManifestPath,
    cuesPath: request.writeCuesJson !== false ? cuesPath : undefined,
    cueManifest,
    artifacts: {
      scriptTxt: 'script.txt',
      narrationWav: 'narration.wav',
      textMapJson: 'narration-text-map.json',
      wordsJson: 'words.json',
      captionsJson: 'captions.json',
      audioManifestJson: 'audio-manifest.json',
      mixedWav: mixedSoundtrackName,
      cuesJson: request.writeCuesJson !== false ? 'cues.json' : undefined,
    },
  };
}
