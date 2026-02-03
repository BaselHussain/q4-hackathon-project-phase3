'use client';

import React from 'react';
import { InputProps } from '@/types';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className={`space-y-1.5 ${className || ''}`}>
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <input
          ref={ref}
          className={`flex h-11 w-full rounded-lg border bg-zinc-900/80 px-4 py-2 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            hasError
              ? 'border-red-500/60 focus-visible:ring-red-500/50'
              : 'border-zinc-800 hover:border-zinc-600'
          }`}
          {...props}
        />
        {helperText && !hasError && (
          <p className="text-xs text-zinc-500">{helperText}</p>
        )}
        {error && <p className="text-xs font-medium text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
