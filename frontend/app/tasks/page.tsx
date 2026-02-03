'use client';

import TaskList from '@/components/TaskList';

export default function TasksDashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Tasks</h1>
        <p className="text-zinc-500 text-sm">
          Create, organize, and track your tasks.
        </p>
      </div>

      <TaskList />
    </div>
  );
}
