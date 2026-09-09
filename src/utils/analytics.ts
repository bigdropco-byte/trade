import { AIInsight, DailySummary, PropFirmRule, StreakInfo, Trade, TradingMetrics } from '../types/trade';

export function calculateMetrics(trades: Trade[], initialBalance: number = 10000): TradingMetrics {
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      expectancy: 0,
      maxDrawdownDollars: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      totalVolume: 0,
      totalCommissions: 0,
      totalSwaps: 0,
      avgHoldTimeMinutes: 0,
      largestWin: 0,
      largestLoss: 0,
      longTrades: 0,
      longWins: 0,
      longWinRate: 0,
      shortTrades: 0,
      shortWins: 0,
      shortWinRate: 0,
      currentStreak: { type: 'none', count: 0 },
      maxWinStreak: 0,
      maxLossStreak: 0,
      initialDeposit: initialBalance,
      endingBalance: initialBalance,
      totalReturnPercent: 0,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let totalVolume = 0;
  let totalCommissions = 0;
  let totalSwaps = 0;
  let totalHoldTime = 0;
  let largestWin = 0;
  let largestLoss = 0;

  let longTrades = 0;
  let longWins = 0;
  let shortTrades = 0;
  let shortWins = 0;

  // Streak tracking
  let currentStreak: StreakInfo = { type: 'none', count: 0 };
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  trades.forEach(t => {
    const pnl = t.netProfit;
    totalVolume += t.volume;
    totalCommissions += t.commission;
    totalSwaps += t.swap;
    totalHoldTime += t.durationMinutes;

    if (pnl > 0.001) {
      winningTrades++;
      grossProfit += pnl;
      if (pnl > largestWin) largestWin = pnl;

      // Win streak
      tempWinStreak++;
      tempLossStreak = 0;
      if (tempWinStreak > maxWinStreak) maxWinStreak = tempWinStreak;
    } else if (pnl < -0.001) {
      losingTrades++;
      grossLoss += Math.abs(pnl);
      if (pnl < largestLoss) largestLoss = pnl;

      // Loss streak
      tempLossStreak++;
      tempWinStreak = 0;
      if (tempLossStreak > maxLossStreak) maxLossStreak = tempLossStreak;
    } else {
      breakevenTrades++;
      tempWinStreak = 0;
      tempLossStreak = 0;
    }

    if (t.type === 'buy') {
      longTrades++;
      if (pnl > 0) longWins++;
    } else {
      shortTrades++;
      if (pnl > 0) shortWins++;
    }
  });

  // Calculate current streak from last trades
  if (trades.length > 0) {
    const lastTrade = trades[trades.length - 1];
    const isWin = lastTrade.netProfit > 0;
    let count = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      if ((trades[i].netProfit > 0) === isWin && Math.abs(trades[i].netProfit) > 0.001) {
        count++;
      } else {
        break;
      }
    }
    currentStreak = {
      type: isWin ? 'win' : 'loss',
      count,
    };
  }

  const netProfit = parseFloat((grossProfit - grossLoss).toFixed(2));
  const winRate = totalTrades > 0 ? parseFloat(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;
  const lossRate = totalTrades > 0 ? parseFloat(((losingTrades / totalTrades) * 100).toFixed(1)) : 0;

  const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
  const avgWin = winningTrades > 0 ? parseFloat((grossProfit / winningTrades).toFixed(2)) : 0;
  const avgLoss = losingTrades > 0 ? parseFloat((grossLoss / losingTrades).toFixed(2)) : 0;
  const winLossRatio = avgLoss > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : avgWin > 0 ? 99.9 : 0;

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  const expectancy = parseFloat(((winRate / 100 * avgWin) - (lossRate / 100 * avgLoss)).toFixed(2));

  // Running balance & Max Drawdown calculation
  let runningBal = initialBalance;
  let peakBal = initialBalance;
  let maxDrawdownDollars = 0;
  let maxDrawdownPercent = 0;

  // Daily returns for Sharpe
  const dailyPnlMap: { [date: string]: number } = {};

  trades.forEach(t => {
    runningBal += t.netProfit;
    if (runningBal > peakBal) {
      peakBal = runningBal;
    }
    const currentDd = peakBal - runningBal;
    if (currentDd > maxDrawdownDollars) {
      maxDrawdownDollars = currentDd;
    }
    const ddPercent = peakBal > 0 ? (currentDd / peakBal) * 100 : 0;
    if (ddPercent > maxDrawdownPercent) {
      maxDrawdownPercent = ddPercent;
    }

    const dayKey = t.closeTime.slice(0, 10).replace(/[./]/g, '-');
    dailyPnlMap[dayKey] = (dailyPnlMap[dayKey] || 0) + t.netProfit;
  });

  // Calculate Sharpe Ratio (simplified annualized)
  const dailyReturns = Object.values(dailyPnlMap);
  let sharpeRatio = 0;
  if (dailyReturns.length > 1) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / (dailyReturns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev > 0) {
      sharpeRatio = parseFloat(((meanReturn / stdDev) * Math.sqrt(252)).toFixed(2));
    }
  }

  const endingBalance = parseFloat(runningBal.toFixed(2));
  const totalReturnPercent = initialBalance > 0 ? parseFloat(((netProfit / initialBalance) * 100).toFixed(2)) : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    lossRate,
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    netProfit,
    profitFactor,
    avgWin,
    avgLoss,
    winLossRatio,
    expectancy,
    maxDrawdownDollars: parseFloat(maxDrawdownDollars.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
    sharpeRatio,
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    totalCommissions: parseFloat(totalCommissions.toFixed(2)),
    totalSwaps: parseFloat(totalSwaps.toFixed(2)),
    avgHoldTimeMinutes: totalTrades > 0 ? parseFloat((totalHoldTime / totalTrades).toFixed(1)) : 0,
    largestWin: parseFloat(largestWin.toFixed(2)),
    largestLoss: parseFloat(largestLoss.toFixed(2)),
    longTrades,
    longWins,
    longWinRate: longTrades > 0 ? parseFloat(((longWins / longTrades) * 100).toFixed(1)) : 0,
    shortTrades,
    shortWins,
    shortWinRate: shortTrades > 0 ? parseFloat(((shortWins / shortTrades) * 100).toFixed(1)) : 0,
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    initialDeposit: initialBalance,
    endingBalance,
    totalReturnPercent,
  };
}

/**
 * Group trades by day for the calendar and daily breakdown
 */
export function groupTradesByDay(trades: Trade[]): Record<string, DailySummary> {
  const map: Record<string, DailySummary> = {};

  trades.forEach(t => {
    // Normalise date string to YYYY-MM-DD
    const rawDate = t.closeTime.slice(0, 10);
    const date = rawDate.replace(/[./]/g, '-');

    if (!map[date]) {
      map[date] = {
        date,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        tradesCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        volume: 0,
        trades: [],
      };
    }

    const day = map[date];
    day.trades.push(t);
    day.tradesCount++;
    day.volume += t.volume;
    day.netProfit = parseFloat((day.netProfit + t.netProfit).toFixed(2));

    if (t.netProfit > 0.001) {
      day.winCount++;
      day.grossProfit = parseFloat((day.grossProfit + t.netProfit).toFixed(2));
    } else if (t.netProfit < -0.001) {
      day.lossCount++;
      day.grossLoss = parseFloat((day.grossLoss + Math.abs(t.netProfit)).toFixed(2));
    }

    day.winRate = parseFloat(((day.winCount / day.tradesCount) * 100).toFixed(1));
    day.volume = parseFloat(day.volume.toFixed(2));
  });

  return map;
}

export interface MonthBreakdown {
  key: string;
  name: string;
  year: number;
  month: number;
  daysInMonth: number;
  firstDayOfWeek: number;
  trades: Trade[];
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  dailySummaries: Record<string, DailySummary>;
}

/**
 * Group trades by month for monthly performance calendar reporting
 */
export function getMonthsBreakdown(trades: Trade[]): MonthBreakdown[] {
  const map: Record<string, { year: number; month: number; trades: Trade[] }> = {};

  trades.forEach(t => {
    const rawDate = t.closeTime.slice(0, 10).replace(/[./]/g, '-');
    const y = parseInt(rawDate.slice(0, 4), 10) || new Date().getFullYear();
    const m = (parseInt(rawDate.slice(5, 7), 10) || 1) - 1;
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;

    if (!map[key]) {
      map[key] = { year: y, month: m, trades: [] };
    }
    map[key].trades.push(t);
  });

  const sortedKeys = Object.keys(map).sort();

  return sortedKeys.map(key => {
    const { year, month, trades: monthTrades } = map[key];
    const d = new Date(year, month, 1);
    const name = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const dailySummaries = groupTradesByDay(monthTrades);

    let grossProfit = 0;
    let grossLoss = 0;
    let winCount = 0;
    let lossCount = 0;

    monthTrades.forEach(t => {
      if (t.netProfit > 0) {
        grossProfit += t.netProfit;
        winCount++;
      } else if (t.netProfit < 0) {
        grossLoss += Math.abs(t.netProfit);
        lossCount++;
      }
    });

    const netProfit = parseFloat((grossProfit - grossLoss).toFixed(2));
    const totalTrades = monthTrades.length;
    const winRate = totalTrades > 0 ? parseFloat(((winCount / totalTrades) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

    let bestDay = { date: '-', pnl: 0 };
    let worstDay = { date: '-', pnl: 0 };

    Object.values(dailySummaries).forEach(day => {
      if (day.netProfit > bestDay.pnl) {
        bestDay = { date: day.date, pnl: day.netProfit };
      }
      if (day.netProfit < worstDay.pnl) {
        worstDay = { date: day.date, pnl: day.netProfit };
      }
    });

    return {
      key,
      name,
      year,
      month,
      daysInMonth,
      firstDayOfWeek,
      trades: monthTrades,
      totalTrades,
      winCount,
      lossCount,
      winRate,
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      grossLoss: parseFloat(grossLoss.toFixed(2)),
      netProfit,
      profitFactor,
      bestDay,
      worstDay,
      dailySummaries,
    };
  });
}

/**
 * Generate Equity Curve points
 */
export function getEquityCurveData(trades: Trade[], initialBalance: number = 10000) {
  let runningBal = initialBalance;
  let peak = initialBalance;

  const points: {
    label: string;
    timestamp: number;
    balance: number;
    drawdown: number;
    netPnl: number;
    tradeId: string;
  }[] = [
    {
      label: 'Start',
      timestamp: trades.length > 0 ? trades[0].openTimestamp - 3600000 : Date.now(),
      balance: initialBalance,
      drawdown: 0,
      netPnl: 0,
      tradeId: 'start',
    }
  ];

  trades.forEach((t, index) => {
    runningBal = parseFloat((runningBal + t.netProfit).toFixed(2));
    if (runningBal > peak) peak = runningBal;
    const drawdown = parseFloat((peak - runningBal).toFixed(2));

    points.push({
      label: t.closeTime.slice(5, 16),
      timestamp: t.closeTimestamp,
      balance: runningBal,
      drawdown,
      netPnl: t.netProfit,
      tradeId: t.id || `#${index + 1}`,
    });
  });

  return points;
}

/**
 * Symbol Breakdown Stats
 */
export function getSymbolBreakdown(trades: Trade[]) {
  const map: Record<string, {
    symbol: string;
    pnl: number;
    trades: number;
    wins: number;
    losses: number;
    volume: number;
    winRate: number;
    profitFactor: number;
    grossProfit: number;
    grossLoss: number;
  }> = {};

  trades.forEach(t => {
    if (!map[t.symbol]) {
      map[t.symbol] = {
        symbol: t.symbol,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        volume: 0,
        winRate: 0,
        profitFactor: 0,
        grossProfit: 0,
        grossLoss: 0,
      };
    }
    const item = map[t.symbol];
    item.trades++;
    item.volume += t.volume;
    item.pnl = parseFloat((item.pnl + t.netProfit).toFixed(2));

    if (t.netProfit > 0) {
      item.wins++;
      item.grossProfit += t.netProfit;
    } else if (t.netProfit < 0) {
      item.losses++;
      item.grossLoss += Math.abs(t.netProfit);
    }
  });

  return Object.values(map).map(item => ({
    ...item,
    volume: parseFloat(item.volume.toFixed(2)),
    winRate: parseFloat(((item.wins / item.trades) * 100).toFixed(1)),
    profitFactor: item.grossLoss > 0 ? parseFloat((item.grossProfit / item.grossLoss).toFixed(2)) : item.grossProfit > 0 ? 99.9 : 0,
  })).sort((a, b) => b.pnl - a.pnl);
}

/**
 * Day of Week Performance (Monday to Friday)
 */
export function getDayOfWeekBreakdown(trades: Trade[]) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const data = days.map(name => ({ day: name, pnl: 0, trades: 0, wins: 0, winRate: 0 }));

  trades.forEach(t => {
    const d = new Date(t.closeTimestamp);
    const dayIdx = d.getDay();
    data[dayIdx].trades++;
    data[dayIdx].pnl = parseFloat((data[dayIdx].pnl + t.netProfit).toFixed(2));
    if (t.netProfit > 0) data[dayIdx].wins++;
  });

  return data
    .filter((_, idx) => idx >= 1 && idx <= 5) // Monday to Friday
    .map(item => ({
      ...item,
      winRate: item.trades > 0 ? parseFloat(((item.wins / item.trades) * 100).toFixed(1)) : 0,
    }));
}

/**
 * Hour of Day Performance (0-23 hours)
 */
export function getHourOfDayBreakdown(trades: Trade[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    pnl: 0,
    trades: 0,
    wins: 0,
  }));

  trades.forEach(t => {
    const d = new Date(t.closeTimestamp);
    const h = d.getHours();
    if (hours[h]) {
      hours[h].trades++;
      hours[h].pnl = parseFloat((hours[h].pnl + t.netProfit).toFixed(2));
      if (t.netProfit > 0) hours[h].wins++;
    }
  });

  return hours;
}

/**
 * AI Trading Coach & Psychological Blindspot Detector
 */
export function getAIInsights(trades: Trade[], metrics: TradingMetrics): AIInsight[] {
  const insights: AIInsight[] = [];

  if (trades.length === 0) {
    return [
      {
        id: 'no-data',
        type: 'info',
        title: 'Ready for Analysis',
        description: 'Upload your MT5/MT4 Excel statement or explore the sample portfolio to unlock AI psychological and execution coaching.',
      }
    ];
  }

  // 1. Revenge Trading Detection
  // Check if a loss was followed by another trade within 15 minutes
  let revengeCount = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    const current = trades[i];
    const next = trades[i + 1];
    if (current.isLoss) {
      const timeDiffMinutes = (next.openTimestamp - current.closeTimestamp) / (1000 * 60);
      if (timeDiffMinutes >= 0 && timeDiffMinutes <= 15) {
        revengeCount++;
      }
    }
  }

  if (revengeCount > 0) {
    insights.push({
      id: 'revenge-trading',
      type: 'warning',
      title: 'Revenge Trading Alert Detected',
      description: `Detected ${revengeCount} trade(s) entered within 15 minutes of a losing trade. Rapid re-entries after losses frequently lead to emotional drawdown.`,
      metric: `${revengeCount} Rapid Re-entries`,
      actionRecommendation: 'Implement a mandatory 20-minute "cool-off" lockout after taking any loss to reset emotional baseline.',
    });
  } else {
    insights.push({
      id: 'discipline-cooloff',
      type: 'success',
      title: 'Emotional Cooldown Discipline',
      description: 'Zero rapid revenge-trading entries detected after losses. You maintain calm spacing between executions.',
      metric: '100% Cool-off Adherence',
    });
  }

  // 2. Disposition Effect / Hold Time Analysis
  // Do losing trades get held longer than winning trades?
  const winTrades = trades.filter(t => t.isWin);
  const lossTrades = trades.filter(t => t.isLoss);
  const avgWinHold = winTrades.length > 0 ? winTrades.reduce((acc, t) => acc + t.durationMinutes, 0) / winTrades.length : 0;
  const avgLossHold = lossTrades.length > 0 ? lossTrades.reduce((acc, t) => acc + t.durationMinutes, 0) / lossTrades.length : 0;

  if (avgLossHold > avgWinHold * 2.5 && lossTrades.length >= 2) {
    insights.push({
      id: 'disposition-effect',
      type: 'warning',
      title: 'Holding Losers Too Long (Disposition Effect)',
      description: `Your average losing trade is held for ${avgLossHold.toFixed(0)} mins vs ${avgWinHold.toFixed(0)} mins for winners (${(avgLossHold / (avgWinHold || 1)).toFixed(1)}x longer).`,
      metric: `${avgLossHold.toFixed(0)}m vs ${avgWinHold.toFixed(0)}m`,
      actionRecommendation: 'Set hard mechanical Stop Losses on order entry. Never let a scalp or day trade transform into an overnight hope-trade.',
    });
  } else if (winTrades.length > 0 && avgWinHold >= avgLossHold) {
    insights.push({
      id: 'let-winners-run',
      type: 'success',
      title: 'Letting Winners Run',
      description: 'You give winning setups room to breathe and cut losing trades promptly. Excellent execution hygiene.',
      metric: `${avgWinHold.toFixed(0)}m avg winner duration`,
    });
  }

  // 3. Win Rate vs Risk-to-Reward Harmony
  if (metrics.winRate >= 50 && metrics.profitFactor >= 1.5) {
    insights.push({
      id: 'profitable-edge',
      type: 'success',
      title: 'Positive Mathematical Edge',
      description: `Your strategy shows a solid ${metrics.winRate}% win rate combined with a ${metrics.profitFactor} Profit Factor, yielding an expectancy of $${metrics.expectancy} per trade.`,
      metric: `Expectancy: $${metrics.expectancy} / trade`,
      actionRecommendation: 'Scale up capital gradually without changing your entry checklist or sizing model.',
    });
  } else if (metrics.profitFactor < 1.0) {
    insights.push({
      id: 'edge-underwater',
      type: 'warning',
      title: 'Profit Factor Below 1.0',
      description: `Gross losses ($${metrics.grossLoss}) exceed gross profits ($${metrics.grossProfit}). Focus on cutting the tail of outsized losing trades.`,
      metric: `PF: ${metrics.profitFactor}`,
      actionRecommendation: 'Review your largest losing trades in the Journal tab and cap max dollar risk per setup.',
    });
  }

  // 4. Overtrading by Daily Volume
  const dailyMap = groupTradesByDay(trades);
  const dailyCounts = Object.values(dailyMap).map(d => d.tradesCount);
  const avgDailyTrades = dailyCounts.length > 0 ? dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length : 0;
  const maxDayTrades = Math.max(...dailyCounts, 0);

  if (maxDayTrades > avgDailyTrades * 3 && maxDayTrades >= 5) {
    insights.push({
      id: 'overtrading-spike',
      type: 'tip',
      title: 'Overtrading Outlier Day',
      description: `You had a peak session with ${maxDayTrades} trades, compared to your daily average of ${avgDailyTrades.toFixed(1)}. High frequency trading days often degrade edge.`,
      metric: `Peak: ${maxDayTrades} trades/day`,
      actionRecommendation: 'Cap maximum trades to 3-4 high-conviction setups per day.',
    });
  }

  return insights;
}

/**
 * Prop Firm Rule Monitor (FTMO / The5ers / FundedNext standard rules)
 */
export function getPropFirmRules(trades: Trade[], initialBalance: number = 10000): PropFirmRule[] {
  const metrics = calculateMetrics(trades, initialBalance);
  const dailyMap = groupTradesByDay(trades);

  // 1. Worst single-day drawdown %
  let worstDailyDrop = 0;
  Object.values(dailyMap).forEach(d => {
    if (d.netProfit < 0) {
      const drop = Math.abs(d.netProfit);
      if (drop > worstDailyDrop) worstDailyDrop = drop;
    }
  });

  const worstDailyDropPct = initialBalance > 0 ? (worstDailyDrop / initialBalance) * 100 : 0;
  const maxDailyLimitPct = 5.0; // Standard 5% daily loss limit
  const dailyStatus = worstDailyDropPct >= maxDailyLimitPct ? 'violated' : worstDailyDropPct >= 3.5 ? 'warning' : 'passed';

  // 2. Max Total Drawdown %
  const maxDdLimitPct = 10.0; // Standard 10% max total loss limit
  const totalDdStatus = metrics.maxDrawdownPercent >= maxDdLimitPct ? 'violated' : metrics.maxDrawdownPercent >= 7.0 ? 'warning' : 'passed';

  // 3. Profit Target % (10% target)
  const profitTargetPct = 10.0;
  const currentReturnPct = metrics.totalReturnPercent;
  const targetStatus = currentReturnPct >= profitTargetPct ? 'passed' : 'warning';

  return [
    {
      name: 'Max Daily Loss (5% Rule)',
      limit: maxDailyLimitPct,
      current: parseFloat(worstDailyDropPct.toFixed(2)),
      status: dailyStatus,
      description: `Max allowed single-day loss is $${(initialBalance * 0.05).toFixed(0)} (5%). Worst day drop: $${worstDailyDrop.toFixed(2)} (${worstDailyDropPct.toFixed(2)}%).`,
    },
    {
      name: 'Max Overall Drawdown (10% Rule)',
      limit: maxDdLimitPct,
      current: parseFloat(metrics.maxDrawdownPercent.toFixed(2)),
      status: totalDdStatus,
      description: `Trailing/Fixed equity drawdown limit is $${(initialBalance * 0.10).toFixed(0)} (10%). Current Max DD: $${metrics.maxDrawdownDollars.toFixed(2)} (${metrics.maxDrawdownPercent.toFixed(2)}%).`,
    },
    {
      name: 'Phase 1 Profit Target (10%)',
      limit: profitTargetPct,
      current: parseFloat(currentReturnPct.toFixed(2)),
      status: targetStatus,
      description: `Target is +$${(initialBalance * 0.10).toFixed(0)} (+10%). Current progress: ${currentReturnPct > 0 ? '+' : ''}$${metrics.netProfit.toFixed(2)} (${currentReturnPct.toFixed(2)}%).`,
    },
  ];
}
