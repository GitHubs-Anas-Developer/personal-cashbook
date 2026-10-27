'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor, toDecimal } from '../../utils/formatters.js';
import {
  useGetWalletsQuery,
  useCreateDebtMutation,
  useUpdateDebtMutation,
  useRecordDebtPaymentMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';

export function DebtForm({ defaultType = 'lent', debt = null, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEditing = !!debt;

  const { data: walletsData } = useGetWalletsQuery(false);
  const [createDebt, { isLoading: isCreating }] = useCreateDebtMutation();
  const [updateDebt, { isLoading: isUpdating }] = useUpdateDebtMutation();

  const wallets = walletsData?.data || [];

  const [type, setType] = useState(debt?.type || defaultType);
  const [personName, setPersonName] = useState(debt?.personName || '');
  const [personContact, setPersonContact] = useState(debt?.personContact || '');
  const [initialAmount, setInitialAmount] = useState(
    debt ? toDecimal(debt.initialAmountMinor, debt.currency) : ''
  );
  const [walletId, setWalletId] = useState(debt?.walletId?._id || debt?.walletId || '');
  const [dueDate, setDueDate] = useState(
    debt?.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : ''
  );
  const [interestRatePercent, setInterestRatePercent] = useState(
    debt?.interestRatePercent || 0
  );
  const [notes, setNotes] = useState(debt?.notes || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const initialAmountMinor = toMinor(initialAmount);
    if (!initialAmountMinor || initialAmountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Amount must be greater than zero.' }));
      return;
    }

    const payload = {
      type,
      personName,
      personContact,
      initialAmountMinor,
      walletId: walletId || null,
      dueDate: dueDate || null,
      interestRatePercent: parseFloat(interestRatePercent) || 0,
      notes
    };

    try {
      if (isEditing) {
        await updateDebt({ id: debt._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Debt record updated.' }));
      } else {
        await createDebt(payload).unwrap();
        dispatch(showToast({ type: 'success', message: `${type === 'lent' ? 'Lent' : 'Borrowed'} record created.` }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to save debt.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setType('lent')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              type === 'lent'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            I Lent Money (They owe me)
          </button>
          <button
            type="button"
            onClick={() => setType('borrowed')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              type === 'borrowed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            I Borrowed Money (I owe them)
          </button>
        </div>
      )}

      <Input
        label={type === 'lent' ? 'Debtor Name (Who borrowed from you)' : 'Creditor Name (Who you borrowed from)'}
        required
        placeholder="e.g. Ramesh Kumar, Bank Loan"
        value={personName}
        onChange={(e) => setPersonName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Principal Amount"
          type="number"
          step="0.01"
          required
          disabled={isEditing}
          placeholder="0.00"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
          prefix="₹"
        />

        <Input
          label="Expected Due Date (Optional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label={
            type === 'lent'
              ? 'Disbursed from Wallet (Optional)'
              : 'Deposited into Wallet (Optional)'
          }
          disabled={isEditing}
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
        >
          <option value="">None (External / Untracked)</option>
          {wallets.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name} ({w.type})
            </option>
          ))}
        </Select>

        <Input
          label="Contact Info / Phone (Optional)"
          placeholder="e.g. +91 9876543210"
          value={personContact}
          onChange={(e) => setPersonContact(e.target.value)}
        />
      </div>

      <Input
        label="Notes"
        placeholder="e.g. For house renovation loan"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
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
          {isEditing ? 'Save Changes' : 'Record Debt'}
        </Button>
      </div>
    </form>
  );
}

export function RepaymentModalContent({ debt, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const { data: walletsData } = useGetWalletsQuery(false);
  const [recordPayment, { isLoading }] = useRecordDebtPaymentMutation();

  const wallets = walletsData?.data || [];
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?._id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const isLent = debt.type === 'lent';

  const handleRepayment = async (e) => {
    e.preventDefault();
    const amountMinor = toMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Payment must be greater than zero.' }));
      return;
    }

    if (amountMinor > debt.remainingAmountMinor) {
      dispatch(
        showToast({
          type: 'error',
          message: `Payment cannot exceed remaining debt of ₹${(debt.remainingAmountMinor / 100).toFixed(2)}`
        })
      );
      return;
    }

    try {
      await recordPayment({
        debtId: debt._id,
        amountMinor,
        walletId,
        date,
        notes
      }).unwrap();

      dispatch(showToast({ type: 'success', message: 'Repayment recorded and reconciled.' }));
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Repayment failed.' }));
    }
  };

  return (
    <form onSubmit={handleRepayment} className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Party:</span>
          <span className="font-semibold">{debt.personName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Remaining Balance:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            ₹{(debt.remainingAmountMinor / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Repayment Amount"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix="₹"
        />

        <Input
          label="Payment Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Select
        label={isLent ? 'Deposit Funds Into Wallet' : 'Pay Funds From Wallet'}
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

      <Input
        label="Payment Reference / Notes"
        placeholder="e.g. Installment 1 / GPay ref"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          Record Repayment
        </Button>
      </div>
    </form>
  );
}
