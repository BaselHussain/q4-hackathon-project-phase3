'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Task } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task | undefined;
  onSubmit: (data: TaskFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean | undefined;
}

export default function TaskForm({ task, onSubmit, onCancel, isSubmitting }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
    },
  });

  const handleFormSubmit = (data: TaskFormValues) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-zinc-300">
          Title <span className="text-red-400">*</span>
        </label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter task title"
          className={errors.title ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
          Description
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter task description (optional)"
          className={errors.description ? 'border-red-500/50 focus-visible:ring-red-500/50' : ''}
        />
        {errors.description && (
          <p className="text-xs text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800/40">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : task ? (
            'Update Task'
          ) : (
            'Create Task'
          )}
        </Button>
      </div>
    </form>
  );
}
