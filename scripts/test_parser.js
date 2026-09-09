import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { parseMatrixData } from '../src/utils/parser.ts';

const filePath = path.resolve('public', 'sample_windsor_mt5_report.xlsx');
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

const result = parseMatrixData(rows);

console.log('--- PARSER VERIFICATION RESULTS ---');
console.log('Account Name:', result.accountInfo.name);
console.log('Account Number:', result.accountInfo.account);
console.log('Broker:', result.accountInfo.broker);
console.log('Currency:', result.accountInfo.currency);
console.log('Balance:', result.accountInfo.balance);
console.log('Trades parsed count:', result.trades.length);
console.log('\nTrades details:');
result.trades.forEach((t, i) => {
  console.log(`[${i+1}] Ticket: ${t.id} | ${t.type.toUpperCase()} ${t.volume}L ${t.symbol} | Entry: ${t.openPrice} Exit: ${t.closePrice} | Profit: $${t.netProfit} | Duration: ${t.durationFormatted}`);
});

if (result.trades.length === 6 && result.accountInfo.account === '94827105') {
  console.log('\n✅ VERIFICATION PASSED: Perfect MT5 statement extraction!');
} else {
  console.error('\n❌ VERIFICATION FAILED: Unexpected parser result');
  process.exit(1);
}
