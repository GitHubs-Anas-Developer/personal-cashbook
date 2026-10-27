'use client';
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { formatMoney, toDecimal } from '../../utils/formatters.js';

export function CashFlowChart({ data = [], currency = 'INR' }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No cash flow history available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.monthName,
    income: parseFloat(toDecimal(d.incomeMinor, currency)),
    expense: parseFloat(toDecimal(d.expenseMinor, currency)),
    incomeMinor: d.incomeMinor,
    expenseMinor: d.expenseMinor,
    netMinor: d.netCashFlowMinor
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-md text-xs space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-100">{label}</div>
          <div className="text-emerald-600 dark:text-emerald-400">
            Income: {formatMoney(p.incomeMinor, currency)}
          </div>
          <div className="text-rose-600 dark:text-rose-400">
            Expense: {formatMoney(p.expenseMinor, currency)}
          </div>
          <div className="font-medium text-indigo-600 dark:text-indigo-400 border-t border-slate-100 dark:border-slate-800 pt-1">
            Net: {formatMoney(p.netMinor, currency)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
          />
          <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
