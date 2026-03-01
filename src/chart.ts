/**
 * chart.ts — Simple line-chart renderer for SVG.
 *
 * Draws axes, a polyline, data points, and axis labels within a given
 * bounding box. No external charting library required.
 */

import { escapeXml } from './text';

/** Style constants for the chart */
const CHART_STYLES = {
  axisColor: '#2F3A2F',
  lineColor: '#2F3A2F',
  pointColor: '#C2B280',
  gridColor: '#D5D0C0',
  axisWidth: 2,
  lineWidth: 2.5,
  pointRadius: 4,
  fontSize: 12,
  labelFont: 'Inter, sans-serif',
} as const;

/** Padding inside the chart area for axes and labels */
const CHART_PADDING = {
  top: 16,
  right: 16,
  bottom: 32,
  left: 40,
} as const;

export interface ChartData {
  title: string;
  /** Array of [x, y] data points */
  data: [number, number][];
}

/**
 * Render a simple line chart as an SVG fragment.
 *
 * @param x      - left edge of the chart bounding box
 * @param y      - top edge of the chart bounding box
 * @param width  - total width of the chart area
 * @param height - total height of the chart area
 * @param chart  - chart data (title + data points)
 * @returns SVG markup string
 */
export function renderChart(
  x: number,
  y: number,
  width: number,
  height: number,
  chart: ChartData,
): string {
  const { data } = chart;
  if (data.length === 0) return '';

  // Plot area after padding
  const plotLeft = x + CHART_PADDING.left;
  const plotTop = y + CHART_PADDING.top;
  const plotWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  // Data ranges
  const xs = data.map(d => d[0]);
  const ys = data.map(d => d[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  // Map data to pixel coordinates
  const scaleX = (v: number) =>
    xMax === xMin ? plotLeft + plotWidth / 2 : plotLeft + ((v - xMin) / (xMax - xMin)) * plotWidth;
  const scaleY = (v: number) =>
    yMax === yMin ? plotTop + plotHeight / 2 : plotTop + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const points = data.map(([dx, dy]) => ({ px: scaleX(dx), py: scaleY(dy) }));

  // Build SVG fragments
  const parts: string[] = [];

  // Horizontal grid lines (4 divisions)
  for (let i = 0; i <= 4; i++) {
    const gy = plotTop + (plotHeight / 4) * i;
    parts.push(
      `<line x1="${plotLeft}" y1="${gy}" x2="${plotLeft + plotWidth}" y2="${gy}" ` +
        `stroke="${CHART_STYLES.gridColor}" stroke-width="1" stroke-dasharray="4,4"/>`,
    );
  }

  // Axes
  // Y-axis
  parts.push(
    `<line x1="${plotLeft}" y1="${plotTop}" x2="${plotLeft}" y2="${plotTop + plotHeight}" ` +
      `stroke="${CHART_STYLES.axisColor}" stroke-width="${CHART_STYLES.axisWidth}"/>`,
  );
  // X-axis
  parts.push(
    `<line x1="${plotLeft}" y1="${plotTop + plotHeight}" x2="${plotLeft + plotWidth}" y2="${plotTop + plotHeight}" ` +
      `stroke="${CHART_STYLES.axisColor}" stroke-width="${CHART_STYLES.axisWidth}"/>`,
  );

  // X-axis labels
  for (const d of data) {
    const px = scaleX(d[0]);
    parts.push(
      `<text x="${px}" y="${plotTop + plotHeight + 20}" ` +
        `text-anchor="middle" font-size="${CHART_STYLES.fontSize}" ` +
        `font-family="${CHART_STYLES.labelFont}" fill="${CHART_STYLES.axisColor}">${d[0]}h</text>`,
    );
  }

  // Y-axis labels (min / max)
  parts.push(
    `<text x="${plotLeft - 8}" y="${plotTop + plotHeight}" ` +
      `text-anchor="end" font-size="${CHART_STYLES.fontSize}" ` +
      `font-family="${CHART_STYLES.labelFont}" fill="${CHART_STYLES.axisColor}">${yMin}</text>`,
  );
  parts.push(
    `<text x="${plotLeft - 8}" y="${plotTop + 4}" ` +
      `text-anchor="end" font-size="${CHART_STYLES.fontSize}" ` +
      `font-family="${CHART_STYLES.labelFont}" fill="${CHART_STYLES.axisColor}">${yMax}</text>`,
  );

  // Line path
  const polyline = points.map(p => `${p.px},${p.py}`).join(' ');
  parts.push(
    `<polyline points="${polyline}" fill="none" ` +
      `stroke="${CHART_STYLES.lineColor}" stroke-width="${CHART_STYLES.lineWidth}" ` +
      `stroke-linejoin="round" stroke-linecap="round"/>`,
  );

  // Data points
  for (const p of points) {
    parts.push(
      `<circle cx="${p.px}" cy="${p.py}" r="${CHART_STYLES.pointRadius}" ` +
        `fill="${CHART_STYLES.pointColor}" stroke="${CHART_STYLES.axisColor}" stroke-width="1.5"/>`,
    );
  }

  return parts.join('\n');
}

/**
 * Render takeaway bullet points below the chart.
 *
 * @param x          - left edge
 * @param y          - starting y position
 * @param takeaways  - array of bullet strings
 * @param maxWidth   - available width
 * @returns SVG markup string
 */
export function renderTakeaways(
  x: number,
  y: number,
  takeaways: string[],
  maxWidth: number,
): string {
  const lineHeight = 24;
  const bulletRadius = 3;
  const fontSize = 13;

  return takeaways
    .map((text, i) => {
      const cy = y + i * lineHeight;
      return (
        `<circle cx="${x + bulletRadius}" cy="${cy - 4}" r="${bulletRadius}" fill="#C2B280"/>` +
        `<text x="${x + bulletRadius * 2 + 8}" y="${cy}" ` +
        `font-size="${fontSize}" font-family="Inter, sans-serif" fill="#1C1F1C">${escapeXml(text)}</text>`
      );
    })
    .join('\n');
}
