import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Cookie, 
  Check, 
  Lock, 
  Trash2, 
  Sliders, 
  ExternalLink,
  Info
} from 'lucide-react';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (prefs: CookiePreferences) => void;
  onPurgeAllStorage: () => void;
}

export interface CookiePreferences {
  essential: boolean; // strictly necessary local storage (always true)
  analytics: boolean; // performance / telemetry
  marketing: boolean; // advertising / tracking
  hasConsented: boolean;
  timestamp: string;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  onSavePreferences,
  onPurgeAllStorage,
}) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences({
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      hasConsented: true,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  const handleAcceptAll = () => {
    onSavePreferences({
      essential: true,
      analytics: false, // TradeScrapbook uses zero analytics trackers anyway
      marketing: false,
      hasConsented: true,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Global Privacy & Cookie Preferences</h3>
              <p className="text-xs text-slate-500">GDPR, ePrivacy & CCPA Compliance Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Explanations */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          
          {/* Zero-Tracking Guarantee Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-emerald-800 font-bold block mb-0.5">
                Our Zero-Knowledge Privacy Standard:
              </strong>
              TradeScrapbook operates with <strong>zero third-party tracking cookies</strong>. We do not sell your personal data, track your browsing across the internet, or store trade records on our servers.
            </div>
          </div>

          {/* Category 1: Strictly Necessary Local Storage */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">Strictly Necessary Browser Storage</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Always Active
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Required for basic application functionality. This saves your parsed MT5/MT4 trade history and personal journal notes strictly inside your own browser's local storage so they remain available when you refresh the page.
            </p>
            <div className="mt-2 text-[11px] text-slate-500 font-mono">
              Keys: tradescrapbook_account, tradescrapbook_trades, tradescrapbook_cookie_consent
            </div>
          </div>

          {/* Category 2: Performance & Analytics */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900">Performance & Analytics Telemetry</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500">Disabled by Default</span>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We do not use Google Analytics or third-party telemetry beacons. All analytics in TradeScrapbook are computed directly on your local device CPU.
            </p>
          </div>

          {/* Category 3: Marketing & Advertising */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900">Advertising & Behavioral Profiling</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500">None Used</span>
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  disabled
                  className="w-4 h-4 accent-emerald-600 rounded cursor-not-allowed opacity-40"
                />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              TradeScrapbook is completely ad-free. We never share, broker, or monetize your trading records, broker account numbers, or lot volume.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              if (window.confirm('Clear all trade data and cookie preferences from this browser?')) {
                onPurgeAllStorage();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Browser Storage</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Save Preferences
            </button>

            <button
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Accept Essential (100% Private)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
