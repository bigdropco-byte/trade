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
import { generateCardCanvas } from '../utils/cardCanvas';
import { trackEvent } from '../utils/analyticsTracker';

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
  const [shareToast, setShareToast] = useState<string | null>(null);

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
    setIsGenerating(true);

    try {
      trackEvent('download_card_png', { theme: options.theme });
      const canvas = generateCardCanvas(accountInfo, metrics, activeTrades, equityPoints, options);

      canvas.toBlob((blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.style.display = 'none';
          link.download = `TradeScrapbook_Card_${options.maskAccount ? 'Trader' : (accountInfo.account || 'Trader')}_${new Date().toISOString().slice(0, 10)}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setIsGenerating(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.download = `TradeScrapbook_Card_${options.maskAccount ? 'Trader' : (accountInfo.account || 'Trader')}_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsGenerating(false);
        }, 300);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to capture card', err);
      setIsGenerating(false);
    }
  };

  const handleCopyClipboard = async () => {
    setIsGenerating(true);

    try {
      const canvas = generateCardCanvas(accountInfo, metrics, activeTrades, equityPoints, options);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          trackEvent('copy_card_clipboard', { theme: options.theme });
          setCopiedImg(true);
          setTimeout(() => setCopiedImg(false), 2000);
        } catch (clipErr) {
          console.error('Direct clipboard write failed, downloading instead', clipErr);
          handleDownloadPng();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const getShareText = () => {
    const pnlFormatted = `${isNetProfitable ? '+' : ''}$${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    return `📊 My Verified TradeScrapbook Performance:
💰 Net P&L: ${pnlFormatted} (${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent}%)
🎯 Win Rate: ${metrics.winRate}% (${activeTrades.length} trades)
📈 Profit Factor: ${metrics.profitFactor}
🔥 Best Setup: +$${metrics.largestWin.toFixed(0)}
🛡️ 100% Client-Side Private • Free Forex & MT4/MT5 Journal https://tradescrapbook.com #TradeScrapbook #trading #forex`;
  };

  const copyImageToClipboardQuietly = async (): Promise<boolean> => {
    try {
      const canvas = generateCardCanvas(accountInfo, metrics, activeTrades, equityPoints, options);
      return await new Promise<boolean>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          try {
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              resolve(true);
            } else {
              resolve(false);
            }
          } catch {
            resolve(false);
          }
        }, 'image/png');
      });
    } catch {
      return false;
    }
  };

  const handleShareTwitter = async () => {
    setIsGenerating(true);
    const copied = await copyImageToClipboardQuietly();
    setIsGenerating(false);
    trackEvent('share_card_twitter', { copied_image: copied });

    if (copied) {
      setShareToast('✅ Card image copied to clipboard! Press Ctrl+V (or Cmd+V) to paste into your tweet.');
    } else {
      setShareToast('💡 Tip: Use "Download PNG Card" below to attach your image file.');
    }
    setTimeout(() => setShareToast(null), 8000);

    const text = getShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = async () => {
    setIsGenerating(true);
    const copied = await copyImageToClipboardQuietly();
    setIsGenerating(false);
    trackEvent('share_card_telegram', { copied_image: copied });

    if (copied) {
      setShareToast('✅ Card image copied to clipboard! Press Ctrl+V (or Cmd+V) to paste into your Telegram chat.');
    } else {
      setShareToast('💡 Tip: Use "Download PNG Card" below to attach your image file.');
    }
    setTimeout(() => setShareToast(null), 8000);

    const text = getShareText();
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://tradescrapbook.com')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = async () => {
    setIsGenerating(true);
    const copied = await copyImageToClipboardQuietly();
    setIsGenerating(false);
    trackEvent('share_card_whatsapp', { copied_image: copied });

    if (copied) {
      setShareToast('✅ Card image copied to clipboard! Press Ctrl+V (or Cmd+V) to paste into your WhatsApp chat.');
    } else {
      setShareToast('💡 Tip: Use "Download PNG Card" below to attach your image file.');
    }
    setTimeout(() => setShareToast(null), 8000);

    const text = getShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    setIsGenerating(true);
    trackEvent('share_card_native');
    try {
      const canvas = generateCardCanvas(accountInfo, metrics, activeTrades, equityPoints, options);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }
        const file = new File([blob], 'TradeScrapbook_Performance.png', { type: 'image/png' });
        const text = getShareText();

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'TradeScrapbook Verified Performance Card',
              text,
              files: [file],
            });
          } catch {
            // User dismissed or aborted share
          }
        } else if (navigator.share) {
          try {
            await navigator.share({
              title: 'TradeScrapbook Verified Performance Card',
              text,
              url: 'https://tradescrapbook.com',
            });
          } catch {
            // User dismissed
          }
        } else {
          // Fallback to Twitter
          handleShareTwitter();
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.error('Native share error', err);
      setIsGenerating(false);
    }
  };

  const handleCopySocialText = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const displayName = options.hideName 
    ? 'Verified Trader' 
    : (accountInfo.isDemo ? (accountInfo.name || 'Marcus Sterling') : (accountInfo.name || 'Trader'));
  const displayAccount = options.maskAccount 
    ? `••••${accountInfo.account && accountInfo.account !== 'N/A' ? accountInfo.account.slice(-4) : (accountInfo.isDemo ? '7105' : '••••')}` 
    : (accountInfo.isDemo ? (accountInfo.account || '94827105') : (accountInfo.account || 'Account'));
  const displayBroker = options.hideBroker 
    ? 'Regulated Broker' 
    : (accountInfo.isDemo ? (accountInfo.broker || 'Apex Capital Markets Ltd') : (accountInfo.broker || 'Trading Account'));

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

            {/* Social Media Sharing Panel */}
            <div className="w-full max-w-sm sm:max-w-md mt-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share Card to Social Media</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  Instant 1-Click
                </span>
              </div>

              {/* Toast banner when user clicks share */}
              {shareToast && (
                <div className="mb-2.5 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-medium leading-snug flex items-center gap-1.5 shadow-xs animate-in fade-in duration-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{shareToast}</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* X (Twitter) */}
                <button
                  onClick={handleShareTwitter}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Auto-copies card image to clipboard and opens X"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Post on X</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={handleShareTelegram}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#229ED9] hover:bg-[#1b8ec5] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Auto-copies card image to clipboard and opens Telegram"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  <span>Telegram</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#25D366] hover:bg-[#1fad53] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Auto-copies card image to clipboard and opens WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25.7-.73 1.29-1.39 1.67-.66.38-1.42.49-2.22.31-1.78-.39-3.41-1.35-4.66-2.73-1.12-1.24-1.92-2.73-2.26-4.32-.17-.79-.04-1.57.36-2.21.39-.63.99-1.07 1.7-1.28.18-.05.37-.08.56-.08.19 0 .37.03.55.1.42.16.7.53.79.98.08.38.25 1.05.38 1.34.12.29.07.57-.13.78-.17.18-.35.35-.5.53-.15.18-.17.34-.05.54.44.75 1.03 1.39 1.71 1.9.72.54 1.54.91 2.42 1.09.21.04.39-.02.52-.18.15-.17.33-.37.52-.55.22-.21.5-.27.78-.16.29.11.97.46 1.35.65.45.23.68.57.69 1.02.01.21-.06.4-.19.57z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                {/* More Apps (Native Device Share Sheet) */}
                <button
                  onClick={handleNativeShare}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Share image file directly via device share sheet (Discord, Instagram, Messages, AirDrop)"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>More Apps</span>
                </button>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                <span>💡 <b>Image auto-copied!</b> Just press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[9px] text-slate-700">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[9px] text-slate-700">Cmd+V</kbd> in your post to attach it. Tap <b>More Apps</b> to send the file directly.</span>
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
