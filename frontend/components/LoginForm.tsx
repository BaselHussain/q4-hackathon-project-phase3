'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setApiError(null);

    try {
      await login({
        email: data.email,
        password: data.password,
      });

      toast.success('Signed in successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Mail className="h-4 w-4 text-zinc-500" />
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          className={`flex h-11 w-full rounded-lg border bg-zinc-900/80 px-4 py-2 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.email
              ? 'border-red-500/60 focus-visible:ring-red-500/50'
              : 'border-zinc-800 hover:border-zinc-600'
          }`}
          {...register('email')}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Lock className="h-4 w-4 text-zinc-500" />
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className={`flex h-11 w-full rounded-lg border bg-zinc-900/80 px-4 py-2 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.password
              ? 'border-red-500/60 focus-visible:ring-red-500/50'
              : 'border-zinc-800 hover:border-zinc-600'
          }`}
          {...register('password')}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={!isValid || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}
