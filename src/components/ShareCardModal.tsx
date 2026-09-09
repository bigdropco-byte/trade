import React, { useRef, useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Activity,
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  MessageSquare,
  Palette,
  Sliders
} from 'lucide-react';
import { AccountInfo, Trade, TradingMetrics } from '../types/trade';
import { getEquityCurveData, calculateMetrics } from '../utils/analytics';
import html2canvas from 'html2canvas';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountInfo: AccountInfo;
  metrics: TradingMetrics;
  trades: Trade[];
}

export type CardTheme = 'emerald' | 'indigo' | 'dark' | 'white';

export interface ShareCardOptions {
  theme: CardTheme;
  scope: 'all' | '30days' | 'thisMonth';
  showPnl: boolean;
  showSparkline: boolean;
  showWinRate: boolean;
  showProfitFactor: boolean;
  showBestTrade: boolean;
  showVolume: boolean;
  showLongShort: boolean;
  maskAccount: boolean;
  hideName: boolean;
  hideBroker: boolean;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  accountInfo,
  metrics: initialMetrics,
  trades: allTrades,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const [options, setOptions] = useState<ShareCardOptions>({
    theme: 'emerald',
    scope: 'all',
    showPnl: true,
    showSparkline: true,
    showWinRate: true,
    showProfitFactor: true,
    showBestTrade: true,
    showVolume: true,
    showLongShort: true,
    maskAccount: true,
    hideName: false,
    hideBroker: true,
  });

  // Filter trades by scope if requested
  const activeTrades = useMemo(() => {
    const now = new Date();
    if (options.scope === '30days') {
      const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      const res = allTrades.filter(t => t.closeTimestamp >= cutoff);
      return res.length > 0 ? res : allTrades;
    }
    if (options.scope === 'thisMonth') {
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = allTrades.filter(t => t.closeTime.slice(0, 7).replace(/[./]/g, '-') === prefix);
      return res.length > 0 ? res : allTrades;
    }
    return allTrades;
  }, [allTrades, options.scope]);

  const metrics = useMemo(() => {
    if (options.scope === 'all') return initialMetrics;
    return calculateMetrics(activeTrades, accountInfo.balance || 10000);
  }, [activeTrades, accountInfo.balance, initialMetrics, options.scope]);

  const equityPoints = useMemo(() => {
    return getEquityCurveData(activeTrades, metrics.initialDeposit || 10000);
  }, [activeTrades, metrics.initialDeposit]);

  const svgPoints = useMemo(() => {
    if (equityPoints.length < 2) return [];
    const minBal = Math.min(...equityPoints.map(p => p.balance));
    const maxBal = Math.max(...equityPoints.map(p => p.balance));
    const range = maxBal - minBal || 1;
    const w = 320;
    const h = 44;
    return equityPoints.map((p, idx) => ({
      x: (idx / (equityPoints.length - 1)) * w,
      y: h - ((p.balance - minBal) / range) * (h - 10) - 5,
      netPnl: p.netPnl,
      balance: p.balance,
    }));
  }, [equityPoints]);

  if (!isOpen) return null;

  const isNetProfitable = metrics.netProfit >= 0;

  // Theme Styles
  const themeStyles = {
    emerald: {
      cardBg: 'bg-white',
      border: 'border-2 border-emerald-500/40',
      textPrimary: 'text-slate-900',
      textMuted: 'text-slate-500',
      heroBg: 'bg-slate-50 border border-slate-200/80',
      glow: isNetProfitable ? 'bg-emerald-500/10' : 'bg-red-500/10',
      accentColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      gridCardBg: 'bg-slate-50 border border-slate-200/80',
    },
    indigo: {
      cardBg: 'bg-white',
      border: 'border-2 border-indigo-500/40',
      textPrimary: 'text-slate-900',
      textMuted: 'text-slate-500',
      heroBg: 'bg-indigo-50/40 border border-indigo-100',
      glow: 'bg-indigo-500/10',
      accentColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      gridCardBg: 'bg-slate-50 border border-slate-200/80',
    },
    dark: {
      cardBg: 'bg-slate-950',
      border: 'border-2 border-slate-800',
      textPrimary: 'text-white',
      textMuted: 'text-slate-400',
      heroBg: 'bg-slate-900/80 border border-slate-800',
      glow: isNetProfitable ? 'bg-emerald-500/20' : 'bg-red-500/20',
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-slate-800 text-emerald-400 border border-slate-700',
      gridCardBg: 'bg-slate-900 border border-slate-800',
    },
    white: {
      cardBg: 'bg-white',
      border: 'border-2 border-slate-200',
      textPrimary: 'text-slate-900',
      textMuted: 'text-slate-500',
      heroBg: 'bg-slate-50 border border-slate-200',
      glow: 'bg-slate-200/30',
      accentColor: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700 border border-slate-200',
      gridCardBg: 'bg-slate-50 border border-slate-200',
    },
  }[options.theme];

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: options.theme === 'dark' ? '#020617' : '#FFFFFF',
        scale: 2, // Retina resolution
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `TradeScrapbook_Card_${options.maskAccount ? 'Trader' : accountInfo.account}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture card', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: options.theme === 'dark' ? '#020617' : '#FFFFFF',
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImg(true);
          setTimeout(() => setCopiedImg(false), 2000);
        } catch (clipErr) {
          console.error('Direct clipboard write failed, downloading instead', clipErr);
          handleDownloadPng();
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySocialText = () => {
    const pnlFormatted = `${isNetProfitable ? '+' : ''}$${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const text = `📊 My Verified TradeScrapbook Performance:
💰 Net P&L: ${pnlFormatted} (${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent}%)
🎯 Win Rate: ${metrics.winRate}% (${activeTrades.length} trades)
📈 Profit Factor: ${metrics.profitFactor}
🔥 Best Setup: +$${metrics.largestWin.toFixed(0)}
🛡️ 100% Client-Side Private • Powered by https://tradescrapbook.com`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const displayName = options.hideName ? 'Verified Trader' : (accountInfo.name || 'Marcus Sterling');
  const displayAccount = options.maskAccount 
    ? `••••${accountInfo.account ? accountInfo.account.slice(-4) : '7105'}` 
    : (accountInfo.account || '94827105');
  const displayBroker = options.hideBroker ? 'Regulated Broker' : (accountInfo.broker || 'Apex Capital Markets Ltd');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Performance Share Card</h2>
              <p className="text-[11px] text-slate-500">Customize card metrics, themes, and privacy settings before sharing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Selector Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            
            {/* Theme Selector */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Card Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'emerald', label: 'Emerald Pro', color: 'bg-emerald-500' },
                  { id: 'indigo', label: 'Royal Indigo', color: 'bg-indigo-500' },
                  { id: 'dark', label: 'Midnight Dark', color: 'bg-slate-900' },
                  { id: 'white', label: 'Clean Paper', color: 'bg-slate-100' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOptions(prev => ({ ...prev, theme: t.id as any }))}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      options.theme === t.id
                        ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.color} shrink-0`}></span>
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Selector */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Timeframe Scope
              </label>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: '30days', label: 'Last 30D' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setOptions(prev => ({ ...prev, scope: s.id as any }))}
                    className={`flex-1 py-1 rounded-lg text-center text-[11px] font-semibold transition-all cursor-pointer ${
                      options.scope === s.id
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Display Toggles */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Display Elements
              </label>
              
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Net P&L Hero Box</span>
                <input
                  type="checkbox"
                  checked={options.showPnl}
                  onChange={(e) => setOptions(prev => ({ ...prev, showPnl: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Equity Sparkline (Green/Red)</span>
                <input
                  type="checkbox"
                  checked={options.showSparkline}
                  onChange={(e) => setOptions(prev => ({ ...prev, showSparkline: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Win Rate & Profit Factor</span>
                <input
                  type="checkbox"
                  checked={options.showWinRate}
                  onChange={(e) => setOptions(prev => ({ ...prev, showWinRate: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Best Trade Payout</span>
                <input
                  type="checkbox"
                  checked={options.showBestTrade}
                  onChange={(e) => setOptions(prev => ({ ...prev, showBestTrade: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Long vs Short Execution</span>
                <input
                  type="checkbox"
                  checked={options.showLongShort}
                  onChange={(e) => setOptions(prev => ({ ...prev, showLongShort: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Trade Count & Volume</span>
                <input
                  type="checkbox"
                  checked={options.showVolume}
                  onChange={(e) => setOptions(prev => ({ ...prev, showVolume: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>
            </div>

            {/* Privacy Toggles */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Privacy Protection
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mask Account #</span>
                </span>
                <input
                  type="checkbox"
                  checked={options.maskAccount}
                  onChange={(e) => setOptions(prev => ({ ...prev, maskAccount: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Hide Trader Name</span>
                <input
                  type="checkbox"
                  checked={options.hideName}
                  onChange={(e) => setOptions(prev => ({ ...prev, hideName: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[11px] font-medium text-slate-700">Hide Broker Name</span>
                <input
                  type="checkbox"
                  checked={options.hideBroker}
                  onChange={(e) => setOptions(prev => ({ ...prev, hideBroker: e.target.checked }))}
                  className="rounded text-emerald-600"
                />
              </label>
            </div>

            {/* Quick Text Copy */}
            <button
              onClick={handleCopySocialText}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 font-bold transition-colors cursor-pointer text-xs"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <MessageSquare className="w-4 h-4 text-indigo-600" />}
              <span>{copiedText ? 'Copied Text to Clipboard!' : 'Copy Formatted Text (Twitter/Discord)'}</span>
            </button>

          </div>

          {/* Right Column: Live Card Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100/60 p-4 rounded-2xl border border-slate-200">
            <div className="text-[11px] text-slate-400 font-semibold mb-3">
              LIVE CARD PREVIEW
            </div>

            {/* The Visual Social Card to Capture */}
            <div
              ref={cardRef}
              className={`w-full max-w-sm sm:max-w-md ${themeStyles.cardBg} ${themeStyles.border} rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all`}
            >
              {/* Background ambient lighting */}
              <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-2xl pointer-events-none ${themeStyles.glow}`} />

              {/* Brand Header */}
              <div className="flex items-center justify-between border-b border-slate-100/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className={`font-extrabold text-sm tracking-tight ${themeStyles.textPrimary}`}>
                    Trade<span className="text-emerald-500">Scrapbook</span>
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${themeStyles.badgeBg}`}>
                  Verified Statement
                </span>
              </div>

              {/* Trader & Account Info */}
              <div className="mt-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className={`font-bold text-sm ${themeStyles.textPrimary}`}>{displayName}</div>
                  <div className={`text-[10px] font-mono ${themeStyles.textMuted}`}>
                    {displayBroker} • #{displayAccount}
                  </div>
                </div>
                {options.showVolume && (
                  <div className="text-right text-[10px]">
                    <div className={`font-medium ${themeStyles.textMuted}`}>{activeTrades.length} Closed Trades</div>
                    <div className="text-emerald-500 font-semibold">{metrics.totalVolume.toFixed(2)} Lots Traded</div>
                  </div>
                )}
              </div>

              {/* Net P&L Hero Display */}
              {options.showPnl && (
                <div className={`my-3.5 p-3.5 ${themeStyles.heroBg} rounded-xl text-center`}>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Total Net Profit & Loss
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 ${isNetProfitable ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isNetProfitable ? '+' : ''}${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${themeStyles.textMuted}`}>
                    Return: <strong className={metrics.totalReturnPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}%
                    </strong>
                  </div>

                  {/* Mini Equity Curve (Green for Profit, Red for Loss) */}
                  {options.showSparkline && svgPoints.length > 1 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/40">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium mb-1 px-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span>Trajectory</span>
                        </span>
                        <span className="flex items-center gap-2 text-[8.5px]">
                          <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Profit (Green)
                          </span>
                          <span className="text-red-500 font-semibold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Loss (Red)
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-10 bg-white/10 rounded-lg p-0.5 flex items-center justify-center">
                        <svg viewBox="0 0 320 44" className="w-full h-full overflow-visible">
                          {svgPoints.map((p1, idx) => {
                            if (idx === 0) return null;
                            const p0 = svgPoints[idx - 1];
                            const isProfitSegment = p1.y <= p0.y; // smaller y is higher balance
                            return (
                              <line
                                key={`seg-${idx}`}
                                x1={p0.x}
                                y1={p0.y}
                                x2={p1.x}
                                y2={p1.y}
                                stroke={isProfitSegment ? '#10B981' : '#EF4444'}
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              />
                            );
                          })}
                          {svgPoints.map((p, idx) => {
                            if (idx === 0) return null;
                            return (
                              <circle
                                key={`dot-${idx}`}
                                cx={p.x}
                                cy={p.y}
                                r="2"
                                fill={p.netPnl >= 0 ? '#10B981' : '#EF4444'}
                                stroke="#FFFFFF"
                                strokeWidth="0.8"
                              />
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metric Triple Grid */}
              {(options.showWinRate || options.showProfitFactor || options.showBestTrade) && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {options.showWinRate && (
                    <div className={`p-2 rounded-xl ${themeStyles.gridCardBg}`}>
                      <div className="text-[8.5px] uppercase font-bold text-slate-400">Win Rate</div>
                      <div className="text-sm font-extrabold font-mono text-indigo-500 mt-0.5">
                        {metrics.winRate}%
                      </div>
                    </div>
                  )}

                  {options.showProfitFactor && (
                    <div className={`p-2 rounded-xl ${themeStyles.gridCardBg}`}>
                      <div className="text-[8.5px] uppercase font-bold text-slate-400">Profit Factor</div>
                      <div className="text-sm font-extrabold font-mono text-emerald-500 mt-0.5">
                        {metrics.profitFactor}
                      </div>
                    </div>
                  )}

                  {options.showBestTrade && (
                    <div className={`p-2 rounded-xl ${themeStyles.gridCardBg}`}>
                      <div className="text-[8.5px] uppercase font-bold text-slate-400">Best Trade</div>
                      <div className="text-sm font-extrabold font-mono text-emerald-500 mt-0.5">
                        +${metrics.largestWin.toFixed(0)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Long vs Short Split Bar */}
              {options.showLongShort && (
                <div className="mt-2.5 pt-2 border-t border-slate-100/20 text-[9px] flex items-center justify-between text-slate-400 font-medium">
                  <span className="text-emerald-500">Longs: {metrics.longWins}/{metrics.longTrades} ({metrics.longWinRate}%)</span>
                  <span className="text-red-500">Shorts: {metrics.shortWins}/{metrics.shortTrades} ({metrics.shortWinRate}%)</span>
                </div>
              )}

              {/* Footer Watermark */}
              <div className="mt-3 pt-2 border-t border-slate-100/20 flex items-center justify-between text-[8.5px] text-slate-400 font-medium">
                <span>Zero-Knowledge Trading Journal</span>
                <span>tradescrapbook.com</span>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>High-res 2x retina screenshot card ready to share</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyClipboard}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copiedImg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
              <span>{copiedImg ? 'Copied Image!' : 'Copy Image'}</span>
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={isGenerating}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Download PNG Card'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
