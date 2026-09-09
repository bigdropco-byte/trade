import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Menu, 
  Upload, 
  FileText, 
  Share2, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { DashboardOverview } from './components/DashboardOverview';
import { PerformanceCalendar } from './components/PerformanceCalendar';
import { AnalyticsView } from './components/AnalyticsView';
import { TradeJournal } from './components/TradeJournal';
import { AICoachInsights } from './components/AICoachInsights';
import { PlaybookView } from './components/PlaybookView';
import { RiskCalculatorView } from './components/RiskCalculatorView';
import { MilestonesView } from './components/MilestonesView';
import { PropFirmTracker } from './components/PropFirmTracker';
import { UploadModal } from './components/UploadModal';
import { ShareCardModal } from './components/ShareCardModal';
import { PrivacyModal } from './components/PrivacyModal';
import { ReportExportModal } from './components/ReportExportModal';
import { CookiePreferencesModal, CookiePreferences } from './components/CookiePreferencesModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { AccountInfo, Trade } from './types/trade';
import { sampleAccountInfo, sampleTrades } from './utils/sampleData';
import { calculateMetrics } from './utils/analytics';
import { exportStatementPdf } from './utils/pdfExport';
import { ParseResult } from './utils/parser';
import { trackPageView, trackEvent } from './utils/analyticsTracker';

export const App: React.FC = () => {
  // First show landing page as requested by user
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Global Cookie Preferences (GDPR, CCPA & ePrivacy Compliant)
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences | null>(() => {
    const saved = localStorage.getItem('tradescrapbook_cookie_consent') || localStorage.getItem('tradepulse_cookie_consent');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isCookieModalOpen, setIsCookieModalOpen] = useState<boolean>(false);

  // Stored statement state
  const [accountInfo, setAccountInfo] = useState<AccountInfo>(() => {
    const saved = localStorage.getItem('tradescrapbook_account') || localStorage.getItem('tradepulse_account');
    if (saved) {
      try { 
        return JSON.parse(saved); 
      } catch (e) {}
    }
    return sampleAccountInfo;
  });

  // Global Privacy Masking Mode (Defaults to false so real uploaded details show; user can toggle in UI)
  const [isPrivacyMasked, setIsPrivacyMasked] = useState<boolean>(() => {
    const saved = localStorage.getItem('tradescrapbook_privacy_masked') || localStorage.getItem('tradepulse_privacy_masked');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('tradescrapbook_privacy_masked', String(isPrivacyMasked));
  }, [isPrivacyMasked]);

  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('tradescrapbook_trades') || localStorage.getItem('tradepulse_trades');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return sampleTrades;
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Listen for query parameters from SEO landing pages (e.g. ?action=demo or ?action=upload)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'demo' || params.get('demo') === 'true') {
        setShowDashboard(true);
      } else if (action === 'upload') {
        setIsUploadOpen(true);
      }
    } catch (e) {
      console.error('URL parse error', e);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tradescrapbook_account', JSON.stringify(accountInfo));
  }, [accountInfo]);

  useEffect(() => {
    localStorage.setItem('tradescrapbook_trades', JSON.stringify(trades));
  }, [trades]);

  // Compute live metrics with useMemo for blazing speed
  const metrics = useMemo(() => {
    return calculateMetrics(trades, accountInfo.balance || 10000);
  }, [trades, accountInfo.balance]);

  // Track Virtual Page Views in Google Analytics 4 (GA4)
  useEffect(() => {
    if (!showDashboard) {
      trackPageView('TradeScrapbook - Free Trading Journal & Forex Tracker', '/');
    } else {
      const tabTitle = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
      trackPageView(`TradeScrapbook - ${tabTitle}`, `/#${currentTab}`);
    }
  }, [showDashboard, currentTab]);

  const handleDataParsed = (result: ParseResult) => {
    setAccountInfo({
      ...result.accountInfo,
      isDemo: false,
    });
    setTrades(result.trades);
    setIsPrivacyMasked(false); // Display real uploaded statement name and details unmasked!
    setShowDashboard(true);

    // Track statement import in GA4
    const netPnl = result.trades.reduce((acc, t) => acc + t.netProfit, 0);
    trackEvent('statement_imported', {
      trade_count: result.trades.length,
      net_pnl: netPnl,
      broker: result.accountInfo.broker || 'Unspecified',
    });

    // Trigger celebration if profitable
    if (netPnl > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleLoadDemo = () => {
    setAccountInfo({
      ...sampleAccountInfo,
      isDemo: true,
    });
    setTrades(sampleTrades);
    setShowDashboard(true);

    // Track sample explore in GA4
    trackEvent('explore_sample_journal', {
      category: 'engagement',
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handlePurgeData = () => {
    localStorage.removeItem('tradescrapbook_account');
    localStorage.removeItem('tradescrapbook_trades');
    localStorage.removeItem('tradepulse_account');
    localStorage.removeItem('tradepulse_trades');
    setAccountInfo({
      name: 'Trader',
      account: 'Empty',
      broker: 'No Account',
      currency: 'USD',
      balance: 0,
      equity: 0,
      freeMargin: 0,
      margin: 0,
      marginLevel: 0,
    });
    setTrades([]);
    setShowDashboard(false);
  };

  const handleAcceptEssentialCookies = () => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      hasConsented: true,
      timestamp: new Date().toISOString(),
    };
    setCookiePreferences(prefs);
    localStorage.setItem('tradescrapbook_cookie_consent', JSON.stringify(prefs));
  };

  const handleSaveCookiePreferences = (prefs: CookiePreferences) => {
    setCookiePreferences(prefs);
    localStorage.setItem('tradescrapbook_cookie_consent', JSON.stringify(prefs));
  };

  const handlePurgeAllDataAndCookies = () => {
    handlePurgeData();
    localStorage.removeItem('tradescrapbook_cookie_consent');
    localStorage.removeItem('tradepulse_cookie_consent');
    setCookiePreferences(null);
  };

  const handleUpdateTrade = (updated: Trade) => {
    setTrades(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleExportPdf = () => {
    setIsPdfModalOpen(true);
  };

  const pageHeaders: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Real-time performance snapshot, equity curve, and core trading KPIs' },
    calendar: { title: 'Performance Calendar & Heatmap', subtitle: 'Monthly day-by-day P&L heatmap and execution drill-down' },
    analytics: { title: 'Deep Statistical Analytics', subtitle: 'Cumulative equity growth, session hours, weekday edge, and asset breakdown' },
    journal: { title: 'Trading Execution Journal', subtitle: 'Complete log of trades, custom setup tags, and trader reflections' },
    aicoach: { title: 'TradeScrapbook AI Psychology Coach', subtitle: 'Algorithmic detection of revenge trading, hold times, and discipline score' },
    playbook: { title: 'Playbook & Setup Library', subtitle: 'Define and track mathematical edge across your A+ trading models' },
    calculator: { title: 'Risk & Position Sizing Calculator', subtitle: 'Calculate exact lot size before pulling the trigger to eliminate overleveraging' },
    milestones: { title: 'Milestones & Winning Streaks', subtitle: 'Gamified consistency badges and psychological habit tracking' },
    propfirm: { title: 'Prop Firm Challenge Tracker', subtitle: 'Live compliance monitoring for FTMO, FundedNext, and The5ers rules' },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* 1. Landing Page First (When visitor lands or clicks Home) */}
      {!showDashboard ? (
        <LandingPage
          onDataParsed={handleDataParsed}
          onLoadDemo={handleLoadDemo}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenCookieSettings={() => setIsCookieModalOpen(true)}
        />
      ) : (
        /* 2. Full Dashboard View with Professional Left Sidebar */
        <div className="flex min-h-screen bg-[#F8FAFC]">
          
          {/* Left Sidebar */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            accountInfo={accountInfo}
            tradesCount={trades.length}
            onOpenUpload={() => setIsUploadOpen(true)}
            onLoadDemo={handleLoadDemo}
            onExportPdf={handleExportPdf}
            onOpenShare={() => setIsShareOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenCookieSettings={() => setIsCookieModalOpen(true)}
            onBackToHome={() => setShowDashboard(false)}
            isOpenMobile={isMobileSidebarOpen}
            setIsOpenMobile={setIsMobileSidebarOpen}
            isPrivacyMasked={isPrivacyMasked}
            onTogglePrivacyMask={() => setIsPrivacyMasked(!isPrivacyMasked)}
          />

          {/* Right Main Content Column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Top Header Bar for Main Content */}
            <header className="h-16 px-3 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs gap-2">
              {/* Left: Mobile hamburger + Page Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-1 sm:mr-2">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">
                    {pageHeaders[currentTab]?.title || 'Dashboard'}
                  </h1>
                  <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                    {pageHeaders[currentTab]?.subtitle || 'Institutional performance analytics'}
                  </p>
                </div>
              </div>

              {/* Right: Quick Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                <div className="hidden sm:flex items-center gap-3 mr-2 text-xs">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-medium">Net P&L</div>
                    <div className={`font-mono font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-7 w-px bg-slate-200" />
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-medium">Win Rate</div>
                    <div className="font-mono font-bold text-indigo-700">
                      {metrics.winRate}%
                    </div>
                  </div>
                </div>

                {/* Privacy Mode Quick Toggle */}
                <button
                  onClick={() => setIsPrivacyMasked(!isPrivacyMasked)}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 ${
                    isPrivacyMasked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={isPrivacyMasked ? "Privacy Mode is ON: Account # and trader identity are masked. Click to reveal." : "Privacy Mode is OFF: Click to mask sensitive account data."}
                >
                  {isPrivacyMasked ? <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="hidden md:inline">{isPrivacyMasked ? 'Privacy Mask: ON' : 'Privacy Mask: OFF'}</span>
                </button>

                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs shrink-0"
                  title="Download Statement PDF"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                </button>

                <button
                  onClick={() => setIsShareOpen(true)}
                  className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs shrink-0"
                  title="Share Screenshot Card"
                >
                  <Share2 className="w-4 h-4 text-teal-600" />
                </button>
              </div>
            </header>

            {/* Main Viewport Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {currentTab === 'dashboard' && (
                <DashboardOverview
                  metrics={metrics}
                  trades={trades}
                  accountInfo={accountInfo}
                  onSelectTab={setCurrentTab}
                  onSelectTrade={(trade) => {
                    setSelectedTrade(trade);
                    setCurrentTab('journal');
                  }}
                  isPrivacyMasked={isPrivacyMasked}
                  onTogglePrivacyMask={() => setIsPrivacyMasked(!isPrivacyMasked)}
                />
              )}

              {currentTab === 'calendar' && (
                <PerformanceCalendar
                  trades={trades}
                  onSelectTrade={(trade) => {
                    setSelectedTrade(trade);
                    setCurrentTab('journal');
                  }}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView
                  trades={trades}
                  metrics={metrics}
                />
              )}

              {currentTab === 'journal' && (
                <TradeJournal
                  trades={trades}
                  onUpdateTrade={handleUpdateTrade}
                  selectedTrade={selectedTrade}
                  setSelectedTrade={setSelectedTrade}
                />
              )}

              {currentTab === 'aicoach' && (
                <AICoachInsights
                  trades={trades}
                  metrics={metrics}
                />
              )}

              {currentTab === 'playbook' && (
                <PlaybookView
                  trades={trades}
                />
              )}

              {currentTab === 'calculator' && (
                <RiskCalculatorView
                  accountInfo={accountInfo}
                />
              )}

              {currentTab === 'milestones' && (
                <MilestonesView
                  metrics={metrics}
                  trades={trades}
                />
              )}

              {currentTab === 'propfirm' && (
                <PropFirmTracker
                  trades={trades}
                  metrics={metrics}
                />
              )}
            </main>

            {/* Compact Clean Dashboard Footer */}
            <footer className="border-t border-slate-200 bg-white py-3 px-6 text-xs text-slate-500 shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">TradeScrapbook</span>
                  <span>•</span>
                  <span>Zero-Knowledge Private Trading Journal & Scrapbook • tradescrapbook.com</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <button 
                    onClick={() => setIsPrivacyOpen(true)} 
                    className="text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                  >
                    100% Client-Side Private
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => setIsCookieModalOpen(true)} 
                    className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Cookie Preferences
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => setShowDashboard(false)} 
                    className="text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </footer>

          </div>

        </div>
      )}

      {/* Modals available globally */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataParsed={handleDataParsed}
        onLoadDemo={handleLoadDemo}
      />

      <ShareCardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        accountInfo={accountInfo}
        metrics={metrics}
        trades={trades}
      />

      {/* Comprehensive PDF Report Modal with Selector Options */}
      <ReportExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        accountInfo={accountInfo}
        metrics={metrics}
        trades={trades}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onPurgeData={handlePurgeData}
      />

      {/* Cookie Preferences Modal (GDPR & CCPA Compliant) */}
      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        onSavePreferences={handleSaveCookiePreferences}
        onPurgeAllStorage={handlePurgeAllDataAndCookies}
      />

      {/* Cookie Consent Banner (Zero-tracking notification) */}
      <CookieConsentBanner
        preferences={cookiePreferences}
        onAcceptEssential={handleAcceptEssentialCookies}
        onOpenPreferences={() => setIsCookieModalOpen(true)}
      />

    </div>
  );
};
