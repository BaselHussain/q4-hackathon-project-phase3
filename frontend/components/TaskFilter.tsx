import React from 'react';

interface TaskFilterProps {
  filter: 'all' | 'pending' | 'completed';
  onFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
}

const filters = [
  { value: 'all' as const, label: 'All' },
  { value: 'pending' as const, label: 'Pending' },
  { value: 'completed' as const, label: 'Completed' },
];

const TaskFilter: React.FC<TaskFilterProps> = ({ filter, onFilterChange }) => {
  return (
    <div className="inline-flex items-center rounded-lg bg-zinc-900/60 border border-zinc-800/60 p-1 gap-1">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            filter === f.value
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default TaskFilter;
