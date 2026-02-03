'use client';

import React from 'react';
import { ButtonProps } from '@/types';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading, icon, className, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:opacity-40 disabled:pointer-events-none select-none';

    const variants: Record<string, string> = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30',
      secondary:
        'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:bg-zinc-800 border border-zinc-700',
      outline:
        'border border-zinc-700 text-zinc-300 hover:bg-zinc-800/60 hover:text-white active:bg-zinc-800',
      ghost:
        'text-zinc-400 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-800/80',
      link:
        'text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };

    const spinner = isLoading ? (
      <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ) : null;

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${isLoading ? 'pointer-events-none' : ''} ${className || ''}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {icon && !isLoading && <span>{icon}</span>}
        {spinner}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
