/**
 * packages/narration-kit/src/tts/VieNeuProvider.ts
 *
 * Canonical implementation of TTSProvider using local VieNeu-TTS v3 Turbo.
 */

import { TTSProvider, TTSRequest, TTSResult, VoiceMetadata } from './types';
import { VieNeuTtsEngine } from './VieNeuTtsEngine';
import { DEFAULT_VIENEU_VOICE } from './vieneuVoices';

export class VieNeuProvider implements TTSProvider {
  public readonly name = 'vieneu';
  private engine: VieNeuTtsEngine;

  constructor(engine?: VieNeuTtsEngine) {
    this.engine = engine || new VieNeuTtsEngine();
  }

  public getAvailableVoices(): string[] {
    return this.engine.getAvailableVoices();
  }

  public getVoices(): VoiceMetadata[] {
    return this.engine.getVoices();
  }

  public async synthesize(request: TTSRequest): Promise<TTSResult> {
    const res = await this.engine.synthesize({
      text: request.text,
      voice: request.voice || DEFAULT_VIENEU_VOICE,
      speed: request.speed ?? 1.0,
      sampleRate: request.sampleRate,
      outputPath: request.outputPath,
      offline: request.offline ?? true,
    });

    return {
      audioBuffer: res.audioBuffer,
      audioPath: res.audioPath || request.outputPath || '',
      outputPath: res.outputPath,
      durationSec: res.durationSec,
      durationSeconds: res.durationSeconds,
      durationMs: res.durationMs,
      sampleRate: res.sampleRate,
      channels: res.channels,
      bitDepth: res.bitDepth,
    };
  }
}
