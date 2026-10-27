'use client';
import React, { useState } from 'react';
import {
  useGetGoalsQuery,
  useDeleteGoalMutation
} from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney, formatDate } from '../../../utils/formatters.js';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import {
  SavingsGoalForm,
  ContributeGoalModalContent
} from '../../../components/forms/SavingsGoalForm.jsx';
import {
  Target,
  Plus,
  Coins,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2
} from 'lucide-react';

export default function SavingsGoalsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);

  const { data, isLoading, refetch } = useGetGoalsQuery();
  const [deleteGoal] = useDeleteGoalMutation();

  const goals = data?.data || [];

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await deleteGoal(id).unwrap();
      dispatch(showToast({ type: 'success', message: 'Savings goal deleted.' }));
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
            Savings Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track allocations toward long-term goals. Savings transfers do not count as spending.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingGoal(null);
            setIsAddOpen(true);
          }}
        >
          New Savings Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading savings goals...</div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals yet"
          description="Create goals like Emergency Fund, Vacation, or New Vehicle to track your savings progress."
          actionLabel="Create First Goal"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const isComplete = goal.currentAmountMinor >= goal.targetAmountMinor;

            return (
              <Card key={goal._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {goal.name}
                      </h3>
                      {goal.targetDate && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> Target: {formatDate(goal.targetDate)}
                        </p>
                      )}
                    </div>

                    <Badge variant={isComplete ? 'success' : 'indigo'} size="sm">
                      {isComplete ? 'Goal Reached!' : `${goal.percentage}%`}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, goal.percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatMoney(goal.currentAmountMinor, goal.currency || currency)}
                      </span>
                      <span className="text-slate-400">
                        Target: {formatMoney(goal.targetAmountMinor, goal.currency || currency)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Coins}
                      onClick={() => setContributingGoal(goal)}
                    >
                      Deposit Funds
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsAddOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id)}
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

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
        description="Set your savings target and timeline"
      >
        <SavingsGoalForm
          goal={editingGoal}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditingGoal(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddOpen(false);
            setEditingGoal(null);
          }}
        />
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={!!contributingGoal}
        onClose={() => setContributingGoal(null)}
        title="Deposit Toward Savings Goal"
        description="Allocate funds from an active wallet to your savings goal"
      >
        {contributingGoal && (
          <ContributeGoalModalContent
            goal={contributingGoal}
            onSuccess={() => {
              setContributingGoal(null);
              refetch();
            }}
            onCancel={() => setContributingGoal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
