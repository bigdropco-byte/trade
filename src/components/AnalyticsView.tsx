import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Globe
} from 'lucide-react';
import { Trade, TradingMetrics } from '../types/trade';
import { 
  getEquityCurveData, 
  getSymbolBreakdown, 
  getDayOfWeekBreakdown, 
  getHourOfDayBreakdown,
  groupTradesByDay
} from '../utils/analytics';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsViewProps {
  trades: Trade[];
  metrics: TradingMetrics;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades, metrics }) => {
  const [chartColorMode, setChartColorMode] = useState<'trades' | 'baseline'>('trades');

  // Memoize calculations for instant speed
  const equityPoints = useMemo(() => getEquityCurveData(trades, metrics.initialDeposit || 10000), [trades, metrics.initialDeposit]);
  const symbolStats = useMemo(() => getSymbolBreakdown(trades), [trades]);
  const dayStats = useMemo(() => getDayOfWeekBreakdown(trades), [trades]);
  const hourStats = useMemo(() => getHourOfDayBreakdown(trades), [trades]);

  const dailyMap = useMemo(() => groupTradesByDay(trades), [trades]);
  const sortedDays = useMemo(() => Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)), [dailyMap]);

  // 1. Equity Curve Chart Data with Dynamic Profit (Green) vs Loss (Red) coloring
  const equityChartData = useMemo(() => {
    const initialDeposit = metrics.initialDeposit || 10000;

    return {
      labels: equityPoints.map(p => p.label),
      datasets: [
        {
          label: 'Account Equity ($)',
          data: equityPoints.map(p => p.balance),
          borderWidth: 2.5,
          fill: true,
          tension: 0.25,
          // When profit time show green (#10B981), when loss time show red (#EF4444)
          segment: {
            borderColor: (ctx: any) => {
              if (chartColorMode === 'baseline') {
                return (ctx.p1?.parsed?.y ?? 0) >= initialDeposit ? '#10B981' : '#EF4444';
              }
              const p0y = ctx.p0?.parsed?.y ?? 0;
              const p1y = ctx.p1?.parsed?.y ?? 0;
              return p1y >= p0y ? '#10B981' : '#EF4444';
            },
            backgroundColor: (ctx: any) => {
              if (chartColorMode === 'baseline') {
                return (ctx.p1?.parsed?.y ?? 0) >= initialDeposit 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : 'rgba(239, 68, 68, 0.12)';
              }
              const p0y = ctx.p0?.parsed?.y ?? 0;
              const p1y = ctx.p1?.parsed?.y ?? 0;
              return p1y >= p0y 
                ? 'rgba(16, 185, 129, 0.12)' 
                : 'rgba(239, 68, 68, 0.12)';
            },
          },
          pointBackgroundColor: equityPoints.map((p, i) => {
            if (i === 0) return '#94A3B8';
            if (chartColorMode === 'baseline') {
              return p.balance >= initialDeposit ? '#10B981' : '#EF4444';
            }
            return p.netPnl >= 0 ? '#10B981' : '#EF4444';
          }),
          pointBorderColor: equityPoints.map((p, i) => {
            if (i === 0) return '#64748B';
            if (chartColorMode === 'baseline') {
              return p.balance >= initialDeposit ? '#059669' : '#DC2626';
            }
            return p.netPnl >= 0 ? '#059669' : '#DC2626';
          }),
          pointBorderWidth: 1.5,
          pointRadius: equityPoints.length > 50 ? 2 : 3.5,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [equityPoints, chartColorMode, metrics.initialDeposit]);

  // 2. Daily P&L Bar Chart
  const dailyBarData = useMemo(() => ({
    labels: sortedDays.map(d => d.date.slice(5)),
    datasets: [
      {
        label: 'Daily Net P&L ($)',
        data: sortedDays.map(d => d.netProfit),
        backgroundColor: sortedDays.map(d => d.netProfit >= 0 ? '#10B981' : '#EF4444'),
        borderRadius: 4,
      },
    ],
  }), [sortedDays]);

  // 3. Day of Week Chart Data
  const dayBarData = useMemo(() => ({
    labels: dayStats.map(d => d.day),
    datasets: [
      {
        label: 'Net P&L by Day ($)',
        data: dayStats.map(d => d.pnl),
        backgroundColor: dayStats.map(d => d.pnl >= 0 ? '#10B981' : '#EF4444'),
        borderRadius: 6,
      },
    ],
  }), [dayStats]);

  // 4. Hour of Day Chart Data
  const activeHours = hourStats.filter(h => h.trades > 0 || Math.abs(h.pnl) > 0);
  const hourBarData = useMemo(() => ({
    labels: (activeHours.length > 0 ? activeHours : hourStats.slice(6, 22)).map(h => h.hour),
    datasets: [
      {
        label: 'P&L by Hour ($)',
        data: (activeHours.length > 0 ? activeHours : hourStats.slice(6, 22)).map(h => h.pnl),
        backgroundColor: (activeHours.length > 0 ? activeHours : hourStats.slice(6, 22)).map(h => h.pnl >= 0 ? '#10B981' : '#EF4444'),
        borderRadius: 4,
      },
    ],
  }), [activeHours, hourStats]);

  const equityChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#334155',
        bodyColor: '#0F172A',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            const p = equityPoints[idx];
            if (!p) return '';
            return idx === 0 ? `${p.label} (Starting Balance)` : `${p.label} (Trade #${idx})`;
          },
          label: (context: any) => {
            const idx = context.dataIndex;
            const p = equityPoints[idx];
            const eqStr = `Equity: $${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            if (idx === 0 || !p) return eqStr;
            const pnlStr = p.netPnl >= 0 
              ? `+$${p.netPnl.toFixed(2)} (Profit)` 
              : `-$${Math.abs(p.netPnl).toFixed(2)} (Loss)`;
            return [eqStr, `Trade P&L: ${pnlStr}`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 10 } },
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { 
          color: '#64748B', 
          font: { size: 10 },
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
      },
    },
  }), [equityPoints]);

  const baseChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 }, // fast responsive rendering
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#64748B',
        bodyColor: '#0F172A',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            return `P&L: ${val >= 0 ? '+' : ''}$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 10 } },
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { 
          color: '#64748B', 
          font: { size: 10 },
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
      },
    },
  }), []);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Section: Long vs Short Ratio & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Long Execution Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              Long Trades (Buys)
            </span>
            <span className="text-xs font-mono text-slate-500">{metrics.longTrades} trades</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black font-mono text-slate-900">{metrics.longWinRate}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Win Rate ({metrics.longWins} Wins)</div>
            </div>
            <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${metrics.longWinRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Short Execution Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              Short Trades (Sells)
            </span>
            <span className="text-xs font-mono text-slate-500">{metrics.shortTrades} trades</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black font-mono text-slate-900">{metrics.shortWinRate}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Win Rate ({metrics.shortWins} Wins)</div>
            </div>
            <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-red-500 h-full rounded-full transition-all" 
                style={{ width: `${metrics.shortWinRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Trade Holding Profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Holding Duration
            </span>
            <span className="text-xs font-mono text-slate-500">Average</span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-slate-900">
              {metrics.avgHoldTimeMinutes >= 60 
                ? `${(metrics.avgHoldTimeMinutes / 60).toFixed(1)} Hours` 
                : `${metrics.avgHoldTimeMinutes.toFixed(0)} Mins`}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Average time spent per position</div>
          </div>
        </div>

      </div>

      {/* Row 1: Equity Curve & Daily Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cumulative Equity Curve */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Cumulative Equity & Drawdown
                </h3>
                {/* Visual Legend */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Profit (Green)
                  </span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Loss (Red)
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {chartColorMode === 'trades' 
                  ? 'Showing green during profit trades, red during losing trades' 
                  : 'Showing green above deposit, red during account drawdown'}
              </p>
            </div>

            {/* Color Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
              <button
                onClick={() => setChartColorMode('trades')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  chartColorMode === 'trades'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Green for winning trades, Red for losing trades"
              >
                By Trade
              </button>
              <button
                onClick={() => setChartColorMode('baseline')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  chartColorMode === 'baseline'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Green above starting balance, Red below starting balance"
              >
                By Balance
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <Line data={equityChartData} options={equityChartOptions} />
          </div>
        </div>

        {/* Daily Net P&L Bars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  Daily Net P&L Distribution
                </h3>
                {/* Visual Legend */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Win Days
                  </span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Loss Days
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Green bars for profitable days, red bars for loss days</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <Bar data={dailyBarData} options={baseChartOptions} />
          </div>
        </div>

      </div>

      {/* Row 2: Day of Week & Hour of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Day of Week Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                P&L by Day of the Week
              </h3>
              <p className="text-xs text-slate-500">Discover your most consistent weekday</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <Bar data={dayBarData} options={baseChartOptions} />
          </div>
        </div>

        {/* Hour of Day / Session Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Performance by Hour (UTC / Server)
              </h3>
              <p className="text-xs text-slate-500">Session breakdown (Asian, London, NY)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <Bar data={hourBarData} options={baseChartOptions} />
          </div>
        </div>

      </div>

      {/* Row 3: Symbol / Asset Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              Instrument & Symbol Breakdown
            </h3>
            <p className="text-xs text-slate-500">Detailed profitability by traded asset</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase">
                <th className="py-3 pl-3">Symbol</th>
                <th className="py-3 text-right">Trades</th>
                <th className="py-3 text-right">Volume (Lots)</th>
                <th className="py-3 text-right">Win Rate</th>
                <th className="py-3 text-right">Profit Factor</th>
                <th className="py-3 text-right">Gross Profit</th>
                <th className="py-3 text-right">Gross Loss</th>
                <th className="py-3 pr-3 text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {symbolStats.map((sym) => (
                <tr key={sym.symbol} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pl-3 font-bold text-slate-900 flex items-center gap-2 font-sans">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {sym.symbol}
                  </td>
                  <td className="py-3 text-right text-slate-700">{sym.trades}</td>
                  <td className="py-3 text-right text-slate-700">{sym.volume}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      sym.winRate >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {sym.winRate}%
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-800">{sym.profitFactor}</td>
                  <td className="py-3 text-right text-emerald-600 font-bold">+${sym.grossProfit.toFixed(2)}</td>
                  <td className="py-3 text-right text-red-600 font-bold">-${sym.grossLoss.toFixed(2)}</td>
                  <td className={`py-3 pr-3 text-right font-bold text-sm ${
                    sym.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {sym.pnl >= 0 ? '+' : ''}${sym.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
