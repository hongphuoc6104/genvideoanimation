/**
 * tests/e2e/harness/fixtures.ts
 * Canonical Test Fixtures & Generators for V3 Narration & Karaoke Testing
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export const TEXT_FIXTURES = {
  SHORT: 'In 2026, AI models run at 24kHz locally.',
  
  TECHNICAL: 'In 2026, the Kokoro-82M model at https://huggingface.co/hexgrad/Kokoro-82M delivers 24kHz mono PCM WAV audio with $0.00 cloud API cost.',
  
  NUMBERS_AND_SYMBOLS: 'On 12/05/2026, exactly 3,450 users downloaded 99.8% of the data, saving $1,250.50 (+15.4% YoY).',
  
  EXPRESSIVE: 'Wait! Did you hear that? "Yes," whispered Dr. Watson: "It is 100% offline!"',
  
  EMPTY: '',
  WHITESPACE_ONLY: '   \n\t  \r\n   ',
  SINGLE_WORD: 'Remotion',
};

export const SHOTSPEC_FIXTURES = {
  DEFAULT_EDUCATIONAL: {
    shot_id: 'shot_01',
    duration_frames: 150,
    fps: 30,
    viewport: { width: 1920, height: 1080 },
    safe_margin: 96,
    narration_profile: 'educational',
    emphasis_words: ['models', 'locally'],
    pause_after: 0.6,
    caption_position: 'bottom',
  },
  
  WITH_SUBJECT_BOTTOM: {
    shot_id: 'shot_02',
    duration_frames: 180,
    fps: 30,
    viewport: { width: 1920, height: 1080 },
    safe_margin: 96,
    subject_region: { x: 500, y: 750, width: 920, height: 280 }, // Collides with bottom caption
    caption_position: 'auto',
  },

  VERTICAL_SHORT: {
    shot_id: 'shot_vertical_01',
    duration_frames: 120,
    fps: 30,
    viewport: { width: 1080, height: 1920 },
    safe_margin: 96,
    caption_position: 'bottom',
  },
};

/**
 * Generates a valid 16-bit PCM Mono RIFF WAV Buffer in memory
 */
export function createMockWavBuffer(options: {
  sampleRate?: number;
  channels?: number;
  durationSec?: number;
  frequencyHz?: number;
  amplitude?: number;
} = {}): Buffer {
  const sampleRate = options.sampleRate || 24000;
  const channels = options.channels || 1;
  const durationSec = options.durationSec || 1.0;
  const frequencyHz = options.frequencyHz || 440;
  const amplitude = options.amplitude !== undefined ? options.amplitude : 0.5;

  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = channels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const totalSize = 44 + dataSize;

  const buffer = Buffer.alloc(totalSize);

  // RIFF Header
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(totalSize - 8, 4);
  buffer.write('WAVE', 8, 'ascii');

  // fmt chunk
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);             // fmt chunk length (16 for PCM)
  buffer.writeUInt16LE(1, 20);              // PCM format = 1
  buffer.writeUInt16LE(channels, 22);       // mono = 1, stereo = 2
  buffer.writeUInt32LE(sampleRate, 24);     // sample rate
  buffer.writeUInt32LE(byteRate, 28);       // byte rate
  buffer.writeUInt16LE(blockAlign, 32);     // block align
  buffer.writeUInt16LE(16, 34);             // 16 bits per sample

  // data chunk
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude;
    const int16Val = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
    for (let c = 0; c < channels; c++) {
      buffer.writeInt16LE(int16Val, offset);
      offset += 2;
    }
  }

  return buffer;
}

export const MOCK_NARRATION_TEXT_MAP = {
  version: '1.0.0',
  originalText: 'In 2026, AI models run at 24kHz locally.',
  normalizedText: 'In twenty twenty-six, A I models run at twenty-four kilohertz locally.',
  tokens: [
    { id: 't0', originalSpan: [0, 2], originalWord: 'In', spokenWords: ['In'], type: 'plain' },
    { id: 't1', originalSpan: [3, 7], originalWord: '2026', spokenWords: ['twenty', 'twenty-six'], type: 'cardinal' },
    { id: 't2', originalSpan: [9, 11], originalWord: 'AI', spokenWords: ['A', 'I'], type: 'acronym' },
    { id: 't3', originalSpan: [12, 18], originalWord: 'models', spokenWords: ['models'], type: 'plain' },
    { id: 't4', originalSpan: [19, 22], originalWord: 'run', spokenWords: ['run'], type: 'plain' },
    { id: 't5', originalSpan: [23, 25], originalWord: 'at', spokenWords: ['at'], type: 'plain' },
    { id: 't6', originalSpan: [26, 31], originalWord: '24kHz', spokenWords: ['twenty-four', 'kilohertz'], type: 'unit' },
    { id: 't7', originalSpan: [32, 39], originalWord: 'locally', spokenWords: ['locally'], type: 'plain' },
  ],
};

export const MOCK_WORDS_JSON = [
  { id: 'w0', word: 'In', cleanWord: 'in', start: 0.06, end: 0.22, confidence: 0.94, punctuation: '' },
  { id: 'w1', word: 'twenty', cleanWord: 'twenty', start: 0.24, end: 0.58, confidence: 0.91, punctuation: '' },
  { id: 'w2', word: 'twenty-six,', cleanWord: 'twenty-six', start: 0.60, end: 1.12, confidence: 0.89, punctuation: ',' },
  { id: 'w3', word: 'A', cleanWord: 'a', start: 1.22, end: 1.35, confidence: 0.96, punctuation: '' },
  { id: 'w4', word: 'I', cleanWord: 'i', start: 1.36, end: 1.55, confidence: 0.95, punctuation: '' },
  { id: 'w5', word: 'models', cleanWord: 'models', start: 1.58, end: 1.98, confidence: 0.92, punctuation: '' },
  { id: 'w6', word: 'run', cleanWord: 'run', start: 2.02, end: 2.25, confidence: 0.90, punctuation: '' },
  { id: 'w7', word: 'at', cleanWord: 'at', start: 2.28, end: 2.42, confidence: 0.93, punctuation: '' },
  { id: 'w8', word: 'twenty-four', cleanWord: 'twenty-four', start: 2.45, end: 2.92, confidence: 0.88, punctuation: '' },
  { id: 'w9', word: 'kilohertz', cleanWord: 'kilohertz', start: 2.95, end: 3.42, confidence: 0.87, punctuation: '' },
  { id: 'w10', word: 'locally.', cleanWord: 'locally', start: 3.46, end: 3.98, confidence: 0.95, punctuation: '.' },
];

export const MOCK_CAPTIONS_JSON = {
  version: '1.0.0',
  fps: 30,
  groups: [
    {
      id: 'g0',
      startFrame: 2,
      endFrame: 40,
      startTime: 0.06,
      endTime: 1.35,
      position: 'bottom',
      box: { x: 192, y: 864, width: 1536, height: 120 },
      lines: [
        {
          text: 'In twenty twenty-six,',
          words: [
            { id: 'w0', word: 'In', start: 0.06, end: 0.22, startFrame: 2, endFrame: 7 },
            { id: 'w1', word: 'twenty', start: 0.24, end: 0.58, startFrame: 7, endFrame: 17 },
            { id: 'w2', word: 'twenty-six,', start: 0.60, end: 1.12, startFrame: 18, endFrame: 34 },
          ],
        },
      ],
    },
    {
      id: 'g1',
      startFrame: 41,
      endFrame: 120,
      startTime: 1.36,
      endTime: 4.00,
      position: 'bottom',
      box: { x: 192, y: 864, width: 1536, height: 120 },
      lines: [
        {
          text: 'A I models run',
          words: [
            { id: 'w3', word: 'A', start: 1.22, end: 1.35, startFrame: 37, endFrame: 41 },
            { id: 'w4', word: 'I', start: 1.36, end: 1.55, startFrame: 41, endFrame: 47 },
            { id: 'w5', word: 'models', start: 1.58, end: 1.98, startFrame: 47, endFrame: 59 },
            { id: 'w6', word: 'run', start: 2.02, end: 2.25, startFrame: 61, endFrame: 68 },
          ],
        },
        {
          text: 'at twenty-four kilohertz locally.',
          words: [
            { id: 'w7', word: 'at', start: 2.28, end: 2.42, startFrame: 68, endFrame: 73 },
            { id: 'w8', word: 'twenty-four', start: 2.45, end: 2.92, startFrame: 74, endFrame: 88 },
            { id: 'w9', word: 'kilohertz', start: 2.95, end: 3.42, startFrame: 89, endFrame: 103 },
            { id: 'w10', word: 'locally.', start: 3.46, end: 3.98, startFrame: 104, endFrame: 120 },
          ],
        },
      ],
    },
  ],
};

export const MOCK_AUDIO_MANIFEST_JSON = {
  version: '1.0.0',
  tracks: {
    narration: { file: 'narration.wav', duration: 4.1, sampleRate: 24000, channels: 1 },
    music: { file: 'music.wav', duration: 4.1, volume: 0.22, duckedVolume: 0.05 },
    sfx: [{ id: 'sfx_pop_01', file: 'pop.wav', frame: 45, timeSec: 1.5, volume: 0.8 }],
  },
  ducking: {
    attackMs: 100,
    releaseMs: 600,
    attenuationDb: -12.8,
  },
  output: {
    file: 'mixed-soundtrack.wav',
    sampleRate: 48000,
    channels: 2,
    bitDepth: 16,
    durationSec: 4.1,
    truePeakDbfs: -1.2,
    lufs: -16.1,
    clippedSamples: 0,
  },
};

export const MOCK_CUE_MANIFEST_JSON = {
  compositionId: 'v3_composition',
  fps: 30,
  durationInFrames: 150,
  cues: [
    {
      id: 'cue_sent_start_0',
      frame: 2,
      timeSec: 0.067,
      category: 'narrative',
      type: 'SENTENCE_START',
      label: 'Sentence 1 Start',
      description: 'In twenty twenty-six, A I models run at twenty-four kilohertz locally.',
    },
    {
      id: 'cue_emp_0',
      frame: 47,
      timeSec: 1.58,
      category: 'action',
      type: 'WORD_EMPHASIS',
      label: 'Emphasis: models',
      description: 'Word emphasis on models',
    },
    {
      id: 'cue_emp_1',
      frame: 104,
      timeSec: 3.46,
      category: 'action',
      type: 'WORD_EMPHASIS',
      label: 'Emphasis: locally',
      description: 'Word emphasis on locally',
    },
    {
      id: 'cue_sent_end_0',
      frame: 120,
      timeSec: 4.0,
      category: 'narrative',
      type: 'SENTENCE_END',
      label: 'Sentence 1 End',
      description: 'End of sentence',
    },
  ],
};

export const FIXTURES = {
  TEXT: TEXT_FIXTURES,
  SHOTSPEC: SHOTSPEC_FIXTURES,
  TEXT_MAP: MOCK_NARRATION_TEXT_MAP,
  WORDS: MOCK_WORDS_JSON,
  CAPTIONS: MOCK_CAPTIONS_JSON,
  AUDIO_MANIFEST: MOCK_AUDIO_MANIFEST_JSON,
  CUE_MANIFEST: MOCK_CUE_MANIFEST_JSON,
  createMockWavBuffer,
};

