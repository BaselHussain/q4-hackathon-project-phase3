'use client';

import React from 'react';
import { useTheme } from '@/lib/context/ThemeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * A wrapper component that ensures proper theme application to its children
 * This component can be used to wrap existing components to ensure they follow theme guidelines
 */
export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({
  children,
  className = '',
  as: Component = 'div',
}) => {
  const { theme } = useTheme();

  const themedClassName = `${className} ${theme}`;

  return <Component className={themedClassName}>{children}</Component>;
};

export default ThemeWrapper;