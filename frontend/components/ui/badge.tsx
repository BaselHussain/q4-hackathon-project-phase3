'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
      secondary: 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700/50',
      destructive: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
      outline: 'border border-zinc-700 text-zinc-300',
      success: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    };

    const classes = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${variantClasses[variant]} ${
      className || ''
    }`;

    return (
      <span
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
