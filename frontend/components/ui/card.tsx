'use client';

import React from 'react';
import { CardProps } from '@/types';

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, title, subtitle, footer, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm text-zinc-100 shadow-lg shadow-black/10 ${className || ''}`}
        {...props}
      >
        {(title || subtitle) && (
          <div className="p-6 pb-0">
            {title && <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="p-6 pt-0">{children}</div>
        {footer && <div className="p-6 pt-0">{footer}</div>}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={`text-xl font-semibold tracking-tight text-white ${className || ''}`} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={`text-sm text-zinc-400 ${className || ''}`} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex items-center p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
