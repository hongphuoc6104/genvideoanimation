/**
 * packages/narration-kit/src/normalization/numberNormalizer.ts
 * Robust number, ordinal, decimal, year, currency, and date normalization.
 * Handles numbers up to trillions with comma parsing and proper sign handling.
 */

const ONES: Record<number, string> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
};

const TENS: Record<number, string> = {
  20: 'twenty',
  30: 'thirty',
  40: 'forty',
  50: 'fifty',
  60: 'sixty',
  70: 'seventy',
  80: 'eighty',
  90: 'ninety',
};

const ORDINALS_UNDER_20: Record<number, string> = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'eighth',
  9: 'ninth',
  10: 'tenth',
  11: 'eleventh',
  12: 'twelfth',
  13: 'thirteenth',
  14: 'fourteenth',
  15: 'fifteenth',
  16: 'sixteenth',
  17: 'seventeenth',
  18: 'eighteenth',
  19: 'nineteenth',
};

const ORDINAL_TENS: Record<number, string> = {
  20: 'twentieth',
  30: 'thirtieth',
  40: 'fortieth',
  50: 'fiftieth',
  60: 'sixtieth',
  70: 'seventieth',
  80: 'eightieth',
  90: 'ninetieth',
};

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Converts integer to English words, supporting numbers up to 999,999,999,999,999 (quadrillions).
 */
export function integerToWords(num: bigint | number): string {
  let n = typeof num === 'number' ? BigInt(Math.trunc(num)) : num;

  if (n === 0n) return 'zero';
  if (n < 0n) return `negative ${integerToWords(-n)}`;

  const parts: string[] = [];

  const scales: [bigint, string][] = [
    [1_000_000_000_000_000n, 'quadrillion'],
    [1_000_000_000_000n, 'trillion'],
    [1_000_000_000n, 'billion'],
    [1_000_000n, 'million'],
    [1_000n, 'thousand'],
    [100n, 'hundred'],
  ];

  for (const [scale, name] of scales) {
    if (n >= scale) {
      const quotient = n / scale;
      parts.push(`${integerToWords(quotient)} ${name}`);
      n %= scale;
    }
  }

  if (n > 0n) {
    const rem = Number(n);
    if (rem < 20) {
      parts.push(ONES[rem]);
    } else {
      const ten = Math.floor(rem / 10) * 10;
      const unit = rem % 10;
      if (unit === 0) {
        parts.push(TENS[ten]);
      } else {
        parts.push(`${TENS[ten]}-${ONES[unit]}`);
      }
    }
  }

  return parts.join(' ');
}

/**
 * Converts an ordinal number (e.g. 1st, 2nd, 23rd) to words (e.g. "twenty-third").
 */
export function ordinalToWords(num: number): string {
  if (num <= 0) return num.toString();
  if (num in ORDINALS_UNDER_20) return ORDINALS_UNDER_20[num];

  if (num < 100) {
    const ten = Math.floor(num / 10) * 10;
    const unit = num % 10;
    if (unit === 0) return ORDINAL_TENS[ten] || `${TENS[ten]}th`;
    return `${TENS[ten]}-${ORDINALS_UNDER_20[unit] || `${ONES[unit]}th`}`;
  }

  const baseWords = integerToWords(num);
  if (baseWords.endsWith('one')) return baseWords.slice(0, -3) + 'first';
  if (baseWords.endsWith('two')) return baseWords.slice(0, -3) + 'second';
  if (baseWords.endsWith('three')) return baseWords.slice(0, -5) + 'third';
  if (baseWords.endsWith('five')) return baseWords.slice(0, -4) + 'fifth';
  if (baseWords.endsWith('eight')) return baseWords.slice(0, -5) + 'eighth';
  if (baseWords.endsWith('nine')) return baseWords.slice(0, -4) + 'ninth';
  if (baseWords.endsWith('twelve')) return baseWords.slice(0, -6) + 'twelfth';
  if (baseWords.endsWith('y')) return baseWords.slice(0, -1) + 'ieth';

  return `${baseWords}th`;
}

/**
 * Converts a 4-digit year (e.g. 2026, 1999) to spoken words.
 */
export function yearToWords(year: number): string {
  if (year >= 1000 && year <= 2999) {
    if (year % 1000 === 0) {
      return integerToWords(year);
    }
    const firstTwo = Math.floor(year / 100);
    const lastTwo = year % 100;

    if (lastTwo === 0) {
      return `${integerToWords(firstTwo)} hundred`;
    }
    if (lastTwo < 10) {
      if (firstTwo === 20) {
        // e.g. 2005 -> "twenty oh five" or "two thousand five"
        return `twenty oh ${ONES[lastTwo]}`;
      }
      return `${integerToWords(firstTwo)} oh ${ONES[lastTwo]}`;
    }
    return `${integerToWords(firstTwo)} ${integerToWords(lastTwo)}`;
  }
  return integerToWords(year);
}

/**
 * Expands decimal numbers like "99.9" to "ninety-nine point nine".
 */
export function decimalToWords(raw: string): string {
  const isNegative = raw.startsWith('-');
  const isPositive = raw.startsWith('+');
  const clean = raw.replace(/^[+-]/, '').replace(/,/g, '');
  const [intStr, fracStr] = clean.split('.');

  const intPart = BigInt(intStr || '0');
  const intWords = integerToWords(intPart);
  const fracWords = (fracStr || '')
    .split('')
    .map((d) => ONES[Number(d)] ?? d)
    .join(' ');

  let result = fracWords ? `${intWords} point ${fracWords}` : intWords;
  if (isNegative) result = `negative ${result}`;
  else if (isPositive) result = `positive ${result}`;
  return result;
}

/**
 * Converts currency amounts like "$0.00", "$1,000,000,000,000", "-$50.25" to words.
 */
export function currencyToWords(raw: string): string {
  let isNegative = false;
  let isPositive = false;

  let cleaned = raw.trim();
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1).trim();
  } else if (cleaned.startsWith('+')) {
    isPositive = true;
    cleaned = cleaned.slice(1).trim();
  }

  if (cleaned.startsWith('$')) {
    cleaned = cleaned.slice(1).trim();
  }

  // Could have negative sign after dollar sign: e.g. $-50.25
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1).trim();
  }

  cleaned = cleaned.replace(/,/g, '');
  const [dollarsStr, centsStr] = cleaned.split('.');

  const dollars = BigInt(dollarsStr || '0');
  const cents = centsStr ? parseInt(centsStr.slice(0, 2).padEnd(2, '0'), 10) : 0;

  const parts: string[] = [];

  if (dollars === 0n && cents === 0) {
    parts.push('zero dollars');
  } else {
    if (dollars > 0n || cents === 0) {
      const dollarWords = integerToWords(dollars);
      const dollarUnit = dollars === 1n ? 'dollar' : 'dollars';
      parts.push(`${dollarWords} ${dollarUnit}`);
    }

    if (cents > 0) {
      const centWords = integerToWords(cents);
      const centUnit = cents === 1 ? 'cent' : 'cents';
      if (parts.length > 0) {
        parts.push(`and ${centWords} ${centUnit}`);
      } else {
        parts.push(`${centWords} ${centUnit}`);
      }
    }
  }

  let result = parts.join(' ');
  if (isNegative) result = `negative ${result}`;
  else if (isPositive) result = `positive ${result}`;
  return result;
}

/**
 * Converts percentage like "+99.9%" or "-50%" to spoken words.
 */
export function percentageToWords(raw: string): string {
  const withoutPercent = raw.replace('%', '').trim();
  if (withoutPercent.includes('.')) {
    return `${decimalToWords(withoutPercent)} percent`;
  }
  const isNegative = withoutPercent.startsWith('-');
  const isPositive = withoutPercent.startsWith('+');
  const clean = withoutPercent.replace(/^[+-]/, '').replace(/,/g, '');
  const val = BigInt(clean);
  let words = `${integerToWords(val)} percent`;
  if (isNegative) words = `negative ${words}`;
  else if (isPositive) words = `positive ${words}`;
  return words;
}

/**
 * Converts MM/DD/YYYY or MM/DD/YY dates (e.g. "12/05/2026") to spoken words.
 * "12/05/2026" -> "December fifth twenty twenty-six"
 */
export function dateToWords(raw: string): string {
  const parts = raw.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (year < 100) {
      year += year >= 50 ? 1900 : 2000;
    }

    const monthName = MONTH_NAMES[month] || parts[0];
    const dayWords = ordinalToWords(day);
    const yearWords = yearToWords(year);

    return `${monthName} ${dayWords} ${yearWords}`;
  }
  return raw;
}
