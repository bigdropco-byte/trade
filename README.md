# TradeScrapbook

> The #1 Free, 100% Private MT5 & MT4 Trading Journal & Performance Scrapbook.

[![Deploy to GitHub Pages](https://github.com/bigdropco-byte/trade/actions/workflows/deploy.yml/badge.svg)](https://github.com/bigdropco-byte/trade/actions/workflows/deploy.yml)
[![Live Domain](https://img.shields.io/badge/Domain-tradescrapbook.com-10B981?style=flat&logo=google-chrome&logoColor=white)](https://tradescrapbook.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Active-2563EB?style=flat&logo=github)](https://bigdropco-byte.github.io/trade/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

**TradeScrapbook** (`tradescrapbook.com`) is an institutional-grade, zero-knowledge trading journal designed for MetaTrader 5 and MetaTrader 4 traders. Instead of paying $30 to $50 per month to third-party cloud platforms that store your private broker account credentials, lot sizes, and balances on remote databases, TradeScrapbook parses and analyzes everything **100% locally inside your browser memory**.

---

## 🚀 Key Features

- 🔒 **100% Client-Side Privacy Guarantee**:
  - All Excel statements (`.xlsx`, `.xls`, `.htm`, `.csv`) are parsed strictly inside your browser sandbox using SheetJS and Web APIs.
  - Zero bytes of trading data are ever sent to, cached by, or stored on external servers.
  - 1-click **Privacy Masking Mode** obfuscates account numbers and names for live streaming and screenshots.

- 📅 **Interactive Performance Calendar**:
  - Monthly day-by-day P&L heatmap with color-coded winning (green) and losing (red) badges.
  - Drill down into any date to view individual trade tickets, volume, pips, hold duration, and tags.

- 📈 **Equity & Drawdown Analytics**:
  - High-resolution cumulative balance curves and high-watermark tracking.
  - Statistical expectancy ($/trade), profit factor, Sharpe and Sortino ratios.
  - Instrument breakdown (Forex, Gold/XAUUSD, Indices, Crypto).

- 🧠 **TradeScrapbook AI Psychology Coach**:
  - Algorithmic scanning for revenge trading re-entries (rapid entries within 15 minutes of a loss).
  - Disposition effect tracking (holding losing trades longer than winners).
  - Automated 0–100 Discipline Score.

- 🏆 **Prop Firm Challenge Monitor**:
  - Evaluation tracker simulating FTMO, FundedNext, and The5ers rules.
  - Live calculations of 5% Maximum Daily Loss buffer, 10% Maximum Overall Drawdown buffer, and Phase 1/Phase 2 profit targets.

- 📑 **Institutional PDF Reports**:
  - Export comprehensive multi-section statements with custom selectors (Executive Overview, Calendar, Execution Journal, Deep Analytics, AI Psychology, Prop Firm).
  - Clean page breaks, running headers, and account masking.

- 📸 **Retina Social Share Cards**:
  - Generate customized 2x retina PNG screenshot cards for Twitter, Discord, and Telegram.
  - Built-in theme selector (Emerald Pro, Royal Indigo, Midnight Dark, Clean Paper).

---

## 🛠️ Local Development

```bash
# 1. Clone repository
git clone https://github.com/bigdropco-byte/trade.git
cd trade

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build for production
npm run build
```

---

## 🌐 Deployment to GitHub Pages

This repository is configured with an automated GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. **Automatic Deployment**:
   - Every push to the `main` branch automatically triggers the build and deploys the production bundle to GitHub Pages.
2. **Custom Domain**:
   - The custom domain `tradescrapbook.com` is configured via `public/CNAME`.
3. **Repository Settings**:
   - On GitHub: **Settings** -> **Pages** -> **Source** -> Select **GitHub Actions**.

---

## 📄 License

MIT License. Open source and free forever.
