'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '@/types';
import {
  setToken,
  setUserEmail,
  getToken,
  removeToken,
  isAuthenticated as checkIsAuthenticated,
  getUserId,
  getUserEmail,
  isTokenExpired
} from '@/lib/auth';

// Define auth context type
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component props
interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setLocalToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = getToken();
        if (storedToken && checkIsAuthenticated()) {
          const userId = getUserId();
          const email = getUserEmail();
          if (userId) {
            setUser({
              id: userId,
              email: email || '',
            });
            setLocalToken(storedToken);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function — backend returns { access_token, token_type, user_id, email }
  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Backend returns RFC 7807: { detail: "..." }
        const errorMessage = errorData.detail || errorData.message || 'Login failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();

      // Store token and email
      setToken(data.access_token);
      setUserEmail(data.email);
      setLocalToken(data.access_token);

      // Set user from response
      setUser({
        id: String(data.user_id),
        email: data.email,
      });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function — backend returns { user_id, email, message } (NO token)
  // So we register, then auto-login
  const register = async (userData: { email: string; password: string }): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // Step 1: Register
      const regResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      });

      if (!regResponse.ok) {
        const errorData = await regResponse.json();
        const errorMessage = errorData.detail || errorData.message || 'Registration failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Registration succeeded — now auto-login to get token
      await login({ email: userData.email, password: userData.password });
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function — no backend endpoint, just clear client state
  const logout = () => {
    removeToken();
    setLocalToken(null);
    setUser(null);
    setError(null);
  };

  // Update user function
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !isLoading && !isTokenExpired(token),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
