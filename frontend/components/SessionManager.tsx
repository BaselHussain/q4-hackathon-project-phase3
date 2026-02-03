'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { isTokenExpired } from '@/lib/auth';
import { toast } from 'sonner';

/**
 * SessionManager component
 * Monitors token expiry and auto-logouts when the session expires.
 * Backend does not support token refresh, so we just watch for expiry.
 */
const SessionManager = () => {
  const { token, logout } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (token) {
      // Check token expiry every 60 seconds
      intervalRef.current = setInterval(() => {
        if (isTokenExpired(token)) {
          toast.error('Session expired. Please log in again.');
          logout();
        }
      }, 60_000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, logout]);

  // This component doesn't render anything
  return null;
};

export default SessionManager;
