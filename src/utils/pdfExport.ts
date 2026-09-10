import type jsPDF from 'jspdf';
import { AccountInfo, Trade, TradingMetrics } from '../types/trade';
import {
  calculateMetrics,
  getMonthsBreakdown,
  getSymbolBreakdown,
  getDayOfWeekBreakdown,
  getPropFirmRules,
  getAIInsights
} from './analytics';

export interface PdfExportOptions {
  title?: string;
  subtitle?: string;
  dateRange: 'all' | '30days' | 'thisMonth' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  sections: {
    overview: boolean;
    calendar: boolean;
    tradeJournal: boolean;
    deepAnalytics: boolean;
    aiCoach: boolean;
    propFirm: boolean;
  };
  includeNotes: boolean;
  maskAccount: boolean;
  colorTheme: 'emerald' | 'navy' | 'monochrome' | 'gold';
}

export const defaultPdfExportOptions: PdfExportOptions = {
  title: 'TradeScrapbook Performance Report',
  subtitle: 'Institutional Comprehensive Trading Statement',
  dateRange: 'all',
  sections: {
    overview: true,
    calendar: true,
    tradeJournal: true,
    deepAnalytics: true,
    aiCoach: true,
    propFirm: true,
  },
  includeNotes: true,
  maskAccount: false,
  colorTheme: 'emerald',
};

// ─── Color Palette Registry ─────────────────────────────────────────────────
const THEMES = {
  emerald: {
    primary:   [5,  90,  65]  as [number, number, number], // deep forest
    accent:    [16, 185, 129] as [number, number, number], // emerald-500
    accent2:   [20, 184, 166] as [number, number, number], // teal
    dark:      [15,  23,  42] as [number, number, number],
    midDark:   [30,  41,  59] as [number, number, number],
    lightBg:   [240,253,244]  as [number, number, number],
    cardBg:    [248,250,252]  as [number, number, number],
    border:    [226,232,240]  as [number, number, number],
    headerTxt: [255,255,255]  as [number, number, number],
    subTxt:    [148,163,184]  as [number, number, number],
    tablHead:  [30, 41,  59]  as [number, number, number],
  },
  navy: {
    primary:   [15,  23,  42] as [number, number, number],
    accent:    [99, 102, 241] as [number, number, number], // indigo-500
    accent2:   [139,92, 246]  as [number, number, number], // violet
    dark:      [15,  23,  42] as [number, number, number],
    midDark:   [30,  41,  59] as [number, number, number],
    lightBg:   [238,242,255]  as [number, number, number],
    cardBg:    [248,250,252]  as [number, number, number],
    border:    [226,232,240]  as [number, number, number],
    headerTxt: [255,255,255]  as [number, number, number],
    subTxt:    [148,163,184]  as [number, number, number],
    tablHead:  [30, 41,  59]  as [number, number, number],
  },
  monochrome: {
    primary:   [24,  24,  27] as [number, number, number],
    accent:    [82,  82,  91] as [number, number, number],
    accent2:   [113,113,122]  as [number, number, number],
    dark:      [9,   9,  11]  as [number, number, number],
    midDark:   [39,  39,  42] as [number, number, number],
    lightBg:   [244,244,245]  as [number, number, number],
    cardBg:    [250,250,250]  as [number, number, number],
    border:    [228,228,231]  as [number, number, number],
    headerTxt: [255,255,255]  as [number, number, number],
    subTxt:    [161,161,170]  as [number, number, number],
    tablHead:  [39,  39,  42] as [number, number, number],
  },
  gold: {
    primary:   [120, 53,  15] as [number, number, number], // amber-900
    accent:    [217,119,  6]  as [number, number, number], // amber-600
    accent2:   [234,179,  8]  as [number, number, number], // yellow-500
    dark:      [15,  23,  42] as [number, number, number],
    midDark:   [30,  41,  59] as [number, number, number],
    lightBg:   [255,251,235]  as [number, number, number],
    cardBg:    [248,250,252]  as [number, number, number],
    border:    [226,232,240]  as [number, number, number],
    headerTxt: [255,255,255]  as [number, number, number],
    subTxt:    [148,163,184]  as [number, number, number],
    tablHead:  [120, 53,  15] as [number, number, number],
  },
};

const WIN_COLOR  = [16, 185, 129]  as [number, number, number]; // emerald-500
const LOSS_COLOR = [239,  68,  68] as [number, number, number]; // red-500
const MUTED      = [100, 116, 139] as [number, number, number]; // slate-500
const WHITE      = [255, 255, 255] as [number, number, number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rgb(doc: jsPDF, c: [number,number,number], type: 'fill'|'text'|'draw' = 'text') {
  if (type === 'fill')  doc.setFillColor(c[0], c[1], c[2]);
  if (type === 'text')  doc.setTextColor(c[0], c[1], c[2]);
  if (type === 'draw')  doc.setDrawColor(c[0], c[1], c[2]);
}

function bold(doc: jsPDF, size: number) { doc.setFont('helvetica', 'bold'); doc.setFontSize(size); }
function normal(doc: jsPDF, size: number) { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); }

function sectionTitle(
  doc: jsPDF, theme: typeof THEMES['emerald'],
  label: string, y: number, pageWidth: number, margin: number
): number {
  // Colored left bar + title
  const barW = 4;
  rgb(doc, theme.accent, 'fill');
  doc.rect(margin, y, barW, 6.5, 'F');

  bold(doc, 11.5);
  rgb(doc, theme.dark, 'text');
  doc.text(label, margin + barW + 4, y + 5);

  // Full-width hairline below with extra breathing room
  rgb(doc, theme.border, 'draw');
  doc.setLineWidth(0.2);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);
  doc.setLineWidth(0.1);

  return y + 13; // generous gap before first content
}

function pill(
  doc: jsPDF, text: string, x: number, y: number, w: number, h: number,
  bgColor: [number,number,number], textColor: [number,number,number], textSize = 7
) {
  rgb(doc, bgColor, 'fill');
  doc.roundedRect(x, y, w, h, 1.2, 1.2, 'F');
  bold(doc, textSize);
  rgb(doc, textColor, 'text');
  doc.text(text, x + w / 2, y + h / 2 + 2.2, { align: 'center' });
}

function kpiCard(
  doc: jsPDF, theme: typeof THEMES['emerald'],
  label: string, value: string, valueColor: [number,number,number],
  x: number, y: number, w: number, h: number,
  note?: string
) {
  // Card background
  rgb(doc, theme.cardBg, 'fill');
  rgb(doc, theme.border, 'draw');
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Accent top strip (3px)
  rgb(doc, valueColor, 'fill');
  doc.roundedRect(x, y, w, 2.5, 1, 1, 'F');
  doc.rect(x, y + 1.5, w, 1.2, 'F'); // fill bottom corners of strip

  // Label — positioned below strip with clear gap
  normal(doc, 6.5);
  rgb(doc, MUTED, 'text');
  doc.text(label.toUpperCase(), x + 4, y + 9);

  // Value — prominent, well-spaced
  bold(doc, 11);
  rgb(doc, valueColor, 'text');
  doc.text(value, x + 4, y + 18);

  // Note — at bottom with generous gap
  if (note) {
    normal(doc, 6);
    rgb(doc, MUTED, 'text');
    doc.text(note, x + 4, y + h - 4);
  }
}

function tableHeader(
  doc: jsPDF, theme: typeof THEMES['emerald'],
  headers: string[], xPositions: number[],
  y: number, contentWidth: number, margin: number
): number {
  rgb(doc, theme.tablHead, 'fill');
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  bold(doc, 6.5);
  rgb(doc, WHITE, 'text');
  headers.forEach((h, i) => doc.text(h, xPositions[i] + 1.5, y + 4.5));
  return y + 6.5;
}

function tableRow(
  doc: jsPDF, theme: typeof THEMES['emerald'],
  cells: { text: string; color?: [number,number,number]; bold?: boolean }[],
  xPositions: number[],
  y: number, contentWidth: number, margin: number, isAlt: boolean,
  rowH = 6.5
): number {
  if (isAlt) {
    rgb(doc, theme.cardBg, 'fill');
    doc.rect(margin, y, contentWidth, rowH, 'F');
  }
  cells.forEach((cell, i) => {
    if (cell.bold) bold(doc, 6.5); else normal(doc, 6.5);
    rgb(doc, cell.color || theme.dark, 'text');
    doc.text(cell.text, xPositions[i] + 1.5, y + 3.9);
  });
  return y + rowH;
}

// Mini bar chart in PDF (horizontal bars)
function miniBarChart(
  doc: jsPDF,
  entries: { label: string; value: number; color: [number,number,number] }[],
  x: number, y: number, w: number, barH: number, gap: number,
  maxVal: number
) {
  const labelW = 28;
  const valW = 18;
  const barAreaW = w - labelW - valW - 4;

  entries.forEach((e, i) => {
    const barY = y + i * (barH + gap);
    // Label
    normal(doc, 6);
    rgb(doc, MUTED, 'text');
    doc.text(e.label.slice(0, 14), x, barY + barH - 1);
    // Background bar
    rgb(doc, [235, 237, 240], 'fill');
    doc.roundedRect(x + labelW, barY, barAreaW, barH, 0.8, 0.8, 'F');
    // Value bar
    const fillW = maxVal > 0 ? (Math.abs(e.value) / maxVal) * barAreaW : 0;
    rgb(doc, e.color, 'fill');
    if (fillW > 0) doc.roundedRect(x + labelW, barY, fillW, barH, 0.8, 0.8, 'F');
    // Value text
    bold(doc, 6);
    rgb(doc, e.color, 'text');
    const valStr = `${e.value >= 0 ? '+' : ''}$${e.value.toFixed(0)}`;
    doc.text(valStr, x + labelW + barAreaW + 2, barY + barH - 1);
  });
}

// Equity curve drawn as a polyline
function equityCurve(
  doc: jsPDF, theme: typeof THEMES['emerald'],
  trades: Trade[], x: number, y: number, w: number, h: number
) {
  if (trades.length < 2) return;

  // Cumulative equity values
  const sorted = [...trades].sort((a, b) => a.closeTimestamp - b.closeTimestamp);
  let running = 0;
  const equity = sorted.map(t => { running += t.netProfit; return running; });

  const min = Math.min(0, ...equity);
  const max = Math.max(0, ...equity);
  const range = max - min || 1;

  // Background
  rgb(doc, theme.cardBg, 'fill');
  rgb(doc, theme.border, 'draw');
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Zero line
  const zeroY = y + h - ((0 - min) / range) * h;
  rgb(doc, theme.border, 'draw');
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(x + 2, zeroY, x + w - 2, zeroY);
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.1);

  // Equity line
  const pts = equity.map((v, i) => ({
    px: x + 2 + (i / (equity.length - 1)) * (w - 4),
    py: y + h - ((v - min) / range) * (h - 4) - 2,
  }));

  // Fill area
  const isPositive = equity[equity.length - 1] >= 0;
  const fillColor: [number,number,number] = isPositive
    ? [220, 252, 231]
    : [254, 226, 226];
  rgb(doc, fillColor, 'fill');
  const fillPts = [
    `${pts[0].px},${y + h - 2}`,
    ...pts.map(p => `${p.px},${p.py}`),
    `${pts[pts.length-1].px},${y + h - 2}`,
  ];
  // jsPDF doesn't support polygon path directly; approximate with rect fill + line overdraw
  // Draw a simple fill row by row (lightweight)
  pts.forEach((pt, i) => {
    if (i === 0) return;
    const prev = pts[i - 1];
    const topY = Math.min(pt.py, prev.py);
    const fillH = (y + h - 2) - topY;
    if (fillH > 0) {
      rgb(doc, fillColor, 'fill');
      doc.rect(prev.px, topY, pt.px - prev.px, fillH, 'F');
    }
  });

  // Line
  const lineColor: [number,number,number] = isPositive ? WIN_COLOR : LOSS_COLOR;
  rgb(doc, lineColor, 'draw');
  doc.setLineWidth(0.8);
  for (let i = 1; i < pts.length; i++) {
    doc.line(pts[i-1].px, pts[i-1].py, pts[i].px, pts[i].py);
  }
  doc.setLineWidth(0.1);

  // End dot
  const last = pts[pts.length - 1];
  rgb(doc, lineColor, 'fill');
  doc.circle(last.px, last.py, 1.2, 'F');

  // Labels
  bold(doc, 6);
  rgb(doc, MUTED, 'text');
  doc.text('Equity Curve', x + 2.5, y + 4.5);

  const finalVal = equity[equity.length - 1];
  bold(doc, 7);
  rgb(doc, lineColor, 'text');
  doc.text(`${finalVal >= 0 ? '+' : ''}$${finalVal.toFixed(2)}`, x + w - 2, y + 4.5, { align: 'right' });
}

// ─── Main Export Function ─────────────────────────────────────────────────────

export async function exportStatementPdf(
  accountInfo: AccountInfo,
  rawMetrics: TradingMetrics,
  allTrades: Trade[],
  userOptions?: Partial<PdfExportOptions>
) {
  const options: PdfExportOptions = {
    ...defaultPdfExportOptions,
    ...userOptions,
    sections: { ...defaultPdfExportOptions.sections, ...(userOptions?.sections || {}) },
  };

  // ── Filter trades ────────────────────────────────────────────────────────
  let filteredTrades = [...allTrades];
  const now = new Date();
  if (options.dateRange === '30days') {
    const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    filteredTrades = allTrades.filter(t => t.closeTimestamp >= cutoff);
  } else if (options.dateRange === 'thisMonth') {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filteredTrades = allTrades.filter(t => t.closeTime.slice(0, 7).replace(/[./]/g, '-') === prefix);
  } else if (options.dateRange === 'custom' && options.customStartDate && options.customEndDate) {
    const startTs = new Date(options.customStartDate).getTime();
    const endTs   = new Date(options.customEndDate).getTime() + 86400000;
    filteredTrades = allTrades.filter(t => t.closeTimestamp >= startTs && t.closeTimestamp <= endTs);
  }
  if (filteredTrades.length === 0) filteredTrades = [...allTrades];

  const metrics = calculateMetrics(filteredTrades, accountInfo.balance || 10000);
  const theme = THEMES[options.colorTheme || 'emerald'];

  // ── jsPDF dynamic import & init ──────────────────────────────────────────
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();   // 210
  const PH  = doc.internal.pageSize.getHeight();  // 297
  const M   = 14;                                  // margin
  const CW  = PW - M * 2;                          // content width 182
  let y     = 0;

  // ── Display names ─────────────────────────────────────────────────────────
  const displayName    = options.maskAccount ? 'Verified Trader'   : (accountInfo.isDemo ? (accountInfo.name    || 'Marcus Sterling')           : (accountInfo.name    || 'Trader'));
  const displayAccount = options.maskAccount ? `••••${(accountInfo.account || '0000').slice(-4)}` : (accountInfo.isDemo ? (accountInfo.account || '94827105') : (accountInfo.account || 'Account'));
  const displayBroker  = options.maskAccount ? 'Regulated Broker'  : (accountInfo.isDemo ? (accountInfo.broker  || 'Apex Capital Markets Ltd')  : (accountInfo.broker  || 'Trading Account'));
  const platform       = accountInfo.platform || 'MT5';

  // ── Helpers ───────────────────────────────────────────────────────────────
  const checkSpace = (needed: number) => {
    if (y + needed > PH - 18) {
      doc.addPage();
      y = M;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    // Slim running header bar
    rgb(doc, theme.primary, 'fill');
    doc.rect(0, 0, PW, 8, 'F');
    bold(doc, 6);
    rgb(doc, [255,255,255], 'text');
    doc.text('TradeScrapbook  •  Performance Statement', M, 5.5);
    doc.text(`${displayName}  ·  #${displayAccount}  ·  ${new Date().toLocaleDateString()}`, PW - M, 5.5, { align: 'right' });
    y = 12;
  };

  // ============================================================
  // PAGE 1: COVER PAGE
  // ============================================================

  // Full dark header panel — taller for better breathing room
  const coverH = 140;
  rgb(doc, theme.primary, 'fill');
  doc.rect(0, 0, PW, coverH, 'F');

  // Decorative accent stripe at top
  rgb(doc, theme.accent, 'fill');
  doc.rect(0, 0, PW, 5, 'F');

  // Decorative circle ornaments (subtle, top-right)
  doc.setGState(doc.GState({ opacity: 0.05 }));
  doc.setFillColor(255, 255, 255);
  doc.circle(PW - 18, 22, 52, 'F');
  doc.circle(PW + 8, 88, 58, 'F');
  doc.setGState(doc.GState({ opacity: 1.0 }));

  // ── Brand Logo block (top-left) ───────────────────────────────
  bold(doc, 24);
  rgb(doc, WHITE, 'text');
  doc.text('TradeScrapbook', M, 26);

  bold(doc, 7.5);
  rgb(doc, theme.accent, 'text');
  doc.text('INSTITUTIONAL PERFORMANCE REPORT  ·  tradescrapbook.com', M, 33);

  // Accent divider line
  rgb(doc, theme.accent, 'draw');
  doc.setLineWidth(0.6);
  doc.line(M, 37, M + 70, 37);
  doc.setLineWidth(0.1);

  // ── Trader info block (left column) ──────────────────────────
  bold(doc, 17);
  rgb(doc, WHITE, 'text');
  doc.text(displayName, M, 50);

  normal(doc, 9);
  rgb(doc, [203, 213, 225], 'text');
  doc.text(`Account  #${displayAccount}`, M, 59);
  doc.text(displayBroker, M, 67);

  const nowStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  normal(doc, 8);
  rgb(doc, [148, 163, 184], 'text');
  doc.text(`Generated: ${nowStr}`, M, 75);

  // Platform + type pills
  const pX = M;
  const pY = 82;
  pill(doc, platform, pX, pY, 24, 9, theme.accent, theme.primary, 7.5);
  pill(doc, accountInfo.isDemo ? 'DEMO' : 'LIVE ACCOUNT', pX + 27, pY, accountInfo.isDemo ? 22 : 38, 9, theme.accent2, theme.primary, 7);
  if (accountInfo.accountType) {
    const typeClean = accountInfo.accountType.replace(/[()]/g, '').replace(/,/g, ' ·').trim().slice(0, 28);
    const typeW = Math.min(85, typeClean.length * 1.8 + 8);
    pill(doc, typeClean, pX + (accountInfo.isDemo ? 52 : 68), pY, typeW, 9, [30, 41, 59], [180, 195, 215], 6.5);
  }

  // ── Hero stats (right column) ─────────────────────────────────
  const isProfit = metrics.netProfit >= 0;
  bold(doc, 30);
  rgb(doc, isProfit ? WIN_COLOR : LOSS_COLOR, 'text');
  const heroVal = `${isProfit ? '+' : ''}$${metrics.netProfit.toFixed(2)}`;
  doc.text(heroVal, PW - M, 54, { align: 'right' });

  bold(doc, 7.5);
  rgb(doc, [148, 163, 184], 'text');
  doc.text('NET PROFIT / LOSS', PW - M, 61, { align: 'right' });

  // Divider between hero stats
  rgb(doc, [255, 255, 255], 'draw');
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.setLineWidth(0.3);
  doc.line(PW - M - 55, 65, PW - M, 65);
  doc.setLineWidth(0.1);
  doc.setGState(doc.GState({ opacity: 1.0 }));

  bold(doc, 15);
  rgb(doc, metrics.winRate >= 50 ? WIN_COLOR : LOSS_COLOR, 'text');
  doc.text(`${metrics.winRate}%`, PW - M, 76, { align: 'right' });
  bold(doc, 7);
  rgb(doc, [148, 163, 184], 'text');
  doc.text('WIN RATE', PW - M, 82, { align: 'right' });

  bold(doc, 9);
  rgb(doc, [180, 195, 215], 'text');
  doc.text(`${metrics.totalTrades} Positions  ·  ${metrics.totalVolume.toFixed(2)} Lots`, PW - M, 92, { align: 'right' });
  doc.text(`${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent}% Return`, PW - M, 100, { align: 'right' });

  // ── Cover summary KPI cards (below the dark panel) ────────────
  y = coverH + 12;
  const cardW = (CW - 9) / 4;
  const cardH = 34;

  const coverKpis = [
    { label: 'Profit Factor',  value: `${metrics.profitFactor}×`,         color: metrics.profitFactor >= 1.5 ? WIN_COLOR : MUTED,       note: metrics.profitFactor >= 1.5 ? 'Excellent edge' : 'Needs improvement' },
    { label: 'Expectancy',     value: `$${metrics.expectancy}`,            color: metrics.expectancy >= 0 ? WIN_COLOR : LOSS_COLOR,      note: 'Avg gain per trade' },
    { label: 'Max Drawdown',   value: `-${metrics.maxDrawdownPercent}%`,   color: LOSS_COLOR,                                             note: `-$${metrics.maxDrawdownDollars.toFixed(0)} peak→trough` },
    { label: 'Sharpe Ratio',   value: `${metrics.sharpeRatio}`,            color: metrics.sharpeRatio >= 1 ? WIN_COLOR : MUTED,          note: metrics.sharpeRatio >= 1 ? 'Risk-adjusted: Good' : 'Improve consistency' },
  ];
  coverKpis.forEach((kpi, i) => {
    kpiCard(doc, theme, kpi.label, kpi.value, kpi.color as [number,number,number], M + i * (cardW + 3), y, cardW, cardH, kpi.note);
  });
  y += cardH + 10;

  // ── Equity curve (full width, below KPI cards) ────────────────
  checkSpace(54);
  equityCurve(doc, theme, filteredTrades, M, y, CW, 48);
  y += 58;

  // ============================================================
  // SECTION: OVERVIEW KPI SCORECARD
  // ============================================================
  if (options.sections.overview) {
    checkSpace(10);
    y = sectionTitle(doc, theme, 'Executive KPI Scorecard', y, PW, M);

    const kpis = [
      { label: 'Net Profit',      value: `${metrics.netProfit >= 0 ? '+' : ''}$${metrics.netProfit.toFixed(2)}`,  color: metrics.netProfit >= 0 ? WIN_COLOR : LOSS_COLOR },
      { label: 'Win Rate',        value: `${metrics.winRate}%`,            color: metrics.winRate >= 50 ? WIN_COLOR : LOSS_COLOR },
      { label: 'Profit Factor',   value: `${metrics.profitFactor}×`,       color: metrics.profitFactor >= 1.2 ? WIN_COLOR : MUTED },
      { label: 'Total Trades',    value: `${metrics.totalTrades}`,          color: theme.dark },
      { label: 'Gross Profit',    value: `+$${metrics.grossProfit.toFixed(2)}`, color: WIN_COLOR },
      { label: 'Gross Loss',      value: `-$${metrics.grossLoss.toFixed(2)}`,   color: LOSS_COLOR },
      { label: 'Avg Win',         value: `+$${metrics.avgWin.toFixed(2)}`,  color: WIN_COLOR },
      { label: 'Avg Loss',        value: `-$${metrics.avgLoss.toFixed(2)}`, color: LOSS_COLOR },
      { label: 'Max Drawdown',    value: `-${metrics.maxDrawdownPercent}%`, color: LOSS_COLOR },
      { label: 'Expectancy',      value: `$${metrics.expectancy}/trade`,   color: metrics.expectancy >= 0 ? WIN_COLOR : LOSS_COLOR },
      { label: 'Sharpe Ratio',    value: `${metrics.sharpeRatio}`,          color: metrics.sharpeRatio >= 1 ? WIN_COLOR : MUTED },
      { label: 'Max Win Streak',  value: `${metrics.maxWinStreak} wins`,   color: WIN_COLOR },
      { label: 'Max Loss Streak', value: `${metrics.maxLossStreak} losses`, color: LOSS_COLOR },
      { label: 'Win/Loss Ratio',  value: `${metrics.winLossRatio}×`,       color: theme.dark },
      { label: 'Total Volume',    value: `${metrics.totalVolume.toFixed(2)} lots`, color: theme.dark },
      { label: 'Total Return',    value: `${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent}%`, color: metrics.totalReturnPercent >= 0 ? WIN_COLOR : LOSS_COLOR },
    ];

    const cols = 4;
    const kW   = (CW - (cols - 1) * 2) / cols;
    const kH   = 28;
    const rowH = kH + 3;

    kpis.forEach((kpi, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      if (col === 0 && row > 0) checkSpace(rowH + 2);
      kpiCard(doc, theme, kpi.label, kpi.value, kpi.color as [number,number,number],
        M + col * (kW + 2), y + row * rowH, kW, kH);
    });

    const totalRows = Math.ceil(kpis.length / cols);
    y += totalRows * rowH + 6;

    // Long vs Short split
    checkSpace(22);
    rgb(doc, theme.cardBg, 'fill');
    rgb(doc, theme.border, 'draw');
    doc.roundedRect(M, y, CW, 18, 2, 2, 'FD');

    // Long bar
    const barW2 = (CW - 16) / 2 - 4;
    bold(doc, 7.5);
    rgb(doc, WIN_COLOR, 'text');
    doc.text(`▲ LONG TRADES`, M + 4, y + 6);
    normal(doc, 6.5);
    rgb(doc, MUTED, 'text');
    doc.text(`${metrics.longTrades} trades · ${metrics.longWinRate}% win rate · ${metrics.longWins} wins`, M + 4, y + 12);

    bold(doc, 7.5);
    rgb(doc, LOSS_COLOR, 'text');
    doc.text(`▼ SHORT TRADES`, M + CW / 2 + 4, y + 6);
    normal(doc, 6.5);
    rgb(doc, MUTED, 'text');
    doc.text(`${metrics.shortTrades} trades · ${metrics.shortWinRate}% win rate · ${metrics.shortWins} wins`, M + CW / 2 + 4, y + 12);

    // Vertical divider
    rgb(doc, theme.border, 'draw');
    doc.line(M + CW / 2, y + 3, M + CW / 2, y + 15);

    y += 24;
  }

  // ============================================================
  // SECTION: PERFORMANCE CALENDAR
  // ============================================================
  if (options.sections.calendar) {
    checkSpace(20);
    y = sectionTitle(doc, theme, 'Performance Calendar & Monthly Heatmap', y, PW, M);

    const months = getMonthsBreakdown(filteredTrades);

    months.forEach((monthData) => {
      checkSpace(72);

      // Month header pill
      rgb(doc, monthData.netProfit >= 0 ? theme.lightBg : [255, 241, 242], 'fill');
      rgb(doc, monthData.netProfit >= 0 ? theme.accent : LOSS_COLOR, 'draw');
      doc.roundedRect(M, y, CW, 7, 1.5, 1.5, 'FD');

      bold(doc, 8.5);
      rgb(doc, theme.dark, 'text');
      doc.text(monthData.name, M + 4, y + 5);

      const monthPnlStr = `${monthData.netProfit >= 0 ? '+' : ''}$${monthData.netProfit.toFixed(2)}`;
      bold(doc, 8);
      rgb(doc, monthData.netProfit >= 0 ? WIN_COLOR : LOSS_COLOR, 'text');
      doc.text(monthPnlStr, M + 78, y + 5);

      normal(doc, 7);
      rgb(doc, MUTED, 'text');
      doc.text(`${monthData.winRate}% WR  ·  ${monthData.totalTrades} trades  ·  ${monthData.winCount}W / ${monthData.lossCount}L`, M + 108, y + 5);
      y += 8;

      // Day-of-week header
      const dayColW = CW / 7;
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      rgb(doc, theme.midDark, 'fill');
      doc.rect(M, y, CW, 5, 'F');
      bold(doc, 6.5);
      rgb(doc, WHITE, 'text');
      dayNames.forEach((d, i) => doc.text(d, M + i * dayColW + dayColW / 2, y + 3.6, { align: 'center' }));
      y += 5;

      // Calendar cells
      let startCol = (monthData.firstDayOfWeek + 6) % 7;
      let curCol = startCol;
      let curRowY = y;
      const cellH = 11;

      // Blank leading cells
      for (let b = 0; b < startCol; b++) {
        rgb(doc, [250, 250, 252], 'fill');
        rgb(doc, [238, 240, 244], 'draw');
        doc.rect(M + b * dayColW, curRowY, dayColW, cellH, 'FD');
      }

      for (let d = 1; d <= monthData.daysInMonth; d++) {
        const dateStr = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = monthData.dailySummaries[dateStr];
        const cellX = M + curCol * dayColW;

        if (dayData && dayData.tradesCount > 0) {
          const isP = dayData.netProfit >= 0;
          // Intensity-based alpha tint
          const alpha = Math.min(0.95, 0.25 + Math.abs(dayData.netProfit) / 200);
          const r = isP ? Math.round(220 + (1 - alpha) * 35) : Math.round(254 - (1 - alpha) * 10);
          const g = isP ? Math.round(252 - (1 - alpha) * 30) : Math.round(226 - (1 - alpha) * 30);
          const b2 = isP ? Math.round(231 - (1 - alpha) * 30) : Math.round(226 - (1 - alpha) * 30);

          doc.setFillColor(r, g, b2);
          rgb(doc, isP ? WIN_COLOR : LOSS_COLOR, 'draw');
          doc.rect(cellX, curRowY, dayColW, cellH, 'FD');

          // Day number
          bold(doc, 6.5);
          rgb(doc, [51, 65, 85], 'text');
          doc.text(`${d}`, cellX + 1.5, curRowY + 4);

          // P&L
          bold(doc, 6.5);
          rgb(doc, isP ? WIN_COLOR : LOSS_COLOR, 'text');
          const dayPnl = `${isP ? '+' : ''}$${Math.round(Math.abs(dayData.netProfit))}`;
          doc.text(dayPnl, cellX + dayColW - 1.5, curRowY + 7, { align: 'right' });

          // Trade count
          normal(doc, 5.5);
          rgb(doc, [100, 116, 139], 'text');
          doc.text(`${dayData.tradesCount}t`, cellX + dayColW - 1.5, curRowY + 10.5, { align: 'right' });

        } else {
          doc.setFillColor(252, 252, 254);
          rgb(doc, [238, 240, 244], 'draw');
          doc.rect(cellX, curRowY, dayColW, cellH, 'FD');
          normal(doc, 6);
          rgb(doc, [200, 210, 220], 'text');
          doc.text(`${d}`, cellX + 1.5, curRowY + 4);
        }

        curCol++;
        if (curCol === 7) { curCol = 0; curRowY += cellH; }
      }

      // Trailing blank cells
      if (curCol > 0) {
        while (curCol < 7) {
          rgb(doc, [250, 250, 252], 'fill');
          rgb(doc, [238, 240, 244], 'draw');
          doc.rect(M + curCol * dayColW, curRowY, dayColW, cellH, 'FD');
          curCol++;
        }
        curRowY += cellH;
      }

      y = curRowY + 6;
    });

    // Monthly summary table
    checkSpace(30);
    bold(doc, 8);
    rgb(doc, theme.dark, 'text');
    doc.text('Monthly Performance Breakdown', M, y);
    y += 4;

    const mHdrs = ['Month', 'Trades', 'Win %', 'Winners', 'Gross Profit', 'Gross Loss', 'Net P&L', 'Best Day', 'Worst Day'];
    const mX    = [M, M+28, M+47, M+62, M+78, M+106, M+130, M+153, M+170];
    y = tableHeader(doc, theme, mHdrs, mX, y, CW, M);

    getMonthsBreakdown(filteredTrades).forEach((m, i) => {
      checkSpace(7);
      y = tableRow(doc, theme, [
        { text: m.name },
        { text: `${m.totalTrades}` },
        { text: `${m.winRate}%`, color: m.winRate >= 50 ? WIN_COLOR : LOSS_COLOR },
        { text: `${m.winCount}W / ${m.lossCount}L` },
        { text: `+$${m.grossProfit.toFixed(0)}`, color: WIN_COLOR },
        { text: `-$${m.grossLoss.toFixed(0)}`, color: LOSS_COLOR },
        { text: `${m.netProfit >= 0 ? '+' : ''}$${m.netProfit.toFixed(2)}`, color: m.netProfit >= 0 ? WIN_COLOR : LOSS_COLOR, bold: true },
        { text: m.bestDay.date !== '-' ? `+$${Math.round(m.bestDay.pnl)}` : '-', color: WIN_COLOR },
        { text: m.worstDay.date !== '-' ? `-$${Math.round(Math.abs(m.worstDay.pnl || 0))}` : '-', color: LOSS_COLOR },
      ], mX, y, CW, M, i % 2 === 0, 6);
    });

    y += 8;
  }

  // ============================================================
  // SECTION: DEEP ANALYTICS
  // ============================================================
  if (options.sections.deepAnalytics) {
    checkSpace(20);
    y = sectionTitle(doc, theme, 'Deep Statistical Analytics & Edge Breakdown', y, PW, M);

    // Symbol performance mini bar chart (left) + Day-of-week table (right)
    const symbols    = getSymbolBreakdown(filteredTrades);
    const dayOfWeek  = getDayOfWeekBreakdown(filteredTrades);
    const maxSymPnl  = Math.max(...symbols.map(s => Math.abs(s.pnl)), 1);

    const leftW  = CW * 0.55 - 2;
    const rightW = CW * 0.45 - 2;

    // Symbol bar chart
    bold(doc, 7.5);
    rgb(doc, theme.dark, 'text');
    doc.text('Instrument Net P&L Ranking', M, y);

    const barH  = 6;
    const barGp = 2;
    const barTopY = y + 4;
    const visibleSymbols = symbols.slice(0, 10);

    miniBarChart(doc, visibleSymbols.map(s => ({
      label: s.symbol,
      value: s.pnl,
      color: s.pnl >= 0 ? WIN_COLOR : LOSS_COLOR,
    })), M, barTopY, leftW, barH, barGp, maxSymPnl);

    y += 4 + visibleSymbols.length * (barH + barGp) + 6;

    // Symbol detail table
    checkSpace(10);
    const sHdrs = ['Symbol', 'Trades', 'Win %', 'Avg Win', 'Avg Loss', 'Net P&L', 'PF'];
    const sX    = [M, M+25, M+43, M+62, M+88, M+114, M+145];
    y = tableHeader(doc, theme, sHdrs, sX, y, CW, M);

    symbols.forEach((s, i) => {
      checkSpace(6.5);
      y = tableRow(doc, theme, [
        { text: s.symbol, bold: true },
        { text: `${s.trades}` },
        { text: `${s.winRate}%`, color: s.winRate >= 50 ? WIN_COLOR : LOSS_COLOR },
        { text: `+$${(s.grossProfit / Math.max(s.wins, 1)).toFixed(0)}`, color: WIN_COLOR },
        { text: `-$${(s.grossLoss   / Math.max(s.trades - s.wins, 1)).toFixed(0)}`, color: LOSS_COLOR },
        { text: `${s.pnl >= 0 ? '+' : ''}$${s.pnl.toFixed(2)}`, color: s.pnl >= 0 ? WIN_COLOR : LOSS_COLOR, bold: true },
        { text: `${s.profitFactor}×`, color: s.profitFactor >= 1.2 ? WIN_COLOR : MUTED },
      ], sX, y, CW, M, i % 2 === 0);
    });

    y += 6;

    // Day-of-week table
    if (dayOfWeek && dayOfWeek.length > 0) {
      checkSpace(18);
      bold(doc, 7.5);
      rgb(doc, theme.dark, 'text');
      doc.text('Day-of-Week Edge Analysis', M, y);
      y += 3;

      const dHdrs = ['Day', 'Trades', 'Win %', 'Avg P&L', 'Total P&L', 'Best', 'Verdict'];
      const dX    = [M, M+22, M+40, M+58, M+82, M+110, M+138];
      y = tableHeader(doc, theme, dHdrs, dX, y, CW, M);

      dayOfWeek.forEach((d, i) => {
        checkSpace(6);
        const verdict = d.winRate >= 60 ? 'STRONG EDGE' : d.winRate >= 50 ? 'Positive' : d.winRate >= 40 ? 'Marginal' : 'AVOID';
        const verdictColor = d.winRate >= 60 ? WIN_COLOR : d.winRate >= 50 ? WIN_COLOR : d.winRate >= 40 ? MUTED : LOSS_COLOR;
        y = tableRow(doc, theme, [
          { text: d.day, bold: true },
          { text: `${d.trades}` },
          { text: `${d.winRate}%`, color: d.winRate >= 50 ? WIN_COLOR : LOSS_COLOR },
          { text: `${d.pnl >= 0 ? '+' : ''}$${d.trades > 0 ? (d.pnl / d.trades).toFixed(2) : '0.00'}`, color: d.pnl >= 0 ? WIN_COLOR : LOSS_COLOR },
          { text: `${d.pnl >= 0 ? '+' : ''}$${d.pnl.toFixed(2)}`, color: d.pnl >= 0 ? WIN_COLOR : LOSS_COLOR, bold: true },
          { text: '-', color: WIN_COLOR },
          { text: verdict, color: verdictColor, bold: true },
        ], dX, y, CW, M, i % 2 === 0);
      });

      y += 8;
    }
  }

  // ============================================================
  // SECTION: AI PSYCHOLOGY & DISCIPLINE AUDIT
  // ============================================================
  if (options.sections.aiCoach) {
    checkSpace(55);
    y = sectionTitle(doc, theme, 'Psychology & Discipline Audit', y, PW, M);

    // Compute discipline metrics
    let revengeCount = 0;
    for (let i = 0; i < filteredTrades.length - 1; i++) {
      if (filteredTrades[i].netProfit < 0) {
        const diffMin = (filteredTrades[i + 1].openTimestamp - filteredTrades[i].closeTimestamp) / 60000;
        if (diffMin >= 0 && diffMin <= 15) revengeCount++;
      }
    }
    const tradesWithSL = filteredTrades.filter(t => t.sl !== null && t.sl !== undefined && (t.sl as number) > 0).length;
    const slPct = filteredTrades.length > 0 ? (tradesWithSL / filteredTrades.length) * 100 : 100;
    const disciplineScore = Math.min(100, Math.max(30, Math.round((slPct * 0.35) + Math.max(0, 35 - revengeCount * 10) + 30)));

    // Score ring (simple circle gauge look)
    const cx = M + 22;
    const cy = y + 22;
    const cr = 16;

    // Outer track
    rgb(doc, theme.border, 'draw');
    doc.setLineWidth(3);
    doc.circle(cx, cy, cr, 'S');

    // Score arc (approximate with filled arc color)
    const scoreColor: [number,number,number] = disciplineScore >= 70 ? WIN_COLOR : disciplineScore >= 50 ? [217, 119, 6] : LOSS_COLOR;
    rgb(doc, scoreColor, 'draw');
    doc.setLineWidth(3);
    // Approximate arc by drawing overlapping short lines in a circle pattern
    const totalAngle = (disciplineScore / 100) * 360;
    for (let angle = -90; angle < -90 + totalAngle; angle += 3) {
      const rad1 = (angle * Math.PI) / 180;
      const rad2 = ((angle + 4) * Math.PI) / 180;
      doc.line(
        cx + Math.cos(rad1) * cr, cy + Math.sin(rad1) * cr,
        cx + Math.cos(rad2) * cr, cy + Math.sin(rad2) * cr
      );
    }
    doc.setLineWidth(0.1);

    // Score text
    bold(doc, 16);
    rgb(doc, scoreColor, 'text');
    doc.text(`${disciplineScore}`, cx, cy + 2, { align: 'center' });
    normal(doc, 5.5);
    rgb(doc, MUTED, 'text');
    doc.text('/100', cx, cy + 6, { align: 'center' });

    // Discipline breakdown
    const auditX = M + 44;
    const auditItems = [
      {
        label: 'Revenge Trading',
        text: revengeCount === 0 ? '✓ None detected' : `⚠ ${revengeCount} rapid entries after losses`,
        color: revengeCount === 0 ? WIN_COLOR : LOSS_COLOR,
        note: 'Trade opened within 15min of a loss = revenge flag',
      },
      {
        label: 'Stop-Loss Coverage',
        text: `${slPct.toFixed(0)}% of trades have SL set`,
        color: slPct >= 80 ? WIN_COLOR : slPct >= 50 ? [217, 119, 6] as [number,number,number] : LOSS_COLOR,
        note: `${tradesWithSL} / ${filteredTrades.length} positions protected`,
      },
      {
        label: 'Hold Time Efficiency',
        text: `Avg ${metrics.avgHoldTimeMinutes}m per trade`,
        color: theme.dark,
        note: `Max win streak: ${metrics.maxWinStreak} · Max loss streak: ${metrics.maxLossStreak}`,
      },
      {
        label: 'Capital Protection',
        text: `Max drawdown: -${metrics.maxDrawdownPercent}%  (-$${metrics.maxDrawdownDollars.toFixed(0)})`,
        color: metrics.maxDrawdownPercent <= 5 ? WIN_COLOR : metrics.maxDrawdownPercent <= 10 ? [217, 119, 6] as [number,number,number] : LOSS_COLOR,
        note: metrics.maxDrawdownPercent <= 5 ? 'Excellent risk control' : metrics.maxDrawdownPercent <= 10 ? 'Within prop firm limits' : 'Review risk per trade',
      },
    ];

    auditItems.forEach((item, i) => {
      const itemY = y + i * 11;
      bold(doc, 7);
      rgb(doc, item.color as [number,number,number], 'text');
      doc.text(item.text, auditX, itemY + 4.5);
      normal(doc, 6);
      rgb(doc, MUTED, 'text');
      doc.text(`${item.label}: ${item.note}`, auditX, itemY + 9);
    });

    y += 50;

    // AI Insights
    checkSpace(10);
    const insights = getAIInsights(filteredTrades, metrics);
    if (insights.length > 0) {
      bold(doc, 7.5);
      rgb(doc, theme.dark, 'text');
      doc.text('AI Coach Recommendations', M, y);
      y += 4;

      insights.slice(0, 5).forEach((ins) => {
        checkSpace(14);
        const isWarn = ins.type === 'warning';
        const isSucc = ins.type === 'success';
        const bgColor: [number,number,number] = isWarn ? [255, 247, 237] : isSucc ? [240, 253, 244] : [248, 250, 252];
        const lineColor: [number,number,number] = isWarn ? [217, 119, 6] : isSucc ? WIN_COLOR : theme.accent;

        rgb(doc, bgColor, 'fill');
        rgb(doc, lineColor, 'draw');
        doc.roundedRect(M, y, CW, 12, 1.5, 1.5, 'FD');

        // Left accent bar
        rgb(doc, lineColor, 'fill');
        doc.roundedRect(M, y, 2.5, 12, 1, 1, 'F');
        doc.rect(M, y + 5, 2.5, 7, 'F');

        bold(doc, 7);
        rgb(doc, theme.dark, 'text');
        doc.text(ins.title, M + 5, y + 5);
        normal(doc, 6.5);
        rgb(doc, MUTED, 'text');
        const lines = doc.splitTextToSize(ins.description, CW - 10);
        doc.text(lines[0] || '', M + 5, y + 9.5);

        y += 14;
      });
    }

    y += 4;
  }

  // ============================================================
  // SECTION: PROP FIRM COMPLIANCE
  // ============================================================
  if (options.sections.propFirm) {
    checkSpace(30);
    y = sectionTitle(doc, theme, 'Prop Firm Evaluation Monitor (FTMO / The5ers)', y, PW, M);

    const rules = getPropFirmRules(filteredTrades, accountInfo.balance || 10000);

    const rHdrs = ['Evaluation Rule', 'Allowed', 'Current', 'Used %', 'Compliance'];
    const rX    = [M, M+72, M+98, M+120, M+148];
    y = tableHeader(doc, theme, rHdrs, rX, y, CW, M);

    rules.forEach((rule, i) => {
      checkSpace(7);
      const isPassed  = rule.status === 'passed';
      const isViolated = rule.status === 'violated';
      const used  = rule.limit > 0 ? Math.round((rule.current / rule.limit) * 100) : 0;
      const statusColor: [number,number,number] = isPassed ? WIN_COLOR : isViolated ? LOSS_COLOR : [217, 119, 6];
      const statusText = isPassed ? '✓ PASSED' : isViolated ? '✗ BREACHED' : '⚡ IN PROGRESS';

      // Row with progress bar for used %
      if (i % 2 === 0) {
        rgb(doc, theme.cardBg, 'fill');
        doc.rect(M, y, CW, 6.5, 'F');
      }

      normal(doc, 6.5);
      rgb(doc, theme.dark, 'text');
      doc.text(rule.name, rX[0] + 1.5, y + 4.5);
      doc.text(`${rule.limit}%`, rX[1] + 1.5, y + 4.5);
      doc.text(`${rule.current}%`, rX[2] + 1.5, y + 4.5);

      // Mini progress bar
      const pbW = 22;
      const pbH = 2.5;
      const pbY = y + 2.5;
      rgb(doc, theme.border, 'fill');
      doc.roundedRect(rX[3] + 1.5, pbY, pbW, pbH, 0.6, 0.6, 'F');
      const fillPct = Math.min(1, used / 100);
      rgb(doc, statusColor, 'fill');
      if (fillPct > 0) doc.roundedRect(rX[3] + 1.5, pbY, pbW * fillPct, pbH, 0.6, 0.6, 'F');

      bold(doc, 6.5);
      rgb(doc, statusColor, 'text');
      doc.text(statusText, rX[4] + 1.5, y + 4.5);

      y += 6.5;
    });

    y += 8;
  }

  // ============================================================
  // SECTION: TRADE EXECUTION JOURNAL
  // ============================================================
  if (options.sections.tradeJournal) {
    checkSpace(20);
    y = sectionTitle(doc, theme, `Full Trade Execution Journal  (${filteredTrades.length} Positions)`, y, PW, M);

    const jHdrs = ['#', 'Date/Time', 'Sym', 'Side', 'Vol', 'Entry', 'Exit', 'Hold', 'Pips', 'P&L', 'Grade', 'Tag'];
    const jX    = [M, M+12, M+42, M+56, M+69, M+80, M+98, M+116, M+131, M+143, M+158, M+167];

    const printJHeader = () => {
      y = tableHeader(doc, theme, jHdrs, jX, y, CW, M);
    };

    printJHeader();

    filteredTrades.forEach((trade, idx) => {
      const rowH = (options.includeNotes && trade.notes) ? 11 : 5.5;
      if (y + rowH > PH - 14) {
        doc.addPage();
        y = M;
        renderPageHeader();
        printJHeader();
      }

      if (idx % 2 === 0) {
        rgb(doc, theme.cardBg, 'fill');
        doc.rect(M, y, CW, rowH, 'F');
      }

      normal(doc, 6);
      rgb(doc, MUTED, 'text');
      doc.text(`#${trade.id.slice(-6)}`, jX[0] + 1, y + 3.8);
      doc.text(trade.closeTime.slice(5, 16), jX[1] + 1, y + 3.8);

      bold(doc, 6);
      rgb(doc, theme.dark, 'text');
      doc.text(trade.symbol, jX[2] + 1, y + 3.8);

      // Side pill
      const sideColor: [number,number,number] = trade.type === 'buy' ? WIN_COLOR : LOSS_COLOR;
      pill(doc, trade.type === 'buy' ? '▲ L' : '▼ S', jX[3] + 1, y + 0.8, 10, 4.5, trade.type === 'buy' ? [220, 252, 231] : [254, 226, 226], sideColor, 5.5);

      normal(doc, 6);
      rgb(doc, theme.dark, 'text');
      doc.text(trade.volume.toFixed(2), jX[4] + 1, y + 3.8);
      doc.text(trade.openPrice.toFixed(trade.symbol.includes('JPY') ? 3 : 4), jX[5] + 1, y + 3.8);
      doc.text(trade.closePrice.toFixed(trade.symbol.includes('JPY') ? 3 : 4), jX[6] + 1, y + 3.8);
      rgb(doc, MUTED, 'text');
      doc.text(trade.durationFormatted, jX[7] + 1, y + 3.8);

      // Pips
      rgb(doc, trade.pips >= 0 ? WIN_COLOR : LOSS_COLOR, 'text');
      doc.text(`${trade.pips >= 0 ? '+' : ''}${trade.pips}`, jX[8] + 1, y + 3.8);

      // P&L
      bold(doc, 6.5);
      rgb(doc, trade.netProfit >= 0 ? WIN_COLOR : LOSS_COLOR, 'text');
      doc.text(`${trade.netProfit >= 0 ? '+' : ''}$${trade.netProfit.toFixed(2)}`, jX[9] + 1, y + 3.8);

      // Grade
      if (trade.executionGrade) {
        const gc: Record<string, [number,number,number]> = { A: WIN_COLOR, B: [59, 130, 246], C: [217, 119, 6], D: [249, 115, 22], F: LOSS_COLOR };
        bold(doc, 6);
        rgb(doc, gc[trade.executionGrade] || MUTED, 'text');
        doc.text(trade.executionGrade, jX[10] + 1, y + 3.8);
      } else {
        normal(doc, 6);
        rgb(doc, MUTED, 'text');
        doc.text('—', jX[10] + 1, y + 3.8);
      }

      // Tag
      normal(doc, 6);
      rgb(doc, theme.accent, 'text');
      doc.text(trade.tags && trade.tags.length > 0 ? trade.tags[0].slice(0, 10) : '—', jX[11] + 1, y + 3.8);

      y += 5.5;

      // Notes row
      if (options.includeNotes && trade.notes) {
        if (y + 5 > PH - 14) {
          doc.addPage(); y = M; renderPageHeader(); printJHeader();
        }
        normal(doc, 5.5);
        rgb(doc, MUTED, 'text');
        const noteLines = doc.splitTextToSize(`↳ ${trade.notes}`, CW - 14);
        doc.text(noteLines[0] || '', jX[1] + 1, y + 3);
        y += 5;
      }
    });
  }

  // ============================================================
  // PAGE FOOTERS
  // ============================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom accent bar
    rgb(doc, theme.primary, 'fill');
    doc.rect(0, PH - 10, PW, 10, 'F');

    normal(doc, 6);
    rgb(doc, [148, 163, 184], 'text');
    doc.text('100% Client-Side · No data leaves your browser · tradescrapbook.com', M, PH - 4.5);
    doc.text(`Page ${i} of ${totalPages}  ·  Powered by TradeScrapbook`, PW - M, PH - 4.5, { align: 'right' });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const safeAccount = options.maskAccount ? 'Anonymous' : (accountInfo.account || 'Statement').replace(/[^a-zA-Z0-9_-]/g, '');
  const dateStr     = new Date().toISOString().slice(0, 10);
  doc.save(`TradeScrapbook_Statement_${safeAccount}_${dateStr}.pdf`);
}
