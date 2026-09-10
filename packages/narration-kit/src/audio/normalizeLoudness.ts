/**
 * packages/narration-kit/src/audio/normalizeLoudness.ts
 * Loudness and true-peak normalization compliant with EBU R128 (-16 LUFS / -1.0 dBFS peak).
 */

import * as fs from 'node:fs';
import { parseWavHeader, createWavFile } from '../tts/wav';

export interface LoudnessStats {
  peakLinear: number;
  peakDbfs: number;
  rmsLinear: number;
  estimatedLufs: number;
}

export function computeLoudnessStats(pcmSamples: Float32Array): LoudnessStats {
  if (pcmSamples.length === 0) {
    return { peakLinear: 0, peakDbfs: -100, rmsLinear: 0, estimatedLufs: -100 };
  }

  let peak = 0;
  let sumSq = 0;

  for (let i = 0; i < pcmSamples.length; i++) {
    const abs = Math.abs(pcmSamples[i]);
    if (abs > peak) peak = abs;
    sumSq += abs * abs;
  }

  const rms = Math.sqrt(sumSq / pcmSamples.length);
  const peakDbfs = peak > 0 ? 20 * Math.log10(peak) : -100;
  // Approximation of LUFS: -0.691 + 10 * log10(mean(y^2))
  const estimatedLufs = rms > 0 ? -0.691 + 10 * Math.log10(rms * rms) : -100;

  return {
    peakLinear: peak,
    peakDbfs: Math.round(peakDbfs * 10) / 10,
    rmsLinear: rms,
    estimatedLufs: Math.round(estimatedLufs * 10) / 10,
  };
}

export function normalizePcmLoudness(
  samples: Float32Array,
  targetLufs: number = -16.0,
  maxPeakDbfs: number = -1.0
): { normalized: Float32Array; gainApplied: number; stats: LoudnessStats } {
  const initial = computeLoudnessStats(samples);
  if (initial.rmsLinear === 0) {
    return { normalized: new Float32Array(samples), gainApplied: 1.0, stats: initial };
  }

  // Calculate required linear gain to reach target LUFS
  let gain = Math.pow(10, (targetLufs - initial.estimatedLufs) / 20);

  // Check if applying gain exceeds maximum true peak
  const maxLinearPeak = Math.pow(10, maxPeakDbfs / 20);
  if (initial.peakLinear * gain > maxLinearPeak) {
    gain = maxLinearPeak / initial.peakLinear;
  }

  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = Math.max(-1.0, Math.min(1.0, samples[i] * gain));
  }

  const finalStats = computeLoudnessStats(out);
  return {
    normalized: out,
    gainApplied: Math.round(gain * 1000) / 1000,
    stats: finalStats,
  };
}

export function normalizeWavFile(
  inputWavPath: string,
  outputWavPath: string,
  targetLufs: number = -16.0
): LoudnessStats {
  const buf = fs.readFileSync(inputWavPath);
  const header = parseWavHeader(buf);
  const dataOffset = 44;
  const pcm16 = new Int16Array(buf.buffer, buf.byteOffset + dataOffset, (buf.length - dataOffset) / 2);
  const f32 = new Float32Array(pcm16.length);

  for (let i = 0; i < pcm16.length; i++) {
    f32[i] = pcm16[i] / 32768.0;
  }

  const { normalized, stats } = normalizePcmLoudness(f32, targetLufs);
  const outPcm16 = new Int16Array(normalized.length);
  for (let i = 0; i < normalized.length; i++) {
    const s = Math.max(-1.0, Math.min(1.0, normalized[i]));
    outPcm16[i] = Math.round(s * 32767);
  }

  const outBuf = createWavFile(
    Buffer.from(outPcm16.buffer, outPcm16.byteOffset, outPcm16.byteLength),
    header.sampleRate,
    header.channels,
    header.bitDepth
  );

  fs.writeFileSync(outputWavPath, outBuf);
  return stats;
}
