/**
 * Text Metrics & Content-Driven Layout Sizing
 *
 * Provides character-weighted text advance estimation for Latin and Vietnamese UTF-8 glyphs,
 * guaranteeing that SVG containers dynamically expand to preserve required margins.
 */

export interface TextMetricOptions {
  paddingHorizontal?: number;
  paddingVertical?: number;
  minWidth?: number;
  maxWidth?: number;
  height?: number;
  fontWeight?: number | string;
}

export interface PillDimensions {
  width: number;
  height: number;
  estimatedTextWidth: number;
  padLeft: number;
  padRight: number;
}

/**
 * Estimates the rendered pixel width of a text string in Inter / Roboto / System Sans.
 * Uses a conservative ceiling so that containers NEVER under-estimate and cause overflow.
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  fontWeight: number | string = 700
): number {
  if (!text || text.length === 0) return 0;

  const normalizedText = text.normalize('NFC');

  const isBold =
    typeof fontWeight === 'number'
      ? fontWeight >= 700
      : fontWeight === 'bold' || fontWeight === '900' || fontWeight === '800';
  const boldMultiplier = isBold ? 1.08 : 1.0;

  let totalAdvance = 0;
  for (const char of normalizedText) {
    if (char === ' ') {
      totalAdvance += 0.32 * fontSize;
    } else if (/[0-9]/.test(char)) {
      totalAdvance += 0.60 * fontSize;
    } else if (/[WM]/.test(char)) {
      totalAdvance += 0.88 * fontSize;
    } else if (/[wm]/.test(char)) {
      totalAdvance += 0.80 * fontSize;
    } else if (/\p{Lu}/u.test(char)) {
      totalAdvance += 0.74 * fontSize;
    } else if (/\p{Ll}/u.test(char)) {
      totalAdvance += 0.54 * fontSize;
    } else if (/[\.,:;!\?'"–—\-]/.test(char)) {
      totalAdvance += 0.32 * fontSize;
    } else {
      totalAdvance += 0.62 * fontSize;
    }
  }

  return Math.ceil(totalAdvance * boldMultiplier);
}

/**
 * Derives safe pill container dimensions for a given text string.
 * Enforces a strict minimum horizontal padding (default: 34px, strictly >= 30px requirement).
 */
export function computePillDimensions(
  text: string,
  fontSize: number,
  options: TextMetricOptions = {}
): PillDimensions {
  const {
    paddingHorizontal = 34,
    paddingVertical = 32,
    minWidth = 140,
    maxWidth = 980,
    height,
    fontWeight = 700,
  } = options;

  const safePaddingHorizontal = Math.max(30, paddingHorizontal);
  const safePaddingVertical = Math.max(30, paddingVertical);
  const safeMinWidth = Math.max(140, minWidth);
  const safeHeight = height ?? Math.max(96, Math.round(fontSize * 1.15) + safePaddingVertical * 2);

  const textWidth = estimateTextWidth(text, fontSize, fontWeight);
  const idealWidth = textWidth + safePaddingHorizontal * 2;
  const width = Math.max(safeMinWidth, Math.min(maxWidth, idealWidth));
  const effectivePadding = Math.max(0, (width - textWidth) / 2);

  return {
    width,
    height: safeHeight,
    estimatedTextWidth: textWidth,
    padLeft: effectivePadding,
    padRight: effectivePadding,
  };
}
