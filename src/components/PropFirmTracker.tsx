import React, { useState, useMemo } from 'react';
import { 
  Award, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon 
} from 'lucide-react';
import { Trade, TradingMetrics } from '../types/trade';
import { getPropFirmRules } from '../utils/analytics';

interface PropFirmTrackerProps {
  trades: Trade[];
  metrics: TradingMetrics;
}

export const PropFirmTracker: React.FC<PropFirmTrackerProps> = ({ trades, metrics }) => {
  const [accountSize, setAccountSize] = useState<number>(metrics.initialDeposit || 10000);
  const rules = useMemo(() => getPropFirmRules(trades, accountSize), [trades, accountSize]);

  const sizes = [10000, 25000, 50000, 100000, 200000];

  const hasViolation = rules.some(r => r.status === 'violated');
  const targetPassed = rules.find(r => r.name.includes('Target'))?.status === 'passed';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Bar (Light White Card) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Prop Firm Challenge Evaluation Monitor
            </h2>
            <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md border ${
              hasViolation 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : targetPassed 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {hasViolation ? 'Rule Breach' : targetPassed ? 'Target Passed' : 'In Progress'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate your trading record against FTMO, FundedNext, and The5ers rules.
          </p>
        </div>

        {/* Account Size Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-[11px] text-slate-500 px-2 font-medium">Account Size:</span>
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => setAccountSize(size)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono cursor-pointer transition-colors ${
                accountSize === size ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ${size / 1000}k
            </button>
          ))}
        </div>
      </div>

      {/* Rules Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rules.map((rule) => {
          const isPassed = rule.status === 'passed';
          const isWarning = rule.status === 'warning';
          const isViolated = rule.status === 'violated';

          const pctOfLimit = rule.name.includes('Target') 
            ? Math.min(100, (rule.current / rule.limit) * 100) 
            : Math.min(100, (rule.current / rule.limit) * 100);

          return (
            <div
              key={rule.name}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isViolated 
                  ? 'border-red-300 bg-red-50/40' 
                  : isPassed 
                  ? 'border-emerald-300 bg-emerald-50/40' 
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{rule.name}</span>
                  {isViolated ? (
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                  ) : isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {rule.current}%
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ {rule.limit}% Max</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    isViolated ? 'bg-red-100 text-red-800' : isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {rule.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rule.name.includes('Target')
                        ? 'bg-emerald-500'
                        : isViolated
                        ? 'bg-red-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.max(3, pctOfLimit)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {rule.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                <span>Account: ${accountSize.toLocaleString()}</span>
                <span>Buffer: ${(accountSize * ((rule.limit - rule.current) / 100)).toFixed(0)}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
