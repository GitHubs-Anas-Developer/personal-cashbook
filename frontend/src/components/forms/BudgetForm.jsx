'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor, toDecimal } from '../../utils/formatters.js';
import {
  useGetCategoriesQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';

export function BudgetForm({ budget = null, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEditing = !!budget;

  const { data: categoriesData } = useGetCategoriesQuery('expense');
  const [createBudget, { isLoading: isCreating }] = useCreateBudgetMutation();
  const [updateBudget, { isLoading: isUpdating }] = useUpdateBudgetMutation();

  const categories = categoriesData?.data || [];

  const [name, setName] = useState(budget?.name || '');
  const [period, setPeriod] = useState(budget?.period || 'monthly');
  const [categoryId, setCategoryId] = useState(
    budget?.categoryId?._id || budget?.categoryId || ''
  );
  const [amount, setAmount] = useState(
    budget ? toDecimal(budget.amountMinor, budget.currency) : ''
  );
  const [alertThresholdPercent, setAlertThresholdPercent] = useState(
    budget?.alertThresholdPercent || 80
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountMinor = toMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Please enter a valid budget limit.' }));
      return;
    }

    const payload = {
      name: name || (categoryId ? `${categories.find((c) => c._id === categoryId)?.name} Budget` : 'Total Monthly Budget'),
      period,
      categoryId: categoryId || null,
      amountMinor,
      alertThresholdPercent: parseInt(alertThresholdPercent, 10)
    };

    try {
      if (isEditing) {
        await updateBudget({ id: budget._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Budget updated.' }));
      } else {
        await createBudget(payload).unwrap();
        dispatch(showToast({ type: 'success', message: 'Budget created.' }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to save budget.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Budget Name"
        required
        placeholder="e.g. Monthly Grocery Limit, Total Discretionary Spend"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Budget Period"
          required
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </Select>

        <Select
          label="Category (Leave empty for Overall Budget)"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All Categories (Overall Spend)</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Budget Limit Amount"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix="₹"
        />

        <Input
          label="Alert Threshold (%)"
          type="number"
          min="10"
          max="100"
          required
          value={alertThresholdPercent}
          onChange={(e) => setAlertThresholdPercent(e.target.value)}
          helperText="Receive warning alert when spend reaches this percentage"
        />
      </div>

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
          {isEditing ? 'Save Changes' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}
