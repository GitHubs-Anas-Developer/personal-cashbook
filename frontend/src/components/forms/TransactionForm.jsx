'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor, toDecimal } from '../../utils/formatters.js';
import {
  useGetWalletsQuery,
  useGetCategoriesQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useUploadReceiptMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';
import { Paperclip, Check } from 'lucide-react';

export function TransactionForm({
  initialType = 'expense',
  transaction = null,
  onSuccess,
  onCancel
}) {
  const dispatch = useDispatch();
  const isEditing = !!transaction;

  const { data: walletsData } = useGetWalletsQuery(false);
  const { data: categoriesData } = useGetCategoriesQuery(initialType);
  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();
  const [uploadReceipt, { isLoading: isUploading }] = useUploadReceiptMutation();

  const wallets = walletsData?.data || [];
  const categories = categoriesData?.data || [];

  const [type, setType] = useState(transaction?.type || initialType);
  const [amount, setAmount] = useState(
    transaction ? toDecimal(transaction.amountMinor, transaction.currency) : ''
  );
  const [walletId, setWalletId] = useState(
    transaction?.walletId?._id || transaction?.walletId || (wallets[0]?._id ?? '')
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId?._id || transaction?.categoryId || (categories[0]?._id ?? '')
  );
  const [date, setDate] = useState(
    transaction?.date
      ? new Date(transaction.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(transaction?.description || '');
  const [tags, setTags] = useState(transaction?.tags?.join(', ') || '');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [receipt, setReceipt] = useState(transaction?.receipt || null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      dispatch(showToast({ type: 'error', message: 'Receipt file must be under 5MB.' }));
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await uploadReceipt(formData).unwrap();
      setReceipt(res.data);
      dispatch(showToast({ type: 'success', message: 'Receipt attached successfully.' }));
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Upload failed.' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountMinor = toMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Please enter a valid positive amount.' }));
      return;
    }

    if (!walletId) {
      dispatch(showToast({ type: 'error', message: 'Please select an active wallet.' }));
      return;
    }

    if (!categoryId) {
      dispatch(showToast({ type: 'error', message: 'Please select a category.' }));
      return;
    }

    const tagList = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      type,
      amountMinor,
      walletId,
      categoryId,
      date,
      description,
      tags: tagList,
      notes,
      receipt
    };

    try {
      if (isEditing) {
        await updateTransaction({ id: transaction._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Transaction updated successfully.' }));
      } else {
        await createTransaction(payload).unwrap();
        dispatch(showToast({ type: 'success', message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully.` }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Transaction could not be saved.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle (Income / Expense) */}
      {!isEditing && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>
      )}

      {/* Amount and Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix="₹"
        />
        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Wallet and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Wallet"
          required
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
        >
          <option value="">Select Wallet</option>
          {wallets.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name} ({w.type})
            </option>
          ))}
        </Select>

        <Select
          label="Category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories
            .filter((c) => c.type === type)
            .map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
        </Select>
      </div>

      {/* Description */}
      <Input
        label="Description"
        required
        placeholder="e.g. Weekly grocery shopping"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Tags */}
      <Input
        label="Tags (comma separated)"
        placeholder="groceries, supermarket, weekend"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* Optional Receipt Attachment */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Receipt Attachment (Optional)
        </label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Paperclip className="w-3.5 h-3.5" />
            {isUploading ? 'Uploading...' : 'Choose file (JPEG, PNG, PDF)'}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {receipt && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate max-w-xs">
              <Check className="w-3.5 h-3.5" />
              {receipt.originalName}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isCreating || isUpdating}
        >
          {isEditing ? 'Save Changes' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
        </Button>
      </div>
    </form>
  );
}
