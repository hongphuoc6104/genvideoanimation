/**
 * packages/narration-kit/src/tts/KokoroAssetManager.ts
 * Manages local Kokoro model weights, voices, and offline integrity.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SUPPORTED_VOICES } from './voices';

export interface AssetStatus {
  modelPresent: boolean;
  voicesPresent: boolean;
  individualVoicesPresent: Record<string, boolean>;
  allReady: boolean;
  modelPath: string;
  voicesPath: string;
}

export class KokoroAssetManager {
  private repoRoot: string;
  private modelDir: string;

  constructor(repoRoot?: string) {
    this.repoRoot = repoRoot || process.cwd();
    this.modelDir = path.resolve(this.repoRoot, 'models', 'kokoro');
  }

  public getModelPath(): string {
    return path.join(this.modelDir, 'kokoro-v1.0.onnx');
  }

  public getVoicesPath(): string {
    return path.join(this.modelDir, 'voices-v1.0.bin');
  }

  public getVoicePath(voice: string): string {
    return path.join(this.modelDir, 'voices', `${voice}.bin`);
  }

  public checkStatus(): AssetStatus {
    const modelPath = this.getModelPath();
    const voicesPath = this.getVoicesPath();

    const modelPresent = fs.existsSync(modelPath) && fs.statSync(modelPath).size > 10_000_000;
    const voicesPresent = fs.existsSync(voicesPath) && fs.statSync(voicesPath).size > 1_000_000;

    const individualVoicesPresent: Record<string, boolean> = {};
    for (const v of SUPPORTED_VOICES) {
      const vPath = this.getVoicePath(v);
      individualVoicesPresent[v] = fs.existsSync(vPath) && fs.statSync(vPath).size > 100_000;
    }

    const allVoicesPresent = Object.values(individualVoicesPresent).every(Boolean);

    return {
      modelPresent,
      voicesPresent,
      individualVoicesPresent,
      allReady: modelPresent && voicesPresent,
      modelPath,
      voicesPath,
    };
  }
}
