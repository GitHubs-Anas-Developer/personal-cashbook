'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useVerifyEmailMutation } from '../../../store/services/api.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/slices/uiSlice.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { CheckCircle2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const dispatch = useDispatch();
  const [token, setToken] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await verifyEmail({ token }).unwrap();
      setIsVerified(true);
      dispatch(showToast({ type: 'success', message: 'Email verified successfully!' }));
    } catch (err) {
      dispatch(showToast({ type: 'error', message: err?.data?.message || 'Verification failed.' }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg text-center p-4">
          <CardContent>
            {isVerified ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Email Verified!
                </h3>
                <p className="text-xs text-slate-500">
                  Your email has been confirmed. You can now access all personal cashbook features.
                </p>
                <div className="pt-3">
                  <Link href="/login">
                    <Button variant="primary" size="md" className="w-full">
                      Proceed to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Email Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Paste the verification code or token received during account setup.
                </p>
                <Input
                  label="Verification Token"
                  required
                  placeholder="Paste token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Verify Email
                </Button>
                <div className="pt-2 text-xs">
                  <Link href="/login" className="text-indigo-600 hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
