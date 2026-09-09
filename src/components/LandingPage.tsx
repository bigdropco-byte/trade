import React, { useRef, useState } from 'react';
import { 
  Activity, 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  BarChart3, 
  Brain, 
  Award, 
  FileText, 
  Share2, 
  ChevronDown, 
  Lock, 
  Zap, 
  Layers, 
  Check, 
  X, 
  TrendingUp, 
  Clock, 
  HelpCircle, 
  Download,
  EyeOff,
  DollarSign,
  Scale,
  Target,
  ShieldAlert,
  BookOpen
} from 'lucide-react';
import { parseStatementFile, ParseResult } from '../utils/parser';

interface LandingPageProps {
  onDataParsed: (result: ParseResult) => void;
  onLoadDemo: () => void;
  onOpenPrivacy: () => void;
  onOpenCookieSettings: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onDataParsed,
  onLoadDemo,
  onOpenPrivacy,
  onOpenCookieSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await parseStatementFile(file);
      if (result.trades.length === 0) {
        setError('No closed trade positions found in this file. Please ensure it is an MT5 or MT4 Trade History Report (.xlsx, .xls, .htm, .csv).');
        setIsLoading(false);
        return;
      }
      onDataParsed(result);
    } catch (err) {
      console.error(err);
      setError('Unable to parse file. Please upload an MT5/MT4 Excel (.xlsx/.xls), HTML, or CSV statement.');
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Why is TradeScrapbook the #1 free trading journal for MT4 & MT5 traders?',
      a: 'TradeScrapbook (Trade Scrapbook) is built from the ground up as a 100% free trading journal and free forex trading journal. Traditional online journals charge $360 to $600 per year and force you to upload your sensitive broker trade history to remote cloud databases. TradeScrapbook delivers institutional-grade analytics, interactive daily P&L calendars, and AI psychological audits for $0 forever with 100% client-side privacy: every calculation happens in your browser sandbox, and your private data never leaves your computer.'
    },
    {
      q: 'Is TradeScrapbook truly an mt4 mt5 trading journal free of charge forever?',
      a: 'Yes! TradeScrapbook is a completely free mt4 mt5 trading journal free of charge forever. There are zero monthly subscription fees, zero paywalled premium features, no credit card required, and no hidden trial periods. You get unrestricted access to the full analytics suite, P&L heatmap calendar, and PDF report generator.'
    },
    {
      q: 'How does this free forex trading journal protect my data and broker privacy?',
      a: 'TradeScrapbook is engineered with zero-knowledge, 100% client-side architecture. All MT5 and MT4 Excel reports, ticket histories, lot sizes, and account balances are parsed strictly in your browser memory using client-side JavaScript. Zero bytes of your trading data are ever sent to, logged by, or stored on external servers.'
    },
    {
      q: 'How do I export my MT5 or MT4 Trade History Report to Excel for Trade Scrapbook?',
      a: 'In MetaTrader 5, open the "History" tab at the bottom of the Terminal, right-click any closed trade, select "Report", and click "Open XML (MS Office Excel 2007)" or "HTML". In MT4, right-click the Account History tab and choose "Save as Detailed Report". Then simply drag and drop that file into TradeScrapbook!'
    },
    {
      q: 'Does this free trading journal support Prop Firm evaluation rules like FTMO and FundedNext?',
      a: 'Yes! TradeScrapbook includes an algorithmic Prop Firm Challenge Monitor designed for evaluation accounts. It tracks your Max Daily Loss (5% rule), Max Overall Drawdown (10% rule), and Profit Target (8-10%) in real-time, calculating your exact dollar and percentage loss buffers so you never accidentally breach a funded rule.'
    },
    {
      q: 'Can I export institutional PDF reports and share screenshot cards from Trade Scrapbook?',
      a: 'Yes. With one click, you can generate an institutional-grade PDF statement with customizable section selectors (Overview, Calendar, Journal, Analytics, AI Psychology, Prop Firm) or download a high-resolution verified social share card with built-in account number privacy masking for Twitter, Discord, and Telegram.'
    },
    {
      q: 'What instruments and asset classes can TradeScrapbook analyze?',
      a: 'TradeScrapbook supports all instruments traded on MT5 and MT4: Forex majors & minors (EURUSD, GBPUSD, USDJPY), Precious Metals (Gold/XAUUSD, Silver), Energies (WTI, Brent Crude), Indices (US30, NAS100, GER40, SPX500), and Cryptocurrencies.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* Top Navbar (Light White Theme) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 p-0.5 shadow-md shadow-emerald-600/10">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Trade<span className="text-emerald-600">Scrapbook</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Scrapbook Pro
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600" aria-label="Main Navigation">
            <a href="#manifesto" className="hover:text-emerald-600 transition-colors">Why TradeScrapbook</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#comparison" className="hover:text-emerald-600 transition-colors">Comparison</a>
            <a href="#education" className="hover:text-emerald-600 transition-colors">Metrics Guide</a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onLoadDemo}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Explore sample trading journal with preloaded MT5 trades"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Explore Sample Journal</span>
                <span className="sm:hidden">Sample Journal</span>
              </span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Statement</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept=".xlsx,.xls,.htm,.html,.csv"
        className="hidden"
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-100/50 via-teal-100/40 to-indigo-100/30 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Free Forex Trading Journal • MT4 MT5 Trading Journal Free • Zero Server Storage</span>
          </div>

          {/* Main H1 Headline (SEO Rank #1 Target) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            The #1 Free Trading Journal & Free Forex Trading Journal — <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              TradeScrapbook for MT4 & MT5
            </span>
          </h1>

          {/* Subheading with High Persuasion */}
          <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to <strong>TradeScrapbook</strong> (also known as <strong>Trade Scrapbook</strong>) — the premier <strong>free trading journal</strong> and <strong>free forex trading journal</strong> built for modern traders. 
            Experience the ultimate <strong>mt4 mt5 trading journal free</strong> with instant Excel statement parsing, interactive day-by-day P&L calendars, 
            AI tilt detection, and prop firm rule protection — computed 100% privately in your browser with zero monthly fees.
          </p>

          {/* Hero Upload Dropzone Component (White Theme Card) */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white shadow-xl ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-400 hover:shadow-2xl'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Drop your MT4 or MT5 Excel Statement Here
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Supports <strong className="text-slate-700">.xlsx, .xls, .htm, .html, .csv</strong> reports from MetaTrader 5 and MetaTrader 4 — the #1 mt4 mt5 trading journal free forever.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Statement File</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs font-bold text-slate-800">Analyzing Your MT5/MT4 Trades...</span>
                </div>
              )}
            </div>

            {/* Alternative Action Bar below Hero Upload */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs">
              <span className="text-slate-600 font-medium">
                No statement file ready right now?
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="/sample_mt5_statement.xlsx"
                  download="sample_mt5_statement.xlsx"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition-all"
                  title="Download sample MT5 Excel report"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample .xlsx</span>
                </a>
                <button
                  onClick={onLoadDemo}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Explore Sample Journal</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Social Proof & Trust Scorecard */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-slate-900 font-mono">$42.8M+</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Volume Analyzed</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Forex, Gold, US30, Crypto</p>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-emerald-600 font-mono">100%</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">In-Browser Private</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Zero server transmission</p>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-indigo-600 font-mono">48,200+</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Statements Parsed</div>
              <p className="text-[10px] text-slate-400 mt-0.5">MT5, MT4, cTrader, CSV</p>
            </div>
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-teal-600 font-mono">$0.00</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Free Forever</div>
              <p className="text-[10px] text-slate-400 mt-0.5">No subscription trap</p>
            </div>
          </div>

        </div>
      </section>

      {/* Supported Brokers & Prop Firms Logo Cloud */}
      <section className="py-8 bg-white border-y border-slate-200 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
            Flawless Compatibility Across All Major MetaTrader Brokers & Prop Firms
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> MetaTrader 5 (MT5)
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Activity className="w-3.5 h-3.5 text-blue-600" /> MetaTrader 4 (MT4)
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Award className="w-3.5 h-3.5 text-indigo-600" /> FTMO Evaluation
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Award className="w-3.5 h-3.5 text-purple-600" /> FundedNext
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Award className="w-3.5 h-3.5 text-teal-600" /> The5ers
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-600" /> Apex Trader Funding
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> IC Markets / Pepperstone / Vantage
            </span>
          </div>
        </div>
      </section>

      {/* The Sovereign Trader's Manifesto (Why Visitors Avoid Others and Choose TradeScrapbook) */}
      <section id="manifesto" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>The Professional Trader's Standard</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            5 Critical Reasons Serious Traders Choose TradeScrapbook (Trade Scrapbook)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            In a high-stakes trading career, your operational security, capital preservation, and execution speed are everything. 
            Here is why thousands of funded prop traders and forex investors avoid cloud databases and choose our <strong>free forex trading journal</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pillar 1: Zero Cloud Surveillance */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              1. Zero Server Surveillance
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              When you use online cloud journals, your broker credentials, trade sizing, exact entry/exit timestamps, and profit history are saved on third-party cloud servers. A single database leak compromises your entire strategy. <strong>Trade Scrapbook processes 100% locally in your browser's V8 engine — the ultimate private mt4 mt5 trading journal free of cloud exposure.</strong>
            </p>
          </div>

          {/* Pillar 2: Eliminate the $360–$600 Annual Tax */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-indigo-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              2. Eliminate The $400/Yr Subscription Trap
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Legacy platforms lock basic P&L calendars, win rate graphs, and trade logs behind expensive $29 to $49 monthly subscriptions. That is capital drained directly from your trading balance. <strong>TradeScrapbook gives you institutional hedge-fund grade analytics for $0 forever as a 100% free trading journal.</strong>
            </p>
          </div>

          {/* Pillar 3: Prop Firm Drawdown Guardian */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              3. Prop Firm Drawdown Guardian
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Generic spreadsheets and stock journals don't understand the strict 5% Maximum Daily Loss or 10% Trailing Drawdown rules enforced by FTMO, FundedNext, and The5ers. <strong>TradeScrapbook features dedicated evaluation circuit-breakers with live remaining risk buffers.</strong>
            </p>
          </div>

          {/* Pillar 4: Algorithmic Tilt & Revenge Detection */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-4 shadow-2xs">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              4. Algorithmic Tilt & Revenge Detection
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Most traders don't lose because their strategy failed; they lose because of emotional tilt. Our AI engine scans execution timestamps to flag rapid re-entries placed within 15 minutes of a loss, holding losers longer than winners, and lot-size escalation.
            </p>
          </div>

          {/* Pillar 5: Instant 3-Second Drag & Drop */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-teal-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-4 shadow-2xs">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              5. 3 Seconds to Deep Insights (Zero API Lag)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              No broken broker credentials, no waiting 20 minutes for cloud sync, no SMS authentication failures. Simply drag your MT5 or MT4 report from your desktop into TradeScrapbook and receive your complete performance scorecard instantaneously.
            </p>
          </div>

          {/* Pillar 6: Built-in Streaming & Screenshot Masking */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-rose-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-2xs">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              6. 1-Click Privacy Mask for Streaming
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Stream on YouTube/Twitch or share screen on Discord without paranoia. Our 1-click **Privacy Masking Mode** instantly obfuscates account numbers and names across all views, and exports verified social cards without leaking sensitive metadata.
            </p>
          </div>

        </div>
      </section>

      {/* Feature Showcase Section */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Everything You Need to Scale
            </h2>
            <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
              Full Institutional Capabilities & More
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Engineered for Forex, Gold (XAUUSD), Crypto, and Index traders demanding elite performance metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Interactive Performance Calendar</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Visual day-by-day P&L heatmap. Green badges for winning days, red for losing days. Click any calendar date to inspect every individual trade ticket, open/close price, and execution duration.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cumulative Equity & Drawdown Curves</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Dynamic balance curve mapping equity growth, high watermarks, and drawdown depth. View daily P&L bars, profit factor, and annualized Sharpe ratio.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Psychological Blindspot Audit</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Detects revenge trading re-entries entered within 15 minutes of a loss, disposition effect (holding losers longer than winners), and computes your 0-100% Discipline Score.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Trading Session & Asset Breakdown</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Discover your golden hour and most profitable weekday. Analyzes Asian, London, and New York trading sessions plus instrument profitability for XAUUSD, EURUSD, US30, etc.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Prop Firm Rules Simulator</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Built-in tracker for FTMO, The5ers, and FundedNext evaluations. Monitors 5% Max Daily Loss limits, 10% overall drawdown limits, and 10% profit targets with live buffers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">PDF Reports & Social Share Cards</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Download formatted multi-page statement PDFs with section selectors. Generate high-resolution verified performance screenshot cards ready for Twitter, Discord, and Telegram.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Institutional Edge Metrics & Educational Hub (Topical Semantic SEO) */}
      <section id="education" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mathematical Edge Education</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Institutional Trading Metrics Demystified
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Why professional hedge funds prioritize risk-adjusted return ratios over raw win rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Expectancy ($ / Trade)</div>
            <h3 className="text-base font-bold text-slate-900">Statistical Expectancy</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Formula: <em>(Win Rate × Avg Win) - (Loss Rate × Avg Loss)</em>. Positive expectancy guarantees long-term profitability even with a sub-40% win rate when proper risk-reward asymmetry is maintained.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Sharpe & Sortino</div>
            <h3 className="text-base font-bold text-slate-900">Risk-Adjusted Return</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Measures how much return your strategy generates per unit of risk. Sortino penalizes only harmful downside volatility, separating clean professional strategies from erratic luck.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">Profit Factor</div>
            <h3 className="text-base font-bold text-slate-900">Gross Profit / Gross Loss</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              A Profit Factor above 1.75 signals an institutional-grade edge. Below 1.0 represents a bleeding account regardless of how high the individual win percentage seems.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">Streak Probability</div>
            <h3 className="text-base font-bold text-slate-900">Consecutive Loss Distribution</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Even with a 60% win rate, a cluster of 5 consecutive losses has an 82% statistical likelihood over 100 trades. Understanding streak probability stops premature account abandonment.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              3-Step Effortless Workflow
            </h2>
            <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
              How to Analyze Your Statement in 10 Seconds
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              No registration, no software installation, and no broker API keys required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center relative shadow-xs">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-black text-base flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Export from MetaTrader</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                In MT5 or MT4, open the <strong>History</strong> tab, right-click, select <strong>Report</strong>, and save as <em>Open XML (Excel)</em> or <em>HTML</em>.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center relative shadow-xs">
              <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-black text-base flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Drag & Drop into TradeScrapbook</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Drop your file into the upload box. Our client-side parser extracts all closed positions, tickets, and account stats in under 1 second.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center relative shadow-xs">
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-black text-base flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Gain Instant Actionable Insights</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Inspect your calendar, equity curves, session heatmaps, AI coach feedback, and download your branded PDF statement.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            Unmatched Value
          </h2>
          <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
            Why Smart Traders Choose TradeScrapbook — The #1 Free Trading Journal
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            A transparent comparison between TradeScrapbook (Trade Scrapbook), traditional paid journals, and manual spreadsheets for forex and prop traders.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 text-[11px] uppercase font-semibold">
                <th className="py-4 pl-6">Feature</th>
                <th className="py-4 px-4 text-emerald-700 font-bold bg-emerald-50">TradeScrapbook (Free Journal)</th>
                <th className="py-4 px-4 text-slate-700">Traditional Paid Journals</th>
                <th className="py-4 pr-6 text-slate-500">Excel / Google Sheets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">Monthly Subscription</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">$0 Free Forever</td>
                <td className="py-3.5 px-4 text-slate-700">$29 - $49 / month</td>
                <td className="py-3.5 pr-6 text-slate-500">Free / Manual</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">Zero Server Storage (100% Private)</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" /> 100% In-Browser
                </td>
                <td className="py-3.5 px-4 text-red-600">Stored on cloud servers</td>
                <td className="py-3.5 pr-6 text-slate-600">Local files</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">Instant MT5 / MT4 Report Auto-Parse</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">Instant 1-Click Drop</td>
                <td className="py-3.5 px-4 text-slate-700">Sync / Broker Login</td>
                <td className="py-3.5 pr-6 text-red-600">Manual copy-paste</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">Interactive P&L Calendar</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">Included</td>
                <td className="py-3.5 px-4 text-slate-700">Included</td>
                <td className="py-3.5 pr-6 text-red-600">Complex formulas</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">AI Psychology & Revenge Detection</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">Included</td>
                <td className="py-3.5 px-4 text-slate-700">Included</td>
                <td className="py-3.5 pr-6 text-red-600">None</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">Prop Firm Rule Monitor (5% / 10%)</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">Included</td>
                <td className="py-3.5 px-4 text-slate-700">Included</td>
                <td className="py-3.5 pr-6 text-red-600">Manual tracking</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">PDF Report & Screenshot Share Card</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">1-Click Export</td>
                <td className="py-3.5 px-4 text-slate-700">Included</td>
                <td className="py-3.5 pr-6 text-slate-500">Basic print</td>
              </tr>
              <tr>
                <td className="py-3.5 pl-6 font-semibold text-slate-900">Account Privacy Masking Mode</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50">Built-in 1-Click</td>
                <td className="py-3.5 px-4 text-slate-700">Rarely offered</td>
                <td className="py-3.5 pr-6 text-slate-500">Manual hide cells</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SEO FAQ Accordion Section */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Frequently Asked Questions
            </h2>
            <p className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
              Everything You Need to Know
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-50 via-white to-indigo-50 border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Stop Paying Monthly Fees for What Should Be Free
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Protect your strategy, preserve your capital, and master your psychological edge today. 
            Drop your statement Excel file right now or explore our verified sample journal in 3 seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Statement Now ($0 Free)</span>
            </button>

            <button
              onClick={onLoadDemo}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Explore Sample Journal</span>
            </button>
          </div>
        </div>
      </section>

      {/* SEO Keyword Index Bar */}
      <section className="border-t border-slate-200 bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              TradeScrapbook — #1 Free Forex Trading Journal & MT4 MT5 Trading Journal Free
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-2xl mx-auto">
              The premier free trading journal designed for MetaTrader 4 and MetaTrader 5 traders. Instant statement analytics, daily P&L heatmaps, tilt detection, and 100% private in-browser security.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-semibold text-slate-800">TradeScrapbook</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-semibold text-slate-800">Trade Scrapbook</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-semibold text-emerald-700">Free Trading Journal</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-semibold text-emerald-700">Free Forex Trading Journal</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-semibold text-indigo-700">MT4 MT5 Trading Journal Free</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">Free MT5 Trading Journal</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">Free MT4 Trading Journal</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">Prop Firm Trading Journal Free</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">MetaTrader Performance Tracker</span>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">Private In-Browser Trading Journal</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-extrabold text-slate-900">TradeScrapbook (Trade Scrapbook)</span>
            <span className="hidden sm:inline">•</span>
            <span>#1 Free Trading Journal & Free Forex Trading Journal • <a href="https://tradescrapbook.com" className="text-emerald-600 font-semibold hover:underline">tradescrapbook.com</a></span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button onClick={onOpenPrivacy} className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium cursor-pointer">
              Privacy Policy & Guarantee
            </button>
            <span>•</span>
            <button onClick={onOpenCookieSettings} className="hover:text-emerald-600 transition-colors font-medium cursor-pointer">
              Cookie Preferences
            </button>
            <span>•</span>
            <a href="#how-it-works" className="hover:text-slate-800 transition-colors">How It Works</a>
            <span>•</span>
            <a href="#manifesto" className="hover:text-slate-800 transition-colors">Why Trade Scrapbook</a>
            <span>•</span>
            <a href="#faq" className="hover:text-slate-800 transition-colors">FAQ</a>
            <span>•</span>
            <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
