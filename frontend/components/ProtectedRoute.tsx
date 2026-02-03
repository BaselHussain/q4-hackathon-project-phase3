'use client';

import React, { useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useTokenExpiration } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, error, logout } = useAuth();
  const { isTokenExpired: tokenIsExpired } = useTokenExpiration();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && tokenIsExpired) {
      toast.error('Your session has expired. Please log in again.');
      logout();
      router.push('/login' as Route);
    }

    if (error) {
      toast.error(`Authentication error: ${error}`);
    }
  }, [isAuthenticated, tokenIsExpired, isLoading, error, logout, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated || tokenIsExpired) {
    if (typeof window !== 'undefined') {
      router.push(redirectTo as Route);
    }
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
