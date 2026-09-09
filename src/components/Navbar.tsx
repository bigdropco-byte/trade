import React from 'react';
import { 
  Activity, 
  Upload, 
  FileText, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Brain, 
  Award,
  RefreshCw,
  Home,
  Eye,
  EyeOff
} from 'lucide-react';
import { AccountInfo } from '../types/trade';
import { maskAccountNumber, maskTraderName, maskBroker } from '../utils/privacy';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  accountInfo: AccountInfo;
  onOpenUpload: () => void;
  onLoadDemo: () => void;
  onExportPdf: () => void;
  onOpenShare: () => void;
  onOpenPrivacy: () => void;
  onBackToHome: () => void;
  isPrivacyMasked?: boolean;
  onTogglePrivacyMask?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  accountInfo,
  onOpenUpload,
  onLoadDemo,
  onExportPdf,
  onOpenShare,
  onOpenPrivacy,
  onBackToHome,
  isPrivacyMasked = true,
  onTogglePrivacyMask,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen },
    { id: 'aicoach', label: 'AI Coach', icon: Brain, badge: 'Smart' },
    { id: 'propfirm', label: 'Prop Firm', icon: Award },
  ];

  const displayName = maskTraderName(
    accountInfo.isDemo ? (accountInfo.name || 'Marcus Sterling') : (accountInfo.name || 'Trader'),
    isPrivacyMasked
  );
  const displayAccount = maskAccountNumber(
    accountInfo.isDemo ? (accountInfo.account || '94827105') : (accountInfo.account || 'Account'),
    isPrivacyMasked
  );
  const displayBroker = maskBroker(
    accountInfo.isDemo ? (accountInfo.broker || 'Apex Capital Markets Ltd') : (accountInfo.broker || 'Trading Account'),
    isPrivacyMasked
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner / Privacy Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1 text-xs flex items-center justify-between text-slate-500">
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenPrivacy}
            className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition-colors font-medium cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Client-Side Private — Zero Server Storage</span>
          </button>
          <span className="text-slate-300">•</span>
          <span className="hidden sm:inline text-slate-500">
            Broker: <span className="text-slate-800 font-semibold">{displayBroker}</span>
          </span>
          <span className="hidden md:inline text-slate-300">•</span>
          <span className="hidden md:inline text-slate-500">
            Account: <span className="text-slate-800 font-mono font-semibold">#{displayAccount}</span> ({displayName})
          </span>
          {accountInfo.platform && (
            <span className={`hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              accountInfo.platform === 'MT5'
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-violet-700 bg-violet-50 border-violet-200'
            }`}>
              {accountInfo.platform}
            </span>
          )}
          {onTogglePrivacyMask && (
            <button
              onClick={onTogglePrivacyMask}
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors ml-1 ${
                isPrivacyMasked 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
              title={isPrivacyMasked ? "Privacy Mode Active. Click to reveal account # & name." : "Click to mask sensitive account data."}
            >
              {isPrivacyMasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-slate-500" />}
              <span>{isPrivacyMasked ? 'Mask: ON' : 'Mask: OFF'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer mr-2"
            title="Return to homepage"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>Homepage</span>
          </button>
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
            title="Reset to Sample Journal"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sample Journal</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand (Clickable to Home) */}
          <div 
            onClick={onBackToHome}
            className="flex items-center gap-3 cursor-pointer group"
            title="Return to Homepage"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 p-0.5 shadow-md shadow-emerald-600/10 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Trade<span className="text-emerald-600">Scrapbook</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Scrapbook Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Zero-Knowledge Trading Journal & Scrapbook</p>
            </div>
          </div>

          {/* Tab Navigation (Desktop - White / Light Theme) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-700 border border-emerald-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Upload Excel/Report</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium text-xs rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Download Statement PDF"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">PDF Report</span>
            </button>

            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium text-xs rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Share Screenshot Card"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Share Card</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-200 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-700 border border-emerald-300 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
