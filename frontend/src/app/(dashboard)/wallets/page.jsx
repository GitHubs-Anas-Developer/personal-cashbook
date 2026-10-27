'use client';
import React, { useState } from 'react';
import {
  useGetWalletsQuery,
  useArchiveWalletMutation,
  useUnarchiveWalletMutation,
  useReconcileWalletMutation
} from '../../../store/services/api.js';
import { useSelector, useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { formatMoney } from '../../../utils/formatters.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { WalletForm } from '../../../components/forms/WalletForm.jsx';
import {
  Wallet,
  Building2,
  Banknote,
  Smartphone,
  PiggyBank,
  CreditCard,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  ArchiveRestore,
  ShieldCheck
} from 'lucide-react';

const WALLET_ICONS = {
  bank: Building2,
  cash: Banknote,
  upi: Smartphone,
  savings: PiggyBank,
  credit_card: CreditCard,
  other: Wallet
};

export default function WalletsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const currency = user?.preferences?.currency || 'INR';

  const [includeArchived, setIncludeArchived] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  const { data, isLoading, refetch } = useGetWalletsQuery(includeArchived);
  const [archiveWallet, { isLoading: isArchiving }] = useArchiveWalletMutation();
  const [unarchiveWallet] = useUnarchiveWalletMutation();
  const [reconcileWallet, { isLoading: isReconciling }] = useReconcileWalletMutation();

  const wallets = data?.data || [];
  const activeWallets = wallets.filter((w) => !w.isArchived);
  const archivedWallets = wallets.filter((w) => w.isArchived);

  const totalBalanceMinor = activeWallets.reduce(
    (acc, w) => acc + (w.currentBalanceMinor || 0),
    0
  );

  const handleArchive = async (walletId) => {
    try {
      await archiveWallet(walletId).unwrap();
      dispatch(showToast({ type: 'success', message: 'Wallet archived.' }));
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to archive.' }));
    }
  };

  const handleUnarchive = async (walletId) => {
    try {
      await unarchiveWallet(walletId).unwrap();
      dispatch(showToast({ type: 'success', message: 'Wallet restored.' }));
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Failed to restore.' }));
    }
  };

  const handleReconcile = async (walletId) => {
    try {
      const res = await reconcileWallet(walletId).unwrap();
      dispatch(
        showToast({
          type: 'success',
          message: `Reconciled with ledger! Balance: ${formatMoney(res.data.currentBalanceMinor, currency)}`
        })
      );
      refetch();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Reconciliation failed.' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Wallet Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Physical cash, bank accounts, savings, and manual UPI tracker accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeArchived(!includeArchived)}
          >
            {includeArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditingWallet(null);
              setIsAddOpen(true);
            }}
          >
            Add New Wallet
          </Button>
        </div>
      </div>

      {/* Security & Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white border-0">
          <CardContent className="p-5">
            <span className="text-xs text-indigo-200 font-medium uppercase tracking-wider">
              Total Liquidity
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-1">
              {formatMoney(totalBalanceMinor, currency)}
            </div>
            <p className="text-xs text-indigo-200 mt-2">
              Across {activeWallets.length} active wallets
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Safe &amp; Sovereign Financial Privacy
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Personal Cashbook operates on manual ledger records. It never connects to banking APIs
                or UPI gateways, and never asks for banking credentials, OTPs, or UPI PINs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Wallets Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Active Accounts ({activeWallets.length})
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading wallets...</div>
        ) : activeWallets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No active wallets"
            description="Create a cash, bank or UPI tracking wallet to start logging financial transactions."
            actionLabel="Create Wallet"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWallets.map((wallet) => {
              const Icon = WALLET_ICONS[wallet.type] || Wallet;

              return (
                <Card
                  key={wallet._id}
                  className="hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: wallet.color || '#4F46E5' }}
                  />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: wallet.color || '#4F46E5' }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {wallet.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {wallet.type.replace('_', ' ')}
                            {wallet.accountNumberLast4 ? ` ••${wallet.accountNumberLast4}` : ''}
                          </span>
                        </div>
                      </div>

                      {wallet.isDefault && (
                        <Badge variant="indigo" size="sm">
                          Default
                        </Badge>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400">Current Balance</span>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                        {formatMoney(wallet.currentBalanceMinor, wallet.currency || currency)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Opening: {formatMoney(wallet.openingBalanceMinor, wallet.currency || currency)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => handleReconcile(wallet._id)}
                        disabled={isReconciling}
                        title="Reconcile with Ledger entries"
                        className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[11px]"
                      >
                        <RefreshCw className="w-3 h-3" /> Reconcile
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingWallet(wallet);
                            setIsAddOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!wallet.isDefault && (
                          <button
                            onClick={() => handleArchive(wallet._id)}
                            disabled={isArchiving}
                            title="Archive Wallet"
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-600"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Archived Wallets Section */}
      {includeArchived && archivedWallets.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            Archived Wallets ({archivedWallets.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {archivedWallets.map((wallet) => (
              <Card key={wallet._id} className="bg-slate-50 dark:bg-slate-900/40">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {wallet.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Balance: {formatMoney(wallet.currentBalanceMinor, wallet.currency || currency)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ArchiveRestore}
                    onClick={() => handleUnarchive(wallet._id)}
                  >
                    Restore
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Wallet Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingWallet(null);
        }}
        title={editingWallet ? 'Edit Wallet' : 'Create New Wallet'}
        description="Configure account details and opening balances"
      >
        <WalletForm
          wallet={editingWallet}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditingWallet(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddOpen(false);
            setEditingWallet(null);
          }}
        />
      </Modal>
    </div>
  );
}
