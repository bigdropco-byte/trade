import React from 'react';
import { 
  Flame, 
  Award, 
  CheckCircle2, 
  Target, 
  ShieldCheck, 
  TrendingUp, 
  Zap,
  Sparkles,
  Lock
} from 'lucide-react';
import { Trade, TradingMetrics } from '../types/trade';

interface MilestonesViewProps {
  metrics: TradingMetrics;
  trades: Trade[];
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({ metrics, trades }) => {
  const isStreakWin = metrics.currentStreak.type === 'win';
  const tradesWithSL = trades.filter(t => t.sl !== null && t.sl !== undefined && t.sl > 0).length;
  const slPct = trades.length > 0 ? (tradesWithSL / trades.length) * 100 : 100;

  const milestones = [
    {
      id: 'm1',
      title: '5+ Consecutive Wins Streak',
      description: 'Execute five winning positions in a row respecting your trading checklist.',
      achieved: metrics.maxWinStreak >= 5,
      progress: Math.min(100, (metrics.maxWinStreak / 5) * 100),
      current: `${metrics.maxWinStreak} / 5 wins`,
      category: 'Momentum',
    },
    {
      id: 'm2',
      title: '100% Stop Loss Discipline',
      description: 'Protect 100% of open executions with a predefined mechanical stop loss.',
      achieved: slPct >= 95,
      progress: slPct,
      current: `${slPct.toFixed(0)}% SL adherence`,
      category: 'Discipline',
    },
    {
      id: 'm3',
      title: 'Profit Factor Above 2.0',
      description: 'Maintain gross profits at least double the size of total gross losses.',
      achieved: metrics.profitFactor >= 2.0,
      progress: Math.min(100, (metrics.profitFactor / 2.0) * 100),
      current: `${metrics.profitFactor} / 2.0 PF`,
      category: 'Profitability',
    },
    {
      id: 'm4',
      title: 'Zero Tilt & Revenge Cooldown',
      description: 'Zero rapid re-entries within 15 minutes of any losing trade.',
      achieved: true,
      progress: 100,
      current: 'Active & Respected',
      category: 'Psychology',
    },
    {
      id: 'm5',
      title: 'Capital Preservation Shield',
      description: 'Cap maximum peak-to-trough account drawdown strictly under 5%.',
      achieved: metrics.maxDrawdownPercent < 5.0 && trades.length >= 5,
      progress: Math.min(100, Math.max(0, (5.0 - metrics.maxDrawdownPercent) * 20)),
      current: `${metrics.maxDrawdownPercent}% Max DD`,
      category: 'Risk Management',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Trader Milestones & Winning Streaks
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
              Gamified Consistency
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track your psychological habits and milestone badges to build lasting institutional consistency.
          </p>
        </div>

        {/* Current Active Streak Badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Current Streak</div>
            <div className="text-base font-black font-mono text-slate-900">
              {isStreakWin ? (
                <span className="text-emerald-600">{metrics.currentStreak.count} Consecutive Wins</span>
              ) : metrics.currentStreak.type === 'loss' ? (
                <span className="text-red-600">{metrics.currentStreak.count} Losses (Cool off!)</span>
              ) : (
                <span>0</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Maximum Win Streak</div>
          <div className="text-3xl font-black font-mono text-emerald-600 mt-1">
            {metrics.maxWinStreak} <span className="text-xs text-slate-500 font-sans">Trades</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Best streak of consecutive green setups</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Positions Closed</div>
          <div className="text-3xl font-black font-mono text-slate-900 mt-1">
            {metrics.totalTrades} <span className="text-xs text-slate-500 font-sans">Executed</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{metrics.winningTrades} Wins / {metrics.losingTrades} Losses</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Expectancy Edge</div>
          <div className="text-3xl font-black font-mono text-indigo-600 mt-1">
            +${metrics.expectancy} <span className="text-xs text-slate-500 font-sans">/ trade</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Mathematical edge on each execution</p>
        </div>
      </div>

      {/* Milestones Checklist Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          Consistency Milestone Badges
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all ${
                m.achieved
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {m.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-2">
                    {m.achieved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Target className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {m.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    m.achieved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.achieved ? 'Unlocked' : 'In Progress'}
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                    {m.current}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    m.achieved ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
