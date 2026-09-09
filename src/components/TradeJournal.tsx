import React, { useState, useMemo } from 'react';
import {
  Search,
  Tag,
  BookOpen,
  ArrowUpDown,
  Edit3,
  X,
  Save,
  Star,
  TrendingUp,
  TrendingDown,
  Brain,
  BarChart2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
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

const EMOTIONS = ['Neutral', 'Confident', 'Patient', 'Anxious', 'Fearful', 'Greedy', 'FOMO', 'Revenge', 'Bored', 'Excited'];
const GRADES = ['A', 'B', 'C', 'D', 'F'];

const EMOTION_COLORS: Record<string, string> = {
  Confident: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Patient:   'bg-blue-50 text-blue-700 border-blue-200',
  Neutral:   'bg-slate-100 text-slate-600 border-slate-200',
  Anxious:   'bg-amber-50 text-amber-700 border-amber-200',
  Fearful:   'bg-orange-50 text-orange-700 border-orange-200',
  Greedy:    'bg-red-50 text-red-700 border-red-200',
  FOMO:      'bg-rose-50 text-rose-700 border-rose-200',
  Revenge:   'bg-red-100 text-red-800 border-red-300',
  Bored:     'bg-slate-50 text-slate-500 border-slate-200',
  Excited:   'bg-violet-50 text-violet-700 border-violet-200',
};

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  B: 'bg-blue-50 text-blue-700 border-blue-200',
  C: 'bg-amber-50 text-amber-700 border-amber-200',
  D: 'bg-orange-50 text-orange-700 border-orange-200',
  F: 'bg-red-50 text-red-700 border-red-200',
};

// Get ISO week string "YYYY-Www" for a timestamp
function getISOWeek(ts: number): string {
  const d = new Date(ts);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const diff = d.getTime() - jan4.getTime();
  const week = Math.floor(diff / (7 * 86400000)) + 1;
  const yr = d.getFullYear();
  return `${yr}-W${String(week).padStart(2, '0')}`;
}

function getWeekLabel(weekKey: string): string {
  // weekKey = "2026-W15"
  const [yr, wStr] = weekKey.split('-W');
  const week = parseInt(wStr, 10);
  // Get Monday of that ISO week
  const jan4 = new Date(parseInt(yr, 10), 0, 4);
  const monday = new Date(jan4.getTime() + (week - 1) * 7 * 86400000);
  // Adjust to Monday
  const day = monday.getDay();
  const diff = (day <= 1 ? 1 - day : 8 - day);
  monday.setDate(monday.getDate() + (day === 1 ? 0 : diff));
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${fmt(monday)} – ${fmt(sunday)}`;
}

// Tiny sparkline SVG from an array of values
function Sparkline({ values, width = 120, height = 32 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const lastIsUp = values[values.length - 1] >= values[0];
  const color = lastIsUp ? '#10b981' : '#ef4444';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded overflow-hidden">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Current point dot */}
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}

// StarRating widget
function StarRating({ value, onChange, readonly = false }: { value?: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          tabIndex={readonly ? -1 : 0}
        >
          <Star
            className={`w-3.5 h-3.5 transition-colors ${
              n <= (hover || value || 0)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

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
  const [emotionFilter, setEmotionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'time' | 'profit' | 'volume' | 'duration' | 'rating'>('time');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeTab, setActiveTab] = useState<'trades' | 'tags' | 'emotions' | 'weekly'>('trades');
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  // localStorage for week reflections
  const [weekReflections, setWeekReflections] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('tradepulse_week_reflections') || '{}'); } catch { return {}; }
  });
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  // Tag & Note editing state for selected trade modal
  const [newTagInput, setNewTagInput] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [editingRating, setEditingRating] = useState<number | undefined>(undefined);
  const [editingGrade, setEditingGrade] = useState<string | undefined>(undefined);
  const [editingEmotion, setEditingEmotion] = useState<string | undefined>(undefined);

  // Extract unique symbols and emotions used
  const uniqueSymbols = useMemo(() => Array.from(new Set(trades.map(t => t.symbol))), [trades]);
  const usedEmotions = useMemo(() => Array.from(new Set(trades.map(t => t.emotion).filter(Boolean))) as string[], [trades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id.toLowerCase().includes(q);
        const matchSymbol = t.symbol.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchTags = t.tags.some(tag => tag.toLowerCase().includes(q));
        const matchEmotion = (t.emotion || '').toLowerCase().includes(q);
        if (!matchId && !matchSymbol && !matchNotes && !matchTags && !matchEmotion) return false;
      }
      if (symbolFilter !== 'ALL' && t.symbol !== symbolFilter) return false;
      if (directionFilter !== 'ALL' && t.type !== directionFilter) return false;
      if (outcomeFilter === 'WIN' && !t.isWin) return false;
      if (outcomeFilter === 'LOSS' && !t.isLoss) return false;
      if (outcomeFilter === 'BE' && !t.isBreakeven) return false;
      if (emotionFilter !== 'ALL' && t.emotion !== emotionFilter) return false;
      return true;
    });
  }, [trades, searchQuery, symbolFilter, directionFilter, outcomeFilter, emotionFilter]);

  // Sort
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'time') diff = a.closeTimestamp - b.closeTimestamp;
      else if (sortBy === 'profit') diff = a.netProfit - b.netProfit;
      else if (sortBy === 'volume') diff = a.volume - b.volume;
      else if (sortBy === 'duration') diff = a.durationMinutes - b.durationMinutes;
      else if (sortBy === 'rating') diff = (a.rating || 0) - (b.rating || 0);
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [filteredTrades, sortBy, sortOrder]);

  // ─── Feature 1: Live Stats ──────────────────────────────────────────────────
  const liveStats = useMemo(() => {
    const wins = filteredTrades.filter(t => t.isWin);
    const losses = filteredTrades.filter(t => t.isLoss);
    const totalPnl = filteredTrades.reduce((s, t) => s + t.netProfit, 0);
    const avgPnl = filteredTrades.length ? totalPnl / filteredTrades.length : 0;
    const winRate = filteredTrades.length ? (wins.length / filteredTrades.length) * 100 : 0;
    const best = filteredTrades.reduce((m, t) => t.netProfit > m ? t.netProfit : m, -Infinity);
    const worst = filteredTrades.reduce((m, t) => t.netProfit < m ? t.netProfit : m, Infinity);
    const avgDuration = filteredTrades.length
      ? filteredTrades.reduce((s, t) => s + t.durationMinutes, 0) / filteredTrades.length
      : 0;
    const avgRating = (() => {
      const rated = filteredTrades.filter(t => t.rating);
      return rated.length ? rated.reduce((s, t) => s + (t.rating || 0), 0) / rated.length : 0;
    })();
    return { wins: wins.length, losses: losses.length, totalPnl, avgPnl, winRate, best, worst, avgDuration, avgRating };
  }, [filteredTrades]);

  // ─── Feature 5: Tag Performance ────────────────────────────────────────────
  const tagStats = useMemo(() => {
    const map: Record<string, { count: number; wins: number; totalPnl: number }> = {};
    trades.forEach(t => {
      t.tags.forEach(tag => {
        if (!map[tag]) map[tag] = { count: 0, wins: 0, totalPnl: 0 };
        map[tag].count += 1;
        map[tag].wins += t.isWin ? 1 : 0;
        map[tag].totalPnl += t.netProfit;
      });
    });
    return Object.entries(map)
      .map(([tag, s]) => ({ tag, ...s, winRate: s.count ? (s.wins / s.count) * 100 : 0, avgPnl: s.count ? s.totalPnl / s.count : 0 }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades]);

  const tagMax = useMemo(() => Math.max(...tagStats.map(t => Math.abs(t.totalPnl)), 1), [tagStats]);

  // ─── Feature 3: Emotion Performance ────────────────────────────────────────
  const emotionStats = useMemo(() => {
    const map: Record<string, { count: number; wins: number; totalPnl: number }> = {};
    trades.filter(t => t.emotion).forEach(t => {
      const em = t.emotion!;
      if (!map[em]) map[em] = { count: 0, wins: 0, totalPnl: 0 };
      map[em].count += 1;
      map[em].wins += t.isWin ? 1 : 0;
      map[em].totalPnl += t.netProfit;
    });
    return Object.entries(map)
      .map(([emotion, s]) => ({ emotion, ...s, winRate: s.count ? (s.wins / s.count) * 100 : 0, avgPnl: s.count ? s.totalPnl / s.count : 0 }))
      .sort((a, b) => b.avgPnl - a.avgPnl);
  }, [trades]);

  const emotionMaxAvg = useMemo(() => Math.max(...emotionStats.map(e => Math.abs(e.avgPnl)), 1), [emotionStats]);

  // ─── Feature 4: Weekly Groups ───────────────────────────────────────────────
  const weeklyGroups = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach(t => {
      const wk = getISOWeek(t.closeTimestamp);
      if (!map[wk]) map[wk] = [];
      map[wk].push(t);
    });
    return Object.entries(map)
      .map(([week, wTrades]) => {
        const wins = wTrades.filter(t => t.isWin).length;
        const totalPnl = wTrades.reduce((s, t) => s + t.netProfit, 0);
        const bestDay = wTrades.reduce((m, t) => t.netProfit > m ? t.netProfit : m, -Infinity);
        const worstDay = wTrades.reduce((m, t) => t.netProfit < m ? t.netProfit : m, Infinity);
        return { week, trades: wTrades, wins, totalPnl, winRate: (wins / wTrades.length) * 100, bestDay, worstDay };
      })
      .sort((a, b) => b.week.localeCompare(a.week));
  }, [trades]);

  // ─── Feature 6: Equity sparkline data ──────────────────────────────────────
  const equityTimeline = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.closeTimestamp - b.closeTimestamp);
    let running = 0;
    return sorted.map(t => { running += t.netProfit; return { id: t.id, equity: running }; });
  }, [trades]);

  const getEquityAroundTrade = (tradeId: string) => {
    const idx = equityTimeline.findIndex(e => e.id === tradeId);
    if (idx < 0) return [];
    const start = Math.max(0, idx - 7);
    const end = Math.min(equityTimeline.length - 1, idx + 3);
    return equityTimeline.slice(start, end + 1).map(e => e.equity);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenTradeDetail = (trade: Trade) => {
    setSelectedTrade(trade);
    setEditingNotes(trade.notes || '');
    setEditingRating(trade.rating);
    setEditingGrade(trade.executionGrade);
    setEditingEmotion(trade.emotion);
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTrade) return;
    const clean = tag.trim();
    if (!clean || selectedTrade.tags.includes(clean)) return;
    const updated = { ...selectedTrade, tags: [...selectedTrade.tags, clean] };
    setSelectedTrade(updated);
    onUpdateTrade(updated);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedTrade) return;
    const updated = { ...selectedTrade, tags: selectedTrade.tags.filter(t => t !== tagToRemove) };
    setSelectedTrade(updated);
    onUpdateTrade(updated);
  };

  const handleSaveModal = () => {
    if (!selectedTrade) return;
    const updated: Trade = {
      ...selectedTrade,
      notes: editingNotes,
      rating: editingRating,
      executionGrade: editingGrade,
      emotion: editingEmotion,
    };
    setSelectedTrade(updated);
    onUpdateTrade(updated);
    setSelectedTrade(null);
  };

  const saveWeekReflection = (week: string, text: string) => {
    const next = { ...weekReflections, [week]: text };
    setWeekReflections(next);
    localStorage.setItem('tradepulse_week_reflections', JSON.stringify(next));
  };

  const fmtDuration = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">

      {/* ── Header & Controls ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Trading Journal &amp; Execution Log
            </h2>
            <p className="text-xs text-slate-500">{filteredTrades.length} of {trades.length} positions shown</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket, symbol, tag, emotion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Symbol */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Symbol:</span>
            <button onClick={() => setSymbolFilter('ALL')} className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${symbolFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}>All</button>
            {uniqueSymbols.map(sym => (
              <button key={sym} onClick={() => setSymbolFilter(sym)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${symbolFilter === sym ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}>{sym}</button>
            ))}
          </div>

          {/* Direction */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Type:</span>
            {['ALL', 'buy', 'sell'].map(type => (
              <button key={type} onClick={() => setDirectionFilter(type)} className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${directionFilter === type ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
                {type === 'buy' ? 'Long' : type === 'sell' ? 'Short' : 'All'}
              </button>
            ))}
          </div>

          {/* Outcome */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Outcome:</span>
            {[{ id: 'ALL', label: 'All' }, { id: 'WIN', label: 'Wins' }, { id: 'LOSS', label: 'Losses' }].map(o => (
              <button key={o.id} onClick={() => setOutcomeFilter(o.id)} className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${outcomeFilter === o.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}>{o.label}</button>
            ))}
          </div>

          {/* Emotion filter */}
          {usedEmotions.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Brain className="w-3 h-3 text-violet-500 ml-1.5" />
              <span className="text-[11px] text-slate-500 px-1 font-medium">Emotion:</span>
              <button onClick={() => setEmotionFilter('ALL')} className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${emotionFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}>All</button>
              {usedEmotions.map(em => (
                <button key={em} onClick={() => setEmotionFilter(em)} className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${emotionFilter === em ? 'bg-white text-violet-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}>{em}</button>
              ))}
            </div>
          )}

          {/* Sort */}
          <div className="ml-auto flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} className="bg-transparent text-xs text-slate-700 font-medium px-2 py-1 focus:outline-none cursor-pointer">
              <option value="time">Close Time</option>
              <option value="profit">Net P&L</option>
              <option value="volume">Lots</option>
              <option value="duration">Duration</option>
              <option value="rating">Rating</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="px-2 py-1 text-slate-600 hover:text-slate-900 font-mono font-bold cursor-pointer">{sortOrder.toUpperCase()}</button>
          </div>
        </div>
      </div>

      {/* ── Feature 1: Live Stats Bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: 'Trades', value: filteredTrades.length, color: 'text-slate-900', mono: false },
          { label: 'Win Rate', value: `${liveStats.winRate.toFixed(1)}%`, color: liveStats.winRate >= 50 ? 'text-emerald-600' : 'text-red-600', mono: true },
          { label: 'Total P&L', value: `${liveStats.totalPnl >= 0 ? '+' : ''}$${liveStats.totalPnl.toFixed(2)}`, color: liveStats.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600', mono: true },
          { label: 'Avg P&L', value: `${liveStats.avgPnl >= 0 ? '+' : ''}$${liveStats.avgPnl.toFixed(2)}`, color: liveStats.avgPnl >= 0 ? 'text-emerald-600' : 'text-red-600', mono: true },
          { label: 'Best Trade', value: liveStats.best === -Infinity ? '-' : `+$${liveStats.best.toFixed(2)}`, color: 'text-emerald-600', mono: true },
          { label: 'Worst Trade', value: liveStats.worst === Infinity ? '-' : `$${liveStats.worst.toFixed(2)}`, color: 'text-red-600', mono: true },
          { label: 'Avg Hold', value: filteredTrades.length ? fmtDuration(liveStats.avgDuration) : '-', color: 'text-indigo-600', mono: true },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-xs">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{stat.label}</div>
            <div className={`text-sm font-black mt-0.5 ${stat.color} ${stat.mono ? 'font-mono' : ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── View Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'trades', label: 'Trade Log', icon: BookOpen },
          { id: 'tags', label: 'Tag Performance', icon: Tag },
          { id: 'emotions', label: 'Emotion Analysis', icon: Brain },
          { id: 'weekly', label: 'Weekly Review', icon: CalendarDays },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Trade Log ────────────────────────────────────────────────── */}
      {activeTab === 'trades' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase">
                  <th className="py-3 pl-4">Ticket</th>
                  <th className="py-3">Close</th>
                  <th className="py-3">Symbol</th>
                  <th className="py-3">Side</th>
                  <th className="py-3 text-right">Lots</th>
                  <th className="py-3 text-right">Entry</th>
                  <th className="py-3 text-right">Exit</th>
                  <th className="py-3 text-right">Pips</th>
                  <th className="py-3 text-right">Net P&L</th>
                  <th className="py-3">Rating</th>
                  <th className="py-3">Grade</th>
                  <th className="py-3">Emotion</th>
                  <th className="py-3">Tags</th>
                  <th className="py-3 pr-4 text-right">Journal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sortedTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => handleOpenTradeDetail(trade)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 pl-4 font-bold text-slate-900">#{trade.id.slice(-8)}</td>
                    <td className="py-2.5 text-slate-600 font-sans">{trade.closeTime.slice(5, 16)}</td>
                    <td className="py-2.5 font-sans font-bold text-slate-900">{trade.symbol}</td>
                    <td className="py-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        trade.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {trade.type === 'buy' ? '▲ Long' : '▼ Short'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-700">{trade.volume.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-slate-700">{trade.openPrice.toFixed(trade.symbol.includes('JPY') ? 3 : 5)}</td>
                    <td className="py-2.5 text-right text-slate-700">{trade.closePrice.toFixed(trade.symbol.includes('JPY') ? 3 : 5)}</td>
                    <td className="py-2.5 text-right">
                      <span className={trade.pips >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                        {trade.pips >= 0 ? '+' : ''}{trade.pips}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-sm">
                      <span className={trade.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                      </span>
                    </td>
                    {/* Feature 2: Star Rating */}
                    <td className="py-2.5 font-sans">
                      <StarRating value={trade.rating} readonly />
                    </td>
                    {/* Feature 2: Execution Grade */}
                    <td className="py-2.5 font-sans">
                      {trade.executionGrade ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${GRADE_COLORS[trade.executionGrade] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {trade.executionGrade}
                        </span>
                      ) : <span className="text-slate-300 text-[10px]">—</span>}
                    </td>
                    {/* Feature 3: Emotion */}
                    <td className="py-2.5 font-sans">
                      {trade.emotion ? (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${EMOTION_COLORS[trade.emotion] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {trade.emotion}
                        </span>
                      ) : <span className="text-slate-300 text-[10px]">—</span>}
                    </td>
                    <td className="py-2.5 font-sans">
                      <div className="flex flex-wrap items-center gap-1 max-w-[140px]">
                        {trade.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{tag}</span>
                        ))}
                        {trade.tags.length > 2 && <span className="text-[10px] text-slate-400">+{trade.tags.length - 2}</span>}
                        {trade.notes && <span className="text-[10px] text-slate-400 italic">📝</span>}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenTradeDetail(trade); }}
                        className="px-2.5 py-1 text-[11px] font-sans font-semibold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Journal
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedTrades.length === 0 && (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400 text-sm">No trades match your current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Feature 5: Tag Performance Tab ───────────────────────────────── */}
      {activeTab === 'tags' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Setup Tag Performance</h3>
            <span className="text-xs text-slate-500 ml-1">— which setups actually make money</span>
          </div>
          {tagStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No tagged trades yet. Open a trade and add setup tags to see performance breakdown.</p>
          ) : (
            <div className="space-y-3">
              {tagStats.map(ts => (
                <div key={ts.tag} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{ts.tag}</span>
                      <span className="text-slate-400">{ts.count} trades · {ts.winRate.toFixed(0)}% WR</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-slate-500">Avg: <span className={ts.avgPnl >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{ts.avgPnl >= 0 ? '+' : ''}${ts.avgPnl.toFixed(2)}</span></span>
                      <span className={`font-black ${ts.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {ts.totalPnl >= 0 ? '+' : ''}${ts.totalPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ts.totalPnl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                      style={{ width: `${(Math.abs(ts.totalPnl) / tagMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Feature 3: Emotion Analysis Tab ──────────────────────────────── */}
      {activeTab === 'emotions' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-600" />
            <h3 className="font-bold text-slate-900">Emotion vs P&amp;L Analysis</h3>
            <span className="text-xs text-slate-500 ml-1">— which mindset makes you the most money</span>
          </div>
          {emotionStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No emotion data yet. Open trades and log your emotional state to unlock this analysis.</p>
          ) : (
            <>
              {/* Bar chart */}
              <div className="space-y-3">
                {emotionStats.map(es => (
                  <div key={es.emotion} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${EMOTION_COLORS[es.emotion] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {es.emotion}
                        </span>
                        <span className="text-slate-400">{es.count} trades · {es.winRate.toFixed(0)}% WR</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 text-[11px]">Total: <span className={es.totalPnl >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{es.totalPnl >= 0 ? '+' : ''}${es.totalPnl.toFixed(2)}</span></span>
                        <span className={`text-sm font-black ${es.avgPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {es.avgPnl >= 0 ? '+' : ''}${es.avgPnl.toFixed(2)} avg
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${es.avgPnl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                        style={{ width: `${(Math.abs(es.avgPnl) / emotionMaxAvg) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Insight callout */}
              {emotionStats[0] && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-start gap-2">
                  <Zap className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-violet-800">
                    <strong>Key Insight:</strong> You perform best when feeling <strong>{emotionStats[0].emotion}</strong> (avg <strong>${emotionStats[0].avgPnl.toFixed(2)}</strong> per trade).
                    {emotionStats[emotionStats.length - 1] && emotionStats[emotionStats.length - 1].avgPnl < 0 && (
                      <> Avoid trading when feeling <strong>{emotionStats[emotionStats.length - 1].emotion}</strong> (avg <strong>${emotionStats[emotionStats.length - 1].avgPnl.toFixed(2)}</strong>).</>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Feature 4: Weekly Review Tab ─────────────────────────────────── */}
      {activeTab === 'weekly' && (
        <div className="space-y-3">
          {weeklyGroups.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">No trade data available.</div>
          ) : weeklyGroups.map(wg => {
            const isExpanded = expandedWeeks.has(wg.week);
            return (
              <div key={wg.week} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Week header */}
                <button
                  onClick={() => {
                    const next = new Set(expandedWeeks);
                    if (isExpanded) next.delete(wg.week); else next.add(wg.week);
                    setExpandedWeeks(next);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-900">{getWeekLabel(wg.week)}</div>
                      <div className="text-xs text-slate-500">{wg.trades.length} trades · {wg.winRate.toFixed(0)}% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-base font-black font-mono ${wg.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {wg.totalPnl >= 0 ? '+' : ''}${wg.totalPnl.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Sparkline of week's cumulative PnL */}
                      <Sparkline values={wg.trades.map((_, i) => wg.trades.slice(0, i + 1).reduce((s, t) => s + t.netProfit, 0))} width={80} height={24} />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Week stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Trades', value: wg.trades.length, color: 'text-slate-900' },
                        { label: 'Wins / Losses', value: `${wg.wins} / ${wg.trades.length - wg.wins}`, color: 'text-slate-900' },
                        { label: 'Best Trade', value: `+$${wg.bestDay.toFixed(2)}`, color: 'text-emerald-600' },
                        { label: 'Worst Trade', value: `$${wg.worstDay.toFixed(2)}`, color: 'text-red-600' },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</div>
                          <div className={`font-bold font-mono text-sm mt-0.5 ${s.color}`}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Trades mini-list */}
                    <div className="space-y-1">
                      {wg.trades.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenTradeDetail(t)}>
                          <span className="text-slate-600 font-mono">#{t.id.slice(-6)}</span>
                          <span className="font-semibold text-slate-800">{t.symbol}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.type === 'buy' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>{t.type === 'buy' ? '▲' : '▼'}</span>
                          {t.emotion && <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${EMOTION_COLORS[t.emotion] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{t.emotion}</span>}
                          <StarRating value={t.rating} readonly />
                          <span className={`font-black font-mono ${t.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t.netProfit >= 0 ? '+' : ''}${t.netProfit.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Week Reflection textarea */}
                    <div className="pt-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        Week in Review — Reflections &amp; Lessons
                      </label>
                      {editingWeek === wg.week ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            defaultValue={weekReflections[wg.week] || ''}
                            id={`weekref-${wg.week}`}
                            placeholder="What went well this week? What mistakes did you repeat? What will you do differently next week?"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingWeek(null)} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer">Cancel</button>
                            <button
                              onClick={() => {
                                const el = document.getElementById(`weekref-${wg.week}`) as HTMLTextAreaElement;
                                saveWeekReflection(wg.week, el?.value || '');
                                setEditingWeek(null);
                              }}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Reflection
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingWeek(wg.week)}
                          className="min-h-[60px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer hover:border-emerald-400 hover:bg-white transition-colors"
                        >
                          {weekReflections[wg.week]
                            ? <p className="text-slate-700 whitespace-pre-wrap">{weekReflections[wg.week]}</p>
                            : <p className="text-slate-400 italic">Click to write your weekly reflection...</p>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Trade Detail & Journaling Modal ──────────────────────────────── */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-bold text-slate-900 font-sans">{selectedTrade.symbol}</span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${selectedTrade.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {selectedTrade.type === 'buy' ? '▲ Long' : '▼ Short'} {selectedTrade.volume} Lots
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Ticket #{selectedTrade.id}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Opened {selectedTrade.openTime} ➔ Closed {selectedTrade.closeTime} · Hold: {selectedTrade.durationFormatted}
                </p>
              </div>
              <button onClick={() => setSelectedTrade(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Net P&L', value: `${selectedTrade.netProfit >= 0 ? '+' : ''}$${selectedTrade.netProfit.toFixed(2)}`, color: selectedTrade.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600', big: true },
                  { label: 'Pips', value: `${selectedTrade.pips >= 0 ? '+' : ''}${selectedTrade.pips}`, color: selectedTrade.pips >= 0 ? 'text-emerald-600' : 'text-red-600', big: false },
                  { label: 'Commission', value: `$${selectedTrade.commission.toFixed(2)}`, color: 'text-slate-600', big: false },
                  { label: 'Swap', value: `$${selectedTrade.swap.toFixed(2)}`, color: 'text-slate-600', big: false },
                ].map(m => (
                  <div key={m.label} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{m.label}</div>
                    <div className={`${m.big ? 'text-lg font-black' : 'text-base font-bold'} font-mono mt-0.5 ${m.color}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Feature 6: Equity Sparkline context */}
              {(() => {
                const eqVals = getEquityAroundTrade(selectedTrade.id);
                if (eqVals.length < 3) return null;
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      Account Equity Context (±7 trades around this position)
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkline values={eqVals} width={240} height={40} />
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div>Before: <span className="font-mono font-bold text-slate-700">${eqVals[0].toFixed(2)}</span></div>
                        <div>After: <span className="font-mono font-bold text-slate-700">${eqVals[eqVals.length - 1].toFixed(2)}</span></div>
                        <div>Impact: <span className={`font-mono font-bold ${eqVals[eqVals.length - 1] >= eqVals[0] ? 'text-emerald-600' : 'text-red-600'}`}>
                          {eqVals[eqVals.length - 1] >= eqVals[0] ? '+' : ''}${(eqVals[eqVals.length - 1] - eqVals[0]).toFixed(2)}
                        </span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Feature 2: Star Rating + Grade | Feature 3: Emotion */}
              <div className="grid grid-cols-3 gap-3">
                {/* Rating */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-[10px] text-amber-700 uppercase font-bold mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Trade Rating
                  </div>
                  <StarRating value={editingRating} onChange={setEditingRating} />
                  <div className="text-[10px] text-amber-600 mt-1">{editingRating ? `${editingRating}/5 stars` : 'Tap to rate'}</div>
                </div>

                {/* Execution Grade */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-[10px] text-blue-700 uppercase font-bold mb-2 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Execution Grade
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {GRADES.map(g => (
                      <button
                        key={g}
                        onClick={() => setEditingGrade(editingGrade === g ? undefined : g)}
                        className={`w-7 h-7 rounded-md text-xs font-black border cursor-pointer transition-all ${
                          editingGrade === g
                            ? GRADE_COLORS[g]
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emotion */}
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                  <div className="text-[10px] text-violet-700 uppercase font-bold mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Emotional State
                  </div>
                  <select
                    value={editingEmotion || ''}
                    onChange={e => setEditingEmotion(e.target.value || undefined)}
                    className="w-full text-xs bg-white border border-violet-200 text-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-violet-400 cursor-pointer"
                  >
                    <option value="">Select emotion...</option>
                    {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Attached Tags (Setups &amp; Psychology)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 min-h-8 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {selectedTrade.tags.length === 0 && <span className="text-xs text-slate-400 italic">No tags. Add from recommendations below.</span>}
                  {selectedTrade.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium">
                      {t}
                      <button onClick={() => handleRemoveTag(t)} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-medium">Quick Setups:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_SETUP_TAGS.map(tag => (
                      <button key={tag} onClick={() => handleAddTag(tag)} className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer">+ {tag}</button>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-1">Psychology &amp; Mistakes:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_MISTAKE_TAGS.map(tag => (
                      <button key={tag} onClick={() => handleAddTag(tag)} className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-red-100 hover:text-red-800 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer">+ {tag}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(newTagInput)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button onClick={() => handleAddTag(newTagInput)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer">Add</button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  Trader Reflections &amp; Trade Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="What was your thesis? Did you follow your rules? Did emotions interfere? What would you do differently?"
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <span className="text-[11px] text-slate-400">Saved locally — no data leaves your browser.</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedTrade(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button
                  onClick={handleSaveModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Journal Entry
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
