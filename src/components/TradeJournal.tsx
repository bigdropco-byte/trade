import React, { useState } from 'react';
import { 
  Search, 
  Tag, 
  BookOpen, 
  ArrowUpDown, 
  Edit3, 
  X,
  Save
} from 'lucide-react';
import { Trade } from '../types/trade';

interface TradeJournalProps {
  trades: Trade[];
  onUpdateTrade: (updated: Trade) => void;
  selectedTrade: Trade | null;
  setSelectedTrade: (trade: Trade | null) => void;
}

const COMMON_SETUP_TAGS = ['Breakout', 'Trend Continuation', 'Liquidity Sweep', 'Support/Resistance', 'Order Block', 'Scalp', 'News Reaction'];
const COMMON_MISTAKE_TAGS = ['FOMO', 'Revenge Trade', 'Chased Entry', 'Early Exit', 'Moved Stop Loss', 'Overleveraging', 'No Hard SL'];

export const TradeJournal: React.FC<TradeJournalProps> = ({
  trades,
  onUpdateTrade,
  selectedTrade,
  setSelectedTrade,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'time' | 'profit' | 'volume' | 'duration'>('time');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Tag & Note editing state for selected trade modal
  const [newTagInput, setNewTagInput] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  // Extract unique symbols
  const uniqueSymbols = Array.from(new Set(trades.map(t => t.symbol)));

  // Filter trades
  const filteredTrades = trades.filter(t => {
    // Search query matches ticket, symbol, tags, or notes
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchSymbol = t.symbol.toLowerCase().includes(q);
      const matchNotes = t.notes.toLowerCase().includes(q);
      const matchTags = t.tags.some(tag => tag.toLowerCase().includes(q));
      if (!matchId && !matchSymbol && !matchNotes && !matchTags) return false;
    }

    if (symbolFilter !== 'ALL' && t.symbol !== symbolFilter) return false;
    if (directionFilter !== 'ALL' && t.type !== directionFilter) return false;
    if (outcomeFilter === 'WIN' && !t.isWin) return false;
    if (outcomeFilter === 'LOSS' && !t.isLoss) return false;
    if (outcomeFilter === 'BE' && !t.isBreakeven) return false;

    return true;
  });

  // Sort trades
  filteredTrades.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'time') diff = a.closeTimestamp - b.closeTimestamp;
    else if (sortBy === 'profit') diff = a.netProfit - b.netProfit;
    else if (sortBy === 'volume') diff = a.volume - b.volume;
    else if (sortBy === 'duration') diff = a.durationMinutes - b.durationMinutes;

    return sortOrder === 'desc' ? -diff : diff;
  });

  const handleOpenTradeDetail = (trade: Trade) => {
    setSelectedTrade(trade);
    setEditingNotes(trade.notes || '');
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTrade) return;
    const clean = tag.trim();
    if (!clean || selectedTrade.tags.includes(clean)) return;

    const updated = {
      ...selectedTrade,
      tags: [...selectedTrade.tags, clean],
    };
    setSelectedTrade(updated);
    onUpdateTrade(updated);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedTrade) return;
    const updated = {
      ...selectedTrade,
      tags: selectedTrade.tags.filter(t => t !== tagToRemove),
    };
    setSelectedTrade(updated);
    onUpdateTrade(updated);
  };

  const handleSaveNotes = () => {
    if (!selectedTrade) return;
    const updated = {
      ...selectedTrade,
      notes: editingNotes,
    };
    setSelectedTrade(updated);
    onUpdateTrade(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header & Controls Toolbar (White Theme) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Trading Journal & Execution Log
            </h2>
            <p className="text-xs text-slate-500">
              {filteredTrades.length} of {trades.length} positions shown
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket, symbol, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Symbol Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Symbol:</span>
            <button
              onClick={() => setSymbolFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                symbolFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {uniqueSymbols.map(sym => (
              <button
                key={sym}
                onClick={() => setSymbolFilter(sym)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  symbolFilter === sym ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Type:</span>
            {['ALL', 'buy', 'sell'].map(type => (
              <button
                key={type}
                onClick={() => setDirectionFilter(type)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                  directionFilter === type ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'buy' ? 'Long' : type === 'sell' ? 'Short' : 'All'}
              </button>
            ))}
          </div>

          {/* Outcome Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Outcome:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'WIN', label: 'Wins' },
              { id: 'LOSS', label: 'Losses' },
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setOutcomeFilter(o.id)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  outcomeFilter === o.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="time">Close Time</option>
              <option value="profit">Net P&L</option>
              <option value="volume">Lots</option>
              <option value="duration">Duration</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 font-mono font-bold cursor-pointer"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table (White Theme) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase">
                <th className="py-3 pl-4">Ticket</th>
                <th className="py-3">Close Time</th>
                <th className="py-3">Symbol</th>
                <th className="py-3">Side</th>
                <th className="py-3 text-right">Volume</th>
                <th className="py-3 text-right">Open</th>
                <th className="py-3 text-right">Close</th>
                <th className="py-3 text-right">Duration</th>
                <th className="py-3 text-right">Pips</th>
                <th className="py-3 text-right">Net Profit</th>
                <th className="py-3">Tags & Notes</th>
                <th className="py-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTrades.map((trade) => (
                <tr
                  key={trade.id}
                  onClick={() => handleOpenTradeDetail(trade)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 pl-4 font-bold text-slate-900">
                    #{trade.id.slice(-8)}
                  </td>
                  <td className="py-3 text-slate-600 font-sans">
                    {trade.closeTime.slice(5, 16)}
                  </td>
                  <td className="py-3 font-sans font-bold text-slate-900">
                    {trade.symbol}
                  </td>
                  <td className="py-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trade.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-700">
                    {trade.volume.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-700">
                    {trade.openPrice.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-700">
                    {trade.closePrice.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-500 font-sans">
                    {trade.durationFormatted}
                  </td>
                  <td className="py-3 text-right">
                    <span className={trade.pips >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                      {trade.pips >= 0 ? '+' : ''}{trade.pips}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-sm">
                    <span className={trade.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 font-sans">
                    <div className="flex flex-wrap items-center gap-1 max-w-xs">
                      {trade.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                          {tag}
                        </span>
                      ))}
                      {trade.notes && (
                        <span className="text-[10px] text-slate-500 italic truncate max-w-28">
                          "{trade.notes}"
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTradeDetail(trade);
                      }}
                      className="px-2.5 py-1 text-[11px] font-sans font-semibold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      Journal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Detail & Journaling Modal (White Theme) */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900 font-sans">{selectedTrade.symbol}</span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    selectedTrade.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {selectedTrade.type} {selectedTrade.volume} Lots
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Ticket #{selectedTrade.id}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Opened {selectedTrade.openTime} ➔ Closed {selectedTrade.closeTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedTrade(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trade Key Metrics Grid */}
            <div className="grid grid-cols-4 gap-3 my-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Net P&L</div>
                <div className={`text-lg font-black font-mono mt-0.5 ${selectedTrade.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedTrade.netProfit >= 0 ? '+' : ''}${selectedTrade.netProfit.toFixed(2)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Entry Price</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {selectedTrade.openPrice}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Exit Price</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {selectedTrade.closePrice}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Duration</div>
                <div className="text-base font-bold font-mono text-indigo-700 mt-0.5">
                  {selectedTrade.durationFormatted}
                </div>
              </div>
            </div>

            {/* Setups & Mistake Tags Section */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Attached Tags (Setups & Psychology)
                </label>
                
                <div className="flex flex-wrap items-center gap-1.5 min-h-8 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {selectedTrade.tags.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No tags attached. Click recommendations below or add custom tag.</span>
                  )}
                  {selectedTrade.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium">
                      {t}
                      <button onClick={() => handleRemoveTag(t)} className="hover:text-red-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Tag Recommendations */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-500 font-medium">Quick Setups:</div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SETUP_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 font-medium pt-1">Psychology & Mistakes:</div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_MISTAKE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-red-100 hover:text-red-800 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add custom tag (e.g., News, Break of Structure)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag(newTagInput)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  onClick={() => handleAddTag(newTagInput)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Notes & Journal Reflection */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  Trader Reflections & Trade Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="What was your thesis? Did you follow your rules? Did emotions interfere?"
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Saved automatically to local browser storage.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSaveNotes();
                    setSelectedTrade(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Journal Entry</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
