'use client';

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`flex min-h-[100px] w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className || ''}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea };
