/**
 * packages/narration-kit/src/normalization/rules.ts
 * Pronunciation and token expansion rules for acronyms, abbreviations, units, URLs, and Unicode.
 */

import { decimalToWords, integerToWords } from './numberNormalizer';

export const ACRONYM_EXPANSIONS: Record<string, string> = {
  AI: 'A I',
  TTS: 'T T S',
  URL: 'U R L',
  GPU: 'G P U',
  CPU: 'C P U',
  API: 'A P I',
  PCM: 'P C M',
  LUFS: 'L U F S',
  HTML: 'H T M L',
  CSS: 'C S S',
  UI: 'U I',
  UX: 'U X',
  DNA: 'D N A',
  RNA: 'R N A',
  RAM: 'R A M',
  ROM: 'R O M',
  HTTP: 'H T T P',
  HTTPS: 'H T T P S',
  SDK: 'S D K',
  CLI: 'C L I',
  AST: 'A S T',
  ASR: 'A S R',
  E2E: 'E two E',
  ONNX: 'O N N X',
  WAV: 'WAV',
  MP3: 'M P 3',
  MP4: 'M P 4',
  FPS: 'frames per second',
  DB: 'decibels',
  KHZ: 'kilohertz',
  HZ: 'hertz',
  MHZ: 'megahertz',
  GHZ: 'gigahertz',
  MIT: 'M I T',
  NASA: 'NASA',
};

export const COMMON_ABBREVIATIONS: Record<string, string> = {
  'dr.': 'Doctor',
  'mr.': 'Mister',
  'mrs.': 'Missus',
  'ms.': 'Ms',
  'prof.': 'Professor',
  'vs.': 'versus',
  'etc.': 'etcetera',
  'e.g.': 'for example',
  'i.e.': 'that is',
  'approx.': 'approximately',
  'dept.': 'department',
  'fig.': 'figure',
  'sec.': 'seconds',
  'min.': 'minutes',
  'no.': 'number',
  'vol.': 'volume',
};

export interface UnitDefinition {
  regexStr: string;
  expand: (num: string, unit: string) => { words: string; spokenWords: string[] };
}

export const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    // e.g. 24kHz, 44.1kHz, 16kHz
    regexStr: '([+-]?\\d+(?:\\.\\d+)?)(k?hz|mhz|ghz)',
    expand: (num, unit) => {
      const u = (unit || '').toLowerCase();
      const unitWord =
        u === 'khz' ? 'kilohertz' : u === 'mhz' ? 'megahertz' : u === 'ghz' ? 'gigahertz' : 'hertz';
      const numWords = num.includes('.') ? decimalToWords(num) : integerToWords(BigInt(num));
      return {
        words: `${numWords} ${unitWord}`,
        spokenWords: [...numWords.split(/\s+/), unitWord],
      };
    },
  },
  {
    // e.g. 60fps, 30fps, 120fps
    regexStr: '([+-]?\\d+(?:\\.\\d+)?)fps',
    expand: (num) => {
      const numWords = num.includes('.') ? decimalToWords(num) : integerToWords(BigInt(num));
      return {
        words: `${numWords} frames per second`,
        spokenWords: [...numWords.split(/\s+/), 'frames', 'per', 'second'],
      };
    },
  },
  {
    // e.g. 12dB, -3dB
    regexStr: '([+-]?\\d+(?:\\.\\d+)?)db',
    expand: (num) => {
      const numWords = num.includes('.') ? decimalToWords(num) : integerToWords(BigInt(num));
      return {
        words: `${numWords} decibels`,
        spokenWords: [...numWords.split(/\s+/), 'decibels'],
      };
    },
  },
  {
    // e.g. 100ms, 500ms
    regexStr: '([+-]?\\d+(?:\\.\\d+)?)ms',
    expand: (num) => {
      const numWords = num.includes('.') ? decimalToWords(num) : integerToWords(BigInt(num));
      return {
        words: `${numWords} milliseconds`,
        spokenWords: [...numWords.split(/\s+/), 'milliseconds'],
      };
    },
  },
  {
    // e.g. 1080p, 720p, 4k
    regexStr: '(\\d+)(p|k)',
    expand: (num, unit) => {
      const u = (unit || '').toLowerCase();
      if (u === 'p') {
        const numWords = num === '1080' ? 'ten eighty' : num === '720' ? 'seven twenty' : integerToWords(BigInt(num));
        return {
          words: `${numWords} p`,
          spokenWords: [...numWords.split(/\s+/), 'p'],
        };
      } else {
        const numWords = integerToWords(BigInt(num));
        return {
          words: `${numWords} k`,
          spokenWords: [...numWords.split(/\s+/), 'k'],
        };
      }
    },
  },
  {
    // e.g. 16-bit, 32-bit, 64-bit
    regexStr: '(\\d+)-bit',
    expand: (num) => {
      const numWords = integerToWords(BigInt(num));
      return {
        words: `${numWords} bit`,
        spokenWords: [...numWords.split(/\s+/), 'bit'],
      };
    },
  },
];

/**
 * Sanitizes Unicode smart punctuation, typographic quotes, em-dashes, and ellipsis into clean ASCII.
 */
export function sanitizeUnicode(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"') // Curly double quotes “ ” -> "
    .replace(/[\u2018\u2019]/g, "'") // Curly single quotes ‘ ’ -> '
    .replace(/\u2014/g, ', ') // Em-dash — -> , 
    .replace(/\u2013/g, ' - ') // En-dash – ->  - 
    .replace(/\u2026/g, '...') // Ellipsis … -> ...
    .replace(/\u00A0/g, ' '); // Non-breaking space -> regular space
}

/**
 * Normalizes a URL into spoken tokens.
 */
export function expandUrl(urlStr: string): { normalized: string; spokenWords: string[] } {
  let expanded = urlStr
    .replace(/^https:\/\//i, 'h t t p s colon slash slash ')
    .replace(/^http:\/\//i, 'h t t p colon slash slash ')
    .replace(/\./g, ' dot ')
    .replace(/\//g, ' slash ')
    .replace(/\?/g, ' question mark ')
    .replace(/=/g, ' equals ')
    .replace(/&/g, ' and ')
    .replace(/#/g, ' hash ')
    .replace(/-/g, ' dash ')
    .replace(/_/g, ' underscore ');

  expanded = expanded.replace(/\bv(\d+)\b/gi, (_, digit) => `v ${integerToWords(BigInt(digit))}`);
  expanded = expanded.replace(/\b(\d+)\b/g, (d) => integerToWords(BigInt(d)));

  const spoken = expanded.trim().split(/\s+/).filter(Boolean);
  return {
    normalized: spoken.join(' '),
    spokenWords: spoken,
  };
}
