'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResetPasswordMutation } from '../../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Lock } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      dispatch(showToast({ type: 'error', message: 'Passwords do not match.' }));
      return;
    }

    if (password.length < 8) {
      dispatch(showToast({ type: 'error', message: 'Password must be at least 8 characters.' }));
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      dispatch(showToast({ type: 'success', message: 'Password reset successful! Please sign in.' }));
      router.push('/login');
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Password reset failed.' }));
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent>
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Set New Password
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose a strong new password for your personal cashbook
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Reset Token"
            required
            placeholder="Paste reset token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          <Input
            label="New Password"
            type="password"
            required
            placeholder="At least 8 chars, 1 uppercase, 1 number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Update Password
          </Button>

          <div className="text-center text-xs pt-1">
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="text-center p-8 text-xs text-slate-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
