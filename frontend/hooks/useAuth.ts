'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/components/AuthProvider';
import { isTokenExpired } from '@/lib/auth';

/**
 * Custom hook to access the authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Custom hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Custom hook to get current user
 */
export const useCurrentUser = () => {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
};

/**
 * Custom hook for authentication state
 */
export const useAuthState = () => {
  const { user, token, isLoading, isAuthenticated } = useAuth();
  return {
    user,
    token,
    isLoading,
    isAuthenticated,
  };
};

/**
 * Custom hook to check if token is expired
 */
export const useTokenExpiration = () => {
  const { token } = useAuth();
  return {
    isTokenExpired: token ? isTokenExpired(token) : true,
    token,
  };
};
