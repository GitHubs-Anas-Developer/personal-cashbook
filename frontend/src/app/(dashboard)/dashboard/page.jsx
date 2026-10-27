'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  useGetDashboardOverviewQuery
} from '../../../store/services/api.js';
import { useSelector } from 'react-redux';
import { formatMoney, formatDate, getTransactionTypeColor } from '../../../utils/formatters.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { TransactionForm } from '../../../components/forms/TransactionForm.jsx';
import { TransferForm } from '../../../components/forms/TransferForm.jsx';
import { SpendingByCategoryChart } from '../../../components/charts/SpendingByCategoryChart.jsx';
import { CashFlowChart } from '../../../components/charts/CashFlowChart.jsx';
import { CardSkeleton } from '../../../components/ui/Skeleton.jsx';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  ArrowRightLeft,
  ArrowUpRight,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  const [period, setPeriod] = useState('monthly');
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const { data, isLoading, refetch } = useGetDashboardOverviewQuery(period);

  const summary = data?.data?.summary || {
    totalIncomeMinor: 0,
    totalExpenseMinor: 0,
    netCashFlowMinor: 0,
    totalWalletBalanceMinor: 0,
    categoryBreakdown: []
  };

  const cashFlowHistory = data?.data?.cashFlowHistory || [];
  const recentTransactions = data?.data?.recentTransactions || [];
  const budgets = data?.data?.budgets || [];
  const upcomingPayments = data?.data?.upcomingPayments || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your personal cashbook financial overview &amp; ledger summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md capitalize font-medium transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRightLeft}
            onClick={() => setIsTransferOpen(true)}
          >
            Transfer
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddTxOpen(true)}
          >
            Add Record
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Wallet Balance */}
          <Card className="hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Wallet Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatMoney(summary.totalWalletBalanceMinor, currency)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Across all active wallets
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Period Income */}
          <Card className="hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                  {period} Income
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(summary.totalIncomeMinor, currency)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Earned during selected period
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Period Expenses */}
          <Card className="hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                  {period} Expenses
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
                  -{formatMoney(summary.totalExpenseMinor, currency)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Excludes transfers &amp; savings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Net Cash Flow */}
          <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                  Net Cash Flow
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div
                  className={`text-xl sm:text-2xl font-bold ${
                    summary.netCashFlowMinor >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {summary.netCashFlowMinor >= 0 ? '+' : ''}
                  {formatMoney(summary.netCashFlowMinor, currency)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Income minus expenses
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <Badge variant="indigo" size="sm">
              {period}
            </Badge>
          </CardHeader>
          <CardContent>
            <SpendingByCategoryChart
              data={summary.categoryBreakdown}
              currency={currency}
            />
          </CardContent>
        </Card>

        {/* Monthly Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow Trend</CardTitle>
            <span className="text-xs text-slate-400">Last 6 Months</span>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={cashFlowHistory} currency={currency} />
          </CardContent>
        </Card>
      </div>

      {/* Split Grid: Recent Transactions vs Planning (Budgets & Upcoming) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <Link
                href="/transactions"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View all ledger <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No transactions recorded yet. Click &quot;Add Record&quot; to begin.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.type === 'income' || tx.type === 'refund';
                    const isExpense = tx.type === 'expense';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <div
                        key={tx._id}
                        className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-semibold ${getTransactionTypeColor(
                              tx.type
                            )}`}
                          >
                            {isIncome ? '↓' : isExpense ? '↑' : '⇄'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {tx.description}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {tx.categoryId?.name || (isTransfer ? 'Transfer' : 'General')} •{' '}
                              {tx.walletId?.name || 'Wallet'}{' '}
                              {tx.destinationWalletId ? `→ ${tx.destinationWalletId.name}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <div
                            className={`text-xs font-bold ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isExpense
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {isIncome ? '+' : isExpense ? '-' : ''}
                            {formatMoney(tx.amountMinor, tx.currency || currency)}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(tx.date, 'short')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Planning Sidebar: Budgets & Upcoming (1 col) */}
        <div className="space-y-6">
          {/* Budget Health */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Limits</CardTitle>
              <Link
                href="/budgets"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage
              </Link>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {budgets.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  No active budgets. Create budgets to track spending limits.
                </p>
              ) : (
                budgets.map((b) => (
                  <div key={b._id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {b.name}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {b.percentage}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          b.percentage >= 100
                            ? 'bg-rose-500'
                            : b.percentage >= b.alertThresholdPercent
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Spent: {formatMoney(b.spentMinor, currency)}</span>
                      <span>Limit: {formatMoney(b.amountMinor, currency)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Recurring / Debt Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <Clock className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0">
              {upcomingPayments.length === 0 ? (
                <div className="p-4 text-xs text-slate-400">
                  No scheduled payments due soon.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingPayments.map((item) => (
                    <div key={item._id} className="px-5 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Due: {formatDate(item.nextRunDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatMoney(item.amountMinor, item.currency || currency)}
                        </span>
                        <Badge variant="indigo" size="sm" className="ml-2">
                          {item.frequency}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        title="Record Transaction"
        description="Add a new income or expense entry to your personal cashbook"
      >
        <TransactionForm
          onSuccess={() => {
            setIsAddTxOpen(false);
            refetch();
          }}
          onCancel={() => setIsAddTxOpen(false)}
        />
      </Modal>

      {/* Transfer Funds Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Funds"
        description="Transfer money between your own wallets without affecting spending reports"
      >
        <TransferForm
          onSuccess={() => {
            setIsTransferOpen(false);
            refetch();
          }}
          onCancel={() => setIsTransferOpen(false)}
        />
      </Modal>
    </div>
  );
}
