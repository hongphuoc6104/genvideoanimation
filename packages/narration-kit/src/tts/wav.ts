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
 * Defaults to strict 24kHz mono 16-bit PCM WAV.
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
  header.writeUInt32LE(sampleRate, 24); // SampleRate (24000)
  header.writeUInt32LE(byteRate, 28); // ByteRate (48000)
  header.writeUInt16LE(blockAlign, 32); // BlockAlign (2)
  header.writeUInt16LE(bitDepth, 34); // BitsPerSample (16)

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
