import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-14 w-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <Inbox className="h-7 w-7 text-zinc-600" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 text-center max-w-xs mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
