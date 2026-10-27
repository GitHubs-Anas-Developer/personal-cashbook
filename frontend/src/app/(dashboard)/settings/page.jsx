'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, logout } from '../../../store/slices/authSlice.js';
import { setTheme, showToast } from '../../../store/slices/uiSlice.js';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useDeleteAccountMutation
} from '../../../store/services/api.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import {
  User,
  Shield,
  Palette,
  KeyRound,
  Download,
  Trash2,
  Laptop,
  Smartphone,
  Globe
} from 'lucide-react';

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SGD', label: 'SGD (S$) - Singapore Dollar' },
  { value: 'CAD', label: 'CAD (C$) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD (A$) - Australian Dollar' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' }
];

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const theme = useSelector((state) => state.ui.theme);

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'INR');
  const [timezone, setTimezone] = useState(user?.preferences?.timezone || 'Asia/Kolkata');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();
  const { data: sessionsData, refetch: refetchSessions } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();

  const sessions = sessionsData?.data || [];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        name,
        preferences: {
          currency,
          timezone
        }
      }).unwrap();

      dispatch(updateUser(res.data));
      dispatch(showToast({ type: 'success', message: 'Profile preferences updated.' }));
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Update failed.' }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      dispatch(showToast({ type: 'error', message: 'New passwords do not match.' }));
      return;
    }
    if (newPassword.length < 8) {
      dispatch(showToast({ type: 'error', message: 'Password must be at least 8 characters.' }));
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      dispatch(showToast({ type: 'success', message: 'Password updated successfully!' }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Password update failed.' }));
    }
  };

  const handleExportData = async () => {
    try {
      dispatch(showToast({ type: 'info', message: 'Generating full data export bundle...' }));
      const response = await fetch('http://localhost:5000/api/users/export-all-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-cashbook-full-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      dispatch(showToast({ type: 'success', message: 'Full data export downloaded!' }));
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err.message || 'Export failed.' }));
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId).unwrap();
      dispatch(showToast({ type: 'success', message: 'Session terminated.' }));
      refetchSessions();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Failed to revoke session.' }));
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmPhrase !== 'DELETE MY ACCOUNT') {
      dispatch(showToast({ type: 'error', message: 'Please type "DELETE MY ACCOUNT" exactly.' }));
      return;
    }

    try {
      await deleteAccount({
        password: deletePassword,
        confirmationPhrase: 'DELETE MY ACCOUNT'
      }).unwrap();

      dispatch(logout());
      dispatch(showToast({ type: 'info', message: 'Your account has been permanently deleted.' }));
      router.push('/register');
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Deletion failed.' }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Account &amp; Ledger Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your personal profile, security, appearance, active sessions, and data portability
        </p>
      </div>

      {/* Profile & Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> Personal Profile &amp; Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email Address"
                disabled
                value={user?.email || ''}
                helperText="Account emails cannot be changed directly"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Primary Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                helperText="Default currency formatting for new wallets & reports"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                helperText="Standard IANA Timezone (e.g. Asia/Kolkata, UTC)"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md" isLoading={isUpdatingProfile}>
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" /> Visual Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', desc: 'Crisp white & indigo' },
              { id: 'dark', label: 'Dark', desc: 'Low-contrast slate dark' },
              { id: 'system', label: 'System', desc: 'Syncs with device OS' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => dispatch(setTheme(t.id))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  theme === t.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" /> Security &amp; Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Active Logged-In Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((sess) => {
              const isCurrent = sess.token === token;
              const Icon = sess.deviceType === 'mobile' ? Smartphone : Laptop;

              return (
                <div key={sess._id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {sess.userAgent?.substring(0, 45) || 'Web Browser'}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">
                            Current Session
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        IP: {sess.ipAddress} • Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(sess._id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Export & Account Deletion */}
      <Card className="border-rose-200 dark:border-rose-900/50">
        <CardHeader>
          <CardTitle className="text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Data Portability &amp; Account Deletion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Export All Personal Data
              </p>
              <p className="text-[11px] text-slate-500">
                Download a complete, machine-readable JSON archive of all transactions, wallets, debts,
                and budgets.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportData}
            >
              Export JSON
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/40">
            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Permanently Delete Cashbook Account
              </p>
              <p className="text-[11px] text-slate-500">
                Permanently deletes your account and cascades across all financial ledger records.
                This action is irreversible.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        description="Permanently delete your account and all associated financial records"
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            Warning: This will permanently delete your account, wallets, transactions, debts,
            budgets, and audit records.
          </p>

          <Input
            label="Your Account Password"
            type="password"
            required
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />

          <Input
            label="Type 'DELETE MY ACCOUNT' to confirm"
            required
            value={deleteConfirmPhrase}
            onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isDeletingAccount}
              onClick={handleDeleteAccount}
            >
              Permanently Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
