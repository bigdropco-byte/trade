import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp, 
  Flame, 
  Tag, 
  Sparkles,
  X,
  BookOpen
} from 'lucide-react';
import { PlaybookItem, Trade } from '../types/trade';

interface PlaybookViewProps {
  trades: Trade[];
}

export const PlaybookView: React.FC<PlaybookViewProps> = ({ trades }) => {
  const [playbooks, setPlaybooks] = useState<PlaybookItem[]>([
    {
      id: 'pb-1',
      name: 'Gold London Liquidity Sweep',
      category: 'Scalping / Day Trading',
      description: 'Wait for Asian session high or low to be swept during London open, followed by a 1m/5m market structure break.',
      timeframe: '1m / 5m',
      rules: [
        'Asian session range marked before 07:00 UTC',
        'Wait for liquidity sweep above/below Asian high/low',
        'Displacement candle confirming shift in market structure',
        'Enter on 50% retracement of displacement leg with hard stop loss',
        'Take profit at opposite session liquidity (1:2.5 minimum R:R)'
      ],
      winRate: 75.0,
      tradesCount: 4,
      totalPnl: 382.00,
      profitFactor: 3.8,
      status: 'active',
    },
    {
      id: 'pb-2',
      name: '15m Fair Value Gap Trend Continuation',
      category: 'Trend Following',
      description: 'Identifies strong 4H/1H directional bias, waiting for a 15-minute pullback into an unfilled Fair Value Gap (FVG).',
      timeframe: '15m',
      rules: [
        'Higher timeframe (4H) trend aligned with 20/50 EMA',
        'Clear 3-candle imbalance (Fair Value Gap) created with volume',
        'Enter limit or market order inside the FVG zone',
        'SL placed 5 pips beyond the swing high/low',
        'Scale out 50% at 1:1.5 and trail remainder'
      ],
      winRate: 66.7,
      tradesCount: 6,
      totalPnl: 412.50,
      profitFactor: 2.9,
      status: 'active',
    },
    {
      id: 'pb-3',
      name: 'NY Open Index Expansion (US30)',
      category: 'Momentum',
      description: 'Explosive expansion off pre-market opening range support or resistance at 09:30 AM New York time.',
      timeframe: '5m / 15m',
      rules: [
        'Mark pre-market 08:30-09:30 high and low',
        'Avoid taking positions during the first 5 minutes of high volatility',
        'Enter on first confirmed 5m close outside the opening range',
        'Tight 30-40 pt SL on Dow Jones (US30)',
        'Target 100+ points into daily key levels'
      ],
      winRate: 60.0,
      tradesCount: 5,
      totalPnl: 270.00,
      profitFactor: 2.1,
      status: 'active',
    },
  ]);

  const [isAddingPlaybook, setIsAddingPlaybook] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Day Trading');
  const [newDescription, setNewDescription] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('15m');
  const [newRuleInput, setNewRuleInput] = useState('');
  const [newRules, setNewRules] = useState<string[]>([]);

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setNewRules([...newRules, newRuleInput.trim()]);
    setNewRuleInput('');
  };

  const handleCreatePlaybook = () => {
    if (!newTitle.trim()) return;
    const item: PlaybookItem = {
      id: `pb-${Date.now()}`,
      name: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Custom user playbook setup strategy.',
      timeframe: newTimeframe,
      rules: newRules.length > 0 ? newRules : ['Defined entry checklist', 'Stop loss required on entry'],
      winRate: 100.0,
      tradesCount: 1,
      totalPnl: 50.0,
      profitFactor: 9.9,
      status: 'active',
    };
    setPlaybooks([...playbooks, item]);
    setIsAddingPlaybook(false);
    setNewTitle('');
    setNewDescription('');
    setNewRules([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Playbook & Setup Library
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              {playbooks.length} Active Setups
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build, document, and track mathematical edge across your A+ trading models.
          </p>
        </div>

        <button
          onClick={() => setIsAddingPlaybook(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Playbook Setup</span>
        </button>
      </div>

      {/* Playbook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {playbooks.map((pb) => (
          <div
            key={pb.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
          >
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {pb.category}
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {pb.timeframe}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-emerald-700 transition-colors">
                {pb.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {pb.description}
              </p>

              {/* Rules Checklist */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 mb-2">Execution Rules:</div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {pb.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Stats Row */}
            <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[9px] uppercase font-bold text-slate-500">Win Rate</div>
                <div className="text-sm font-black font-mono text-indigo-700 mt-0.5">
                  {pb.winRate}%
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[9px] uppercase font-bold text-slate-500">P&L</div>
                <div className="text-sm font-black font-mono text-emerald-600 mt-0.5">
                  +${pb.totalPnl}
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-[9px] uppercase font-bold text-slate-500">Profit Factor</div>
                <div className="text-sm font-black font-mono text-slate-800 mt-0.5">
                  {pb.profitFactor}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Playbook Modal */}
      {isAddingPlaybook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Create New Playbook Setup</h3>
              </div>
              <button
                onClick={() => setIsAddingPlaybook(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Setup Name</label>
                <input
                  type="text"
                  placeholder="e.g. Asian Range Breakout & Retest"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
                  >
                    <option value="Day Trading">Day Trading</option>
                    <option value="Scalping">Scalping</option>
                    <option value="Swing Trading">Swing Trading</option>
                    <option value="Trend Following">Trend Following</option>
                    <option value="Reversal">Reversal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Timeframe</label>
                  <input
                    type="text"
                    placeholder="e.g. 5m / 15m"
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Strategy Summary</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the trading model..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Execution Rules Checklist</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add rule (e.g., Hard stop loss below swing)..."
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white"
                  />
                  <button
                    onClick={handleAddRule}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Add Rule
                  </button>
                </div>

                {newRules.length > 0 && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    {newRules.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-700">
                        <span>• {r}</span>
                        <button onClick={() => setNewRules(newRules.filter((_, idx) => idx !== i))} className="text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddingPlaybook(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaybook}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs"
              >
                Save Playbook
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
