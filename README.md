# Personal Cashbook — Master Engineering Implementation

A complete, production-grade **Personal Cashbook** web application engineered with strict financial correctness, mathematical double-entry reconciliation, and user-scoped data privacy.

Usable by ordinary people with no accounting knowledge, featuring a clean white-and-indigo visual design with full dark mode support, mobile responsive bottom navigation, and comprehensive automated test suites.

---

## 🛠 Technology Stack

- **Frontend**: Next.js 14 App Router, React 18, JavaScript (strictly **no** TypeScript).
- **Styling**: Tailwind CSS with custom accessible components, color palettes, and responsive design.
- **State Management**: Redux Toolkit & RTK Query (centralized cache, optimistic updates, automatic cache invalidation).
- **Backend**: Node.js & Express.js in JavaScript (modular Routes, Controllers, Services, and Models).
- **Database**: MongoDB with Mongoose (all 13 collections indexed and user-scoped).
- **Validation**: Zod across all API boundary endpoints (body, query, params).
- **Charts**: Recharts (interactive spending breakdown donut chart, monthly cash flow trend chart).
- **Exports**: PDF statements (via PDFKit) and RFC 4180 compliant CSV exports.
- **Automated Testing**: Vitest, React Testing Library, Supertest, and Playwright.

---

## 📐 Financial Correctness & Ledger Rules

1. **Integer Minor Units (Paise)**: All currency amounts are stored and calculated as integers in minor units (e.g., ₹150.75 is stored as `15075` paise). Safe-integer validations prevent any floating-point arithmetic drift.
2. **Authoritative Balance Reconciliation**:
   $$\text{Current Balance} = \text{Opening Balance} + \text{Eligible Income} - \text{Eligible Expenses} \pm \text{Transfers, Refunds, Reversals}$$
3. **Transfers Between Wallets**: Decreases the source wallet and increases the destination wallet by the exact same amount. Transfers are **never** counted as income or expenses in consolidated spending reports.
4. **Savings Goal Allocations**: Transfers to savings goals or savings wallets do not count as spending.
5. **Operating Net Cash Flow**:
   $$\text{Net Cash Flow} = \text{Total Income} + \text{Refunds} - \text{Total Expenses}$$
   Opening balances are strictly excluded from period operating cash flow.
6. **Debt & Repayments**: Lending and borrowing principal movements adjust wallet liquidity without double-counting as earned revenue or expense spending.
7. **Reversals Over Deletion**: Supports audited, reversible transactions with clear credit/debit directions to preserve financial audit trails.

---

## 🗄 MongoDB Collections & Models

All user-owned records include `userId`, with compound indexes for high-speed queries:

1. `users`: Profile, bcrypt hashed password, currency, timezone, language, theme.
2. `sessions`: Active login sessions, device types, last active timestamps, TTL index.
3. `wallets`: Cash, bank, savings, UPI tracker, custom wallets, opening & reconciled balances.
4. `categories`: Income and expense classification, icons, hex color palettes.
5. `transactions`: Income, expense, transfer, refund, reversal; receipts; tags; idempotency keys.
6. `budgets`: Overall & category spending limits with alert thresholds (80%, 100%).
7. `savingsGoals`: Long-term targets, saved amounts, progress percentages, target dates.
8. `debts`: Money lent and borrowed, debtor/creditor info, due dates.
9. `debtPayments`: Audited partial repayment installments reconciling wallet balances.
10. `recurringRules`: Automated scheduling for daily, weekly, monthly, and yearly cadences.
11. `notifications`: In-app alerts for budget overages, debt dues, recurring reminders, security.
12. `auditLogs`: Immutable audit trail of state changes, entity IDs, IPs, and user actions.
13. `exportJobs`: Audited asynchronous and streamed export requests.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v22)
- **MongoDB**: Running locally at `mongodb://127.0.0.1:27017` or via MongoDB Atlas URI

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Start Development Servers
In separate terminals (or concurrently):
```bash
# Terminal 1: Start Express API Backend (Port 5000)
npm run dev:backend

# Terminal 2: Start Next.js App Router Frontend (Port 3000)
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

```bash
# Run backend Vitest + Supertest integration tests (22 tests)
npm run test:backend

# Run frontend Vitest + React Testing Library unit tests (12 tests)
npm run test:frontend

# Run Playwright E2E tests
cd frontend && npx playwright test
```

---

## 🔐 Security & Privacy Principles

- **Manual UPI Tracking Only**: The application provides manual tracking for UPI wallets. It **never** asks for UPI PINs, banking passwords, or OTPs.
- **Strict Data Isolation**: Every database query is strictly filtered by the authenticated user's ID (`req.userId`).
- **Data Portability**: Full GDPR-compliant JSON data export of all user records.
- **Irreversible Account Deletion**: Cascading deletion across all 13 collections with confirmation phrase and password verification.
