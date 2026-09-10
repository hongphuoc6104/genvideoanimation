/**
 * packages/narration-kit/src/audio/voiceProfile.ts
 *
 * Canonical Voice Profile and Role-based Delivery specifications ported from
 * hongphuoc6104/Genvideo (scripts/build_narration.py & brand/audio-profile.json).
 *
 * Single source of truth for voice processing, role timing, and acoustic delivery gates.
 */

export type NarrativeRole =
  | 'hook'
  | 'thesis'
  | 'body'
  | 'turn'
  | 'evidence'
  | 'payoff'
  | 'close';

export interface RoleDefaults {
  speed: number;
  pauseAfter: number;
}

/**
 * Authoritative ROLE_DEFAULTS from Genvideo/scripts/build_narration.py
 */
export const ROLE_DEFAULTS: Record<NarrativeRole, RoleDefaults> = {
  hook:     { speed: 1.08, pauseAfter: 0.20 },
  thesis:   { speed: 1.08, pauseAfter: 0.18 },
  body:     { speed: 1.08, pauseAfter: 0.16 },
  turn:     { speed: 1.10, pauseAfter: 0.22 },
  evidence: { speed: 1.08, pauseAfter: 0.16 },
  payoff:   { speed: 1.08, pauseAfter: 0.24 },
  close:    { speed: 1.06, pauseAfter: 0.20 },
};

export interface VoiceChainEq {
  frequencyHz: number;
  gainDb: number;
  q: number;
}

export interface VoiceChainCompressor {
  thresholdDb: number;
  ratio: number;
  attackMs: number;
  releaseMs: number;
  makeupDb: number;
}

export interface VoiceChainConfig {
  highpassHz: number;
  eq: VoiceChainEq[];
  compressor: VoiceChainCompressor;
  limiterLinear: number;
}

export interface VoiceProfileDelivery {
  integratedLufsTarget: number;
  integratedLufsMin: number;
  integratedLufsMax: number;
  truePeakMaxDbtp: number;
  loudnessRangeLu: number;
}

export interface VoiceProfileSilence {
  internalPauseCapSec: number;
  interSentenceMaxSec: number;
  tailMaxSec: number;
  detectThresholdDb: number;
}

export interface VoiceProfileSynthesis {
  provider: 'VieNeu-TTS';
  mode: 'v3turbo';
  voice: 'Adam';
  backend: 'onnx';
  device: 'cpu';
  precision: 'fp32';
  temperature: number;
  silenceP: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  synthesis: VoiceProfileSynthesis;
  delivery: VoiceProfileDelivery;
  silence: VoiceProfileSilence;
  voiceChain: VoiceChainConfig;
}

/**
 * Authoritative GENVIDEO_ADAM_PROFILE matching Genvideo build_narration.py & audio-profile.json
 */
export const GENVIDEO_ADAM_PROFILE: VoiceProfile = {
  id: 'genvideo-adam',
  name: 'GENVIDEO_ADAM_PROFILE',
  synthesis: {
    provider: 'VieNeu-TTS',
    mode: 'v3turbo',
    voice: 'Adam',
    backend: 'onnx',
    device: 'cpu',
    precision: 'fp32',
    temperature: 0.65,
    silenceP: 0.05,
  },
  delivery: {
    integratedLufsTarget: -15.0,
    integratedLufsMin: -16.5,
    integratedLufsMax: -14.5,
    truePeakMaxDbtp: -1.8,
    loudnessRangeLu: 7,
  },
  silence: {
    internalPauseCapSec: 0.13,
    interSentenceMaxSec: 0.30,
    tailMaxSec: 0.80,
    detectThresholdDb: -40,
  },
  voiceChain: {
    highpassHz: 75,
    eq: [
      { frequencyHz: 130, q: 0.9, gainDb: 3.2 },
      { frequencyHz: 390, q: 1.1, gainDb: -2.5 },
      { frequencyHz: 2800, q: 1.2, gainDb: 1.8 },
      { frequencyHz: 6500, q: 1.6, gainDb: -2.0 },
    ],
    compressor: {
      thresholdDb: -24,
      ratio: 4,
      attackMs: 5,
      releaseMs: 80,
      makeupDb: 3.8,
    },
    limiterLinear: 0.92,
  },
};

/**
 * Builds ffmpeg GAP_CHAIN string.
 * Trims leading and trailing silence, caps internal silence at internalPauseCapSec.
 */
export function buildGapChainFilter(
  internalPauseCapSec: number = GENVIDEO_ADAM_PROFILE.silence.internalPauseCapSec
): string {
  return [
    'silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:detection=peak',
    'areverse',
    'silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:detection=peak',
    'areverse',
    `silenceremove=stop_periods=-1:stop_duration=${internalPauseCapSec}:stop_threshold=-45dB:detection=peak`,
  ].join(',');
}

/**
 * Builds ffmpeg atempo chain. Returns empty string when speed is unity (1.0).
 */
export function buildAtempoChain(speed: number): string {
  if (Math.abs(speed - 1.0) < 1e-6) {
    return '';
  }
  const stages: string[] = [];
  let remaining = speed;
  while (remaining > 2.0) {
    stages.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    stages.push('atempo=0.5');
    remaining /= 0.5;
  }
  stages.push(`atempo=${remaining.toFixed(6)}`);
  return stages.join(',');
}

/**
 * Builds ffmpeg VOICE_CHAIN string from VoiceChainConfig.
 */
export function buildVoiceChainFilter(
  chain: VoiceChainConfig = GENVIDEO_ADAM_PROFILE.voiceChain
): string {
  const parts: string[] = [
    `highpass=f=${chain.highpassHz}`,
    ...chain.eq.map((eq) => `equalizer=f=${eq.frequencyHz}:t=q:w=${eq.q}:g=${eq.gainDb}`),
    `acompressor=threshold=${chain.compressor.thresholdDb}dB:ratio=${chain.compressor.ratio}:attack=${chain.compressor.attackMs}:release=${chain.compressor.releaseMs}:makeup=${chain.compressor.makeupDb}`,
    `alimiter=limit=${chain.limiterLinear}:level=disabled`,
  ];
  return parts.join(',');
}
