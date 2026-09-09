import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { AccountInfo } from '../types/trade';

interface RiskCalculatorViewProps {
  accountInfo: AccountInfo;
}

export const RiskCalculatorView: React.FC<RiskCalculatorViewProps> = ({ accountInfo }) => {
  const [balance, setBalance] = useState<number>(accountInfo.balance || 10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [stopLossPips, setStopLossPips] = useState<number>(25);
  const [selectedAsset, setSelectedAsset] = useState<string>('XAUUSD');

  const assets = [
    { id: 'XAUUSD', name: 'Gold (XAU/USD)', pipValStandard: 100, unit: 'pips' },
    { id: 'EURUSD', name: 'EUR/USD (Forex)', pipValStandard: 10, unit: 'pips' },
    { id: 'GBPUSD', name: 'GBP/USD (Forex)', pipValStandard: 10, unit: 'pips' },
    { id: 'USDJPY', name: 'USD/JPY (Forex)', pipValStandard: 9.2, unit: 'pips' },
    { id: 'US30', name: 'Dow Jones (US30)', pipValStandard: 1, unit: 'pts' },
    { id: 'BTCUSD', name: 'Bitcoin (BTC/USD)', pipValStandard: 1, unit: 'pts' },
  ];

  const currentAsset = assets.find(a => a.id === selectedAsset) || assets[0];

  // Mathematical lot size calculation:
  // Dollar Risk = Balance * (Risk% / 100)
  // Lot Size = Dollar Risk / (StopLoss * PipValuePerLot)
  const dollarRisk = parseFloat((balance * (riskPercent / 100)).toFixed(2));
  
  let calculatedLots = 0.01;
  if (stopLossPips > 0) {
    if (selectedAsset === 'XAUUSD') {
      // 1 pip = 0.1 in gold. Standard lot (1.00) = $10/pip. 0.01 lot = $0.10/pip.
      calculatedLots = dollarRisk / (stopLossPips * 10);
    } else if (selectedAsset === 'US30' || selectedAsset === 'BTCUSD') {
      calculatedLots = dollarRisk / stopLossPips;
    } else {
      // Standard forex: $10 per pip on 1.00 lot
      calculatedLots = dollarRisk / (stopLossPips * 10);
    }
  }

  const roundedLots = Math.max(0.01, parseFloat(calculatedLots.toFixed(2)));
  const pipValue = parseFloat((roundedLots * (selectedAsset === 'XAUUSD' ? 10 : 10)).toFixed(2));

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Live Risk & Position Sizing Calculator
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Capital Preservation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculate exact lot size before pulling the trigger to eliminate overleveraging and emotional drawdown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Input Controls */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Trade Parameters
          </h3>

          {/* Asset Instrument Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-2 block">
              Trading Instrument / Asset Pair
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedAsset === asset.id
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{asset.id}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{asset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Balance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Account Equity / Balance ($)
              </label>
              <button
                onClick={() => setBalance(accountInfo.balance || 10000)}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Reset to Account (${(accountInfo.balance || 10000).toFixed(0)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Risk Percentage */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Risk Per Trade (%)
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ${dollarRisk.toFixed(2)} Risk
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-2">
              {[0.25, 0.5, 1.0, 1.5, 2.0].map(pct => (
                <button
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    riskPercent === pct
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Stop Loss Distance */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Stop Loss Distance ({currentAsset.unit})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="500"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 1)}
                className="w-40 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-500 font-medium">
                Pips from execution price to stop loss
              </span>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Calculated Output Card */}
        <div className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border border-emerald-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Execution Sizing
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Optimal Size
              </span>
            </div>

            {/* Big Lot Size Display */}
            <div className="my-6 text-center">
              <div className="text-xs text-slate-500 font-medium">Recommended Lot Size</div>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 mt-1">
                {roundedLots} <span className="text-lg text-emerald-600">Lots</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                {selectedAsset} • {stopLossPips} {currentAsset.unit} SL
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500">Max Dollar Risk:</span>
                <span className="font-bold text-red-600 font-mono">-${dollarRisk.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500">Pip Value:</span>
                <span className="font-bold text-slate-900 font-mono">${pipValue.toFixed(2)} / pip</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500">1:2 Target Payout:</span>
                <span className="font-bold text-emerald-600 font-mono">+${(dollarRisk * 2).toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500">1:3 Target Payout:</span>
                <span className="font-bold text-emerald-600 font-mono">+${(dollarRisk * 3).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Risk rule: Sticking to ≤1% risk per trade allows you to endure 20 consecutive losses while preserving 82% of equity.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
