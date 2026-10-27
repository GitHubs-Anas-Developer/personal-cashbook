'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor, toDecimal } from '../../utils/formatters.js';
import {
  useGetWalletsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useContributeGoalMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';

export function SavingsGoalForm({ goal = null, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEditing = !!goal;

  const { data: walletsData } = useGetWalletsQuery(false);
  const [createGoal, { isLoading: isCreating }] = useCreateGoalMutation();
  const [updateGoal, { isLoading: isUpdating }] = useUpdateGoalMutation();

  const wallets = walletsData?.data || [];

  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    goal ? toDecimal(goal.targetAmountMinor, goal.currency) : ''
  );
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
  );
  const [walletId, setWalletId] = useState(goal?.walletId?._id || goal?.walletId || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const targetAmountMinor = toMinor(targetAmount);
    if (!targetAmountMinor || targetAmountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Target amount must be greater than zero.' }));
      return;
    }

    const payload = {
      name,
      targetAmountMinor,
      targetDate: targetDate || null,
      walletId: walletId || null
    };

    try {
      if (isEditing) {
        await updateGoal({ id: goal._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Savings goal updated.' }));
      } else {
        await createGoal(payload).unwrap();
        dispatch(showToast({ type: 'success', message: 'Savings goal created.' }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to save goal.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Goal Title"
        required
        placeholder="e.g. Emergency Reserve, Goa Vacation, New MacBook"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Target Amount"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          prefix="₹"
        />

        <Input
          label="Target Date (Optional)"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <Select
        label="Linked Savings Wallet (Optional)"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
        helperText="Direct deposits will automatically transfer funds to this wallet"
      >
        <option value="">None (Virtual Tracker)</option>
        {wallets.map((w) => (
          <option key={w._id} value={w._id}>
            {w.name} ({w.type})
          </option>
        ))}
      </Select>

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
          {isEditing ? 'Save Changes' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}

export function ContributeGoalModalContent({ goal, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const { data: walletsData } = useGetWalletsQuery(false);
  const [contributeGoal, { isLoading }] = useContributeGoalMutation();

  const wallets = walletsData?.data || [];
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?._id || '');

  const handleContribute = async (e) => {
    e.preventDefault();
    const amountMinor = toMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Please enter a valid contribution amount.' }));
      return;
    }

    try {
      await contributeGoal({
        id: goal._id,
        amountMinor,
        walletId: walletId || undefined
      }).unwrap();

      dispatch(showToast({ type: 'success', message: 'Contribution added to goal!' }));
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Contribution failed.' }));
    }
  };

  return (
    <form onSubmit={handleContribute} className="space-y-4">
      <p className="text-xs text-slate-500">
        Deposit funds toward <strong>{goal.name}</strong>. Savings transfers do not count as
        spending.
      </p>

      <Input
        label="Deposit Amount"
        type="number"
        step="0.01"
        required
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        prefix="₹"
      />

      <Select
        label="Source Wallet (Transfer from)"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
      >
        <option value="">None (Virtual Allocation)</option>
        {wallets.map((w) => (
          <option key={w._id} value={w._id}>
            {w.name} ({w.type})
          </option>
        ))}
      </Select>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          Confirm Deposit
        </Button>
      </div>
    </form>
  );
}
