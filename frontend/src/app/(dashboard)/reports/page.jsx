'use client';
import React, { useState } from 'react';
import { useGetReportSummaryQuery } from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney, formatDate } from '../../../utils/formatters.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { SpendingByCategoryChart } from '../../../components/charts/SpendingByCategoryChart.jsx';
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet
} from 'lucide-react';

export default function ReportsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const currency = user?.preferences?.currency || 'INR';

  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useGetReportSummaryQuery({
    period,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  });

  const summary = data?.data || {
    totalIncomeMinor: 0,
    totalExpenseMinor: 0,
    totalRefundMinor: 0,
    netCashFlowMinor: 0,
    totalWalletBalanceMinor: 0,
    categoryBreakdown: []
  };

  const handleDownload = async (format) => {
    try {
      dispatch(showToast({ type: 'info', message: `Generating ${format.toUpperCase()} export...` }));

      const query = new URLSearchParams({
        format,
        type: 'transactions',
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`http://localhost:5000/api/export/download?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-cashbook-statement.${format === 'csv' ? 'csv' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      dispatch(showToast({ type: 'success', message: `${format.toUpperCase()} downloaded successfully!` }));
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err.message || 'Download error' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Financial Reports &amp; Exports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Consolidated statements, category spending breakdowns, and PDF/CSV downloads
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => handleDownload('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={FileText}
            onClick={() => handleDownload('pdf')}
          >
            Download PDF Statement
          </Button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs">
            {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-md capitalize font-medium transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Income</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-2">
              +{formatMoney(summary.totalIncomeMinor, currency)}
            </div>
            <span className="text-[10px] text-slate-400">In selected period</span>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Expenses</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-rose-600 mt-2">
              -{formatMoney(summary.totalExpenseMinor, currency)}
            </div>
            <span className="text-[10px] text-slate-400">Excludes transfers</span>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Net Cash Flow</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl font-bold mt-2 ${
                summary.netCashFlowMinor >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {summary.netCashFlowMinor >= 0 ? '+' : ''}
              {formatMoney(summary.netCashFlowMinor, currency)}
            </div>
            <span className="text-[10px] text-slate-400">Operating Net</span>
          </CardContent>
        </Card>

        {/* Current Liquidity */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Wallet Balances</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {formatMoney(summary.totalWalletBalanceMinor, currency)}
            </div>
            <span className="text-[10px] text-slate-400">Total reconciled liquid assets</span>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Analysis Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingByCategoryChart
              data={summary.categoryBreakdown}
              currency={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Category Ledger</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.categoryBreakdown?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No expense records in this reporting period.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-center">Entries</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {summary.categoryBreakdown.map((cat) => (
                      <tr key={cat.categoryId || cat.categoryName} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {cat.categoryName}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-500">
                          {cat.txCount}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatMoney(cat.amountMinor, currency)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {cat.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
