'use client';

import React from 'react';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { AuthProvider } from '@/components/AuthProvider';
import SessionManager from '@/components/SessionManager';
import { ErrorProvider } from '@/components/ErrorProvider';

interface AppProviderProps {
  children: React.ReactNode;
}

// Combined provider that wraps both theme, auth, and error providers
const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ErrorProvider>
      <ThemeProvider>
        <AuthProvider>
          <SessionManager />
          {children}
        </AuthProvider>
      </ThemeProvider>
    </ErrorProvider>
  );
};

export default AppProvider;