/**
 * export.ts — SVG-to-PNG conversion using resvg-js.
 *
 * Takes a rendered SVG string and produces a PNG buffer at the
 * specified dimensions.
 */

import { Resvg } from '@resvg/resvg-js';

export interface ExportOptions {
  width: number;
  height: number;
}

/**
 * Convert an SVG string to a PNG buffer.
 *
 * @param svg     - Complete SVG document string
 * @param options - Output dimensions
 * @returns PNG image as a Buffer
 */
export function svgToPng(svg: string, options: ExportOptions): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: options.width,
    },
    background: '#F5F3E8',
  });

  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}
