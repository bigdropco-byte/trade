import React from 'react';
import { ShieldCheck, Cookie, Sliders } from 'lucide-react';
import { CookiePreferences } from './CookiePreferencesModal';

interface CookieConsentBannerProps {
  preferences: CookiePreferences | null;
  onAcceptEssential: () => void;
  onOpenPreferences: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  preferences,
  onAcceptEssential,
  onOpenPreferences,
}) => {
  // If user has already consented, do not render banner
  if (preferences && preferences.hasConsented) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-5 shadow-2xl text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Zero-Tracking Cookie Standard</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                GDPR & CCPA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              TradeScrapbook uses <strong>zero third-party tracking cookies</strong>. We only use essential local browser memory to keep your statements on your device.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={onOpenPreferences}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Customize</span>
          </button>

          <button
            onClick={onAcceptEssential}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Accept Essential
          </button>
        </div>

      </div>
    </div>
  );
};
