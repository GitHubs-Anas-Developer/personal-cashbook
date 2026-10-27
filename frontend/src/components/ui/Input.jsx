'use client';
import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    type = 'text',
    className = '',
    prefix,
    suffix,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs flex items-center">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`block w-full rounded-lg border text-sm transition-colors
            bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400
            ${prefix ? 'pl-9' : 'pl-3.5'}
            ${suffix ? 'pr-9' : 'pr-3.5'}
            py-2
            ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-rose-600'
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            }
            ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});
