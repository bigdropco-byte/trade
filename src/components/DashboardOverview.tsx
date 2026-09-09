import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Flame, 
  Target, 
  Clock, 
  Zap, 
  ArrowUpRight, 
  BrainCircuit, 
  Award,
  Eye,
  EyeOff,
  Edit2,
  Check,
  Tag,
  Shield
} from 'lucide-react';
import { AccountInfo, Trade, TradingMetrics } from '../types/trade';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getEquityCurveData } from '../utils/analytics';
import { maskAccountNumber, maskTraderName, maskBroker } from '../utils/privacy';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardOverviewProps {
  metrics: TradingMetrics;
  trades: Trade[];
  accountInfo: AccountInfo;
  onSelectTab: (tab: string) => void;
  onSelectTrade: (trade: Trade) => void;
  isPrivacyMasked?: boolean;
  onTogglePrivacyMask?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  trades,
  accountInfo,
  onSelectTab,
  onSelectTrade,
  isPrivacyMasked = true,
  onTogglePrivacyMask,
}) => {
  const [chartColorMode, setChartColorMode] = useState<'trades' | 'baseline'>('trades');
  const isNetProfitable = metrics.netProfit >= 0;
  
  // Memoize equity curve data for instant rendering
  const equityPoints = useMemo(() => {
    return getEquityCurveData(trades, metrics.initialDeposit || 10000);
  }, [trades, metrics.initialDeposit]);

  // Equity chart configuration with Dynamic Profit (Green) vs Loss (Red) coloring
  const chartData = useMemo(() => {
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

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 }, // Fast rendering
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
        ticks: { color: '#64748B', font: { size: 10 }, maxTicksLimit: 7 },
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

  const [accountAlias, setAccountAlias] = useState<string>(() => {
    return localStorage.getItem(`tradescrapbook_alias_${accountInfo.account || 'default'}`) || 
           localStorage.getItem(`tradepulse_alias_${accountInfo.account || 'default'}`) || '';
  });
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState('');

  const handleSaveAlias = () => {
    const trimmed = aliasDraft.trim();
    setAccountAlias(trimmed);
    localStorage.setItem(`tradescrapbook_alias_${accountInfo.account || 'default'}`, trimmed);
    setIsEditingAlias(false);
  };

  const displayName = maskTraderName(accountInfo.name || 'Marcus Sterling', isPrivacyMasked);
  const displayAccount = maskAccountNumber(accountInfo.account || '94827105', isPrivacyMasked);
  const displayBroker = maskBroker(accountInfo.broker || 'Apex Capital Markets Ltd', isPrivacyMasked);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Account Profile Header Bar (Light White Card with Deep Privacy Controls) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {displayName}
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Real MT5 Account
            </span>
            {accountAlias && !isEditingAlias && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                <Tag className="w-3 h-3" />
                <span>{accountAlias}</span>
              </span>
            )}
            {onTogglePrivacyMask && (
              <button
                onClick={onTogglePrivacyMask}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                  isPrivacyMasked 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title={isPrivacyMasked ? "Privacy Mode is ACTIVE: Account # and trader identity are masked. Click to reveal." : "Privacy Mode is OFF: Click to mask sensitive account data."}
              >
                {isPrivacyMasked ? <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isPrivacyMasked ? 'Privacy Masked' : 'Privacy Unmasked'}</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Broker: <strong className="text-slate-800">{displayBroker}</strong></span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span>Account: <strong className="text-slate-800 font-mono">#{displayAccount}</strong></span>
              {!isEditingAlias ? (
                <button
                  onClick={() => {
                    setAliasDraft(accountAlias);
                    setIsEditingAlias(true);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                  title="Assign account nickname / alias (e.g. FTMO 100K, Apex Funded)"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                  <input
                    type="text"
                    value={aliasDraft}
                    onChange={(e) => setAliasDraft(e.target.value)}
                    placeholder="Nickname..."
                    className="text-xs font-semibold px-1 py-0.5 bg-white border border-slate-300 rounded text-slate-800 w-28 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveAlias}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    title="Save Nickname"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </span>
            <span>•</span>
            <span>Currency: <strong className="text-slate-800">{accountInfo.currency || 'USD'}</strong></span>
            <span>•</span>
            <span>Report Date: <strong className="text-slate-600">{accountInfo.reportDate || '2026.09.09'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Current Balance</div>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              ${(accountInfo.balance || metrics.endingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Account Equity</div>
            <div className="text-xl font-extrabold font-mono text-emerald-600">
              ${(accountInfo.equity || metrics.endingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Hero Grid (Crisp White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Net P&L */}
        <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Net Profit & Loss</span>
            {isNetProfitable ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isNetProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
              {isNetProfitable ? '+' : ''}${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isNetProfitable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}%
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Gross Profit: <strong className="text-emerald-600 font-mono">+${metrics.grossProfit.toFixed(2)}</strong></span>
            <span>Gross Loss: <strong className="text-red-600 font-mono">-${metrics.grossLoss.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Win Rate</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {metrics.winRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                <span className="text-emerald-600 font-semibold">{metrics.winningTrades} Wins</span>
                {' / '}
                <span className="text-red-600 font-semibold">{metrics.losingTrades} Losses</span>
                {metrics.breakevenTrades > 0 && <span> ({metrics.breakevenTrades} BE)</span>}
              </div>
            </div>

            {/* Circular Progress Indicator (Light Track) */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  stroke="#E2E8F0"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  stroke="#10B981"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={144.5}
                  strokeDashoffset={144.5 - (144.5 * metrics.winRate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <Percent className="w-4 h-4 text-slate-400 absolute" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Long Win: <strong className="text-slate-800">{metrics.longWinRate}%</strong></span>
            <span>Short Win: <strong className="text-slate-800">{metrics.shortWinRate}%</strong></span>
          </div>
        </div>

        {/* Card 3: Profit Factor */}
        <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Profit Factor</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
              {metrics.profitFactor}
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              metrics.profitFactor >= 2.0 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : metrics.profitFactor >= 1.2 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {metrics.profitFactor >= 2.0 ? 'Exceptional' : metrics.profitFactor >= 1.2 ? 'Profitable' : 'Underwater'}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avg Win: <strong className="text-emerald-600 font-mono">+${metrics.avgWin.toFixed(2)}</strong></span>
            <span>Avg Loss: <strong className="text-red-600 font-mono">-${metrics.avgLoss.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Card 4: Expectancy & Max Drawdown */}
        <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Trade Expectancy</span>
            <Zap className="w-4 h-4 text-teal-600" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${metrics.expectancy >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
              {metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ trade</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Max Drawdown:</span>
            <strong className="text-red-600 font-mono">-${metrics.maxDrawdownDollars.toFixed(2)} ({metrics.maxDrawdownPercent}%)</strong>
          </div>
        </div>

      </div>

      {/* Secondary Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Trades</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{metrics.totalTrades}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.totalVolume.toFixed(2)} total lots</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Sharpe Ratio</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{metrics.sharpeRatio}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Risk-adjusted return</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Win/Loss Ratio</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">1 : {metrics.winLossRatio}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Payoff ratio</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Avg Hold Time</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {metrics.avgHoldTimeMinutes >= 60 
              ? `${(metrics.avgHoldTimeMinutes / 60).toFixed(1)} hrs` 
              : `${metrics.avgHoldTimeMinutes.toFixed(0)} mins`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Execution duration</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Largest Win</div>
          <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">+${metrics.largestWin.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Best setup payout</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Current Streak</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5 flex items-center gap-1">
            {metrics.currentStreak.type === 'win' ? (
              <span className="text-emerald-600 font-bold">{metrics.currentStreak.count}W Streak</span>
            ) : metrics.currentStreak.type === 'loss' ? (
              <span className="text-red-600 font-bold">{metrics.currentStreak.count}L Streak</span>
            ) : (
              <span>0</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Max Win: {metrics.maxWinStreak}W / Max Loss: {metrics.maxLossStreak}L</div>
        </div>

      </div>

      {/* Main Row: Equity Curve Chart & Recent Executions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Equity Curve Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Cumulative Equity Curve
                </h2>
                {/* Visual Legend: Profit Green, Loss Red */}
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

            <div className="flex items-center gap-2">
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
                  By Trade P&L
                </button>
                <button
                  onClick={() => setChartColorMode('baseline')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    chartColorMode === 'baseline'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Green when account > starting deposit, Red when in drawdown"
                >
                  By Balance
                </button>
              </div>

              <button
                onClick={() => onSelectTab('analytics')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer ml-1"
              >
                <span>Analytics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Executions Side Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Recent Trades
              </h2>
              <p className="text-xs text-slate-500">Latest executed positions</p>
            </div>
            <button
              onClick={() => onSelectTab('journal')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({trades.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-72 pr-1">
            {trades.slice(-5).reverse().map((trade) => (
              <div
                key={trade.id}
                onClick={() => onSelectTrade(trade)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${trade.type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{trade.symbol}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        trade.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {trade.type} {trade.volume}L
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {trade.closeTime.slice(5, 16)} • {trade.durationFormatted}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-bold font-mono ${trade.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {trade.pips >= 0 ? '+' : ''}{trade.pips} pips
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onSelectTab('calendar')}
          className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Signature Feature</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors">
            Interactive Performance Calendar
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Visual month-by-month daily P&L breakdown with green/red day indicators and day drill-down.
          </p>
        </div>

        <div 
          onClick={() => onSelectTab('aicoach')}
          className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">AI Psychology</span>
            <BrainCircuit className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-emerald-600 transition-colors">
            AI Trading Coach & Blindspots
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Detects revenge trading, overtrading days, hold time discipline, and execution habits.
          </p>
        </div>

        <div 
          onClick={() => onSelectTab('propfirm')}
          className="p-4 bg-white border border-slate-200 hover:border-amber-300 rounded-2xl cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Challenge Tracker</span>
            <Award className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-amber-600 transition-colors">
            Prop Firm Rules Simulator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Live monitoring for FTMO & 5ers rules: 5% Max Daily Loss, 10% Overall Drawdown, and Target.
          </p>
        </div>

      </div>

    </div>
  );
};
