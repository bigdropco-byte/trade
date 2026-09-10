import React from 'react';
import { 
  Activity, 
  BarChart3, 
  Calendar, 
  BookOpen, 
  Brain, 
  Layers, 
  Calculator, 
  Flame, 
  Award, 
  Upload, 
  FileText, 
  Share2, 
  ShieldCheck, 
  RefreshCw, 
  Home, 
  X,
  ChevronRight,
  TrendingUp,
  Cookie,
  Eye,
  EyeOff
} from 'lucide-react';
import { AccountInfo } from '../types/trade';
import { maskAccountNumber, maskTraderName } from '../utils/privacy';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  accountInfo: AccountInfo;
  tradesCount: number;
  onOpenUpload: () => void;
  onLoadDemo: () => void;
  onExportPdf: () => void;
  onOpenShare: () => void;
  onOpenPrivacy: () => void;
  onOpenCookieSettings: () => void;
  onBackToHome: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isPrivacyMasked?: boolean;
  onTogglePrivacyMask?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  accountInfo,
  tradesCount,
  onOpenUpload,
  onLoadDemo,
  onExportPdf,
  onOpenShare,
  onOpenPrivacy,
  onOpenCookieSettings,
  onBackToHome,
  isOpenMobile,
  setIsOpenMobile,
  isPrivacyMasked = true,
  onTogglePrivacyMask,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'CORE DASHBOARD',
      items: [
        { id: 'dashboard', label: 'Overview & Stats', icon: BarChart3 },
        { id: 'calendar', label: 'Performance Calendar', icon: Calendar },
        { id: 'analytics', label: 'Deep Analytics', icon: Activity },
        { id: 'journal', label: 'Trade Journal', icon: BookOpen, count: tradesCount },
      ],
    },
    {
      title: 'STRATEGY & AI',
      items: [
        { id: 'aicoach', label: 'Scrapbook AI Coach', icon: Brain, badge: 'Smart' },
        { id: 'playbook', label: 'Playbook & Setups', icon: Layers, badge: 'New' },
        { id: 'calculator', label: 'Risk & Lot Calculator', icon: Calculator, badge: 'Tool' },
        { id: 'milestones', label: 'Milestones & Streaks', icon: Flame },
      ],
    },
    {
      title: 'ACCOUNT & RULES',
      items: [
        { id: 'propfirm', label: 'Prop Firm Challenge', icon: Award, badge: 'Rules' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar Main Container (Clean White Theme) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div 
            onClick={onBackToHome}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Return to Homepage"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 p-0.5 shadow-md shadow-emerald-600/10 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Trade<span className="text-emerald-700">Scrapbook</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Info Pill */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 truncate">
                {maskTraderName(
                  accountInfo.isDemo ? (accountInfo.name || 'Marcus Sterling') : (accountInfo.name || 'Trader'),
                  isPrivacyMasked
                )}
              </span>
              {onTogglePrivacyMask ? (
                <button
                  onClick={onTogglePrivacyMask}
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                    isPrivacyMasked
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'text-slate-600 bg-slate-100 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={isPrivacyMasked ? "Privacy Mode Active: Account & identity masked. Click to reveal." : "Click to mask sensitive account data."}
                >
                  {isPrivacyMasked ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                  <span>{isPrivacyMasked ? 'Masked' : 'Live'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {accountInfo.isDemo ? 'Demo' : 'Verified'}
                  </span>
                  {accountInfo.platform && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      accountInfo.platform === 'MT5'
                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                        : 'text-violet-700 bg-violet-50 border-violet-200'
                    }`}>
                      {accountInfo.platform}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              #{maskAccountNumber(accountInfo.isDemo ? (accountInfo.account || '94827105') : (accountInfo.account || 'Account'), isPrivacyMasked)} • {isPrivacyMasked ? 'Regulated' : (accountInfo.broker ? accountInfo.broker.split(' ')[0] : (accountInfo.isDemo ? 'Apex' : 'Trading'))}
            </div>
          </div>
        </div>

        {/* Navigation Menu (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.count !== undefined ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.count}
                        </span>
                      ) : item.badge ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          item.badge === 'Smart' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : item.badge === 'New' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Action Shortcuts Section */}
          <div className="pt-2 border-t border-slate-200/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              TOOLS & EXPORTS
            </div>
            <div className="space-y-1">
              <button
                onClick={onOpenUpload}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Upload Statement</span>
              </button>

              <button
                onClick={onExportPdf}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Export Statement PDF</span>
              </button>

              <button
                onClick={onOpenShare}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-teal-600" />
                <span>Share Screenshot Card</span>
              </button>

              <button
                onClick={onLoadDemo}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-xl transition-colors cursor-pointer"
                title="Reset to Sample Journal"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Sample Journal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-1.5 shrink-0">
          <button
            onClick={onOpenPrivacy}
            className="w-full flex items-center justify-between p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all text-[11px] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">100% Client-Side Private</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={onOpenCookieSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl text-slate-600 hover:text-indigo-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all text-[11px] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cookie className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold">Cookie Preferences</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Zero Ads</span>
          </button>

          <button
            onClick={onBackToHome}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Homepage</span>
          </button>
        </div>
      </aside>
    </>
  );
};
