'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor, toDecimal } from '../../utils/formatters.js';
import {
  useGetWalletsQuery,
  useGetCategoriesQuery,
  useCreateRecurringRuleMutation,
  useUpdateRecurringRuleMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';

export function RecurringForm({ rule = null, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEditing = !!rule;

  const { data: walletsData } = useGetWalletsQuery(false);
  const { data: categoriesData } = useGetCategoriesQuery();
  const [createRule, { isLoading: isCreating }] = useCreateRecurringRuleMutation();
  const [updateRule, { isLoading: isUpdating }] = useUpdateRecurringRuleMutation();

  const wallets = walletsData?.data || [];
  const categories = categoriesData?.data || [];

  const [title, setTitle] = useState(rule?.title || '');
  const [type, setType] = useState(rule?.type || 'expense');
  const [amount, setAmount] = useState(
    rule ? toDecimal(rule.amountMinor, rule.currency) : ''
  );
  const [frequency, setFrequency] = useState(rule?.frequency || 'monthly');
  const [walletId, setWalletId] = useState(rule?.walletId?._id || rule?.walletId || '');
  const [destinationWalletId, setDestinationWalletId] = useState(
    rule?.destinationWalletId?._id || rule?.destinationWalletId || ''
  );
  const [categoryId, setCategoryId] = useState(
    rule?.categoryId?._id || rule?.categoryId || ''
  );
  const [startDate, setStartDate] = useState(
    rule?.startDate ? new Date(rule.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(rule?.description || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountMinor = toMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Amount must be greater than zero.' }));
      return;
    }

    if (!walletId) {
      dispatch(showToast({ type: 'error', message: 'Please select a wallet.' }));
      return;
    }

    const payload = {
      title,
      type,
      amountMinor,
      frequency,
      walletId,
      destinationWalletId: type === 'transfer' ? destinationWalletId : null,
      categoryId: type !== 'transfer' ? categoryId : null,
      startDate,
      description
    };

    try {
      if (isEditing) {
        await updateRule({ id: rule._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Recurring rule updated.' }));
      } else {
        await createRule(payload).unwrap();
        dispatch(showToast({ type: 'success', message: 'Recurring rule scheduled.' }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to save recurring rule.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Rule Title"
        required
        placeholder="e.g. Monthly Rent, Netflix Subscription, Salary"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          label="Transaction Type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </Select>

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

        <Select
          label="Frequency"
          required
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Source Wallet"
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

        {type === 'transfer' ? (
          <Select
            label="Destination Wallet"
            required
            value={destinationWalletId}
            onChange={(e) => setDestinationWalletId(e.target.value)}
          >
            <option value="">Select Destination Wallet</option>
            {wallets
              .filter((w) => w._id !== walletId)
              .map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.type})
                </option>
              ))}
          </Select>
        ) : (
          <Select
            label="Category"
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
        )}
      </div>

      <Input
        label="Start Date"
        type="date"
        required
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <Input
        label="Description / Notes (Optional)"
        placeholder="e.g. Due on 5th of each month"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

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
          {isEditing ? 'Save Changes' : 'Schedule Recurring Rule'}
        </Button>
      </div>
    </form>
  );
}
