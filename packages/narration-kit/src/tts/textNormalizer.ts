/**
 * packages/narration-kit/src/tts/textNormalizer.ts
 * Deterministic text normalizer with bidirectional token mapping.
 * Handles numbers, acronyms, URLs, abbreviations, and scientific terms.
 */

export interface TokenMapping {
  id: string;
  original: string;
  normalized: string;
  spoken: string;
  startChar: number;
  endChar: number;
  isPunctuation?: boolean;
}

export interface NormalizationResult {
  originalText: string;
  normalizedText: string;
  spokenText: string;
  tokens: TokenMapping[];
}

const ONES: Record<number, string> = {
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
  5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
  10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen',
  15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen',
};

const TENS: Record<number, string> = {
  20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty',
  60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety',
};

export function numberToWords(n: number): string {
  if (isNaN(n)) return '';
  if (n < 0) return 'negative ' + numberToWords(-n);
  if (n in ONES) return ONES[n];
  if (n < 100) {
    const rem = n % 10;
    const ten = Math.floor(n / 10) * 10;
    return rem === 0 ? TENS[ten] : `${TENS[ten]}-${ONES[rem]}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    return rem === 0
      ? `${ONES[hundreds]} hundred`
      : `${ONES[hundreds]} hundred ${numberToWords(rem)}`;
  }
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rem = n % 1000;
    return rem === 0
      ? `${numberToWords(thousands)} thousand`
      : `${numberToWords(thousands)} thousand ${numberToWords(rem)}`;
  }
  if (n < 1_000_000_000) {
    const millions = Math.floor(n / 1_000_000);
    const rem = n % 1_000_000;
    return rem === 0
      ? `${numberToWords(millions)} million`
      : `${numberToWords(millions)} million ${numberToWords(rem)}`;
  }
  return n.toString();
}

const COMMON_ABBREVIATIONS: Record<string, string> = {
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
};

const COMMON_ACRONYMS: Record<string, string> = {
  'ai': 'A I',
  'dna': 'D N A',
  'rna': 'R N A',
  'gpu': 'G P U',
  'cpu': 'C P U',
  'tts': 'T T S',
  'api': 'A P I',
  'url': 'U R L',
  'fps': 'frames per second',
  'db': 'decibels',
  'lufs': 'L U F S',
  'wav': 'WAV',
  'mp4': 'M P 4',
  'mp3': 'M P 3',
  'pcm': 'P C M',
  'khz': 'kilohertz',
  'hz': 'hertz',
  'atp': 'A T P',
  'mit': 'M I T',
  'nasa': 'NASA',
};

export class TextNormalizer {
  public normalize(text: string): NormalizationResult {
    const tokens: TokenMapping[] = [];
    let tokenId = 1;

    // Regex matching: URLs, numbers with currency/percent, abbreviations, words, punctuation
    const tokenRegex = /(https?:\/\/[^\s]+)|(\$\d+(?:\.\d+)?)|(\d+(?:\.\d+)?%)|(\d+(?:\.\d+)?)|([A-Za-z]+\.[A-Za-z.]+)|([A-Za-z]+'?[A-Za-z]*)|([.,!?;:()[\]"“”'—–-])/g;

    let match: RegExpExecArray | null;
    const spokenParts: string[] = [];
    const normalizedParts: string[] = [];

    while ((match = tokenRegex.exec(text)) !== null) {
      const raw = match[0];
      const start = match.index;
      const end = start + raw.length;

      let normalized = raw;
      let spoken = raw;
      let isPunctuation = false;

      // 1. URLs
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        normalized = raw
          .replace('https://', 'h t t p s colon slash slash ')
          .replace('http://', 'h t t p colon slash slash ')
          .replace(/\./g, ' dot ')
          .replace(/\//g, ' slash ');
        spoken = normalized;
      }
      // 2. Currency: $100 -> one hundred dollars
      else if (raw.startsWith('$') && !isNaN(Number(raw.slice(1)))) {
        const val = Number(raw.slice(1));
        const words = numberToWords(val);
        normalized = `${words} dollar${val === 1 ? '' : 's'}`;
        spoken = normalized;
      }
      // 3. Percent: 50% -> fifty percent
      else if (raw.endsWith('%') && !isNaN(Number(raw.slice(0, -1)))) {
        const val = Number(raw.slice(0, -1));
        const words = numberToWords(val);
        normalized = `${words} percent`;
        spoken = normalized;
      }
      // 4. Pure numbers: 42 or 3.14
      else if (!isNaN(Number(raw))) {
        if (raw.includes('.')) {
          const [intPart, decPart] = raw.split('.');
          const intWords = numberToWords(Number(intPart));
          const decWords = decPart.split('').map((d) => ONES[Number(d)] || d).join(' ');
          normalized = `${intWords} point ${decWords}`;
        } else {
          const num = Number(raw);
          // Years like 1999, 2026
          if (num >= 1000 && num <= 2999 && num % 100 !== 0) {
            const firstTwo = Math.floor(num / 100);
            const lastTwo = num % 100;
            normalized = `${numberToWords(firstTwo)} ${numberToWords(lastTwo)}`;
          } else {
            normalized = numberToWords(num);
          }
        }
        spoken = normalized;
      }
      // 5. Abbreviations
      else if (COMMON_ABBREVIATIONS[raw.toLowerCase()]) {
        normalized = COMMON_ABBREVIATIONS[raw.toLowerCase()];
        spoken = normalized;
      }
      // 6. Acronyms
      else if (COMMON_ACRONYMS[raw.toLowerCase()]) {
        spoken = COMMON_ACRONYMS[raw.toLowerCase()];
        normalized = spoken;
      }
      // 7. Punctuation
      else if (/^[.,!?;:()[\]"“”'—–-]$/.test(raw)) {
        isPunctuation = true;
        // Punctuation is kept in normalized text for pause cues, but spoken text omits literal naming
        normalized = raw;
        spoken = '';
      }

      tokens.push({
        id: `tok-${String(tokenId++).padStart(3, '0')}`,
        original: raw,
        normalized,
        spoken: spoken || normalized,
        startChar: start,
        endChar: end,
        isPunctuation,
      });

      normalizedParts.push(normalized);
      if (spoken) {
        spokenParts.push(spoken);
      }
    }

    return {
      originalText: text,
      normalizedText: normalizedParts.join(' ').replace(/\s+([.,!?;:])/g, '$1'),
      spokenText: spokenParts.join(' '),
      tokens,
    };
  }
}
