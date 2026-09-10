/**
 * packages/narration-kit/src/tts/vieneuVoices.ts
 *
 * VieNeu-TTS v3 Turbo Voice Presets, Metadata, and Deterministic Alias Registry.
 */

import { VoiceMetadata } from './types';

export const VIENEU_PRIMARY_VOICES = [
  'Adam',
  'Minh Đức',
  'Minh Quân',
  'Mai Phương',
] as const;

export const VIENEU_SUPPORTED_VOICES: readonly string[] = [
  'Adam',
  'Minh Đức',
  'Minh Quân',
  'Mai Phương',
  'Minh Triết',
  'Mai Anh',
  'Trúc Ly',
  'Phạm Tuyên',
  'Thái Sơn',
  'Xuân Vĩnh',
  'Thanh Bình',
  'Ngọc Linh',
  'Đoan Trang',
  'Thùy Dung',
  'Quang Sơn',
  'Ngọc Trân',
  'Mỹ Duyên',
  'Quỳnh Anh',
  'Đức Trí',
  'Kim Thanh',
  'Ngọc Huyền',
] as const;

export const DEFAULT_VIENEU_VOICE = 'Adam';

/**
 * Deterministic Voice Aliasing:
 * Resolves user-facing or slugged names to VieNeu-TTS v3 Turbo speaker embeddings.
 */
export const VIENEU_VOICE_ALIASES: Record<string, string> = {
  // Minh Quân -> Minh Triết (Southern news male)
  'Minh Quân': 'Minh Triết',
  'minh_quan': 'Minh Triết',
  'minh-quan': 'Minh Triết',
  'minh quan': 'Minh Triết',
  'minh quân': 'Minh Triết',
  // Mai Phương -> Mai Anh (Northern news female)
  'Mai Phương': 'Mai Anh',
  'mai_phuong': 'Mai Anh',
  'mai-phuong': 'Mai Anh',
  'mai phuong': 'Mai Anh',
  'mai phương': 'Mai Anh',
  // Direct lowercase aliases
  'adam': 'Adam',
  'minh_duc': 'Minh Đức',
  'minh-duc': 'Minh Đức',
  'minh duc': 'Minh Đức',
  'minh đức': 'Minh Đức',
  'minh_triet': 'Minh Triết',
  'minh-triet': 'Minh Triết',
  'minh triet': 'Minh Triết',
  'minh triết': 'Minh Triết',
  'mai_anh': 'Mai Anh',
  'mai-anh': 'Mai Anh',
  'mai anh': 'Mai Anh',
  'truc_ly': 'Trúc Ly',
  'truc ly': 'Trúc Ly',
  'trúc ly': 'Trúc Ly',
  'pham_tuyen': 'Phạm Tuyên',
  'pham tuyen': 'Phạm Tuyên',
  'phạm tuyên': 'Phạm Tuyên',
};

export const VIENEU_VOICE_METADATA: Record<string, VoiceMetadata> = {
  Adam: {
    id: 'Adam',
    name: 'Adam',
    gender: 'male',
    description: 'Nam · Nam · Giọng đọc tự nhiên, ấm áp, nhịp điệu mượt mà (Default V3.1)',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'South',
    style: 'natural',
  },
  'Minh Đức': {
    id: 'Minh Đức',
    name: 'Minh Đức',
    gender: 'male',
    description: 'Nam · Bắc · Phong cách tin tức chuẩn mực, phát âm rõ ràng, học thuật',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'North',
    style: 'news',
  },
  'Minh Quân': {
    id: 'Minh Quân',
    name: 'Minh Quân (alias: Minh Triết)',
    gender: 'male',
    description: 'Nam · Nam · Phong cách tin tức, đĩnh đạc, phát âm thuật ngữ tiếng Anh chuẩn xác',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'South',
    style: 'news',
  },
  'Mai Phương': {
    id: 'Mai Phương',
    name: 'Mai Phương (alias: Mai Anh)',
    gender: 'female',
    description: 'Nữ · Bắc · Phong cách tin tức thanh lịch, diễn cảm, rõ ràng',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'North',
    style: 'news',
  },
  'Minh Triết': {
    id: 'Minh Triết',
    name: 'Minh Triết',
    gender: 'male',
    description: 'Nam · Nam · Phong cách tin tức đĩnh đạc, khúc chiết',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'South',
    style: 'news',
  },
  'Mai Anh': {
    id: 'Mai Anh',
    name: 'Mai Anh',
    gender: 'female',
    description: 'Nữ · Bắc · Phát thanh viên tin tức chuyên nghiệp',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'North',
    style: 'news',
  },
  'Trúc Ly': {
    id: 'Trúc Ly',
    name: 'Trúc Ly',
    gender: 'female',
    description: 'Nữ · Bắc · Giọng đọc trò chuyện, giải thích sinh động',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'North',
    style: 'natural',
  },
  'Phạm Tuyên': {
    id: 'Phạm Tuyên',
    name: 'Phạm Tuyên',
    gender: 'male',
    description: 'Nam · Bắc · Giọng đọc phóng sự, truyền cảm',
    language: 'vi-VN',
    provider: 'vieneu',
    sampleRate: 48000,
    accent: 'North',
    style: 'documentary',
  },
};

export function resolveVieNeuVoice(voiceInput?: string): string {
  if (!voiceInput || voiceInput.trim().length === 0) {
    return DEFAULT_VIENEU_VOICE;
  }
  const trimmed = voiceInput.trim();
  if (VIENEU_VOICE_ALIASES[trimmed]) {
    return VIENEU_VOICE_ALIASES[trimmed];
  }
  const lower = trimmed.toLowerCase();
  if (VIENEU_VOICE_ALIASES[lower]) {
    return VIENEU_VOICE_ALIASES[lower];
  }
  // Check direct preset matches
  for (const v of VIENEU_SUPPORTED_VOICES) {
    if (v.toLowerCase() === lower) {
      return v;
    }
  }
  return trimmed;
}

export function isVieNeuVoice(voiceInput: string): boolean {
  if (!voiceInput) return false;
  const trimmed = voiceInput.trim();
  if (VIENEU_VOICE_ALIASES[trimmed] || VIENEU_VOICE_ALIASES[trimmed.toLowerCase()]) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  return VIENEU_SUPPORTED_VOICES.some((v) => v.toLowerCase() === lower);
}
