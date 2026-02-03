import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { handleApiError, createGenericError, ApiError } from '@/lib/errorHandler';

export const useErrorHandling = () => {
  /**
   * Handles API errors with appropriate user feedback
   */
  const handleError = useCallback((error: unknown): ApiError => {
    if (error instanceof AxiosError) {
      return handleApiError(error);
    }

    // For non-Axios errors
    const genericError = createGenericError(error);

    // Show toast based on error type
    switch (genericError.type) {
      case 'NETWORK_ERROR':
        toast.error('Network error. Please check your internet connection and try again.');
        break;
      case 'AUTHENTICATION_ERROR':
        toast.error('Authentication failed. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        break;
      case 'AUTHORIZATION_ERROR':
        toast.error('Access denied. You do not have permission to perform this action.');
        break;
      case 'SERVER_ERROR':
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(genericError.message || 'An unexpected error occurred. Please try again.');
    }

    return genericError;
  }, []);

  return {
    handleError
  };
};