/**
 * packages/narration-kit/src/tts/TTSProvider.ts
 * Canonical TTSProvider interface as required by V3 R2.
 */

export interface TTSRequest {
  text: string;
  voice: string;
  speed?: number;
  outputPath: string;
  offline?: boolean;
}

export interface TTSResult {
  audioPath: string;
  durationSeconds: number;
  sampleRate: number;
}

export interface TTSProvider {
  synthesize(request: TTSRequest): Promise<TTSResult>;
  getAvailableVoices(): string[];
}
