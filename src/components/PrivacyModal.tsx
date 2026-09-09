import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  ServerOff, 
  Trash2, 
  Cpu
} from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurgeData: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  onPurgeData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">100% Client-Side Privacy Guarantee</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Guarantees */}
        <div className="my-5 space-y-3.5">
          
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <ServerOff className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Zero Server Transmission</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                When you upload your MT5/MT4 statement or Excel report, it is parsed strictly in your browser memory via Web File API and SheetJS. Zero bytes ever leave your device.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Zero Third-Party Tracking</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                No tracking cookies, no advertising beacons, and no external telemetry. Your trading balances, lot sizes, and broker details remain strictly confidential to you.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Cpu className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Client-Side State Only</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                All metrics, profit factors, equity curves, calendar heatmaps, and AI psychological insights are computed in real time on your local device CPU.
              </p>
            </div>
          </div>

        </div>

        {/* Purge / Clear Storage Option */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to purge all statement data from your browser memory?')) {
                onPurgeData();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Data From Browser</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
