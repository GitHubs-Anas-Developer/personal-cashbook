'use client';
import React, { useState } from 'react';
import {
  useGetTransactionsQuery,
  useGetWalletsQuery,
  useGetCategoriesQuery,
  useDeleteTransactionMutation,
  useReverseTransactionMutation
} from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney, formatDate, getTransactionTypeColor } from '../../../utils/formatters.js';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { TransactionForm } from '../../../components/forms/TransactionForm.jsx';
import { TransferForm } from '../../../components/forms/TransferForm.jsx';
import {
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  RotateCcw,
  Trash2,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit2
} from 'lucide-react';

export default function TransactionsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [reversingTx, setReversingTx] = useState(null);
  const [reversalReason, setReversalReason] = useState('Incorrect entry');
  const [deletingTx, setDeletingTx] = useState(null);

  const { data: walletsData } = useGetWalletsQuery(false);
  const { data: categoriesData } = useGetCategoriesQuery();
  const wallets = walletsData?.data || [];
  const categories = categoriesData?.data || [];

  const { data, isLoading, refetch } = useGetTransactionsQuery({
    page,
    limit: 15,
    search: search || undefined,
    type: type !== 'all' ? type : undefined,
    walletId: walletId || undefined,
    categoryId: categoryId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation();
  const [reverseTransaction, { isLoading: isReversing }] = useReverseTransactionMutation();

  const transactions = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const handleConfirmReverse = async () => {
    if (!reversingTx) return;
    try {
      await reverseTransaction({ id: reversingTx._id, reason: reversalReason }).unwrap();
      dispatch(showToast({ type: 'success', message: 'Transaction reversed and audited.' }));
      setReversingTx(null);
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Reversal failed.' }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      await deleteTransaction(deletingTx._id).unwrap();
      dispatch(showToast({ type: 'success', message: 'Transaction deleted.' }));
      setDeletingTx(null);
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Deletion failed.' }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, edit, and audit financial records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRightLeft}
            onClick={() => setIsTransferOpen(true)}
          >
            Transfer Funds
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingTx(null);
              setIsAddTxOpen(true);
            }}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search description, tags, notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                prefix={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Type Filter */}
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
              <option value="refund">Refunds Only</option>
              <option value="reversal">Reversals Only</option>
            </Select>

            {/* Wallet Filter */}
            <Select
              value={walletId}
              onChange={(e) => {
                setWalletId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Wallets</option>
              {wallets.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </Select>

            {/* Category Filter */}
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </Select>
          </div>

          {/* Date range filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
            {(startDate || endDate || search || type !== 'all' || walletId || categoryId) && (
              <button
                onClick={() => {
                  setSearch('');
                  setType('all');
                  setWalletId('');
                  setCategoryId('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading ledger records...</div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No transactions found"
              description="No entries match your selected criteria. Try adjusting filters or record a new transaction."
              actionLabel="Add Transaction"
              onAction={() => setIsAddTxOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'income' || tx.type === 'refund';
                    const isExpense = tx.type === 'expense';
                    const isTransfer = tx.type === 'transfer';
                    const isReversal = tx.type === 'reversal';

                    return (
                      <tr
                        key={tx._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getTransactionTypeColor(
                              tx.type
                            )}`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                            {tx.description}
                          </p>
                          {tx.notes && (
                            <p className="text-[10px] text-slate-400 max-w-xs truncate">{tx.notes}</p>
                          )}
                          {tx.tags?.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {tx.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {tx.categoryId?.name || (isTransfer ? 'Transfer' : '-')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {tx.walletId?.name || 'Wallet'}
                          {tx.destinationWalletId && (
                            <span className="text-slate-400"> → {tx.destinationWalletId.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isExpense
                                ? 'text-rose-600 dark:text-rose-400'
                                : isTransfer
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {isIncome ? '+' : isExpense ? '-' : ''}
                            {formatMoney(tx.amountMinor, tx.currency || currency)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {tx.receipt ? (
                            <a
                              href={tx.receipt.url}
                              target="_blank"
                              rel="noreferrer"
                              title="View receipt"
                              className="inline-flex items-center text-indigo-600 hover:underline"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => {
                              setEditingTx(tx);
                              setIsAddTxOpen(true);
                            }}
                            title="Edit Transaction"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setReversingTx(tx)}
                            title="Reverse Transaction (Audited)"
                            className="p-1 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTx(tx)}
                            title="Delete Transaction"
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setEditingTx(null);
        }}
        title={editingTx ? 'Edit Transaction' : 'Record Transaction'}
        description="Fill out the financial entry details below"
      >
        <TransactionForm
          transaction={editingTx}
          onSuccess={() => {
            setIsAddTxOpen(false);
            setEditingTx(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddTxOpen(false);
            setEditingTx(null);
          }}
        />
      </Modal>

      {/* Transfer Funds Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Funds"
        description="Transfer money between your own wallets"
      >
        <TransferForm
          onSuccess={() => {
            setIsTransferOpen(false);
            refetch();
          }}
          onCancel={() => setIsTransferOpen(false)}
        />
      </Modal>

      {/* Reversal Confirmation Modal */}
      <Modal
        isOpen={!!reversingTx}
        onClose={() => setReversingTx(null)}
        title="Reverse Transaction"
        description="Reversible financial correction: Creates an audited reversing entry and restores wallet balance without silent deletion."
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {reversingTx?.description}
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Amount: {formatMoney(reversingTx?.amountMinor, currency)}
            </p>
          </div>

          <Input
            label="Reason for Reversal"
            required
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setReversingTx(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isReversing}
              onClick={handleConfirmReverse}
            >
              Confirm Reversal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? Wallet balances will be recalculated."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Deleting &quot;<strong>{deletingTx?.description}</strong>&quot; for{' '}
            <strong>{formatMoney(deletingTx?.amountMinor, currency)}</strong>.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setDeletingTx(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
