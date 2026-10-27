'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor, toDecimal } from '../../utils/formatters.js';
import {
  useCreateWalletMutation,
  useUpdateWalletMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';
import { ShieldAlert } from 'lucide-react';

const WALLET_TYPES = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'cash', label: 'Cash in Hand' },
  { value: 'upi', label: 'UPI / Digital Wallet' },
  { value: 'savings', label: 'Savings Deposit' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other Account' }
];

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#8B5CF6', // Purple
  '#64748B'  // Slate
];

export function WalletForm({ wallet = null, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const isEditing = !!wallet;

  const [createWallet, { isLoading: isCreating }] = useCreateWalletMutation();
  const [updateWallet, { isLoading: isUpdating }] = useUpdateWalletMutation();

  const [name, setName] = useState(wallet?.name || '');
  const [type, setType] = useState(wallet?.type || 'bank');
  const [currency, setCurrency] = useState(wallet?.currency || 'INR');
  const [openingBalance, setOpeningBalance] = useState(
    wallet ? toDecimal(wallet.openingBalanceMinor, wallet.currency) : '0.00'
  );
  const [color, setColor] = useState(wallet?.color || '#4F46E5');
  const [upiId, setUpiId] = useState(wallet?.upiId || '');
  const [accountNumberLast4, setAccountNumberLast4] = useState(
    wallet?.accountNumberLast4 || ''
  );
  const [isDefault, setIsDefault] = useState(wallet?.isDefault || false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const openingBalanceMinor = toMinor(openingBalance, currency);

    const payload = {
      name,
      type,
      currency,
      openingBalanceMinor,
      color,
      upiId,
      accountNumberLast4,
      isDefault
    };

    try {
      if (isEditing) {
        await updateWallet({ id: wallet._id, ...payload }).unwrap();
        dispatch(showToast({ type: 'success', message: 'Wallet updated successfully.' }));
      } else {
        await createWallet(payload).unwrap();
        dispatch(showToast({ type: 'success', message: 'Wallet created successfully.' }));
      }
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to save wallet.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'upi' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p>
            <strong>Security Notice:</strong> Personal Cashbook is for manual ledger tracking only.
            Never enter your UPI PIN, ATM PIN, or banking passwords anywhere on this application.
          </p>
        </div>
      )}

      <Input
        label="Wallet / Account Name"
        required
        placeholder="e.g. HDFC Salary, Cash in Pocket"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Wallet Type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {WALLET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        <Input
          label="Opening Balance"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          prefix="₹"
        />
      </div>

      {type === 'upi' && (
        <Input
          label="UPI ID / VPA Handle (Optional, Reference Only)"
          placeholder="e.g. yourname@okhdfcbank"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
      )}

      {type === 'bank' && (
        <Input
          label="Account Number (Last 4 digits only)"
          placeholder="e.g. 4092"
          maxLength={4}
          value={accountNumberLast4}
          onChange={(e) => setAccountNumberLast4(e.target.value)}
        />
      )}

      {/* Color Selection */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Wallet Theme Color
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform ${
                color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Default wallet toggle */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
        />
        <label htmlFor="isDefault" className="text-xs text-slate-700 dark:text-slate-300">
          Set as primary default wallet for new transactions
        </label>
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
          {isEditing ? 'Save Changes' : 'Create Wallet'}
        </Button>
      </div>
    </form>
  );
}
