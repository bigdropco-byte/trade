import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Exact structure matching MT5 statement report
const rows = [
  ['Trade History Report', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Name:', 'Marcus Sterling', '', '', '', '', '', '', '', '', '', '', ''],
  ['Account:', '94827105 (USD, ApexPrime-Live1, real, Hedge)', '', '', '', '', '', '', '', '', '', '', ''],
  ['Company:', 'Apex Capital Markets Ltd', '', '', '', '', '', '', '', '', '', '', ''],
  ['Date:', '2026.09.09 11:03', '', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Positions', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Time', 'Position', 'Symbol', 'Type', 'Volume', 'Price', 'S / L', 'T / P', 'Time', 'Price', 'Commission', 'Swap', 'Profit'],
  ['2026.04.13 14:57:31', '51204918', 'XAUUSD@', 'buy', 0.01, '4 709.76', '', '', '2026.04.13 15:05:32', '4 712.77', 0.00, 0.00, 3.01],
  ['2026.04.13 15:15:31', '51213082', 'XAUUSD@', 'sell', 0.01, '4 716.50', '', '', '2026.04.13 15:20:33', '4 712.58', 0.00, 0.00, 3.92],
  ['2026.04.13 18:37:42', '51249714', 'XAUUSD@', 'sell', 0.01, '4 713.26', '', '', '2026.04.13 18:44:47', '4 712.47', 0.00, 0.00, 0.79],
  ['2026.04.13 18:58:32', '51258902', 'XAUUSD@', 'buy', 0.01, '4 713.23', '', '', '2026.04.13 19:06:55', '4 717.30', 0.00, 0.00, 4.07],
  ['2026.04.13 19:43:18', '51280361', 'XAUUSD@', 'sell', 0.01, '4 731.15', '', '', '2026.04.13 20:03:15', '4 737.86', 0.00, 0.00, -6.71],
  ['2026.04.13 20:08:01', '51294827', 'XAUUSD@', 'sell', 0.01, '4 726.74', '', '4 713.75', '2026.04.14 17:27:51', '4 809.57', 0.00, 0.00, -82.83],
  ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Orders', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Open Time', 'Order', 'Symbol', 'Type', 'Volume', 'Price', 'S / L', 'T / P', 'Time', 'State', 'Comment'],
  ['2026.04.13 14:57:30', '51204918', 'XAUUSD@', 'buy', '0.01 / 0.01', 'market', '', '', '2026.04.13 14:57:31', 'filled', ''],
  ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Deals', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Time', 'Deal', 'Symbol', 'Type', 'Direction', 'Volume', 'Price', 'Order', 'Commission', 'Fee', 'Swap', 'Profit', 'Balance', 'Comment'],
  ['2026.04.13 14:42:30', '49018235', '', 'balance', '', '', '', '', 0.00, 0.00, 0.00, 79.50, 79.50, 'initial deposit'],
  ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Balance:', 1.75, '', '', 'Free Margin:', 1.75],
  ['Credit Facility:', 0.00, '', '', 'Margin:', 0.00],
  ['Floating P/L:', 0.00, '', '', 'Margin Level:', '0.00%'],
  ['Equity:', 1.75],
];

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Report');

const outPath1 = path.resolve('public', 'sample_mt5_statement.xlsx');
const outPath2 = path.resolve('public', 'sample_windsor_mt5_report.xlsx');
XLSX.writeFile(wb, outPath1);
XLSX.writeFile(wb, outPath2);
console.log('Sample MT5 Excel statement created at:', outPath1, 'and', outPath2);
