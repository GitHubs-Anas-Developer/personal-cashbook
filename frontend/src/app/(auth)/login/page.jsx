'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice.js';
import { showToast } from '../../../store/slices/uiSlice.js';
import { useLoginMutation } from '../../../store/services/api.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { BookOpen, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      dispatch(showToast({ type: 'success', message: `Welcome back, ${res.data.user.name}!` }));
      router.push('/dashboard');
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Login failed. Please check credentials.' }));
    }
  };

  const handleFillDemo = () => {
    setEmail('arjun@example.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-md mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Personal Cashbook
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Sign in to your private personal ledger
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Sign In
              </Button>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillDemo}
                  className="w-full text-xs"
                >
                  Quick Fill Demo Account (Arjun)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Create free account
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Strictly private. Zero data sharing.</span>
        </div>
      </div>
    </div>
  );
}
