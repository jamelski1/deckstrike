/**
 * render.ts — Main SVG layout engine for DECKSTRIKE infographics.
 *
 * Composes the full SVG document from layout zones:
 *   1. Top bar (title + classification pill)
 *   2. Main left grid (2×2 info cards)
 *   3. Right panel (line chart + takeaways)
 *   4. Footer bar
 *
 * All layout constants use an 8px grid system.
 */

import { renderWrappedText, escapeXml } from './text';
import { renderChart, renderTakeaways, ChartData } from './chart';

// ─── Theme Colors ──────────────────────────────────────────────────────────────
const COLORS = {
  background: '#F5F3E8',
  primary: '#2F3A2F',
  accent: '#C2B280',
  ink: '#1C1F1C',
  cardBg: '#FFFFFF',
  cardBorder: '#D5D0C0',
  cardShadow: 'rgba(0,0,0,0.06)',
} as const;

// ─── Typography ────────────────────────────────────────────────────────────────
const FONTS = {
  heading: "'Roboto Condensed', sans-serif",
  body: 'Inter, sans-serif',
} as const;

// ─── Layout Constants (8px grid) ───────────────────────────────────────────────
const LAYOUT = {
  /** Page margins */
  margin: 80,
  /** Top bar height */
  topBarHeight: 120,
  /** Footer bar height */
  footerHeight: 70,
  /** Gap between cards */
  cardGap: 24,
  /** Card corner radius */
  cardRadius: 8,
  /** Card internal padding */
  cardPadding: 24,
  /** Right panel starts at this x */
  rightPanelX: 1240,
  /** Right panel width */
  rightPanelWidth: 600,
  /** Chart height inside right panel */
  chartHeight: 280,
} as const;

// ─── Input Types ───────────────────────────────────────────────────────────────
export interface CardData {
  label: string;
  heading: string;
  body: string;
}

export interface InfographicData {
  title: string;
  subtitle: string;
  classification: string;
  cards: CardData[];
  chart: ChartData;
  takeaways: string[];
  footer: string;
}

/**
 * Generate the complete SVG string for a DECKSTRIKE infographic.
 */
export function renderSvg(data: InfographicData, width: number, height: number): string {
  const parts: string[] = [];

  parts.push(svgOpen(width, height));
  parts.push(svgDefs());
  parts.push(renderBackground(width, height));
  parts.push(renderTopBar(data, width));
  parts.push(renderCards(data.cards, width, height));
  parts.push(renderRightPanel(data, width, height));
  parts.push(renderFooter(data, width, height));
  parts.push('</svg>');

  return parts.join('\n');
}

// ─── SVG Document ──────────────────────────────────────────────────────────────

function svgOpen(width: number, height: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
  );
}

/**
 * SVG <defs> block: topographic contour background pattern.
 */
function svgDefs(): string {
  return `
<defs>
  <pattern id="topo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
    <path d="M20,80 Q60,20 100,80 T180,80" fill="none" stroke="${COLORS.accent}" stroke-width="0.5" opacity="0.18"/>
    <path d="M0,140 Q50,100 100,140 T200,140" fill="none" stroke="${COLORS.accent}" stroke-width="0.5" opacity="0.14"/>
    <path d="M10,40 Q80,0 140,40 T200,40" fill="none" stroke="${COLORS.accent}" stroke-width="0.5" opacity="0.10"/>
    <path d="M0,180 Q40,160 100,180 T200,180" fill="none" stroke="${COLORS.accent}" stroke-width="0.5" opacity="0.12"/>
  </pattern>
  <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="108%">
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${COLORS.cardShadow}"/>
  </filter>
</defs>`;
}

// ─── Background ────────────────────────────────────────────────────────────────

function renderBackground(width: number, height: number): string {
  return (
    `<rect width="${width}" height="${height}" fill="${COLORS.background}"/>` +
    `<rect width="${width}" height="${height}" fill="url(#topo)"/>`
  );
}

// ─── Zone 1: Top Bar ──────────────────────────────────────────────────────────

function renderTopBar(data: InfographicData, width: number): string {
  const barY = 0;
  const titleY = 72;
  const parts: string[] = [];

  // Subtle bar background
  parts.push(
    `<rect x="0" y="${barY}" width="${width}" height="${LAYOUT.topBarHeight}" ` +
      `fill="${COLORS.primary}" opacity="0.04"/>`,
  );

  // Title (left side)
  parts.push(
    renderWrappedText(
      LAYOUT.margin,
      titleY,
      data.title,
      800,
      36,
      2,
      `font-family="${FONTS.heading}" font-weight="700" fill="${COLORS.ink}" letter-spacing="-0.5"`,
    ),
  );

  // Subtitle
  parts.push(
    `<text x="${LAYOUT.margin}" y="${titleY + 32}" font-size="15" ` +
      `font-family="${FONTS.body}" fill="${COLORS.primary}" opacity="0.7">${escapeXml(data.subtitle)}</text>`,
  );

  // Classification pill (right side)
  const pillText = data.classification;
  const pillWidth = pillText.length * 8.5 + 32;
  const pillX = width - LAYOUT.margin - pillWidth;
  const pillY = titleY - 24;
  const pillHeight = 32;
  const pillRadius = 4;

  parts.push(
    `<rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" ` +
      `rx="${pillRadius}" fill="${COLORS.primary}"/>`,
  );
  parts.push(
    `<text x="${pillX + pillWidth / 2}" y="${pillY + 21}" text-anchor="middle" ` +
      `font-size="12" font-family="${FONTS.body}" font-weight="600" ` +
      `fill="${COLORS.accent}" letter-spacing="1">${escapeXml(pillText)}</text>`,
  );

  return parts.join('\n');
}

// ─── Zone 2: Main Left Grid (2×2 Cards) ───────────────────────────────────────

function renderCards(cards: CardData[], width: number, height: number): string {
  const gridLeft = LAYOUT.margin;
  const gridTop = LAYOUT.topBarHeight + 24;
  const gridRight = LAYOUT.rightPanelX - LAYOUT.cardGap * 2;
  const gridBottom = height - LAYOUT.footerHeight - 24;

  const cols = 2;
  const rows = 2;
  const totalWidth = gridRight - gridLeft;
  const totalHeight = gridBottom - gridTop;
  const cardW = (totalWidth - LAYOUT.cardGap) / cols;
  const cardH = (totalHeight - LAYOUT.cardGap) / rows;

  const parts: string[] = [];

  cards.slice(0, 4).forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridLeft + col * (cardW + LAYOUT.cardGap);
    const cy = gridTop + row * (cardH + LAYOUT.cardGap);

    parts.push(renderCard(cx, cy, cardW, cardH, card));
  });

  return parts.join('\n');
}

function renderCard(
  x: number,
  y: number,
  w: number,
  h: number,
  card: CardData,
): string {
  const pad = LAYOUT.cardPadding;
  const innerW = w - pad * 2;
  const parts: string[] = [];

  // Card background with border and shadow
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${LAYOUT.cardRadius}" ` +
      `fill="${COLORS.cardBg}" stroke="${COLORS.cardBorder}" stroke-width="1" filter="url(#cardShadow)"/>`,
  );

  // Accent bar at top of card
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="4" rx="${LAYOUT.cardRadius}" fill="${COLORS.accent}"/>`,
  );

  // Label (e.g., "Stage I")
  const labelY = y + pad + 16;
  parts.push(
    `<text x="${x + pad}" y="${labelY}" font-size="12" font-family="${FONTS.body}" ` +
      `font-weight="600" fill="${COLORS.accent}" letter-spacing="1.5" ` +
      `text-transform="uppercase">${escapeXml(card.label.toUpperCase())}</text>`,
  );

  // Heading
  const headingY = labelY + 32;
  parts.push(
    renderWrappedText(
      x + pad,
      headingY,
      card.heading,
      innerW,
      24,
      1,
      `font-family="${FONTS.heading}" font-weight="700" fill="${COLORS.ink}"`,
    ),
  );

  // Body text
  const bodyY = headingY + 40;
  parts.push(
    renderWrappedText(
      x + pad,
      bodyY,
      card.body,
      innerW,
      15,
      4,
      `font-family="${FONTS.body}" fill="${COLORS.primary}" opacity="0.85" line-height="1.5"`,
    ),
  );

  return parts.join('\n');
}

// ─── Zone 3: Right Panel (Chart + Takeaways) ──────────────────────────────────

function renderRightPanel(data: InfographicData, width: number, height: number): string {
  const panelX = LAYOUT.rightPanelX;
  const panelY = LAYOUT.topBarHeight + 24;
  const panelW = width - LAYOUT.margin - panelX;
  const panelBottom = height - LAYOUT.footerHeight - 24;
  const panelH = panelBottom - panelY;

  const parts: string[] = [];

  // Panel background
  parts.push(
    `<rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" ` +
      `rx="${LAYOUT.cardRadius}" fill="${COLORS.cardBg}" stroke="${COLORS.cardBorder}" ` +
      `stroke-width="1" filter="url(#cardShadow)"/>`,
  );

  // Chart title
  const titleY = panelY + 36;
  parts.push(
    `<text x="${panelX + 24}" y="${titleY}" font-size="18" ` +
      `font-family="${FONTS.heading}" font-weight="700" fill="${COLORS.ink}">${escapeXml(data.chart.title)}</text>`,
  );

  // Chart area
  const chartTop = titleY + 16;
  parts.push(
    renderChart(panelX + 24, chartTop, panelW - 48, LAYOUT.chartHeight, data.chart),
  );

  // Divider line
  const dividerY = chartTop + LAYOUT.chartHeight + 16;
  parts.push(
    `<line x1="${panelX + 24}" y1="${dividerY}" x2="${panelX + panelW - 24}" y2="${dividerY}" ` +
      `stroke="${COLORS.cardBorder}" stroke-width="1"/>`,
  );

  // Takeaways heading
  const takeawaysHeadY = dividerY + 32;
  parts.push(
    `<text x="${panelX + 24}" y="${takeawaysHeadY}" font-size="14" ` +
      `font-family="${FONTS.heading}" font-weight="700" fill="${COLORS.primary}" ` +
      `letter-spacing="1">KEY TAKEAWAYS</text>`,
  );

  // Takeaway bullets
  const bulletsY = takeawaysHeadY + 28;
  parts.push(renderTakeaways(panelX + 24, bulletsY, data.takeaways, panelW - 48));

  return parts.join('\n');
}

// ─── Zone 4: Footer Bar ───────────────────────────────────────────────────────

function renderFooter(data: InfographicData, width: number, height: number): string {
  const footerY = height - LAYOUT.footerHeight;
  const textY = footerY + 44;
  const parts: string[] = [];

  // Footer background
  parts.push(
    `<rect x="0" y="${footerY}" width="${width}" height="${LAYOUT.footerHeight}" ` +
      `fill="${COLORS.primary}" opacity="0.06"/>`,
  );

  // Footer text (left)
  parts.push(
    `<text x="${LAYOUT.margin}" y="${textY}" font-size="13" ` +
      `font-family="${FONTS.body}" fill="${COLORS.primary}" opacity="0.7">${escapeXml(data.footer)}</text>`,
  );

  // Timestamp + branding (right)
  const timestamp = new Date().toISOString().slice(0, 10);
  const rightText = `${timestamp}  ·  Generated by DECKSTRIKE`;
  parts.push(
    `<text x="${width - LAYOUT.margin}" y="${textY}" text-anchor="end" font-size="12" ` +
      `font-family="${FONTS.body}" fill="${COLORS.primary}" opacity="0.5">${escapeXml(rightText)}</text>`,
  );

  return parts.join('\n');
}
