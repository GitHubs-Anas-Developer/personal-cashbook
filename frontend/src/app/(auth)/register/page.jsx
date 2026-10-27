'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/slices/authSlice.js';
import { showToast } from '../../../store/slices/uiSlice.js';
import { useRegisterMutation } from '../../../store/services/api.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { BookOpen } from 'lucide-react';

const CURRENCY_OPTIONS = [
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

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('INR');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      dispatch(showToast({ type: 'error', message: 'Password must be at least 8 characters.' }));
      return;
    }

    try {
      const res = await register({
        name,
        email,
        password,
        currency
      }).unwrap();

      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      dispatch(
        showToast({
          type: 'success',
          message: 'Account created! Default wallets and categories have been provisioned.'
        })
      );
      router.push('/dashboard');
    } catch (err) {
      dispatch(
        showToast({
          type: 'error',
          message: err?.data?.message || err?.data?.errors?.[0]?.message || 'Registration failed.'
        })
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-md mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Create Cashbook
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Set up your private personal financial book in seconds
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="e.g. Ramesh Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="At least 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Must contain 1 uppercase letter and 1 number"
              />

              <Select
                label="Primary Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Create My Cashbook
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
