'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/navbar';
import { ArrowRight, ListTodo, User, Shield } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-950/15 via-zinc-950 to-zinc-950" />

        <div className="container mx-auto px-4 sm:px-6 py-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">
                Here&apos;s an overview of your account.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-600/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400">Account</span>
                </div>
                <p className="text-white font-mono text-sm truncate">{user?.email}</p>
              </div>

              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400">Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-emerald-400 text-sm font-medium">Active</p>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-600/10 flex items-center justify-center">
                    <ListTodo className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400">Tasks</span>
                </div>
                <Link href="/tasks" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors group">
                  Manage tasks
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Quick action */}
            <div className="rounded-xl border border-zinc-800/60 bg-gradient-to-br from-indigo-950/30 to-zinc-900/40 p-8 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Ready to be productive?</h2>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Create, organize, and track your tasks in one place.
              </p>
              <Link href="/tasks">
                <Button size="lg">
                  <ListTodo className="h-4 w-4" />
                  Go to Tasks
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
