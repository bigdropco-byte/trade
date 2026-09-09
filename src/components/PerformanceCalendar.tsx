import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X
} from 'lucide-react';
import { DailySummary, Trade } from '../types/trade';
import { groupTradesByDay } from '../utils/analytics';

interface PerformanceCalendarProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export const PerformanceCalendar: React.FC<PerformanceCalendarProps> = ({
  trades,
  onSelectTrade,
}) => {
  // Group trades by date string YYYY-MM-DD
  const dailyMap = groupTradesByDay(trades);

  // Determine initial month from trade dates or fallback to current
  const initialDate = trades.length > 0 
    ? new Date(trades[0].closeTimestamp) 
    : new Date();

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [selectedDaySummary, setSelectedDaySummary] = useState<DailySummary | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar grid matrix
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Monthly stats calculation
  let monthTotalPnl = 0;
  let monthTradesCount = 0;
  let greenDaysCount = 0;
  let redDaysCount = 0;
  let monthWins = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = dailyMap[dayStr];
    if (dayData) {
      monthTotalPnl += dayData.netProfit;
      monthTradesCount += dayData.tradesCount;
      monthWins += dayData.winCount;
      if (dayData.netProfit > 0.001) greenDaysCount++;
      else if (dayData.netProfit < -0.001) redDaysCount++;
    }
  }

  const monthWinRate = monthTradesCount > 0 ? ((monthWins / monthTradesCount) * 100).toFixed(1) : '0';

  // Build weeks
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Calendar Header with Monthly Stats Bar (Light Theme) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 min-w-44 text-center">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Monthly Summary Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Month Net P&L</div>
            <div className={`text-base font-black font-mono ${monthTotalPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {monthTotalPnl >= 0 ? '+' : ''}${monthTotalPnl.toFixed(2)}
            </div>
          </div>

          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Trade Days</div>
            <div className="text-base font-bold text-slate-800 mt-0.5">
              <span className="text-emerald-600">{greenDaysCount} Green</span>
              {' / '}
              <span className="text-red-600">{redDaysCount} Red</span>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Month Win Rate</div>
            <div className="text-base font-black font-mono text-indigo-700 mt-0.5">
              {monthWinRate}% <span className="text-xs font-normal text-slate-500">({monthTradesCount} trades)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid (Clean Light Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Weeks & Days */}
        <div className="divide-y divide-slate-200">
          {weeks.map((week, weekIdx) => {
            return (
              <div key={weekIdx} className="grid grid-cols-7 divide-x divide-slate-200 min-h-28">
                {week.map((day, dayIdx) => {
                  if (day === null) {
                    return (
                      <div
                        key={dayIdx}
                        className="bg-slate-50/40 p-2 text-slate-300 min-h-28"
                      />
                    );
                  }

                  const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayData = dailyMap[dayStr];
                  const hasTrades = !!dayData;
                  const isGreen = hasTrades && dayData.netProfit > 0.001;
                  const isRed = hasTrades && dayData.netProfit < -0.001;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => hasTrades && setSelectedDaySummary(dayData)}
                      className={`p-2.5 flex flex-col justify-between transition-all min-h-28 ${
                        hasTrades
                          ? isGreen
                            ? 'bg-emerald-50/60 hover:bg-emerald-100/60 border-t-2 border-t-emerald-500 cursor-pointer'
                            : isRed
                            ? 'bg-red-50/60 hover:bg-red-100/60 border-t-2 border-t-red-500 cursor-pointer'
                            : 'bg-slate-50 hover:bg-slate-100 border-t-2 border-t-slate-400 cursor-pointer'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${hasTrades ? 'text-slate-900' : 'text-slate-400'}`}>
                          {day}
                        </span>
                        {hasTrades && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isGreen ? 'bg-emerald-100 text-emerald-800' : isRed ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {dayData.tradesCount}T
                          </span>
                        )}
                      </div>

                      {/* Day Content */}
                      {hasTrades ? (
                        <div className="my-auto text-center py-1">
                          <div className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                            isGreen ? 'text-emerald-700' : isRed ? 'text-red-700' : 'text-slate-800'
                          }`}>
                            {isGreen ? '+' : ''}${dayData.netProfit.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {dayData.winRate}% Win
                          </div>
                        </div>
                      ) : (
                        <div className="my-auto text-center text-[11px] text-slate-300 font-mono">
                          —
                        </div>
                      )}

                      {/* Footer hint */}
                      {hasTrades && (
                        <div className="text-[9px] text-slate-500 text-right truncate">
                          {dayData.volume} lots
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Modal (Crisp White Modal) */}
      {selectedDaySummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  Performance on {selectedDaySummary.date}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedDaySummary.tradesCount} trades executed • {selectedDaySummary.volume} total lots
                </p>
              </div>
              <button
                onClick={() => setSelectedDaySummary(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Day Stats */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Day Net P&L</div>
                <div className={`text-base font-extrabold font-mono mt-0.5 ${
                  selectedDaySummary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {selectedDaySummary.netProfit >= 0 ? '+' : ''}${selectedDaySummary.netProfit.toFixed(2)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Win Rate</div>
                <div className="text-base font-extrabold font-mono text-indigo-700 mt-0.5">
                  {selectedDaySummary.winRate}% ({selectedDaySummary.winCount}W / {selectedDaySummary.lossCount}L)
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Gross Stats</div>
                <div className="text-xs font-mono mt-1 text-slate-700">
                  <span className="text-emerald-600 font-semibold">+${selectedDaySummary.grossProfit}</span> / <span className="text-red-600 font-semibold">-${selectedDaySummary.grossLoss}</span>
                </div>
              </div>
            </div>

            {/* List of Trades for Selected Day */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {selectedDaySummary.trades.map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => {
                    setSelectedDaySummary(null);
                    onSelectTrade(trade);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-8 rounded-full ${trade.type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{trade.symbol}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          trade.type === 'buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {trade.type} {trade.volume}L
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">#{trade.id}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {trade.openTime.slice(11)} ➔ {trade.closeTime.slice(11)} ({trade.durationFormatted})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${trade.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Entry: {trade.openPrice} | Exit: {trade.closePrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedDaySummary(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
