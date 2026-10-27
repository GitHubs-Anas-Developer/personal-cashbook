'use client';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearToast } from '../../store/slices/uiSlice.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.ui.toast);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(clearToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/90',
    error: 'border-rose-200 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/90',
    info: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/90'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs text-slate-800 dark:text-slate-100 ${
          borders[toast.type] || borders.info
        }`}
      >
        <div className="shrink-0 pt-0.5">{icons[toast.type] || icons.info}</div>
        <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>
        <button
          onClick={() => dispatch(clearToast())}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
