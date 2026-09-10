/**
 * packages/narration-kit/src/audio/normalizeLoudness.ts
 * Pure TypeScript ITU-R BS.1770-4 K-weighting + EBU R128 gating + true-peak limiter.
 * Compliant with broadcast standards (-16 LUFS dialogue / -1.0 dBFS true-peak ceiling).
 */

import * as fs from 'node:fs';
import { parseWavHeader, extractPcmData, createWavFile } from '../tts/wav';
import { LoudnessStats, NormalizeOptions, NormalizeResult } from './types';

export { LoudnessStats, NormalizeOptions, NormalizeResult };

/**
 * Biquad filter state and coefficients for Direct Form II Transposed.
 */
interface BiquadFilter {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
  s1: number;
  s2: number;
}

/**
 * Creates Stage 1: High-shelf filter (acoustic head model simulation).
 * f0 = 1681.9744509555319 Hz, Gain = +3.9998438 dB, Q = 1/sqrt(2)
 */
function createHighShelfFilter(sampleRate: number): BiquadFilter {
  const f0 = 1681.9744509555319;
  const G = 3.9998438;
  const V0 = Math.pow(10, G / 20); // ~1.58489319246111
  const K = Math.tan((Math.PI * f0) / sampleRate);
  const sqrt2 = Math.SQRT2;
  const sqrt2V0 = Math.sqrt(2 * V0);

  const D = 1.0 + sqrt2 * K + K * K;
  const b0 = (V0 + sqrt2V0 * K + K * K) / D;
  const b1 = (2.0 * (K * K - V0)) / D;
  const b2 = (V0 - sqrt2V0 * K + K * K) / D;
  const a1 = (2.0 * (K * K - 1.0)) / D;
  const a2 = (1.0 - sqrt2 * K + K * K) / D;

  return { b0, b1, b2, a1, a2, s1: 0, s2: 0 };
}

/**
 * Creates Stage 2: High-pass filter (RLB weighting curve).
 * f0 = 38.13547087602444 Hz, Q = 0.5
 */
function createRlbHighPassFilter(sampleRate: number): BiquadFilter {
  const f0 = 38.13547087602444;
  const K = Math.tan((Math.PI * f0) / sampleRate);
  const D = 1.0 + 2.0 * K + K * K;

  const b0 = 1.0 / D;
  const b1 = -2.0 / D;
  const b2 = 1.0 / D;
  const a1 = (2.0 * (K * K - 1.0)) / D;
  const a2 = (1.0 - 2.0 * K + K * K) / D;

  return { b0, b1, b2, a1, a2, s1: 0, s2: 0 };
}

/**
 * Processes a sample through a biquad filter in Direct Form II Transposed.
 */
function processBiquad(f: BiquadFilter, x: number): number {
  const y = f.b0 * x + f.s1;
  f.s1 = f.b1 * x - f.a1 * y + f.s2;
  f.s2 = f.b2 * x - f.a2 * y;
  return y;
}

/**
 * Applies ITU-R BS.1770-4 K-weighting to multi-channel or mono audio.
 */
function applyKWeighting(
  samples: Float32Array,
  sampleRate: number,
  channels: number
): Float32Array[] {
  const totalFrames = Math.floor(samples.length / channels);
  const filteredChannels: Float32Array[] = [];

  for (let ch = 0; ch < channels; ch++) {
    const stage1 = createHighShelfFilter(sampleRate);
    const stage2 = createRlbHighPassFilter(sampleRate);
    const out = new Float32Array(totalFrames);

    for (let i = 0; i < totalFrames; i++) {
      const sample = samples[i * channels + ch];
      const y1 = processBiquad(stage1, sample);
      const y2 = processBiquad(stage2, y1);
      out[i] = y2;
    }
    filteredChannels.push(out);
  }

  return filteredChannels;
}

/**
 * 4x oversampled true-peak estimator using cubic Hermite / Catmull-Rom spline interpolation.
 */
function estimateTruePeak(samples: Float32Array): { truePeakLinear: number; peakLinear: number } {
  let peakLinear = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peakLinear) peakLinear = abs;
  }

  if (peakLinear === 0 || samples.length < 4) {
    return { truePeakLinear: peakLinear, peakLinear };
  }

  let truePeakLinear = peakLinear;
  const threshold = 0.7071 * peakLinear;

  for (let i = 1; i < samples.length - 2; i++) {
    const p1 = samples[i];
    if (Math.abs(p1) < threshold) continue;

    const p0 = samples[i - 1];
    const p2 = samples[i + 1];
    const p3 = samples[i + 2];

    // Evaluate sub-sample fractions t in [0.25, 0.5, 0.75]
    for (const t of [0.25, 0.5, 0.75]) {
      const t2 = t * t;
      const t3 = t2 * t;
      const v =
        0.5 *
        (2 * p1 +
          (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
          (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      const absV = Math.abs(v);
      if (absV > truePeakLinear) {
        truePeakLinear = absV;
      }
    }
  }

  return { truePeakLinear, peakLinear };
}

/**
 * Computes ITU-R BS.1770-4 / EBU R128 loudness statistics, true peak, and clipping count.
 */
export function computeLoudnessStats(
  pcmSamples: Float32Array,
  sampleRate: number = 24000,
  channels: number = 1
): LoudnessStats {
  if (pcmSamples.length === 0) {
    return {
      peakLinear: 0,
      peakDbfs: -100,
      truePeakLinear: 0,
      truePeakDbfs: -100,
      rmsLinear: 0,
      rmsDbfs: -100,
      estimatedLufs: -100,
      integratedLufs: -100,
      clippedSamples: 0,
    };
  }

  // 1. Peak, True Peak, and Digital Clipping
  const { truePeakLinear, peakLinear } = estimateTruePeak(pcmSamples);
  const peakDbfs = peakLinear > 0 ? 20 * Math.log10(peakLinear) : -100;
  const truePeakDbfs = truePeakLinear > 0 ? 20 * Math.log10(truePeakLinear) : -100;

  let clippedSamples = 0;
  let sumSq = 0;
  for (let i = 0; i < pcmSamples.length; i++) {
    const s = pcmSamples[i];
    sumSq += s * s;
    if (Math.abs(s) >= 0.9999) {
      clippedSamples++;
    }
  }

  const rmsLinear = Math.sqrt(sumSq / pcmSamples.length);
  const rmsDbfs = rmsLinear > 0 ? 20 * Math.log10(rmsLinear) : -100;

  // 2. K-Weighting & EBU R128 Gating
  const filteredChannels = applyKWeighting(pcmSamples, sampleRate, channels);
  const totalFrames = filteredChannels[0].length;
  const channelWeights = channels === 2 ? [1.0, 1.0] : [1.0];

  // Block analysis: 400ms window, 100ms step (75% overlap)
  const windowSize = Math.max(1, Math.round(0.4 * sampleRate));
  const stepSize = Math.max(1, Math.round(0.1 * sampleRate));

  let integratedLufs = -100;

  if (totalFrames < windowSize) {
    // For short segments (< 400ms), calculate ungated K-weighted power
    let sumZ = 0;
    for (let ch = 0; ch < channels; ch++) {
      const chData = filteredChannels[ch];
      let chSum = 0;
      for (let i = 0; i < totalFrames; i++) {
        chSum += chData[i] * chData[i];
      }
      sumZ += channelWeights[ch] * (chSum / totalFrames);
    }
    integratedLufs = sumZ > 0 ? -0.691 + 10 * Math.log10(sumZ) : -100;
  } else {
    // Standard EBU R128 two-stage gating
    const blockPowers: number[] = [];
    const blockLoudness: number[] = [];

    for (let start = 0; start + windowSize <= totalFrames; start += stepSize) {
      let blockPower = 0;
      for (let ch = 0; ch < channels; ch++) {
        const chData = filteredChannels[ch];
        let chSum = 0;
        for (let i = start; i < start + windowSize; i++) {
          chSum += chData[i] * chData[i];
        }
        blockPower += channelWeights[ch] * (chSum / windowSize);
      }

      blockPowers.push(blockPower);
      const l = blockPower > 0 ? -0.691 + 10 * Math.log10(blockPower) : -100;
      blockLoudness.push(l);
    }

    // Stage 1: Absolute threshold (-70 LUFS)
    const absoluteGateLufs = -70.0;
    let sumPowerAbs = 0;
    let countAbs = 0;

    for (let j = 0; j < blockLoudness.length; j++) {
      if (blockLoudness[j] > absoluteGateLufs) {
        sumPowerAbs += blockPowers[j];
        countAbs++;
      }
    }

    if (countAbs === 0) {
      integratedLufs = -100;
    } else {
      const meanPowerAbs = sumPowerAbs / countAbs;
      const unGatedLufs = -0.691 + 10 * Math.log10(meanPowerAbs);

      // Stage 2: Relative threshold (Gamma_r = L_abs - 10.0 LU)
      const relativeGateLufs = unGatedLufs - 10.0;
      let sumPowerRel = 0;
      let countRel = 0;

      for (let j = 0; j < blockLoudness.length; j++) {
        if (blockLoudness[j] > absoluteGateLufs && blockLoudness[j] > relativeGateLufs) {
          sumPowerRel += blockPowers[j];
          countRel++;
        }
      }

      if (countRel === 0) {
        integratedLufs = unGatedLufs;
      } else {
        const meanPowerRel = sumPowerRel / countRel;
        integratedLufs = -0.691 + 10 * Math.log10(meanPowerRel);
      }
    }
  }

  const roundedPeakDbfs = Math.round(peakDbfs * 10) / 10;
  const roundedTruePeakDbfs = Math.round(truePeakDbfs * 10) / 10;
  const roundedRmsDbfs = Math.round(rmsDbfs * 10) / 10;
  const roundedIntegratedLufs = Math.round(integratedLufs * 10) / 10;

  return {
    peakLinear,
    peakDbfs: roundedPeakDbfs,
    truePeakLinear,
    truePeakDbfs: roundedTruePeakDbfs,
    rmsLinear,
    rmsDbfs: roundedRmsDbfs,
    estimatedLufs: roundedIntegratedLufs,
    integratedLufs: roundedIntegratedLufs,
    clippedSamples,
  };
}

/**
 * Normalizes Float32 PCM samples to target LUFS while capping true peak <= maxPeakDbfs.
 * Guarantees zero digital clipping (clippedSamples === 0).
 */
export function normalizePcmLoudness(
  samples: Float32Array,
  optionsOrTargetLufs: NormalizeOptions | number = -16.0,
  legacyMaxPeakDbfs: number = -1.0
): NormalizeResult {
  const options: NormalizeOptions =
    typeof optionsOrTargetLufs === 'number'
      ? { targetLufs: optionsOrTargetLufs, maxPeakDbfs: legacyMaxPeakDbfs }
      : optionsOrTargetLufs;

  const targetLufs = options.targetLufs ?? -16.0;
  const maxPeakDbfs = options.maxPeakDbfs ?? -1.0;
  const sampleRate = options.sampleRate ?? 24000;
  const channels = options.channels ?? 1;

  const initialStats = computeLoudnessStats(samples, sampleRate, channels);
  if (initialStats.rmsLinear === 0 || initialStats.integratedLufs <= -70.0) {
    const unaltered = new Float32Array(samples);
    return {
      normalized: unaltered,
      gainApplied: 1.0,
      gainAppliedLinear: 1.0,
      gainAppliedDb: 0.0,
      limited: false,
      stats: initialStats,
      initialStats,
      finalStats: initialStats,
    };
  }

  // 1. Calculate target linear gain
  const targetGainLinear = Math.pow(10, (targetLufs - initialStats.integratedLufs) / 20);

  // 2. Ceiling check: true peak limit
  const maxLinearPeak = Math.pow(10, maxPeakDbfs / 20); // e.g. 10^(-1.0/20) ~ 0.8912509
  let maxAllowedGain = Infinity;
  if (initialStats.truePeakLinear > 0) {
    maxAllowedGain = maxLinearPeak / initialStats.truePeakLinear;
  }

  const limited = targetGainLinear > maxAllowedGain;
  const gainAppliedLinear = Math.min(targetGainLinear, maxAllowedGain);
  const gainAppliedDb = Math.round(20 * Math.log10(gainAppliedLinear) * 100) / 100;

  // 3. Scale and clamp samples strictly to ceiling [-maxLinearPeak, +maxLinearPeak]
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i] * gainAppliedLinear;
    out[i] = Math.max(-maxLinearPeak, Math.min(maxLinearPeak, s));
  }

  const finalStats = computeLoudnessStats(out, sampleRate, channels);

  return {
    normalized: out,
    gainApplied: Math.round(gainAppliedLinear * 1000) / 1000,
    gainAppliedLinear,
    gainAppliedDb,
    limited,
    stats: finalStats,
    initialStats,
    finalStats,
  };
}

/**
 * Normalizes a WAV buffer to target LUFS and maximum true-peak dBFS.
 */
export function normalizeWavBuffer(
  wavBuffer: Buffer,
  optionsOrTargetLufs: NormalizeOptions | number = -16.0,
  legacyMaxPeakDbfs: number = -1.0
): { buffer: Buffer; stats: LoudnessStats; gainApplied: number } {
  const options: NormalizeOptions =
    typeof optionsOrTargetLufs === 'number'
      ? { targetLufs: optionsOrTargetLufs, maxPeakDbfs: legacyMaxPeakDbfs }
      : optionsOrTargetLufs;

  const header = parseWavHeader(wavBuffer);
  const pcmBytes = extractPcmData(wavBuffer);

  // Interpret PCM16
  const numSamples = Math.floor(pcmBytes.length / 2);
  const pcm16 = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, numSamples);
  const f32 = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    f32[i] = pcm16[i] / 32768.0;
  }

  const normOptions: NormalizeOptions = {
    ...options,
    sampleRate: options.sampleRate ?? header.sampleRate,
    channels: options.channels ?? header.channels,
  };

  const res = normalizePcmLoudness(f32, normOptions);

  // Convert back to PCM16
  const outPcm16 = new Int16Array(res.normalized.length);
  for (let i = 0; i < res.normalized.length; i++) {
    const s = Math.max(-1.0, Math.min(1.0, res.normalized[i]));
    outPcm16[i] = Math.round(s * 32767);
  }

  const outBuffer = createWavFile(
    Buffer.from(outPcm16.buffer, outPcm16.byteOffset, outPcm16.byteLength),
    header.sampleRate,
    header.channels,
    header.bitDepth
  );

  return {
    buffer: outBuffer,
    stats: res.finalStats,
    gainApplied: res.gainApplied,
  };
}

/**
 * Normalizes a WAV file on disk to target LUFS and writes the result.
 */
export function normalizeWavFile(
  inputWavPath: string,
  outputWavPath: string,
  optionsOrTargetLufs: NormalizeOptions | number = -16.0,
  legacyMaxPeakDbfs: number = -1.0
): LoudnessStats {
  const buf = fs.readFileSync(inputWavPath);
  const { buffer, stats } = normalizeWavBuffer(buf, optionsOrTargetLufs, legacyMaxPeakDbfs);
  fs.writeFileSync(outputWavPath, buffer);
  return stats;
}
