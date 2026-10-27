'use client';
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatMoney } from '../../utils/formatters.js';

export function SpendingByCategoryChart({ data = [], currency = 'INR' }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No expense data in this period.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.amountMinor,
    color: item.color || '#6366F1',
    percentage: item.percentage
  }));

  const totalExpenseMinor = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-md text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
          <div className="mt-1 text-slate-600 dark:text-slate-400">
            {formatMoney(d.value, currency)} ({d.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="w-full sm:w-1/2 h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-medium">TOTAL SPENT</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {formatMoney(totalExpenseMinor, currency)}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full sm:w-1/2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {chartData.slice(0, 6).map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatMoney(item.value, currency)}
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
