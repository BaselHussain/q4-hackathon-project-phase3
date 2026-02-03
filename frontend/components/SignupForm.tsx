'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setApiError(null);

    try {
      await registerUser({
        email: data.email,
        password: data.password,
      });

      toast.success('Account created successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
          {...registerForm('email')}
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
          {...registerForm('password')}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <ShieldCheck className="h-4 w-4 text-zinc-500" />
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          className={`flex h-11 w-full rounded-lg border bg-zinc-900/80 px-4 py-2 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.confirmPassword
              ? 'border-red-500/60 focus-visible:ring-red-500/50'
              : 'border-zinc-800 hover:border-zinc-600'
          }`}
          {...registerForm('confirmPassword')}
          disabled={loading}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={!isValid || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  );
}
