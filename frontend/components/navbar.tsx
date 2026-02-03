'use client';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LayoutDashboard, ListTodo, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
              Taskflow
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  href="/tasks"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
                >
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                </Link>

                <div className="mx-2 h-6 w-px bg-zinc-800" />

                <span className="hidden md:inline text-xs text-zinc-500 font-mono truncate max-w-[160px]">
                  {user?.email}
                </span>
                <Button onClick={() => logout()} variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
