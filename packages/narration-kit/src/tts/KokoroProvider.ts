/**
 * packages/narration-kit/src/tts/KokoroProvider.ts
 * Canonical implementation of TTSProvider using local Kokoro-82M.
 */

import { TTSProvider, TTSRequest, TTSResult } from './TTSProvider';
import { KokoroTtsEngine } from './KokoroTtsEngine';
import { DEFAULT_VOICE, SUPPORTED_VOICES } from './voices';

export class KokoroProvider implements TTSProvider {
  private engine: KokoroTtsEngine;

  constructor(engine?: KokoroTtsEngine) {
    this.engine = engine || new KokoroTtsEngine();
  }

  public getAvailableVoices(): string[] {
    return this.engine.getAvailableVoices();
  }

  public async synthesize(request: TTSRequest): Promise<TTSResult> {
    const res = await this.engine.synthesize({
      text: request.text,
      voice: request.voice || DEFAULT_VOICE,
      speed: request.speed ?? 1.0,
      outputPath: request.outputPath,
      offline: request.offline ?? true,
    });

    return {
      audioPath: res.outputPath || request.outputPath,
      durationSeconds: res.durationSec,
      sampleRate: res.sampleRate,
    };
  }
}
