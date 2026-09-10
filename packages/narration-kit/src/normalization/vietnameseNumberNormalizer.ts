/**
 * packages/narration-kit/src/normalization/vietnameseNumberNormalizer.ts
 * Comprehensive Vietnamese number normalization complying with Requirement R6 and R11.
 * - 4-digit years (e.g., "năm 2026" -> "năm hai nghìn không trăm hai mươi sáu", never English)
 * - Vietnamese cardinal grammar (rules of "mốt", "lăm", "tư", "linh/lẻ")
 * - Percentages (e.g., "99%" -> "chín mươi chín phần trăm")
 * - Decimals (e.g., "99.9" -> "chín mươi chín phẩy chín")
 * - Currencies (e.g., "$100" -> "một trăm đô la", "50 tỷ" -> "năm mươi tỷ")
 */

const DIGITS_VI: Record<string, string> = {
  '0': 'không',
  '1': 'một',
  '2': 'hai',
  '3': 'ba',
  '4': 'bốn',
  '5': 'năm',
  '6': 'sáu',
  '7': 'bảy',
  '8': 'tám',
  '9': 'chín',
};

/**
 * Reads a 3-digit group in Vietnamese
 */
function readThreeDigitsVi(group: number, isLeadingGroup: boolean): string {
  const hundreds = Math.floor(group / 100);
  const remainder = group % 100;
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  const parts: string[] = [];

  if (hundreds > 0 || !isLeadingGroup) {
    parts.push(DIGITS_VI[String(hundreds)], 'trăm');
  }

  if (tens > 1) {
    parts.push(DIGITS_VI[String(tens)], 'mươi');
    if (units === 1) {
      parts.push('mốt');
    } else if (units === 4) {
      parts.push('tư');
    } else if (units === 5) {
      parts.push('lăm');
    } else if (units > 0) {
      parts.push(DIGITS_VI[String(units)]);
    }
  } else if (tens === 1) {
    parts.push('mười');
    if (units === 5) {
      parts.push('lăm');
    } else if (units > 0) {
      parts.push(DIGITS_VI[String(units)]);
    }
  } else if (tens === 0 && units > 0) {
    if (hundreds > 0 || !isLeadingGroup) {
      parts.push('không trăm linh', units === 5 ? 'năm' : DIGITS_VI[String(units)]);
    } else {
      parts.push(DIGITS_VI[String(units)]);
    }
  } else if (tens === 0 && units === 0 && isLeadingGroup && hundreds === 0) {
    parts.push('không');
  }

  return parts.join(' ').replace('không trăm không trăm linh', 'linh').trim();
}

/**
 * Normalizes an integer up to trillions into Vietnamese words
 */
export function normalizeVietnameseInteger(n: number | bigint): string {
  if (typeof n === 'bigint') {
    n = Number(n);
  }

  if (n === 0) return 'không';
  if (n < 0) return `âm ${normalizeVietnameseInteger(-n)}`;

  const SCALE_NAMES = ['', 'nghìn', 'triệu', 'tỷ'];

  let num = Math.floor(n);
  const groups: number[] = [];

  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const words: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal === 0 && groups.length > 1) continue;

    const isLeading = i === groups.length - 1;
    const groupText = readThreeDigitsVi(groupVal, isLeading);
    const scale = SCALE_NAMES[i % 4] || '';

    words.push(groupText);
    if (scale) {
      words.push(scale);
    }
  }

  return words.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes a 4-digit calendar year (e.g. 2026 -> "hai nghìn không trăm hai mươi sáu")
 */
export function normalizeVietnameseYear(yearStr: string): string {
  const y = parseInt(yearStr, 10);
  if (isNaN(y)) return yearStr;
  return normalizeVietnameseInteger(y);
}

/**
 * Normalizes decimal number (e.g. 99.9 -> "chín mươi chín phẩy chín")
 */
export function normalizeVietnameseDecimal(decStr: string): string {
  const parts = decStr.split(/[.,]/);
  if (parts.length !== 2) return decStr;

  const intPart = normalizeVietnameseInteger(parseInt(parts[0], 10));
  const decDigits = parts[1].split('').map((d) => DIGITS_VI[d] || d).join(' ');

  return `${intPart} phẩy ${decDigits}`;
}

/**
 * Normalizes percentage (e.g. "99%" -> "chín mươi chín phần trăm")
 */
export function normalizeVietnamesePercent(pctStr: string): string {
  const clean = pctStr.replace(/%/g, '').trim();
  let valStr: string;

  if (clean.includes('.') || clean.includes(',')) {
    valStr = normalizeVietnameseDecimal(clean);
  } else {
    valStr = normalizeVietnameseInteger(parseInt(clean, 10));
  }

  return `${valStr} phần trăm`;
}

/**
 * Main Vietnamese number normalizer function
 */
export function normalizeVietnameseNumberToken(
  token: string,
  context?: { prevWord?: string; nextWord?: string }
): string {
  const t = token.trim();

  // Percentage: "99%", "-45.5%"
  if (/^-?\d+(?:[.,]\d+)?%$/.test(t)) {
    return normalizeVietnamesePercent(t);
  }

  // Currency: "$100", "100$"
  if (/^\$\d+(?:[.,]\d+)?$/.test(t)) {
    const num = t.replace('$', '');
    const numWords = num.includes('.') || num.includes(',')
      ? normalizeVietnameseDecimal(num)
      : normalizeVietnameseInteger(parseInt(num, 10));
    return `${numWords} đô la`;
  }

  // Ordinal: "thứ 1", "thứ 4"
  if (context?.prevWord && /^(thứ|bước|phần|tầng)$/i.test(context.prevWord)) {
    if (t === '1') return 'nhất';
    if (t === '4') return 'tư';
  }

  // Four-digit year context: "năm 2026", "giai đoạn 1990", or standalone 4-digit year 1900-2099
  if (/^(19|20)\d{2}$/.test(t)) {
    return normalizeVietnameseYear(t);
  }

  // Decimal
  if (/^-?\d+[.,]\d+$/.test(t)) {
    return normalizeVietnameseDecimal(t);
  }

  // Plain integer
  if (/^-?\d+$/.test(t)) {
    return normalizeVietnameseInteger(parseInt(t, 10));
  }

  return token;
}
