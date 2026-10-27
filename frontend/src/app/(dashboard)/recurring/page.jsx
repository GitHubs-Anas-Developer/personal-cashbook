'use client';
import React, { useState } from 'react';
import {
  useGetRecurringRulesQuery,
  useProcessRecurringRuleMutation,
  useDeleteRecurringRuleMutation
} from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney, formatDate, getTransactionTypeColor } from '../../../utils/formatters.js';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { RecurringForm } from '../../../components/forms/RecurringForm.jsx';
import {
  CalendarClock,
  Plus,
  Play,
  Trash2,
  Edit2,
  Clock,
  Repeat
} from 'lucide-react';

export default function RecurringPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data, isLoading, refetch } = useGetRecurringRulesQuery();
  const [processRule, { isLoading: isProcessing }] = useProcessRecurringRuleMutation();
  const [deleteRule] = useDeleteRecurringRuleMutation();

  const rules = data?.data || [];

  const handleProcessNow = async (id, title) => {
    try {
      await processRule(id).unwrap();
      dispatch(
        showToast({
          type: 'success',
          message: `Processed: "${title}" recorded in ledger!`
        })
      );
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Processing failed.' }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this recurring rule?')) return;
    try {
      await deleteRule(id).unwrap();
      dispatch(showToast({ type: 'success', message: 'Recurring rule deleted.' }));
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
            Recurring Transactions &amp; Subscriptions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schedule recurring income (salary, dividends) and recurring expenses (rent, bills, subscriptions)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingRule(null);
            setIsAddOpen(true);
          }}
        >
          Add Recurring Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading recurring rules...</div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No recurring rules scheduled"
          description="Automate monthly house rent, utility bills, gym memberships, or your monthly salary."
          actionLabel="Create Recurring Rule"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => {
            const isDue = new Date(rule.nextRunDate) <= new Date();

            return (
              <Card key={rule._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {rule.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {rule.categoryId?.name || (rule.type === 'transfer' ? 'Transfer' : 'General')} •{' '}
                        {rule.walletId?.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getTransactionTypeColor(
                          rule.type
                        )}`}
                      >
                        {rule.type}
                      </span>
                      <Badge variant="indigo" size="sm">
                        {rule.frequency}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Scheduled Amount</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      {formatMoney(rule.amountMinor, rule.currency || currency)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Next Due:</span>
                      <strong className={isDue ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                        {formatDate(rule.nextRunDate)}
                      </strong>
                    </div>
                    {isDue && (
                      <Badge variant="warning" size="sm">
                        Due Now
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant={isDue ? 'primary' : 'outline'}
                      size="sm"
                      icon={Play}
                      disabled={isProcessing}
                      onClick={() => handleProcessNow(rule._id, rule.title)}
                    >
                      Post Entry Now
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsAddOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Recurring Rule Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingRule(null);
        }}
        title={editingRule ? 'Edit Recurring Rule' : 'Schedule Recurring Rule'}
        description="Set recurring cadence, amounts, and destination wallets"
      >
        <RecurringForm
          rule={editingRule}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditingRule(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddOpen(false);
            setEditingRule(null);
          }}
        />
      </Modal>
    </div>
  );
}
