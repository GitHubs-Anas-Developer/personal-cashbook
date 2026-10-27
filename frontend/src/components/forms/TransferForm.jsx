'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { toMinor } from '../../utils/formatters.js';
import {
  useGetWalletsQuery,
  useCreateTransactionMutation
} from '../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice.js';
import { ArrowRightLeft } from 'lucide-react';

export function TransferForm({ onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const { data: walletsData } = useGetWalletsQuery(false);
  const [createTransaction, { isLoading }] = useCreateTransactionMutation();

  const wallets = walletsData?.data || [];

  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?._id || '');
  const [destinationWalletId, setDestinationWalletId] = useState(
    wallets[1]?._id || wallets[0]?._id || ''
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Transfer between wallets');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sourceWalletId || !destinationWalletId) {
      dispatch(showToast({ type: 'error', message: 'Please select both source and destination wallets.' }));
      return;
    }

    if (sourceWalletId === destinationWalletId) {
      dispatch(showToast({ type: 'error', message: 'Source and destination wallets must be different.' }));
      return;
    }

    const amountMinor = toMinor(amount);
    if (!amountMinor || amountMinor <= 0) {
      dispatch(showToast({ type: 'error', message: 'Please enter a valid positive transfer amount.' }));
      return;
    }

    try {
      await createTransaction({
        type: 'transfer',
        amountMinor,
        walletId: sourceWalletId,
        destinationWalletId,
        date,
        description,
        notes
      }).unwrap();

      dispatch(showToast({ type: 'success', message: 'Funds transferred successfully.' }));
      onSuccess?.();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Transfer failed.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg flex items-center gap-3 text-xs text-indigo-700 dark:text-indigo-300">
        <ArrowRightLeft className="w-5 h-5 shrink-0" />
        <p>
          Transfers move money between your own wallets. They are strictly excluded from income and
          expense spending totals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="From (Source Wallet)"
          required
          value={sourceWalletId}
          onChange={(e) => setSourceWalletId(e.target.value)}
        >
          <option value="">Select Source</option>
          {wallets.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name} ({w.type})
            </option>
          ))}
        </Select>

        <Select
          label="To (Destination Wallet)"
          required
          value={destinationWalletId}
          onChange={(e) => setDestinationWalletId(e.target.value)}
        >
          <option value="">Select Destination</option>
          {wallets
            .filter((w) => w._id !== sourceWalletId)
            .map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.type})
              </option>
            ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Transfer Amount"
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix="₹"
        />
        <Input
          label="Transfer Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Input
        label="Description"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="Notes (Optional)"
        placeholder="e.g. Reference transaction / ATM withdrawal"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          Execute Transfer
        </Button>
      </div>
    </form>
  );
}
