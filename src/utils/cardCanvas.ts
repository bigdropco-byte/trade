import { AccountInfo, Trade, TradingMetrics } from '../types/trade';
import { ShareCardOptions } from '../components/ShareCardModal';

// Helper to draw rounded rectangle
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export function generateCardCanvas(
  accountInfo: AccountInfo,
  metrics: TradingMetrics,
  activeTrades: Trade[],
  equityPoints: { timestamp: number; balance: number; netPnl: number }[],
  options: ShareCardOptions
): HTMLCanvasElement {
  const width = 1200;
  const height = 820;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const isDark = options.theme === 'dark';
  const isNetProfitable = metrics.netProfit >= 0;

  // Colors based on theme
  const colors = {
    dark: {
      bg: '#020617',
      cardBg: '#0F172A',
      border: '#1E293B',
      heroBg: '#1E293B',
      heroBorder: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      boxBg: '#1E293B',
      boxBorder: '#334155',
      glow: isNetProfitable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      accent: '#10B981',
      badgeBg: '#1E293B',
      badgeText: '#10B981',
      badgeBorder: '#334155',
    },
    emerald: {
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      border: '#10B981',
      heroBg: '#F8FAFC',
      heroBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      boxBg: '#F8FAFC',
      boxBorder: '#E2E8F0',
      glow: 'rgba(16, 185, 129, 0.12)',
      accent: '#10B981',
      badgeBg: '#ECFDF5',
      badgeText: '#047857',
      badgeBorder: '#A7F3D0',
    },
    indigo: {
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      border: '#6366F1',
      heroBg: '#EEF2FF',
      heroBorder: '#E0E7FF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      boxBg: '#F8FAFC',
      boxBorder: '#E2E8F0',
      glow: 'rgba(99, 102, 241, 0.12)',
      accent: '#6366F1',
      badgeBg: '#EEF2FF',
      badgeText: '#4338CA',
      badgeBorder: '#C7D2FE',
    },
    white: {
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      border: '#CBD5E1',
      heroBg: '#F8FAFC',
      heroBorder: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      boxBg: '#F8FAFC',
      boxBorder: '#E2E8F0',
      glow: 'rgba(148, 163, 184, 0.1)',
      accent: '#0F172A',
      badgeBg: '#F1F5F9',
      badgeText: '#334155',
      badgeBorder: '#CBD5E1',
    },
  }[options.theme];

  // 1. Fill Outer Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Glow
  const glowGrad = ctx.createRadialGradient(width - 150, 150, 20, width - 150, 150, 400);
  glowGrad.addColorStop(0, colors.glow);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Main Card Frame
  const cardX = 60;
  const cardY = 50;
  const cardW = width - 120;
  const cardH = height - 100;

  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = colors.cardBg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  // 4. Brand Header
  // Logo Icon Box
  const logoX = cardX + 40;
  const logoY = cardY + 36;
  drawRoundRect(ctx, logoX, logoY, 44, 44, 12);
  ctx.fillStyle = '#10B981';
  ctx.fill();

  // Activity Icon line inside logo box
  ctx.beginPath();
  ctx.moveTo(logoX + 12, logoY + 22);
  ctx.lineTo(logoX + 18, logoY + 22);
  ctx.lineTo(logoX + 22, logoY + 12);
  ctx.lineTo(logoX + 26, logoY + 32);
  ctx.lineTo(logoX + 30, logoY + 22);
  ctx.lineTo(logoX + 34, logoY + 22);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Brand Name
  ctx.font = 'bold 26px "Inter", sans-serif';
  ctx.fillStyle = colors.textPrimary;
  ctx.fillText('Trade', logoX + 56, logoY + 31);
  const tradeWidth = ctx.measureText('Trade').width;
  ctx.fillStyle = '#10B981';
  ctx.fillText('Scrapbook', logoX + 56 + tradeWidth, logoY + 31);

  // Verified Badge (Right side of header)
  const badgeText = 'VERIFIED STATEMENT';
  ctx.font = 'bold 13px "Inter", monospace';
  const badgeTextWidth = ctx.measureText(badgeText).width;
  const badgeW = badgeTextWidth + 24;
  const badgeH = 32;
  const badgeX = cardX + cardW - 40 - badgeW;
  const badgeY = logoY + 6;

  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fillStyle = colors.badgeBg;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.badgeBorder;
  ctx.stroke();

  ctx.fillStyle = colors.badgeText;
  ctx.fillText(badgeText, badgeX + 12, badgeY + 21);

  // Separator below brand header
  ctx.beginPath();
  ctx.moveTo(cardX + 40, logoY + 60);
  ctx.lineTo(cardX + cardW - 40, logoY + 60);
  ctx.strokeStyle = colors.boxBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 5. Trader and Account Info Row
  const infoY = logoY + 95;
  const displayName = options.hideName ? 'Verified Trader' : (accountInfo.name || 'Marcus Sterling');
  const displayAccount = options.maskAccount 
    ? `••••${accountInfo.account ? accountInfo.account.slice(-4) : '7105'}` 
    : (accountInfo.account || '94827105');
  const displayBroker = options.hideBroker ? 'Regulated Broker' : (accountInfo.broker || 'Apex Capital Markets Ltd');

  ctx.font = 'bold 24px "Inter", sans-serif';
  ctx.fillStyle = colors.textPrimary;
  ctx.fillText(displayName, cardX + 40, infoY);

  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`${displayBroker}  •  #${displayAccount}`, cardX + 40, infoY + 25);

  if (options.showVolume) {
    const volText = `${activeTrades.length} Closed Trades  •  ${metrics.totalVolume.toFixed(2)} Lots Traded`;
    ctx.font = 'bold 15px "Inter", sans-serif';
    const volWidth = ctx.measureText(volText).width;
    ctx.fillStyle = '#10B981';
    ctx.fillText(volText, cardX + cardW - 40 - volWidth, infoY + 12);
  }

  // 6. Net P&L Hero Box
  let currentY = infoY + 45;
  const heroBoxH = options.showSparkline ? 240 : 140;

  if (options.showPnl) {
    drawRoundRect(ctx, cardX + 40, currentY, cardW - 80, heroBoxH, 20);
    ctx.fillStyle = colors.heroBg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.heroBorder;
    ctx.stroke();

    // Box Subtitle
    ctx.font = 'bold 13px "Inter", monospace';
    ctx.fillStyle = colors.textMuted;
    const pnlLabel = 'TOTAL NET PROFIT & LOSS';
    const pnlLabelWidth = ctx.measureText(pnlLabel).width;
    ctx.fillText(pnlLabel, cardX + (cardW / 2) - (pnlLabelWidth / 2), currentY + 32);

    // Big P&L Value
    const pnlFormatted = `${isNetProfitable ? '+' : ''}$${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    ctx.font = '900 52px "JetBrains Mono", monospace';
    ctx.fillStyle = isNetProfitable ? '#10B981' : '#EF4444';
    const pnlValueWidth = ctx.measureText(pnlFormatted).width;
    ctx.fillText(pnlFormatted, cardX + (cardW / 2) - (pnlValueWidth / 2), currentY + 86);

    // Return Percent Subtitle
    const returnFormatted = `Return: ${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent}%`;
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillStyle = metrics.totalReturnPercent >= 0 ? '#10B981' : '#EF4444';
    const returnWidth = ctx.measureText(returnFormatted).width;
    ctx.fillText(returnFormatted, cardX + (cardW / 2) - (returnWidth / 2), currentY + 114);

    // Sparkline inside Hero Box
    if (options.showSparkline && equityPoints.length > 1) {
      const sparkY = currentY + 130;
      const sparkW = cardW - 140;
      const sparkX = cardX + 70;

      // Top divider line
      ctx.beginPath();
      ctx.moveTo(sparkX, sparkY);
      ctx.lineTo(sparkX + sparkW, sparkY);
      ctx.strokeStyle = colors.boxBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Legend
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText('Trajectory', sparkX, sparkY + 20);

      ctx.fillStyle = '#10B981';
      ctx.fillText('● Profit', sparkX + sparkW - 140, sparkY + 20);
      ctx.fillStyle = '#EF4444';
      ctx.fillText('● Loss', sparkX + sparkW - 60, sparkY + 20);

      // Plot Points
      const minBal = Math.min(...equityPoints.map(p => p.balance));
      const maxBal = Math.max(...equityPoints.map(p => p.balance));
      const range = maxBal - minBal || 1;
      const chartTop = sparkY + 30;
      const chartHeight = 44;

      const points = equityPoints.map((p, idx) => ({
        x: sparkX + (idx / (equityPoints.length - 1)) * sparkW,
        y: chartTop + chartHeight - ((p.balance - minBal) / range) * chartHeight,
        netPnl: p.netPnl,
      }));

      // Draw Segments
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const isUp = p1.y <= p0.y;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = isUp ? '#10B981' : '#EF4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw Dot markers
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.netPnl >= 0 ? '#10B981' : '#EF4444';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    }

    currentY += heroBoxH + 24;
  }

  // 7. Metric Triple Grid
  const gridW = cardW - 80;
  const gridItems: { label: string; val: string; color: string }[] = [];
  if (options.showWinRate) gridItems.push({ label: 'WIN RATE', val: `${metrics.winRate}%`, color: '#6366F1' });
  if (options.showProfitFactor) gridItems.push({ label: 'PROFIT FACTOR', val: String(metrics.profitFactor), color: '#10B981' });
  if (options.showBestTrade) gridItems.push({ label: 'BEST SETUP', val: `+$${metrics.largestWin.toFixed(0)}`, color: '#10B981' });

  if (gridItems.length > 0) {
    const colGap = 16;
    const colW = (gridW - (gridItems.length - 1) * colGap) / gridItems.length;
    const boxH = 75;

    gridItems.forEach((item, idx) => {
      const colX = cardX + 40 + idx * (colW + colGap);
      drawRoundRect(ctx, colX, currentY, colW, boxH, 16);
      ctx.fillStyle = colors.boxBg;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.boxBorder;
      ctx.stroke();

      ctx.font = 'bold 11px "Inter", monospace';
      ctx.fillStyle = colors.textMuted;
      const lblW = ctx.measureText(item.label).width;
      ctx.fillText(item.label, colX + (colW / 2) - (lblW / 2), currentY + 26);

      ctx.font = '900 24px "JetBrains Mono", monospace';
      ctx.fillStyle = item.color;
      const valW = ctx.measureText(item.val).width;
      ctx.fillText(item.val, colX + (colW / 2) - (valW / 2), currentY + 58);
    });

    currentY += boxH + 20;
  }

  // 8. Long vs Short Split
  if (options.showLongShort) {
    ctx.beginPath();
    ctx.moveTo(cardX + 40, currentY);
    ctx.lineTo(cardX + cardW - 40, currentY);
    ctx.strokeStyle = colors.boxBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText(`Longs: ${metrics.longWins}/${metrics.longTrades} (${metrics.longWinRate}%)`, cardX + 40, currentY + 22);

    const shortText = `Shorts: ${metrics.shortWins}/${metrics.shortTrades} (${metrics.shortWinRate}%)`;
    const shortW = ctx.measureText(shortText).width;
    ctx.fillStyle = '#EF4444';
    ctx.fillText(shortText, cardX + cardW - 40 - shortW, currentY + 22);

    currentY += 34;
  }

  // 9. Footer Watermark
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + cardH - 50);
  ctx.lineTo(cardX + cardW - 40, cardY + cardH - 50);
  ctx.strokeStyle = colors.boxBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '13px "Inter", sans-serif';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText('100% Client-Side Private • Zero Server Storage', cardX + 40, cardY + cardH - 24);

  const brandUrl = 'tradescrapbook.com';
  const urlWidth = ctx.measureText(brandUrl).width;
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 13px "Inter", sans-serif';
  ctx.fillText(brandUrl, cardX + cardW - 40 - urlWidth, cardY + cardH - 24);

  return canvas;
}
