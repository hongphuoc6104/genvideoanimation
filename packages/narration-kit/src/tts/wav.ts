import { Buffer } from 'node:buffer';

export interface WavFormatInfo {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  dataLength: number;
  durationSec: number;
}

/**
 * Encodes a canonical 44-byte RIFF/WAVE header for uncompressed PCM audio.
 * Supports arbitrary sample rates (including 48kHz native and 24kHz).
 */
export function encodeWavHeader(
  dataLength: number,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = Math.floor((sampleRate * channels * bitDepth) / 8);
  const blockAlign = Math.floor((channels * bitDepth) / 8);

  // RIFF Chunk descriptor
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataLength, 4); // ChunkSize = 36 + SubChunk2Size
  header.write('WAVE', 8, 'ascii');

  // fmt sub-chunk
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for standard PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(channels, 22); // NumChannels (1 = Mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitDepth, 34); // BitsPerSample

  // data sub-chunk
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return header;
}

/**
 * Creates a complete WAV file Buffer by prepending the 44-byte RIFF header to PCM bytes.
 */
export function createWavFile(
  pcmData: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16
): Buffer {
  const header = encodeWavHeader(pcmData.length, sampleRate, channels, bitDepth);
  return Buffer.concat([header, pcmData]);
}

/**
 * Parses and validates an existing WAV file Buffer.
 */
export function parseWavHeader(buffer: Buffer): WavFormatInfo {
  if (buffer.length < 44) {
    throw new Error(`Invalid WAV: Buffer length ${buffer.length} < minimum 44 bytes`);
  }
  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Invalid WAV: Missing RIFF or WAVE header signatures');
  }

  // Find 'fmt ' chunk
  let offset = 12;
  let formatFound = false;
  let audioFormat = 1;
  let channels = 1;
  let sampleRate = 24000;
  let bitDepth = 16;
  let dataLength = 0;
  let dataFound = false;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      formatFound = true;
      audioFormat = buffer.readUInt16LE(offset + 8);
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bitDepth = buffer.readUInt16LE(offset + 22);
      offset += 8 + chunkSize;
    } else if (chunkId === 'data') {
      dataFound = true;
      dataLength = chunkSize;
      offset += 8 + chunkSize;
      break;
    } else {
      // Skip other sub-chunks (e.g. LIST, JUNK)
      offset += 8 + chunkSize;
    }
  }

  if (!formatFound) {
    throw new Error('Invalid WAV: Missing "fmt " chunk');
  }
  if (!dataFound) {
    // If data chunk not encountered in walk, fallback to standard offset 36
    if (buffer.toString('ascii', 36, 40) === 'data') {
      dataLength = buffer.readUInt32LE(40);
    } else {
      dataLength = buffer.length - 44;
    }
  }

  if (audioFormat !== 1) {
    throw new Error(`Unsupported WAV format ${audioFormat}; expected 1 (uncompressed PCM)`);
  }

  const bytesPerSample = (bitDepth / 8) * channels;
  const durationSec = bytesPerSample > 0 ? dataLength / (sampleRate * bytesPerSample) : 0;

  return {
    sampleRate,
    channels,
    bitDepth,
    dataLength,
    durationSec,
  };
}

/**
 * Extracts raw uncompressed PCM bytes from a valid WAV file Buffer by stripping the RIFF headers.
 */
export function extractPcmData(wavBuffer: Buffer): Buffer {
  if (wavBuffer.length < 44) {
    throw new Error(`Invalid WAV buffer: length ${wavBuffer.length} < 44 bytes`);
  }
  let offset = 12;
  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const dataStart = offset + 8;
      const dataEnd = Math.min(wavBuffer.length, dataStart + chunkSize);
      return wavBuffer.subarray(dataStart, dataEnd);
    }
    offset += 8 + chunkSize;
  }
  return wavBuffer.subarray(44);
}

/**
 * Generates pure silence PCM buffer for a specified duration in milliseconds.
 * At 24kHz 16-bit mono: 48 bytes per millisecond.
 * At 48kHz 16-bit mono: 96 bytes per millisecond.
 */
export function generateSilencePcm(
  durationMs: number,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16
): Buffer {
  if (durationMs <= 0) return Buffer.alloc(0);
  const bytesPerMs = (sampleRate * channels * (bitDepth / 8)) / 1000;
  const numBytes = Math.round(durationMs * bytesPerMs);
  const blockAlign = channels * (bitDepth / 8);
  const alignedBytes = numBytes - (numBytes % blockAlign);
  return Buffer.alloc(alignedBytes, 0);
}

/**
 * Losslessly concatenates multiple mono PCM WAV buffers with optional silence gaps.
 * Auto-detects sample rate and channel configuration from the first buffer when not explicitly provided.
 * Strictly avoids intermediate lossy conversions (zero-intermediate-MP3 compliance).
 */
export function concatenateWavBuffers(
  wavBuffers: Buffer[],
  gapDurationMs = 0,
  sampleRate?: number,
  channels?: number,
  bitDepth?: number
): Buffer {
  if (!wavBuffers || wavBuffers.length === 0) {
    return createWavFile(Buffer.alloc(0), sampleRate ?? 24000, channels ?? 1, bitDepth ?? 16);
  }

  // Auto-detect audio format from first buffer if parameters not explicitly provided
  let effectiveSampleRate = sampleRate;
  let effectiveChannels = channels;
  let effectiveBitDepth = bitDepth;

  if (effectiveSampleRate === undefined || effectiveChannels === undefined || effectiveBitDepth === undefined) {
    try {
      const firstInfo = parseWavHeader(wavBuffers[0]);
      effectiveSampleRate = effectiveSampleRate ?? firstInfo.sampleRate;
      effectiveChannels = effectiveChannels ?? firstInfo.channels;
      effectiveBitDepth = effectiveBitDepth ?? firstInfo.bitDepth;
    } catch {
      effectiveSampleRate = effectiveSampleRate ?? 24000;
      effectiveChannels = effectiveChannels ?? 1;
      effectiveBitDepth = effectiveBitDepth ?? 16;
    }
  }

  const pcmChunks: Buffer[] = [];
  const silencePcm =
    gapDurationMs > 0
      ? generateSilencePcm(gapDurationMs, effectiveSampleRate, effectiveChannels, effectiveBitDepth)
      : Buffer.alloc(0);

  for (let i = 0; i < wavBuffers.length; i++) {
    const buf = wavBuffers[i];
    const pcm = extractPcmData(buf);
    pcmChunks.push(pcm);
    if (i < wavBuffers.length - 1 && silencePcm.length > 0) {
      pcmChunks.push(silencePcm);
    }
  }

  const totalPcm = Buffer.concat(pcmChunks);
  return createWavFile(totalPcm, effectiveSampleRate, effectiveChannels, effectiveBitDepth);
}
