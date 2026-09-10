/**
 * packages/narration-kit/src/tts/VieNeuTtsEngine.ts
 *
 * Local offline VieNeu-TTS v3 Turbo engine for Remotion Narration Subsystem.
 * Synthesizes high-fidelity 48kHz (native) or 24kHz 16-bit mono linear PCM WAV (pcm_s16le).
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Buffer } from 'node:buffer';
import {
  TtsEngine,
  TTSProvider,
  TTSRequest,
  TTSResult,
  SynthesizeOptions,
  SynthesizeResult,
  VieNeuTtsEngineOptions,
  VoiceMetadata,
} from './types';
import {
  DEFAULT_VIENEU_VOICE,
  VIENEU_SUPPORTED_VOICES,
  VIENEU_VOICE_METADATA,
  resolveVieNeuVoice,
} from './vieneuVoices';
import { parseWavHeader } from './wav';

export class VieNeuTtsEngine implements TtsEngine, TTSProvider {
  public readonly name = 'vieneu';
  private repoRoot: string;
  private scriptPath: string;
  private pythonPath: string;
  private offlineDefault: boolean;
  private defaultSampleRate: number;

  constructor(options: VieNeuTtsEngineOptions = {}) {
    this.repoRoot = options.repoRoot || this.findRepoRoot();
    this.scriptPath =
      options.scriptPath ||
      path.resolve(this.repoRoot, 'scripts', 'generate-vieneu-narration.py');
    this.offlineDefault = options.offline ?? true;
    this.defaultSampleRate = options.sampleRate ?? 48000;
    this.pythonPath = options.pythonPath || this.resolvePythonBinary();
  }

  private findRepoRoot(): string {
    let current = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        fs.existsSync(path.join(current, 'package.json')) &&
        (fs.existsSync(path.join(current, 'packages')) ||
          fs.existsSync(path.join(current, 'scripts')))
      ) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return process.cwd();
  }

  private resolvePythonBinary(): string {
    // 1. Explicit environment variable
    if (process.env.VIENEU_PYTHON && fs.existsSync(process.env.VIENEU_PYTHON)) {
      return process.env.VIENEU_PYTHON;
    }

    // 2. Machine-wide VieNeu virtualenv
    const machineVenv = path.join(os.homedir(), 'video3d', '.genvideo', 'voice', 'vieneu', '.venv', 'bin', 'python3');
    if (fs.existsSync(machineVenv)) {
      return machineVenv;
    }

    // 3. Local repo virtualenv
    const localVenv = path.join(this.repoRoot, '.venv', 'bin', 'python3');
    if (fs.existsSync(localVenv)) {
      return localVenv;
    }

    // 4. Default to python3 in PATH
    return 'python3';
  }

  public getAvailableVoices(): string[] {
    return [...VIENEU_SUPPORTED_VOICES];
  }

  public getVoices(): VoiceMetadata[] {
    return Object.values(VIENEU_VOICE_METADATA);
  }

  public async validateModelAssets(): Promise<boolean> {
    try {
      const hfCache =
        process.env.HF_HOME || path.join(os.homedir(), '.cache', 'huggingface', 'hub');
      const vieneuModelDir = path.join(
        hfCache,
        'models--pnnbao-ump--VieNeu-TTS-v3-Turbo'
      );
      const mossCodecDir = path.join(
        hfCache,
        'models--OpenMOSS-Team--MOSS-Audio-Tokenizer-Nano-ONNX'
      );

      const vieneuExists = fs.existsSync(vieneuModelDir);
      const mossExists = fs.existsSync(mossCodecDir);

      return Boolean(vieneuExists && mossExists);
    } catch {
      return false;
    }
  }

  public async synthesize(
    options: SynthesizeOptions | TTSRequest
  ): Promise<SynthesizeResult & TTSResult> {
    if (!options.text || options.text.trim().length === 0) {
      throw new Error('SynthesizeOptions.text cannot be empty');
    }

    const voice = resolveVieNeuVoice(options.voice || DEFAULT_VIENEU_VOICE);
    const speed = options.speed ?? 1.0;
    const isOffline = options.offline ?? this.offlineDefault;
    const sampleRate = options.sampleRate ?? this.defaultSampleRate;

    const tempDir = path.join(os.tmpdir(), 'vieneu_narration_tts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const isCallerOutput = Boolean(options.outputPath);
    const targetWav =
      options.outputPath ||
      path.join(
        tempDir,
        `vieneu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.wav`
      );

    const args = [
      this.scriptPath,
      '--text',
      options.text,
      '--voice',
      voice,
      '--speed',
      String(speed),
      '--sample-rate',
      String(sampleRate),
      '--mode',
      'v3turbo',
      '--backend',
      'onnx',
      '--device',
      'cpu',
      '--precision',
      'fp32',
      '--temperature',
      '0.65',
      '--silence-p',
      '0.05',
      '--output',
      targetWav,
      '--json',
    ];

    if (isOffline) {
      args.push('--offline');
    }

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HF_HUB_OFFLINE: isOffline ? '1' : process.env.HF_HUB_OFFLINE,
      TRANSFORMERS_OFFLINE: isOffline ? '1' : process.env.TRANSFORMERS_OFFLINE,
      OFFLINE_MODE: isOffline ? '1' : process.env.OFFLINE_MODE,
    };

    return new Promise<SynthesizeResult & TTSResult>((resolve, reject) => {
      childProcess.execFile(
        this.pythonPath,
        args,
        { env, maxBuffer: 15 * 1024 * 1024 },
        async (error, stdout, stderr) => {
          if (error) {
            if (!isCallerOutput && fs.existsSync(targetWav)) {
              try {
                await fs.promises.unlink(targetWav);
              } catch {}
            }
            return reject(
              new Error(`VieNeu TTS synthesis failed: ${stderr.trim() || error.message}`)
            );
          }

          try {
            const parsed = JSON.parse(stdout.trim());
            const audioBuffer = await fs.promises.readFile(targetWav);

            if (!isCallerOutput) {
              try {
                await fs.promises.unlink(targetWav);
              } catch {}
            }

            const wavInfo = parseWavHeader(audioBuffer);
            if (wavInfo.channels !== 1) {
              throw new Error(
                `Invalid channel count: expected 1 (mono), got ${wavInfo.channels}`
              );
            }
            if (wavInfo.bitDepth !== 16) {
              throw new Error(
                `Invalid bit depth: expected 16, got ${wavInfo.bitDepth}`
              );
            }

            const durationSec = parsed.durationSec ?? wavInfo.durationSec;
            resolve({
              audioBuffer,
              sampleRate: wavInfo.sampleRate,
              channels: 1,
              bitDepth: 16,
              durationSec,
              durationSeconds: durationSec,
              durationMs: Math.round(durationSec * 1000),
              audioPath: isCallerOutput ? targetWav : '',
              outputPath: isCallerOutput ? targetWav : undefined,
              rtf: parsed.rtf,
            });
          } catch (parseError) {
            if (!isCallerOutput && fs.existsSync(targetWav)) {
              try {
                await fs.promises.unlink(targetWav);
              } catch {}
            }
            reject(parseError);
          }
        }
      );
    });
  }

  public async synthesizeBatch(options: {
    lines: Array<{
      id: number | string;
      role?: string;
      spoken: string;
      speed?: number;
      pauseAfter?: number;
    }>;
    outputDir: string;
    voice?: string;
    mode?: string;
    backend?: string;
    device?: string;
    precision?: string;
    temperature?: number;
    silenceP?: number;
    masterVoiceover?: string;
    reuseVoice?: boolean;
    offline?: boolean;
  }): Promise<{
    status: string;
    totalDurationSec: number;
    totalLines: number;
    masterVoiceover: string;
    scenes: Array<{
      id: number | string;
      role: string;
      speed: number;
      pauseAfter: number;
      start: number;
      end: number;
      audioDuration: number;
      totalDuration: number;
      spoken: string;
      file: string;
    }>;
  }> {
    const isOffline = options.offline ?? this.offlineDefault;
    const voice = resolveVieNeuVoice(options.voice || DEFAULT_VIENEU_VOICE);
    const tempBatchJson = path.join(
      options.outputDir,
      `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.json`
    );

    const batchPayload = {
      voice: {
        voice,
        mode: options.mode || 'v3turbo',
        backend: options.backend || 'onnx',
        device: options.device || 'cpu',
        precision: options.precision || 'fp32',
        temperature: options.temperature ?? 0.65,
        silenceP: options.silenceP ?? 0.05,
      },
      lines: options.lines,
      outputDir: options.outputDir,
      masterVoiceover: options.masterVoiceover || 'voiceover.wav',
    };

    fs.writeFileSync(tempBatchJson, JSON.stringify(batchPayload, null, 2), 'utf-8');

    const args = [this.scriptPath, '--batch-json', tempBatchJson, '--json'];
    if (options.reuseVoice) {
      args.push('--reuse-voice');
    }
    if (isOffline) {
      args.push('--offline');
    }

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HF_HUB_OFFLINE: isOffline ? '1' : process.env.HF_HUB_OFFLINE,
      TRANSFORMERS_OFFLINE: isOffline ? '1' : process.env.TRANSFORMERS_OFFLINE,
      OFFLINE_MODE: isOffline ? '1' : process.env.OFFLINE_MODE,
    };

    return new Promise((resolve, reject) => {
      childProcess.execFile(
        this.pythonPath,
        args,
        { env, maxBuffer: 30 * 1024 * 1024 },
        async (error, stdout, stderr) => {
          try {
            if (fs.existsSync(tempBatchJson)) {
              await fs.promises.unlink(tempBatchJson);
            }
          } catch {}

          if (error) {
            return reject(
              new Error(`VieNeu batch synthesis failed: ${stderr.trim() || error.message}`)
            );
          }

          try {
            const parsed = JSON.parse(stdout.trim());
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Failed to parse batch synthesis result: ${e.message}\nOutput: ${stdout}`));
          }
        }
      );
    });
  }
}
