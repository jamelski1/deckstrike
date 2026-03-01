/**
 * text.ts — Text measurement and wrapping utilities for SVG rendering.
 *
 * SVG has no native word-wrap. We approximate character widths and split
 * text into <tspan> lines that fit within a given pixel width.
 */

/** Average character width as a ratio of font size (heuristic for sans-serif) */
const CHAR_WIDTH_RATIO = 0.52;

/** Minimum font-size reduction when text overflows max lines */
const FONT_SIZE_REDUCTION = 0.85;

/**
 * Estimate the rendered pixel width of a string at a given font size.
 */
export function measureText(text: string, fontSize: number): number {
  return text.length * fontSize * CHAR_WIDTH_RATIO;
}

export interface WrapResult {
  lines: string[];
  fontSize: number;
}

/**
 * Word-wrap text to fit within maxWidth at the given fontSize.
 *
 * @param text      - The source string to wrap
 * @param maxWidth  - Available width in pixels
 * @param fontSize  - Base font size in pixels
 * @param maxLines  - Maximum number of output lines (default: 4)
 * @returns An object with the wrapped lines and the (possibly reduced) font size
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number = 4,
): WrapResult {
  let lines = splitIntoLines(text, maxWidth, fontSize);

  // If we exceed maxLines, try once with a reduced font size
  if (lines.length > maxLines) {
    const reduced = Math.round(fontSize * FONT_SIZE_REDUCTION);
    lines = splitIntoLines(text, maxWidth, reduced);
    // Hard-cap at maxLines even after reduction
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*$/, '') + '…';
    }
    return { lines, fontSize: reduced };
  }

  return { lines, fontSize };
}

/**
 * Split a string into lines that each fit within maxWidth.
 */
function splitIntoLines(
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines;
}

/**
 * Render wrapped text as a series of SVG <tspan> elements.
 *
 * @param x         - x position for each tspan
 * @param y         - starting y position
 * @param text      - source text
 * @param maxWidth  - available width in pixels
 * @param fontSize  - base font size
 * @param maxLines  - line cap
 * @param attrs     - extra SVG attributes for the parent <text> element
 * @returns SVG markup string
 */
export function renderWrappedText(
  x: number,
  y: number,
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number = 4,
  attrs: string = '',
): string {
  const { lines, fontSize: finalSize } = wrapText(text, maxWidth, fontSize, maxLines);
  const lineHeight = Math.round(finalSize * 1.4);

  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<text x="${x}" y="${y}" font-size="${finalSize}" ${attrs}>${tspans}</text>`;
}

/**
 * Escape special characters for safe SVG/XML embedding.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
