'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

interface ErrorContextType {
  errors: Array<{
    id: string;
    message: string;
    title?: string;
    variant?: 'default' | 'destructive';
  }>;
  addError: (message: string, title?: string, variant?: 'default' | 'destructive') => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [errors, setErrors] = useState<Array<{
    id: string;
    message: string;
    title?: string;
    variant?: 'default' | 'destructive';
  }>>([]);

  const addError = useCallback((message: string, title?: string, variant: 'default' | 'destructive' = 'destructive') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newError: { id: string; message: string; title?: string; variant?: 'default' | 'destructive' } = { id, message, variant };
    if (title !== undefined) {
      newError.title = title;
    }
    setErrors(prev => [...prev, newError]);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
        {errors.map(({ id, message, title, variant }) => (
          <Alert key={id} variant={variant ?? 'destructive'}>
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{message}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 p-1 h-auto"
              onClick={() => removeError(id)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </Alert>
        ))}
      </div>
    </ErrorContext.Provider>
  );
};

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};