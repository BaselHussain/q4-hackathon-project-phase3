import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Check, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { Task } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleComplete }) => {
  const isCompleted = task.status === 'completed';

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      layout
    >
      <div className={`group relative rounded-xl border bg-zinc-900/50 p-5 transition-all duration-200 hover:bg-zinc-900/80 ${
        isCompleted
          ? 'border-emerald-800/30 hover:border-emerald-700/40'
          : 'border-zinc-800/60 hover:border-zinc-700/60'
      }`}>
        {/* Status indicator line */}
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${
          isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />

        <div className="pl-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base tracking-tight break-words ${
                isCompleted ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-white'
              }`}>
                {task.title}
              </h3>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isCompleted ? 'Done' : 'Pending'}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="flex items-start gap-2 mb-3">
              <FileText className="h-3.5 w-3.5 mt-0.5 text-zinc-600 shrink-0" />
              <p className="text-sm text-zinc-400 break-words leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-800/40">
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Clock className="h-3 w-3" />
              <span>{formatDate(task.createdAt)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => onEdit?.(task)} className="text-zinc-500 hover:text-white h-7 px-2">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete?.(task.id)} className="text-zinc-500 hover:text-red-400 h-7 px-2">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={isCompleted ? 'outline' : 'primary'}
                size="sm"
                onClick={() => onToggleComplete?.(task.id)}
                className="h-7 text-xs"
              >
                {isCompleted ? (
                  <><RotateCcw className="h-3 w-3" /> Reopen</>
                ) : (
                  <><Check className="h-3 w-3" /> Complete</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
