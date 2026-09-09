import jsPDF from 'jspdf';
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
  colorTheme: 'emerald' | 'navy' | 'monochrome';
}

export const defaultPdfExportOptions: PdfExportOptions = {
  title: 'TradeScrapbook Institutional Performance Report',
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

export function exportStatementPdf(
  accountInfo: AccountInfo,
  rawMetrics: TradingMetrics,
  allTrades: Trade[],
  userOptions?: Partial<PdfExportOptions>
) {
  const options: PdfExportOptions = {
    ...defaultPdfExportOptions,
    ...userOptions,
    sections: {
      ...defaultPdfExportOptions.sections,
      ...(userOptions?.sections || {}),
    },
  };

  // 1. Filter trades based on dateRange
  let filteredTrades = [...allTrades];
  const now = new Date();

  if (options.dateRange === '30days') {
    const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    filteredTrades = allTrades.filter(t => t.closeTimestamp >= cutoff);
  } else if (options.dateRange === 'thisMonth') {
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filteredTrades = allTrades.filter(t => t.closeTime.slice(0, 7).replace(/[./]/g, '-') === currentMonthPrefix);
  } else if (options.dateRange === 'custom' && options.customStartDate && options.customEndDate) {
    const startTs = new Date(options.customStartDate).getTime();
    const endTs = new Date(options.customEndDate).getTime() + 86400000;
    filteredTrades = allTrades.filter(t => t.closeTimestamp >= startTs && t.closeTimestamp <= endTs);
  }

  // Fallback to all trades if filtered is empty
  if (filteredTrades.length === 0) {
    filteredTrades = [...allTrades];
  }

  // Re-calculate metrics for the active trade scope
  const metrics = calculateMetrics(filteredTrades, accountInfo.balance || 10000);

  // Initialize PDF (A4 Portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Theme palette
  const theme = {
    emerald: {
      primary: [6, 95, 70], // #065F46
      accent: [16, 185, 129], // #10B981
      dark: [15, 23, 42], // #0F172A
      lightBg: [240, 253, 244], // #F0FDF4
      cardBg: [248, 250, 252], // #F8FAFC
      border: [226, 232, 240], // #E2E8F0
    },
    navy: {
      primary: [15, 23, 42], // #0F172A
      accent: [79, 70, 229], // #4F46E5
      dark: [15, 23, 42],
      lightBg: [238, 242, 255],
      cardBg: [248, 250, 252],
      border: [226, 232, 240],
    },
    monochrome: {
      primary: [24, 24, 27], // #18181B
      accent: [82, 82, 91], // #52525B
      dark: [9, 9, 11],
      lightBg: [244, 244, 245],
      cardBg: [250, 250, 250],
      border: [228, 228, 231],
    },
  }[options.colorTheme || 'emerald'];

  const greenColor = [16, 185, 129];
  const redColor = [239, 68, 68];
  const grayColor = [100, 116, 139];

  // Helper for auto page-break
  const checkSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - 16) {
      doc.addPage();
      y = margin;
      renderRunningHeader();
    }
  };

  const renderRunningHeader = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('TradeScrapbook • Performance Statement', margin, y - 4);
    doc.text(`Account: ${options.maskAccount ? '••••' + accountInfo.account.slice(-4) : accountInfo.account}`, pageWidth - margin, y - 4, { align: 'right' });
    doc.setDrawColor(...theme.border as [number, number, number]);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  };

  // ==========================================
  // 1. HEADER BANNER (Page 1)
  // ==========================================
  doc.setFillColor(...theme.primary as [number, number, number]);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(options.title || 'TradeScrapbook Performance Statement', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(options.subtitle || 'Zero-Knowledge Institutional Trading Analytics Report', margin, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - margin, 18, { align: 'right' });

  y = 33;

  // ==========================================
  // 2. OVERVIEW & CORE KPIS (If enabled)
  // ==========================================
  if (options.sections.overview) {
    // Account Details Box
    doc.setFillColor(...theme.cardBg as [number, number, number]);
    doc.setDrawColor(...theme.border as [number, number, number]);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    const displayName = options.maskAccount 
      ? 'Verified Trader' 
      : (accountInfo.isDemo ? (accountInfo.name || 'Marcus Sterling') : (accountInfo.name || 'Trader'));
    const displayAccount = options.maskAccount 
      ? `••••${accountInfo.account && accountInfo.account !== 'N/A' ? accountInfo.account.slice(-4) : (accountInfo.isDemo ? '7105' : '••••')}` 
      : (accountInfo.isDemo ? (accountInfo.account || '94827105') : (accountInfo.account || 'Account'));
    const displayBroker = options.maskAccount 
      ? 'Regulated Broker' 
      : (accountInfo.isDemo ? (accountInfo.broker || 'Apex Capital Markets Ltd') : (accountInfo.broker || 'Trading Account'));

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text(`Trader: ${displayName}`, margin + 4, y + 6);
    doc.text(`Account: #${displayAccount}`, margin + 4, y + 13);
    doc.text(`Broker: ${displayBroker}`, margin + 4, y + 20);

    doc.text(`Currency: ${accountInfo.currency || 'USD'}`, margin + 65, y + 6);
    doc.text(`Closed Trades: ${filteredTrades.length}`, margin + 65, y + 13);
    doc.text(`Lots Traded: ${metrics.totalVolume.toFixed(2)}`, margin + 65, y + 20);

    doc.text(`Starting Balance: $${metrics.initialDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + 125, y + 6);
    doc.text(`Ending Equity: $${(accountInfo.equity || metrics.endingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + 125, y + 13);
    
    const returnStr = `${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent}%`;
    doc.setTextColor(metrics.totalReturnPercent >= 0 ? greenColor[0] : redColor[0], metrics.totalReturnPercent >= 0 ? greenColor[1] : redColor[1], metrics.totalReturnPercent >= 0 ? greenColor[2] : redColor[2]);
    doc.text(`Net Return: ${returnStr}`, margin + 125, y + 20);

    y += 30;

    // KPI Cards Grid (4 columns x 3 rows)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('Executive KPI Scorecard', margin, y);
    y += 5;

    const kpis = [
      { label: 'Net Profit', value: `${metrics.netProfit >= 0 ? '+' : ''}$${metrics.netProfit.toFixed(2)}`, color: metrics.netProfit >= 0 ? greenColor : redColor },
      { label: 'Win Rate', value: `${metrics.winRate}%`, color: metrics.winRate >= 50 ? greenColor : redColor },
      { label: 'Profit Factor', value: `${metrics.profitFactor}`, color: metrics.profitFactor >= 1.2 ? greenColor : grayColor },
      { label: 'Total Trades', value: `${metrics.totalTrades}`, color: theme.dark },
      { label: 'Gross Profit', value: `+$${metrics.grossProfit.toFixed(2)}`, color: greenColor },
      { label: 'Gross Loss', value: `-$${metrics.grossLoss.toFixed(2)}`, color: redColor },
      { label: 'Average Win', value: `+$${metrics.avgWin.toFixed(2)}`, color: greenColor },
      { label: 'Average Loss', value: `-$${metrics.avgLoss.toFixed(2)}`, color: redColor },
      { label: 'Max Drawdown', value: `-$${metrics.maxDrawdownDollars.toFixed(2)} (${metrics.maxDrawdownPercent}%)`, color: redColor },
      { label: 'Expectancy', value: `$${metrics.expectancy} / trade`, color: metrics.expectancy >= 0 ? greenColor : redColor },
      { label: 'Sharpe Ratio', value: `${metrics.sharpeRatio}`, color: metrics.sharpeRatio >= 1 ? greenColor : grayColor },
      { label: 'Max Win Streak', value: `${metrics.maxWinStreak} Wins`, color: greenColor },
    ];

    const colWidth = contentWidth / 4;
    kpis.forEach((kpi, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const boxX = margin + col * colWidth;
      const boxY = y + row * 15;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(...theme.border as [number, number, number]);
      doc.roundedRect(boxX, boxY, colWidth - 2, 13, 1.5, 1.5, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, boxX + 3, boxY + 4);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.value, boxX + 3, boxY + 10);
    });

    y += 50;
  }

  // ==========================================
  // 3. PERFORMANCE CALENDAR (All Trades / Months)
  // ==========================================
  if (options.sections.calendar) {
    checkSpace(65);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('Performance Calendar & Monthly Heatmap', margin, y);
    y += 5;

    const months = getMonthsBreakdown(filteredTrades);

    months.forEach((monthData) => {
      checkSpace(65);

      // Month Title Bar
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...theme.border as [number, number, number]);
      doc.rect(margin, y, contentWidth, 7, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...theme.dark as [number, number, number]);
      doc.text(monthData.name, margin + 3, y + 4.8);

      const monthPnlStr = `${monthData.netProfit >= 0 ? '+' : ''}$${monthData.netProfit.toFixed(2)}`;
      doc.setTextColor(monthData.netProfit >= 0 ? greenColor[0] : redColor[0], monthData.netProfit >= 0 ? greenColor[1] : redColor[1], monthData.netProfit >= 0 ? greenColor[2] : redColor[2]);
      doc.text(`Net: ${monthPnlStr}`, margin + 80, y + 4.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Win Rate: ${monthData.winRate}%  •  Trades: ${monthData.totalTrades}`, margin + 125, y + 4.8);

      y += 7;

      // 7-day calendar header: Mon, Tue, Wed, Thu, Fri, Sat, Sun
      const dayColWidth = contentWidth / 7;
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 5, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      dayNames.forEach((name, i) => {
        doc.text(name, margin + i * dayColWidth + dayColWidth / 2, y + 3.5, { align: 'center' });
      });

      y += 5;

      // Calendar grid calculation
      // monthData.firstDayOfWeek: 0 = Sun, 1 = Mon ...
      // In Mon-Sun grid: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
      let startCol = (monthData.firstDayOfWeek + 6) % 7;
      let curCol = startCol;
      let curRowY = y;
      const cellHeight = 9.5;

      // Draw blank leading cells
      for (let b = 0; b < startCol; b++) {
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(241, 245, 249);
        doc.rect(margin + b * dayColWidth, curRowY, dayColWidth, cellHeight, 'FD');
      }

      for (let dayNum = 1; dayNum <= monthData.daysInMonth; dayNum++) {
        const dateStr = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayData = monthData.dailySummaries[dateStr];
        const cellX = margin + curCol * dayColWidth;

        if (dayData && dayData.tradesCount > 0) {
          const isProfit = dayData.netProfit >= 0;
          // Green or Red tint
          doc.setFillColor(isProfit ? 236 : 254, isProfit ? 253 : 242, isProfit ? 245 : 242);
          doc.setDrawColor(isProfit ? 16 : 239, isProfit ? 185 : 68, isProfit ? 129 : 68);
          doc.rect(cellX, curRowY, dayColWidth, cellHeight, 'FD');

          // Day number
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 65, 85);
          doc.text(`${dayNum}`, cellX + 1.5, curRowY + 3.5);

          // PnL & trade count
          doc.setFontSize(6.5);
          doc.setTextColor(isProfit ? greenColor[0] : redColor[0], isProfit ? greenColor[1] : redColor[1], isProfit ? greenColor[2] : redColor[2]);
          const dayPnlStr = `${isProfit ? '+' : ''}$${Math.round(dayData.netProfit)}`;
          doc.text(dayPnlStr, cellX + dayColWidth - 1.5, curRowY + 4, { align: 'right' });

          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`${dayData.tradesCount} trd`, cellX + dayColWidth - 1.5, curRowY + 7.5, { align: 'right' });
        } else {
          // Empty inactive day
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(235, 238, 242);
          doc.rect(cellX, curRowY, dayColWidth, cellHeight, 'FD');

          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(160, 174, 192);
          doc.text(`${dayNum}`, cellX + 1.5, curRowY + 3.5);
        }

        curCol++;
        if (curCol === 7) {
          curCol = 0;
          curRowY += cellHeight;
        }
      }

      // Fill trailing cells
      if (curCol > 0) {
        while (curCol < 7) {
          doc.setFillColor(250, 250, 250);
          doc.setDrawColor(241, 245, 249);
          doc.rect(margin + curCol * dayColWidth, curRowY, dayColWidth, cellHeight, 'FD');
          curCol++;
        }
        curRowY += cellHeight;
      }

      y = curRowY + 6;
    });

    // Monthly Performance Summary Table
    checkSpace(28);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('Monthly Overview Breakdown', margin, y);
    y += 4;

    const mHeaders = ['Month', 'Trades', 'Win Rate', 'Gross Profit', 'Gross Loss', 'Net P&L', 'Best Day'];
    const mHeaderX = [margin, margin + 35, margin + 55, margin + 78, margin + 104, margin + 130, margin + 155];

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    mHeaders.forEach((h, i) => doc.text(h, mHeaderX[i] + 1, y + 4));
    y += 5.5;

    months.forEach((m, idx) => {
      checkSpace(6);
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(m.name, mHeaderX[0] + 1, y + 4);
      doc.text(`${m.totalTrades}`, mHeaderX[1] + 1, y + 4);
      doc.text(`${m.winRate}%`, mHeaderX[2] + 1, y + 4);
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      doc.text(`+$${m.grossProfit.toFixed(0)}`, mHeaderX[3] + 1, y + 4);
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.text(`-$${m.grossLoss.toFixed(0)}`, mHeaderX[4] + 1, y + 4);

      doc.setTextColor(m.netProfit >= 0 ? greenColor[0] : redColor[0], m.netProfit >= 0 ? greenColor[1] : redColor[1], m.netProfit >= 0 ? greenColor[2] : redColor[2]);
      doc.text(`${m.netProfit >= 0 ? '+' : ''}$${m.netProfit.toFixed(2)}`, mHeaderX[5] + 1, y + 4);

      doc.setTextColor(15, 23, 42);
      doc.text(m.bestDay.date !== '-' ? `${m.bestDay.date.slice(5)} (+$${Math.round(m.bestDay.pnl)})` : '-', mHeaderX[6] + 1, y + 4);

      y += 5.5;
    });

    y += 6;
  }

  // ==========================================
  // 4. DEEP STATISTICAL ANALYTICS
  // ==========================================
  if (options.sections.deepAnalytics) {
    checkSpace(55);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('Deep Statistical Analytics & Edge Breakdown', margin, y);
    y += 5;

    // Long vs Short Split Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...theme.border as [number, number, number]);
    doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`LONG TRADES: ${metrics.longTrades} (${metrics.longWins} Wins • ${metrics.longWinRate}% Win Rate)`, margin + 4, y + 6);
    doc.setTextColor(239, 68, 68);
    doc.text(`SHORT TRADES: ${metrics.shortTrades} (${metrics.shortWins} Wins • ${metrics.shortWinRate}% Win Rate)`, margin + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Avg Hold Time: ${metrics.avgHoldTimeMinutes} mins`, margin + 115, y + 6);
    doc.text(`Best Trade Payout: +$${metrics.largestWin.toFixed(2)}`, margin + 115, y + 12);

    y += 20;

    // Symbol Breakdown Table
    const symbols = getSymbolBreakdown(filteredTrades);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('Symbol & Instrument Performance', margin, y);
    y += 4;

    const sHeaders = ['Symbol', 'Trades', 'Win Rate', 'Gross Profit', 'Gross Loss', 'Net P&L', 'Profit Factor'];
    const sHeaderX = [margin, margin + 30, margin + 55, margin + 80, margin + 108, margin + 135, margin + 160];

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    sHeaders.forEach((h, i) => doc.text(h, sHeaderX[i] + 1, y + 4));
    y += 5.5;

    symbols.forEach((s, idx) => {
      checkSpace(6);
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(s.symbol, sHeaderX[0] + 1, y + 4);
      doc.text(`${s.trades}`, sHeaderX[1] + 1, y + 4);
      doc.text(`${s.winRate}%`, sHeaderX[2] + 1, y + 4);
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      doc.text(`+$${s.grossProfit.toFixed(0)}`, sHeaderX[3] + 1, y + 4);
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.text(`-$${s.grossLoss.toFixed(0)}`, sHeaderX[4] + 1, y + 4);

      doc.setTextColor(s.pnl >= 0 ? greenColor[0] : redColor[0], s.pnl >= 0 ? greenColor[1] : redColor[1], s.pnl >= 0 ? greenColor[2] : redColor[2]);
      doc.text(`${s.pnl >= 0 ? '+' : ''}$${s.pnl.toFixed(2)}`, sHeaderX[5] + 1, y + 4);
      doc.setTextColor(15, 23, 42);
      doc.text(`${s.profitFactor}`, sHeaderX[6] + 1, y + 4);

      y += 5.5;
    });

    y += 8;
  }

  // ==========================================
  // 5. TRADESCRAPBOOK AI COACH & DISCIPLINE AUDIT
  // ==========================================
  if (options.sections.aiCoach) {
    checkSpace(40);

    const coachInsights = getAIInsights(filteredTrades, metrics);
    let revengeCount = 0;
    for (let i = 0; i < filteredTrades.length - 1; i++) {
      if (filteredTrades[i].netProfit < 0) {
        const diffMin = (filteredTrades[i + 1].openTimestamp - filteredTrades[i].closeTimestamp) / 60000;
        if (diffMin >= 0 && diffMin <= 15) revengeCount++;
      }
    }
    const tradesWithSL = filteredTrades.filter(t => t.sl !== null && t.sl !== undefined && t.sl > 0).length;
    const slPct = filteredTrades.length > 0 ? (tradesWithSL / filteredTrades.length) * 100 : 100;
    const disciplineScore = Math.min(100, Math.max(30, Math.round((slPct * 0.35) + Math.max(0, 35 - revengeCount * 10) + 30)));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('TradeScrapbook AI Psychology & Discipline Audit', margin, y);
    y += 5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...theme.border as [number, number, number]);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`Overall Discipline Score: ${disciplineScore}/100 (Institutional Grade)`, margin + 4, y + 6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`• Revenge Trading Audit: ${revengeCount} rapid tilt entries detected within 15 mins of loss.`, margin + 4, y + 12);
    doc.text(`• Hold-Time Efficiency: Average trade duration ${metrics.avgHoldTimeMinutes}m. Disciplined execution pace.`, margin + 4, y + 17);
    doc.text(`• Capital Protection: Max Drawdown contained at ${metrics.maxDrawdownPercent}% ($${metrics.maxDrawdownDollars.toFixed(0)}).`, margin + 4, y + 22);

    y += 29;
  }

  // ==========================================
  // 6. PROP FIRM CHALLENGE MONITOR
  // ==========================================
  if (options.sections.propFirm) {
    checkSpace(35);

    const rules = getPropFirmRules(filteredTrades, accountInfo.balance || 10000);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text('Prop Firm Evaluation Monitor (FTMO / The5ers Rules)', margin, y);
    y += 5;

    const rHeaders = ['Evaluation Rule', 'Allowed Limit', 'Current Level', 'Compliance Status'];
    const rHeaderX = [margin, margin + 65, margin + 105, margin + 145];

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    rHeaders.forEach((h, i) => doc.text(h, rHeaderX[i] + 1, y + 4));
    y += 5.5;

    rules.forEach((rule, idx) => {
      checkSpace(6);
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(rule.name, rHeaderX[0] + 1, y + 4);
      doc.text(`${rule.limit}%`, rHeaderX[1] + 1, y + 4);
      doc.text(`${rule.current}%`, rHeaderX[2] + 1, y + 4);

      const isPassed = rule.status === 'passed';
      const isViolated = rule.status === 'violated';
      doc.setFont('helvetica', 'bold');
      if (isPassed) {
        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
        doc.text('PASSED', rHeaderX[3] + 1, y + 4);
      } else if (isViolated) {
        doc.setTextColor(redColor[0], redColor[1], redColor[2]);
        doc.text('BREACHED', rHeaderX[3] + 1, y + 4);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.text('IN PROGRESS', rHeaderX[3] + 1, y + 4);
      }

      y += 5.5;
    });

    y += 8;
  }

  // ==========================================
  // 7. TRADE EXECUTION JOURNAL
  // ==========================================
  if (options.sections.tradeJournal) {
    checkSpace(35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...theme.dark as [number, number, number]);
    doc.text(`Trade Execution Journal (${filteredTrades.length} Positions)`, margin, y);
    y += 5;

    const jHeaders = ['Ticket', 'Time', 'Type', 'Symbol', 'Vol', 'Open', 'Close', 'Duration', 'Profit', 'Tag'];
    const jHeaderX = [margin, margin + 18, margin + 46, margin + 58, margin + 74, margin + 87, margin + 104, margin + 122, margin + 142, margin + 160];

    const printJournalHeader = () => {
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      jHeaders.forEach((h, i) => doc.text(h, jHeaderX[i] + 1, y + 4.2));
      y += 6;
    };

    printJournalHeader();

    doc.setFont('helvetica', 'normal');
    filteredTrades.forEach((trade, index) => {
      if (y > pageHeight - 16) {
        doc.addPage();
        y = margin;
        renderRunningHeader();
        printJournalHeader();
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
      }

      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(trade.id.slice(-8), jHeaderX[0] + 1, y + 3.8);
      doc.text(trade.closeTime.slice(5, 16), jHeaderX[1] + 1, y + 3.8);

      // Type
      if (trade.type === 'buy') {
        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
        doc.text('BUY', jHeaderX[2] + 1, y + 3.8);
      } else {
        doc.setTextColor(redColor[0], redColor[1], redColor[2]);
        doc.text('SELL', jHeaderX[2] + 1, y + 3.8);
      }

      doc.setTextColor(51, 65, 85);
      doc.text(trade.symbol, jHeaderX[3] + 1, y + 3.8);
      doc.text(trade.volume.toFixed(2), jHeaderX[4] + 1, y + 3.8);
      doc.text(trade.openPrice.toFixed(2), jHeaderX[5] + 1, y + 3.8);
      doc.text(trade.closePrice.toFixed(2), jHeaderX[6] + 1, y + 3.8);
      doc.text(trade.durationFormatted, jHeaderX[7] + 1, y + 3.8);

      // Profit (Green for profit, Red for loss)
      if (trade.netProfit > 0) {
        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
        doc.text(`+$${trade.netProfit.toFixed(2)}`, jHeaderX[8] + 1, y + 3.8);
      } else if (trade.netProfit < 0) {
        doc.setTextColor(redColor[0], redColor[1], redColor[2]);
        doc.text(`-$${Math.abs(trade.netProfit).toFixed(2)}`, jHeaderX[8] + 1, y + 3.8);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text('$0.00', jHeaderX[8] + 1, y + 3.8);
      }

      // Tag
      doc.setTextColor(79, 70, 229);
      doc.text(trade.tags && trade.tags.length > 0 ? trade.tags[0].slice(0, 12) : '-', jHeaderX[9] + 1, y + 3.8);

      y += 5.5;

      // Print notes if option enabled
      if (options.includeNotes && trade.notes) {
        if (y > pageHeight - 14) {
          doc.addPage();
          y = margin;
          renderRunningHeader();
          printJournalHeader();
        }
        doc.setFontSize(5.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Note: ${trade.notes.slice(0, 85)}`, jHeaderX[1] + 1, y + 3);
        y += 4;
      }
    });
  }

  // ==========================================
  // 8. PAGE FOOTERS ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('100% Client-Side In-Browser Performance Report — Zero Server Data Retention', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages} • Powered by TradeScrapbook (tradescrapbook.com)`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Save the PDF
  const filename = `TradeScrapbook_Statement_${options.maskAccount ? 'Trader' : (accountInfo.account || 'Statement')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
