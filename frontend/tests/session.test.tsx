import { renderHook, act } from '@testing-library/react';
import { useTokenExpiration, useTokenRefresh } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/AuthProvider';
import { isTokenExpired } from '@/lib/auth';

// Mock the auth utilities
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  isTokenExpired: jest.fn(),
  refreshToken: jest.fn(),
}));

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Session Management Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTokenExpiration', () => {
    it('should return correct expiration status', () => {
      const token = 'valid-token';
      (isTokenExpired as jest.Mock).mockReturnValue(false);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>
          {children}
        </AuthProvider>
      );

      const { result } = renderHook(() => useTokenExpiration(), { wrapper });

      expect(result.current.isTokenExpired).toBe(false);
      expect(result.current.token).toBeDefined();
    });

    it('should return true for expired token', () => {
      (isTokenExpired as jest.Mock).mockReturnValue(true);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>
          {children}
        </AuthProvider>
      );

      const { result } = renderHook(() => useTokenExpiration(), { wrapper });

      expect(result.current.isTokenExpired).toBe(true);
    });
  });

  describe('useTokenRefresh', () => {
    it('should attempt to refresh token when expired', async () => {
      const mockRefreshToken = require('@/lib/auth').refreshToken as jest.Mock;
      mockRefreshToken.mockResolvedValue('new-valid-token');

      (isTokenExpired as jest.Mock).mockReturnValue(true);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>
          {children}
        </AuthProvider>
      );

      const { result } = renderHook(() => useTokenRefresh(), { wrapper });

      let refreshResult: boolean | null = null;
      await act(async () => {
        refreshResult = await result.current.checkAndRefreshToken();
      });

      expect(mockRefreshToken).toHaveBeenCalled();
      expect(refreshResult).toBe(true);
    });

    it('should return false when refresh fails', async () => {
      const mockRefreshToken = require('@/lib/auth').refreshToken as jest.Mock;
      mockRefreshToken.mockResolvedValue(null);

      (isTokenExpired as jest.Mock).mockReturnValue(true);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>
          {children}
        </AuthProvider>
      );

      const { result } = renderHook(() => useTokenRefresh(), { wrapper });

      let refreshResult: boolean | null = null;
      await act(async () => {
        refreshResult = await result.current.checkAndRefreshToken();
      });

      expect(refreshResult).toBe(false);
    });

    it('should return true when token is not expired', async () => {
      (isTokenExpired as jest.Mock).mockReturnValue(false);

      const mockRefreshToken = require('@/lib/auth').refreshToken as jest.Mock;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>
          {children}
        </AuthProvider>
      );

      const { result } = renderHook(() => useTokenRefresh(), { wrapper });

      let refreshResult: boolean | null = null;
      await act(async () => {
        refreshResult = await result.current.checkAndRefreshToken();
      });

      expect(mockRefreshToken).not.toHaveBeenCalled();
      expect(refreshResult).toBe(true);
    });
  });
});