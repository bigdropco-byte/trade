import React, { useMemo } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  ShieldCheck, 
  Target, 
  Flame, 
  Scale 
} from 'lucide-react';
import { Trade, TradingMetrics } from '../types/trade';
import { getAIInsights } from '../utils/analytics';

interface AICoachInsightsProps {
  trades: Trade[];
  metrics: TradingMetrics;
}

export const AICoachInsights: React.FC<AICoachInsightsProps> = ({ trades, metrics }) => {
  const insights = useMemo(() => getAIInsights(trades, metrics), [trades, metrics]);

  // Compute Discipline Score (0 to 100)
  const tradesWithSL = trades.filter(t => t.sl !== null && t.sl !== undefined && t.sl > 0).length;
  const slAdherencePct = trades.length > 0 ? (tradesWithSL / trades.length) * 100 : 100;

  let revengeCount = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].isLoss) {
      const diffMin = (trades[i + 1].openTimestamp - trades[i].closeTimestamp) / 60000;
      if (diffMin >= 0 && diffMin <= 15) revengeCount++;
    }
  }
  const revengeDeduction = Math.min(35, revengeCount * 12);
  const revengeScore = Math.max(0, 35 - revengeDeduction);

  const winTrades = trades.filter(t => t.isWin);
  const lossTrades = trades.filter(t => t.isLoss);
  const avgWinHold = winTrades.length > 0 ? winTrades.reduce((acc, t) => acc + t.durationMinutes, 0) / winTrades.length : 1;
  const avgLossHold = lossTrades.length > 0 ? lossTrades.reduce((acc, t) => acc + t.durationMinutes, 0) / lossTrades.length : 1;

  let holdHygieneScore = 30;
  if (avgLossHold > avgWinHold * 3 && lossTrades.length >= 2) {
    holdHygieneScore = 10;
  } else if (avgLossHold > avgWinHold * 1.5) {
    holdHygieneScore = 20;
  }

  const overallDisciplineScore = Math.round(
    (slAdherencePct * 0.35) + revengeScore + holdHygieneScore
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* AI Coach Hero Banner (Light White Card) */}
      <div className="relative bg-gradient-to-r from-indigo-50/80 via-white to-emerald-50/80 border border-indigo-200/80 rounded-2xl p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <span>TradeScrapbook AI Psychological Engine</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Trading Psychology & Execution Audit
            </h2>
            <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
              Algorithmic scanning of your execution history to uncover subconscious trading mistakes, emotional tilt, revenge trading, and expectancy leaks.
            </p>
          </div>

          {/* Discipline Score Badge */}
          <div className="flex items-center gap-4 bg-white border border-indigo-200 p-4 rounded-2xl shadow-xs">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="#E2E8F0"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke={overallDisciplineScore >= 75 ? '#10B981' : overallDisciplineScore >= 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * overallDisciplineScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-black font-mono text-slate-900">
                {overallDisciplineScore}%
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Execution Score</div>
              <div className="text-base font-extrabold text-slate-900">
                {overallDisciplineScore >= 80 ? 'Master Discipline' : overallDisciplineScore >= 60 ? 'Consistent Trader' : 'Emotional Drawdown Risk'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {revengeCount === 0 ? 'Zero revenge entries' : `${revengeCount} revenge tilt warnings`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Psychology Metric Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Hard Stop Loss Usage
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">{slAdherencePct.toFixed(0)}%</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {tradesWithSL} of {trades.length} positions entered with mechanical stop loss protection.
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all" 
              style={{ width: `${slAdherencePct}%` }} 
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              Revenge Trading Frequency
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">{revengeCount} detected</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {revengeCount === 0 
              ? 'Excellent calm baseline maintained between losing trades.' 
              : 'Rapid re-entries within 15 mins of a loss detected.'}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all ${revengeCount === 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, revengeCount * 33)}%` }} 
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-teal-600" />
              Loss vs Win Holding Ratio
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {(avgLossHold / (avgWinHold || 1)).toFixed(1)}x
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Winners held avg {avgWinHold.toFixed(0)}m vs Losers held avg {avgLossHold.toFixed(0)}m.
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all ${avgLossHold > avgWinHold * 2 ? 'bg-red-500' : 'bg-teal-500'}`}
              style={{ width: `${Math.min(100, (avgLossHold / (avgWinHold || 1)) * 40)}%` }} 
            />
          </div>
        </div>

      </div>

      {/* Detected Behavioral Patterns */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Algorithmic Observations & Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const isWarning = insight.type === 'warning';
            const isSuccess = insight.type === 'success';

            return (
              <div
                key={insight.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isWarning 
                    ? 'bg-red-50/80 border-red-200' 
                    : isSuccess 
                    ? 'bg-emerald-50/80 border-emerald-200' 
                    : 'bg-indigo-50/80 border-indigo-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isWarning ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    ) : isSuccess ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0" />
                    )}
                    <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
                  </div>
                  {insight.metric && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {insight.metric}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                  {insight.description}
                </p>

                {insight.actionRecommendation && (
                  <div className="mt-3 p-3 bg-white/90 rounded-xl border border-slate-200/80 flex items-start gap-2 text-xs shadow-2xs">
                    <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-700">Next Action: </span>
                      <span className="text-slate-700">{insight.actionRecommendation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
