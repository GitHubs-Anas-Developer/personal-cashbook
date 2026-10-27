'use client';
import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    id,
    children,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`block w-full appearance-none rounded-lg border text-sm transition-colors
            bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-3.5 pr-10 py-2
            ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-600'
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            }
            ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});
