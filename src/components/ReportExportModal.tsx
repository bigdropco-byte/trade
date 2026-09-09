import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  BarChart3, 
  BookOpen, 
  Brain, 
  ShieldCheck, 
  Download, 
  Check, 
  Sliders, 
  Clock, 
  Eye, 
  EyeOff, 
  Sparkles,
  Layers
} from 'lucide-react';
import { AccountInfo, Trade, TradingMetrics } from '../types/trade';
import { exportStatementPdf, PdfExportOptions, defaultPdfExportOptions } from '../utils/pdfExport';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountInfo: AccountInfo;
  metrics: TradingMetrics;
  trades: Trade[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  accountInfo,
  metrics,
  trades,
}) => {
  const [options, setOptions] = useState<PdfExportOptions>(defaultPdfExportOptions);
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute number of matching trades for live feedback
  const matchingTradesCount = useMemo(() => {
    const now = new Date();
    if (options.dateRange === '30days') {
      const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return trades.filter(t => t.closeTimestamp >= cutoff).length;
    }
    if (options.dateRange === 'thisMonth') {
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return trades.filter(t => t.closeTime.slice(0, 7).replace(/[./]/g, '-') === prefix).length;
    }
    if (options.dateRange === 'custom' && options.customStartDate && options.customEndDate) {
      const startTs = new Date(options.customStartDate).getTime();
      const endTs = new Date(options.customEndDate).getTime() + 86400000;
      return trades.filter(t => t.closeTimestamp >= startTs && t.closeTimestamp <= endTs).length;
    }
    return trades.length;
  }, [trades, options.dateRange, options.customStartDate, options.customEndDate]);

  // Compute estimated pages
  const estimatedPages = useMemo(() => {
    let pages = 0;
    if (options.sections.overview) pages += 1;
    if (options.sections.calendar) pages += 1;
    if (options.sections.deepAnalytics || options.sections.aiCoach || options.sections.propFirm) pages += 1;
    if (options.sections.tradeJournal) {
      pages += Math.ceil(matchingTradesCount / 22) || 1;
    }
    return Math.max(1, pages);
  }, [options.sections, matchingTradesCount]);

  if (!isOpen) return null;

  const toggleSection = (key: keyof PdfExportOptions['sections']) => {
    setOptions(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: !prev.sections[key],
      },
    }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        exportStatementPdf(accountInfo, metrics, trades, options);
        onClose();
      } catch (err) {
        console.error('PDF export failed', err);
      } finally {
        setIsGenerating(false);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Statement PDF Generator</h2>
              <p className="text-[11px] text-slate-500">Select reporting scope, sections, and privacy options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 text-xs">
          
          {/* 1. Date Scope Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Reporting Period / Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'All Time', count: `${trades.length} trades` },
                { id: '30days', label: 'Last 30 Days', count: 'Recent' },
                { id: 'thisMonth', label: 'This Month', count: 'Current' },
                { id: 'custom', label: 'Custom Range', count: 'Date pick' },
              ].map((scope) => (
                <button
                  key={scope.id}
                  onClick={() => setOptions(prev => ({ ...prev, dateRange: scope.id as any }))}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    options.dateRange === scope.id
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`font-bold text-xs ${options.dateRange === scope.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {scope.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{scope.count}</div>
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {options.dateRange === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={options.customStartDate || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, customStartDate: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={options.customEndDate || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, customEndDate: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Sections Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Include Sections
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {Object.values(options.sections).filter(Boolean).length} of 6 Sections Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Overview & Key KPIs */}
              <label
                onClick={() => toggleSection('overview')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  options.sections.overview
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-white opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.sections.overview}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Executive Overview & Key KPIs</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    12-card scorecard (Net P&L, Win Rate, Profit Factor, Expectancy, Sharpe Ratio).
                  </p>
                </div>
              </label>

              {/* Performance Calendar & Monthly Matrix */}
              <label
                onClick={() => toggleSection('calendar')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  options.sections.calendar
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-white opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.sections.calendar}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Performance Calendar (All Months)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Month-by-month calendar matrix with Green/Red P&L days and monthly summaries.
                  </p>
                </div>
              </label>

              {/* Trade Journal Execution Table */}
              <label
                onClick={() => toggleSection('tradeJournal')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  options.sections.tradeJournal
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-white opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.sections.tradeJournal}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>Trade Execution Journal</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Full table with tickets, prices, duration, lot size, P&L, setup tags, and notes.
                  </p>
                </div>
              </label>

              {/* Deep Statistical Analytics */}
              <label
                onClick={() => toggleSection('deepAnalytics')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  options.sections.deepAnalytics
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-white opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.sections.deepAnalytics}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Deep Analytics & Symbol Edge</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Long vs Short execution split, Instrument breakdown table, and weekday edge.
                  </p>
                </div>
              </label>

              {/* TradeScrapbook AI Psychology & Discipline Coach */}
              <label
                onClick={() => toggleSection('aiCoach')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  options.sections.aiCoach
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-white opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.sections.aiCoach}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-purple-600" />
                    <span>Scrapbook AI Psychology & Discipline</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Discipline Score (0-100), Revenge trade detection audit, and hold times.
                  </p>
                </div>
              </label>

              {/* Prop Firm Challenge Evaluation */}
              <label
                onClick={() => toggleSection('propFirm')}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  options.sections.propFirm
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-white opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.sections.propFirm}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prop Firm Challenge Compliance</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    FTMO / The5ers evaluation rules (5% daily drop, 10% max DD, target progress).
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* 3. Customization & Privacy Settings */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Styling & Privacy Options
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Color Theme Selector */}
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Color Palette</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'emerald', label: 'Emerald Pro', bg: 'bg-emerald-600' },
                    { id: 'navy', label: 'Institutional Navy', bg: 'bg-slate-900' },
                    { id: 'gold', label: 'Gold Premium', bg: 'bg-amber-500' },
                    { id: 'monochrome', label: 'Print B&W', bg: 'bg-zinc-700' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setOptions(prev => ({ ...prev, colorTheme: t.id as any }))}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        options.colorTheme === t.id
                          ? 'border-slate-900 bg-white text-slate-900 shadow-2xs font-bold'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${t.bg}`}></span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Masking Toggle */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={options.maskAccount}
                    onChange={(e) => setOptions(prev => ({ ...prev, maskAccount: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    {options.maskAccount ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Mask Account # (Public Share Mode)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={options.includeNotes}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeNotes: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Include Trader Reflection Notes
                  </span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          
          {/* Live Specs */}
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {matchingTradesCount} Positions Included
            </span>
            <span>•</span>
            <span className="text-slate-500">Est. ~{estimatedPages} Pages</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">100% Client-Side Private</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || matchingTradesCount === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download Statement PDF'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
