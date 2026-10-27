'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForgotPasswordMutation } from '../../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { KeyRound, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [tokenHint, setTokenHint] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      dispatch(showToast({ type: 'success', message: 'Reset link dispatched!' }));
      if (res.resetToken) {
        setTokenHint(res.resetToken);
      }
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Request failed.' }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          <CardContent>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recover Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your account email to receive a secure reset token
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
              >
                Send Reset Token
              </Button>

              {tokenHint && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs space-y-2">
                  <p className="text-indigo-800 dark:text-indigo-300 font-medium">
                    Test Token Generated:
                  </p>
                  <code className="block p-1.5 bg-white dark:bg-slate-900 rounded font-mono text-[11px] select-all break-all text-slate-800 dark:text-slate-200">
                    {tokenHint}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => router.push(`/reset-password?token=${tokenHint}`)}
                  >
                    Proceed to Reset Screen <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}

              <div className="text-center text-xs pt-1">
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
