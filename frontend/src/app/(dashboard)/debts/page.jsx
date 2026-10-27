'use client';
import React, { useState } from 'react';
import {
  useGetDebtsQuery,
  useDeleteDebtMutation
} from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney, formatDate } from '../../../utils/formatters.js';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { DebtForm, RepaymentModalContent } from '../../../components/forms/DebtForm.jsx';
import {
  HandCoins,
  Plus,
  Coins,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function DebtsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  const [tab, setTab] = useState('lent'); // 'lent' or 'borrowed'
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [repayingDebt, setRepayingDebt] = useState(null);

  const { data, isLoading, refetch } = useGetDebtsQuery();
  const [deleteDebt] = useDeleteDebtMutation();

  const allDebts = data?.data || [];
  const debts = allDebts.filter((d) => d.type === tab);

  const totalOutstandingMinor = debts
    .filter((d) => d.status === 'active')
    .reduce((acc, d) => acc + (d.remainingAmountMinor || 0), 0);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this debt record?')) return;
    try {
      await deleteDebt(id).unwrap();
      dispatch(showToast({ type: 'success', message: 'Debt record removed.' }));
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
            Debt &amp; Repayment Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage money lent and borrowed with partial repayments. Excluded from double-counted income/expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab selector */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setTab('lent')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'lent'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Money Lent (Receivable)
            </button>
            <button
              onClick={() => setTab('borrowed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'borrowed'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Money Borrowed (Payable)
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingDebt(null);
              setIsAddOpen(true);
            }}
          >
            Record {tab === 'lent' ? 'Lending' : 'Borrowing'}
          </Button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <Card className="bg-slate-900 text-white border-0 shadow-md">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total {tab === 'lent' ? 'You Are Owed (Receivable)' : 'You Owe (Payable)'}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {formatMoney(totalOutstandingMinor, currency)}
            </div>
          </div>
          <div className="text-xs text-slate-400 max-w-sm">
            {tab === 'lent'
              ? 'When friends repay you, the funds are deposited into your wallet without double-counting as new earned income.'
              : 'When you pay back loans, the payment reduces your liability without treating the principal as operational spending.'}
          </div>
        </CardContent>
      </Card>

      {/* Debt Cards Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading debts...</div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={`No ${tab === 'lent' ? 'money lent' : 'borrowed loans'} recorded`}
          description={
            tab === 'lent'
              ? 'Track money you lend to friends, family, or colleagues with scheduled repayments.'
              : 'Track personal loans, borrowed funds, or obligations.'
          }
          actionLabel={`Record ${tab === 'lent' ? 'Lent Money' : 'Borrowed Money'}`}
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {debts.map((debt) => {
            const isSettled = debt.status === 'settled';
            const repaidPercent = Math.round(
              ((debt.initialAmountMinor - debt.remainingAmountMinor) / debt.initialAmountMinor) * 100
            );

            return (
              <Card key={debt._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {debt.personName}
                      </h3>
                      {debt.personContact && (
                        <p className="text-[11px] text-slate-400">{debt.personContact}</p>
                      )}
                      {debt.dueDate && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> Due: {formatDate(debt.dueDate)}
                        </p>
                      )}
                    </div>

                    <Badge variant={isSettled ? 'success' : 'indigo'} size="sm">
                      {isSettled ? 'Settled' : 'Active'}
                    </Badge>
                  </div>

                  {/* Balance details */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Remaining Balance</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {formatMoney(debt.remainingAmountMinor, debt.currency || currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Original Principal</span>
                      <span>{formatMoney(debt.initialAmountMinor, debt.currency || currency)}</span>
                    </div>
                  </div>

                  {/* Repaid Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Repaid</span>
                      <span>{repaidPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 bg-indigo-600 rounded-full"
                        style={{ width: `${repaidPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    {!isSettled ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Coins}
                        onClick={() => setRepayingDebt(debt)}
                      >
                        Record Repayment
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Fully Settled
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDebt(debt);
                          setIsAddOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt._id)}
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

      {/* Add / Edit Debt Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingDebt(null);
        }}
        title={editingDebt ? 'Edit Debt Record' : `Record ${tab === 'lent' ? 'Lent Money' : 'Borrowed Money'}`}
        description="Fill out the liability / loan details"
      >
        <DebtForm
          debt={editingDebt}
          defaultType={tab}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditingDebt(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddOpen(false);
            setEditingDebt(null);
          }}
        />
      </Modal>

      {/* Record Repayment Modal */}
      <Modal
        isOpen={!!repayingDebt}
        onClose={() => setRepayingDebt(null)}
        title="Record Debt Repayment"
        description="Records an audited partial repayment installment and reconciles wallet balance"
      >
        {repayingDebt && (
          <RepaymentModalContent
            debt={repayingDebt}
            onSuccess={() => {
              setRepayingDebt(null);
              refetch();
            }}
            onCancel={() => setRepayingDebt(null)}
          />
        )}
      </Modal>
    </div>
  );
}
