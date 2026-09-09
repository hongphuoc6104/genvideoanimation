import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Buffer } from 'node:buffer';
import {
  TtsEngine,
  SynthesizeOptions,
  SynthesizeResult,
  KokoroTtsEngineOptions,
} from './types';
import {
  DEFAULT_VOICE,
  SUPPORTED_VOICES,
  validateVoice,
} from './voices';
import { parseWavHeader } from './wav';

export class KokoroTtsEngine implements TtsEngine {
  private repoRoot: string;
  private modelDir: string;
  private modelPath: string;
  private voicesPath: string;
  private scriptPath: string;
  private pythonPath: string;
  private offlineDefault: boolean;

  constructor(options: KokoroTtsEngineOptions = {}) {
    this.repoRoot = options.repoRoot || this.findRepoRoot();
    this.modelDir = options.modelDir || path.resolve(this.repoRoot, 'models', 'kokoro');
    this.modelPath = options.modelPath || path.join(this.modelDir, 'kokoro-v1.0.onnx');
    this.voicesPath = options.voicesPath || path.join(this.modelDir, 'voices-v1.0.bin');
    this.scriptPath = path.resolve(this.repoRoot, 'scripts', 'generate-offline-narration.py');
    this.offlineDefault = options.offline ?? true;
    this.pythonPath = options.pythonPath || this.resolvePythonBinary();
  }

  private findRepoRoot(): string {
    let current = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (
        fs.existsSync(path.join(current, 'package.json')) &&
        (fs.existsSync(path.join(current, 'packages')) || fs.existsSync(path.join(current, 'motion-kit')))
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
    const venvPython = path.join(this.repoRoot, '.venv', 'bin', 'python3');
    if (fs.existsSync(venvPython)) {
      return venvPython;
    }
    const localUvPython = path.join(
      os.homedir(),
      '.local',
      'share',
      'uv',
      'python',
      'cpython-3.12-linux-x86_64-gnu',
      'bin',
      'python3.12'
    );
    if (fs.existsSync(localUvPython)) {
      return localUvPython;
    }
    return 'python3';
  }

  public getAvailableVoices(): string[] {
    return [...SUPPORTED_VOICES];
  }

  public async validateModelAssets(): Promise<boolean> {
    try {
      const modelStat = await fs.promises.stat(this.modelPath);
      const voicesStat = await fs.promises.stat(this.voicesPath);
      return modelStat.size > 10_000_000 && voicesStat.size > 1_000_000;
    } catch {
      return false;
    }
  }

  public async synthesize(options: SynthesizeOptions): Promise<SynthesizeResult> {
    if (!options.text || options.text.trim().length === 0) {
      throw new Error('SynthesizeOptions.text cannot be empty');
    }

    const voice = validateVoice(options.voice);
    const speed = options.speed ?? 1.0;
    const isOffline = options.offline ?? this.offlineDefault;

    const assetsValid = await this.validateModelAssets();
    if (!assetsValid) {
      throw new Error(
        `Kokoro model assets missing or invalid in "${this.modelDir}". Run 'npm run narration:setup' first.`
      );
    }

    const tempDir = path.join(os.tmpdir(), 'narration_kit_tts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const isCallerOutput = Boolean(options.outputPath);
    const targetWav =
      options.outputPath ||
      path.join(tempDir, `tts_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.wav`);

    const args = [
      this.scriptPath,
      '--text',
      options.text,
      '--voice',
      voice,
      '--speed',
      String(speed),
      '--output',
      targetWav,
      '--model-path',
      this.modelPath,
      '--voices-path',
      this.voicesPath,
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

    return new Promise<SynthesizeResult>((resolve, reject) => {
      childProcess.execFile(
        this.pythonPath,
        args,
        { env, maxBuffer: 10 * 1024 * 1024 },
        async (error, stdout, stderr) => {
          if (error) {
            // Clean up temporary file if generated
            if (!isCallerOutput && fs.existsSync(targetWav)) {
              try {
                await fs.promises.unlink(targetWav);
              } catch {}
            }
            return reject(
              new Error(`Kokoro TTS synthesis failed: ${stderr.trim() || error.message}`)
            );
          }

          try {
            const parsed = JSON.parse(stdout.trim());
            const audioBuffer = await fs.promises.readFile(targetWav);

            // Clean up temporary file if not explicitly requested by user
            if (!isCallerOutput) {
              try {
                await fs.promises.unlink(targetWav);
              } catch {}
            }

            // Validate standard 44-byte RIFF/WAV header
            const wavInfo = parseWavHeader(audioBuffer);
            if (wavInfo.sampleRate !== 24000) {
              throw new Error(`Invalid sample rate: expected 24000, got ${wavInfo.sampleRate}`);
            }
            if (wavInfo.channels !== 1) {
              throw new Error(`Invalid channel count: expected 1 (mono), got ${wavInfo.channels}`);
            }
            if (wavInfo.bitDepth !== 16) {
              throw new Error(`Invalid bit depth: expected 16, got ${wavInfo.bitDepth}`);
            }

            resolve({
              audioBuffer,
              sampleRate: 24000,
              channels: 1,
              durationSec: parsed.durationSec ?? wavInfo.durationSec,
              outputPath: isCallerOutput ? targetWav : undefined,
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
}
