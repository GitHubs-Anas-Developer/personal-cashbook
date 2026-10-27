'use client';
import React, { useState } from 'react';
import {
  useGetBudgetsQuery,
  useDeleteBudgetMutation
} from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney } from '../../../utils/formatters.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { BudgetForm } from '../../../components/forms/BudgetForm.jsx';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Bell
} from 'lucide-react';

export default function BudgetsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const { data, isLoading, refetch } = useGetBudgetsQuery();
  const [deleteBudget] = useDeleteBudgetMutation();

  const budgets = data?.data || [];

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this budget?')) return;
    try {
      await deleteBudget(id).unwrap();
      dispatch(showToast({ type: 'success', message: 'Budget removed.' }));
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to delete.' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Budgets &amp; Spending Limits
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set spending targets and get proactive alerts. Strictly excludes transfers &amp; savings.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingBudget(null);
            setIsAddOpen(true);
          }}
        >
          Create Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No budgets configured"
          description="Create spending limits for groceries, rent, dining, or overall monthly expenses."
          actionLabel="Create First Budget"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const isExceeded = b.percentage >= 100;
            const isWarning = b.percentage >= b.alertThresholdPercent && !isExceeded;

            return (
              <Card
                key={b._id}
                className={`hover:shadow-md transition-shadow border-l-4 ${
                  isExceeded
                    ? 'border-l-rose-500'
                    : isWarning
                    ? 'border-l-amber-500'
                    : 'border-l-indigo-600'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {b.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {b.period} • {b.categoryId ? b.categoryId.name : 'Overall Spending'}
                      </span>
                    </div>

                    <Badge
                      variant={isExceeded ? 'danger' : isWarning ? 'warning' : 'indigo'}
                      size="sm"
                    >
                      {b.percentage}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isExceeded
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatMoney(b.spentMinor, b.currency || currency)}
                      </span>
                      <span className="text-slate-400">
                        Limit: {formatMoney(b.amountMinor, b.currency || currency)}
                      </span>
                    </div>
                  </div>

                  {/* Remaining status */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">
                      {isExceeded ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Over by {formatMoney(Math.abs(b.remainingMinor), b.currency || currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {formatMoney(b.remainingMinor, b.currency || currency)} remaining
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Bell className="w-3 h-3 text-slate-400" />
                      Alert at {b.alertThresholdPercent}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setIsAddOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
        description="Configure budget target and notification thresholds"
      >
        <BudgetForm
          budget={editingBudget}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditingBudget(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddOpen(false);
            setEditingBudget(null);
          }}
        />
      </Modal>
    </div>
  );
}
