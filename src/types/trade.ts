export interface AccountInfo {
  name: string;
  account: string;
  broker: string;
  currency: string;
  server?: string;
  accountType?: string;
  reportDate?: string;
  balance: number;
  equity: number;
  freeMargin: number;
  margin: number;
  marginLevel: number;
  creditFacility?: number;
  floatingPL?: number;
  isDemo?: boolean;
  platform?: 'MT5' | 'MT4';
}

export interface Trade {
  id: string; // Ticket number
  openTime: string; // YYYY.MM.DD HH:mm:ss
  openTimestamp: number;
  closeTime: string;
  closeTimestamp: number;
  symbol: string; // Cleaned, e.g. "XAUUSD"
  rawSymbol: string; // e.g. "XAUUSD@"
  type: 'buy' | 'sell';
  volume: number; // Lots
  openPrice: number;
  closePrice: number;
  sl: number | null;
  tp: number | null;
  commission: number;
  swap: number;
  profit: number; // Gross profit
  netProfit: number; // profit + commission + swap
  pips: number;
  durationMinutes: number;
  durationFormatted: string;
  tags: string[];
  notes: string;
  isWin: boolean;
  isBreakeven: boolean;
  isLoss: boolean;
  pnlPercentage?: number;
  // Journal enrichment fields
  rating?: number;          // 1–5 star quality rating
  executionGrade?: string;  // 'A' | 'B' | 'C' | 'D' | 'F'
  emotion?: string;         // e.g. 'Confident' | 'Anxious' | 'Greedy' ...
  weekReflection?: string;  // stored on first trade of week, keyed by week ISO string
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  volume: number;
  trades: Trade[];
}

export interface StreakInfo {
  type: 'win' | 'loss' | 'none';
  count: number;
}

export interface TradingMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  lossRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  expectancy: number;
  maxDrawdownDollars: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  totalVolume: number;
  totalCommissions: number;
  totalSwaps: number;
  avgHoldTimeMinutes: number;
  largestWin: number;
  largestLoss: number;
  longTrades: number;
  longWins: number;
  longWinRate: number;
  shortTrades: number;
  shortWins: number;
  shortWinRate: number;
  currentStreak: StreakInfo;
  maxWinStreak: number;
  maxLossStreak: number;
  initialDeposit: number;
  endingBalance: number;
  totalReturnPercent: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  metric?: string;
  actionRecommendation?: string;
}

export interface PropFirmRule {
  name: string;
  limit: number; // percentage or fixed
  current: number;
  status: 'passed' | 'warning' | 'violated';
  description: string;
}

export interface PlaybookItem {
  id: string;
  name: string;
  category: string;
  description: string;
  timeframe: string;
  rules: string[];
  winRate: number;
  tradesCount: number;
  totalPnl: number;
  profitFactor: number;
  status: 'active' | 'testing' | 'archived';
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  category: 'discipline' | 'profit' | 'consistency';
  progress: number; // 0 to 100
  achieved: boolean;
  badge: string;
}
