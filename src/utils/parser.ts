import * as XLSX from 'xlsx';
import { AccountInfo, Trade } from '../types/trade';

export interface ParseResult {
  accountInfo: AccountInfo;
  trades: Trade[];
  rawRowCount: number;
}

/**
 * Clean numbers that may contain non-standard formatting like:
 * "4 709.76", "- 82.83", "$1,234.50", "0.00%"
 */
export function cleanNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  if (!str) return 0;

  // Remove currency signs, percentage signs
  str = str.replace(/[$€£¥%]/g, '');
  // Remove spaces between digits: e.g. "4 709.76" -> "4709.76" or "- 82.83" -> "-82.83"
  str = str.replace(/\s+/g, '');
  // Replace comma with dot if comma is decimal separator (e.g. "12,34") or remove if thousands
  if (/^\-?\d+,\d{1,2}$/.test(str)) {
    str = str.replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse date string from MT4/MT5 format:
 * "2026.04.13 14:57:31" or "2026-04-13 14:57:31" or "13.04.2026 14:57"
 */
export function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return Date.now();
  const trimmed = dateStr.trim();

  // Format: "YYYY.MM.DD HH:mm:ss" or "YYYY.MM.DD HH:mm"
  const mtMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (mtMatch) {
    const year = parseInt(mtMatch[1], 10);
    const month = parseInt(mtMatch[2], 10) - 1;
    const day = parseInt(mtMatch[3], 10);
    const hour = mtMatch[4] ? parseInt(mtMatch[4], 10) : 0;
    const minute = mtMatch[5] ? parseInt(mtMatch[5], 10) : 0;
    const second = mtMatch[6] ? parseInt(mtMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second).getTime();
  }

  // Fallback to JS Date
  const parsed = Date.parse(trimmed);
  return isNaN(parsed) ? Date.now() : parsed;
}

export function formatDuration(openTs: number, closeTs: number): { minutes: number; formatted: string } {
  const diffSec = Math.max(0, Math.floor((closeTs - openTs) / 1000));
  const minutes = parseFloat((diffSec / 60).toFixed(1));

  if (diffSec < 60) {
    return { minutes, formatted: `${diffSec}s` };
  }
  const hours = Math.floor(diffSec / 3600);
  const remainingMin = Math.floor((diffSec % 3600) / 60);
  const remainingSec = diffSec % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { minutes, formatted: `${days}d ${hours % 24}h` };
  }
  if (hours > 0) {
    return { minutes, formatted: `${hours}h ${remainingMin}m` };
  }
  return { minutes, formatted: `${remainingMin}m ${remainingSec}s` };
}

export function calculatePips(symbol: string, type: 'buy' | 'sell', openPrice: number, closePrice: number): number {
  const diff = type === 'buy' ? closePrice - openPrice : openPrice - closePrice;
  const sym = symbol.toUpperCase();

  if (sym.includes('XAU') || sym.includes('GOLD')) {
    return parseFloat((diff * 10).toFixed(1)); // 0.1 per pip in gold
  }
  if (sym.includes('JPY')) {
    return parseFloat((diff * 100).toFixed(1)); // 0.01 per pip in JPY pairs
  }
  if (sym.includes('BTC') || sym.includes('ETH')) {
    return parseFloat(diff.toFixed(2)); // points for crypto
  }
  if (sym.includes('US30') || sym.includes('NAS') || sym.includes('SPX') || sym.includes('GER')) {
    return parseFloat(diff.toFixed(1)); // index points
  }
  return parseFloat((diff * 10000).toFixed(1)); // standard forex 0.0001
}

/**
 * Clean symbol string like "XAUUSD@" or "EURUSD.r" -> "XAUUSD"
 */
export function cleanSymbol(raw: string): string {
  if (!raw) return 'UNKNOWN';
  return raw.replace(/[@#._-]/g, '').trim().toUpperCase();
}

/**
 * Universal parser for MT5 / MT4 statements in Excel (.xlsx, .xls) and CSV
 */
export async function parseStatementFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // If HTML statement, parse HTML DOM directly
  if (extension === 'html' || extension === 'htm') {
    const text = await file.text();
    return parseHtmlStatement(text);
  }

  // Read array buffer with SheetJS
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  
  // Use first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to 2D array of rows
  const rawRows: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  return parseMatrixData(rawRows);
}

/**
 * Parse 2D row array from Excel or CSV
 */
export function parseMatrixData(rows: (string | number | null | undefined)[][]): ParseResult {
  const accountInfo: AccountInfo = {
    name: 'Trader',
    account: 'N/A',
    broker: 'MetaTrader Account',
    currency: 'USD',
    balance: 0,
    equity: 0,
    freeMargin: 0,
    margin: 0,
    marginLevel: 0,
    reportDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
    isDemo: false,
  };

  const trades: Trade[] = [];

  let currentSection = '';
  let inPositions = false;
  let inOrders = false;
  let inDeals = false;
  let initialBalanceFound = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rowText = row.map(cell => String(cell || '').trim()).filter(Boolean).join(' ');
    const firstCell = String(row[0] || '').trim();

    // 1. Detect Account Header Info
    // Check MT4 statement header format: "Statement: 8017263 - John Doe" or "Statement: 8017263"
    const statementMatch = rowText.match(/statement\s*:\s*([0-9A-Za-z_-]+)(?:\s*-\s*([^\(\[\r\n\t]+))?/i);
    if (statementMatch) {
      if (statementMatch[1] && (accountInfo.account === 'N/A' || !accountInfo.account)) {
        accountInfo.account = statementMatch[1].trim();
      }
      if (statementMatch[2] && (accountInfo.name === 'Trader' || !accountInfo.name)) {
        accountInfo.name = statementMatch[2].trim();
      }
    }

    // First row broker detection (e.g. "Windsor Brokers Ltd" or "IC Markets Global")
    if (r === 0 && firstCell && !statementMatch) {
      const lowerFirst = firstCell.toLowerCase();
      if (
        !lowerFirst.includes('position') && 
        !lowerFirst.includes('order') && 
        !lowerFirst.includes('deal') && 
        !lowerFirst.includes('ticket') &&
        !lowerFirst.includes('login') &&
        !lowerFirst.includes('date') &&
        accountInfo.broker === 'MetaTrader Account'
      ) {
        accountInfo.broker = firstCell;
      }
    }

    // Scan cell-by-cell for Account Header Info
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      const nextCell = String(row[c + 1] || '').trim();

      // Name / Trader / Client / Account Holder
      if (/^(?:name|trader|client|customer|account\s*holder)\s*:?$/i.test(cellVal)) {
        if (nextCell && !/^(?:account|login|broker|company|date|currency)/i.test(nextCell)) {
          accountInfo.name = nextCell;
        }
      } else if (/^(?:name|trader|client|customer|account\s*holder)\s*:\s*(.+)/i.test(cellVal)) {
        const m = cellVal.match(/^(?:name|trader|client|customer|account\s*holder)\s*:\s*(.+)/i);
        if (m && m[1]) accountInfo.name = m[1].trim();
      }

      // Account # / Login
      if (/^(?:account|login|account\s*#|a\/c|account\s*no)\s*:?$/i.test(cellVal)) {
        if (nextCell) {
          const fullAcc = nextCell;
          accountInfo.account = fullAcc.split(' ')[0] || fullAcc;
          const currencyMatch = fullAcc.match(/\(([^,]+)/);
          if (currencyMatch) accountInfo.currency = currencyMatch[1].trim();
          accountInfo.accountType = fullAcc;
        }
      } else if (/^(?:account|login|account\s*#|a\/c|account\s*no)\s*:\s*(.+)/i.test(cellVal)) {
        const m = cellVal.match(/^(?:account|login|account\s*#|a\/c|account\s*no)\s*:\s*(.+)/i);
        if (m && m[1]) {
          const fullAcc = m[1].trim();
          accountInfo.account = fullAcc.split(' ')[0] || fullAcc;
          const currencyMatch = fullAcc.match(/\(([^,]+)/);
          if (currencyMatch) accountInfo.currency = currencyMatch[1].trim();
          accountInfo.accountType = fullAcc;
        }
      }

      // Company / Broker
      if (/^(?:company|broker|brokerage|dealer|firm)\s*:?$/i.test(cellVal)) {
        if (nextCell) accountInfo.broker = nextCell;
      } else if (/^(?:company|broker|brokerage|dealer|firm)\s*:\s*(.+)/i.test(cellVal)) {
        const m = cellVal.match(/^(?:company|broker|brokerage|dealer|firm)\s*:\s*(.+)/i);
        if (m && m[1]) accountInfo.broker = m[1].trim();
      }

      // Currency
      if (/^currency\s*:?$/i.test(cellVal)) {
        if (nextCell) accountInfo.currency = nextCell.replace(/[^A-Z]/gi, '').toUpperCase();
      } else if (/^currency\s*:\s*(.+)/i.test(cellVal)) {
        const m = cellVal.match(/^currency\s*:\s*(.+)/i);
        if (m && m[1]) accountInfo.currency = m[1].replace(/[^A-Z]/gi, '').toUpperCase();
      }

      // Date
      if (/^date\s*:?$/i.test(cellVal)) {
        if (nextCell) accountInfo.reportDate = nextCell;
      } else if (/^date\s*:\s*(.+)/i.test(cellVal)) {
        const m = cellVal.match(/^date\s*:\s*(.+)/i);
        if (m && m[1]) accountInfo.reportDate = m[1].trim();
      }
    }

    // 2. Section Headers
    const lowerRow = rowText.toLowerCase();
    if (lowerRow === 'positions' || lowerRow.startsWith('positions ')) {
      currentSection = 'positions';
      inPositions = true;
      inOrders = false;
      inDeals = false;
      continue;
    }
    if (lowerRow === 'orders' || lowerRow.startsWith('orders ')) {
      currentSection = 'orders';
      inPositions = false;
      inOrders = true;
      inDeals = false;
      continue;
    }
    if (lowerRow === 'deals' || lowerRow.startsWith('deals ')) {
      currentSection = 'deals';
      inPositions = false;
      inOrders = false;
      inDeals = true;
      continue;
    }

    // 3. Summary / Footer Rows (Balance, Equity, etc.)
    for (let c = 0; c < row.length; c++) {
      const cStr = String(row[c] || '').trim().toLowerCase();
      if (cStr === 'balance:' || cStr === 'balance') {
        const val = cleanNumber(row[c + 1]);
        if (val !== 0 || !accountInfo.balance) accountInfo.balance = val;
      } else if (cStr === 'equity:' || cStr === 'equity') {
        accountInfo.equity = cleanNumber(row[c + 1]);
      } else if (cStr === 'free margin:' || cStr === 'free margin') {
        accountInfo.freeMargin = cleanNumber(row[c + 1]);
      } else if (cStr === 'margin:' || cStr === 'margin') {
        accountInfo.margin = cleanNumber(row[c + 1]);
      } else if (cStr === 'margin level:' || cStr === 'margin level') {
        accountInfo.marginLevel = cleanNumber(row[c + 1]);
      } else if (cStr === 'credit facility:') {
        accountInfo.creditFacility = cleanNumber(row[c + 1]);
      } else if (cStr === 'floating p/l:') {
        accountInfo.floatingPL = cleanNumber(row[c + 1]);
      }
    }

    // Check for initial balance in Deals section (Type = balance)
    if (inDeals) {
      const typeIdx = row.findIndex(val => String(val).toLowerCase().trim() === 'balance');
      if (typeIdx !== -1) {
        // Look for profit / balance amount
        const profit = cleanNumber(row[11]) || cleanNumber(row[12]) || cleanNumber(row[typeIdx + 8]);
        if (profit > 0 && initialBalanceFound === 0) {
          initialBalanceFound = profit;
        }
      }
    }

    // 4. Parse Positions (Closed Trades)
    if (inPositions) {
      // Skip header row: "Time Position Symbol Type Volume Price S/L T/P Time Price Commission Swap Profit"
      if (lowerRow.includes('position') && lowerRow.includes('symbol')) {
        continue;
      }

      // Check if row has trade structure
      // e.g.: [0] 2026.04.13 14:57:31 [1] 51204918 [2] XAUUSD@ [3] buy [4] 0.01 [5] 4 709.76 [6] [7] [8] 2026.04.13 15:05:32 [9] 4 712.77 [10] 0.00 [11] 0.00 [12] 3.01
      const openTime = String(row[0] || '').trim();
      const ticket = String(row[1] || '').trim();
      const rawSymbol = String(row[2] || '').trim();
      const typeStr = String(row[3] || '').trim().toLowerCase();

      // Check if this looks like a position row
      if (openTime && (typeStr === 'buy' || typeStr === 'sell')) {
        const volume = cleanNumber(row[4]);
        const openPrice = cleanNumber(row[5]);
        const sl = row[6] ? cleanNumber(row[6]) : null;
        const tp = row[7] ? cleanNumber(row[7]) : null;
        const closeTime = String(row[8] || '').trim();
        const closePrice = cleanNumber(row[9]);
        const commission = cleanNumber(row[10]);
        const swap = cleanNumber(row[11]);
        const profit = cleanNumber(row[12]);

        const openTs = parseDateToTimestamp(openTime);
        const closeTs = parseDateToTimestamp(closeTime);
        const symbol = cleanSymbol(rawSymbol);
        const { minutes: durationMinutes, formatted: durationFormatted } = formatDuration(openTs, closeTs);
        const pips = calculatePips(symbol, typeStr as 'buy' | 'sell', openPrice, closePrice);
        const netProfit = parseFloat((profit + commission + swap).toFixed(2));

        const isWin = netProfit > 0.001;
        const isLoss = netProfit < -0.001;
        const isBreakeven = !isWin && !isLoss;

        trades.push({
          id: ticket || `TKT-${r}`,
          openTime,
          openTimestamp: openTs,
          closeTime,
          closeTimestamp: closeTs,
          symbol,
          rawSymbol,
          type: typeStr as 'buy' | 'sell',
          volume: volume || 0.01,
          openPrice,
          closePrice,
          sl,
          tp,
          commission,
          swap,
          profit,
          netProfit,
          pips,
          durationMinutes,
          durationFormatted,
          tags: [],
          notes: '',
          isWin,
          isLoss,
          isBreakeven,
        });
      }
    }

    // 5. Fallback for generic MT4 Statement row if no explicit "Positions" block
    if (!inPositions && !inOrders && !inDeals) {
      // MT4 format: [0] Ticket, [1] Open Time, [2] Type, [3] Size/Lots, [4] Item/Symbol, [5] Price, [6] S/L, [7] T/P, [8] Close Time, [9] Price, [10] Commission, [11] Taxes, [12] Swap, [13] Profit
      const typeCell = String(row[2] || '').toLowerCase().trim();
      if (typeCell === 'buy' || typeCell === 'sell') {
        const ticket = String(row[0] || '').trim();
        const openTime = String(row[1] || '').trim();
        const volume = cleanNumber(row[3]);
        const rawSymbol = String(row[4] || '').trim();
        const openPrice = cleanNumber(row[5]);
        const sl = row[6] ? cleanNumber(row[6]) : null;
        const tp = row[7] ? cleanNumber(row[7]) : null;
        const closeTime = String(row[8] || '').trim();
        const closePrice = cleanNumber(row[9]);
        const commission = cleanNumber(row[10]);
        const swap = cleanNumber(row[12]);
        const profit = cleanNumber(row[13]);

        const openTs = parseDateToTimestamp(openTime);
        const closeTs = parseDateToTimestamp(closeTime);
        const symbol = cleanSymbol(rawSymbol);
        const { minutes: durationMinutes, formatted: durationFormatted } = formatDuration(openTs, closeTs);
        const pips = calculatePips(symbol, typeCell, openPrice, closePrice);
        const netProfit = parseFloat((profit + commission + swap).toFixed(2));

        trades.push({
          id: ticket || `MT4-${r}`,
          openTime,
          openTimestamp: openTs,
          closeTime,
          closeTimestamp: closeTs,
          symbol,
          rawSymbol,
          type: typeCell,
          volume: volume || 0.01,
          openPrice,
          closePrice,
          sl,
          tp,
          commission,
          swap,
          profit,
          netProfit,
          pips,
          durationMinutes,
          durationFormatted,
          tags: [],
          notes: '',
          isWin: netProfit > 0.001,
          isLoss: netProfit < -0.001,
          isBreakeven: Math.abs(netProfit) <= 0.001,
        });
      }
    }
  }

  // Sort trades chronologically by close time
  trades.sort((a, b) => a.closeTimestamp - b.closeTimestamp);

  // If balance was not found in footer, calculate from net profits + initial balance
  if (accountInfo.balance === 0 && trades.length > 0) {
    const totalPnl = trades.reduce((acc, t) => acc + t.netProfit, 0);
    accountInfo.balance = parseFloat(((initialBalanceFound || 100) + totalPnl).toFixed(2));
  }
  if (accountInfo.equity === 0 && accountInfo.balance !== 0) {
    accountInfo.equity = accountInfo.balance;
  }
  if (accountInfo.freeMargin === 0 && accountInfo.balance !== 0) {
    accountInfo.freeMargin = accountInfo.balance;
  }

  return {
    accountInfo,
    trades,
    rawRowCount: rows.length,
  };
}

/**
 * Parse MT4 / MT5 Detailed Statement HTML files
 */
export function parseHtmlStatement(htmlText: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const rows: (string | null)[][] = [];

  // Capture document title if it contains statement or account details
  const titleText = doc.title?.trim() || '';
  if (titleText) {
    rows.push([titleText]);
  }

  // Capture top header tags outside table if any (b, h1, h2, h3, div)
  const headerNodes = doc.querySelectorAll('b, h1, h2, h3, div');
  for (let i = 0; i < Math.min(headerNodes.length, 15); i++) {
    const text = headerNodes[i].textContent?.trim() || '';
    if (
      /statement\s*:/i.test(text) ||
      /name\s*:/i.test(text) ||
      /company\s*:/i.test(text) ||
      /broker\s*:/i.test(text)
    ) {
      rows.push([text]);
    }
  }

  const trElements = doc.querySelectorAll('tr');
  trElements.forEach(tr => {
    const rowCells: (string | null)[] = [];
    tr.querySelectorAll('th, td').forEach(cell => {
      rowCells.push(cell.textContent?.trim() || '');
    });
    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  });

  return parseMatrixData(rows);
}
